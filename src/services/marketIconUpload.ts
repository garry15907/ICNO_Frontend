/**
 * Uploads local-library icons to the cloud marketplace (Supabase `market_icons`).
 *
 * SECURITY:
 *  - `owner_id` always comes from the authenticated session, never form input.
 *    RLS (`market_icons_insert`) enforces this server-side.
 *  - Storage object names are random UUIDs under `{user.id}/icons/`.
 *  - No local absolute paths / original filenames are stored.
 *  - Images are re-validated (type/size) before upload.
 */
import { supabase } from "@/integrations/supabase/client";
import { localEngineUrl } from "@/services/localEngineApi";
import { MARKET_BUCKET } from "@/services/marketPresetUpload";

const ALLOWED_MIME: Record<string, string> = {
  "image/png": "png",
  "image/gif": "gif",
  "image/jpeg": "jpg",
};
const MAX_ICON_BYTES = 5 * 1024 * 1024;

export const ICON_LIMITS = { nameMax: 60, tagMax: 20, tagCount: 10 } as const;

export class MarketIconUploadError extends Error {}

export function sanitizeText(input: string): string {
  return input
    .replace(/\p{C}/gu, "") // 제어/포맷 문자(제로폭 포함) 제거
    .replace(/[ \t]+/g, " ")
    .trim();
}

export function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const tag = sanitizeText(part).replace(/^#/, "");
    if (!tag || tag.length > ICON_LIMITS.tagMax) continue;
    seen.add(tag);
    if (seen.size >= ICON_LIMITS.tagCount) break;
  }
  return [...seen];
}

async function sha256Hex(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type IconToUpload = { id: string; title: string; imageUrl: string };

export type IconUploadOptions = { tagsRaw: string; isPublic: boolean };

export type IconUploadResult = {
  ok: number;
  failed: { title: string; error: string }[];
};

/** Upload one or more library icons as individual `market_icons` rows. */
export async function uploadIconsToMarket(
  icons: IconToUpload[],
  opts: IconUploadOptions,
  onProgress?: (done: number, total: number) => void,
): Promise<IconUploadResult> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new MarketIconUploadError("로그인이 필요합니다.");

  const tags = parseTags(opts.tagsRaw);
  const result: IconUploadResult = { ok: 0, failed: [] };

  for (let i = 0; i < icons.length; i++) {
    const ic = icons[i];
    let uploadedPath: string | null = null;
    try {
      if (!ic.imageUrl) throw new Error("이미지 경로가 없습니다.");
      // cache:"no-store" — 썸네일 <img> 캐시(비-CORS)와 충돌 방지
      const res = await fetch(localEngineUrl(ic.imageUrl), { cache: "no-store" });
      if (!res.ok) throw new Error(`이미지를 불러올 수 없습니다 (${res.status})`);
      const blob = await res.blob();
      const ext = ALLOWED_MIME[blob.type];
      if (!ext) throw new Error("PNG, GIF, JPEG 이미지만 올릴 수 있습니다.");
      if (blob.size > MAX_ICON_BYTES) throw new Error("아이콘은 5MB 이하만 올릴 수 있습니다.");

      const sha = await sha256Hex(blob);
      const path = `${user.id}/icons/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage
        .from(MARKET_BUCKET)
        .upload(path, blob, { contentType: blob.type, upsert: false });
      if (up.error) throw up.error;
      uploadedPath = path;

      const name = sanitizeText(ic.title).slice(0, ICON_LIMITS.nameMax) || "아이콘";
      // NOTE: market_icons 는 SQL 실행 후 Supabase 생성 타입(types.ts)이 재생성되면
      // 정식 타입이 붙는다. 그 전까지 생성 타입에 없어 아래 캐스트로 우회한다.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ins = await (supabase as any).from("market_icons").insert({
        owner_id: user.id,
        name,
        tags,
        image_path: path,
        sha256: sha,
        format: ext,
        is_public: opts.isPublic,
      });
      if (ins.error) throw ins.error;
      result.ok++;
    } catch (e) {
      if (uploadedPath) {
        try {
          await supabase.storage.from(MARKET_BUCKET).remove([uploadedPath]);
        } catch {
          /* ignore */
        }
      }
      const msg = e instanceof Error ? e.message : String(e);
      result.failed.push({ title: ic.title, error: msg });
    }
    onProgress?.(i + 1, icons.length);
  }

  return result;
}
