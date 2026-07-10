import { Heart, Star, Download, Package, Image as ImageIcon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketplacePreset, MarketItem } from "@/data/mockData";
import { useCurrentDisplay } from "@/lib/display";

export function PresetCard({
  preset,
  wishlisted,
  onClick,
  onWishlist,
}: {
  preset: MarketplacePreset;
  wishlisted?: boolean;
  onClick?: () => void;
  onWishlist?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="group card-hover-surface cursor-pointer rounded-2xl bg-card border border-border overflow-hidden shadow-card hover:shadow-glow hover:-translate-y-0.5 will-change-transform transition-[transform,box-shadow,border-color] duration-300"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={preset.thumbnail}
          alt={preset.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md backdrop-blur-md",
            preset.price === 0 ? "bg-success/90 text-white" : "bg-primary/90 text-primary-foreground",
          )}>
            {preset.price === 0 ? "무료" : `₩${preset.price.toLocaleString()}`}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onWishlist?.(); }}
          className="absolute top-3 right-3 h-8 w-8 grid place-items-center rounded-full bg-background/70 backdrop-blur hover:bg-background transition"
        >
          <Heart className={cn("h-4 w-4", wishlisted ? "fill-destructive text-destructive" : "text-foreground")} />
        </button>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate">{preset.name}</h3>
            <p className="text-xs text-muted-foreground truncate">@{preset.creator.name}</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="text-foreground font-medium">{preset.rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" />
            <span>{preset.downloads.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          {preset.tags.slice(0, 3).map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">#{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// 통합 마켓 아이템 카드 (프리셋 / 아이콘 / 아이콘 팩)
// =====================================================
export function MarketItemCard({
  item,
  wishlisted,
  onClick,
  onWishlist,
}: {
  item: MarketItem;
  wishlisted?: boolean;
  onClick?: () => void;
  onWishlist?: () => void;
}) {
  const display = useCurrentDisplay();
  const typeLabel = item.type === "preset" ? "프리셋" : item.type === "icon" ? "아이콘" : "아이콘 팩";
  const typeBadge = (
    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-card/90 backdrop-blur border border-border text-foreground inline-flex items-center gap-1">
      {item.type === "preset" && <Sparkle />}
      {item.type === "icon" && <ImageIcon className="h-2.5 w-2.5" />}
      {item.type === "iconpack" && <Package className="h-2.5 w-2.5" />}
      {typeLabel}
    </span>
  );

  return (
    <div
      onClick={onClick}
      className="group card-hover-surface cursor-pointer rounded-2xl bg-card border border-border overflow-hidden shadow-card hover:shadow-glow hover:-translate-y-0.5 will-change-transform transition-[transform,box-shadow,border-color] duration-300"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {item.type === "preset" && (
          <img src={(item as any).thumbnail} alt={item.name} loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        )}
        {item.type === "icon" && (
          <div className="w-full h-full grid place-items-center text-7xl bg-gradient-to-br from-primary/10 to-accent/10">
            {(item as any).emoji}
          </div>
        )}
        {item.type === "iconpack" && (
          <div className="w-full h-full grid grid-cols-3 gap-2 p-4 bg-gradient-to-br from-muted to-card">
            {(item as any).thumbnailEmojis.slice(0, 6).map((e: string, i: number) => (
              <div key={i} className="rounded-lg bg-background/70 grid place-items-center text-2xl shadow-sm">{e}</div>
            ))}
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          {typeBadge}
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md backdrop-blur-md",
            item.price === 0 ? "bg-success/90 text-white" : "bg-primary/90 text-primary-foreground",
          )}>
            {item.price === 0 ? "무료" : `₩${item.price.toLocaleString()}`}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onWishlist?.(); }}
          className="absolute top-3 right-3 h-8 w-8 grid place-items-center rounded-full bg-background/70 backdrop-blur hover:bg-background transition"
        >
          <Heart className={cn("h-4 w-4", wishlisted ? "fill-destructive text-destructive" : "text-foreground")} />
        </button>
        {item.type === "iconpack" && (
          <span className="absolute bottom-3 left-3 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-background/80 backdrop-blur border border-border">
            {(item as any).icons.length}+ 아이콘
          </span>
        )}
        {item.type === "preset" && (() => {
          const p = item as MarketplacePreset & { type: "preset" };
          const match =
            p.creatorResolutionWidth === display.width &&
            p.creatorResolutionHeight === display.height;
          return (
            <span className={cn(
              "absolute bottom-3 left-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md backdrop-blur border inline-flex items-center gap-1",
              match
                ? "bg-success/90 text-white border-success"
                : "bg-primary/90 text-primary-foreground border-primary/60",
            )}>
              <Monitor className="h-2.5 w-2.5" />
              {p.creatorResolutionType}
            </span>
          );
        })()}
      </div>
      <div className="p-4 space-y-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold truncate">{item.name}</h3>
          <p className="text-xs text-muted-foreground truncate">@{(item as any).creator.name}</p>
        </div>
        {item.type === "preset" && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Monitor className="h-3 w-3" />
            <span className="truncate">
              제작 해상도 · {(item as MarketplacePreset).creatorResolutionLabel}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="text-foreground font-medium">{(item as any).rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" />
            <span>{(item as any).downloads.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          {(item as any).tags.slice(0, 3).map((t: string) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">#{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Sparkle() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z"/></svg>;
}