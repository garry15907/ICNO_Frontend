/**
 * 프로필 통계 / 컬렉션 실집계.
 * 프리셋(market_presets 계열)과 아이템(market_icons / market_icon_packs /
 * market_wallpapers + item_* 소셜 테이블)을 합산해 프로필 화면에 공급한다.
 * item_* / market_icons 계열은 생성 타입에 아직 없어 any 캐스트를 사용한다.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MARKET_BUCKET } from "@/services/marketPresetUpload";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = () => supabase as any;

export type ItemKind = "icon" | "pack" | "wallpaper";

export type MarketItemLite = {
  kind: ItemKind;
  id: string;
  name: string;
  imageUrl: string | null;
  is_public: boolean;
  downloads: number;
  created_at: string;
};

const TABLE: Record<ItemKind, string> = {
  icon: "market_icons",
  pack: "market_icon_packs",
  wallpaper: "market_wallpapers",
};

const KIND_LABEL: Record<ItemKind, string> = { icon: "아이콘", pack: "아이콘 팩", wallpaper: "배경화면" };
export const itemKindLabel = (k: ItemKind) => KIND_LABEL[k];

async function signPaths(paths: string[]): Promise<Map<string, string>> {
  const uniq = [...new Set(paths.filter(Boolean))];
  if (uniq.length === 0) return new Map();
  const { data } = await supabase.storage.from(MARKET_BUCKET).createSignedUrls(uniq, 3600);
  return new Map((data ?? []).map((d) => [d.path ?? "", d.signedUrl] as const));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function firstPath(kind: ItemKind, row: any): string {
  if (kind === "pack") return row?.icons?.[0]?.image_path ?? "";
  return row?.image_path ?? "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function toLite(kind: ItemKind, rows: any[]): Promise<MarketItemLite[]> {
  const map = await signPaths(rows.map((r) => firstPath(kind, r)));
  return rows.map((r) => ({
    kind,
    id: r.id,
    name: r.name ?? "",
    imageUrl: map.get(firstPath(kind, r)) ?? null,
    is_public: r.is_public !== false,
    downloads: r.downloads ?? 0,
    created_at: r.created_at ?? "",
  }));
}

async function countOf(table: string, column: string, uid: string): Promise<number> {
  const { count } = await sb().from(table).select("*", { count: "exact", head: true }).eq(column, uid);
  return count ?? 0;
}

export type ProfileStats = {
  wishlist: number;
  downloads: number;
  myItems: number;
  following: number;
};

const ZERO: ProfileStats = { wishlist: 0, downloads: 0, myItems: 0, following: 0 };

/** 로그인 유저 기준 프로필 상단 통계. */
export function useProfileStats() {
  const [stats, setStats] = useState<ProfileStats>(ZERO);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) {
      setStats(ZERO);
      setLoading(false);
      return;
    }
    const [
      wishPresets,
      wishItems,
      dlPresets,
      dlItems,
      myPresets,
      myIcons,
      myPacks,
      myWalls,
      following,
    ] = await Promise.all([
      countOf("wishlists", "user_id", uid),
      countOf("item_wishlists", "user_id", uid),
      countOf("downloads", "user_id", uid),
      countOf("item_downloads", "user_id", uid),
      countOf("market_presets", "owner_id", uid),
      countOf("market_icons", "owner_id", uid),
      countOf("market_icon_packs", "owner_id", uid),
      countOf("market_wallpapers", "owner_id", uid),
      countOf("follows", "follower_id", uid),
    ]);
    setStats({
      wishlist: wishPresets + wishItems,
      downloads: dlPresets + dlItems,
      myItems: myPresets + myIcons + myPacks + myWalls,
      following,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const onRefresh = () => void load();
    window.addEventListener("market-presets:refresh", onRefresh);
    window.addEventListener("market-icons:refresh", onRefresh);
    window.addEventListener("follows:refresh", onRefresh);
    return () => {
      window.removeEventListener("market-presets:refresh", onRefresh);
      window.removeEventListener("market-icons:refresh", onRefresh);
      window.removeEventListener("follows:refresh", onRefresh);
    };
  }, [load]);

  return { stats, loading, reload: load };
}

