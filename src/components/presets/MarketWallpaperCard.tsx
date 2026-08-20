import { Download, Heart } from "lucide-react";
import type { MarketWallpaperRow } from "@/lib/market-wallpapers";

/** 마켓 배경화면 카드 (탐색) — 클릭 시 상세 모달. */
export function MarketWallpaperCard({
  wallpaper,
  onClick,
}: {
  wallpaper: MarketWallpaperRow;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-2xl border border-border bg-card overflow-hidden flex flex-col h-full hover:border-primary/40 hover:shadow-glow transition-all"
    >
      <div className="relative aspect-video bg-muted/30 overflow-hidden">
        {wallpaper.imageUrl ? (
          <img
            src={wallpaper.imageUrl}
            alt={wallpaper.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="p-3 flex flex-col flex-1 gap-1">
        <div className="font-semibold text-sm truncate">{wallpaper.name}</div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-auto">
          <span className="inline-flex items-center gap-0.5"><Download className="h-3 w-3" />{wallpaper.downloads}</span>
          <span className="inline-flex items-center gap-0.5"><Heart className="h-3 w-3" />{wallpaper.wishlist_count}</span>
          {wallpaper.width && wallpaper.height ? (
            <span className="ml-auto">{wallpaper.width}×{wallpaper.height}</span>
          ) : null}
        </div>
      </div>
    </button>
  );
}