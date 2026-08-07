import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type NoticeType = "comment" | "like" | "download" | "rating" | "follow";

export type Notice = {
  id: string;
  type: NoticeType;
  title: string;
  body: string;
  time: string;
  read?: boolean;
  detail?: string;
  relatedPresetId?: string;
  relatedUserId?: string;
  targetRoute?: string;
};

type Ctx = {
  items: Notice[];
  unreadCount: number;
  loading: boolean;
  signedIn: boolean;
  markRead: (id: string) => void;
  markUnread: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  refresh: () => void;
};

const NotificationsContext = createContext<Ctx | null>(null);

const TITLES: Record<NoticeType, string> = {
  comment: "새 댓글",
  like: "새 찜",
  download: "새 다운로드",
  rating: "새 별점",
  follow: "새 팔로워",
};

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}

type Row = {
  id: string;
  type: NoticeType;
  is_read: boolean;
  created_at: string;
  actor_id: string | null;
  preset_id: string | null;
  actor?: { display_name: string | null; avatar_url: string | null } | null;
  preset?: { name: string | null } | null;
};

function toNotice(r: Row): Notice {
  const actor = r.actor?.display_name || "누군가";
  const preset = r.preset?.name || "프리셋";
  const body =
    r.type === "comment" ? `${actor}님이 회원님의 프리셋 '${preset}'에 댓글을 남겼습니다`
    : r.type === "like" ? `${actor}님이 회원님의 프리셋 '${preset}'을 찜했습니다`
    : r.type === "download" ? `${actor}님이 회원님의 프리셋 '${preset}'을 다운로드했습니다`
    : r.type === "rating" ? `${actor}님이 회원님의 프리셋 '${preset}'에 별점을 남겼습니다`
    : `${actor}님이 회원님을 팔로우했습니다`;

  const targetRoute =
    r.type === "follow"
      ? (r.actor?.display_name ? `/creator/${encodeURIComponent(r.actor.display_name)}` : "/profile/following")
      : (r.preset_id ? `/explore?market=${r.preset_id}` : undefined);

  return {
    id: r.id,
    type: r.type,
    title: TITLES[r.type],
    body,
    time: relTime(r.created_at),
    read: r.is_read,
    relatedPresetId: r.preset_id ?? undefined,
    relatedUserId: r.actor_id ?? undefined,
    targetRoute,
  };
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*, actor:profiles!actor_id(display_name, avatar_url), preset:market_presets(name)")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error && data) setItems((data as unknown as Row[]).map(toNotice));
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `recipient_id=eq.${user.id}` },
        () => { void load(); },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, load]);

  const setRead = useCallback(async (id: string, read: boolean) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read } : n)));
    await supabase.from("notifications").update({ is_read: read }).eq("id", id);
  }, []);

  const value = useMemo<Ctx>(() => ({
    items,
    loading,
    signedIn: !!user,
    unreadCount: items.filter((n) => !n.read).length,
    markRead: (id) => { void setRead(id, true); },
    markUnread: (id) => { void setRead(id, false); },
    markAllRead: () => {
      if (!user) return;
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      void supabase.from("notifications").update({ is_read: true })
        .eq("recipient_id", user.id).eq("is_read", false);
    },
    remove: (id) => {
      setItems((prev) => prev.filter((n) => n.id !== id));
      void supabase.from("notifications").delete().eq("id", id);
    },
    refresh: () => { void load(); },
  }), [items, loading, user, setRead, load]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}