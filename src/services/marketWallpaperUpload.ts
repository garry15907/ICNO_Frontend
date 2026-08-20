/**
 * Publishes a local-library wallpaper to the cloud marketplace (`market_wallpapers`).
 * Mirrors marketIconUpload.ts — single image only (no packs).
 *
 * SECURITY: owner_id always from the session; storage object names are random
 * UUIDs under `{user.id}/wallpapers/`; no local absolute paths are stored.
 */
import { supabase } from "@/integrations/supabase/client";
import { localEngineUrl } from "@/services/localEngineApi";
import { MARKET_BUCKET } from "@/services/marketPresetUpload";
import { sanitizeText, parseTags, ICON_LIMITS } from "@/services/marketIconUpload";

export { sanitizeText, parseTags };
export const WALLPAPER_LIMITS = ICON_LIMITS;

const ALLOWED_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};
const MAX_WALLPAPER_BYTES = 25 * 1024 * 1024;

export class MarketWallpaperUploadError extends Error {}

async function sha256Hex(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function imageSize(blob: Blob): Promise<{ width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: null, height: null });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export type WallpaperToUpload = { id: string; title: string; imageUrl: string };

export type PublishWallpaperResult = { ok: boolean; error?: string };

export async function publishWallpaper(
  wp: WallpaperToUpload,
  opts: { name: string; description?: string; tagsRaw: string; isPublic: boolean },
): Promise<PublishWallpaperResult> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new MarketWallpaperUploadError("로그인이 필요합니다.");
  if (!wp?.imageUrl) throw new MarketWallpaperUploadError("이미지 경로가 없습니다.");

  let path = "";
  try {
    const res = await fetch(localEngineUrl(wp.imageUrl), { cache: "no-store" });
    if (!res.ok) throw new Error(`이미지를 불러올 수 없습니다 (${res.status})`);
    const blob = await res.blob();
    const ext = ALLOWED_MIME[blob.type];
    if (!ext) throw new Error("PNG, JPEG, GIF, WEBP 이미지만 가능합니다.");
    if (blob.size > MAX_WALLPAPER_BYTES) throw new Error("25MB 이하만 가능합니다.");

    const sha = await sha256Hex(blob);
    const { width, height } = await imageSize(blob);
    path = `${user.id}/wallpapers/${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage
      .from(MARKET_BUCKET)
      .upload(path, blob, { contentType: blob.type, upsert: false });
    if (up.error) throw up.error;

    const name = sanitizeText(opts.name || wp.title).slice(0, ICON_LIMITS.nameMax) || "배경화면";
    const description = sanitizeText(opts.description ?? "").slice(0, 1000) || null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("market_wallpapers").insert({
      owner_id: user.id,
      name,
      description,
      tags: parseTags(opts.tagsRaw),
      image_path: path,
      sha256: sha,
      width,
      height,
      format: ext,
      is_public: opts.isPublic,
    });
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    if (path) {
      try {
        await supabase.storage.from(MARKET_BUCKET).remove([path]);
      } catch {
        /* ignore */
      }
    }
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}