import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MARKET_BUCKET } from "@/services/marketPresetUpload";

// NOTE: market_wallpapers 는 우리 Supabase 프로젝트에 있지만 생성 타입(types.ts)이
// 아직 이 테이블을 모를 수 있어 아이콘과 동일하게 any 캐스트를 사용한다.

export type MarketWallpaperRow = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  tags: string[];
  image_path: string;
  width: number | null;
  height: number | null;
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

async function signPaths(paths: string[]): Promise<Map<string, string>> {
  const uniq = [...new Set(paths.filter(Boolean))];
  if (uniq.length === 0) return new Map();
  const { data } = await supabase.storage.from(MARKET_BUCKET).createSignedUrls(uniq, 3600);
  return new Map((data ?? []).map((d) => [d.path ?? "", d.signedUrl] as const));
}

export function useMarketWallpapers() {
  const [wallpapers, setWallpapers] = useState<MarketWallpaperRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("market_wallpapers")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[market-wallpapers] load failed", error);
      setWallpapers([]);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as MarketWallpaperRow[];
    const map = await signPaths(rows.map((r) => r.image_path));
    setWallpapers(rows.map((r) => ({ ...r, imageUrl: map.get(r.image_path) ?? null })));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const on = () => void load();
    window.addEventListener("market-wallpapers:refresh", on);
    return () => window.removeEventListener("market-wallpapers:refresh", on);
  }, [load]);

  return { wallpapers, loading, reload: load };
}
