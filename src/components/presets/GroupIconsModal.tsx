import { useMemo, useState } from "react";
import { Package, Check, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type GroupIcon = { id: string; title: string; imageUrl: string };

/**
 * 보관함 아이콘을 팩으로 묶는 모달 (마켓 업로드 피커와 동일한 방식).
 * 아이콘을 선택하고 팩 이름을 입력해 그룹을 만든다.
 */
export function GroupIconsModal({
  icons,
  onCreate,
  onClose,
  mode = "create",
}: {
  icons: GroupIcon[];
  onCreate: (name: string, ids: string[]) => void;
  onClose: () => void;
  mode?: "create" | "add";
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");

  const toggle = (id: string) =>
    setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? icons.filter((i) => i.title.toLowerCase().includes(q)) : icons;
  }, [icons, query]);
  const canCreate = selectedIds.length >= 1 && (mode === "add" || name.trim().length > 0);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" /> {mode === "add" ? "팩에 아이콘 추가" : "아이콘 팩으로 묶기"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add" ? "팩에 추가할 아이콘을 선택하세요." : "묶을 아이콘을 선택하고 팩 이름을 입력하세요."}
          </DialogDescription>
        </DialogHeader>

        {mode === "create" && (
          <div>
            <label className="text-sm font-medium">팩 이름</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 산리오 아이콘"
              className="mt-1.5"
            />
          </div>
        )}

        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="아이콘 검색" className="h-9 pl-9" />
        </div>

        <div className="grid grid-cols-4 gap-3 overflow-y-auto flex-1 min-h-[200px] content-start pr-1">
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

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-sm text-muted-foreground">{selectedIds.length}개 선택됨</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>취소</Button>
            <Button onClick={() => onCreate(name, selectedIds)} disabled={!canCreate} className="gap-1.5">
              <Package className="h-4 w-4" /> {mode === "add" ? "추가" : "팩으로 묶기"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
