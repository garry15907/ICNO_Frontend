import { supabase } from "@/integrations/supabase/client";
import { localEngineUrl } from "@/services/localEngineApi";
import { MARKET_BUCKET } from "@/services/marketPresetUpload";
import type { MarketPresetRow } from "@/lib/market-presets";

export type ImportResult = { ok: true; id?: string } | { ok: false; error: string };

async function downloadBlob(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from(MARKET_BUCKET).download(path);
  if (error || !data) throw new Error(error?.message ?? "이미지를 내려받지 못했습니다.");
  return data;
}

/**
 * Imports a cloud market preset into the local engine library.
 * Images are fetched from the private bucket and posted as multipart
 * form-data; the engine re-validates/re-encodes them and forces empty
 * target_path (no execution info is ever sent).
 */
export async function importMarketPreset(preset: MarketPresetRow): Promise<ImportResult> {
  try {
    const icons = (preset.icons ?? []).filter((ic) => !!ic.image_path);

    const manifest = {
      name: preset.name,
      canvas: { w: preset.canvas?.w ?? 1920, h: preset.canvas?.h ?? 1080 },
      wallpaper_key: preset.wallpaper_path ? "wp" : undefined,
      icons: icons.map((ic, i) => ({
        file_key: `ic${i}`,
        x: ic.x,
        y: ic.y,
        size: ic.size,
        show_name: ic.show_name,
        icon_name: ic.icon_name ?? "",
        font_family: ic.font_family,
        font_size: ic.font_size,
        font_bold: ic.font_bold,
        font_italic: ic.font_italic,
        font_color: ic.font_color,
        outline_color: ic.outline_color,
      })),
    };

    const form = new FormData();
    form.append("manifest", JSON.stringify(manifest));

    if (preset.wallpaper_path) {
      form.append("files", await downloadBlob(preset.wallpaper_path), "wp");
    }
    for (let i = 0; i < icons.length; i++) {
      const path = icons[i].image_path as string;
      form.append("files", await downloadBlob(path), `ic${i}`);
    }

    // No manual Content-Type: the browser adds the multipart boundary.
    const res = await fetch(localEngineUrl("/api/market/import"), {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: text || `가져오기 실패 (${res.status})` };
    }
    const json = (await res.json().catch(() => ({}))) as { success?: boolean; id?: string };
    if (json.success === false) return { ok: false, error: "엔진이 가져오기를 거부했습니다." };
    return { ok: true, id: json.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "가져오기 실패" };
  }
}
