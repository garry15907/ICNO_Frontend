import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ProfileData = {
  name: string;
  nickname: string;
  status: string;
  bio: string;
  avatar: string;
};

// 신원 정보(표시이름/아바타/이메일)는 Supabase 인증 + profiles 테이블이 소유합니다.
// 여기 남는 값은 아직 백엔드가 없는 로컬 전용 부가 필드(상태메시지/소개)입니다.
const DEFAULTS: ProfileData = {
  name: "",
  nickname: "",
  status: "",
  bio: "",
  avatar: "",
};

const KEY = "icno.profile";

const Ctx = createContext<{
  profile: ProfileData;
  setProfile: (p: ProfileData) => void;
} | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<ProfileData>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {}
    return DEFAULTS;
  });
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(profile)); } catch {}
  }, [profile]);
  return <Ctx.Provider value={{ profile, setProfile: setProfileState }}>{children}</Ctx.Provider>;
}

export function useProfile() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}

export function isImageAvatar(a: string) {
  return a.startsWith("data:") || a.startsWith("http") || a.startsWith("/");
}
