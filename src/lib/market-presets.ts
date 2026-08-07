import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MARKET_BUCKET } from "@/services/marketPresetUpload";

export type MarketPresetIcon = {
  image_path?: string;
  icon_name?: string | null;
  x?: number;
  y?: number;
  size?: number;
  show_name?: boolean;
  font_family?: string | null;
  font_size?: number | null;
  font_bold?: boolean | null;
  font_italic?: boolean | null;
  font_color?: string | null;
  outline_color?: string | null;
};

export type MarketPresetRow = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  tags: string[];
  wallpaper_path: string | null;
  canvas: { w: number; h: number };
  icons: MarketPresetIcon[];
  is_public: boolean;
  created_at: string;
  likes: number;
  downloads: number;
  views: number;
  wishlist_count: number;
  comment_count: number;
  rating_sum: number;
  rating_count: number;
  /** Signed preview URL for `wallpaper_path` (bucket is private). */
  thumbnailUrl?: string | null;
  /** Signed URLs for `icons[].image_path`, index-aligned with `icons`. */
  iconUrls?: (string | null)[];
};

/** Average rating, or 0 when nobody rated the preset yet. */
export function presetAverageRating(p: Pick<MarketPresetRow, "rating_sum" | "rating_count">) {
  return p.rating_count > 0 ? p.rating_sum / p.rating_count : 0;
}

async function signAssets(rows: MarketPresetRow[]): Promise<MarketPresetRow[]> {
  const paths = [
    ...rows.map((r) => r.wallpaper_path),
    ...rows.flatMap((r) => (r.icons ?? []).map((ic) => ic.image_path ?? null)),
  ].filter((p): p is string => !!p);
  if (paths.length === 0) return rows;
  const unique = [...new Set(paths)];
  const { data } = await supabase.storage.from(MARKET_BUCKET).createSignedUrls(unique, 3600);
  const map = new Map((data ?? []).map((d) => [d.path ?? "", d.signedUrl] as const));
  return rows.map((r) => ({
    ...r,
    thumbnailUrl: r.wallpaper_path ? map.get(r.wallpaper_path) ?? null : null,
    iconUrls: (r.icons ?? []).map((ic) => (ic.image_path ? map.get(ic.image_path) ?? null : null)),
  }));
}

/** Cloud market presets. `mine: true` limits the list to the signed-in owner. */
export function useMarketPresets(options?: { mine?: boolean }) {
  const mine = options?.mine ?? false;
  const [presets, setPresets] = useState<MarketPresetRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("market_presets")
      .select("*")
      .order("created_at", { ascending: false });
    if (mine) {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) {
        setPresets([]);
        setLoading(false);
        return;
      }
      query = query.eq("owner_id", uid);
    } else {
      query = query.eq("is_public", true);
    }
    const { data, error } = await query;
    if (error) {
      console.error("[market] load failed", error);
      setPresets([]);
      setLoading(false);
      return;
    }
    setPresets(await signAssets((data ?? []) as unknown as MarketPresetRow[]));
    setLoading(false);
  }, [mine]);

  useEffect(() => {
    void load();
    const onRefresh = () => void load();
    window.addEventListener("market-presets:refresh", onRefresh);
    return () => window.removeEventListener("market-presets:refresh", onRefresh);
  }, [load]);

  return { presets, loading, reload: load };
}