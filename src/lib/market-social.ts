import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type ReportReason = "spam" | "inappropriate" | "copyright" | "malware" | "other";

type SocialState = {
  likes: Set<string>;
  wishlists: Set<string>;
  ratings: Map<string, number>;
  follows: Set<string>;
  loaded: boolean;
};

let state: SocialState = {
  likes: new Set(),
  wishlists: new Set(),
  ratings: new Map(),
  follows: new Set(),
  loaded: false,
};
const subs = new Set<() => void>();
const emit = () => subs.forEach((fn) => fn());

function reset() {
  state = { likes: new Set(), wishlists: new Set(), ratings: new Map(), follows: new Set(), loaded: false };
  emit();
}

let loading: Promise<void> | null = null;

/** Loads the signed-in user's own social rows (RLS keeps this to `auth.uid()`). */
async function loadMine(force = false) {
  if (loading && !force) return loading;
  loading = (async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      state = { ...state, likes: new Set(), wishlists: new Set(), ratings: new Map(), follows: new Set(), loaded: true };
      emit();
      return;
    }
    const [likes, wishlists, ratings, follows] = await Promise.all([
      supabase.from("likes").select("preset_id"),
      supabase.from("wishlists").select("preset_id"),
      supabase.from("ratings").select("preset_id, score"),
      supabase.from("follows").select("following_id").eq("follower_id", uid),
    ]);
    state = {
      likes: new Set((likes.data ?? []).map((r) => r.preset_id)),
      wishlists: new Set((wishlists.data ?? []).map((r) => r.preset_id)),
      ratings: new Map((ratings.data ?? []).map((r) => [r.preset_id, r.score] as const)),
      follows: new Set((follows.data ?? []).map((r) => r.following_id)),
      loaded: true,
    };
    emit();
  })().finally(() => {
    loading = null;
  });
  return loading;
}

supabase.auth.onAuthStateChange(() => {
  reset();
  void loadMine(true);
});

const refreshCounts = () => window.dispatchEvent(new Event("market-presets:refresh"));

async function requireUid(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id ?? null;
  if (!uid) toast.error("로그인이 필요합니다.", { description: "로그인 후 다시 시도해주세요." });
  return uid;
}

