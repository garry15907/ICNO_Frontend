/**
 * Downloads a marketplace icon (or pack) into the user's local icon library.
 *
 * Flow: fetch the image bytes from Supabase Storage (signed URL) → POST to the
 * local engine `/api/icons/upload` so it lands in `custom_icons` + library.json.
 * The caller should then reconcile the icon library so it appears in 보관함.
 */
import { uploadIconImage } from "@/services/localEngineApi";
import { addPack, setIconOrigin } from "@/lib/icon-meta";

function extFromType(t: string): string {
  return t === "image/gif" ? "gif" : t === "image/jpeg" ? "jpg" : "png";
}

function safeName(name: string): string {
  return (name || "icon").replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 40) || "icon";
}

async function fetchAsFile(url: string, name: string): Promise<File> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`이미지를 불러올 수 없습니다 (${res.status})`);
  const blob = await res.blob();
  return new File([blob], `${safeName(name)}.${extFromType(blob.type)}`, { type: blob.type });
}

/** 단품 아이콘 1개를 보관함에 저장. ownerId = 마켓 제작자. */
export async function downloadMarketIcon(
  name: string,
  imageUrl: string | null | undefined,
  ownerId?: string,
): Promise<void> {
  if (!imageUrl) throw new Error("이미지 주소가 없습니다.");
  const file = await fetchAsFile(imageUrl, name);
  const res = await uploadIconImage(file);
  if (!res?.asset_id) throw new Error("엔진에 저장하지 못했습니다.");
  if (res.storage_filename) setIconOrigin(res.storage_filename, { ownerId, marketType: "icon" });
}

/** 팩의 모든 아이콘을 보관함에 저장하고 하나의 팩으로 묶는다. 반환: {ok, total}. */
export async function downloadMarketIconPack(
  name: string,
  iconUrls: (string | null)[],
  ownerId?: string,
): Promise<{ ok: number; total: number }> {
  const urls = iconUrls.filter((u): u is string => !!u);
  let ok = 0;
  const filenames: string[] = [];
  for (let i = 0; i < urls.length; i++) {
    try {
      const file = await fetchAsFile(urls[i], `${safeName(name)}_${i + 1}`);
      const res = await uploadIconImage(file);
      if (res?.asset_id) {
        ok++;
        if (res.storage_filename) filenames.push(res.storage_filename);
      }
    } catch {
      /* skip a failed one, continue with the rest */
    }
  }
  if (filenames.length > 0) {
    addPack(name, filenames);
    filenames.forEach((f) => setIconOrigin(f, { ownerId, marketType: "pack" }));
  }
  return { ok, total: urls.length };
}
