import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, MoreHorizontal, Edit, Sparkles, Store, Pin, Image as ImageIcon, Package, Trash2, Share2, Pencil, Copy, Link as LinkIcon, Upload, FileDown, Replace, Check, X, ChevronLeft, Play, Compass, Download as DownloadIcon } from "lucide-react";
import { libraryPresets, LibraryStatus, libraryIcons, libraryIconPacks, IconLibraryStatus, marketplacePresets, libraryPresetToMarketplace, MarketplacePreset } from "@/data/mockData";
import { ExplorePresetModal } from "@/components/presets/ExplorePresetModal";
import { useLibrary } from "@/lib/library";
import { useIconLibrary } from "@/lib/icon-library";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [pinned, setPinned] = useState<string[]>([]);
  const [tab, setTab] = useState<"presets" | "icons">(
    () => (searchParams.get("tab") === "icons" ? "icons" : "presets"),
  );
  const [iconFilter, setIconFilter] = useState<"all" | "icon" | "iconpack" | "downloaded" | "purchased" | "mine">("all");
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "icons" && tab !== "icons") setTab("icons");
    if (t === "presets" && tab !== "presets") setTab("presets");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const [shareTarget, setShareTarget] = useState<{ id: string; name: string } | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [presets, setPresets] = useState(libraryPresets);
  const { savedPresets, requestApply } = useLibrary();
  const [openPreset, setOpenPreset] = useState<MarketplacePreset | null>(null);

  // Merge library seed with runtime-saved presets.
  const savedFromContext = savedPresets
    .filter((s) => !presets.some((p) => p.sourceMarketId === s.presetId))
    .map((s) => {
      const mp = marketplacePresets.find((m) => m.id === s.presetId);
      if (!mp) return null;
      return {
        id: `lib-saved-${s.id}`,
        sourceMarketId: mp.id,
        name: mp.name,
        thumbnail: mp.thumbnail,
        iconCount: mp.icons.length,
        mappedCount: 0,
        status: (s.source === "purchase" ? "구매함" : "다운로드됨") as LibraryStatus,
        lastModified: s.savedAt.slice(0, 10),
        description: mp.description,
        tags: mp.tags,
        icons: mp.icons,
        _creator: mp.creator.name,
        _savedAt: s.savedAt.slice(0, 10),
      } as any;
    })
    .filter(Boolean) as any[];

  const savedAtMap = new Map(
    savedPresets.map((s) => [s.presetId, s.savedAt.slice(0, 10)] as const),
  );
  const creatorMap = new Map(marketplacePresets.map((m) => [m.id, m.creator.name] as const));

  // Pull saved/draft wallpaper thumbnails from localStorage so newly-edited
  // presets show their actual background in the library cards.
  useEffect(() => {
    const refresh = () => {
      setPresets((prev) =>
        prev.map((p) => {
          try {
            const raw =
              localStorage.getItem(`preset-saved:${p.id}`) ??
              localStorage.getItem(`preset-draft:${p.id}`);
            if (!raw) return p;
            const data = JSON.parse(raw);
            if (data?.wallpaper && data.wallpaper !== p.thumbnail) {
              return { ...p, thumbnail: data.wallpaper };
            }
          } catch {}
          return p;
        }),
      );
    };
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const togglePin = (id: string) =>
    setPinned((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const merged = [...savedFromContext, ...presets];
  const sortedPresets = [...merged].sort(
    (a, b) => (pinned.includes(b.id) ? 1 : 0) - (pinned.includes(a.id) ? 1 : 0),
  );

  const openPresetById = (id: string) => {
    const lp = merged.find((p) => p.id === id);
    if (lp) {
      setOpenPreset(libraryPresetToMarketplace(lp as any));
      return;
    }
    const mp = marketplacePresets.find((m) => m.id === id);
    if (mp) setOpenPreset(mp);
  };

  useEffect(() => {
    const openId = searchParams.get("open");
    if (!openId) return;
    openPresetById(openId);
    const next = new URLSearchParams(searchParams);
    next.delete("open");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">보관함</h2>
          <p className="text-muted-foreground mt-1">내 프리셋과 아이콘 자산을 관리하고 적용하세요.</p>
        </div>
        <div className="text-sm text-muted-foreground">
          프리셋 {merged.length} · 아이콘 {libraryIcons.length + libraryIconPacks.length}
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as any);
          const next = new URLSearchParams(searchParams);
          next.set("tab", v);
          setSearchParams(next, { replace: true });
        }}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="presets" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" />프리셋</TabsTrigger>
          <TabsTrigger value="icons" className="gap-1.5"><ImageIcon className="h-3.5 w-3.5" />아이콘</TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="mt-0">
          {merged.length === 0 ? (
            <div className="border border-dashed border-border rounded-2xl p-16 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 grid place-items-center text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="text-base font-semibold">아직 보관함에 저장된 프리셋이 없습니다.</div>
              <div className="text-sm text-muted-foreground">탐색에서 마음에 드는 프리셋을 다운로드해보세요.</div>
              <Button className="bg-gradient-primary text-primary-foreground" onClick={() => nav("/explore")}>
                <Compass className="h-4 w-4 mr-1.5" />탐색하러 가기
              </Button>
            </div>
          ) : (
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
            <div className="relative aspect-[16/10] overflow-hidden cursor-pointer" onClick={() => openPresetById(p.id)}>
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
                  {(p as any)._creator || (p.sourceMarketId && creatorMap.get(p.sourceMarketId)) ? (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      @{(p as any)._creator ?? creatorMap.get(p.sourceMarketId!)}
                      {savedAtMap.get(p.sourceMarketId ?? "") && (
                        <> · 저장 {savedAtMap.get(p.sourceMarketId!)}</>
                      )}
                    </p>
                  ) : null}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-7 w-7 grid place-items-center rounded-md hover:bg-muted">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => openPresetById(p.id)}>
                      <Pencil className="h-3.5 w-3.5 mr-2" /> 상세 보기
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShareTarget({ id: p.id, name: p.name })}>
                      <Share2 className="h-3.5 w-3.5 mr-2" /> 공유
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setRenameTarget({ id: p.id, name: p.name }); setRenameValue(p.name); }}>
                      <Edit className="h-3.5 w-3.5 mr-2" /> 이름 변경
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setPresets((prev) => {
                        const idx = prev.findIndex((x) => x.id === p.id);
                        if (idx === -1) return prev;
                        // 기본 이름(복사본 접미사 제거)
                        const baseName = p.name.replace(/\s*복사본(?:\(\d+\))?$/, "");
                        // 기존 복사본들 중 가장 큰 번호 찾기
                        const escaped = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                        const re = new RegExp(`^${escaped}\\s*복사본(?:\\((\\d+)\\))?$`);
                        let maxN = 0;
                        let hasPlain = false;
                        prev.forEach((x) => {
                          const m = x.name.match(re);
                          if (!m) return;
                          if (m[1]) maxN = Math.max(maxN, parseInt(m[1], 10));
                          else hasPlain = true;
                        });
                        const nextName = !hasPlain
                          ? `${baseName} 복사본`
                          : `${baseName} 복사본(${Math.max(maxN, 1) + 1})`;
                        const copy = {
                          ...prev[idx],
                          id: `${p.id}-copy-${Date.now()}`,
                          name: nextName,
                          status: "로컬 수정됨" as LibraryStatus,
                        };
                        const next = [...prev];
                        next.splice(idx + 1, 0, copy);
                        return next;
                      });
                      toast({ title: "복제 완료", description: `${p.name} 복사본이 보관함에 추가되었습니다.` });
                    }}>
                      <Copy className="h-3.5 w-3.5 mr-2" /> 복제
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" /> 삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-3 h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  requestApply(p.sourceMarketId ?? p.id);
                }}
              >
                <Play className="h-3.5 w-3.5 mr-1.5" />
                적용하기
              </Button>
            </div>
          </div>
        ))}
          </div>
          )}
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
            <CreateOption
              icon={Sparkles}
              title="빈 프리셋 만들기"
              desc="배경화면과 아이콘을 직접 업로드해서 새로 만들기"
              onClick={() => {
                const id = `lib-new-${Date.now()}`;
                const baseName = "새 프리셋";
                const escaped = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const re = new RegExp(`^${escaped}(?:\\((\\d+)\\))?$`);
                let maxN = 0;
                let hasPlain = false;
                libraryPresets.forEach((x) => {
                  const m = x.name.match(re);
                  if (!m) return;
                  if (m[1]) maxN = Math.max(maxN, parseInt(m[1], 10));
                  else hasPlain = true;
                });
                const name = !hasPlain ? baseName : `${baseName}(${Math.max(maxN, 1) + 1})`;
                libraryPresets.unshift({
                  id,
                  name,
                  thumbnail: "/placeholder.svg",
                  iconCount: 0,
                  mappedCount: 0,
                  status: "내가 만든 프리셋",
                  lastModified: new Date().toISOString().slice(0, 10),
                  description: "새로 만든 빈 프리셋입니다.",
                  tags: [],
                  icons: [],
                });
                setCreateOpen(false);
                setPresets([...libraryPresets]);
                nav(`/upload?preset=${id}`);
              }}
            />
            <CreateOption icon={Store} title="마켓에서 불러오기" desc="마켓플레이스에서 프리셋을 다운로드" onClick={() => { setCreateOpen(false); nav("/explore"); }} />
          </div>
        </DialogContent>
      </Dialog>

      {/* 공유 모달 */}
      <Dialog open={!!shareTarget} onOpenChange={(o) => !o && setShareTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>프리셋 공유</DialogTitle>
            <DialogDescription>{shareTarget?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-1">
            <button
              onClick={() => { navigator.clipboard?.writeText(`https://icno.app/preset/${shareTarget?.id}`); toast({ title: "링크가 복사되었습니다" }); }}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition text-left"
            >
              <LinkIcon className="h-4 w-4 text-primary" />
              <div>
                <div className="text-sm font-medium">링크 복사</div>
                <div className="text-xs text-muted-foreground">공유 가능한 링크를 클립보드에 복사</div>
              </div>
            </button>
            <button
              onClick={() => { setShareTarget(null); nav("/upload"); }}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition text-left"
            >
              <Upload className="h-4 w-4 text-primary" />
              <div>
                <div className="text-sm font-medium">마켓에 업로드</div>
                <div className="text-xs text-muted-foreground">마켓플레이스에 프리셋을 게시</div>
              </div>
            </button>
            <button
              onClick={() => toast({ title: "프리셋 파일을 내보내는 중입니다" })}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition text-left"
            >
              <FileDown className="h-4 w-4 text-primary" />
              <div>
                <div className="text-sm font-medium">프리셋 파일로 내보내기</div>
                <div className="text-xs text-muted-foreground">.icno 파일로 저장</div>
              </div>
            </button>
            <p className="text-[11px] text-muted-foreground pt-2">
              공유 시 프로그램/파일 경로 같은 로컬 매핑 정보는 제외됩니다.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* 이름 변경 모달 */}
      <Dialog open={!!renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>이름 변경</DialogTitle>
            <DialogDescription>새로운 프리셋 이름을 입력하세요.</DialogDescription>
          </DialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>취소</Button>
            <Button onClick={() => {
              if (renameTarget) {
                setPresets((prev) => prev.map((x) => x.id === renameTarget.id ? { ...x, name: renameValue } : x));
                toast({ title: "이름이 변경되었습니다", description: renameValue });
              }
              setRenameTarget(null);
            }}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 모달 */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>프리셋 삭제</DialogTitle>
            <DialogDescription>이 프리셋을 보관함에서 삭제할까요?</DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{deleteTarget?.name}</span> 은(는) 영구적으로 삭제됩니다.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>취소</Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  setPresets((prev) => prev.filter((x) => x.id !== deleteTarget.id));
                  toast({ title: "삭제되었습니다", description: deleteTarget.name });
                }
                setDeleteTarget(null);
              }}
            >
              삭제
            </Button>
          </DialogFooter>
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

