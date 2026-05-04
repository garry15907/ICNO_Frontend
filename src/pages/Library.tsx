import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MoreHorizontal, Play, Edit, Eye, Sparkles, FolderOpen, Monitor, Store, Pin } from "lucide-react";
import { libraryPresets, LibraryStatus } from "@/data/mockData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const statusStyles: Record<LibraryStatus, string> = {
  "현재 적용 중": "bg-success text-success-foreground border-success",
  "매핑 필요": "bg-warning text-background border-warning",
  "로컬 수정됨": "bg-primary/15 text-primary border-primary/30",
  "다운로드됨": "bg-muted text-muted-foreground border-border",
  "구매함": "bg-accent text-accent-foreground border-border",
  "내가 만든 프리셋": "bg-primary/15 text-primary border-primary/30",
};

const visibleStatuses: LibraryStatus[] = ["현재 적용 중", "매핑 필요"];

export default function Library() {
  const nav = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [pinned, setPinned] = useState<string[]>([]);

  const togglePin = (id: string) =>
    setPinned((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const sortedPresets = [...libraryPresets].sort(
    (a, b) => (pinned.includes(b.id) ? 1 : 0) - (pinned.includes(a.id) ? 1 : 0),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">보관함</h2>
          <p className="text-muted-foreground mt-1">내 PC에 저장된 프리셋을 관리하고 적용하세요.</p>
        </div>
        <div className="text-sm text-muted-foreground">총 {libraryPresets.length}개</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {/* Create card */}
        <button
          onClick={() => setCreateOpen(true)}
          className="group rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center min-h-[280px] gap-3"
        >
          <div className="h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-glow">
            <Plus className="h-6 w-6" />
          </div>
          <div className="text-sm font-semibold">새 프리셋 만들기</div>
          <div className="text-xs text-muted-foreground">빈 프리셋 · 마켓 · 로컬 가져오기</div>
        </button>

        {sortedPresets.map((p) => (
          <div
            key={p.id}
            className="group relative rounded-2xl overflow-hidden bg-card border border-border shadow-card hover:shadow-glow transition-all"
          >
            <div className="relative aspect-[16/10] overflow-hidden cursor-pointer" onClick={() => nav(`/library/${p.id}`)}>
              <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              {visibleStatuses.includes(p.status) && (
                <span className={cn("absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md border shadow-card", statusStyles[p.status])}>
                  {p.status}
                </span>
              )}
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); togglePin(p.id); }}
                className={cn(
                  "absolute top-3 right-3 h-7 w-7 grid place-items-center rounded-md shadow-card transition-all",
                  pinned.includes(p.id)
                    ? "bg-primary text-primary-foreground opacity-100"
                    : "bg-background/80 backdrop-blur text-foreground opacity-0 group-hover:opacity-100 hover:bg-background",
                )}
                aria-label={pinned.includes(p.id) ? "상단 고정 해제" : "상단 고정"}
              >
                <Pin className={cn("h-3.5 w-3.5", pinned.includes(p.id) && "fill-current")} />
              </button>
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 gap-2">
                <Button size="sm" className="h-8 bg-gradient-primary text-primary-foreground"><Play className="h-3 w-3 mr-1" />적용</Button>
                <Button size="sm" variant="secondary" className="h-8" onClick={(e) => { e.stopPropagation(); nav(`/library/${p.id}`); }}><Edit className="h-3 w-3 mr-1" />수정</Button>
                <Button size="sm" variant="secondary" className="h-8"><Eye className="h-3 w-3 mr-1" />미리보기</Button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold truncate">{p.name}</h3>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-7 w-7 grid place-items-center rounded-md hover:bg-muted">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => nav(`/library/${p.id}`)}>프리셋 상세 보기</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => nav(`/library/${p.id}`)}>프리셋 수정</DropdownMenuItem>
                    <DropdownMenuItem>바로 적용</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>초기 상태로 복원</DropdownMenuItem>
                    <DropdownMenuItem>다시 다운로드</DropdownMenuItem>
                    <DropdownMenuItem>복제</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => nav("/upload")}>마켓에 업로드</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive">삭제</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-primary" style={{ width: `${(p.mappedCount / p.iconCount) * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>새 프리셋 만들기</DialogTitle>
            <DialogDescription>어떻게 시작할지 선택하세요.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <CreateOption icon={Sparkles} title="빈 프리셋 만들기" desc="배경화면과 아이콘을 직접 업로드해서 새로 만들기" />
            <CreateOption icon={Store} title="마켓에서 불러오기" desc="마켓플레이스에서 프리셋을 다운로드" onClick={() => { setCreateOpen(false); nav("/explore"); }} />
            <CreateOption icon={Monitor} title="현재 바탕화면으로 만들기" desc="현재 데스크톱 상태를 캡처해 프리셋으로 저장" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateOption({ icon: Icon, title, desc, onClick }: { icon: any; title: string; desc: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all"
    >
      <Icon className="h-5 w-5 text-primary mb-2" />
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{desc}</div>
    </button>
  );
}