export type FollowedCreator = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  follower_count: number;
};

/** follows(follower_id = me) → profiles 조인. */
export function useMyFollowing() {
  const [creators, setCreators] = useState<FollowedCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    setSignedIn(!!uid);
    if (!uid) {
      setCreators([]);
      setLoading(false);
      return;
    }
    const { data: rows } = await supabase
      .from("follows")
      .select("following_id, created_at")
      .eq("follower_id", uid)
      .order("created_at", { ascending: false });
    const ids = [...new Set((rows ?? []).map((r) => r.following_id))];
    if (ids.length === 0) {
      setCreators([]);
      setLoading(false);
      return;
    }
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, follower_count")
      .in("id", ids);
    const byId = new Map((profs ?? []).map((p) => [p.id, p]));
    setCreators(
      ids
        .map((id) => byId.get(id))
        .filter(Boolean)
        .map((p) => ({
          id: p!.id,
          display_name: p!.display_name,
          username: p!.username,
          avatar_url: p!.avatar_url,
          follower_count: p!.follower_count ?? 0,
        })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const onRefresh = () => void load();
    window.addEventListener("follows:refresh", onRefresh);
    return () => window.removeEventListener("follows:refresh", onRefresh);
  }, [load]);

  return { creators, loading, signedIn, reload: load };
}

/** item_wishlists / item_downloads 로 참조된 아이템(아이콘·팩·배경) 목록. */
export function useMyItems(kind: "item_wishlists" | "item_downloads") {
  const [items, setItems] = useState<MarketItemLite[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data: rows } = await sb()
      .from(kind)
      .select("target_type, target_id, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    const byKind: Record<ItemKind, string[]> = { icon: [], pack: [], wallpaper: [] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const r of (rows ?? []) as any[]) {
      const t = r.target_type as ItemKind;
      if (byKind[t] && !byKind[t].includes(r.target_id)) byKind[t].push(r.target_id);
    }
    const lists = await Promise.all(
      (Object.keys(byKind) as ItemKind[]).map(async (k) => {
        const ids = byKind[k];
        if (ids.length === 0) return [] as MarketItemLite[];
        const { data } = await sb().from(TABLE[k]).select("*").in("id", ids);
        return toLite(k, data ?? []);
      }),
    );
    setItems(lists.flat());
    setLoading(false);
  }, [kind]);

  useEffect(() => {
    void load();
    const onRefresh = () => void load();
    window.addEventListener("market-icons:refresh", onRefresh);
    return () => window.removeEventListener("market-icons:refresh", onRefresh);
  }, [load]);

  return { items, loading, reload: load };
}

export const useWishlistedItems = () => useMyItems("item_wishlists");
export const useDownloadedItems = () => useMyItems("item_downloads");

/** 내가 올린 아이템(아이콘/팩/배경) + 공개여부 토글 / 삭제. */
export function useMyMarketItems() {
  const [items, setItems] = useState<MarketItemLite[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    const lists = await Promise.all(
      (Object.keys(TABLE) as ItemKind[]).map(async (k) => {
        const { data } = await sb()
          .from(TABLE[k])
          .select("*")
          .eq("owner_id", uid)
          .order("created_at", { ascending: false });
        return toLite(k, data ?? []);
      }),
    );
    setItems(lists.flat());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setPublic = useCallback(
    async (item: MarketItemLite, next: boolean) => {
      const { error } = await sb().from(TABLE[item.kind]).update({ is_public: next }).eq("id", item.id);
      if (error) return error.message as string;
      await load();
      return null;
    },
    [load],
  );

  const remove = useCallback(
    async (item: MarketItemLite) => {
      const { error } = await sb().from(TABLE[item.kind]).delete().eq("id", item.id);
      if (error) return error.message as string;
      await load();
      return null;
    },
    [load],
  );

  return { items, loading, reload: load, setPublic, remove };
}
