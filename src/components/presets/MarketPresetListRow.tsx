import { useMemo, type ReactNode } from "react";
import { Download, Eye, Heart, Star } from "lucide-react";
import { presetAverageRating, type MarketPresetRow } from "@/lib/market-presets";
import { PresetThumbnail } from "@/components/presets/PresetThumbnail";
import { Badge } from "@/components/ui/badge";

/** Shared list row for market presets (wishlist / downloads / my uploads). */
export function MarketPresetListRow({
  preset,
  onClick,
  badge,
  actions,
}: {
  preset: MarketPresetRow;
  onClick?: () => void;
  badge?: string;
  actions?: ReactNode;
}) {
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
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition">
      <button
        type="button"
        onClick={onClick}
        className="h-16 w-24 shrink-0 overflow-hidden rounded-md"
        aria-label={preset.name}
      >
        <PresetThumbnail
          wallpaperUrl={preset.thumbnailUrl ?? null}
          icons={icons}
          canvasW={preset.canvas?.w ?? 1920}
          canvasH={preset.canvas?.h ?? 1080}
        />
      </button>
      <button type="button" onClick={onClick} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-sm truncate">{preset.name}</div>
          {badge && <Badge variant="secondary" className="text-[10px]">{badge}</Badge>}
        </div>
        <div className="text-xs text-muted-foreground mt-1 truncate">
          아이콘 {(preset.icons ?? []).length}개 · 등록 {preset.created_at.slice(0, 10)}
          {preset.tags.length > 0 && <> · {preset.tags.map((t) => `#${t}`).join(" ")}</>}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
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
      </button>
      {actions}
    </div>
  );
}
