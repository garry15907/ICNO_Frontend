import { useEffect, useMemo, useRef, useState, type DragEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Upload as UploadIcon,
  ImageIcon,
  Check,
  X,
  Sparkles,
  Monitor,
  AlertCircle,
  Maximize2,
  Grid3x3,
  Trash2,
  Plus,
  FolderOpen,
  Eye,
  Save,
  ImagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type IconAsset = { id: string; file: File; previewUrl: string };
type PlacedIcon = {
  id: string;
  assetId: string;
  fileName: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  showLabel: boolean;
};

const CATEGORIES = ["자연", "캐릭터", "다크", "미니멀", "게임", "파스텔", "사이버펑크"];

function parseJsonc(text: string): unknown {
  const stripped = text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/,(\s*[}\]])/g, "$1");
  return JSON.parse(stripped);
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

function extOf(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toUpperCase() : "";
}

const uid = () => Math.random().toString(36).slice(2, 10);

export default function Upload() {
  const { toast } = useToast();

  const [wallpaper, setWallpaper] = useState<{ file: File; url: string } | null>(null);
  const [iconAssets, setIconAssets] = useState<IconAsset[]>([]);
  const [placed, setPlaced] = useState<PlacedIcon[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const [isPublic, setIsPublic] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState<string>("");
  const [allowComments, setAllowComments] = useState(true);
  const [allowRatings, setAllowRatings] = useState(true);

  const [editorOpen, setEditorOpen] = useState(false);

  const handleWallpaper = (file?: File) => {
    if (!file) return;
    if (!/\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
      toast({ title: "지원하지 않는 형식", description: "JPG, PNG, WEBP, GIF만 업로드할 수 있어요." });
      return;
    }
    setWallpaper({ file, url: URL.createObjectURL(file) });
  };

  const handleIcons = (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => /\.(png|svg|ico)$/i.test(f.name));
    if (!arr.length) {
      toast({ title: "지원하지 않는 형식", description: "PNG, SVG, ICO만 업로드할 수 있어요." });
      return;
    }
    setIconAssets((prev) => [
      ...prev,
      ...arr.map((file) => ({ id: uid(), file, previewUrl: URL.createObjectURL(file) })),
    ]);
  };

  const addTag = () => {
    const t = tagInput.trim().replace(/,$/, "");
    if (!t) return;
    if (!tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const checks = [
    { key: "wp", label: "배경화면 선택 완료", done: !!wallpaper },
    { key: "ic", label: "아이콘 파일 추가 완료", done: iconAssets.length > 0 },
    { key: "place", label: "아이콘 배치 완료", done: placed.length > 0 },
    { key: "layout", label: "배치 정보 생성 완료", done: !!wallpaper && placed.length > 0 },
    { key: "info", label: "프리셋 정보 입력 완료", done: name.trim().length > 0 && category.length > 0 },
    { key: "sale", label: "판매 설정 완료", done: !isPaid || (!!price && Number(price) > 0) },
  ];
  const allDone = checks.every((c) => c.done);

  const handlePublish = () => {
    if (!allDone) return;
    toast({ title: "프리셋이 게시되었습니다", description: `${name} · ${placed.length}개 아이콘 배치됨` });
  };

  const handleSaveDraft = () => {
    toast({ title: "임시저장되었습니다", description: name || "이름 없는 프리셋" });
  };

  const assetById = useMemo(() => {
    const m = new Map<string, IconAsset>();
    iconAssets.forEach((a) => m.set(a.id, a));
    return m;
  }, [iconAssets]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">프리셋 등록</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            배경화면, 아이콘, 배치 정보를 구성해 나만의 데스크탑 프리셋을 공유하세요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-lg" onClick={handleSaveDraft}>임시저장</Button>
          <Button
            onClick={handlePublish}
            disabled={!allDone}
            className={cn(
              "rounded-lg h-10 px-5 font-semibold transition-all",
              allDone
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            <Sparkles className="h-4 w-4" /> 게시하기
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.15fr_1fr] gap-6">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border/60 bg-card/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">데스크탑 미리보기</h2>
              </div>
              <button
                onClick={() => setEditorOpen(true)}
                className="text-[11px] text-primary hover:underline flex items-center gap-1"
              >
                <Maximize2 className="h-3 w-3" /> 전체화면 편집
              </button>
            </div>
            <button
              onClick={() => setEditorOpen(true)}
              className="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-border bg-muted group cursor-pointer"
            >
              {wallpaper ? (
                <img src={wallpaper.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-center px-6 bg-gradient-to-br from-muted/40 to-muted/10">
                  <div className="text-muted-foreground">
                    <Monitor className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <div className="text-sm font-medium text-foreground">배경화면과 아이콘을 추가해 프리셋을 구성하세요.</div>
                    <div className="text-xs mt-1">미리보기를 클릭하면 전체화면 편집 모드로 이동합니다.</div>
                  </div>
                </div>
              )}
              {wallpaper && placed.map((ic) => {
                const a = assetById.get(ic.assetId);
                return (
                  <div
                    key={ic.id}
                    style={{ left: `${ic.x}%`, top: `${ic.y}%`, width: ic.width * 0.5, height: ic.height * 0.5 }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 pointer-events-none"
                  >
                    <div className="w-full h-full rounded-lg bg-background/80 backdrop-blur grid place-items-center overflow-hidden shadow-card">
                      {a ? <img src={a.previewUrl} alt="" className="max-h-[80%] max-w-[80%] object-contain" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    {ic.showLabel && (
                      <span className="text-[9px] text-white drop-shadow-lg max-w-[64px] truncate">{ic.label}</span>
                    )}
                  </div>
                );
              })}
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors grid place-items-center opacity-0 group-hover:opacity-100">
                <div className="bg-background/90 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5">
                  <Maximize2 className="h-3.5 w-3.5" /> 클릭해서 편집 모드 열기
                </div>
              </div>
            </button>
            <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>배경화면 {wallpaper ? "✓" : "—"}</span>
              <span>·</span>
              <span>아이콘 파일 {iconAssets.length}개</span>
              <span>·</span>
              <span>배치된 아이콘 {placed.length}개</span>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <StepCard step="01" title="프리셋 정보" desc="마켓에 표시될 기본 정보를 입력해주세요.">
            <div className="space-y-4">
              <div>
                <Label className="text-xs">프리셋 이름</Label>
                <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 노을, 픽셀 게임룸" />
              </div>
              <div>
                <Label className="text-xs">설명</Label>
                <Textarea className="mt-1.5 min-h-20" value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="프리셋의 컨셉과 분위기를 설명하세요." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">카테고리</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">태그</Label>
                  <Input
                    className="mt-1.5"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="태그 입력 후 Enter"
                  />
                </div>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <Badge key={t} variant="secondary" className="gap-1 pr-1">
                      {t}
                      <button onClick={() => setTags(tags.filter((x) => x !== t))} className="opacity-60 hover:opacity-100">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </StepCard>

          <StepCard step="02" title="공개 및 판매 설정" desc="누구에게 어떻게 공개할지 선택하세요.">
            <div className="space-y-1 divide-y divide-border/50">
              <ToggleRow label="공개" desc="마켓에서 다른 사용자가 검색·다운로드할 수 있어요." checked={isPublic} onChange={setIsPublic} />
              <ToggleRow label="유료 판매" desc="가격을 설정하고 판매할 수 있어요." checked={isPaid} onChange={setIsPaid} />
              {isPaid && (
                <div className="pt-3">
                  <Label className="text-xs">가격 (원)</Label>
                  <Input type="number" className="mt-1.5" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="4900" />
                </div>
              )}
              <ToggleRow label="댓글 허용" desc="다른 사용자가 댓글을 남길 수 있어요." checked={allowComments} onChange={setAllowComments} />
              <ToggleRow label="평점 허용" desc="다른 사용자가 평점을 매길 수 있어요." checked={allowRatings} onChange={setAllowRatings} />
            </div>
          </StepCard>

          <StepCard step="03" title="업로드 상태" desc="모든 항목이 완료되면 게시할 수 있어요.">
            <ul className="space-y-2">
              {checks.map((c) => (
                <li key={c.key} className="flex items-center gap-3 text-sm">
                  <span className={cn(
                    "h-5 w-5 rounded-full grid place-items-center border transition-colors",
                    c.done ? "bg-primary border-primary text-primary-foreground" : "border-border text-muted-foreground",
                  )}>
                    {c.done ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />}
                  </span>
                  <span className={c.done ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 mt-5">
              <Button variant="outline" className="flex-1 rounded-lg" onClick={handleSaveDraft}>임시저장</Button>
              <Button
                onClick={handlePublish}
                disabled={!allDone}
                className={cn(
                  "flex-1 rounded-lg font-semibold",
                  allDone
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
                    : "bg-muted text-muted-foreground cursor-not-allowed",
                )}
              >
                <Sparkles className="h-4 w-4" /> 게시하기
              </Button>
            </div>
          </StepCard>
        </div>
      </div>

      {editorOpen && (
        <FullscreenEditor
          wallpaper={wallpaper}
          iconAssets={iconAssets}
          placed={placed}
          onWallpaper={handleWallpaper}
          onAddIcons={handleIcons}
          onClose={() => setEditorOpen(false)}
          onSave={(next) => {
            setPlaced(next);
            setEditorOpen(false);
            toast({ title: "배치 정보가 저장되었습니다", description: `${next.length}개 아이콘` });
          }}
        />
      )}
    </div>
  );
}

function StepCard({ step, title, desc, children }: { step: string; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/50 p-5">
      <header className="flex items-start gap-3 mb-4">
        <span className="text-[11px] font-semibold tracking-wider text-primary bg-primary/10 rounded-md px-2 py-1">
          STEP {step}
        </span>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// =====================================================================
// Fullscreen Editor
// =====================================================================

function FullscreenEditor({
  wallpaper,
  iconAssets,
  placed,
  onWallpaper,
  onAddIcons,
  onClose,
  onSave,
}: {
  wallpaper: { file: File; url: string } | null;
  iconAssets: IconAsset[];
  placed: PlacedIcon[];
  onWallpaper: (f?: File) => void;
  onAddIcons: (f: FileList | File[]) => void;
  onClose: () => void;
  onSave: (next: PlacedIcon[]) => void;
}) {
  const { toast } = useToast();
  const [items, setItems] = useState<PlacedIcon[]>(placed);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [grid, setGrid] = useState(true);
  const [assetOpen, setAssetOpen] = useState<false | "wallpaper" | "icons" | "layout">(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [dirty, setDirty] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  const update = (id: string, patch: Partial<PlacedIcon>) => {
    setItems((arr) => arr.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    setDirty(true);
  };

  const addToCanvas = (asset: IconAsset) => {
    const n = items.length;
    const x = 5 + ((n % 10) * 8);
    const y = 8 + (Math.floor(n / 10) * 14);
    const next: PlacedIcon = {
      id: uid(),
      assetId: asset.id,
      fileName: asset.file.name,
      label: asset.file.name.replace(/\.[^.]+$/, ""),
      x, y,
      width: 72,
      height: 72,
      showLabel: true,
    };
    setItems((a) => [...a, next]);
    setSelectedId(next.id);
    setDirty(true);
  };

  const importLayout = async (file: File) => {
    if (!/\.(jsonc?|json\.c|c)$/i.test(file.name)) {
      toast({ title: "오류", description: "배치 정보 파일 형식이 올바르지 않습니다." });
      return;
    }
    try {
      const text = await file.text();
      const parsed: any = parseJsonc(text);
      if (!parsed?.icons || !Array.isArray(parsed.icons)) throw new Error();
      const next: PlacedIcon[] = parsed.icons.map((it: any, i: number) => {
        const match = iconAssets.find((a) => a.file.name === it.fileName || a.file.name === it.file || a.file.name === it.name);
        return {
          id: uid(),
          assetId: match?.id ?? "",
          fileName: it.fileName || it.file || it.name || `icon-${i}`,
          label: it.label || it.name || `아이콘 ${i + 1}`,
          x: Number(it.x) || 5,
          y: Number(it.y) || 5,
          width: Number(it.width) || 72,
          height: Number(it.height) || 72,
          showLabel: it.showLabel !== false,
        };
      });
      setItems(next);
      setDirty(true);
      toast({ title: "배치 정보가 적용되었습니다" });
    } catch {
      toast({ title: "오류", description: "배치 정보 파일 형식이 올바르지 않습니다." });
    }
  };

  const dragRef = useRef<{ id: string; offX: number; offY: number } | null>(null);
  const onPointerDown = (e: ReactPointerEvent, ic: PlacedIcon) => {
    e.stopPropagation();
    setSelectedId(ic.id);
    const rect = canvasRef.current!.getBoundingClientRect();
    const px = (ic.x / 100) * rect.width;
    const py = (ic.y / 100) * rect.height;
    dragRef.current = { id: ic.id, offX: e.clientX - rect.left - px, offY: e.clientY - rect.top - py };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!dragRef.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    let x = ((e.clientX - rect.left - dragRef.current.offX) / rect.width) * 100;
    let y = ((e.clientY - rect.top - dragRef.current.offY) / rect.height) * 100;
    if (grid) {
      x = Math.round(x / 2) * 2;
      y = Math.round(y / 2) * 2;
    }
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));
    update(dragRef.current.id, { x, y });
  };
  const onPointerUp = () => { dragRef.current = null; };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedId) {
        setItems((a) => a.filter((i) => i.id !== selectedId));
        setSelectedId(null);
        setDirty(true);
      }
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId]);

  const tryClose = () => {
    if (dirty) setConfirmCancel(true);
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      <div className="h-12 border-b border-border/60 bg-card/80 backdrop-blur flex items-center px-4 gap-2 shrink-0">
        <div className="text-sm font-semibold">프리셋 편집</div>
        <div className="flex-1" />
        <ToolbarBtn icon={<ImagePlus className="h-3.5 w-3.5" />} onClick={() => setAssetOpen("wallpaper")}>배경화면 변경</ToolbarBtn>
        <ToolbarBtn icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setAssetOpen("icons")}>아이콘 추가</ToolbarBtn>
        <ToolbarBtn icon={<FolderOpen className="h-3.5 w-3.5" />} onClick={() => setAssetOpen("layout")}>자산 불러오기</ToolbarBtn>
        <button
          onClick={() => setGrid((g) => !g)}
          className={cn(
            "h-8 px-2.5 rounded-md text-xs flex items-center gap-1.5 border",
            grid ? "bg-primary/15 text-primary border-primary/30" : "bg-background border-border text-muted-foreground",
          )}
        >
          <Grid3x3 className="h-3.5 w-3.5" /> 그리드 스냅 {grid ? "ON" : "OFF"}
        </button>
        <ToolbarBtn icon={<Eye className="h-3.5 w-3.5" />} onClick={() => setSelectedId(null)}>미리보기</ToolbarBtn>
        <div className="w-px h-6 bg-border mx-1" />
        <Button size="sm" variant="ghost" className="h-8" onClick={tryClose}>취소</Button>
        <Button size="sm" className="h-8 bg-primary hover:bg-primary/90" onClick={() => onSave(items)}>
          <Save className="h-3.5 w-3.5" /> 저장하고 나가기
        </Button>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 relative bg-black overflow-hidden" onClick={() => setSelectedId(null)}>
          {wallpaper ? (
            <img src={wallpaper.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <div className="text-center">
                <Monitor className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <div className="text-sm">상단 "배경화면 변경"으로 배경을 선택하세요.</div>
              </div>
            </div>
          )}
          {grid && (
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage:
                  "linear-gradient(to right, hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary) / 0.3) 1px, transparent 1px)",
                backgroundSize: "5% 5%",
              }}
            />
          )}
          <div ref={canvasRef} className="absolute inset-0" onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
            {items.map((ic) => {
              const a = iconAssets.find((x) => x.id === ic.assetId);
              const isSel = ic.id === selectedId;
              return (
                <div
                  key={ic.id}
                  onPointerDown={(e) => onPointerDown(e, ic)}
                  style={{ left: `${ic.x}%`, top: `${ic.y}%`, width: ic.width, height: ic.height }}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing select-none",
                    isSel && "ring-2 ring-primary rounded-xl",
                  )}
                >
                  <div className="w-full h-full rounded-xl bg-background/80 backdrop-blur grid place-items-center overflow-hidden shadow-card">
                    {a ? <img src={a.previewUrl} alt="" className="max-h-[80%] max-w-[80%] object-contain pointer-events-none" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  {ic.showLabel && (
                    <span className="text-[11px] text-white drop-shadow-lg max-w-[100px] truncate">{ic.label}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="w-72 border-l border-border/60 bg-card/40 p-4 shrink-0 overflow-y-auto">
          <div className="text-sm font-semibold mb-3">아이콘 설정</div>
          {!selected ? (
            <div className="text-xs text-muted-foreground py-8 text-center">
              아이콘을 선택하면 상세 설정이 표시됩니다.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="aspect-square rounded-lg bg-muted/40 border border-border/40 grid place-items-center overflow-hidden">
                {(() => {
                  const a = iconAssets.find((x) => x.id === selected.assetId);
                  return a ? <img src={a.previewUrl} alt="" className="max-h-[70%] max-w-[70%] object-contain" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />;
                })()}
              </div>
              <div>
                <Label className="text-[11px]">아이콘 이름</Label>
                <Input className="mt-1 h-8 text-xs" value={selected.label} onChange={(e) => update(selected.id, { label: e.target.value })} />
              </div>
              <div>
                <Label className="text-[11px]">연결된 파일</Label>
                <div className="mt-1 text-xs text-muted-foreground truncate">{selected.fileName}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px]">X (%)</Label>
                  <Input type="number" className="mt-1 h-8 text-xs" value={Math.round(selected.x)} onChange={(e) => update(selected.id, { x: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-[11px]">Y (%)</Label>
                  <Input type="number" className="mt-1 h-8 text-xs" value={Math.round(selected.y)} onChange={(e) => update(selected.id, { y: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label className="text-[11px]">크기 (px)</Label>
                <Input type="number" className="mt-1 h-8 text-xs" value={selected.width}
                  onChange={(e) => { const v = Number(e.target.value) || 32; update(selected.id, { width: v, height: v }); }} />
              </div>
              <div className="flex items-center justify-between py-1">
                <Label className="text-xs">라벨 표시</Label>
                <Switch checked={selected.showLabel} onCheckedChange={(v) => update(selected.id, { showLabel: v })} />
              </div>
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive"
                onClick={() => {
                  setItems((a) => a.filter((i) => i.id !== selected.id));
                  setSelectedId(null);
                  setDirty(true);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> 아이콘 삭제
              </Button>
            </div>
          )}
        </aside>
      </div>

      {assetOpen && (
        <AssetModal
          tab={assetOpen}
          wallpaper={wallpaper}
          iconAssets={iconAssets}
          onWallpaper={onWallpaper}
          onAddIcons={onAddIcons}
          onAddToCanvas={addToCanvas}
          onImportLayout={importLayout}
          onClose={() => setAssetOpen(false)}
        />
      )}

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>변경사항을 저장하지 않고 나갈까요?</AlertDialogTitle>
            <AlertDialogDescription>저장하지 않은 배치 정보는 사라집니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>계속 편집</AlertDialogCancel>
            <AlertDialogAction onClick={onClose}>나가기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ToolbarBtn({ icon, children, onClick }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-8 px-2.5 rounded-md text-xs flex items-center gap-1.5 bg-background border border-border text-foreground/80 hover:bg-muted transition-colors"
    >
      {icon} {children}
    </button>
  );
}

function AssetModal({
  tab,
  wallpaper,
  iconAssets,
  onWallpaper,
  onAddIcons,
  onAddToCanvas,
  onImportLayout,
  onClose,
}: {
  tab: "wallpaper" | "icons" | "layout";
  wallpaper: { file: File; url: string } | null;
  iconAssets: IconAsset[];
  onWallpaper: (f?: File) => void;
  onAddIcons: (f: FileList | File[]) => void;
  onAddToCanvas: (a: IconAsset) => void;
  onImportLayout: (f: File) => void;
  onClose: () => void;
}) {
  const [active, setActive] = useState<string>(tab);
  const wallpaperInput = useRef<HTMLInputElement>(null);
  const iconsInput = useRef<HTMLInputElement>(null);
  const layoutInput = useRef<HTMLInputElement>(null);

  const dropZone = (handler: (f: File[]) => void) => ({
    onDragOver: (e: DragEvent<HTMLDivElement>) => e.preventDefault(),
    onDrop: (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); handler(Array.from(e.dataTransfer.files)); },
  });

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm grid place-items-center p-6" onClick={onClose}>
      <div className="w-full max-w-2xl bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
          <div className="text-sm font-semibold">자산 불러오기</div>
          <button onClick={onClose} className="h-7 w-7 rounded-md hover:bg-muted grid place-items-center"><X className="h-4 w-4" /></button>
        </div>
        <Tabs value={active} onValueChange={setActive} className="w-full">
          <TabsList className="mx-5 mt-4">
            <TabsTrigger value="wallpaper">배경화면</TabsTrigger>
            <TabsTrigger value="icons">아이콘</TabsTrigger>
            <TabsTrigger value="layout">배치 정보</TabsTrigger>
          </TabsList>

          <TabsContent value="wallpaper" className="p-5 space-y-4">
            <input ref={wallpaperInput} type="file" accept=".jpg,.jpeg,.png,.webp,.gif" className="hidden"
              onChange={(e) => onWallpaper(e.target.files?.[0])} />
            <div
              {...dropZone((f) => onWallpaper(f[0]))}
              onClick={() => wallpaperInput.current?.click()}
              className="rounded-xl border border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer p-8 text-center"
            >
              <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <div className="text-sm font-medium">파일을 끌어다 놓거나 클릭해 업로드</div>
              <div className="text-xs text-muted-foreground mt-1">JPG · PNG · WEBP · GIF</div>
            </div>
            {wallpaper && (
              <div className="rounded-xl border border-border/60 p-3 flex items-center gap-3">
                <img src={wallpaper.url} alt="" className="h-16 w-24 object-cover rounded-md" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{wallpaper.file.name}</div>
                  <div className="text-xs text-muted-foreground">{extOf(wallpaper.file.name)} · {formatBytes(wallpaper.file.size)}</div>
                </div>
                <Button size="sm" onClick={onClose}>현재 배경으로 적용</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="icons" className="p-5 space-y-4">
            <input ref={iconsInput} type="file" multiple accept=".png,.svg,.ico" className="hidden"
              onChange={(e) => e.target.files && onAddIcons(e.target.files)} />
            <div
              {...dropZone((f) => onAddIcons(f))}
              onClick={() => iconsInput.current?.click()}
              className="rounded-xl border border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer p-6 text-center"
            >
              <UploadIcon className="h-7 w-7 mx-auto text-muted-foreground mb-2" />
              <div className="text-sm font-medium">아이콘 업로드 (여러 개 가능)</div>
              <div className="text-xs text-muted-foreground mt-1">PNG · SVG · ICO</div>
            </div>
            {iconAssets.length > 0 ? (
              <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
                {iconAssets.map((a) => (
                  <button key={a.id} onClick={() => onAddToCanvas(a)}
                    className="rounded-lg border border-border/60 bg-background/40 hover:border-primary p-2 text-left transition-colors group">
                    <div className="aspect-square rounded-md bg-muted/40 grid place-items-center overflow-hidden">
                      <img src={a.previewUrl} alt="" className="max-h-[80%] max-w-[80%] object-contain" />
                    </div>
                    <div className="mt-1.5 text-[11px] truncate">{a.file.name}</div>
                    <div className="text-[10px] text-muted-foreground">{extOf(a.file.name)} · {formatBytes(a.file.size)}</div>
                    <div className="text-[10px] text-primary opacity-0 group-hover:opacity-100 mt-0.5">+ 캔버스에 추가</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">업로드된 아이콘이 없습니다.</div>
            )}
          </TabsContent>

          <TabsContent value="layout" className="p-5 space-y-4">
            <input ref={layoutInput} type="file" accept=".json,.jsonc,.c" className="hidden"
              onChange={(e) => e.target.files?.[0] && onImportLayout(e.target.files[0])} />
            <div
              {...dropZone((f) => f[0] && onImportLayout(f[0]))}
              onClick={() => layoutInput.current?.click()}
              className="rounded-xl border border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer p-8 text-center"
            >
              <AlertCircle className="h-7 w-7 mx-auto text-muted-foreground mb-2" />
              <div className="text-sm font-medium">기존 배치 정보 파일 업로드</div>
              <div className="text-xs text-muted-foreground mt-1">.json · .jsonc · .json.c</div>
            </div>
            <div className="text-[11px] text-muted-foreground">
              파일에 정의된 아이콘 위치와 크기가 캔버스에 자동 반영됩니다.
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
