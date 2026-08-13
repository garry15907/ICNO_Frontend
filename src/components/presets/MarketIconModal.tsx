import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Download, Loader2, Heart, Share2, Flag, Star, Eye, MessageSquare, Layers, Trash2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { CreatorCard } from "@/components/presets/CreatorCard";
import { useIconLibrary } from "@/lib/icon-library";
import { useItemSocial, useItemComments, type ItemType, type ReportReason } from "@/lib/item-social";
import { downloadMarketIcon, downloadMarketIconPack } from "@/services/marketIconDownload";

export type ItemModalData = {
  type: ItemType;
  id: string;
  name: string;
  owner_id: string;
  description: string | null;
  tags: string[];
  created_at: string;
  views: number;
  downloads: number;
  wishlist_count: number;
  comment_count: number;
  rating_sum: number;
  rating_count: number;
  singleUrl?: string | null; // icon
  iconUrls?: (string | null)[]; // pack
  iconCount?: number; // pack
};

const reportReasons: { id: ReportReason; label: string }[] = [
  { id: "spam", label: "스팸/광고" },
  { id: "inappropriate", label: "부적절한 콘텐츠" },
  { id: "copyright", label: "저작권 침해" },
  { id: "malware", label: "악성 파일 의심" },
  { id: "other", label: "기타" },
];

function StarRating({ value, onRate }: { value: number; onRate: (n: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onRate(n)} aria-label={`${n}점`} className="p-0.5">
          <Star className={cn("h-4 w-4 transition-colors", n <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
        </button>
      ))}
    </div>
  );
}

