import sunset from "@/assets/wallpapers/sunset.jpg";
import kirby from "@/assets/wallpapers/kirby.jpg";
import deepsea from "@/assets/wallpapers/deepsea.jpg";
import minimal from "@/assets/wallpapers/minimal.jpg";
import pixel from "@/assets/wallpapers/pixel.jpg";
import cat from "@/assets/wallpapers/cat.jpg";
import pastel from "@/assets/wallpapers/pastel.jpg";
import neon from "@/assets/wallpapers/neon.jpg";

export const wallpapers = { sunset, kirby, deepsea, minimal, pixel, cat, pastel, neon };

export type IconAsset = {
  id: string;
  label: string;
  fileName: string;
  fileType: "PNG" | "SVG" | "ICO";
  size: { w: number; h: number };
  position: { x: number; y: number };
  emoji: string; // visual stand-in for icon image in the prototype
  hover?: boolean;
  /** URL/data URL for a user-selected icon image, when the user swapped
   * the default emoji stand-in for a real asset. */
  imageUrl?: string;
  /** Reference back to the user icon library asset that supplied the image. */
  userIconAssetId?: string;
};

export type MarketplacePreset = {
  id: string;
  name: string;
  creator: { name: string; role: string; avatar: string };
  thumbnail: string;
  wallpaperName: string;
  resolution: string;
  price: number; // 0 = free
  rating: number;
  reviews: number;
  downloads: number;
  tags: string[];
  category: string;
  description: string;
  icons: IconAsset[];
  hoverIcons: { id: string; fileName: string; label: string; emoji: string }[];
  license: string;
  // 크리에이터가 이 프리셋을 제작한 해상도. 사용자 필터/안내의 기준값.
  creatorResolutionType: CreatorResolutionType;
  creatorResolutionWidth: number;
  creatorResolutionHeight: number;
  creatorResolutionLabel: string;
};

export type CreatorResolutionType = "FHD" | "QHD" | "UHD" | "CUSTOM";

// =====================================================
// 공통 Preset 타입 (탐색·보관함 공용)
// =====================================================

export type LibraryMeta = {
  libraryId: string;
  originalPresetId: string;
  savedAt: string;
  updatedAt: string;
  isApplied: boolean;
  lastAppliedAt: string | null;
  isModified: boolean;
};

/**
 * 공통 Preset — 탐색과 보관함이 동일한 구조를 사용한다.
 * MarketplacePreset을 확장하며, 보관함에 저장된 프리셋에만 libraryMeta가 붙는다.
 * 어디서 렌더링되든 같은 필드로 접근 가능하다.
 */
export type Preset = MarketplacePreset & {
  libraryMeta?: LibraryMeta;
};

/** MarketplacePreset을 공통 Preset으로 정규화 (필요 시 libraryMeta 부착) */
export function toPreset(mp: MarketplacePreset, meta?: LibraryMeta): Preset {
  return meta ? { ...mp, libraryMeta: meta } : { ...mp };
}

export const isLibraryPresetView = (p: Pick<Preset, "libraryMeta">) => !!p.libraryMeta;

/**
 * LibraryPreset → MarketplacePreset 어댑터.
 * 보관함에서도 탐색과 동일한 상세 모달을 보여주기 위해 사용.
 * sourceMarketId가 있으면 원본 마켓 프리셋을 그대로 반환, 없으면 shim을 만든다.
 */
export function libraryPresetToMarketplace(lp: LibraryPreset): MarketplacePreset {
  if (lp.sourceMarketId) {
    const mp = marketplacePresets.find((m) => m.id === lp.sourceMarketId);
    if (mp) return mp;
  }
  return {
    id: lp.id,
    name: lp.name,
    creator: { name: "나", role: "내가 만든 프리셋", avatar: "👤" },
    thumbnail: lp.thumbnail,
    wallpaperName: "wallpaper.jpg",
    resolution: "1920 × 1080",
    price: 0,
    rating: 0,
    reviews: 0,
    downloads: 0,
    tags: lp.tags,
    category: "내 프리셋",
    description: lp.description,
    icons: lp.icons,
    hoverIcons: [],
    license: "개인 사용",
    ...makeCreatorResolution(1920, 1080),
  };
}

export function classifyResolutionType(w: number, h: number): CreatorResolutionType {
  if (w === 1920 && h === 1080) return "FHD";
  if (w === 2560 && h === 1440) return "QHD";
  if (w === 3840 && h === 2160) return "UHD";
  return "CUSTOM";
}

export function creatorResolutionLabelOf(type: CreatorResolutionType, w: number, h: number): string {
  if (type === "CUSTOM") return `Custom ${w} × ${h}`;
  return `${type} ${w} × ${h}`;
}