type UploadedIcon = {
  id: string;
  name: string;
  dataUrl: string;
  fileType: "PNG" | "SVG" | "ICO" | "GIF";
  resolution: string;
  fileName: string;
  createdAt: number;
};

const UPLOADED_ICONS_KEY = "library-uploaded-icons";
const ICON_OVERRIDES_KEY = "library-icon-overrides";
const PACK_OVERRIDES_KEY = "library-pack-overrides";
const DELETED_KEY = "library-icon-deleted";

type IconOverride = { name?: string; dataUrl?: string; resolution?: string; fileType?: string };
type PackIconState = { id: string; label: string; emoji?: string; dataUrl?: string; fileName: string; fileType: string; resolution: string };
type PackOverride = { name?: string; icons?: PackIconState[]; thumbnailIds?: string[] };

function loadJSON<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
function saveJSON(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

async function fileToDataUrl(file: File): Promise<{ dataUrl: string; resolution: string; fileType: "PNG" | "SVG" | "ICO" | "GIF" }> {
  const ext = file.name.split(".").pop()?.toUpperCase();
  const fileType: "PNG" | "SVG" | "ICO" | "GIF" =
    ext === "SVG" ? "SVG" : ext === "ICO" ? "ICO" : ext === "GIF" ? "GIF" : "PNG";
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  let resolution = "—";
  if (fileType !== "SVG") {
    resolution = await new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(`${img.naturalWidth} × ${img.naturalHeight}`);
      img.onerror = () => resolve("—");
      img.src = dataUrl;
    });
  }
  return { dataUrl, resolution, fileType };
}

