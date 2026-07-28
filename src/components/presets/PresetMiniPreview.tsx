import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { localEngineUrl, type PresetModel } from "@/services/localEngineApi";

const CANVAS_W = 1920;
const CANVAS_H = 1080;

/**
 * Renders a live thumbnail of a `PresetModel` returned by the local
 * engine. Uses `wallpaper_url` / `icons[].image_url` (relative paths
 * prefixed with the local engine base) and scales the 1920×1080 canvas
 * to fit the container — same math as the editor's small preview.
 */
export function PresetMiniPreview({
  preset,
  className,
}: {
  preset: PresetModel | null | undefined;
  className?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.1);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const s = Math.max(r.width / CANVAS_W, r.height / CANVAS_H);
      if (s > 0) setScale(s);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const wallpaper = preset?.wallpaper_url ? localEngineUrl(preset.wallpaper_url) : "";

  return (
    <div
      ref={boxRef}
      className={cn("relative w-full h-full overflow-hidden bg-muted/40", className)}
    >
      {wallpaper ? (
        <img
          src={wallpaper}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-muted-foreground">
          <ImageOff className="h-6 w-6" />
        </div>
      )}
      <div
        className="absolute top-1/2 left-1/2"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
          pointerEvents: "none",
        }}
      >
        {(preset?.icons ?? []).map((it, i) => {
          const url = it.image_url ? localEngineUrl(it.image_url) : "";
          const size = it.size ?? 72;
          if (!url) return null;
          return (
            <img
              key={`${it.asset_id || i}-${i}`}
              src={url}
              alt=""
              draggable={false}
              className="absolute object-contain"
              style={{
                left: it.x ?? 0,
                top: it.y ?? 0,
                width: size,
                height: "auto",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}