import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MarketItem, reviews } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Flag, Download, Star, ThumbsUp, MessageCircle, Package, Image as ImageIcon, CheckCircle2, Loader2, Check } from "lucide-react";
import { ExplorePresetModal } from "./ExplorePresetModal";
import { useIconLibrary } from "@/lib/icon-library";

export function MarketItemModal({
  item,
  wishlisted,
  onWishlist,
  onClose,
}: {
  item: MarketItem;
  wishlisted?: boolean;
  onWishlist?: () => void;
  onClose: () => void;
}) {
  if (item.type === "preset") {
    // 기존 프리셋 상세 모달 재사용
    return (
      <ExplorePresetModal
        preset={item as any}
        wishlisted={wishlisted}
        onWishlist={onWishlist}
        onClose={onClose}
      />
    );
  }
  if (item.type === "icon") return <IconDetailModal item={item} wishlisted={wishlisted} onWishlist={onWishlist} onClose={onClose} />;
  return <IconPackDetailModal item={item} wishlisted={wishlisted} onWishlist={onWishlist} onClose={onClose} />;
}

function ModalShell({
  children, onClose, creator,
}: { children: React.ReactNode; onClose: () => void; creator: { name: string; role: string; avatar: string } }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 scrollbar-thin border-border">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3 sticky top-0 bg-card z-10">
          <div className="h-10 w-10 rounded-full bg-gradient-primary grid place-items-center text-lg">
            {creator.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">@{creator.name}</div>
            <div className="text-xs text-muted-foreground">{creator.role}</div>
          </div>
          <Button variant="ghost" size="sm">팔로우</Button>
        </div>
        {children}
      </DialogContent>
    </Dialog>
  );
}

function IconLibraryActionPanel({
  price,
  wishlisted,
  onWishlist,
  saved,
  downloading,
  onDownload,
  onOpenLibrary,
  isPack,
}: {
  price: number;
  wishlisted?: boolean;
  onWishlist?: () => void;
  saved: boolean;
  downloading: boolean;
  onDownload: () => void;
  onOpenLibrary: () => void;
  isPack?: boolean;
}) {
  return (
    <div className="space-y-3 bg-muted/40 rounded-2xl p-5 border border-border h-fit">
      <div className="text-2xl font-bold">{price === 0 ? "무료" : `₩${price.toLocaleString()}`}</div>

      {saved ? (
        <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground grid place-items-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="text-sm font-bold text-foreground">
              내 아이콘 보관함에 저장됨
            </div>
          </div>
          <p className="text-xs text-foreground/75 leading-relaxed">
            {isPack
              ? "이 아이콘 팩은 프리셋 수정창에서 사용할 수 있습니다."
              : "이 아이콘은 프리셋 수정창에서 사용할 수 있습니다."}
          </p>
          <Button
            onClick={onOpenLibrary}
            className="w-full h-10 bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            <Check className="h-4 w-4 mr-2" />
            아이콘 보관함에서 열기
          </Button>
        </div>
      ) : (
        <Button
          className="w-full h-11 bg-gradient-primary text-primary-foreground hover:opacity-90"
          disabled={downloading}
          onClick={onDownload}
        >
          {downloading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />다운로드 중…</>
          ) : (
            <><Download className="h-4 w-4 mr-2" />다운로드</>
          )}
        </Button>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={onWishlist}>
          <Heart className={`h-4 w-4 mr-2 ${wishlisted ? "fill-destructive text-destructive" : ""}`} />찜
        </Button>
        <Button variant="outline"><Share2 className="h-4 w-4 mr-2" />공유</Button>
      </div>
      <button className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 mt-1">
        <Flag className="h-3 w-3" />신고
      </button>
    </div>
  );
}

function StatsRow({ rating, reviewsCount, downloads }: { rating: number; reviewsCount: number; downloads: number }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2 flex-wrap">
      <span className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-warning text-warning" />
        <span className="text-foreground font-semibold">{rating}</span>
        <span>({reviewsCount.toLocaleString()} 리뷰)</span>
      </span>
      <span>·</span>
      <span className="flex items-center gap-1"><Download className="h-4 w-4" />{downloads.toLocaleString()}회</span>
    </div>
  );
}

