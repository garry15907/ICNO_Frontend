/**
 * Uploads a local-engine preset to the cloud marketplace (Supabase).
 *
 * SECURITY RULES (do not relax):
 *  - `target_path` (the user's local executable path) is NEVER uploaded.
 *    Only image references + layout values are persisted.
 *  - No local absolute paths / original filenames are stored. Storage
 *    object names are random UUIDs under `{user.id}/`.
 *  - `owner_id` always comes from the authenticated session, never from
 *    form input. RLS (`market_presets_insert`) enforces this server-side.
 */
import { supabase } from "@/integrations/supabase/client";
import { localEngineUrl, type PresetModel } from "@/services/localEngineApi";

export const MARKET_BUCKET = "market-preset-images";

export const LIMITS = {
  maxIcons: 30,
  maxIconBytes: 5 * 1024 * 1024,
  maxWallpaperBytes: 15 * 1024 * 1024,
  maxTotalBytes: 50 * 1024 * 1024,
  nameMax: 60,
  descriptionMax: 500,
  tagMax: 20,
  tagCount: 10,
} as const;

const ALLOWED_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
};

export class MarketUploadError extends Error {}

/** Strip control characters and collapse whitespace. */
export function sanitizeText(input: string): string {
  return input
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F\u200B-\u200D\uFEFF]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const tag = sanitizeText(part).replace(/^#/, "");
    if (!tag) continue;
    if (tag.length > LIMITS.tagMax) continue;
    seen.add(tag);
    if (seen.size >= LIMITS.tagCount) break;
  }
  return [...seen];
}

async function fetchImageBlob(url: string, label: string): Promise<Blob> {
  let res: Response;
  try {
    res = await fetch(localEngineUrl(url), { cache: "no-store" });
  } catch {
    throw new MarketUploadError(
      `${label} 이미지를 불러올 수 없습니다. ICNO Desktop App이 실행 중인지 확인해주세요.`,
    );
  }
  if (!res.ok) throw new MarketUploadError(`${label} 이미지를 불러올 수 없습니다. (${res.status})`);
  return await res.blob();
}

function checkMime(blob: Blob, label: string): string {
  const ext = ALLOWED_MIME[blob.type];
  if (!ext) {
    throw new MarketUploadError(`${label}: PNG, JPEG, GIF 이미지만 업로드할 수 있습니다.`);
  }
  return ext;
}

export type MarketUploadInput = {
  preset: PresetModel;
  name: string;
  description: string;
  tagsRaw: string;
  isPublic: boolean;
};

export type MarketUploadResult = { id: string; name: string };

export async function uploadPresetToMarket(input: MarketUploadInput): Promise<MarketUploadResult> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new MarketUploadError("로그인이 필요합니다.");

  const name = sanitizeText(input.name).slice(0, LIMITS.nameMax);
  if (!name) throw new MarketUploadError("프리셋 이름을 입력해주세요.");
  const description = sanitizeText(input.description).slice(0, LIMITS.descriptionMax) || null;
  const tags = parseTags(input.tagsRaw);

  const icons = (input.preset.icons ?? []).filter((i) => !!i.image_url);
  if (icons.length > LIMITS.maxIcons) {
    throw new MarketUploadError(`아이콘은 최대 ${LIMITS.maxIcons}개까지 올릴 수 있습니다.`);
  }

  // ── 1) collect blobs from the local engine + client-side pre-validation ──
  let total = 0;
  let wallpaperBlob: Blob | null = null;
  let wallpaperExt = "png";
  if (input.preset.wallpaper_url) {
    wallpaperBlob = await fetchImageBlob(input.preset.wallpaper_url, "배경화면");
    wallpaperExt = checkMime(wallpaperBlob, "배경화면");
    if (wallpaperBlob.size > LIMITS.maxWallpaperBytes) {
      throw new MarketUploadError("배경화면 이미지는 15MB 이하만 올릴 수 있습니다.");
    }
    total += wallpaperBlob.size;
  }

  const iconBlobs: { blob: Blob; ext: string; icon: NonNullable<PresetModel["icons"]>[number] }[] = [];
  for (const icon of icons) {
    const label = `아이콘 "${sanitizeText(icon.icon_name ?? "") || "이름 없음"}"`;
    const blob = await fetchImageBlob(icon.image_url!, label);
    const ext = checkMime(blob, label);
    if (blob.size > LIMITS.maxIconBytes) {
      throw new MarketUploadError(`${label}: 아이콘 이미지는 5MB 이하만 올릴 수 있습니다.`);
    }
    total += blob.size;
    if (total > LIMITS.maxTotalBytes) {
      throw new MarketUploadError("전체 이미지 용량이 50MB를 초과했습니다.");
    }
    iconBlobs.push({ blob, ext, icon });
  }

  // ── 2) upload to Storage (UUID object names only) ────────────────────────
  const uploaded: string[] = [];
  const put = async (blob: Blob, ext: string) => {
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from(MARKET_BUCKET)
      .upload(path, blob, { contentType: blob.type, upsert: false });
    if (error) throw new MarketUploadError(`이미지 업로드 실패: ${error.message}`);
    uploaded.push(path);
    return path;
  };

  try {
    const wallpaperPath = wallpaperBlob ? await put(wallpaperBlob, wallpaperExt) : null;

    const iconRows: Record<string, string | number | boolean | null>[] = [];
    for (const { blob, ext, icon } of iconBlobs) {
      const image_path = await put(blob, ext);
      // Layout fields ONLY — target_path is intentionally excluded.
      iconRows.push({
        image_path,
        icon_name: sanitizeText(icon.icon_name ?? "").slice(0, 60) || null,
        x: icon.x ?? 0,
        y: icon.y ?? 0,
        size: icon.size ?? 64,
        show_name: icon.show_name ?? true,
        font_family: icon.font_family ?? null,
        font_size: icon.font_size ?? null,
        font_bold: icon.font_bold ?? null,
        font_italic: icon.font_italic ?? null,
        font_color: icon.font_color ?? null,
        outline_color: icon.outline_color ?? null,
      });
    }

    const canvas = {
      w: input.preset.canvas?.w ?? 1920,
      h: input.preset.canvas?.h ?? 1080,
    };

    const { data, error } = await supabase
      .from("market_presets")
      .insert({
        owner_id: user.id, // session auth.uid(), never form input
        name,
        description,
        tags,
        wallpaper_path: wallpaperPath,
        canvas,
        icons: iconRows as unknown as never,
        is_public: input.isPublic,
      })
      .select("id, name")
      .single();

    if (error) throw new MarketUploadError(`마켓 등록 실패: ${error.message}`);
    return { id: data.id, name: data.name };
  } catch (err) {
    // best-effort cleanup of partially uploaded objects
    if (uploaded.length) {
      try {
        await supabase.storage.from(MARKET_BUCKET).remove(uploaded);
      } catch {
        /* ignore cleanup failure */
      }
    }
    throw err;
  }
}