function makeCreatorResolution(width: number, height: number) {
  const type = classifyResolutionType(width, height);
  return {
    creatorResolutionType: type,
    creatorResolutionWidth: width,
    creatorResolutionHeight: height,
    creatorResolutionLabel: creatorResolutionLabelOf(type, width, height),
  };
}

export const currentDisplayResolution = {
  width: 2560,
  height: 1440,
  label: "QHD" as CreatorResolutionType,
};

/** 해상도 라벨 헬퍼 */
export function resolutionLabelFor(w: number, h: number): string {
  if (w === 1920 && h === 1080) return "FHD";
  if (w === 2560 && h === 1440) return "QHD";
  if (w === 3840 && h === 2160) return "UHD";
  if (w === 3440 && h === 1440) return "Ultrawide";
  if (w === 2560 && h === 1600) return "노트북";
  return "Custom";
}

/**
 * 마켓 실데이터는 아직 백엔드에 연결되지 않았습니다.
 * 목(mock) 데이터를 제거했으므로 UI는 빈 상태로 렌더됩니다.
 */
export const marketplacePresets: MarketplacePreset[] = [];

export type LibraryStatus =
  | "현재 적용 중"
  | "매핑 필요"
  | "로컬 수정됨"
  | "다운로드됨"
  | "구매함"
  | "내가 만든 프리셋";

export type LibraryPreset = {
  id: string;
  sourceMarketId?: string;
  name: string;
  thumbnail: string;
  iconCount: number;
  mappedCount: number;
  status: LibraryStatus;
  lastModified: string;
  description: string;
  tags: string[];
  icons: (IconAsset & { mappedTo?: string })[];
};

export const libraryPresets: LibraryPreset[] = [];

export const wishlistIds: string[] = [];
export const downloadedIds: string[] = [];
export const purchasedIds: string[] = [];

// =====================================================
// 마켓 상품 확장: 아이콘 단품 / 아이콘 팩
// =====================================================

export type MarketItemType = "preset" | "icon" | "iconpack";

export type MarketIcon = {
  id: string;
  type: "icon";
  name: string;
  emoji: string; // visual stand-in
  creator: { name: string; role: string; avatar: string };
  price: number;
  rating: number;
  reviews: number;
  downloads: number;
  tags: string[];
  category: string;
  description: string;
  fileName: string;
  fileType: "PNG" | "SVG" | "ICO";
  resolution: string;
  transparent: boolean;
  style: string;
  license: string;
};

export type MarketIconPack = {
  id: string;
  type: "iconpack";
  name: string;
  thumbnailEmojis: string[]; // grid preview
  creator: { name: string; role: string; avatar: string };
  price: number;
  rating: number;
  reviews: number;
  downloads: number;
  tags: string[];
  category: string;
  description: string;
  icons: { id: string; label: string; emoji: string; fileName: string; fileType: "PNG" | "SVG" | "ICO"; resolution: string }[];
  license: string;
};

export type MarketItem =
  | (MarketplacePreset & { type: "preset" })
  | MarketIcon
  | MarketIconPack;

export const marketIcons: MarketIcon[] = [];

export const marketIconPacks: MarketIconPack[] = [];

/** 통합된 마켓 아이템 목록 (탐색에서 사용) */
export const marketItems: MarketItem[] = [];

// =====================================================
// 사용자 아이콘 보관함
// =====================================================

export type IconLibraryStatus = "다운로드됨" | "구매함" | "내가 만든 아이콘";

export type LibraryIcon = {
  id: string;
  kind: "icon";
  sourceMarketId?: string;
  name: string;
  emoji: string;
  fileName: string;
  fileType: "PNG" | "SVG" | "ICO";
  resolution: string;
  tags: string[];
  status: IconLibraryStatus;
  source?: string; // e.g. 마켓 또는 출처
};

export type LibraryIconPack = {
  id: string;
  kind: "iconpack";
  sourceMarketId?: string;
  name: string;
  thumbnailEmojis: string[];
  iconCount: number;
  icons: { id: string; label: string; emoji: string; fileName: string; fileType: "PNG" | "SVG" | "ICO"; resolution: string }[];
  tags: string[];
  status: IconLibraryStatus;
  source?: string;
};

export const libraryIcons: LibraryIcon[] = [];

export const libraryIconPacks: LibraryIconPack[] = [];




export type Review = {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
  likes: number;
};

export const reviews: Review[] = [];



export type FollowedCreator = {
  name: string;
  role: string;
  avatar: string;
  uploads: number;
  followers: number;
  followedAt: string;
  isNew?: boolean;
};

export const followedCreators: FollowedCreator[] = [];