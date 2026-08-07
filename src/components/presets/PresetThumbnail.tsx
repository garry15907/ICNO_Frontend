import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const THUMB_CANVAS_W = 1920;
export const THUMB_CANVAS_H = 1080;

export type ThumbnailIcon = {
  imageUrl?: string | null;
  x?: number | null;
  y?: number | null;
  size?: number | null;
  showName?: boolean | null;
  label?: string | null;
  fontSize?: number | null;
  fontFamily?: string | null;
};

export type PresetThumbnailProps = {
  wallpaperUrl?: string | null;
  icons?: ThumbnailIcon[];
  /** Logical canvas size; defaults to 1920×1080. */
  canvasW?: number;
  canvasH?: number;
  /** `cover` fills the box (default), `contain` letterboxes the whole canvas. */
  fit?: "cover" | "contain";
  className?: string;
  /** Rendered when there is neither a wallpaper nor a placed icon. */
  emptyState?: React.ReactNode;
};

/**
 * The single preview renderer used by the editor, the library and the market.
 *
 * Everything (wallpaper included) lives inside one logical canvas div that is
 * only ever shrunk with `transform: scale`, so the wallpaper and the icons
 * always share the exact same transform — the placement can never drift from
 * the background no matter what aspect ratio the container has.
 */
export function PresetThumbnail({
  wallpaperUrl,
  icons = [],
  canvasW = THUMB_CANVAS_W,
  canvasH = THUMB_CANVAS_H,
  fit = "cover",
  className,
  emptyState,
}: PresetThumbnailProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      const s =
        fit === "cover"
          ? Math.max(r.width / canvasW, r.height / canvasH)
          : Math.min(r.width / canvasW, r.height / canvasH);
      if (s > 0) setScale(s);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvasW, canvasH, fit]);

  const isEmpty = !wallpaperUrl && icons.length === 0;

  return (
    <div ref={boxRef} className={cn("relative w-full h-full overflow-hidden bg-muted/40", className)}>
      {isEmpty && emptyState ? (
        <div className="absolute inset-0">{emptyState}</div>
      ) : (
        <div
          className="absolute top-1/2 left-1/2 overflow-hidden"
          style={{
            width: canvasW,
            height: canvasH,
            transform: `translate(-50%, -50%) scale(${scale || 0.0001})`,
            transformOrigin: "center center",
            pointerEvents: "none",
            visibility: scale ? "visible" : "hidden",
          }}
        >
          {/* Wallpaper lives INSIDE the canvas so it shares the transform. */}
          {wallpaperUrl ? (
            <img
              src={wallpaperUrl}
              alt=""
              draggable={false}
              style={{ width: canvasW, height: canvasH, objectFit: "cover" }}
              className="absolute top-0 left-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
              }}
            />
          ) : (
            <div
              className="absolute top-0 left-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900"
              style={{ width: canvasW, height: canvasH }}
            />
          )}

          {icons.map((ic, i) => {
            const size = ic.size ?? 72;
            return (
              <div
                key={i}
                className="absolute desktopIconWrapper"
                style={
                  {
                    left: `${ic.x ?? 0}px`,
                    top: `${ic.y ?? 0}px`,
                    "--desktop-icon-size": `${size}px`,
                  } as CSSProperties
                }
              >
                <div className="desktopIconImageBox">
                  {ic.imageUrl ? (
                    <img
                      src={ic.imageUrl}
                      alt=""
                      draggable={false}
                      className="desktopIconImage"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.style.display = "none";
                        const ph = img.nextElementSibling as HTMLElement | null;
                        if (ph) ph.style.display = "grid";
                      }}
                    />
                  ) : null}
                  <div
                    className="rounded-md bg-white/10 border border-white/15 place-items-center"
                    style={{ width: size, height: size, display: ic.imageUrl ? "none" : "grid" }}
                  >
                    <ImageIcon className="w-1/2 h-1/2 text-white/50" />
                  </div>
                </div>
                {ic.showName && ic.label ? (
                  <div
                    className="desktopIconLabel text-white"
                    style={{
                      textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                      fontSize: `${ic.fontSize ?? Math.round(size / 4)}px`,
                      fontFamily: ic.fontFamily ?? undefined,
                    }}
                  >
                    {ic.label}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}