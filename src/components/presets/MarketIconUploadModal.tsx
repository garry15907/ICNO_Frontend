import { useState } from "react";
import { Store, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { uploadIconsToMarket, type IconToUpload } from "@/services/marketIconUpload";

/**
 * 보관함 아이콘(1개 이상)을 마켓에 올리는 모달.
 * 공통 태그·공개여부를 일괄 적용하고, 이름은 각 아이콘 이름을 사용한다.
 */
export function MarketIconUploadModal({
  icons,
  onClose,
  onDone,
}: {
  icons: IconToUpload[];
  onClose: () => void;
  onDone?: () => void;
}) {
  const [tagsRaw, setTagsRaw] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const count = icons.length;

  const handleUpload = async () => {
    if (count === 0) return;
    setBusy(true);
    setProgress({ done: 0, total: count });
    try {
      const result = await uploadIconsToMarket(icons, { tagsRaw, isPublic }, (done, total) =>
        setProgress({ done, total }),
      );
      if (result.ok > 0 && result.failed.length === 0) {
        toast({ title: `${result.ok}개 아이콘을 마켓에 올렸습니다.` });
      } else if (result.ok > 0) {
        toast({
          title: `${result.ok}개 성공 · ${result.failed.length}개 실패`,
          description: result.failed.map((f) => `${f.title}: ${f.error}`).join("\n"),
        });
      } else {
        toast({
          title: "업로드에 실패했습니다",
          description: result.failed[0]?.error ?? "잠시 후 다시 시도해주세요.",
          variant: "destructive",
        });
      }
      if (result.ok > 0) {
        window.dispatchEvent(new Event("market-icons:refresh"));
        onDone?.();
        onClose();
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

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-4 w-4" /> 마켓에 올리기
          </DialogTitle>
          <DialogDescription>
            선택한 아이콘 {count}개를 마켓에 올립니다. 이름은 각 아이콘 이름을 사용합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 선택한 아이콘 미리보기 */}
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {icons.map((ic) => (
              <div
                key={ic.id}
                className="h-14 w-14 rounded-lg border border-border bg-white dark:bg-black grid place-items-center overflow-hidden shrink-0"
                title={ic.title}
              >
                {ic.imageUrl ? (
                  <img src={ic.imageUrl} alt={ic.title} className="max-h-full max-w-full object-contain" />
                ) : null}
              </div>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium">태그 (쉼표로 구분, 공통 적용)</label>
            <Input
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="미니멀, 다크, 감성"
              className="mt-1.5"
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground mt-1">태그는 최대 10개, 개당 20자.</p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <div className="text-sm font-medium">공개하기</div>
              <div className="text-xs text-muted-foreground">누구나 탐색에서 볼 수 있습니다</div>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} disabled={busy} />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} disabled={busy}>
              취소
            </Button>
            <Button onClick={handleUpload} disabled={busy || count === 0} className="gap-1.5">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progress ? `${progress.done}/${progress.total}` : "올리는 중…"}
                </>
              ) : (
                <>
                  <Store className="h-4 w-4" /> {count}개 올리기
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
