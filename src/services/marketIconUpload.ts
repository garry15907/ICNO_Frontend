/**
 * Publishes local-library icons to the cloud marketplace.
 *  - 1 icon  -> `market_icons` (single)
 *  - 2+ icons -> `market_icon_packs` (a bundled pack)
 *
 * SECURITY:
 *  - `owner_id` always comes from the authenticated session (RLS enforces).
 *  - Storage object names are random UUIDs under `{user.id}/icons/`.
 *  - No local absolute paths / original filenames are stored.
 *  - Images re-validated (type/size) before upload; storage cleaned on failure.
 *
 * NOTE: market_icons / market_icon_packs are in our Supabase project but the
 * generated types (types.ts) currently point at a different project, so those
 * two tables are accessed via an `any` cast until types are unified.
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

type UploadedImage = { image_path: string; sha256: string; name: string; format: string };

async function uploadOneImage(userId: string, ic: IconToUpload): Promise<UploadedImage> {
  if (!ic.imageUrl) throw new Error(`${ic.title}: 이미지 경로가 없습니다.`);
  // cache:"no-store" — 썸네일 <img> 캐시(비-CORS)와 충돌 방지
  const res = await fetch(localEngineUrl(ic.imageUrl), { cache: "no-store" });
  if (!res.ok) throw new Error(`${ic.title}: 이미지를 불러올 수 없습니다 (${res.status})`);
  const blob = await res.blob();
  const ext = ALLOWED_MIME[blob.type];
  if (!ext) throw new Error(`${ic.title}: PNG, GIF, JPEG 이미지만 가능합니다.`);
  if (blob.size > MAX_ICON_BYTES) throw new Error(`${ic.title}: 5MB 이하만 가능합니다.`);

  const sha = await sha256Hex(blob);
  const path = `${userId}/icons/${crypto.randomUUID()}.${ext}`;
  const up = await supabase.storage
    .from(MARKET_BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: false });
  if (up.error) throw up.error;

  const name = sanitizeText(ic.title).slice(0, ICON_LIMITS.nameMax) || "아이콘";
  return { image_path: path, sha256: sha, name, format: ext };
}

async function cleanup(paths: string[]) {
  if (paths.length === 0) return;
  try {
    await supabase.storage.from(MARKET_BUCKET).remove(paths);
  } catch {
    /* ignore */
  }
}

export type PublishResult = { ok: boolean; mode: "single" | "pack"; error?: string };

/**
 * 아이콘 1개면 단일(market_icons), 2개 이상이면 하나의 팩(market_icon_packs)으로 올린다.
 * 팩은 packName 필수.
 */
export async function publishIcons(
  icons: IconToUpload[],
  opts: { mode: "single" | "pack"; name: string; tagsRaw: string; isPublic: boolean },
  onProgress?: (done: number, total: number) => void,
): Promise<PublishResult> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new MarketIconUploadError("로그인이 필요합니다.");
  if (icons.length === 0) throw new MarketIconUploadError("올릴 아이콘이 없습니다.");

  const isPack = opts.mode === "pack";
  const tags = parseTags(opts.tagsRaw);

  // 1) 모든 이미지 업로드 (하나라도 실패하면 정리 후 중단)
  const uploaded: UploadedImage[] = [];
  const paths: string[] = [];
  try {
    for (let i = 0; i < icons.length; i++) {
      const one = await uploadOneImage(user.id, icons[i]);
      uploaded.push(one);
      paths.push(one.image_path);
      onProgress?.(i + 1, icons.length);
    }
  } catch (e) {
    await cleanup(paths);
    return { ok: false, mode: isPack ? "pack" : "single", error: e instanceof Error ? e.message : String(e) };
  }

  // 2) DB 기록
  try {
    if (isPack) {
      const packName = sanitizeText(opts.name || "").slice(0, ICON_LIMITS.nameMax) || "아이콘 팩";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("market_icon_packs").insert({
        owner_id: user.id,
        name: packName,
        tags,
        icons: uploaded.map((u) => ({ image_path: u.image_path, name: u.name, sha256: u.sha256 })),
        icon_count: uploaded.length,
        is_public: opts.isPublic,
      });
      if (error) throw error;
    } else {
      const u = uploaded[0];
      const singleName = sanitizeText(opts.name || "").slice(0, ICON_LIMITS.nameMax) || u.name;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("market_icons").insert({
        owner_id: user.id,
        name: singleName,
        tags,
        image_path: u.image_path,
        sha256: u.sha256,
        format: u.format,
        is_public: opts.isPublic,
      });
      if (error) throw error;
    }
    return { ok: true, mode: isPack ? "pack" : "single" };
  } catch (e) {
    await cleanup(paths);
    return { ok: false, mode: isPack ? "pack" : "single", error: e instanceof Error ? e.message : String(e) };
  }
}
