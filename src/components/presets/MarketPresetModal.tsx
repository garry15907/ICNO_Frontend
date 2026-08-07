import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Download,
  Loader2,
  Heart,
  Share2,
  Flag,
  Star,
  Eye,
  MessageSquare,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  const [busy, setBusy] = useState(false);
  const iconCount = useMemo(() => (preset.icons ?? []).length, [preset]);
  const [me, setMe] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("spam");
  const [reportDetail, setReportDetail] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [showIconBounds, setShowIconBounds] = useState(false);

  const {
    isWishlisted,
    myRating,
    toggleWishlist,
    rate,
    registerDownload,
    report,
    incrementView,
  } = useMarketSocial();

  const avg = presetAverageRating(preset);
  const mine = myRating(preset.id);

  const thumbIcons = useMemo(
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

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    void supabase
      .from("profiles")
      .select("display_name, username")
      .eq("id", preset.owner_id)
      .maybeSingle()
      .then(({ data }) => setOwnerName(data?.display_name || data?.username || null));
  }, [preset.owner_id]);

  // Count one view per modal open.
  useEffect(() => {
    void incrementView(preset.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset.id]);

  const handleDownload = async () => {
    setBusy(true);
    const r = await importMarketPreset(preset);
    setBusy(false);
    if (r.ok === false) {
      toast.error(r.error);
      return;
    }
    void registerDownload(preset.id);
    window.dispatchEvent(new Event("presets:refresh"));
    toast.success("보관함에 저장됨", {
      action: { label: "보관함으로", onClick: () => nav("/library") },
    });
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/explore?market=${preset.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("링크를 복사했습니다.");
    } catch {
      toast.error("링크 복사에 실패했습니다.");
    }
  };

  const submitReport = async () => {
    setReportBusy(true);
    const ok = await report(preset.id, reportReason, reportDetail);
    setReportBusy(false);
    if (ok) {
      setReportOpen(false);
      setReportDetail("");
    }
  };

  return (
    <>
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="space-y-5">
          <div
            className="relative w-full rounded-xl overflow-hidden border border-border bg-muted"
            style={{ aspectRatio: `${preset.canvas?.w ?? 1920} / ${preset.canvas?.h ?? 1080}` }}
          >
            <PresetThumbnail
              wallpaperUrl={preset.thumbnailUrl ?? null}
              icons={thumbIcons}
              canvasW={preset.canvas?.w ?? 1920}
              canvasH={preset.canvas?.h ?? 1080}
              highlightIcons={showIconBounds}
            />
            <div className="absolute top-3 right-3 flex items-center gap-2 rounded-full bg-background/80 backdrop-blur px-3 py-1.5 border border-border shadow-sm">
              <span className="text-[11px] font-semibold text-foreground/80">아이콘 표시</span>
              <Switch
                checked={showIconBounds}
                onCheckedChange={setShowIconBounds}
                aria-label="실제 아이콘 위치 표시"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-[1fr_240px] gap-5">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold tracking-tight">{preset.name}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  {ownerName ? `@${ownerName}` : "크리에이터"}
                </span>
                <FollowButton userId={preset.owner_id} />
              </div>
              <div className="text-xs text-muted-foreground">
                아이콘 {iconCount}개 · {preset.canvas?.w ?? 1920}×{preset.canvas?.h ?? 1080} ·{" "}
                {preset.created_at.slice(0, 10)} 등록
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{preset.views}</span>
                <span className="inline-flex items-center gap-1"><Download className="h-3.5 w-3.5" />{preset.downloads}</span>
                <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{preset.wishlist_count}</span>
                <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{preset.comment_count}</span>
                {avg > 0 && (
                  <span className="inline-flex items-center gap-1 text-yellow-500">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {avg.toFixed(1)} ({preset.rating_count})
                  </span>
                )}
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
              <div className="pt-2 border-t border-border">
                <PresetComments presetId={preset.id} myUserId={me} />
              </div>
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
              <Button
                variant={isWishlisted(preset.id) ? "default" : "outline"}
                size="sm"
                className="w-full"
                onClick={() => void toggleWishlist(preset.id)}
              >
                <Heart className={cn("h-3.5 w-3.5 mr-1.5", isWishlisted(preset.id) && "fill-current")} />
                찜 {preset.wishlist_count}
              </Button>
              <div className="rounded-xl bg-muted/40 p-3 space-y-1">
                <div className="text-[11px] font-semibold text-muted-foreground">내 별점</div>
                <StarRating value={mine} onRate={(n) => void rate(preset.id, n)} />
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={copyLink}>
                <Share2 className="h-3.5 w-3.5 mr-1.5" />링크 복사
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-destructive"
                onClick={() => setReportOpen(true)}
              >
                <Flag className="h-3.5 w-3.5 mr-1.5" />신고
              </Button>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                다운로드하면 보관함에 저장됩니다. 프로그램 연결은 보관함 편집기에서 직접 지정하세요.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={reportOpen} onOpenChange={setReportOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>프리셋 신고</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">신고 사유</label>
            <Select value={reportReason} onValueChange={(v) => setReportReason(v as ReportReason)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportReasons.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">상세 내용 (선택)</label>
            <Textarea
              value={reportDetail}
              maxLength={2000}
              onChange={(e) => setReportDetail(e.target.value)}
              placeholder="어떤 문제가 있는지 알려주세요."
              className="min-h-[96px] text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setReportOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" disabled={reportBusy} onClick={submitReport}>
              {reportBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "신고하기"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
