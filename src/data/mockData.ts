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
  default_resolution?: string;
  resolution_variants?: ResolutionVariant[];
};

export type ResolutionVariant = {
  variant_id: string;
  label: string; // FHD / QHD / UHD / Ultrawide / Laptop / Custom
  width: number;
  height: number;
  is_default?: boolean;
  is_recommended?: boolean;
};

export const currentDisplayResolution = {
  width: 2560,
  height: 1440,
  label: "QHD",
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

export const wishlistIds = ["mp-002", "mp-008"];
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
  ...marketplacePresets.map((p) => ({ ...p, type: "preset" as const })),
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
};

export const notifications: Notice[] = [
  { id: "n1", type: "sale", title: "판매 알림", body: "‘픽셀 게임룸’이 1건 판매되었습니다. (+6,900₩)", time: "5분 전" },
  { id: "n2", type: "comment", title: "새 댓글", body: "haneul: 정말 잘 만드셨네요!", time: "1시간 전" },
  { id: "n3", type: "rating", title: "평점 알림", body: "‘노을’ 프리셋에 ★5점이 등록되었습니다.", time: "3시간 전", read: true },
  { id: "n4", type: "download", title: "다운로드", body: "‘심해’ 프리셋이 100회 다운로드를 돌파했습니다.", time: "어제", read: true },
  { id: "n5", type: "error", title: "매핑 오류", body: "‘픽셀 게임룸’ 프리셋의 아이콘 4개가 연결되어 있지 않습니다.", time: "어제" },
  { id: "n6", type: "update", title: "앱 업데이트", body: "ICNO 1.2.0 버전이 출시되었습니다.", time: "2일 전", read: true },
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