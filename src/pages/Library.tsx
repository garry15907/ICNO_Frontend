import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MoreHorizontal, Play, Edit, Eye, Sparkles, FolderOpen, Monitor, Store, Pin, Image as ImageIcon, Package, FolderPlus, Trash2, ExternalLink } from "lucide-react";
import { libraryPresets, LibraryStatus, libraryIcons, libraryIconPacks, IconLibraryStatus } from "@/data/mockData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  const [tab, setTab] = useState<"presets" | "icons">("presets");
  const [iconFilter, setIconFilter] = useState<"all" | "icon" | "iconpack" | "downloaded" | "purchased" | "mine">("all");

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
          <p className="text-muted-foreground mt-1">내 프리셋과 아이콘 자산을 관리하고 적용하세요.</p>
        </div>
        <div className="text-sm text-muted-foreground">
          프리셋 {libraryPresets.length} · 아이콘 {libraryIcons.length + libraryIconPacks.length}
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="space-y-6">
        <TabsList>
          <TabsTrigger value="presets" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" />프리셋</TabsTrigger>
          <TabsTrigger value="icons" className="gap-1.5"><ImageIcon className="h-3.5 w-3.5" />아이콘</TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="mt-0">
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
                  "absolute top-3 right-3 z-20 h-7 w-7 grid place-items-center rounded-md shadow-card transition-all",
                  pinned.includes(p.id)
                    ? "bg-primary text-primary-foreground opacity-100"
                    : "bg-background/80 backdrop-blur text-foreground opacity-0 group-hover:opacity-100 hover:bg-background",
                )}
                aria-label={pinned.includes(p.id) ? "상단 고정 해제" : "상단 고정"}
              >
                <Pin className={cn("h-3.5 w-3.5", pinned.includes(p.id) && "fill-current")} />
              </button>
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
        </TabsContent>

        <TabsContent value="icons" className="mt-0 space-y-5">
          <IconLibrary filter={iconFilter} setFilter={setIconFilter} />
        </TabsContent>
      </Tabs>

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

const iconStatusStyles: Record<IconLibraryStatus, string> = {
  "다운로드됨": "bg-muted text-muted-foreground border-border",
  "구매함": "bg-accent text-accent-foreground border-border",
  "내가 만든 아이콘": "bg-primary/15 text-primary border-primary/30",
};

type IconFilter = "all" | "icon" | "iconpack" | "downloaded" | "purchased" | "mine";

function IconLibrary({ filter, setFilter }: { filter: IconFilter; setFilter: (f: IconFilter) => void }) {
  const filters: { value: IconFilter; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "icon", label: "단품 아이콘" },
    { value: "iconpack", label: "아이콘 팩" },
    { value: "downloaded", label: "다운로드함" },
    { value: "purchased", label: "구매함" },
    { value: "mine", label: "내가 만든" },
  ];

  const matchesStatus = (status: IconLibraryStatus) => {
    if (filter === "downloaded") return status === "다운로드됨";
    if (filter === "purchased") return status === "구매함";
    if (filter === "mine") return status === "내가 만든 아이콘";
    return true;
  };

  const showIcons = filter !== "iconpack";
  const showPacks = filter !== "icon";

  const icons = libraryIcons.filter((i) => matchesStatus(i.status));
  const packs = libraryIconPacks.filter((p) => matchesStatus(p.status));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
              filter === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {showIcons && icons.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-primary" /> 단품 아이콘
              <span className="text-muted-foreground font-normal">({icons.length})</span>
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {icons.map((i) => (
              <div key={i.id} className="rounded-xl bg-card border border-border p-3 hover:shadow-glow hover:border-primary/40 transition-all group">
                <div className="aspect-square rounded-lg bg-muted/50 grid place-items-center text-5xl mb-2 group-hover:scale-105 transition-transform">
                  {i.emoji}
                </div>
                <div className="text-xs font-semibold truncate">{i.name}</div>
                <div className="text-[10px] text-muted-foreground truncate mt-0.5">{i.resolution} · {i.fileType}</div>
                <span className={cn("inline-block mt-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border", iconStatusStyles[i.status])}>
                  {i.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {showPacks && packs.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-primary" /> 아이콘 팩
            <span className="text-muted-foreground font-normal">({packs.length})</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packs.map((p) => (
              <div key={p.id} className="rounded-xl bg-card border border-border p-4 hover:shadow-glow hover:border-primary/40 transition-all">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {p.thumbnailEmojis.slice(0, 6).map((e, idx) => (
                    <div key={idx} className="aspect-square rounded-md bg-muted/50 grid place-items-center text-2xl">{e}</div>
                  ))}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{p.iconCount}개 · {p.source}</div>
                  </div>
                  <span className={cn("shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border", iconStatusStyles[p.status])}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {((showIcons && icons.length === 0) || (showIcons && !showPacks && icons.length === 0)) &&
        ((showPacks && packs.length === 0) || (!showPacks)) &&
        icons.length === 0 && packs.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            조건에 맞는 아이콘 자산이 없습니다.
          </div>
        )}
    </div>
  );
}