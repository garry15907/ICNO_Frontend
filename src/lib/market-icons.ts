import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MARKET_BUCKET } from "@/services/marketPresetUpload";

// NOTE: market_icons / market_icon_packs 는 우리 Supabase 프로젝트에 있지만
// 생성 타입(types.ts)이 다른 프로젝트를 가리켜 아직 타입에 없다 → any 캐스트 사용.

export type MarketIconRow = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  tags: string[];
  image_path: string;
  format: string | null;
  downloads: number;
  likes: number;
  views: number;
  wishlist_count: number;
  comment_count: number;
  rating_sum: number;
  rating_count: number;
  is_public: boolean;
  created_at: string;
  /** Signed URL for `image_path`. */
  imageUrl?: string | null;
};

export type MarketIconPackRow = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  tags: string[];
  icons: { image_path: string; name?: string }[];
  icon_count: number;
  downloads: number;
  likes: number;
  views: number;
  wishlist_count: number;
  comment_count: number;
  rating_sum: number;
  rating_count: number;
  is_public: boolean;
  created_at: string;
  /** Signed URLs, index-aligned with `icons`. */
  iconUrls?: (string | null)[];
};

async function signPaths(paths: string[]): Promise<Map<string, string>> {
  const uniq = [...new Set(paths.filter(Boolean))];
  if (uniq.length === 0) return new Map();
  const { data } = await supabase.storage.from(MARKET_BUCKET).createSignedUrls(uniq, 3600);
  return new Map((data ?? []).map((d) => [d.path ?? "", d.signedUrl] as const));
}

export function useMarketIcons() {
  const [icons, setIcons] = useState<MarketIconRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("market_icons")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[market-icons] load failed", error);
      setIcons([]);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as MarketIconRow[];
    const map = await signPaths(rows.map((r) => r.image_path));
    setIcons(rows.map((r) => ({ ...r, imageUrl: map.get(r.image_path) ?? null })));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const on = () => void load();
    window.addEventListener("market-icons:refresh", on);
    return () => window.removeEventListener("market-icons:refresh", on);
  }, [load]);

  return { icons, loading, reload: load };
}

export function useMarketIconPacks() {
  const [packs, setPacks] = useState<MarketIconPackRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("market_icon_packs")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[market-icon-packs] load failed", error);
      setPacks([]);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as MarketIconPackRow[];
    const map = await signPaths(rows.flatMap((r) => (r.icons ?? []).map((i) => i.image_path)));
    setPacks(rows.map((r) => ({ ...r, iconUrls: (r.icons ?? []).map((i) => map.get(i.image_path) ?? null) })));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const on = () => void load();
    window.addEventListener("market-icons:refresh", on);
    return () => window.removeEventListener("market-icons:refresh", on);
  }, [load]);

  return { packs, loading, reload: load };
}
