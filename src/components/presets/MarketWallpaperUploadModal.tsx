import { useMemo, useState } from "react";
import { Store, Loader2, Download, Star, Check, Search, ChevronLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { publishWallpaper, type WallpaperToUpload } from "@/services/marketWallpaperUpload";

/**
 * 배경화면 마켓 업로드 — 단일 전용(팩 없음).
 * wallpaper 가 없으면 1단계에서 보관함 배경 중 한 장을 고른다(아이콘 업로드 모달과 동일한 UX).
 */
export function MarketWallpaperUploadModal({
  wallpaper,
  allWallpapers = [],
  onClose,
  onDone,
}: {
  wallpaper?: WallpaperToUpload | null;
  allWallpapers?: WallpaperToUpload[];
  onClose: () => void;
  onDone?: () => void;
}) {
  const [picked, setPicked] = useState<WallpaperToUpload | null>(wallpaper ?? null);
  const [step, setStep] = useState<1 | 2>(wallpaper ? 2 : 1);
  const [query, setQuery] = useState("");
  const [name, setName] = useState(wallpaper?.title ?? "");
  const [description, setDescription] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);

  const tags = useMemo(
    () => tagsRaw.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean).slice(0, 10),
    [tagsRaw],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? allWallpapers.filter((w) => w.title.toLowerCase().includes(q)) : allWallpapers;
  }, [allWallpapers, query]);
  const canUpload = name.trim().length > 0 && !!picked;

  const handleUpload = async () => {
    if (!canUpload || !picked) return;
    setBusy(true);
    try {
      const r = await publishWallpaper(picked, { name, description, tagsRaw, isPublic });
      if (r.ok) {
        toast({ title: "배경화면을 마켓에 올렸습니다." });
        window.dispatchEvent(new Event("market-wallpapers:refresh"));
        onDone?.();
        onClose();
      } else {
        toast({ title: "업로드에 실패했습니다", description: r.error, variant: "destructive" });
      }
    } catch (e) {
      toast({
        title: "업로드에 실패했습니다",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-4 w-4" /> 마켓에 올리기
            {!wallpaper && <span className="text-xs font-normal text-muted-foreground">· {step}/2단계</span>}
          </DialogTitle>
          <DialogDescription>배경화면 한 장을 마켓에 올립니다.</DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="배경화면 검색" className="h-9 pl-9" />
            </div>
            {filtered.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
                보관함에 배경화면이 없습니다. 먼저 로컬에서 가져오세요.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 max-h-[45vh] overflow-y-auto pr-1">
                {filtered.map((w) => {
                  const on = picked?.id === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      title={w.title}
                      onClick={() => setPicked(w)}
                      className={cn(
                        "relative aspect-video rounded-xl border overflow-hidden transition-all",
                        on ? "border-primary ring-2 ring-primary" : "border-border hover:border-primary/40",
                      )}
                    >
                      {w.imageUrl ? <img src={w.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
                      {on && (
                        <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground grid place-items-center">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>취소</Button>
              <Button
                disabled={!picked}
                onClick={() => {
                  setName((n) => n || picked?.title || "");
                  setStep(2);
                }}
              >
                다음
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
        <div className="space-y-4">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1.5">미리보기 — 마켓에서 이렇게 보입니다</div>
            <div className="rounded-2xl border border-border bg-card overflow-hidden max-w-sm">
              <div className="relative aspect-video bg-muted/30 overflow-hidden">
                {picked?.imageUrl ? (
                  <img src={picked.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="p-3 space-y-1.5">
                <div className="font-semibold text-sm truncate">{name || "배경화면 이름"}</div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3" /> 신규</span>
                  <span className="inline-flex items-center gap-0.5"><Download className="h-3 w-3" /> 0</span>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((t) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">#{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">배경화면 이름</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" disabled={busy} placeholder="예: 파스텔 노을" />
          </div>
          <div>
            <label className="text-sm font-medium">설명 (선택)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              className="mt-1.5 min-h-[80px]"
              disabled={busy}
              placeholder="어떤 분위기의 배경인지 알려주세요."
            />
          </div>
          <div>
            <label className="text-sm font-medium">태그 (쉼표로 구분)</label>
            <Input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="미니멀, 다크, 감성" className="mt-1.5" disabled={busy} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <div className="text-sm font-medium">공개하기</div>
              <div className="text-xs text-muted-foreground">누구나 탐색에서 볼 수 있습니다</div>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} disabled={busy} />
          </div>
          <div className="flex justify-end gap-2">
            {wallpaper ? (
              <Button variant="ghost" onClick={onClose} disabled={busy}>취소</Button>
            ) : (
              <Button variant="ghost" onClick={() => setStep(1)} disabled={busy} className="gap-1">
                <ChevronLeft className="h-4 w-4" /> 뒤로
              </Button>
            )}
            <Button onClick={handleUpload} disabled={busy || !canUpload} className="gap-1.5">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" />올리는 중…</> : <><Store className="h-4 w-4" /> 올리기</>}
            </Button>
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}