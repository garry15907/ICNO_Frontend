import type { ReactNode } from "react";
import {
  Monitor,
  Star,
  Download,
  Heart,
  Share2,
  Flag,
  ShoppingCart,
  CheckCircle2,
  Check,
  Loader2,
  ChevronRight,
  Pencil,
  Play,
  Maximize2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Preset } from "@/data/mockData";

/**
 * 공통 프리셋 표시 요소.
 * 탐색(marketplace)과 보관함(library) 모두 동일한 구조를 사용하고,
 * 오른쪽 액션 카드의 버튼만 mode에 따라 달라진다.
 */
export type PresetContextMode = "marketplace" | "library";

// ----------------------------------------------------------------------
// 크리에이터 정보 (헤더용)
// ----------------------------------------------------------------------
export function PresetCreatorInfo({
  preset,
  onFollow,
  mode,
}: {
  preset: Preset;
  onFollow?: () => void;
  mode: PresetContextMode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-gradient-primary grid place-items-center text-lg">
        {preset.creator.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">@{preset.creator.name}</div>
        <div className="text-xs text-muted-foreground">{preset.creator.role}</div>
      </div>
      {mode === "marketplace" && (
        <Button variant="ghost" size="sm" onClick={onFollow}>
          팔로우
        </Button>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// 제작 해상도 배지 (읽기 전용)
// ----------------------------------------------------------------------
export function PresetResolutionBadge({
  preset,
  variant = "chip",
  className,
}: {
  preset: Pick<
    Preset,
    "creatorResolutionType" | "creatorResolutionLabel"
  >;
  variant?: "chip" | "row";
  className?: string;
}) {
  if (variant === "row") {
    return (
      <div
        className={cn(
          "text-[11px] text-muted-foreground flex items-center gap-1.5",
          className,
        )}
      >
        <Monitor className="h-3 w-3 text-primary" />
        제작 해상도: {preset.creatorResolutionLabel}
      </div>
    );
  }
  return (
    <span
      className={cn(
        "text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md bg-background/80 backdrop-blur border border-border inline-flex items-center gap-1",
        className,
      )}
    >
      <Monitor className="h-3 w-3" />
      {preset.creatorResolutionType}
    </span>
  );
}

// ----------------------------------------------------------------------
// 히어로 프리뷰 (배경화면 + 가격/해상도 배지)
// ----------------------------------------------------------------------
export function PresetPreview({
  preset,
  showPriceBadge = true,
  overlay,
}: {
  preset: Preset;
  showPriceBadge?: boolean;
  overlay?: ReactNode;
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-border shadow-card">
      <img
        src={preset.thumbnail}
        alt={preset.name}
        className="w-full aspect-[16/9] object-cover"
      />
      <div className="absolute top-4 left-4 flex gap-2">
        {showPriceBadge && (
          <span
            className={cn(
              "text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md",
              preset.price === 0
                ? "bg-success text-white"
                : "bg-primary text-primary-foreground",
            )}
          >
            {preset.price === 0 ? "무료" : `₩${preset.price.toLocaleString()}`}
          </span>
        )}
        <PresetResolutionBadge preset={preset} />
      </div>
      {overlay}
    </div>
  );
}

// ----------------------------------------------------------------------
// 포함 파일 리스트 (배경화면 + 아이콘 + 호버 아이콘)
// ----------------------------------------------------------------------
export function PresetFileList({
  preset,
  onSelectAsset,
}: {
  preset: Preset;
  onSelectAsset?: (a: { src?: string; emoji?: string; name: string }) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold mb-3">포함된 파일 · 배경화면</h3>
        <button
          onClick={() =>
            onSelectAsset?.({ src: preset.thumbnail, name: preset.wallpaperName })
          }
          className="w-full flex items-center gap-4 rounded-xl border border-border bg-card p-3 hover:border-primary/40 transition text-left"
        >
          <img
            src={preset.thumbnail}
            className="h-14 w-24 object-cover rounded-md"
            alt=""
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {preset.wallpaperName}
            </div>
            <div className="text-xs text-muted-foreground">
              {preset.creatorResolutionLabel} · PNG
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div>
        <h3 className="text-base font-bold mb-3">
          아이콘 이미지 ({preset.icons.length})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {preset.icons.map((ic) => (
            <button
              key={ic.id}
              onClick={() =>
                onSelectAsset?.({ emoji: ic.emoji, name: ic.fileName })
              }
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/40 transition text-left"
            >
              <div className="h-12 w-12 rounded-lg bg-muted grid place-items-center text-2xl">
                {ic.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{ic.label}</div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {ic.fileName} · {ic.size.w}×{ic.size.h} · {ic.fileType}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {preset.hoverIcons?.length > 0 && (
        <div>
          <h3 className="text-base font-bold mb-3">
            호버 이미지 ({preset.hoverIcons.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {preset.hoverIcons.map((h) => (
              <button
                key={h.id}
                onClick={() =>
                  onSelectAsset?.({ emoji: h.emoji, name: h.fileName })
                }
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/40 transition text-left"
              >
                <div className="h-12 w-12 rounded-lg bg-muted grid place-items-center text-2xl">
                  {h.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{h.label}</div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {h.fileName} · GIF
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// 액션 패널 — mode에 따라 버튼만 달라짐
// ----------------------------------------------------------------------
export type MarketplaceActions = {
  saved: boolean;
  downloading: boolean;
  wishlisted?: boolean;
  onDownload: () => void;
  onOpenLibrary: () => void;
  onApply: () => void;
  onWishlist?: () => void;
  onShare?: () => void;
  onReport?: () => void;
};

export type LibraryActions = {
  onEdit: () => void;
  onApply: () => void;
  onFullscreen: () => void;
  onDelete: () => void;
  onViewOriginal?: () => void;
  onSaveDraft?: () => void;
};

export function PresetActionPanel(
  props:
    | { mode: "marketplace"; preset: Preset; actions: MarketplaceActions }
    | { mode: "library"; preset: Preset; actions: LibraryActions },
) {
  const { preset } = props;
  return (
    <div className="space-y-3 bg-muted/40 rounded-2xl p-5 border border-border h-fit">
      <div className="text-2xl font-bold">
        {preset.price === 0 ? "무료" : `₩${preset.price.toLocaleString()}`}
      </div>
      <PresetResolutionBadge preset={preset} variant="row" />

      {props.mode === "marketplace" ? (
        <MarketplaceButtons preset={preset} actions={props.actions} />
      ) : (
        <LibraryButtons actions={props.actions} />
      )}
    </div>
  );
}

function MarketplaceButtons({
  preset,
  actions: a,
}: {
  preset: Preset;
  actions: MarketplaceActions;
}) {
  return (
    <>
      {a.saved ? (
        <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground grid place-items-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="text-sm font-bold text-foreground">
              내 보관함에 저장됨
            </div>
          </div>
          <p className="text-xs text-foreground/75 leading-relaxed">
            이 프리셋은 보관함에서 수정하거나 데스크탑에 적용할 수 있습니다.
          </p>
          <Button
            onClick={a.onOpenLibrary}
            className="w-full h-10 bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            <Check className="h-4 w-4 mr-2" />
            보관함에서 열기
          </Button>
          <Button variant="outline" className="w-full h-9" onClick={a.onApply}>
            적용하기
          </Button>
        </div>
      ) : (
        <Button
          onClick={a.onDownload}
          disabled={a.downloading}
          className="w-full h-11 hover:opacity-90 bg-gradient-primary text-primary-foreground"
        >
          {a.downloading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              다운로드 중…
            </>
          ) : preset.price === 0 ? (
            <>
              <Download className="h-4 w-4 mr-2" />
              다운로드
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              구매하기
            </>
          )}
        </Button>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={a.onWishlist}>
          <Heart
            className={cn(
              "h-4 w-4 mr-2",
              a.wishlisted && "fill-destructive text-destructive",
            )}
          />
          찜
        </Button>
        <Button variant="outline" onClick={a.onShare}>
          <Share2 className="h-4 w-4 mr-2" />
          공유
        </Button>
      </div>
      <button
        onClick={a.onReport}
        className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 mt-1"
      >
        <Flag className="h-3 w-3" />이 프리셋 신고
      </button>
    </>
  );
}

function LibraryButtons({ actions: a }: { actions: LibraryActions }) {
  return (
    <div className="space-y-2">
      <Button
        onClick={a.onEdit}
        className="w-full h-11 bg-gradient-primary text-primary-foreground hover:opacity-90"
      >
        <Pencil className="h-4 w-4 mr-2" />
        수정하기
      </Button>
      <Button onClick={a.onApply} variant="default" className="w-full h-10">
        <Play className="h-4 w-4 mr-2" />
        적용하기
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={a.onFullscreen}>
          <Maximize2 className="h-4 w-4 mr-2" />
          전체화면
        </Button>
        <Button
          variant="outline"
          onClick={a.onViewOriginal}
          disabled={!a.onViewOriginal}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          원본
        </Button>
      </div>
      <Button
        variant="outline"
        onClick={a.onDelete}
        className="w-full h-10 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        보관함에서 삭제
      </Button>
    </div>
  );
}
