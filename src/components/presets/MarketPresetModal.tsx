import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Download,
  Loader2,
  Heart,
  Bookmark,
  Share2,
  Flag,
  Star,
  Eye,
  MessageSquare,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { importMarketPreset } from "@/services/marketPresetDownload";
import { presetAverageRating, type MarketPresetRow } from "@/lib/market-presets";
import { useMarketSocial, type ReportReason } from "@/lib/market-social";
import { PresetThumbnail } from "@/components/presets/PresetThumbnail";
import { PresetComments } from "@/components/presets/PresetComments";
import { FollowButton } from "@/components/presets/FollowButton";
import { cn } from "@/lib/utils";

const reportReasons: { id: ReportReason; label: string }[] = [
  { id: "spam", label: "스팸/광고" },
  { id: "inappropriate", label: "부적절한 콘텐츠" },
  { id: "copyright", label: "저작권 침해" },
  { id: "malware", label: "악성 파일 의심" },
  { id: "other", label: "기타" },
];

function StarRating({
  value,
  onRate,
}: {
  value: number;
  onRate: (score: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onRate(n)} aria-label={`${n}점`} className="p-0.5">
          <Star
            className={cn(
              "h-4 w-4 transition-colors",
              n <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground",
            )}
          />
        </button>
      ))}
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
