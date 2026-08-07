import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signAssets, type MarketPresetRow } from "@/lib/market-presets";

type Kind = "wishlists" | "downloads";

/**
 * Market presets referenced by the signed-in user's own rows in
 * `wishlists` / `downloads` (RLS keeps this to `auth.uid()`).
 * Newest first, one card per preset.
 */
function useJoinedPresets(kind: Kind) {
  const [presets, setPresets] = useState<MarketPresetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    setSignedIn(!!uid);
    if (!uid) {
      setPresets([]);
      setLoading(false);
      return;
    }
    const { data: rows } = await supabase
      .from(kind)
      .select("preset_id, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    const ids: string[] = [];
    for (const r of rows ?? []) if (!ids.includes(r.preset_id)) ids.push(r.preset_id);
    if (ids.length === 0) {
      setPresets([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("market_presets").select("*").in("id", ids);
    const byId = new Map(((data ?? []) as unknown as MarketPresetRow[]).map((p) => [p.id, p]));
    const ordered = ids.map((id) => byId.get(id)).filter((p): p is MarketPresetRow => !!p);
    setPresets(await signAssets(ordered));
    setLoading(false);
  }, [kind]);

  useEffect(() => {
    void load();
    const onRefresh = () => void load();
    window.addEventListener("market-presets:refresh", onRefresh);
    return () => window.removeEventListener("market-presets:refresh", onRefresh);
  }, [load]);

  return { presets, loading, signedIn, reload: load };
}

export const useWishlistedPresets = () => useJoinedPresets("wishlists");
export const useDownloadedPresets = () => useJoinedPresets("downloads");
