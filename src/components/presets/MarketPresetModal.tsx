import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Download, Image as ImageIcon, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { MARKET_BUCKET } from "@/services/marketPresetUpload";
import { importMarketPreset } from "@/services/marketPresetDownload";
import type { MarketPresetRow } from "@/lib/market-presets";

/** Big canvas preview: wallpaper + icon placement, scaled to the box. */
function MarketPresetPreview({
  preset,
  wallpaperUrl,
  iconUrls,
}: {
  preset: MarketPresetRow;
  wallpaperUrl?: string | null;
  iconUrls: Record<number, string>;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const w = preset.canvas?.w ?? 1920;
  const h = preset.canvas?.h ?? 1080;
  const [scale, setScale] = useState(0.1);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const s = Math.min(r.width / w, r.height / h);
      if (s > 0) setScale(s);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h]);

  return (
    <div
      ref={boxRef}
      className="relative w-full rounded-xl overflow-hidden border border-border bg-muted"
      style={{ aspectRatio: `${w} / ${h}` }}
    >
      {wallpaperUrl ? (
        <img src={wallpaperUrl} alt={preset.name} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
      )}
      <div
        className="absolute top-1/2 left-1/2"
        style={{
          width: w,
          height: h,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
          pointerEvents: "none",
        }}
      >
        {(preset.icons ?? []).map((ic, i) => {
          const size = ic.size ?? 72;
          const url = iconUrls[i];
          return (
            <div
              key={i}
              className="absolute flex flex-col items-center gap-1"
              style={{ left: ic.x ?? 0, top: ic.y ?? 0, width: size }}
            >
              <div className="grid place-items-center" style={{ width: size, height: size }}>
                {url ? (
                  <img src={url} alt="" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full grid place-items-center rounded-md bg-white/10 border border-white/15">
                    <ImageIcon className="w-1/2 h-1/2 text-white/50" />
                  </div>
                )}
              </div>
              {ic.show_name && ic.icon_name ? (
                <span
                  className="text-white drop-shadow max-w-full truncate"
                  style={{ fontSize: ic.font_size ?? Math.round(size / 4) }}
                >
                  {ic.icon_name}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MarketPresetModal({
  preset,
  onClose,
}: {
  preset: MarketPresetRow;
  onClose: () => void;
}) {
  const nav = useNavigate();
  const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(preset.thumbnailUrl ?? null);
  const [iconUrls, setIconUrls] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const iconCount = useMemo(() => (preset.icons ?? []).length, [preset]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const paths: string[] = [];
      if (preset.wallpaper_path) paths.push(preset.wallpaper_path);
      (preset.icons ?? []).forEach((ic) => ic.image_path && paths.push(ic.image_path));
      if (paths.length === 0) return;
      const { data } = await supabase.storage.from(MARKET_BUCKET).createSignedUrls(paths, 3600);
      if (!alive || !data) return;
      const map = new Map(data.map((d) => [d.path ?? "", d.signedUrl] as const));
      if (preset.wallpaper_path) setWallpaperUrl(map.get(preset.wallpaper_path) ?? null);
      const next: Record<number, string> = {};
      (preset.icons ?? []).forEach((ic, i) => {
        const u = ic.image_path ? map.get(ic.image_path) : undefined;
        if (u) next[i] = u;
      });
      setIconUrls(next);
    })();
    return () => {
      alive = false;
    };
  }, [preset]);

  const handleDownload = async () => {
    setBusy(true);
    const r = await importMarketPreset(preset);
    setBusy(false);
    if (r.ok === false) {
      toast.error(r.error);
      return;
    }
    window.dispatchEvent(new Event("presets:refresh"));
    toast.success("보관함에 저장됨", {
      action: { label: "보관함으로", onClick: () => nav("/library") },
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="space-y-5">
          <MarketPresetPreview preset={preset} wallpaperUrl={wallpaperUrl} iconUrls={iconUrls} />

          <div className="grid md:grid-cols-[1fr_240px] gap-5">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold tracking-tight">{preset.name}</h2>
              <div className="text-xs text-muted-foreground">
                아이콘 {iconCount}개 · {preset.canvas?.w ?? 1920}×{preset.canvas?.h ?? 1080} ·{" "}
                {preset.created_at.slice(0, 10)} 등록
              </div>
              {preset.description && (
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {preset.description}
                </p>
              )}
              {preset.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {preset.tags.map((t) => (
                    <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 space-y-3 h-fit">
              <Button
                className="w-full bg-gradient-primary text-primary-foreground"
                disabled={busy}
                onClick={handleDownload}
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    가져오는 중…
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1.5" />
                    다운로드
                  </>
                )}
              </Button>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                다운로드하면 보관함에 저장됩니다. 프로그램 연결은 보관함 편집기에서 직접 지정하세요.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
