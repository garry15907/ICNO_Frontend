import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { currentUser } from "@/data/mockData";

export type ProfileData = {
  name: string;
  nickname: string;
  status: string;
  bio: string;
  avatar: string;
};

const DEFAULTS: ProfileData = {
  name: currentUser.name,
  nickname: "Yuri",
  status: "오늘도 새벽합주 준비해볼까요?",
  bio: "인디/모던록 좋아하는 보컬. 합주 기록 꼼꼼하게 남기는 편.",
  avatar: currentUser.avatar,
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
