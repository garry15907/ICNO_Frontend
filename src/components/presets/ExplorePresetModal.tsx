import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MarketplacePreset, reviews, toPreset } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import {
  Flag, Download, Star, ThumbsUp, MessageCircle, Monitor, AlertTriangle, Loader2, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/lib/library";
import { useCurrentDisplay } from "@/lib/display";
import {
  PresetActionPanel,
  PresetCreatorInfo,
  PresetFileList,
  PresetPreview,
} from "./preset-parts";

export function ExplorePresetModal({
  preset,
  wishlisted,
  onWishlist,
  onClose,
}: {
  preset: MarketplacePreset;
  wishlisted?: boolean;
  onWishlist?: () => void;
  onClose: () => void;
}) {
  const [previewAsset, setPreviewAsset] = useState<{ src?: string; emoji?: string; name: string } | null>(null);
  const [mismatchOpen, setMismatchOpen] = useState<null | "download" | "apply">(null);
  const [purchaseStep, setPurchaseStep] = useState<"idle" | "paying">("idle");
  const { isSaved, downloadStatus, downloadPreset, downloadCount, requestApply, getLibraryIdForPreset } = useLibrary();
  const nav = useNavigate();
  const display = useCurrentDisplay();
  const saved = isSaved(preset.id);
  const status = downloadStatus[preset.id] ?? "idle";
  const downloading = status === "downloading";
  const commonPreset = useMemo(() => toPreset(preset), [preset]);

  const match = useMemo(
    () =>
      preset.creatorResolutionWidth === display.width &&
      preset.creatorResolutionHeight === display.height,
    [preset, display],
  );

  const doDownload = async () => {
    const r = await downloadPreset(preset, { source: preset.price === 0 ? "download" : "purchase" });
    if (r.ok) {
      setMismatchOpen(null);
      setPurchaseStep("idle");
    }
  };

  const handlePrimaryClick = () => {
    if (preset.price !== 0) {
      if (saved) {
        const libId = getLibraryIdForPreset(preset.id);
        nav(libId ? `/library/${libId}` : "/library");
        return;
      }
      setPurchaseStep("paying");
      return;
    }
    if (saved) {
      const libId = getLibraryIdForPreset(preset.id);
      nav(libId ? `/library/${libId}` : "/library");
      return;
    }
    if (!match) setMismatchOpen("download");
    else void doDownload();
  };

  const handleApply = () => {
    if (!match) setMismatchOpen("apply");
    else requestApply(preset.id);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 scrollbar-thin border-border">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <PresetCreatorInfo preset={commonPreset} mode="marketplace" />
        </div>

        {/* Hero preview */}
        <div className="px-6 pt-6">
          <PresetPreview preset={commonPreset} />
        </div>

        {/* Info + actions */}
        <div className="px-6 py-6 grid md:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{preset.name}</h2>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span className="text-foreground font-semibold">{preset.rating}</span>
                  <span>({preset.reviews.toLocaleString()} 리뷰)</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1"><Download className="h-4 w-4" />{downloadCount(preset).toLocaleString()}회 다운로드</span>
              </div>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{preset.description}</p>
            <div className="flex flex-wrap gap-2">
              {preset.tags.map((t) => (
                <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">#{t}</span>
              ))}
            </div>
            <div className="text-xs text-muted-foreground border-t border-border pt-3">
              <span className="font-semibold text-foreground">라이선스</span> · {preset.license}
            </div>
          </div>

          <PresetActionPanel
            mode="marketplace"
            preset={commonPreset}
            actions={{
              saved,
              downloading,
              wishlisted,
              onDownload: handlePrimaryClick,
              onOpenLibrary: () => {
                const libId = getLibraryIdForPreset(preset.id);
                nav(libId ? `/library/${libId}` : "/library");
              },
              onApply: handleApply,
              onWishlist,
            }}
          />
        </div>

        {/* Content sections */}
        <div className="px-6 pb-6 space-y-6">
          <ResolutionInfoSection preset={preset} match={match} display={display} />
          <PresetFileList preset={commonPreset} onSelectAsset={setPreviewAsset} />
        </div>

        {/* Reviews */}
        <div className="px-6 pb-8 border-t border-border pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold">리뷰 ({preset.reviews.toLocaleString()})</h3>
            <Button variant="outline" size="sm"><MessageCircle className="h-4 w-4 mr-1.5" />리뷰 작성</Button>
          </div>
          <div className="space-y-3">
            {reviews.length === 0 && (
              <div className="border border-dashed rounded-xl p-8 text-center text-sm text-muted-foreground">
                아직 등록된 리뷰가 없습니다.
              </div>
            )}
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-border p-4 bg-card/50">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted grid place-items-center text-lg">{r.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">{r.user}</span>
                      <span className="flex items-center text-warning">
                        {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">{r.date}</span>
                    </div>
                    <p className="text-sm mt-1.5 text-foreground/90">{r.text}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <button className="flex items-center gap-1 hover:text-foreground"><ThumbsUp className="h-3 w-3" />{r.likes}</button>
                      <button className="hover:text-foreground">답글</button>
                      <button className="ml-auto hover:text-destructive flex items-center gap-1"><Flag className="h-3 w-3" />신고</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>

      {/* Asset preview */}
      <Dialog open={!!previewAsset} onOpenChange={(o) => !o && setPreviewAsset(null)}>
        <DialogContent className="max-w-2xl">
          {previewAsset && (
            <div className="space-y-3">
              <div className="text-sm font-semibold">{previewAsset.name}</div>
              <div className="rounded-xl bg-muted aspect-video grid place-items-center text-7xl overflow-hidden">
                {previewAsset.src ? <img src={previewAsset.src} className="w-full h-full object-cover" alt="" /> : previewAsset.emoji}
              </div>
              <p className="text-xs text-muted-foreground">읽기 전용 미리보기 · 편집은 다운로드 후 보관함에서 가능합니다.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Purchase placeholder */}
      <Dialog open={purchaseStep === "paying"} onOpenChange={(o) => !o && setPurchaseStep("idle")}>
        <DialogContent className="max-w-md">
          <div className="space-y-4">
            <div className="text-base font-bold">결제 진행</div>
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">상품</span><span className="font-medium">{preset.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">금액</span><span className="font-bold">₩{preset.price.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">제작 해상도</span><span className="font-medium">{preset.creatorResolutionLabel}</span></div>
            </div>
            <p className="text-xs text-muted-foreground">결제 UI placeholder · 실제 결제는 진행되지 않습니다.</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPurchaseStep("idle")}>취소</Button>
              <Button className="flex-1 bg-gradient-primary text-primary-foreground" onClick={() => { setPurchaseStep("idle"); if (!match) setMismatchOpen("download"); else void doDownload(); }}>결제 완료</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mismatch warning */}
      <Dialog open={!!mismatchOpen} onOpenChange={(o) => !o && setMismatchOpen(null)}>
        <DialogContent className="max-w-md">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-base font-bold">
              <AlertTriangle className="h-4 w-4 text-warning" />
              해상도가 다릅니다
            </div>
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-foreground/90">
              이 프리셋은 <span className="font-semibold">{preset.creatorResolutionLabel}</span> 환경에서 제작되었습니다.
              현재 화면 해상도({display.label})와 다를 경우 아이콘 위치와 전체 배치가 제작자의 의도와 다르게 보일 수 있습니다.
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setMismatchOpen(null)}>취소</Button>
              <Button
                className="flex-1 bg-gradient-primary text-primary-foreground"
                disabled={downloading}
                onClick={() => {
                  const kind = mismatchOpen;
                  setMismatchOpen(null);
                  if (kind === "apply") requestApply(preset.id);
                  else void doDownload();
                }}
              >
                그래도 {mismatchOpen === "apply" ? "적용" : "저장"}하기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function ResolutionInfoSection({
  preset,
  match,
  display,
}: {
  preset: MarketplacePreset;
  match: boolean;
  display: { width: number; height: number; label: string };
}) {
  return (
    <div>
      <h3 className="text-base font-bold mb-3 flex items-center gap-2">
        <Monitor className="h-4 w-4 text-primary" />
        해상도 정보
      </h3>
      <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/40 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">제작 해상도</div>
            <div className="text-sm font-semibold mt-1">{preset.creatorResolutionLabel}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              이 프리셋은 {preset.creatorResolutionLabel} 환경에서 제작되었습니다.
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">현재 내 화면</div>
            <div className="text-sm font-semibold mt-1">{display.label}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              현재 내 화면은 {display.label}입니다.
            </p>
          </div>
        </div>
        <div
          className={cn(
            "rounded-lg p-3 text-sm flex items-start gap-2",
            match ? "bg-success/10" : "bg-warning/10",
          )}
        >
          {match ? (
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 mt-0.5 text-warning shrink-0" />
          )}
          <p className="text-foreground/90">
            {match
              ? "현재 화면 해상도와 일치합니다."
              : "현재 화면 해상도와 다릅니다. 아이콘 배치가 제작자의 의도와 다르게 보일 수 있습니다."}
          </p>
        </div>
      </div>
    </div>
  );
}