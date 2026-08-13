import { useMemo, useState } from "react";
import { Store, Loader2, Check, Search, ChevronLeft, Layers, Download, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { publishIcons, type IconToUpload } from "@/services/marketIconUpload";

type Mode = "single" | "pack";

/**
 * 아이콘 마켓 업로드 — 2단계.
 *  1) 올릴 아이콘 선택(1개=단일 / 2개+=팩, 자동 판단)
 *  2) 이름·태그·공개 설정 + 상단 마켓 카드 미리보기 → 업로드
 */
export function MarketIconUploadModal({
  allIcons,
  initialIds = [],
  onClose,
  onDone,
}: {
  allIcons: IconToUpload[];
  initialIds?: string[];
  onClose: () => void;
  onDone?: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const selected = useMemo(
    () => allIcons.filter((i) => selectedIds.includes(i.id)),
    [allIcons, selectedIds],
  );
  const isPack = selected.length >= 2;
  const mode: Mode = isPack ? "pack" : "single";
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? allIcons.filter((i) => i.title.toLowerCase().includes(q)) : allIcons;
  }, [allIcons, query]);
  const tags = useMemo(
    () => tagsRaw.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean).slice(0, 10),
    [tagsRaw],
  );

  const toggle = (id: string) =>
    setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const step1Valid = selected.length >= 1;
  const goStep2 = () => {
    if (!step1Valid) return;
    setName(isPack ? "" : selected[0]?.title ?? "");
    setStep(2);
  };
  const canUpload = name.trim().length > 0 && step1Valid;

  const handleUpload = async () => {
    if (!canUpload) return;
    setBusy(true);
    setProgress({ done: 0, total: selected.length });
    try {
      const r = await publishIcons(selected, { mode, name, tagsRaw, isPublic }, (done, total) =>
        setProgress({ done, total }),
      );
      if (r.ok) {
        toast({
          title:
            r.mode === "pack"
              ? `아이콘 팩(${selected.length}개)을 마켓에 올렸습니다.`
              : "아이콘을 마켓에 올렸습니다.",
        });
        window.dispatchEvent(new Event("market-icons:refresh"));
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
      setProgress(null);
    }
  };

  const selLabel =
    selected.length === 0 ? "아이콘 선택" : isPack ? `아이콘 팩 · ${selected.length}개` : "단일 아이콘 · 1개";

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-4 w-4" /> 마켓에 올리기
            <span className="text-xs font-normal text-muted-foreground">· {step}/2단계</span>
          </DialogTitle>
          <DialogDescription>아이콘을 마켓에 올립니다.</DialogDescription>
        </DialogHeader>

        {/* 1단계 — 아이콘 선택 */}
        {step === 1 && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">올릴 아이콘을 담으세요 (1개=단일 / 2개+=팩)</span>
              <span className="text-sm font-medium">{selLabel}</span>
            </div>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="아이콘 검색" className="h-9 pl-9" />
            </div>
            <div className="grid grid-cols-4 gap-3 overflow-y-auto flex-1 min-h-[220px] content-start pr-1">
              {filtered.map((ic) => {
                const on = selectedIds.includes(ic.id);
                return (
                  <div key={ic.id} className="relative aspect-square">
                    <button
                      type="button"
                      onClick={() => toggle(ic.id)}
                      title={ic.title}
                      className={cn(
                        "absolute inset-0 w-full h-full rounded-xl border overflow-hidden bg-white dark:bg-black flex items-center justify-center p-3 transition-all",
                        on ? "border-primary ring-2 ring-primary" : "border-border hover:border-primary/40",
                      )}
                    >
                      {ic.imageUrl ? (
                        <img src={ic.imageUrl} alt="" className="max-w-full max-h-full object-contain" />
                      ) : null}
                      {on && (
                        <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground grid place-items-center">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={onClose}>취소</Button>
              <Button onClick={goStep2} disabled={!step1Valid}>다음</Button>
            </div>
          </>
        )}

        {/* 2단계 — 정보 + 미리보기 */}
        {step === 2 && (
          <div className="space-y-4 overflow-y-auto pr-1">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1.5">미리보기 — 마켓에서 이렇게 보입니다</div>
              <MarketPreviewCard mode={mode} icons={selected} name={name} tags={tags} />
            </div>
            <div>
              <label className="text-sm font-medium">{mode === "single" ? "아이콘 이름" : "팩 이름"}</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={mode === "single" ? "아이콘 이름" : "예: 파스텔 앱 아이콘"}
                className="mt-1.5"
                disabled={busy}
              />
            </div>
            <div>
              <label className="text-sm font-medium">태그 (쉼표로 구분)</label>
              <Input
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                placeholder="미니멀, 다크, 감성"
                className="mt-1.5"
                disabled={busy}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <div className="text-sm font-medium">공개하기</div>
                <div className="text-xs text-muted-foreground">누구나 탐색에서 볼 수 있습니다</div>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} disabled={busy} />
            </div>
            <div className="flex justify-between gap-2">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={busy} className="gap-1">
                <ChevronLeft className="h-4 w-4" /> 뒤로
              </Button>
              <Button onClick={handleUpload} disabled={busy || !canUpload} className="gap-1.5">
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {progress ? `${progress.done}/${progress.total}` : "올리는 중…"}
                  </>
                ) : (
                  <>
                    <Store className="h-4 w-4" /> 올리기
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** 2단계 상단 미리보기 — 마켓 카드가 어떻게 보일지 실시간 렌더. */
function MarketPreviewCard({
  mode,
  icons,
  name,
  tags,
}: {
  mode: Mode;
  icons: IconToUpload[];
  name: string;
  tags: string[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden max-w-sm">
      <div className="relative aspect-square bg-muted/30">
        <PackThumb icons={icons} />
      </div>
      <div className="p-3 space-y-1.5">
        {mode === "pack" && (
          <div className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/15 text-primary">
            <Layers className="h-3 w-3" /> 아이콘 팩 {icons.length}개
          </div>
        )}
        <div className="font-semibold text-sm truncate">
          {name || (mode === "single" ? "아이콘 이름" : "팩 이름")}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3" /> 신규</span>
          <span className="inline-flex items-center gap-0.5"><Download className="h-3 w-3" /> 0</span>
          <span className="font-semibold text-foreground">무료</span>
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
  );
}

/**
 * 개수별 아이콘 배치 썸네일 (정사각 컨테이너).
 *  1=크게 중앙, 2=양옆, 3=위2·아래1, 4+=2×2.
 * 각 타일은 aspect-square 고정 + object-contain 이라 이미지가 잘리지 않는다.
 */
function PackThumb({ icons }: { icons: IconToUpload[] }) {
  const shown = icons.slice(0, 4);
  const n = shown.length;

  const Tile = ({ ic, className }: { ic?: IconToUpload; className?: string }) => (
    <div className={cn("relative aspect-square rounded-lg bg-white dark:bg-black overflow-hidden shrink-0", className)}>
      <div className="absolute inset-0 flex items-center justify-center p-1.5">
        {ic?.imageUrl ? <img src={ic.imageUrl} alt="" className="max-w-full max-h-full object-contain" /> : null}
      </div>
    </div>
  );

  if (n <= 1) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <Tile ic={shown[0]} className="w-[70%]" />
      </div>
    );
  }
  if (n === 2) {
    return (
      <div className="absolute inset-0 flex items-center justify-center gap-2 p-3">
        <Tile ic={shown[0]} className="w-[44%]" />
        <Tile ic={shown[1]} className="w-[44%]" />
      </div>
    );
  }
  if (n === 3) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
        <div className="flex gap-2 justify-center w-full">
          <Tile ic={shown[0]} className="w-[44%]" />
          <Tile ic={shown[1]} className="w-[44%]" />
        </div>
        <Tile ic={shown[2]} className="w-[44%]" />
      </div>
    );
  }
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
      <div className="flex gap-2 justify-center w-full">
        <Tile ic={shown[0]} className="w-[44%]" />
        <Tile ic={shown[1]} className="w-[44%]" />
      </div>
      <div className="flex gap-2 justify-center w-full">
        <Tile ic={shown[2]} className="w-[44%]" />
        <Tile ic={shown[3]} className="w-[44%]" />
      </div>
    </div>
  );
}
