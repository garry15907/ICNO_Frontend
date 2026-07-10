// User icon library service. Backed by localStorage today; swap for
// Supabase/Local Agent later by replacing the read/write internals only.

import type { MarketIcon, MarketIconPack } from "@/data/mockData";

export type UserIconSource = "marketplace_download" | "iconpack_download" | "upload";

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