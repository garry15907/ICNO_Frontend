// User icon library service. Backed by localStorage today; swap for
// Supabase/Local Agent later by replacing the read/write internals only.

import type { MarketIcon, MarketIconPack } from "@/data/mockData";
import { getCustomImages, localEngineUrl } from "./localEngineApi";

export type UserIconSource = "marketplace_download" | "iconpack_download" | "upload";

/**
 * Unified UI-facing origin label. `source` is the historical value stored
 * per-asset; `origin` is what the user-facing "내 보관함" should reason
 * about. The mapping is derived — see `originOf()`.
 */
export type LibraryOrigin =
  | "user-upload"
  | "market-download"
  | "icon-pack"
  | "local-engine";

export function originOf(a: UserIconAsset): LibraryOrigin {
  if (a.source === "upload") return "user-upload";
  if (a.source === "iconpack_download") return "icon-pack";
  if (a.source === "marketplace_download") return "market-download";
  return "local-engine";
}

export type UserIconAsset = {
  id: string;
  userId: string;
  originalIconId: string;
  packId?: string;
  title: string;
  creatorName: string;
  thumbnailUrl: string;
  imageUrl: string;
  fileName: string;
  fileFormat: "PNG" | "SVG" | "ICO";
  width: number;
  height: number;
  hasTransparentBackground: boolean;
  category: string;
  tags: string[];
  license: string;
  downloadedAt: string; // ISO
  source: UserIconSource;
  isFavorite: boolean;
  // Emoji stand-in for the prototype; real builds swap for imageUrl.
  emoji?: string;
  /**
   * Cached local FastAPI path returned by `POST /api/icons/upload`.
   * Reused whenever a preset needs this icon so we never re-upload the
   * same asset twice. Empty until the icon has been sent to the engine.
   */
  local_image_path?: string;
  /**
   * Server-issued asset id returned by `POST /api/icons/upload`. Required
   * to reference this icon inside a saved `PresetModel.icons[]` on the
   * local FastAPI engine. Empty for emoji/marketplace stand-ins that
   * were never uploaded as a real file.
   */
  asset_id?: string;
  /** Server-side storage filename (returned by upload). */
  storage_filename?: string;
};

const STORAGE_KEY = "icno-user-icons-v1";
const USAGE_KEY = "icno-user-icon-usage-v1"; // { [userIconId]: string[] presetIds }
const CURRENT_USER = "current_user";

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function safeWrite(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function parseResolution(res: string): { w: number; h: number } {
  const m = res.match(/(\d+)\s*[×x]\s*(\d+)/);
  if (!m) return { w: 256, h: 256 };
  return { w: parseInt(m[1], 10), h: parseInt(m[2], 10) };
}

export function getUserIconAssets(): UserIconAsset[] {
  return safeRead<UserIconAsset[]>(STORAGE_KEY, []);
}

/**
 * Merge the localStorage-side metadata with the actual files known to the
 * local FastAPI engine (`GET /api/icons/images`). Any file present on
 * disk but missing from local metadata is injected as a `local-engine`
 * origin asset so it shows up in the unified 보관함 list. Never removes
 * existing metadata entries — the reverse-reconciliation (delete on disk
 * but still in metadata) is handled by the missing-file UI banner.
 */
export async function reconcileWithLocalEngine(): Promise<UserIconAsset[]> {
  let images: Awaited<ReturnType<typeof getCustomImages>>["images"] = [];
  try {
    const res = await getCustomImages();
    images = res.images ?? [];
  } catch {
    // Engine offline — keep current metadata as-is.
    return getUserIconAssets();
  }
  const current = getUserIconAssets();
  const knownFilenames = new Set(
    current.map((a) => a.fileName).filter(Boolean) as string[],
  );
  const knownPaths = new Set(
    current.map((a) => a.local_image_path).filter(Boolean) as string[],
  );
  const orphans: UserIconAsset[] = [];
  for (const img of images ?? []) {
    const filename = String(img.filename ?? "");
    const localPath = String(img.path ?? "");
    if (!filename) continue;
    if (knownFilenames.has(filename)) continue;
    if (localPath && knownPaths.has(localPath)) continue;
    const url = img.url ? localEngineUrl(String(img.url)) : "";
    const ext = filename.split(".").pop()?.toUpperCase() ?? "PNG";
    orphans.push({
      id: `ua-engine-${filename}`,
      userId: CURRENT_USER,
      originalIconId: `engine:${filename}`,
      title: filename.replace(/\.[^.]+$/, ""),
      creatorName: "@local",
      thumbnailUrl: url,
      imageUrl: url,
      fileName: filename,
      fileFormat: (["PNG", "SVG", "ICO"].includes(ext) ? ext : "PNG") as any,
      width: 256,
      height: 256,
      hasTransparentBackground: true,
      category: "local",
      tags: [],
      license: "local",
      downloadedAt: new Date().toISOString(),
      source: "upload",
      isFavorite: false,
      local_image_path: localPath || undefined,
    });
  }
  if (orphans.length) writeAssets([...orphans, ...current]);
  return getUserIconAssets();
}

export function getUserIconAssetById(id: string): UserIconAsset | undefined {
  return getUserIconAssets().find((i) => i.id === id);
}

export function isIconDownloaded(originalIconId: string): boolean {
  return getUserIconAssets().some((i) => i.originalIconId === originalIconId);
}

function writeAssets(assets: UserIconAsset[]) {
  safeWrite(STORAGE_KEY, assets);
}

export function downloadIconToLibrary(icon: MarketIcon): UserIconAsset | null {
  const current = getUserIconAssets();
  if (current.some((a) => a.originalIconId === icon.id)) return null;
  const { w, h } = parseResolution(icon.resolution);
  const asset: UserIconAsset = {
    id: `ua-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId: CURRENT_USER,
    originalIconId: icon.id,
    title: icon.name,
    creatorName: `@${icon.creator.name}`,
    thumbnailUrl: "",
    imageUrl: "",
    fileName: icon.fileName,
    fileFormat: icon.fileType,
    width: w,
    height: h,
    hasTransparentBackground: icon.transparent,
    category: icon.category,
    tags: icon.tags,
    license: icon.license,
    downloadedAt: new Date().toISOString(),
    source: "marketplace_download",
    isFavorite: false,
    emoji: icon.emoji,
  };
  writeAssets([asset, ...current]);
  return asset;
}

export function downloadIconPackToLibrary(
  pack: MarketIconPack,
): { added: UserIconAsset[]; skipped: number } {
  const current = getUserIconAssets();
  const existing = new Set(current.map((a) => a.originalIconId));
  const added: UserIconAsset[] = [];
  let skipped = 0;
  for (const p of pack.icons) {
    if (existing.has(p.id)) {
      skipped++;
      continue;
    }
    const { w, h } = parseResolution(p.resolution);
    added.push({
      id: `ua-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId: CURRENT_USER,
      originalIconId: p.id,
      packId: pack.id,
      title: p.label,
      creatorName: `@${pack.creator.name}`,
      thumbnailUrl: "",
      imageUrl: "",
      fileName: p.fileName,
      fileFormat: p.fileType,
      width: w,
      height: h,
      hasTransparentBackground: true,
      category: pack.category,
      tags: pack.tags,
      license: pack.license,
      downloadedAt: new Date().toISOString(),
      source: "iconpack_download",
      isFavorite: false,
      emoji: p.emoji,
    });
    existing.add(p.id);
  }
  if (added.length) writeAssets([...added, ...current]);
  return { added, skipped };
}