/** Social actions + the current user's own like/wishlist/rating/follow state. */
export function useMarketSocial() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    subs.add(fn);
    if (!state.loaded) void loadMine();
    return () => {
      subs.delete(fn);
    };
  }, []);

  const isLiked = useCallback((id: string) => state.likes.has(id), []);
  const isWishlisted = useCallback((id: string) => state.wishlists.has(id), []);
  const myRating = useCallback((id: string) => state.ratings.get(id) ?? 0, []);
  const isFollowing = useCallback((id: string) => state.follows.has(id), []);

  const toggleLike = useCallback(async (presetId: string) => {
    const uid = await requireUid();
    if (!uid) return;
    if (state.likes.has(presetId)) {
      const { error } = await supabase.from("likes").delete().eq("preset_id", presetId).eq("user_id", uid);
      if (error) return toast.error("좋아요 취소에 실패했습니다.");
      state.likes.delete(presetId);
    } else {
      const { error } = await supabase.from("likes").insert({ preset_id: presetId, user_id: uid });
      if (error) return toast.error("좋아요에 실패했습니다.");
      state.likes.add(presetId);
    }
    emit();
    refreshCounts();
  }, []);

  const toggleWishlist = useCallback(async (presetId: string) => {
    const uid = await requireUid();
    if (!uid) return;
    if (state.wishlists.has(presetId)) {
      const { error } = await supabase.from("wishlists").delete().eq("preset_id", presetId).eq("user_id", uid);
      if (error) return toast.error("찜 취소에 실패했습니다.");
      state.wishlists.delete(presetId);
      toast.success("찜 목록에서 제거했습니다.");
    } else {
      const { error } = await supabase.from("wishlists").insert({ preset_id: presetId, user_id: uid });
      if (error) return toast.error("찜하기에 실패했습니다.");
      state.wishlists.add(presetId);
      toast.success("찜 목록에 추가했습니다.");
    }
    emit();
    refreshCounts();
  }, []);

  const rate = useCallback(async (presetId: string, score: number) => {
    if (score < 1 || score > 5) return;
    const uid = await requireUid();
    if (!uid) return;
    const { error } = await supabase
      .from("ratings")
      .upsert({ preset_id: presetId, user_id: uid, score }, { onConflict: "user_id,preset_id" });
    if (error) return toast.error("별점 등록에 실패했습니다.");
    state.ratings.set(presetId, score);
    emit();
    refreshCounts();
    toast.success(`별점 ${score}점을 남겼습니다.`);
  }, []);

  const toggleFollow = useCallback(async (targetId: string) => {
    const uid = await requireUid();
    if (!uid) return;
    if (uid === targetId) return;
    if (state.follows.has(targetId)) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", uid)
        .eq("following_id", targetId);
      if (error) return toast.error("팔로우 취소에 실패했습니다.");
      state.follows.delete(targetId);
    } else {
      const { error } = await supabase.from("follows").insert({ follower_id: uid, following_id: targetId });
      if (error) return toast.error("팔로우에 실패했습니다.");
      state.follows.add(targetId);
    }
    emit();
    window.dispatchEvent(new Event("follows:refresh"));
  }, []);

  const registerDownload = useCallback(async (presetId: string) => {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return;
    await supabase.from("downloads").insert({ preset_id: presetId, user_id: uid });
    refreshCounts();
  }, []);

  const report = useCallback(async (presetId: string, reason: ReportReason, detail: string) => {
    const uid = await requireUid();
    if (!uid) return false;
    const { error } = await supabase.from("reports").insert({
      preset_id: presetId,
      reporter_id: uid,
      reason,
      detail: detail.trim().slice(0, 2000) || null,
    });
    if (error) {
      toast.error("신고 접수에 실패했습니다.");
      return false;
    }
    toast.success("신고 접수", { description: "검토 후 조치하겠습니다." });
    return true;
  }, []);

  const incrementView = useCallback(async (presetId: string) => {
    await supabase.rpc("increment_view", { p_preset_id: presetId });
  }, []);

  return {
    isLiked,
    isWishlisted,
    myRating,
    isFollowing,
    toggleLike,
    toggleWishlist,
    rate,
    toggleFollow,
    registerDownload,
    report,
    incrementView,
  };
}

export type MarketComment = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  author?: string;
};

/** Comments for one market preset, newest first. */
export function usePresetComments(presetId: string | null) {
  const [comments, setComments] = useState<MarketComment[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!presetId) return;
    setLoading(true);
    const { data } = await supabase
      .from("comments")
      .select("id, user_id, body, created_at")
      .eq("preset_id", presetId)
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as MarketComment[];
    const ids = [...new Set(rows.map((r) => r.user_id))];
    let names = new Map<string, string>();
    if (ids.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("id, display_name, username").in("id", ids);
      names = new Map((profs ?? []).map((p) => [p.id, p.display_name || p.username || "사용자"] as const));
    }
    setComments(rows.map((r) => ({ ...r, author: names.get(r.user_id) ?? "사용자" })));
    setLoading(false);
  }, [presetId]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = useCallback(
    async (body: string) => {
      if (!presetId) return false;
      const text = body.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, "").trim();
      if (text.length < 1) {
        toast.error("댓글을 입력해주세요.");
        return false;
      }
      if (text.length > 1000) {
        toast.error("댓글은 1000자까지 입력할 수 있습니다.");
        return false;
      }
      const uid = await requireUid();
      if (!uid) return false;
      const { error } = await supabase.from("comments").insert({ preset_id: presetId, user_id: uid, body: text });
      if (error) {
        toast.error("댓글 등록에 실패했습니다.");
        return false;
      }
      await load();
      refreshCounts();
      return true;
    },
    [presetId, load],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) return toast.error("댓글 삭제에 실패했습니다.");
      await load();
      refreshCounts();
    },
    [load],
  );

  return { comments, loading, add, remove, reload: load };
}