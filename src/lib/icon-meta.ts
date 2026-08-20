/**
 * 보관함 아이콘의 로컬 메타데이터 (localStorage).
 * 로컬 엔진은 아이콘을 평면(개별 파일)으로 저장하므로, "팩 묶음"과
 * "마켓 제작자" 정보는 storage_filename 을 키로 프론트에서 얹는다.
 * (이 PC 로컬 전용 — 캐시 삭제/다른 PC에선 유지되지 않음)
 */
const PACKS_KEY = "icno.icon-packs";
const ORIGINS_KEY = "icno.icon-origins";
const WALLPAPER_ORIGINS_KEY = "icno.wallpaper-origins";

export type LibraryIconPack = {
  id: string;
  name: string;
  storageFilenames: string[];
  createdAt: string;
};

export type IconOrigin = {
  ownerId?: string; // 마켓 제작자(uploader)
  marketType?: "icon" | "pack" | "wallpaper";
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
    window.dispatchEvent(new Event("icon-meta:refresh"));
  } catch {
    /* ignore */
  }
}

// ── 팩 ──────────────────────────────────────────────────────────────────────
export function getPacks(): LibraryIconPack[] {
  return read<LibraryIconPack[]>(PACKS_KEY, []);
}
export function addPack(name: string, storageFilenames: string[]): LibraryIconPack {
  const pack: LibraryIconPack = {
    id: crypto.randomUUID(),
    name: name.trim() || "아이콘 팩",
    storageFilenames: storageFilenames.filter(Boolean),
    createdAt: new Date().toISOString(),
  };
  write(PACKS_KEY, [pack, ...getPacks()]);
  return pack;
}
export function renamePack(id: string, name: string) {
  write(PACKS_KEY, getPacks().map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p)));
}
export function deletePack(id: string) {
  write(PACKS_KEY, getPacks().filter((p) => p.id !== id));
}
export function addIconsToPack(id: string, storageFilenames: string[]) {
  write(
    PACKS_KEY,
    getPacks().map((p) =>
      p.id === id
        ? { ...p, storageFilenames: [...new Set([...p.storageFilenames, ...storageFilenames.filter(Boolean)])] }
        : p,
    ),
  );
}
export function removeIconFromPack(id: string, storageFilename: string) {
  write(
    PACKS_KEY,
    getPacks().map((p) =>
      p.id === id ? { ...p, storageFilenames: p.storageFilenames.filter((f) => f !== storageFilename) } : p,
    ),
  );
}

// ── 마켓 제작자 정보 ────────────────────────────────────────────────────────
export function getOrigins(): Record<string, IconOrigin> {
  return read<Record<string, IconOrigin>>(ORIGINS_KEY, {});
}
export function setIconOrigin(storageFilename: string, origin: IconOrigin) {
  if (!storageFilename) return;
  const all = getOrigins();
  all[storageFilename] = { ...all[storageFilename], ...origin };
  write(ORIGINS_KEY, all);
}
export function getIconOrigin(storageFilename?: string | null): IconOrigin | undefined {
  if (!storageFilename) return undefined;
  return getOrigins()[storageFilename];
}

// ── 배경화면 마켓 제작자 정보 ──────────────────────────────────────────────
export function getWallpaperOrigins(): Record<string, IconOrigin> {
  return read<Record<string, IconOrigin>>(WALLPAPER_ORIGINS_KEY, {});
}
export function setWallpaperOrigin(storageFilename: string, origin: IconOrigin) {
  if (!storageFilename) return;
  const all = getWallpaperOrigins();
  all[storageFilename] = { ...all[storageFilename], ...origin };
  write(WALLPAPER_ORIGINS_KEY, all);
}
export function getWallpaperOrigin(storageFilename?: string | null): IconOrigin | undefined {
  if (!storageFilename) return undefined;
  return getWallpaperOrigins()[storageFilename];
}
