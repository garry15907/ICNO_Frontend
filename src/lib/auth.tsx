import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthResult = { error: string | null };

type ProfileUpdate = { display_name?: string; username?: string | null; bio?: string | null };

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  displayName: string | null;
  avatarUrl: string | null;
  username: string | null;
  bio: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: ProfileUpdate) => Promise<AuthResult>;
  signUp: (email: string, password: string, displayName: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<AuthContextValue | null>(null);

function translateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (m.includes("already registered") || m.includes("already been registered") || m.includes("user already"))
    return "이미 가입된 이메일입니다.";
  if (m.includes("password should be at least")) return "비밀번호는 6자 이상이어야 합니다.";
  if (m.includes("email not confirmed")) return "이메일 확인이 필요합니다. 메일함을 확인해주세요.";
  if (m.includes("unable to validate email") || m.includes("invalid email")) return "이메일 형식이 올바르지 않습니다.";
  if (m.includes("rate limit")) return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
  return message;
}

function translateProfileError(message: string, code?: string): string {
  if (code === "23505" || message.toLowerCase().includes("duplicate key")) return "이미 사용 중인 닉네임입니다.";
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);

  const loadProfile = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, username, bio")
      .eq("id", uid)
      .maybeSingle();
    if (error) {
      console.error("[auth] profile load failed", error);
      return;
    }
    setDisplayName(data?.display_name ?? null);
    setAvatarUrl(data?.avatar_url ?? null);
    setUsername(data?.username ?? null);
    setBio(data?.bio ?? null);
  }, []);

  useEffect(() => {
    // 1) 세션 변화 구독 (먼저 등록)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setUser(next?.user ?? null);
      setLoading(false);
    });

    // 2) 초기 세션 로드
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // 로그인 후 profiles에서 표시이름 로드
  useEffect(() => {
    const uid = user?.id;
    if (!uid) {
      setDisplayName(null);
      setAvatarUrl(null);
      setUsername(null);
      setBio(null);
      return;
    }
    void loadProfile(uid);
  }, [user?.id, loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) await loadProfile(user.id);
  }, [user?.id, loadProfile]);

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>(
    async (patch) => {
      if (!user?.id) return { error: "로그인이 필요합니다." };
      const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
      if (error) return { error: translateProfileError(error.message, (error as { code?: string }).code) };
      await loadProfile(user.id);
      return { error: null };
    },
    [user?.id, loadProfile],
  );

  const signUp = useCallback<AuthContextValue["signUp"]>(async (email, password, name) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: name },
      },
    });
    return { error: error ? translateError(error.message) : null };
  }, []);

  const signIn = useCallback<AuthContextValue["signIn"]>(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? translateError(error.message) : null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider
      value={{ user, session, loading, displayName, avatarUrl, username, bio, refreshProfile, updateProfile, signUp, signIn, signOut }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
