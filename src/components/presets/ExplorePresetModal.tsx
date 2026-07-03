import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MarketplacePreset, reviews, currentDisplayResolution, pickRecommendedVariant, ResolutionVariant } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Flag, Download, ShoppingCart, Star, ChevronRight, ThumbsUp, MessageCircle, Monitor, CheckCircle2, AlertTriangle, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/lib/library";

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
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [purchaseStep, setPurchaseStep] = useState<"idle" | "paying" | "selecting">("idle");
  const { isSaved, downloadStatus, downloadPreset, downloadCount } = useLibrary();
  const nav = useNavigate();
  const saved = isSaved(preset.id);
  const status = downloadStatus[preset.id] ?? "idle";
  const downloading = status === "downloading";

  const variants: ResolutionVariant[] = (preset as any).resolution_variants ?? [];
  const recommendation = useMemo(
    () => pickRecommendedVariant(variants, currentDisplayResolution),
    [variants],
  );
  const variantLabels = variants.map((v) => v.label).join(", ");
  const defaultVariant = variants.find((v) => v.is_default) ?? variants[0];

  const handlePrimaryClick = () => {
    if (saved && preset.price === 0) {
      nav("/library");
      onClose();
      return;
    }
    if (preset.price === 0) setDownloadOpen(true);
    else setPurchaseStep("paying");
  };
  const handlePayComplete = () => setPurchaseStep("selecting");

  const handleConfirmDownload = async (variantId?: string, source: "download" | "purchase" = "download") => {
    const r = await downloadPreset(preset, { source, variantId });
    if (r.ok) {
      setDownloadOpen(false);
      setPurchaseStep("idle");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 scrollbar-thin border-border">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center gap-3 sticky top-0 bg-card z-10">
          <div className="h-10 w-10 rounded-full bg-gradient-primary grid place-items-center text-lg">
            {preset.creator.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">@{preset.creator.name}</div>
            <div className="text-xs text-muted-foreground">{preset.creator.role}</div>
          </div>
          <Button variant="ghost" size="sm">팔로우</Button>
        </div>

        {/* Hero preview */}
        <div className="px-6 pt-6">
          <div className="relative rounded-2xl overflow-hidden border border-border shadow-card">
            <img src={preset.thumbnail} alt={preset.name} className="w-full aspect-[16/9] object-cover" />
            <div className="absolute top-4 left-4">
              <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md ${
                preset.price === 0 ? "bg-success text-white" : "bg-primary text-primary-foreground"
              }`}>
                {preset.price === 0 ? "무료" : `₩${preset.price.toLocaleString()}`}
              </span>
            </div>
          </div>
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

          {/* Action panel */}
          <div className="space-y-3 bg-muted/40 rounded-2xl p-5 border border-border h-fit">
            <div className="text-2xl font-bold">
              {preset.price === 0 ? "무료" : `₩${preset.price.toLocaleString()}`}
            </div>
            <Button
              onClick={handlePrimaryClick}
              disabled={downloading}
              className={cn(
                "w-full h-11 hover:opacity-90",
                saved && preset.price === 0
                  ? "bg-primary/15 text-primary hover:bg-primary/20 border border-primary/30"
                  : "bg-gradient-primary text-primary-foreground",
              )}
            >
              {downloading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />다운로드 중…</>
              ) : saved && preset.price === 0 ? (
                <><Check className="h-4 w-4 mr-2" />보관함에 저장됨</>
              ) : preset.price === 0 ? (
                <><Download className="h-4 w-4 mr-2" />다운로드</>
              ) : (
                <><ShoppingCart className="h-4 w-4 mr-2" />구매하기</>
              )}
            </Button>
            {saved && (
              <button
                onClick={() => { nav("/library"); onClose(); }}
                className="text-[11px] text-primary hover:underline block text-center w-full"
              >
                보관함에서 보기 →
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={onWishlist}>
                <Heart className={`h-4 w-4 mr-2 ${wishlisted ? "fill-destructive text-destructive" : ""}`} />찜
              </Button>
              <Button variant="outline"><Share2 className="h-4 w-4 mr-2" />공유</Button>
            </div>
            <button className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 mt-1">
              <Flag className="h-3 w-3" />이 프리셋 신고
            </button>
          </div>
        </div>

        {/* Included files */}
        <div className="px-6 pb-6 space-y-6">
          {/* 해상도 정보 섹션 */}
          {variants.length > 0 && (
            <ResolutionInfoSection
              variants={variants}
              recommendation={recommendation}
              defaultVariant={defaultVariant}
            />
          )}

          <div>
            <h3 className="text-base font-bold mb-3">포함된 파일 · 배경화면</h3>
            <button
              onClick={() => setPreviewAsset({ src: preset.thumbnail, name: preset.wallpaperName })}
              className="w-full flex items-center gap-4 rounded-xl border border-border bg-card p-3 hover:border-primary/40 transition text-left"
            >
              <img src={preset.thumbnail} className="h-14 w-24 object-cover rounded-md" alt="" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{preset.wallpaperName}</div>
                <div className="text-xs text-muted-foreground">{preset.resolution} · PNG</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
            {variants.length > 0 && (
              <div className="mt-2 text-[11px] text-muted-foreground pl-1">
                레이아웃 버전: {variantLabels}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-base font-bold mb-3">아이콘 이미지 ({preset.icons.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {preset.icons.map((ic) => (
                <button
                  key={ic.id}
                  onClick={() => setPreviewAsset({ emoji: ic.emoji, name: ic.fileName })}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/40 transition text-left"
                >
                  <div className="h-12 w-12 rounded-lg bg-muted grid place-items-center text-2xl">{ic.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{ic.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{ic.fileName} · {ic.size.w}×{ic.size.h} · {ic.fileType}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {preset.hoverIcons.length > 0 && (
            <div>
              <h3 className="text-base font-bold mb-3">호버 이미지 ({preset.hoverIcons.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {preset.hoverIcons.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setPreviewAsset({ emoji: h.emoji, name: h.fileName })}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/40 transition text-left"
                  >
                    <div className="h-12 w-12 rounded-lg bg-muted grid place-items-center text-2xl">{h.emoji}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{h.label}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{h.fileName} · GIF</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="px-6 pb-8 border-t border-border pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold">리뷰 ({preset.reviews.toLocaleString()})</h3>
            <Button variant="outline" size="sm"><MessageCircle className="h-4 w-4 mr-1.5" />리뷰 작성</Button>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground mr-2">내 평점:</span>
            {[1,2,3,4,5].map(n => <Star key={n} className="h-5 w-5 text-muted-foreground hover:text-warning hover:fill-warning cursor-pointer" />)}
          </div>
          <div className="space-y-3">
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

      {/* Asset preview popup */}
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

      {/* Resolution download modal */}
      <ResolutionDownloadModal
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        variants={variants}
        recommendation={recommendation}
        busy={downloading}
        onConfirm={(vid) => handleConfirmDownload(vid, "download")}
      />

      {/* Purchase placeholder modal */}
      <Dialog open={purchaseStep === "paying"} onOpenChange={(o) => !o && setPurchaseStep("idle")}>
        <DialogContent className="max-w-md">
          <div className="space-y-4">
            <div className="text-base font-bold">결제 진행</div>
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">상품</span><span className="font-medium">{preset.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">금액</span><span className="font-bold">₩{preset.price.toLocaleString()}</span></div>
            </div>
            <p className="text-xs text-muted-foreground">결제 UI placeholder · 실제 결제는 진행되지 않습니다.</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPurchaseStep("idle")}>취소</Button>
              <Button className="flex-1 bg-gradient-primary text-primary-foreground" onClick={handlePayComplete}>결제 완료</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ResolutionDownloadModal
        open={purchaseStep === "selecting"}
        onClose={() => setPurchaseStep("idle")}
        variants={variants}
        recommendation={recommendation}
        title="구매 완료 · 다운로드할 해상도 선택"
        busy={downloading}
        onConfirm={(vid) => handleConfirmDownload(vid, "purchase")}
      />
    </Dialog>
  );
}

function ResolutionInfoSection({
  variants,
  recommendation,
  defaultVariant,
}: {
  variants: ResolutionVariant[];
  recommendation: ReturnType<typeof pickRecommendedVariant>;
  defaultVariant?: ResolutionVariant;
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
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">제작 기준 해상도</div>
            <div className="text-sm font-semibold mt-1">
              {defaultVariant ? `${defaultVariant.label} ${defaultVariant.width} × ${defaultVariant.height}` : "—"}
            </div>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">현재 내 화면</div>
            <div className="text-sm font-semibold mt-1">
              {currentDisplayResolution.label} {currentDisplayResolution.width} × {currentDisplayResolution.height}
            </div>
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">지원 버전</div>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const isRec = recommendation?.variant.variant_id === v.variant_id;
              return (
                <span
                  key={v.variant_id}
                  className={cn(
                    "text-xs font-medium px-3 py-1.5 rounded-full border inline-flex items-center gap-1.5",
                    isRec
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-muted border-border text-muted-foreground",
                  )}
                >
                  {v.label} {v.width} × {v.height}
                  {isRec && (
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                      추천
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
        {recommendation && (
          <div className={cn(
            "rounded-lg p-3 text-sm flex items-start gap-2",
            recommendation.exact ? "bg-success/10 text-success-foreground" : "bg-warning/10",
          )}>
            {recommendation.exact ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 mt-0.5 text-warning shrink-0" />
            )}
            <div className="space-y-1">
              {recommendation.exact ? (
                <p className="text-foreground/90"><span className="font-semibold">{recommendation.variant.label}</span> 버전이 현재 해상도와 일치합니다.</p>
              ) : (
                <>
                  <p className="text-foreground/90">현재 해상도와 정확히 일치하는 버전이 없습니다.</p>
                  <p className="text-foreground/80 text-xs">
                    가장 가까운 <span className="font-semibold">{recommendation.variant.label}</span> 버전을 자동 보정하여 다운로드할 수 있습니다.
                    적용 후 보관함에서 아이콘 위치를 직접 수정할 수 있습니다.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResolutionDownloadModal({
  open,
  onClose,
  variants,
  recommendation,
  title = "다운로드할 해상도 선택",
  busy = false,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  variants: ResolutionVariant[];
  recommendation: ReturnType<typeof pickRecommendedVariant>;
  title?: string;
  busy?: boolean;
  onConfirm?: (variantId: string) => void;
}) {
  const [selected, setSelected] = useState<string>(recommendation?.variant.variant_id ?? variants[0]?.variant_id ?? "");
  const exact = recommendation?.exact ?? false;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <div className="space-y-4">
          <div>
            <div className="text-base font-bold">{title}</div>
            <div className="text-xs text-muted-foreground mt-1">
              현재 화면 해상도: {currentDisplayResolution.width} × {currentDisplayResolution.height}
            </div>
          </div>

          {!exact && recommendation && (
            <div className="rounded-lg bg-warning/10 p-3 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                정확히 일치하는 해상도 버전이 없습니다.
              </div>
              <p className="text-muted-foreground">
                가장 가까운 <span className="font-semibold text-foreground">{recommendation.variant.label} {recommendation.variant.width} × {recommendation.variant.height}</span> 버전을 자동 보정하여 다운로드합니다. 보관함에서 아이콘 위치를 자유롭게 수정할 수 있습니다.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {variants.map((v) => {
              const isRec = recommendation?.variant.variant_id === v.variant_id;
              const isSelected = selected === v.variant_id;
              return (
                <label
                  key={v.variant_id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition",
                    isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                  )}
                >
                  <input
                    type="radio"
                    name="resolution-variant"
                    checked={isSelected}
                    onChange={() => setSelected(v.variant_id)}
                    className="accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{v.label} {v.width} × {v.height}</div>
                  </div>
                  <div className="flex gap-1">
                    {isRec && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary text-primary-foreground">추천</span>
                    )}
                    {isRec && !exact && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-warning text-white">자동 보정</span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={busy}>취소</Button>
            <Button
              className="flex-1 bg-gradient-primary text-primary-foreground"
              disabled={busy}
              onClick={() => (onConfirm ? onConfirm(selected) : onClose())}
            >
              {busy
                ? "저장 중…"
                : exact
                ? "선택한 버전 다운로드"
                : "자동 보정 후 다운로드"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}