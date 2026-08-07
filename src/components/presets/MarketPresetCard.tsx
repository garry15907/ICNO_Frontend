import { useMemo } from "react";
import { Heart, Download, Eye, Star } from "lucide-react";
import { presetAverageRating, type MarketPresetRow } from "@/lib/market-presets";
import { useMarketSocial } from "@/lib/market-social";
import { PresetThumbnail } from "@/components/presets/PresetThumbnail";
import { FollowButton } from "@/components/presets/FollowButton";
import { cn } from "@/lib/utils";

/** Market grid card: shared preview renderer + social actions. */
export function MarketPresetCard({
  preset,
  onClick,
  showFollow = false,
}: {
  preset: MarketPresetRow;
  onClick: () => void;
  showFollow?: boolean;
}) {
  const { isWishlisted, toggleWishlist } = useMarketSocial();
  const avg = presetAverageRating(preset);

  const icons = useMemo(
    () =>
      (preset.icons ?? []).map((ic, i) => ({
        imageUrl: preset.iconUrls?.[i] ?? null,
        x: ic.x,
        y: ic.y,
        size: ic.size,
        showName: ic.show_name,
        label: ic.icon_name,
        fontSize: ic.font_size,
        fontFamily: ic.font_family,
      })),
    [preset],
  );

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-card border border-border shadow-card transition hover:border-primary/40 hover:shadow-glow">
      <button type="button" onClick={onClick} className="block w-full text-left">
        <div className="aspect-[16/10] overflow-hidden">
          <PresetThumbnail
            wallpaperUrl={preset.thumbnailUrl ?? null}
            icons={icons}
            canvasW={preset.canvas?.w ?? 1920}
            canvasH={preset.canvas?.h ?? 1080}
            className="group-hover:scale-105 transition-transform"
          />
        </div>
      </button>

      <div className="absolute top-3 right-3 flex gap-1.5">
        <button
          type="button"
          aria-label="찜하기"
          onClick={(e) => {
            e.stopPropagation();
            void toggleWishlist(preset.id);
          }}
          className="h-7 w-7 grid place-items-center rounded-md bg-background/80 backdrop-blur hover:bg-background shadow-card"
        >
          <Heart className={cn("h-3.5 w-3.5", isWishlisted(preset.id) && "fill-red-500 text-red-500")} />
        </button>
      </div>

      <div className="p-4 space-y-1.5">
        <button type="button" onClick={onClick} className="block w-full text-left">
          <div className="text-sm font-semibold truncate">{preset.name}</div>
          <div className="text-[11px] text-muted-foreground truncate">
            아이콘 {(preset.icons ?? []).length}개 · {preset.created_at.slice(0, 10)}
          </div>
          {preset.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{preset.description}</p>
          )}
        </button>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
          <span className="inline-flex items-center gap-1"><Download className="h-3 w-3" />{preset.downloads}</span>
          <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" />{preset.wishlist_count}</span>
          <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{preset.views}</span>
          {avg > 0 && (
            <span className="inline-flex items-center gap-1 text-yellow-500">
              <Star className="h-3 w-3 fill-current" />
              {avg.toFixed(1)}
            </span>
          )}
        </div>
        {preset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {preset.tags.map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                #{t}
              </span>
            ))}
          </div>
        )}
        {showFollow && (
          <div className="pt-2">
            <FollowButton userId={preset.owner_id} />
          </div>
        )}
      </div>
    </div>
  );
}