function Preview({ item }: { item: ItemModalData }) {
  if (item.type === "pack") {
    const shown = (item.iconUrls ?? []).filter((u): u is string => !!u).slice(0, 4);
    return (
      <div className="relative aspect-square max-w-xs mx-auto bg-muted/30 rounded-xl border border-border p-3">
        <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full">
          {shown.map((u, i) => (
            <div key={i} className="rounded-lg bg-white dark:bg-black flex items-center justify-center overflow-hidden p-1.5">
              <img src={u} alt="" className="max-w-full max-h-full object-contain" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="relative aspect-square max-w-xs mx-auto bg-white dark:bg-black rounded-xl border border-border">
      <div className="absolute inset-0 flex items-center justify-center p-6">
        {item.singleUrl ? <img src={item.singleUrl} alt={item.name} className="max-w-full max-h-full object-contain" /> : null}
      </div>
    </div>
  );
}

function ItemComments({ item, myUserId }: { item: ItemModalData; myUserId: string | null }) {
  const { comments, add, remove } = useItemComments(item.type, item.id);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const ok = await add(text);
    setBusy(false);
    if (ok) setText("");
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">댓글 {item.comment_count}</div>
      <div className="space-y-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          placeholder="댓글을 남겨보세요 (최대 1000자)"
          className="min-h-[72px] text-sm"
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">{text.length}/1000</span>
          <Button size="sm" disabled={busy || text.trim().length === 0} onClick={submit}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "등록"}
          </Button>
        </div>
      </div>
      {comments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
        </div>
      ) : (
        <div className="space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">{c.author}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{c.created_at.slice(0, 16).replace("T", " ")}</span>
                  {myUserId === c.user_id && (
                    <button onClick={() => void remove(c.id)} className="text-muted-foreground hover:text-destructive" aria-label="삭제">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm mt-1 whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MarketIconModal({ item, onClose }: { item: ItemModalData; onClose: () => void }) {
  const nav = useNavigate();
  const { reconcile } = useIconLibrary();
  const { isWishlisted, myRating, toggleWishlist, rate, registerDownload, report, incrementView } = useItemSocial();
  const [me, setMe] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("spam");
  const [reportDetail, setReportDetail] = useState("");
  const [reportBusy, setReportBusy] = useState(false);

  const avg = item.rating_count > 0 ? item.rating_sum / item.rating_count : 0;
  const mine = myRating(item.type, item.id);
  const isPack = item.type === "pack";

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);
  useEffect(() => {
    void incrementView(item.type, item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const handleDownload = async () => {
    setBusy(true);
    try {
      if (isPack) await downloadMarketIconPack(item.name, item.iconUrls ?? [], item.owner_id);
      else await downloadMarketIcon(item.name, item.singleUrl, item.owner_id);
      await reconcile();
      void registerDownload(item.type, item.id);
      toast.success("보관함에 저장됨", { action: { label: "보관함으로", onClick: () => nav("/library?tab=icons") } });
    } catch (e) {
      toast.error("다운로드에 실패했습니다", { description: e instanceof Error ? e.message : "ICNO 엔진 실행을 확인하세요." });
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/explore?${item.type}=${item.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("링크를 복사했습니다.");
    } catch {
      toast.error("링크 복사에 실패했습니다.");
    }
  };

  const submitReport = async () => {
    setReportBusy(true);
    const ok = await report(item.type, item.id, reportReason, reportDetail);
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
            <Preview item={item} />
            <div className="grid md:grid-cols-[1fr_240px] gap-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {isPack && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                      <Layers className="h-3 w-3" /> 아이콘 팩 {item.iconCount ?? 0}개
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold tracking-tight">{item.name}</h2>
                <CreatorCard userId={item.owner_id} />
                <div className="text-xs text-muted-foreground">{item.created_at.slice(0, 10)} 등록</div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{item.views}</span>
                  <span className="inline-flex items-center gap-1"><Download className="h-3.5 w-3.5" />{item.downloads}</span>
                  <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{item.wishlist_count}</span>
                  <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{item.comment_count}</span>
                  {avg > 0 && (
                    <span className="inline-flex items-center gap-1 text-yellow-500">
                      <Star className="h-3.5 w-3.5 fill-current" />{avg.toFixed(1)} ({item.rating_count})
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{item.description}</p>
                )}
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((t) => (
                      <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">#{t}</span>
                    ))}
                  </div>
                )}
                <div className="pt-2 border-t border-border">
                  <ItemComments item={item} myUserId={me} />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 space-y-3 h-fit">
                <Button className="w-full bg-gradient-primary text-primary-foreground" disabled={busy} onClick={handleDownload}>
                  {busy ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />가져오는 중…</> : <><Download className="h-4 w-4 mr-1.5" />다운로드</>}
                </Button>
                <Button
                  variant={isWishlisted(item.type, item.id) ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={() => void toggleWishlist(item.type, item.id)}
                >
                  <Heart className={cn("h-3.5 w-3.5 mr-1.5", isWishlisted(item.type, item.id) && "fill-current")} />
                  찜 {item.wishlist_count}
                </Button>
                <div className="rounded-xl bg-muted/40 p-3 space-y-1">
                  <div className="text-[11px] font-semibold text-muted-foreground">내 별점</div>
                  <StarRating value={mine} onRate={(n) => void rate(item.type, item.id, n)} />
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={copyLink}>
                  <Share2 className="h-3.5 w-3.5 mr-1.5" />링크 복사
                </Button>
                <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-destructive" onClick={() => setReportOpen(true)}>
                  <Flag className="h-3.5 w-3.5 mr-1.5" />신고
                </Button>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  다운로드하면 보관함 → 아이콘에 저장됩니다.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isPack ? "아이콘 팩" : "아이콘"} 신고</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">신고 사유</label>
              <Select value={reportReason} onValueChange={(v) => setReportReason(v as ReportReason)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {reportReasons.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">상세 내용 (선택)</label>
              <Textarea
                value={reportDetail}
                maxLength={1000}
                onChange={(e) => setReportDetail(e.target.value)}
                placeholder="어떤 문제가 있는지 알려주세요."
                className="min-h-[96px] text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setReportOpen(false)}>취소</Button>
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
