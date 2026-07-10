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

const ic = (
  id: string,
  label: string,
  emoji: string,
  x: number,
  y: number,
  size = 96,
): IconAsset => ({
  id,
  label,
  emoji,
  fileName: `${id}.png`,
  fileType: "PNG",
  size: { w: size, h: size },
  position: { x, y },
});

const baseIcons: IconAsset[] = [
  ic("game", "게임", "🎮", 6, 8),
  ic("discord", "디스코드", "💬", 18, 8),
  ic("steam", "스팀", "🕹️", 30, 8),
  ic("youtube", "유튜브", "▶️", 6, 26),
  ic("chrome", "크롬", "🌐", 18, 26),
  ic("photos", "사진", "🖼️", 30, 26),
  ic("music", "음악", "🎵", 6, 44),
  ic("notes", "메모", "📝", 18, 44),
  ic("mail", "메일", "✉️", 30, 44),
  ic("calendar", "캘린더", "📅", 6, 62),
  ic("settings", "설정", "⚙️", 18, 62),
  ic("trash", "휴지통", "🗑️", 30, 62),
];

export const marketplacePresets: MarketplacePreset[] = [
  {
    id: "mp-001",
    name: "노을",
    creator: { name: "haneul", role: "탑 크리에이터", avatar: "🌅" },
    thumbnail: wallpapers.sunset,
    wallpaperName: "sunset.jpg",
    resolution: "1920 × 1080",
    price: 0,
    rating: 4.8,
    reviews: 312,
    downloads: 12480,
    tags: ["따뜻한", "자연", "미니멀"],
    category: "자연",
    description: "따뜻한 노을빛 톤의 미니멀 데스크톱 프리셋입니다. 부드러운 그라디언트와 손글씨 라벨이 포인트.",
    icons: baseIcons,
    hoverIcons: [
      { id: "h-game", fileName: "game_hover.gif", label: "게임", emoji: "✨" },
      { id: "h-music", fileName: "music_hover.gif", label: "음악", emoji: "🎶" },
    ],
    license: "개인 사용 가능 · 재배포 금지",
    ...makeCreatorResolution(1920, 1080),
  },
  {
    id: "mp-002",
    name: "커비",
    creator: { name: "pinkpuff", role: "캐릭터 아티스트", avatar: "🩷" },
    thumbnail: wallpapers.kirby,
    wallpaperName: "kirby.png",
    resolution: "1920 × 1080",
    price: 4900,
    rating: 4.9,
    reviews: 821,
    downloads: 9320,
    tags: ["귀여움", "캐릭터", "핑크"],
    category: "캐릭터",
    description: "사랑스러운 캐릭터 아이콘 세트와 폭신한 배경이 어우러진 프리미엄 프리셋.",
    icons: baseIcons,
    hoverIcons: [],
    license: "개인 사용 · 비상업적",
    ...makeCreatorResolution(1920, 1080),
  },
  {
    id: "mp-003",
    name: "심해",
    creator: { name: "abyss", role: "디자이너", avatar: "🌊" },
    thumbnail: wallpapers.deepsea,
    wallpaperName: "deepsea.jpg",
    resolution: "2560 × 1440",
    price: 0,
    rating: 4.6,
    reviews: 145,
    downloads: 5210,
    tags: ["다크", "바다", "어두운"],
    category: "다크",
    description: "깊은 바다처럼 차분한 분위기의 다크 프리셋.",
    icons: baseIcons,
    hoverIcons: [],
    license: "개인 사용 가능",
    ...makeCreatorResolution(2560, 1440),
  },
  {
    id: "mp-004",
    name: "미니멀 블랙",
    creator: { name: "mono", role: "미니멀 스튜디오", avatar: "⬛" },
    thumbnail: wallpapers.minimal,
    wallpaperName: "minimal.jpg",
    resolution: "1920 × 1080",
    price: 0,
    rating: 4.7,
    reviews: 488,
    downloads: 18230,
    tags: ["미니멀", "블랙", "심플"],
    category: "미니멀",
    description: "단정한 블랙 톤의 절제된 프리셋.",
    icons: baseIcons,
    hoverIcons: [],
    license: "개인 사용 가능",
    ...makeCreatorResolution(1920, 1080),
  },
  {
    id: "mp-005",
    name: "픽셀 게임룸",
    creator: { name: "8bitcat", role: "픽셀 아티스트", avatar: "👾" },
    thumbnail: wallpapers.pixel,
    wallpaperName: "pixel.png",
    resolution: "1920 × 1080",
    price: 6900,
    rating: 4.95,
    reviews: 1023,
    downloads: 7710,
    tags: ["픽셀", "레트로", "게임"],
    category: "게임",
    description: "레트로한 픽셀 아트 게임룸 컨셉의 풀 프리셋.",
    icons: baseIcons,
    hoverIcons: [
      { id: "h-steam", fileName: "steam_hover.gif", label: "스팀", emoji: "💥" },
    ],
    license: "개인 · 상업 사용 가능",
    ...makeCreatorResolution(1920, 1080),
  },
  {
    id: "mp-006",
    name: "고양이 데스크",
    creator: { name: "nyancat", role: "일러스트레이터", avatar: "🐱" },
    thumbnail: wallpapers.cat,
    wallpaperName: "cat.jpg",
    resolution: "1920 × 1080",
    price: 3500,
    rating: 4.8,
    reviews: 234,
    downloads: 3420,
    tags: ["귀여움", "고양이", "일러스트"],
    category: "캐릭터",
    description: "포근한 고양이 일러스트가 가득한 프리셋.",
    icons: baseIcons,
    hoverIcons: [],
    license: "개인 사용 가능",
    ...makeCreatorResolution(2560, 1600),
  },
  {
    id: "mp-007",
    name: "파스텔 핑크",
    creator: { name: "soft", role: "디자이너", avatar: "🌸" },
    thumbnail: wallpapers.pastel,
    wallpaperName: "pastel.jpg",
    resolution: "1920 × 1080",
    price: 0,
    rating: 4.5,
    reviews: 99,
    downloads: 2280,
    tags: ["파스텔", "핑크", "부드러운"],
    category: "파스텔",
    description: "꿈꾸는 듯한 파스텔 핑크 프리셋.",
    icons: baseIcons,
    hoverIcons: [],
    license: "개인 사용 가능",
    ...makeCreatorResolution(1920, 1080),
  },
  {
    id: "mp-008",
    name: "네온 시티",
    creator: { name: "neonlab", role: "탑 크리에이터", avatar: "🌃" },
    thumbnail: wallpapers.neon,
    wallpaperName: "neon.jpg",
    resolution: "2560 × 1440",
    price: 7900,
    rating: 4.9,
    reviews: 612,
    downloads: 5410,
    tags: ["네온", "사이버펑크", "다크"],
    category: "사이버펑크",
    description: "사이버펑크 무드의 네온 시티 풀 프리셋.",
    icons: baseIcons,
    hoverIcons: [],
    license: "개인 · 상업 사용 가능",
    ...makeCreatorResolution(2560, 1440),
  },
];

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

