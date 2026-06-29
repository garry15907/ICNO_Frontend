import { useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconAsset } from "@/data/mockData";
import { Bold, Italic, FolderOpen, FileIcon, AppWindow, X, ImageIcon, RotateCcw, ChevronRight, Home, HardDrive, ArrowLeft, Search, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const presets = [32, 48, 64, 128, 256, 512];

type FsNode = {
  name: string;
  kind: "folder" | "exe" | "file";
  children?: FsNode[];
};

const fileSystem: FsNode = {
  name: "내 PC",
  kind: "folder",
  children: [
    {
      name: "C:",
      kind: "folder",
      children: [
        {
          name: "Program Files",
          kind: "folder",
          children: [
            { name: "Adobe", kind: "folder", children: [
              { name: "Photoshop.exe", kind: "exe" },
              { name: "Illustrator.exe", kind: "exe" },
              { name: "Premiere Pro.exe", kind: "exe" },
            ]},
            { name: "Figma", kind: "folder", children: [{ name: "Figma.exe", kind: "exe" }] },
            { name: "Microsoft", kind: "folder", children: [
              { name: "Word.exe", kind: "exe" },
              { name: "Excel.exe", kind: "exe" },
              { name: "PowerPoint.exe", kind: "exe" },
            ]},
            { name: "Spotify", kind: "folder", children: [{ name: "Spotify.exe", kind: "exe" }] },
            { name: "Discord", kind: "folder", children: [{ name: "Discord.exe", kind: "exe" }] },
          ],
        },
        {
          name: "Users",
          kind: "folder",
          children: [
            {
              name: "Me",
              kind: "folder",
              children: [
                { name: "Desktop", kind: "folder", children: [
                  { name: "포트폴리오.pdf", kind: "file" },
                  { name: "메모.txt", kind: "file" },
                ]},
                { name: "Documents", kind: "folder", children: [
                  { name: "이력서.docx", kind: "file" },
                  { name: "계약서.pdf", kind: "file" },
                ]},
                { name: "Downloads", kind: "folder", children: [
                  { name: "setup.exe", kind: "exe" },
                ]},
                { name: "Pictures", kind: "folder", children: [
                  { name: "wallpaper.png", kind: "file" },
                ]},
              ],
            },
          ],
        },
      ],
    },
  ],
};

function findNode(path: string[]): FsNode | null {
  let cur: FsNode | undefined = fileSystem;
  for (const seg of path) {
    if (!cur?.children) return null;
    cur = cur.children.find((c) => c.name === seg);
    if (!cur) return null;
  }
  return cur ?? null;
}

export function IconEditModal({ icon, onClose }: { icon: IconAsset & { mappedTo?: string }; onClose: () => void }) {
  const [w, setW] = useState(icon.size.w);
  const [h, setH] = useState(icon.size.h);
  const [lock, setLock] = useState(true);
  const [label, setLabel] = useState(icon.label);
  const [showLabel, setShowLabel] = useState(true);
  const [mapping, setMapping] = useState(icon.mappedTo);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [path, setPath] = useState<string[]>(["내 PC"]);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Snapshot of last-saved state for dirty tracking
  const [saved, setSaved] = useState(() => ({
    w: icon.size.w,
    h: icon.size.h,
    label: icon.label,
    showLabel: true,
    mapping: icon.mappedTo,
    imageSrc: null as string | null,
  }));

  const isDirty = useMemo(
    () =>
      saved.w !== w ||
      saved.h !== h ||
      saved.label !== label ||
      saved.showLabel !== showLabel ||
      saved.mapping !== mapping ||
      saved.imageSrc !== imageSrc,
    [saved, w, h, label, showLabel, mapping, imageSrc],
  );

  const handleSave = () => {
    setSaved({ w, h, label, showLabel, mapping, imageSrc });
    toast({ title: "저장되었습니다", description: `${label} 아이콘 변경 사항을 저장했습니다.` });
  };

  // Radix Dialog/AlertDialog 중첩 시 body에 pointer-events:none 가 남아 화면이 멈추는 문제 방지
  const restorePointerEvents = () => {
    setTimeout(() => {
      if (typeof document !== "undefined") {
        document.body.style.pointerEvents = "";
      }
    }, 0);
  };

  const handleExitClick = () => {
    if (isDirty) {
      setConfirmOpen(true);
    } else {
      restorePointerEvents();
      onClose();
    }
  };

  const handleSaveAndExit = () => {
    handleSave();
    setConfirmOpen(false);
    restorePointerEvents();
    onClose();
  };

  const handleDiscardAndExit = () => {
    setConfirmOpen(false);
    restorePointerEvents();
    onClose();
  };

  const handleCancelExit = () => {
    setConfirmOpen(false);
    restorePointerEvents();
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setImageSrc(reader.result);
    };
    reader.readAsDataURL(file);
    // Reset input so selecting the same file again still triggers change
    e.target.value = "";
  };

  const currentNode = findNode(path.slice(1));
  const entries = (currentNode?.children ?? []).filter((e) =>
    search ? e.name.toLowerCase().includes(search.toLowerCase()) : true,
  );
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.kind === "folder" && b.kind !== "folder") return -1;
    if (a.kind !== "folder" && b.kind === "folder") return 1;
    return a.name.localeCompare(b.name);
  });
  const goInto = (node: FsNode) => {
    if (node.kind === "folder") setPath((p) => [...p, node.name]);
  };
  const selectTarget = (node: FsNode) => {
    const full = [...path.slice(1), node.name].join("\\") || node.name;
    setMapping(full);
  };

  const setBoth = (v: number) => { setW(v); if (lock) setH(v); };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) handleExitClick(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>아이콘 수정 · {label}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="image" className="mt-2">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="image">이미지</TabsTrigger>
            <TabsTrigger value="size">크기/위치</TabsTrigger>
            <TabsTrigger value="style">스타일</TabsTrigger>
            <TabsTrigger value="mapping">매핑</TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">기본 이미지</Label>
                <div className="mt-2 aspect-square rounded-xl bg-muted grid place-items-center text-7xl border border-border overflow-hidden">
                  {imageSrc ? (
                    <img src={imageSrc} alt={label} className="w-full h-full object-contain" />
                  ) : (
                    <span>{icon.emoji}</span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImagePick}
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-3.5 w-3.5 mr-1" />변경
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setImageSrc(null)}
                    aria-label="초기화"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs">호버 이미지</Label>
                <div className="mt-2 aspect-square rounded-xl bg-muted grid place-items-center text-7xl border border-dashed border-border text-muted-foreground">+</div>
                <Button variant="outline" size="sm" className="w-full mt-2"><ImageIcon className="h-3.5 w-3.5 mr-1" />호버 이미지 추가</Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">아이콘 이름 / 라벨</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1.5" />
            </div>
          </TabsContent>

          <TabsContent value="size" className="space-y-5 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">가로 (px)</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Input type="number" value={w} onChange={(e) => setBoth(+e.target.value)} className="w-24" />
                  <Slider value={[w]} min={16} max={1024} step={1} onValueChange={(v) => setBoth(v[0])} />
                </div>
              </div>
              <div>
                <Label className="text-xs">세로 (px)</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Input type="number" value={h} onChange={(e) => { setH(+e.target.value); if (lock) setW(+e.target.value); }} className="w-24" />
                  <Slider value={[h]} min={16} max={1024} step={1} onValueChange={(v) => { setH(v[0]); if (lock) setW(v[0]); }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={lock} onCheckedChange={setLock} id="lock" />
              <Label htmlFor="lock" className="text-sm">가로/세로 비율 고정</Label>
            </div>
            <div>
              <Label className="text-xs">빠른 크기</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {presets.map((p) => (
                  <button key={p} onClick={() => setBoth(p)} className="px-3 py-1 rounded-md border border-border text-xs hover:border-primary">{p}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div>
                <Label className="text-xs">X 위치 (%)</Label>
                <Input type="number" defaultValue={icon.position.x} className="mt-1.5" />
              </div>
              <div>
                <Label className="text-xs">Y 위치 (%)</Label>
                <Input type="number" defaultValue={icon.position.y} className="mt-1.5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">팁: 미리보기에서 아이콘을 드래그해 위치를 조정할 수 있습니다.</p>
          </TabsContent>

          <TabsContent value="style" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label>라벨 표시</Label>
              <Switch checked={showLabel} onCheckedChange={setShowLabel} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">폰트</Label>
                <Select defaultValue="pretendard">
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pretendard">Pretendard</SelectItem>
                    <SelectItem value="noto">Noto Sans KR</SelectItem>
                    <SelectItem value="inter">Inter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">폰트 크기</Label>
                <Input type="number" defaultValue={12} className="mt-1.5" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm"><Bold className="h-3.5 w-3.5" /></Button>
              <Button variant="outline" size="sm"><Italic className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">텍스트 색상</Label>
                <Input type="color" defaultValue="#ffffff" className="mt-1.5 h-10" />
              </div>
              <div>
                <Label className="text-xs">외곽선 색상</Label>
                <Input type="color" defaultValue="#000000" className="mt-1.5 h-10" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mapping" className="space-y-3 pt-4">
            <p className="text-xs text-muted-foreground">
              파일 탐색기에서 연결할 프로그램·파일·폴더를 직접 찾아 선택하세요. 매핑 정보는 로컬에만 저장되며 마켓에 업로드되지 않습니다.
            </p>

            <div className="rounded-xl border border-border overflow-hidden bg-card">
              {/* Toolbar */}
              <div className="flex items-center gap-2 p-2 border-b border-border bg-muted/40">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={path.length <= 1}
                  onClick={() => setPath((p) => p.slice(0, -1))}
                  aria-label="뒤로"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPath(["내 PC"])}
                  aria-label="홈"
                >
                  <Home className="h-4 w-4" />
                </Button>
                {/* Breadcrumb */}
                <div className="flex-1 min-w-0 flex items-center gap-1 text-xs overflow-x-auto scrollbar-thin">
                  {path.map((seg, i) => (
                    <div key={i} className="flex items-center gap-1 shrink-0">
                      {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                      <button
                        className={cn(
                          "px-1.5 py-0.5 rounded hover:bg-muted",
                          i === path.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground",
                        )}
                        onClick={() => setPath(path.slice(0, i + 1))}
                      >
                        {seg}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="검색"
                    className="h-8 w-40 pl-7 text-xs"
                  />
                </div>
              </div>

              {/* List */}
              <ScrollArea className="h-64">
                <div className="p-1">
                  {sortedEntries.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-10">항목이 없습니다.</div>
                  ) : (
                    sortedEntries.map((node) => {
                      const Icon = node.kind === "folder" ? FolderOpen : node.kind === "exe" ? AppWindow : FileIcon;
                      const fullPath = [...path.slice(1), node.name].join("\\");
                      const isMapped = mapping === fullPath;
                      return (
                        <div
                          key={node.name}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors",
                            isMapped && "bg-primary/10 hover:bg-primary/15",
                          )}
                          onClick={() => (node.kind === "folder" ? goInto(node) : selectTarget(node))}
                          onDoubleClick={() => node.kind === "folder" && goInto(node)}
                        >
                          <Icon className={cn(
                            "h-4 w-4 shrink-0",
                            node.kind === "folder" ? "text-primary" : node.kind === "exe" ? "text-accent-foreground" : "text-muted-foreground",
                          )} />
                          <span className="flex-1 truncate text-sm">{node.name}</span>
                          {node.kind === "folder" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-[11px]"
                              onClick={(e) => { e.stopPropagation(); selectTarget(node); }}
                            >
                              이 폴더 선택
                            </Button>
                          ) : isMapped ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground mb-1">현재 연결된 대상</div>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-background px-2 py-1 rounded border border-border flex-1 truncate">
                  {mapping ?? "연결되지 않음"}
                </code>
                {mapping && (
                  <Button variant="ghost" size="sm" onClick={() => setMapping(undefined)} aria-label="매핑 해제">
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between gap-2 border-t border-border pt-4 mt-2">
          <Button
            className="bg-gradient-primary text-primary-foreground"
            onClick={handleSave}
            disabled={!isDirty}
          >
            저장
          </Button>
          <Button variant="ghost" onClick={handleExitClick}>나가기</Button>
        </div>
      </DialogContent>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(o) => {
          setConfirmOpen(o);
          if (!o) restorePointerEvents();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>저장하지 않은 변경 사항이 있습니다</AlertDialogTitle>
            <AlertDialogDescription>
              저장하고 나가시겠습니까? 저장하지 않으면 변경 사항이 사라집니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelExit}>계속 편집</AlertDialogCancel>
            <Button variant="outline" onClick={handleDiscardAndExit}>저장 안 함</Button>
            <AlertDialogAction onClick={handleSaveAndExit}>저장하고 나가기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}