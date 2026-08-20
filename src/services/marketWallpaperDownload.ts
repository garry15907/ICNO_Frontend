/**
 * Downloads a marketplace wallpaper into the user's local wallpaper library.
 * Mirrors marketIconDownload.ts: fetch signed URL bytes → POST /api/wallpaper/upload.
 */
import { uploadWallpaper } from "@/services/localEngineApi";
import { setWallpaperOrigin } from "@/lib/icon-meta";

function extFromType(t: string): string {
  return t === "image/gif" ? "gif" : t === "image/webp" ? "webp" : t === "image/png" ? "png" : "jpg";
}

function safeName(name: string): string {
  return (name || "wallpaper").replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 40) || "wallpaper";
}

/** 마켓 배경화면 1장을 로컬 보관함에 저장. ownerId = 마켓 제작자. */
export async function downloadMarketWallpaper(
  name: string,
  imageUrl: string | null | undefined,
  ownerId?: string,
): Promise<void> {
  if (!imageUrl) throw new Error("이미지 주소가 없습니다.");
  const res = await fetch(imageUrl, { cache: "no-store" });
  if (!res.ok) throw new Error(`이미지를 불러올 수 없습니다 (${res.status})`);
  const blob = await res.blob();
  const file = new File([blob], `${safeName(name)}.${extFromType(blob.type)}`, { type: blob.type });
  const out = await uploadWallpaper(file);
  if (!out?.wallpaper_path) throw new Error("엔진에 저장하지 못했습니다.");
  if (out.storage_filename) setWallpaperOrigin(out.storage_filename, { ownerId, marketType: "wallpaper" });
  window.dispatchEvent(new Event("wallpaper-library:refresh"));
}