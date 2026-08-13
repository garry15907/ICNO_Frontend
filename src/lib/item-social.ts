/**
 * 아이콘/팩(마켓 아이템) 소셜 — 프리셋 소셜(market-social.ts)과 동일한 구조를
 * (target_type: 'icon' | 'pack', target_id) 폴리모픽으로 제공.
 * item_* 테이블은 생성 타입에 아직 없어 any 캐스트 사용.
 */
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type ItemType = "icon" | "pack";
export type ReportReason = "spam" | "inappropriate" | "copyright" | "malware" | "other";

const k = (t: ItemType, id: string) => `${t}:${id}`;

type State = {
  likes: Set<string>;
  wishlists: Set<string>;
  ratings: Map<string, number>;
  loaded: boolean;
};

let state: State = { likes: new Set(), wishlists: new Set(), ratings: new Map(), loaded: false };
const subs = new Set<() => void>();
const emit = () => subs.forEach((fn) => fn());
const refreshCounts = () => window.dispatchEvent(new Event("market-icons:refresh"));

let loading: Promise<void> | null = null;

async function loadMine(force = false) {
  if (loading && !force) return loading;
  loading = (async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      state = { likes: new Set(), wishlists: new Set(), ratings: new Map(), loaded: true };
      emit();
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const [likes, wishlists, ratings] = await Promise.all([
      sb.from("item_likes").select("target_type, target_id"),
      sb.from("item_wishlists").select("target_type, target_id"),
      sb.from("item_ratings").select("target_type, target_id, score"),
    ]);
    state = {
      likes: new Set((likes.data ?? []).map((r: any) => k(r.target_type, r.target_id))),
      wishlists: new Set((wishlists.data ?? []).map((r: any) => k(r.target_type, r.target_id))),
      ratings: new Map((ratings.data ?? []).map((r: any) => [k(r.target_type, r.target_id), r.score] as const)),
      loaded: true,
    };
    emit();
  })().finally(() => {
    loading = null;
  });
  return loading;
}

supabase.auth.onAuthStateChange(() => {
  state = { likes: new Set(), wishlists: new Set(), ratings: new Map(), loaded: false };
  emit();
  void loadMine(true);
});

async function requireUid(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id ?? null;
  if (!uid) toast.error("로그인이 필요합니다.", { description: "로그인 후 다시 시도해주세요." });
  return uid;
}

