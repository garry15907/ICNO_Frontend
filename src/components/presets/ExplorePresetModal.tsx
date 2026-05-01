import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MarketplacePreset, reviews } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Flag, Download, ShoppingCart, Star, ChevronRight, ThumbsUp, MessageCircle } from "lucide-react";

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
                <span className="flex items-center gap-1"><Download className="h-4 w-4" />{preset.downloads.toLocaleString()}회 다운로드</span>
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
            <Button className="w-full h-11 bg-gradient-primary text-primary-foreground hover:opacity-90">
              {preset.price === 0 ? <><Download className="h-4 w-4 mr-2" />다운로드</> : <><ShoppingCart className="h-4 w-4 mr-2" />구매하기</>}
            </Button>
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
    </Dialog>
  );
}