export function deleteUserIconAsset(id: string): void {
  const next = getUserIconAssets().filter((a) => a.id !== id);
  writeAssets(next);
  // clean usage
  const usage = safeRead<Record<string, string[]>>(USAGE_KEY, {});
  if (usage[id]) {
    delete usage[id];
    safeWrite(USAGE_KEY, usage);
  }
}

export function renameUserIconAsset(id: string, newTitle: string): void {
  const next = getUserIconAssets().map((a) =>
    a.id === id ? { ...a, title: newTitle } : a,
  );
  writeAssets(next);
}

/**
 * Persist the FastAPI-side path for a boarding-house icon so future
 * preset applies don't re-upload the same bytes. Called once, after the
 * first successful `POST /api/icons/upload` for this asset.
 */
export function setUserIconLocalPath(id: string, localPath: string): void {
  const next = getUserIconAssets().map((a) =>
    a.id === id ? { ...a, local_image_path: localPath } : a,
  );
  writeAssets(next);
}

/**
 * Persist the engine-issued asset_id + storage_filename after a
 * successful `POST /api/icons/upload`. Called at most once per asset.
 */
export function setUserIconBackendIds(
  id: string,
  patch: { asset_id?: string; local_image_path?: string; storage_filename?: string },
): void {
  const next = getUserIconAssets().map((a) =>
    a.id === id ? { ...a, ...patch } : a,
  );
  writeAssets(next);
}

/** Split the library into stand-alone icons vs icon-pack icons. */
export function groupUserIconAssets(assets: UserIconAsset[]): {
  standalone: UserIconAsset[];
  packs: { packId: string; items: UserIconAsset[] }[];
} {
  const standalone: UserIconAsset[] = [];
  const byPack = new Map<string, UserIconAsset[]>();
  for (const a of assets) {
    if (a.packId) {
      const list = byPack.get(a.packId) ?? [];
      list.push(a);
      byPack.set(a.packId, list);
    } else {
      standalone.push(a);
    }
  }
  return {
    standalone,
    packs: Array.from(byPack.entries()).map(([packId, items]) => ({ packId, items })),
  };
}

export function applyUserIconToPreset(
  libraryPresetId: string,
  iconMappingId: string,
  userIconAssetId: string,
): void {
  const usage = safeRead<Record<string, string[]>>(USAGE_KEY, {});
  const list = usage[userIconAssetId] ?? [];
  const marker = `${libraryPresetId}::${iconMappingId}`;
  if (!list.includes(marker)) {
    usage[userIconAssetId] = [...list, marker];
    safeWrite(USAGE_KEY, usage);
  }
}

export function getIconUsage(userIconAssetId: string): { presetIds: string[]; count: number } {
  const usage = safeRead<Record<string, string[]>>(USAGE_KEY, {});
  const markers = usage[userIconAssetId] ?? [];
  const presetIds = Array.from(new Set(markers.map((m) => m.split("::")[0])));
  return { presetIds, count: presetIds.length };
}

export function subscribeToIconLibrary(cb: () => void): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === USAGE_KEY) cb();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}