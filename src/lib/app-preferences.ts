/**
 * localStorage 기반 앱 환경설정. 서버 저장이 필요 없는 UI 취향값만 담는다.
 * (테마는 useTheme, 사이드바 표시는 useSidebarMode 가 계속 소유한다.)
 */
import { useCallback, useEffect, useState } from "react";

export type StartPage = "home" | "explore" | "library";
export type LibrarySort = "recent" | "name";
export type NotifKey = "all" | "comment" | "rating" | "download" | "sales" | "report" | "error";

export type AppPreferences = {
  startPage: StartPage;
  librarySort: LibrarySort;
  pinnedFirst: boolean;
  notifications: Record<NotifKey, boolean>;
};

const KEY = "icno.preferences";

export const DEFAULT_PREFERENCES: AppPreferences = {
  startPage: "home",
  librarySort: "recent",
  pinnedFirst: true,
  notifications: { all: true, comment: true, rating: true, download: true, sales: true, report: true, error: true },
};

export function readPreferences(): AppPreferences {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      notifications: { ...DEFAULT_PREFERENCES.notifications, ...(parsed.notifications ?? {}) },
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

const EVENT = "icno-preferences:change";

function write(next: AppPreferences) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function useAppPreferences() {
  const [prefs, setPrefs] = useState<AppPreferences>(() => readPreferences());

  useEffect(() => {
    const sync = () => setPrefs(readPreferences());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((patch: Partial<AppPreferences>) => {
    const next = { ...readPreferences(), ...patch };
    setPrefs(next);
    write(next);
  }, []);

  const setNotification = useCallback((key: NotifKey, value: boolean) => {
    const current = readPreferences();
    const next = { ...current, notifications: { ...current.notifications, [key]: value } };
    setPrefs(next);
    write(next);
  }, []);

  return { prefs, update, setNotification };
}