function loadUploadedIcons(): UploadedIcon[] {
  try {
    const raw = localStorage.getItem(UPLOADED_ICONS_KEY);
    return raw ? (JSON.parse(raw) as UploadedIcon[]) : [];
  } catch {
    return [];
  }
}

function getPackIconStates(packId: string, overrides: Record<string, PackOverride>): PackIconState[] {
  const ov = overrides[packId];
  if (ov?.icons) return ov.icons;
  const pack = libraryIconPacks.find((p) => p.id === packId);
  if (!pack) return [];
  return pack.icons.map((c) => ({
    id: c.id, label: c.label, emoji: c.emoji, fileName: c.fileName, fileType: c.fileType, resolution: c.resolution,
  }));
}

function IconLibrary({ filter, setFilter }: { filter: IconFilter; setFilter: (f: IconFilter) => void }) {
  const { userIcons, requestDelete, applyIconToCurrentPreset } = useIconLibrary();
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

  const [uploaded, setUploaded] = useState<UploadedIcon[]>(() => loadUploadedIcons());
  const fileRef = useRef<HTMLInputElement>(null);
  const [iconOverrides, setIconOverrides] = useState<Record<string, IconOverride>>(() => loadJSON(ICON_OVERRIDES_KEY, {}));
  const [packOverrides, setPackOverrides] = useState<Record<string, PackOverride>>(() => loadJSON(PACK_OVERRIDES_KEY, {}));
  const [deletedIds, setDeletedIds] = useState<string[]>(() => loadJSON(DELETED_KEY, []));
  const [openIconId, setOpenIconId] = useState<string | null>(null);
  const [openPackId, setOpenPackId] = useState<string | null>(null);
  const [openPackChildId, setOpenPackChildId] = useState<string | null>(null);

  const updateIconOverride = (id: string, patch: IconOverride) => {
    setIconOverrides((prev) => {
      const next = { ...prev, [id]: { ...prev[id], ...patch } };
      saveJSON(ICON_OVERRIDES_KEY, next);
      return next;
    });
  };
  const updatePackOverride = (id: string, patch: PackOverride) => {
    setPackOverrides((prev) => {
      const next = { ...prev, [id]: { ...prev[id], ...patch } };
      saveJSON(PACK_OVERRIDES_KEY, next);
      return next;
    });
  };
  const deleteItem = (id: string) => {
    setDeletedIds((prev) => {
      const next = [...prev, id];
      saveJSON(DELETED_KEY, next);
      return next;
    });
  };

  const persist = (next: UploadedIcon[]) => {
    setUploaded(next);
    try { localStorage.setItem(UPLOADED_ICONS_KEY, JSON.stringify(next)); } catch {}
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    const results: UploadedIcon[] = [];
    for (const file of arr) {
      const { dataUrl, resolution, fileType } = await fileToDataUrl(file);
      results.push({
        id: `ui-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name.replace(/\.[^.]+$/, ""),
        dataUrl,
        fileType,
        resolution,
        fileName: file.name,
        createdAt: Date.now(),
      });
    }
    persist([...results, ...uploaded]);
    toast({ title: "아이콘이 업로드되었습니다", description: `${results.length}개 추가됨` });
  };

  const removeUploaded = (id: string) => {
    persist(uploaded.filter((x) => x.id !== id));
  };

  // 업로드한 아이콘 → 단품 아이콘으로 통합 (상태: 내가 만든 아이콘)
  type UnifiedItem =
    | { kind: "icon"; id: string; name: string; resolution: string; fileType: string; status: IconLibraryStatus; emoji?: string; dataUrl?: string; uploadedId?: string; createdAt: number }
    | { kind: "iconpack"; id: string; name: string; iconCount: number; source?: string; thumbnailEmojis: string[]; status: IconLibraryStatus; createdAt: number };

  const uploadedAsItems: UnifiedItem[] = uploaded.map((u) => ({
    kind: "icon",
    id: u.id,
    name: u.name,
    resolution: u.resolution,
    fileType: u.fileType,
    status: "내가 만든 아이콘",
    dataUrl: u.dataUrl,
    uploadedId: u.id,
    createdAt: u.createdAt,
  }));

  const iconItems: UnifiedItem[] = libraryIcons.map((i) => ({
    kind: "icon",
    id: i.id,
    name: i.name,
    resolution: i.resolution,
    fileType: i.fileType,
    status: i.status,
    emoji: i.emoji,
    createdAt: 0,
  }));

  const packItems: UnifiedItem[] = libraryIconPacks.map((p) => ({
    kind: "iconpack",
    id: p.id,
    name: p.name,
    iconCount: p.iconCount,
    source: p.source,
    thumbnailEmojis: p.thumbnailEmojis,
    status: p.status,
    createdAt: 0,
  }));

  let merged: UnifiedItem[] = [...uploadedAsItems, ...iconItems, ...packItems];

  // 삭제 + 오버라이드 적용
  merged = merged
    .filter((it) => !deletedIds.includes(it.id))
    .map((it) => {
      if (it.kind === "icon") {
        const ov = iconOverrides[it.id];
        if (!ov) return it;
        return {
          ...it,
          name: ov.name ?? it.name,
          dataUrl: ov.dataUrl ?? it.dataUrl,
          resolution: ov.resolution ?? it.resolution,
          fileType: (ov.fileType as any) ?? it.fileType,
        };
      }
      const ov = packOverrides[it.id];
      if (!ov) return it;
      const baseIcons = getPackIconStates(it.id, packOverrides);
      const thumbs = (ov.thumbnailIds && ov.thumbnailIds.length > 0
        ? ov.thumbnailIds.map((tid) => baseIcons.find((b) => b.id === tid)).filter(Boolean) as PackIconState[]
        : baseIcons.slice(0, 6));
      return {
        ...it,
        name: ov.name ?? it.name,
        iconCount: baseIcons.length,
        thumbnailEmojis: thumbs.map((t) => t.emoji ?? "🖼️"),
      };
    });

  // 필터 적용
  merged = merged.filter((it) => {
    if (filter === "icon") return it.kind === "icon";
    if (filter === "iconpack") return it.kind === "iconpack";
    if (filter === "downloaded") return it.status === "다운로드됨";
    if (filter === "purchased") return it.status === "구매함";
    if (filter === "mine") return it.status === "내가 만든 아이콘";
    return true;
  });

  // 그룹화: 단품 아이콘 / 아이콘 팩
  const groupIcons = merged.filter((m) => m.kind === "icon");
  const groupPacks = merged.filter((m) => m.kind === "iconpack");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
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
        <Button size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5">
          <Upload className="h-3.5 w-3.5" /> 아이콘 업로드
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/svg+xml,image/x-icon,image/gif,.ico,.png,.svg,.gif"
          multiple
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); if (fileRef.current) fileRef.current.value = ""; }}
        />
      </div>

      {userIcons.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <DownloadIcon className="h-3.5 w-3.5 text-primary" />
              다운로드한 아이콘
              <span className="text-muted-foreground font-normal">({userIcons.length})</span>
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {userIcons.map((ic) => (
              <div
                key={ic.id}
                className="rounded-xl bg-card border border-border p-3 flex flex-col hover:shadow-glow hover:border-primary/40 transition-all"
              >
                <div
                  className="aspect-square rounded-lg grid place-items-center text-5xl overflow-hidden mb-2"
                  style={{
                    background: ic.hasTransparentBackground
                      ? "repeating-conic-gradient(hsl(var(--muted)) 0% 25%, transparent 0% 50%) 50% / 16px 16px"
                      : "hsl(var(--muted) / 0.5)",
                  }}
                >
                  {ic.imageUrl ? (
                    <img src={ic.imageUrl} alt={ic.title} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span>{ic.emoji ?? "🖼️"}</span>
                  )}
                </div>
                <div className="text-xs font-semibold truncate">{ic.title}</div>
                <div className="text-[10px] text-muted-foreground truncate">{ic.creatorName}</div>
                <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {ic.fileFormat} · {ic.width}×{ic.height}
                  {ic.hasTransparentBackground ? " · 투명" : ""}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  저장 {ic.downloadedAt.slice(0, 10)}
                </div>
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  <Button
                    size="sm"
                    className="h-7 text-[11px] bg-gradient-primary text-primary-foreground hover:opacity-90"
                    onClick={() => applyIconToCurrentPreset(ic.id)}
                  >
                    프리셋에 사용
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] text-destructive hover:text-destructive"
                    onClick={() => requestDelete(ic.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />삭제
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {groupIcons.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-primary" /> 단품 아이콘
              <span className="text-muted-foreground font-normal">({groupIcons.length})</span>
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {groupIcons.map((i) => i.kind === "icon" && (
              <button
                key={i.id}
                onClick={() => setOpenIconId(i.id)}
                className="text-left relative rounded-xl bg-card border border-border p-3 hover:shadow-glow hover:border-primary/40 transition-all group"
              >
                <div className="aspect-square rounded-lg bg-muted/50 grid place-items-center overflow-hidden text-5xl mb-2 group-hover:scale-105 transition-transform">
                  {i.dataUrl
                    ? <img src={i.dataUrl} alt={i.name} className="max-w-full max-h-full object-contain" />
                    : <span>{i.emoji}</span>}
                </div>
                <div className="text-xs font-semibold truncate">{i.name}</div>
                <div className="text-[10px] text-muted-foreground truncate mt-0.5">{i.resolution} · {i.fileType}</div>
                <span className={cn("inline-block mt-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border", iconStatusStyles[i.status])}>
                  {i.status}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {groupPacks.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-primary" /> 아이콘 팩
            <span className="text-muted-foreground font-normal">({groupPacks.length})</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupPacks.map((p) => p.kind === "iconpack" && (
              <button
                key={p.id}
                onClick={() => setOpenPackId(p.id)}
                className="text-left rounded-xl bg-card border border-border p-4 hover:shadow-glow hover:border-primary/40 transition-all"
              >
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
              </button>
            ))}
          </div>
        </section>
      )}

      {groupIcons.length === 0 && groupPacks.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          조건에 맞는 아이콘 자산이 없습니다.
        </div>
      )}

      {/* 단품 아이콘 상세 모달 */}
      <IconDetailModal
        iconId={openIconId}
        onClose={() => setOpenIconId(null)}
        merged={merged}
        onSave={(id, patch) => {
          // 업로드한 아이콘은 uploaded에 기록, 기타는 override에 기록
          const target = merged.find((m) => m.kind === "icon" && m.id === id);
          if (target && (target as any).uploadedId) {
            persist(uploaded.map((u) => u.id === id ? {
              ...u,
              name: patch.name ?? u.name,
              dataUrl: patch.dataUrl ?? u.dataUrl,
              resolution: patch.resolution ?? u.resolution,
              fileType: (patch.fileType as any) ?? u.fileType,
            } : u));
          } else {
            updateIconOverride(id, patch);
          }
          toast({ title: "저장되었습니다" });
        }}
        onDelete={(id) => {
          const target = merged.find((m) => m.kind === "icon" && m.id === id);
          if (target && (target as any).uploadedId) removeUploaded(id);
          else deleteItem(id);
          setOpenIconId(null);
          toast({ title: "삭제되었습니다" });
        }}
      />

      {/* 아이콘 팩 상세 모달 */}
      <PackDetailModal
        packId={openPackId}
        onClose={() => { setOpenPackId(null); setOpenPackChildId(null); }}
        packOverrides={packOverrides}
        openChildId={openPackChildId}
        setOpenChildId={setOpenPackChildId}
        onSavePack={(id, patch) => { updatePackOverride(id, patch); toast({ title: "그룹이 저장되었습니다" }); }}
        onDeletePack={(id) => { deleteItem(id); setOpenPackId(null); toast({ title: "그룹이 삭제되었습니다" }); }}
      />

    </div>
  );
}

// ============= 상세 모달 =============

function IconDetailModal({
  iconId, merged, onClose, onSave, onDelete,
}: {
  iconId: string | null;
  merged: any[];
  onClose: () => void;
  onSave: (id: string, patch: IconOverride) => void;
  onDelete: (id: string) => void;
}) {
  const item = iconId ? merged.find((m) => m.kind === "icon" && m.id === iconId) : null;
  const [name, setName] = useState("");
  const [dataUrl, setDataUrl] = useState<string | undefined>();
  const [emoji, setEmoji] = useState<string | undefined>();
  const [resolution, setResolution] = useState("");
  const [fileType, setFileType] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDataUrl(item.dataUrl);
      setEmoji(item.emoji);
      setResolution(item.resolution);
      setFileType(item.fileType);
    }
  }, [iconId]);

  if (!item) return null;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const r = await fileToDataUrl(file);
    setDataUrl(r.dataUrl);
    setResolution(r.resolution);
    setFileType(r.fileType);
    setEmoji(undefined);
  };

  return (
    <Dialog open={!!iconId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>아이콘 정보</DialogTitle>
          <DialogDescription>아이콘 이미지와 이름을 수정할 수 있습니다.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="aspect-square w-40 mx-auto rounded-xl bg-muted/50 grid place-items-center overflow-hidden text-7xl border border-border">
            {dataUrl ? <img src={dataUrl} alt={name} className="max-w-full max-h-full object-contain" /> : <span>{emoji}</span>}
          </div>
          <div className="flex justify-center">
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="gap-1.5">
              <Replace className="h-3.5 w-3.5" /> 이미지 파일 변경
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/svg+xml,image/x-icon,image/gif,.ico,.png,.svg,.gif"
              className="hidden"
              onChange={(e) => { handleFile(e.target.files?.[0]); if (fileRef.current) fileRef.current.value = ""; }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">이름</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div><div className="font-medium text-foreground mb-0.5">해상도</div>{resolution || "—"}</div>
            <div><div className="font-medium text-foreground mb-0.5">파일 형식</div>{fileType || "—"}</div>
            <div className="col-span-2"><div className="font-medium text-foreground mb-0.5">상태</div>{item.status}</div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => onDelete(item.id)}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> 삭제
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={() => { onSave(item.id, { name, dataUrl, resolution, fileType }); onClose(); }}>
            <Check className="h-3.5 w-3.5 mr-1.5" /> 저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PackDetailModal({
  packId, onClose, packOverrides, openChildId, setOpenChildId, onSavePack, onDeletePack,
}: {
  packId: string | null;
  onClose: () => void;
  packOverrides: Record<string, PackOverride>;
  openChildId: string | null;
  setOpenChildId: (id: string | null) => void;
  onSavePack: (id: string, patch: PackOverride) => void;
  onDeletePack: (id: string) => void;
}) {
  const basePack = packId ? libraryIconPacks.find((p) => p.id === packId) : null;
  const [name, setName] = useState("");
  const [icons, setIcons] = useState<PackIconState[]>([]);
  const [thumbIds, setThumbIds] = useState<string[]>([]);
  const addRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (basePack && packId) {
      const ov = packOverrides[packId] ?? {};
      setName(ov.name ?? basePack.name);
      setIcons(getPackIconStates(packId, packOverrides));
      setThumbIds(ov.thumbnailIds ?? getPackIconStates(packId, packOverrides).slice(0, 6).map((i) => i.id));
      setOpenChildId(null);
    }
  }, [packId]);

  if (!basePack || !packId) return null;

  const childIcon = openChildId ? icons.find((i) => i.id === openChildId) : null;

  const toggleThumb = (id: string) => {
    setThumbIds((prev) => prev.includes(id)
      ? prev.filter((x) => x !== id)
      : prev.length >= 6 ? [...prev.slice(1), id] : [...prev, id]);
  };

  const handleAddIcons = async (files: FileList | null) => {
    if (!files) return;
    const next: PackIconState[] = [];
    for (const f of Array.from(files)) {
      const r = await fileToDataUrl(f);
      next.push({
        id: `pi-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        label: f.name.replace(/\.[^.]+$/, ""),
        dataUrl: r.dataUrl,
        fileName: f.name,
        fileType: r.fileType,
        resolution: r.resolution,
      });
    }
    setIcons((prev) => [...prev, ...next]);
  };

  const removeChild = (id: string) => {
    setIcons((prev) => prev.filter((i) => i.id !== id));
    setThumbIds((prev) => prev.filter((x) => x !== id));
  };

  const updateChild = (id: string, patch: Partial<PackIconState>) => {
    setIcons((prev) => prev.map((i) => i.id === id ? { ...i, ...patch } : i));
  };

  const handleReplaceChild = async (file: File | undefined) => {
    if (!file || !openChildId) return;
    const r = await fileToDataUrl(file);
    updateChild(openChildId, { dataUrl: r.dataUrl, fileType: r.fileType, resolution: r.resolution, emoji: undefined });
  };

  return (
    <Dialog open={!!packId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        {!childIcon ? (
          <>
            <DialogHeader>
              <DialogTitle>아이콘 그룹 편집</DialogTitle>
              <DialogDescription>그룹의 이름, 아이콘 구성, 그리고 썸네일을 관리할 수 있습니다.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">그룹 이름</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    아이콘 ({icons.length}) · 썸네일 클릭으로 표시 항목 선택 (최대 6개)
                  </div>
                  <Button size="sm" variant="outline" onClick={() => addRef.current?.click()} className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> 아이콘 추가
                  </Button>
                  <input ref={addRef} type="file" multiple accept="image/png,image/svg+xml,image/x-icon,image/gif,.ico,.png,.svg,.gif" className="hidden"
                    onChange={(e) => { handleAddIcons(e.target.files); if (addRef.current) addRef.current.value = ""; }} />
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[320px] overflow-auto p-1">
                  {icons.map((c) => {
                    const isThumb = thumbIds.includes(c.id);
                    return (
                      <div key={c.id} className="relative group">
                        <button
                          type="button"
                          onClick={() => setOpenChildId(c.id)}
                          className={cn(
                            "w-full aspect-square rounded-lg bg-muted/50 grid place-items-center overflow-hidden text-3xl border-2 transition-all",
                            isThumb ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-primary/40",
                          )}
                          title={c.label}
                        >
                          {c.dataUrl ? <img src={c.dataUrl} alt={c.label} className="max-w-full max-h-full object-contain" /> : <span>{c.emoji}</span>}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleThumb(c.id); }}
                          className={cn(
                            "absolute top-1 left-1 h-5 w-5 grid place-items-center rounded text-[10px] font-bold transition",
                            isThumb ? "bg-primary text-primary-foreground" : "bg-background/80 text-muted-foreground opacity-0 group-hover:opacity-100",
                          )}
                          title={isThumb ? "썸네일 해제" : "썸네일로 지정"}
                        >
                          {isThumb ? <Check className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                        </button>
                        <div className="text-[10px] truncate text-center mt-1 text-muted-foreground">{c.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => onDeletePack(packId)}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> 그룹 삭제
              </Button>
              <div className="flex-1" />
              <Button variant="outline" onClick={onClose}>취소</Button>
              <Button onClick={() => { onSavePack(packId, { name, icons, thumbnailIds: thumbIds }); onClose(); }}>
                <Check className="h-3.5 w-3.5 mr-1.5" /> 저장
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <button onClick={() => setOpenChildId(null)} className="h-7 w-7 grid place-items-center rounded-md hover:bg-muted">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                아이콘 정보
              </DialogTitle>
              <DialogDescription>그룹 내 아이콘을 편집합니다.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="aspect-square w-40 mx-auto rounded-xl bg-muted/50 grid place-items-center overflow-hidden text-7xl border border-border">
                {childIcon.dataUrl
                  ? <img src={childIcon.dataUrl} alt={childIcon.label} className="max-w-full max-h-full object-contain" />
                  : <span>{childIcon.emoji}</span>}
              </div>
              <div className="flex justify-center">
                <Button size="sm" variant="outline" onClick={() => replaceRef.current?.click()} className="gap-1.5">
                  <Replace className="h-3.5 w-3.5" /> 이미지 파일 변경
                </Button>
                <input ref={replaceRef} type="file" accept="image/png,image/svg+xml,image/x-icon,image/gif,.ico,.png,.svg,.gif" className="hidden"
                  onChange={(e) => { handleReplaceChild(e.target.files?.[0]); if (replaceRef.current) replaceRef.current.value = ""; }} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">이름</label>
                <Input value={childIcon.label} onChange={(e) => updateChild(childIcon.id, { label: e.target.value })} className="mt-1.5" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div><div className="font-medium text-foreground mb-0.5">해상도</div>{childIcon.resolution || "—"}</div>
                <div><div className="font-medium text-foreground mb-0.5">파일 형식</div>{childIcon.fileType || "—"}</div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => { removeChild(childIcon.id); setOpenChildId(null); }}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> 삭제
              </Button>
              <div className="flex-1" />
              <Button onClick={() => setOpenChildId(null)}>완료</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}