import { IconAsset } from "@/data/mockData";
import { cn } from "@/lib/utils";

export function DesktopPreview({
  wallpaper,
  icons,
  showLabels = true,
  className,
  selectedId,
  onSelect,
}: {
  wallpaper: string;
  icons: IconAsset[];
  showLabels?: boolean;
  className?: string;
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <div className={cn("relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-border shadow-card bg-muted", className)}>
      <img src={wallpaper} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0">
        {icons.map((ic) => (
          <button
            key={ic.id}
            onClick={() => onSelect?.(ic.id)}
            style={{ left: `${ic.position.x}%`, top: `${ic.position.y}%` }}
            className={cn(
              "absolute flex flex-col items-center gap-1 group/icon transition-transform hover:scale-110",
              selectedId === ic.id && "scale-110",
            )}
          >
            <div className={cn(
              "h-12 w-12 rounded-xl bg-background/80 backdrop-blur grid place-items-center text-2xl shadow-card",
              selectedId === ic.id && "ring-2 ring-primary",
            )}>
              {ic.emoji}
            </div>
            {showLabels && (
              <span className="text-[10px] font-medium text-white drop-shadow-lg px-1 leading-tight">
                {ic.label}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}