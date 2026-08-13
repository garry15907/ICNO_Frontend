import { Download, Heart, Layers } from "lucide-react";
import type { MarketIconRow, MarketIconPackRow } from "@/lib/market-icons";

/** 단품 아이콘 카드 (탐색) — 클릭 시 상세 모달. */
export function MarketIconCard({ icon, onClick }: { icon: MarketIconRow; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-2xl border border-border bg-card overflow-hidden flex flex-col h-full hover:border-primary/40 hover:shadow-glow transition-all"
    >
      <div className="relative aspect-square bg-white dark:bg-black">
        <div className="absolute inset-0 flex items-center justify-center p-4">
          {icon.imageUrl ? (
            <img src={icon.imageUrl} alt={icon.name} className="max-w-full max-h-full object-contain" />
          ) : null}
        </div>
      </div>
      <div className="p-3 flex flex-col flex-1 gap-1">
        <div className="font-semibold text-sm truncate">{icon.name}</div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-auto">
          <span className="inline-flex items-center gap-0.5"><Download className="h-3 w-3" />{icon.downloads}</span>
          <span className="inline-flex items-center gap-0.5"><Heart className="h-3 w-3" />{icon.wishlist_count}</span>
        </div>
      </div>
    </button>
  );
}

/** 아이콘 팩 카드 (탐색) — 클릭 시 상세 모달. */
export function MarketIconPackCard({ pack, onClick }: { pack: MarketIconPackRow; onClick: () => void }) {
  const urls = (pack.iconUrls ?? []).filter((u): u is string => !!u);
  const shown = urls.slice(0, 4);
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-2xl border border-border bg-card overflow-hidden flex flex-col h-full hover:border-primary/40 hover:shadow-glow transition-all"
    >
      <div className="relative aspect-square bg-muted/30 p-3">
        <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full">
          {shown.map((u, i) => (
            <div key={i} className="rounded-lg bg-white dark:bg-black flex items-center justify-center overflow-hidden p-1">
              <img src={u} alt="" className="max-w-full max-h-full object-contain" />
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 flex flex-col flex-1 gap-1">
        <div className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/15 text-primary w-fit">
          <Layers className="h-3 w-3" /> 아이콘 팩 {pack.icon_count || urls.length}개
        </div>
        <div className="font-semibold text-sm truncate">{pack.name}</div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-auto">
          <span className="inline-flex items-center gap-0.5"><Download className="h-3 w-3" />{pack.downloads}</span>
          <span className="inline-flex items-center gap-0.5"><Heart className="h-3 w-3" />{pack.wishlist_count}</span>
        </div>
      </div>
    </button>
  );
}