export const libraryPresets: LibraryPreset[] = [
  {
    id: "lib-001",
    sourceMarketId: "mp-001",
    name: "노을",
    thumbnail: wallpapers.sunset,
    iconCount: 12,
    mappedCount: 12,
    status: "현재 적용 중",
    lastModified: "2026-04-29",
    description: "현재 데스크톱에 적용된 프리셋입니다.",
    tags: ["따뜻한", "자연"],
    icons: baseIcons.map((i) => ({ ...i, mappedTo: `C:/Apps/${i.label}.exe` })),
  },
  {
    id: "lib-002",
    sourceMarketId: "mp-005",
    name: "픽셀 게임룸",
    thumbnail: wallpapers.pixel,
    iconCount: 12,
    mappedCount: 8,
    status: "매핑 필요",
    lastModified: "2026-04-27",
    description: "구매한 프리셋. 일부 아이콘 매핑이 필요합니다.",
    tags: ["픽셀", "게임"],
    icons: baseIcons.map((i, idx) => ({
      ...i,
      mappedTo: idx < 8 ? `C:/Programs/${i.label}.exe` : undefined,
    })),
  },
  {
    id: "lib-003",
    name: "내 첫 프리셋",
    thumbnail: wallpapers.minimal,
    iconCount: 6,
    mappedCount: 6,
    status: "내가 만든 프리셋",
    lastModified: "2026-04-20",
    description: "직접 만든 미니멀 프리셋.",
    tags: ["미니멀"],
    icons: baseIcons.slice(0, 6).map((i) => ({ ...i, mappedTo: `C:/Apps/${i.label}.exe` })),
  },
  {
    id: "lib-004",
    sourceMarketId: "mp-003",
    name: "심해",
    thumbnail: wallpapers.deepsea,
    iconCount: 12,
    mappedCount: 12,
    status: "다운로드됨",
    lastModified: "2026-04-15",
    description: "다운로드한 프리셋.",
    tags: ["다크", "바다"],
    icons: baseIcons.map((i) => ({ ...i, mappedTo: `C:/Apps/${i.label}.exe` })),
  },
];

