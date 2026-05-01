import { Heart, Star, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketplacePreset } from "@/data/mockData";

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
      className="group cursor-pointer rounded-2xl bg-card border border-border overflow-hidden shadow-card hover:shadow-glow hover:-translate-y-0.5 transition-all duration-300"
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