function ReviewsSection() {
  return (
    <div className="px-6 pb-8 border-t border-border pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold">리뷰</h3>
        <Button variant="outline" size="sm"><MessageCircle className="h-4 w-4 mr-1.5" />리뷰 작성</Button>
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
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IconDetailModal({ item, wishlisted, onWishlist, onClose }: any) {
  const nav = useNavigate();
  const { isDownloaded, iconDownloadStatus, downloadIcon } = useIconLibrary();
  const saved = isDownloaded(item.id);
  const status = iconDownloadStatus[item.id] ?? "idle";
  return (
    <ModalShell onClose={onClose} creator={item.creator}>
      <div className="px-6 pt-6">
        <div
          className="rounded-2xl border border-border shadow-card aspect-[16/9] grid place-items-center text-9xl overflow-hidden"
          style={{
            background: item.transparent
              ? "repeating-conic-gradient(hsl(var(--muted)) 0% 25%, transparent 0% 50%) 50% / 24px 24px"
              : "hsl(var(--muted))",
          }}
        >
          {item.emoji}
        </div>
      </div>
      <div className="px-6 py-6 grid md:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-primary/15 text-primary inline-flex items-center gap-1">
                <ImageIcon className="h-2.5 w-2.5" />아이콘
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">{item.name}</h2>
            <StatsRow rating={item.rating} reviewsCount={item.reviews} downloads={item.downloads} />
          </div>
          <p className="text-sm text-foreground/80">{item.description}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="파일명" value={item.fileName} />
            <Info label="해상도" value={item.resolution} />
            <Info label="파일 형식" value={item.fileType} />
            <Info label="투명 배경" value={item.transparent ? "예" : "아니오"} />
            <Info label="스타일" value={item.style} />
            <Info label="라이선스" value={item.license} />
          </div>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((t: string) => (
              <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">#{t}</span>
            ))}
          </div>
        </div>
        <IconLibraryActionPanel
          price={item.price}
          wishlisted={wishlisted}
          onWishlist={onWishlist}
          saved={saved}
          downloading={status === "downloading"}
          onDownload={() => downloadIcon(item)}
          onOpenLibrary={() => { nav("/library?tab=icons"); onClose(); }}
        />
      </div>
      <ReviewsSection />
    </ModalShell>
  );
}

function IconPackDetailModal({ item, wishlisted, onWishlist, onClose }: any) {
  const [preview, setPreview] = useState<{ emoji: string; label: string; fileName: string } | null>(null);
  const nav = useNavigate();
  const { isDownloaded, iconDownloadStatus, downloadPack } = useIconLibrary();
  const allSaved = item.icons.every((i: any) => isDownloaded(i.id));
  const status = iconDownloadStatus[item.id] ?? "idle";
  return (
    <ModalShell onClose={onClose} creator={item.creator}>
      <div className="px-6 pt-6">
        <div className="rounded-2xl border border-border shadow-card aspect-[16/9] grid grid-cols-4 gap-4 p-8 bg-gradient-to-br from-primary/5 to-accent/5">
          {item.icons.slice(0, 8).map((ic: any) => (
            <div key={ic.id} className="rounded-xl bg-background/80 backdrop-blur grid place-items-center text-4xl shadow-card">
              {ic.emoji}
            </div>
          ))}
        </div>
      </div>
      <div className="px-6 py-6 grid md:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-primary/15 text-primary inline-flex items-center gap-1">
                <Package className="h-2.5 w-2.5" />아이콘 팩
              </span>
              <span className="text-xs text-muted-foreground">{item.icons.length}개 아이콘 포함</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">{item.name}</h2>
            <StatsRow rating={item.rating} reviewsCount={item.reviews} downloads={item.downloads} />
          </div>
          <p className="text-sm text-foreground/80">{item.description}</p>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((t: string) => (
              <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">#{t}</span>
            ))}
          </div>
          <div className="text-xs text-muted-foreground border-t border-border pt-3">
            <span className="font-semibold text-foreground">라이선스</span> · {item.license}
          </div>
        </div>
        <IconLibraryActionPanel
          price={item.price}
          wishlisted={wishlisted}
          onWishlist={onWishlist}
          saved={allSaved}
          downloading={status === "downloading"}
          onDownload={() => downloadPack(item)}
          onOpenLibrary={() => { nav("/library?tab=icons"); onClose(); }}
          isPack
        />
      </div>
      <div className="px-6 pb-6">
        <h3 className="text-base font-bold mb-3">포함된 아이콘 ({item.icons.length})</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {item.icons.map((ic: any) => (
            <button
              key={ic.id}
              onClick={() => setPreview(ic)}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/40 transition text-left"
            >
              <div className="h-12 w-12 rounded-lg bg-muted grid place-items-center text-2xl">{ic.emoji}</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{ic.label}</div>
                <div className="text-[10px] text-muted-foreground truncate">{ic.fileName} · {ic.resolution} · {ic.fileType}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <ReviewsSection />
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-md">
          {preview && (
            <div className="space-y-3">
              <div className="text-sm font-semibold">{preview.label}</div>
              <div className="rounded-xl bg-muted aspect-square grid place-items-center text-9xl">{preview.emoji}</div>
              <div className="text-xs text-muted-foreground">{preview.fileName}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ModalShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-sm font-medium mt-1 truncate">{value}</div>
    </div>
  );
}