export const wishlistIds = ["mp-002", "mp-008", "ic-002", "ic-003", "pk-001"];
export const downloadedIds = ["mp-001", "mp-003", "mp-005"];
export const purchasedIds = ["mp-002", "mp-005", "mp-008"];

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

export const marketIcons: MarketIcon[] = [
  {
    id: "ic-001", type: "icon", name: "커비 별",
    emoji: "⭐", creator: { name: "pinkpuff", role: "캐릭터 아티스트", avatar: "🩷" },
    price: 0, rating: 4.9, reviews: 128, downloads: 4320,
    tags: ["귀여움", "캐릭터", "별"], category: "캐릭터",
    description: "사랑스러운 별 아이콘. 투명 배경 PNG.",
    fileName: "kirby_star.png", fileType: "PNG", resolution: "256 × 256",
    transparent: true, style: "캐릭터", license: "개인 사용 가능",
  },
  {
    id: "ic-002", type: "icon", name: "네온 폴더",
    emoji: "📁", creator: { name: "neonlab", role: "탑 크리에이터", avatar: "🌃" },
    price: 1900, rating: 4.7, reviews: 56, downloads: 1280,
    tags: ["네온", "사이버펑크", "폴더"], category: "사이버펑크",
    description: "사이버펑크 무드 폴더 아이콘.",
    fileName: "neon_folder.png", fileType: "PNG", resolution: "512 × 512",
    transparent: true, style: "네온", license: "개인 · 상업 사용 가능",
  },
  {
    id: "ic-003", type: "icon", name: "미니멀 디스코드",
    emoji: "💬", creator: { name: "mono", role: "미니멀 스튜디오", avatar: "⬛" },
    price: 0, rating: 4.8, reviews: 220, downloads: 8810,
    tags: ["미니멀", "블랙", "디스코드"], category: "미니멀",
    description: "단정한 미니멀 디스코드 아이콘.",
    fileName: "minimal_discord.svg", fileType: "SVG", resolution: "벡터",
    transparent: true, style: "미니멀", license: "개인 사용 가능",
  },
  {
    id: "ic-004", type: "icon", name: "픽셀 게임패드",
    emoji: "🎮", creator: { name: "8bitcat", role: "픽셀 아티스트", avatar: "👾" },
    price: 1500, rating: 4.95, reviews: 88, downloads: 920,
    tags: ["픽셀", "레트로", "게임"], category: "게임",
    description: "레트로 픽셀 게임패드 아이콘.",
    fileName: "pixel_pad.png", fileType: "PNG", resolution: "128 × 128",
    transparent: true, style: "픽셀", license: "개인 사용 가능",
  },
];

export const marketIconPacks: MarketIconPack[] = [
  {
    id: "pk-001", type: "iconpack", name: "파스텔 앱 아이콘 24종",
    thumbnailEmojis: ["🌸", "🍓", "🩷", "🎀", "🦄", "☁️"],
    creator: { name: "soft", role: "디자이너", avatar: "🌸" },
    price: 4900, rating: 4.9, reviews: 312, downloads: 3210,
    tags: ["파스텔", "핑크", "묶음"], category: "파스텔",
    description: "파스텔 톤 앱 아이콘 24종 묶음.",
    icons: Array.from({ length: 6 }).map((_, i) => ({
      id: `pk-001-${i}`, label: ["메일","사진","음악","메모","캘린더","설정"][i],
      emoji: ["💌","🖼️","🎵","📝","📅","⚙️"][i],
      fileName: `pastel_${i}.png`, fileType: "PNG", resolution: "256 × 256",
    })),
    license: "개인 사용 가능",
  },
  {
    id: "pk-002", type: "iconpack", name: "커비 아이콘 팩",
    thumbnailEmojis: ["🩷", "⭐", "🌈", "🍰", "🎈", "✨"],
    creator: { name: "pinkpuff", role: "캐릭터 아티스트", avatar: "🩷" },
    price: 0, rating: 4.85, reviews: 540, downloads: 6520,
    tags: ["귀여움", "캐릭터"], category: "캐릭터",
    description: "커비 컨셉 아이콘 팩 12종.",
    icons: Array.from({ length: 6 }).map((_, i) => ({
      id: `pk-002-${i}`, label: ["별","무지개","케이크","풍선","반짝","하트"][i],
      emoji: ["⭐","🌈","🍰","🎈","✨","💖"][i],
      fileName: `kirby_${i}.png`, fileType: "PNG", resolution: "256 × 256",
    })),
    license: "개인 사용 · 비상업적",
  },
  {
    id: "pk-003", type: "iconpack", name: "다크 미니멀 시스템 아이콘",
    thumbnailEmojis: ["⬛", "🔲", "▪️", "🔘", "⬜", "🔳"],
    creator: { name: "mono", role: "미니멀 스튜디오", avatar: "⬛" },
    price: 3500, rating: 4.75, reviews: 188, downloads: 2240,
    tags: ["다크", "미니멀", "시스템"], category: "다크",
    description: "다크 톤 시스템 아이콘 팩.",
    icons: Array.from({ length: 6 }).map((_, i) => ({
      id: `pk-003-${i}`, label: ["홈","검색","설정","파일","폴더","휴지통"][i],
      emoji: ["🏠","🔎","⚙️","📄","📁","🗑️"][i],
      fileName: `dark_${i}.svg`, fileType: "SVG", resolution: "벡터",
    })),
    license: "개인 사용 가능",
  },
];