export function useItemSocial() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    subs.add(fn);
    if (!state.loaded) void loadMine();
    return () => {
      subs.delete(fn);
    };
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const isLiked = useCallback((t: ItemType, id: string) => state.likes.has(k(t, id)), []);
  const isWishlisted = useCallback((t: ItemType, id: string) => state.wishlists.has(k(t, id)), []);
  const myRating = useCallback((t: ItemType, id: string) => state.ratings.get(k(t, id)) ?? 0, []);

  const toggleLike = useCallback(async (t: ItemType, id: string) => {
    const uid = await requireUid();
    if (!uid) return;
    const key = k(t, id);
    if (state.likes.has(key)) {
      const { error } = await sb.from("item_likes").delete().eq("target_type", t).eq("target_id", id).eq("user_id", uid);
      if (error) return toast.error("좋아요 취소에 실패했습니다.");
      state.likes.delete(key);
    } else {
      const { error } = await sb.from("item_likes").insert({ target_type: t, target_id: id, user_id: uid });
      if (error) return toast.error("좋아요에 실패했습니다.");
      state.likes.add(key);
    }
    emit();
    refreshCounts();
  }, [sb]);

  const toggleWishlist = useCallback(async (t: ItemType, id: string) => {
    const uid = await requireUid();
    if (!uid) return;
    const key = k(t, id);
    if (state.wishlists.has(key)) {
      const { error } = await sb.from("item_wishlists").delete().eq("target_type", t).eq("target_id", id).eq("user_id", uid);
      if (error) return toast.error("찜 취소에 실패했습니다.");
      state.wishlists.delete(key);
      toast.success("찜 목록에서 제거했습니다.");
    } else {
      const { error } = await sb.from("item_wishlists").insert({ target_type: t, target_id: id, user_id: uid });
      if (error) return toast.error("찜하기에 실패했습니다.");
      state.wishlists.add(key);
      toast.success("찜 목록에 추가했습니다.");
    }
    emit();
    refreshCounts();
  }, [sb]);

  const rate = useCallback(async (t: ItemType, id: string, score: number) => {
    if (score < 1 || score > 5) return;
    const uid = await requireUid();
    if (!uid) return;
    const { error } = await sb
      .from("item_ratings")
      .upsert({ target_type: t, target_id: id, user_id: uid, score }, { onConflict: "user_id,target_type,target_id" });
    if (error) return toast.error("별점 등록에 실패했습니다.");
    state.ratings.set(k(t, id), score);
    emit();
    refreshCounts();
    toast.success(`별점 ${score}점을 남겼습니다.`);
  }, [sb]);

  const registerDownload = useCallback(async (t: ItemType, id: string) => {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return;
    await sb.from("item_downloads").insert({ target_type: t, target_id: id, user_id: uid });
    refreshCounts();
  }, [sb]);

  const report = useCallback(async (t: ItemType, id: string, reason: ReportReason, detail: string) => {
    const uid = await requireUid();
    if (!uid) return false;
    const { error } = await sb.from("item_reports").insert({
      target_type: t,
      target_id: id,
      reporter_id: uid,
      reason,
      detail: detail.trim().slice(0, 1000) || null,
    });
    if (error) {
      toast.error("신고 접수에 실패했습니다.");
      return false;
    }
    toast.success("신고 접수", { description: "검토 후 조치하겠습니다." });
    return true;
  }, [sb]);

  const incrementView = useCallback(async (t: ItemType, id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc("increment_item_view", { p_type: t, p_id: id });
  }, []);

  return { isLiked, isWishlisted, myRating, toggleLike, toggleWishlist, rate, registerDownload, report, incrementView };
}

export type ItemComment = { id: string; user_id: string; body: string; created_at: string; author?: string };

export function useItemComments(targetType: ItemType, targetId: string | null) {
  const [comments, setComments] = useState<ItemComment[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { data } = await sb
      .from("item_comments")
      .select("id, user_id, body, created_at")
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as ItemComment[];
    const ids = [...new Set(rows.map((r) => r.user_id))];
    let names = new Map<string, string>();
    if (ids.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("id, display_name, username").in("id", ids);
      names = new Map((profs ?? []).map((p) => [p.id, p.display_name || p.username || "사용자"] as const));
    }
    setComments(rows.map((r) => ({ ...r, author: names.get(r.user_id) ?? "사용자" })));
    setLoading(false);
  }, [targetType, targetId]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = useCallback(
    async (body: string) => {
      if (!targetId) return false;
      const text = body.replace(/\p{C}/gu, "").trim();
      if (text.length < 1) return toast.error("댓글을 입력해주세요."), false;
      if (text.length > 1000) return toast.error("댓글은 1000자까지 입력할 수 있습니다."), false;
      const uid = await requireUid();
      if (!uid) return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      const { error } = await sb.from("item_comments").insert({ target_type: targetType, target_id: targetId, user_id: uid, body: text });
      if (error) return toast.error("댓글 등록에 실패했습니다."), false;
      await load();
      refreshCounts();
      return true;
    },
    [targetType, targetId, load],
  );

  const remove = useCallback(
    async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      const { error } = await sb.from("item_comments").delete().eq("id", id);
      if (error) return toast.error("댓글 삭제에 실패했습니다.");
      await load();
      refreshCounts();
    },
    [load],
  );

  return { comments, loading, add, remove, reload: load };
}