/** 통합된 마켓 아이템 목록 (탐색에서 사용) */
export const marketItems: MarketItem[] = [
  ...marketplacePresets.map((p) => ({
    ...p,
    type: "preset" as const,
  })),
  ...marketIcons,
  ...marketIconPacks,
];

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

export const libraryIcons: LibraryIcon[] = [
  {
    id: "li-001", kind: "icon", sourceMarketId: "ic-001",
    name: "커비 별", emoji: "⭐",
    fileName: "kirby_star.png", fileType: "PNG", resolution: "256 × 256",
    tags: ["귀여움", "별"], status: "다운로드됨", source: "@pinkpuff",
  },
  {
    id: "li-002", kind: "icon", sourceMarketId: "ic-002",
    name: "네온 폴더", emoji: "📁",
    fileName: "neon_folder.png", fileType: "PNG", resolution: "512 × 512",
    tags: ["네온"], status: "구매함", source: "@neonlab",
  },
  {
    id: "li-003", kind: "icon",
    name: "내 첫 아이콘", emoji: "🎨",
    fileName: "my_first.png", fileType: "PNG", resolution: "128 × 128",
    tags: ["직접 제작"], status: "내가 만든 아이콘", source: "내가 만든 아이콘",
  },
];

export const libraryIconPacks: LibraryIconPack[] = [
  {
    id: "lp-001", kind: "iconpack", sourceMarketId: "pk-002",
    name: "커비 아이콘 팩", thumbnailEmojis: ["🩷", "⭐", "🌈", "🍰", "🎈", "✨"],
    iconCount: 6,
    icons: Array.from({ length: 6 }).map((_, i) => ({
      id: `lp-001-${i}`, label: ["별","무지개","케이크","풍선","반짝","하트"][i],
      emoji: ["⭐","🌈","🍰","🎈","✨","💖"][i],
      fileName: `kirby_${i}.png`, fileType: "PNG", resolution: "256 × 256",
    })),
    tags: ["귀여움"], status: "다운로드됨", source: "@pinkpuff",
  },
  {
    id: "lp-002", kind: "iconpack", sourceMarketId: "pk-001",
    name: "파스텔 앱 아이콘 24종", thumbnailEmojis: ["💌","🖼️","🎵","📝","📅","⚙️"],
    iconCount: 6,
    icons: Array.from({ length: 6 }).map((_, i) => ({
      id: `lp-002-${i}`, label: ["메일","사진","음악","메모","캘린더","설정"][i],
      emoji: ["💌","🖼️","🎵","📝","📅","⚙️"][i],
      fileName: `pastel_${i}.png`, fileType: "PNG", resolution: "256 × 256",
    })),
    tags: ["파스텔"], status: "구매함", source: "@soft",
  },
];

export type Notice = {
  id: string;
  type: "comment" | "rating" | "download" | "sale" | "report" | "update" | "error";
  title: string;
  body: string;
  time: string;
  read?: boolean;
  detail?: string;
  relatedPresetId?: string;
  relatedUserId?: string;
  targetRoute?: string;
};

export const notifications: Notice[] = [
  { id: "n1", type: "sale", title: "판매 알림", body: "‘픽셀 게임룸’이 1건 판매되었습니다. (+6,900₩)", time: "5분 전",
    detail: "구매자 @minji 님이 ‘픽셀 게임룸’ 프리셋을 6,900원에 구매했습니다. 정산은 다음 정산일에 반영됩니다.",
    relatedPresetId: "mp-005", targetRoute: "/profile/sales" },
  { id: "n2", type: "comment", title: "새 댓글", body: "haneul: 정말 잘 만드셨네요!", time: "1시간 전",
    detail: "‘노을’ 프리셋에 haneul 님이 새 댓글을 남겼습니다: “정말 잘 만드셨네요! 색감이 특히 마음에 들어요.”",
    relatedPresetId: "mp-001", relatedUserId: "haneul", targetRoute: "/library/lib-001" },
  { id: "n3", type: "rating", title: "평점 알림", body: "‘노을’ 프리셋에 ★5점이 등록되었습니다.", time: "3시간 전", read: true,
    detail: "‘노을’ 프리셋에 새로운 ★5점 리뷰가 등록되었습니다. 현재 평균 평점은 4.8점입니다.",
    relatedPresetId: "mp-001", targetRoute: "/library/lib-001" },
  { id: "n4", type: "download", title: "다운로드", body: "‘심해’ 프리셋이 100회 다운로드를 돌파했습니다.", time: "어제", read: true,
    detail: "‘심해’ 프리셋이 누적 다운로드 100회를 돌파했습니다. 축하합니다!",
    relatedPresetId: "mp-003", targetRoute: "/library/lib-004" },
  { id: "n5", type: "error", title: "매핑 오류", body: "‘픽셀 게임룸’ 프리셋의 아이콘 4개가 연결되어 있지 않습니다.", time: "어제",
    detail: "‘픽셀 게임룸’ 프리셋에서 4개의 아이콘이 실행 파일과 매핑되지 않았습니다. 보관함에서 매핑을 완료해 주세요.",
    relatedPresetId: "mp-005", targetRoute: "/library/lib-002" },
  { id: "n6", type: "update", title: "앱 업데이트", body: "ICNO 1.2.0 버전이 출시되었습니다.", time: "2일 전", read: true,
    detail: "ICNO 1.2.0 버전이 출시되었습니다. 새로운 아이콘 메이커와 성능 개선이 포함되어 있습니다.",
    targetRoute: "/settings" },
];

export const reviews = [
  { id: "r1", user: "minji", avatar: "🦊", rating: 5, text: "퀄리티 너무 좋아요. 따뜻한 색감이 마음에 듭니다.", date: "2026-04-20", likes: 23 },
  { id: "r2", user: "doha", avatar: "🐻", rating: 4, text: "전반적으로 만족하는데 일부 아이콘이 너무 작아요.", date: "2026-04-12", likes: 8 },
  { id: "r3", user: "sora", avatar: "🐰", rating: 5, text: "매핑까지 깔끔하게 잘 됩니다!", date: "2026-04-05", likes: 12 },
];

export const currentUser = {
  name: "지훈",
  username: "@jihoon",
  role: "크리에이터",
  avatar: "🦄",
};

export type FollowedCreator = {
  name: string;
  role: string;
  avatar: string;
  uploads: number;
  followers: number;
  followedAt: string;
  isNew?: boolean;
};

export const followedCreators: FollowedCreator[] = [
  { name: "haneul", role: "탑 크리에이터", avatar: "🌅", uploads: 24, followers: 12450, followedAt: "2026-04-22", isNew: true },
  { name: "pinkpuff", role: "캐릭터 아티스트", avatar: "🩷", uploads: 18, followers: 8320, followedAt: "2026-04-10" },
  { name: "neonlab", role: "탑 크리에이터", avatar: "🌃", uploads: 31, followers: 21030, followedAt: "2026-03-28", isNew: true },
  { name: "mono", role: "미니멀 스튜디오", avatar: "⬛", uploads: 12, followers: 5410, followedAt: "2026-03-15" },
  { name: "8bitcat", role: "픽셀 아티스트", avatar: "👾", uploads: 22, followers: 9870, followedAt: "2026-02-20" },
  { name: "soft", role: "디자이너", avatar: "🌸", uploads: 9, followers: 3210, followedAt: "2026-02-02" },
];