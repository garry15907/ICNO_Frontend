import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Play, Save, MoreHorizontal, Plus, ChevronDown, ChevronUp,
  Move, MousePointer2, Info, Image as ImageIcon, Link2,
  History, RotateCcw, Trash2, Download, FileText, Magnet, AlignJustify,
  Package, Store, Upload as UploadIcon, X, Sparkles, Maximize2,
} from "lucide-react";
import { libraryPresets, IconAsset } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IconEditModal } from "@/components/presets/IconEditModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type EditableIcon = IconAsset & { mappedTo?: string; originPos: { x: number; y: number } };
type SaveState = "saved" | "dirty" | "saving";

type DraftPayload = {
  v: 1;
  savedAt: number;
  icons: EditableIcon[];
  wallpaper?: string;
  wp: {
    scale: number; offsetX: number; offsetY: number; rotate: number;
    flipX: boolean; flipY: boolean;
    brightness: number; contrast: number; saturate: number;
    hue: number; blur: number; opacity: number;
    invert: number; grayscale: number; sepia: number;
  };
};
const draftKey = (id: string) => `preset-draft:${id}`;
const savedKey = (id: string) => `preset-saved:${id}`;

const RES_W = 1920;
const RES_H = 1080;

export default function LibraryDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const preset = libraryPresets.find((p) => p.id === id) ?? libraryPresets[0];
  const storageId = id ?? preset.id;

  const [icons, setIcons] = useState<EditableIcon[]>(() =>
    preset.icons.map((i) => ({ ...i, originPos: { ...i.position } })),
  );
  const [savedIcons, setSavedIcons] = useState<EditableIcon[]>(icons);
  const [selected, setSelected] = useState<string | undefined>();
  const [editing, setEditing] = useState<string | null>(null);

  const [editMode, setEditMode] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [iconListOpen, setIconListOpen] = useState(false);
  const [presetInfoOpen, setPresetInfoOpen] = useState(false);
  const [addIconOpen, setAddIconOpen] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const [wallpaper, setWallpaper] = useState<string | undefined>(
    preset.thumbnail && preset.thumbnail !== "/placeholder.svg" ? preset.thumbnail : undefined,
  );
  // Wallpaper transform state
  const [wpScale, setWpScale] = useState(100);   // 25–500%
  const [wpOffsetX, setWpOffsetX] = useState(0); // px offset in canvas-space
  const [wpOffsetY, setWpOffsetY] = useState(0);
  const [wpRotate, setWpRotate] = useState(0);   // -180..180
  const [wpFlipX, setWpFlipX] = useState(false);
  const [wpFlipY, setWpFlipY] = useState(false);
  const [wpBrightness, setWpBrightness] = useState(100);
  const [wpContrast, setWpContrast] = useState(100);
  const [wpSaturate, setWpSaturate] = useState(100);
  const [wpHue, setWpHue] = useState(0);
  const [wpBlur, setWpBlur] = useState(0);
  const [wpOpacity, setWpOpacity] = useState(100);
  const [wpInvert, setWpInvert] = useState(0);
  const [wpGrayscale, setWpGrayscale] = useState(0);
  const [wpSepia, setWpSepia] = useState(0);
  const [wpAdjustOpen, setWpAdjustOpen] = useState(false);

  const [lastDraftAt, setLastDraftAt] = useState<number | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const wpDragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  const resetWallpaperTransform = () => {
    setWpScale(100); setWpOffsetX(0); setWpOffsetY(0); setWpRotate(0);
    setWpFlipX(false); setWpFlipY(false);
    setWpBrightness(100); setWpContrast(100); setWpSaturate(100);
    setWpHue(0); setWpBlur(0); setWpOpacity(100);
    setWpInvert(0); setWpGrayscale(0); setWpSepia(0);
  };

  const onWallpaperPointerDown = (e: React.PointerEvent) => {
    if (!wpAdjustOpen || !hasWallpaper) return;
    if ((e.target as HTMLElement).closest("[data-icon-node]")) return;
    e.preventDefault();
    wpDragRef.current = { startX: e.clientX, startY: e.clientY, baseX: wpOffsetX, baseY: wpOffsetY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onWallpaperPointerMove = (e: React.PointerEvent) => {
    if (!wpDragRef.current) return;
    setWpOffsetX(wpDragRef.current.baseX + (e.clientX - wpDragRef.current.startX));
    setWpOffsetY(wpDragRef.current.baseY + (e.clientY - wpDragRef.current.startY));
  };
  const onWallpaperPointerUp = () => { wpDragRef.current = null; };

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!hasWallpaper) return;
      e.preventDefault();
      const delta = -e.deltaY;
      if (e.shiftKey) {
        setWpRotate((r) => Math.max(-180, Math.min(180, r + delta * 0.1)));
      } else {
        const factor = delta > 0 ? 1.05 : 1 / 1.05;
        setWpScale((s) => Math.max(25, Math.min(500, +(s * factor).toFixed(1))));
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [wallpaper]);

  // Arrow-key nudging while adjust mode is active
  useEffect(() => {
    if (!wpAdjustOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const step = e.shiftKey ? 10 : 1;
      if (e.key === "ArrowLeft")  { e.preventDefault(); setWpOffsetX((v) => v - step); }
      else if (e.key === "ArrowRight") { e.preventDefault(); setWpOffsetX((v) => v + step); }
      else if (e.key === "ArrowUp")    { e.preventDefault(); setWpOffsetY((v) => v - step); }
      else if (e.key === "ArrowDown")  { e.preventDefault(); setWpOffsetY((v) => v + step); }
      else if (e.key === "Escape")     { setWpAdjustOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wpAdjustOpen]);

  const wpFilter = [
    `brightness(${wpBrightness}%)`,
    `contrast(${wpContrast}%)`,
    `saturate(${wpSaturate}%)`,
    `hue-rotate(${wpHue}deg)`,
    `blur(${wpBlur}px)`,
    `invert(${wpInvert}%)`,
    `grayscale(${wpGrayscale}%)`,
    `sepia(${wpSepia}%)`,
  ].join(" ");
  const wpTransform = `translate(${wpOffsetX}px, ${wpOffsetY}px) scale(${(wpFlipX ? -1 : 1) * (wpScale / 100)}, ${(wpFlipY ? -1 : 1) * (wpScale / 100)}) rotate(${wpRotate}deg)`;

  // ---- Draft persistence (localStorage) ----
  const collectPayload = (): DraftPayload => ({
    v: 1,
    savedAt: Date.now(),
    icons,
    wallpaper,
    wp: {
      scale: wpScale, offsetX: wpOffsetX, offsetY: wpOffsetY, rotate: wpRotate,
      flipX: wpFlipX, flipY: wpFlipY,
      brightness: wpBrightness, contrast: wpContrast, saturate: wpSaturate,
      hue: wpHue, blur: wpBlur, opacity: wpOpacity,
      invert: wpInvert, grayscale: wpGrayscale, sepia: wpSepia,
    },
  });
  const applyPayload = (p: DraftPayload) => {
    if (p.icons) {
      setIcons(p.icons);
      setSavedIcons(p.icons);
    }
    if (p.wallpaper !== undefined) setWallpaper(p.wallpaper);
    const w = p.wp;
    if (w) {
      setWpScale(w.scale); setWpOffsetX(w.offsetX); setWpOffsetY(w.offsetY); setWpRotate(w.rotate);
      setWpFlipX(w.flipX); setWpFlipY(w.flipY);
      setWpBrightness(w.brightness); setWpContrast(w.contrast); setWpSaturate(w.saturate);
      setWpHue(w.hue); setWpBlur(w.blur); setWpOpacity(w.opacity);
      setWpInvert(w.invert); setWpGrayscale(w.grayscale); setWpSepia(w.sepia);
    }
  };

  // Hydrate on mount: prefer draft over last saved
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey(storageId)) ?? localStorage.getItem(savedKey(storageId));
      if (raw) {
        const p = JSON.parse(raw) as DraftPayload;
        applyPayload(p);
        const draft = localStorage.getItem(draftKey(storageId));
        if (draft) setLastDraftAt(p.savedAt);
        const sv = localStorage.getItem(savedKey(storageId));
        if (sv) setLastSavedAt((JSON.parse(sv) as DraftPayload).savedAt);
      }
    } catch {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageId]);

  // Auto-save draft (debounced) after any change
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      try {
        const payload = collectPayload();
        localStorage.setItem(draftKey(storageId), JSON.stringify(payload));
        setLastDraftAt(payload.savedAt);
      } catch {}
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hydrated, icons, wallpaper, wpScale, wpOffsetX, wpOffsetY, wpRotate,
    wpFlipX, wpFlipY, wpBrightness, wpContrast, wpSaturate, wpHue, wpBlur,
    wpOpacity, wpInvert, wpGrayscale, wpSepia,
  ]);

  const saveDraftNow = () => {
    try {
      const payload = collectPayload();
      localStorage.setItem(draftKey(storageId), JSON.stringify(payload));
      setLastDraftAt(payload.savedAt);
      toast.success("임시 저장되었습니다.");
    } catch {
      toast.error("임시 저장에 실패했습니다.");
    }
  };
  const savePresetNow = () => {
    try {
      const payload = collectPayload();
      localStorage.setItem(savedKey(storageId), JSON.stringify(payload));
      localStorage.removeItem(draftKey(storageId));
      setLastSavedAt(payload.savedAt);
      setLastDraftAt(null);
      setSavedIcons(icons);
      setSaveState("saved");
      toast.success("프리셋이 저장되었습니다.");
    } catch {
      toast.error("저장에 실패했습니다.");
    }
  };
  const formatTime = (ts: number | null) => {
    if (!ts) return null;
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  };

  const isEmptyPreset = icons.length === 0;
  const hasWallpaper = !!wallpaper;

  const openWallpaperPicker = () => wallpaperInputRef.current?.click();
  const handleWallpaperFile = (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("20MB 이하의 이미지를 선택해주세요.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setWallpaper(reader.result as string);
      resetWallpaperTransform();
      toast.success(`배경화면이 변경되었습니다 · ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const dirty = useMemo(
    () => icons.some((i, idx) => {
      const s = savedIcons[idx];
      return !s || s.position.x !== i.position.x || s.position.y !== i.position.y;
    }),
    [icons, savedIcons],
  );

  useEffect(() => {
    if (saveState === "saving") return;
    setSaveState(dirty ? "dirty" : "saved");
  }, [dirty]); // eslint-disable-line

  const selectedIcon = icons.find((i) => i.id === selected);

  const toPx = (pctX: number, pctY: number) => ({
    x: Math.round((pctX / 100) * RES_W),
    y: Math.round((pctY / 100) * RES_H),
  });
  const snap = (v: number, step = 6) => Math.round(v / step) * step;

  const onPointerDown = (e: React.PointerEvent, ic: EditableIcon) => {
    setSelected(ic.id);
    if (!editMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const iconLeft = (ic.position.x / 100) * rect.width;
    const iconTop = (ic.position.y / 100) * rect.height;
    dragState.current = {
      id: ic.id,
      offsetX: e.clientX - rect.left - iconLeft,
      offsetY: e.clientY - rect.top - iconTop,
    };
    setDraggingId(ic.id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let xPct = ((e.clientX - rect.left - dragState.current.offsetX) / rect.width) * 100;
    let yPct = ((e.clientY - rect.top - dragState.current.offsetY) / rect.height) * 100;
    xPct = Math.max(0, Math.min(95, xPct));
    yPct = Math.max(0, Math.min(92, yPct));
    if (snapToGrid) {
      xPct = snap(xPct, 6);
      yPct = snap(yPct, 9);
    }
    const id = dragState.current.id;
    setIcons((prev) =>
      prev.map((i) => (i.id === id ? { ...i, position: { x: xPct, y: yPct } } : i)),
    );
  };

  const onPointerUp = () => {
    if (dragState.current) {
      dragState.current = null;
      setDraggingId(null);
    }
  };

  const handleSavePositions = () => {
    setSaveState("saving");
    setTimeout(() => {
      setSavedIcons(icons);
      setSaveState("saved");
      toast.success("위치가 저장되었습니다.");
    }, 350);
  };

  const handleResetPositions = () => {
    setIcons((prev) => prev.map((i) => {
      const s = savedIcons.find((x) => x.id === i.id);
      return { ...i, position: { ...(s?.position ?? i.originPos) } };
    }));
    toast("저장된 위치로 되돌렸습니다.");
  };

  const handleRestoreOrigin = () => {
    setIcons((prev) => prev.map((i) => ({ ...i, position: { ...i.originPos } })));
    toast("마켓 원본 위치로 복원했습니다.");
  };

  const handleAutoAlign = () => {
    setIcons((prev) =>
      prev.map((i, idx) => ({
        ...i,
        position: { x: 6 + (idx % 4) * 12, y: 8 + Math.floor(idx / 4) * 18 },
      })),
    );
    toast("전체 아이콘을 자동 정렬했습니다.");
  };

  const statusLabel =
    saveState === "saving" ? "저장 중..." :
    saveState === "dirty" ? "변경사항 있음" : "저장됨";
  const statusClass =
    saveState === "saving" ? "text-muted-foreground" :
    saveState === "dirty" ? "text-warning" : "text-success";

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => nav("/library")}>
            <ArrowLeft className="h-4 w-4 mr-1" />보관함
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold tracking-tight truncate">{preset.name}</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span>로컬 프리셋 · 매핑 {preset.mappedCount}/{preset.iconCount} ·</span>
              <span className={cn("font-semibold", statusClass)}>{statusLabel}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition">
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-xs">
                  아이콘 위치 변경은 내 보관함에만 저장되며, 마켓 원본에는 영향을 주지 않습니다.
                </TooltipContent>
              </Tooltip>
            </p>
          </div>
          <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow">
            <Play className="h-4 w-4 mr-2" />바탕화면 적용
          </Button>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-5">
          {/* Center: canvas */}
          <div className="space-y-3">
            {/* Mini toolbar */}
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2">
              <Button
                size="sm"
                variant={editMode ? "default" : "outline"}
                onClick={() => setEditMode((v) => !v)}
                className={cn("h-8", editMode && "bg-primary text-primary-foreground")}
              >
                <Move className="h-3.5 w-3.5 mr-1.5" />
                위치 편집 {editMode ? "ON" : "OFF"}
              </Button>

              <Button
                size="sm"
                onClick={handleSavePositions}
                disabled={!dirty || saveState === "saving"}
                className="h-8 bg-gradient-primary text-primary-foreground"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />위치 저장
              </Button>

              <div className="flex-1" />

              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddIconOpen(true)}
                className="h-8"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />아이콘 추가
              </Button>

              {hasWallpaper && (
                <Popover open={wpAdjustOpen} onOpenChange={setWpAdjustOpen}>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8">
                      <Maximize2 className="h-3.5 w-3.5 mr-1.5" />배경 조정
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-[360px] p-0 overflow-hidden">
                    <div className="p-4 border-b border-border space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">배경화면 자유 조정</div>
                        <span className="text-[10px] text-muted-foreground font-mono">{Math.round(wpScale)}%</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        캔버스 드래그로 이동 · 휠로 확대/축소 · Shift+휠 회전 · 화살표로 1px 미세 조정 (Shift 10px)
                      </p>
                    </div>
                    <Tabs defaultValue="transform" className="w-full">
                      <TabsList className="grid grid-cols-3 w-full rounded-none h-9">
                        <TabsTrigger value="transform" className="text-xs">변형</TabsTrigger>
                        <TabsTrigger value="filter" className="text-xs">필터</TabsTrigger>
                        <TabsTrigger value="effect" className="text-xs">효과</TabsTrigger>
                      </TabsList>
                      <div className="p-4 space-y-4 max-h-[420px] overflow-y-auto scrollbar-thin">
                        <TabsContent value="transform" className="space-y-4 mt-0">
                          <SliderRow label="크기" unit="%" value={wpScale} min={25} max={500} step={1} onChange={setWpScale} />
                          <SliderRow label="회전" unit="°" value={wpRotate} min={-180} max={180} step={1} onChange={setWpRotate} />
                          <div className="grid grid-cols-2 gap-2">
                            <SliderRow label="X 이동" unit="px" value={wpOffsetX} min={-1000} max={1000} step={1} onChange={setWpOffsetX} compact />
                            <SliderRow label="Y 이동" unit="px" value={wpOffsetY} min={-1000} max={1000} step={1} onChange={setWpOffsetY} compact />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button size="sm" variant={wpFlipX ? "default" : "outline"} className="h-8 text-xs" onClick={() => setWpFlipX((v) => !v)}>
                              가로 반전
                            </Button>
                            <Button size="sm" variant={wpFlipY ? "default" : "outline"} className="h-8 text-xs" onClick={() => setWpFlipY((v) => !v)}>
                              세로 반전
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setWpRotate((r) => r - 90)}>-90°</Button>
                            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setWpRotate(0)}>0°</Button>
                            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setWpRotate((r) => r + 90)}>+90°</Button>
                          </div>
                        </TabsContent>
                        <TabsContent value="filter" className="space-y-4 mt-0">
                          <SliderRow label="밝기" unit="%" value={wpBrightness} min={0} max={200} step={1} onChange={setWpBrightness} />
                          <SliderRow label="대비" unit="%" value={wpContrast} min={0} max={200} step={1} onChange={setWpContrast} />
                          <SliderRow label="채도" unit="%" value={wpSaturate} min={0} max={200} step={1} onChange={setWpSaturate} />
                          <SliderRow label="색조" unit="°" value={wpHue} min={0} max={360} step={1} onChange={setWpHue} />
                          <SliderRow label="흐림" unit="px" value={wpBlur} min={0} max={20} step={0.5} onChange={setWpBlur} />
                          <SliderRow label="투명도" unit="%" value={wpOpacity} min={0} max={100} step={1} onChange={setWpOpacity} />
                        </TabsContent>
                        <TabsContent value="effect" className="space-y-4 mt-0">
                          <SliderRow label="반전" unit="%" value={wpInvert} min={0} max={100} step={1} onChange={setWpInvert} />
                          <SliderRow label="흑백" unit="%" value={wpGrayscale} min={0} max={100} step={1} onChange={setWpGrayscale} />
                          <SliderRow label="세피아" unit="%" value={wpSepia} min={0} max={100} step={1} onChange={setWpSepia} />
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setWpGrayscale(100); setWpSepia(0); setWpInvert(0); }}>흑백</Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setWpSepia(80); setWpGrayscale(0); setWpInvert(0); }}>빈티지</Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setWpInvert(100); setWpGrayscale(0); setWpSepia(0); }}>색 반전</Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setWpInvert(0); setWpGrayscale(0); setWpSepia(0); }}>효과 해제</Button>
                          </div>
                        </TabsContent>
                      </div>
                    </Tabs>
                    <div className="flex items-center justify-between gap-2 border-t border-border p-3">
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={resetWallpaperTransform}>
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />전체 초기화
                      </Button>
                      <Button size="sm" className="h-8 text-xs" onClick={() => setWpAdjustOpen(false)}>완료</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="outline" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs">정렬 / 위치</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setSnapToGrid((v) => !v)}>
                    <Magnet className="h-4 w-4 mr-2" />
                    그리드에 맞추기 {snapToGrid && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleAutoAlign}>
                    <AlignJustify className="h-4 w-4 mr-2" />전체 자동 정렬
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleResetPositions} disabled={!dirty}>
                    <RotateCcw className="h-4 w-4 mr-2" />위치만 초기화
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleRestoreOrigin}>
                    <History className="h-4 w-4 mr-2" />원본 위치로 복원
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs">프리셋</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setPresetInfoOpen(true)}>
                    <FileText className="h-4 w-4 mr-2" />프리셋 정보 보기
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openWallpaperPicker}>
                    <ImageIcon className="h-4 w-4 mr-2" />배경화면 변경
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />다시 다운로드
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Canvas */}
            <div
              ref={canvasRef}
              onPointerDown={onWallpaperPointerDown}
              onPointerMove={(e) => { onPointerMove(e); onWallpaperPointerMove(e); }}
              onPointerUp={(e) => { onPointerUp(); onWallpaperPointerUp(); }}
              onPointerLeave={(e) => { onPointerUp(); onWallpaperPointerUp(); }}
              onClick={(e) => { if (e.target === e.currentTarget) setSelected(undefined); }}
              className={cn(
                "relative w-full aspect-[16/10] rounded-2xl overflow-hidden border shadow-card bg-muted select-none",
                editMode ? "border-primary/50 cursor-crosshair" : "border-border",
                !hasWallpaper && "bg-gradient-to-br from-muted to-muted/40",
                wpAdjustOpen && hasWallpaper && "cursor-move ring-2 ring-primary/60",
              )}
            >
              {hasWallpaper && (
                <img
                  src={wallpaper}
                  alt="배경화면"
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                  style={{
                    transform: wpTransform,
                    transformOrigin: "center center",
                    filter: wpFilter,
                    opacity: wpOpacity / 100,
                  }}
                />
              )}
              <input
                ref={wallpaperInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleWallpaperFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              {!hasWallpaper && (
                <button
                  type="button"
                  onClick={openWallpaperPicker}
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleWallpaperFile(e.dataTransfer.files?.[0]);
                  }}
                  className="absolute inset-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <ImageIcon className="h-10 w-10" />
                  <div className="text-sm font-semibold">배경화면 업로드</div>
                  <div className="text-xs">클릭하거나 이미지를 끌어다 놓으세요 · PNG, JPG · 권장 1920×1080</div>
                </button>
              )}
              {hasWallpaper && isEmptyPreset && editMode && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full bg-background/85 backdrop-blur px-3 py-1 text-[11px] font-medium text-foreground shadow-card border border-border">
                  <Plus className="h-3 w-3 text-primary" />
                  우측 상단 "아이콘 추가"로 시작하세요
                </div>
              )}
              {editMode && snapToGrid && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-25"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, hsl(var(--primary) / 0.5) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary) / 0.5) 1px, transparent 1px)",
                    backgroundSize: "6% 9%",
                  }}
                />
              )}

              {editMode && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full bg-background/85 backdrop-blur px-3 py-1 text-[11px] font-medium text-foreground shadow-card border border-border">
                  <Move className="h-3 w-3 text-primary" />
                  아이콘을 드래그해 위치를 조정하세요
                </div>
              )}

              {icons.map((ic) => {
                const isDragging = draggingId === ic.id;
                const isSelected = selected === ic.id;
                return (
                  <div
                    key={ic.id}
                    data-icon-node
                    onPointerDown={(e) => onPointerDown(e, ic)}
                    style={{ left: `${ic.position.x}%`, top: `${ic.position.y}%`, touchAction: "none" }}
                    className={cn(
                      "absolute flex flex-col items-center gap-1 transition-transform",
                      editMode ? "cursor-grab" : "cursor-pointer",
                      isDragging && "cursor-grabbing opacity-80 scale-110 z-20 drop-shadow-2xl",
                    )}
                  >
                    <div
                      className={cn(
                        "h-12 w-12 rounded-xl bg-background/80 backdrop-blur grid place-items-center text-2xl shadow-card transition-all",
                        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-transparent",
                        isDragging && "ring-2 ring-primary shadow-glow",
                      )}
                    >
                      {ic.emoji}
                    </div>
                    <span className="text-[10px] font-medium text-white drop-shadow-lg px-1 leading-tight pointer-events-none">
                      {ic.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Collapsible icon list */}
            <Collapsible open={iconListOpen} onOpenChange={setIconListOpen}>
              <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5">
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition flex-1 text-left">
                  포함된 아이콘 ({icons.length})
                  {iconListOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CollapsibleTrigger>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAddIconOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" />아이콘 추가
                </Button>
              </div>
              <CollapsibleContent>
                <div className="mt-2 rounded-xl border border-border bg-card divide-y divide-border">
                  {isEmptyPreset && (
                    <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                      아직 아이콘이 없습니다. 상단의 "아이콘 추가" 버튼으로 추가해 보세요.
                    </div>
                  )}
                  {icons.map((ic) => {
                    const px = toPx(ic.position.x, ic.position.y);
                    const isMoved = ic.position.x !== ic.originPos.x || ic.position.y !== ic.originPos.y;
                    return (
                      <div
                        key={ic.id}
                        onClick={() => setSelected(ic.id)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer transition",
                          selected === ic.id && "bg-primary/5",
                        )}
                      >
                        <div className="h-8 w-8 rounded-md bg-muted grid place-items-center text-lg shrink-0">{ic.emoji}</div>
                        <div className="flex-1 min-w-0 text-xs">
                          <div className="font-medium truncate flex items-center gap-1.5">
                            {ic.label}
                            {isMoved && <span className="h-1.5 w-1.5 rounded-full bg-warning" />}
                          </div>
                          <div className="text-muted-foreground font-mono text-[11px]">
                            연결됨 · {ic.size.w}×{ic.size.h} · X {px.x}, Y {px.y}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button onClick={(e) => e.stopPropagation()} className="h-7 w-7 grid place-items-center rounded hover:bg-muted">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditing(ic.id)}>이미지 변경</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditing(ic.id)}>이름 변경</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditing(ic.id)}>매핑 변경</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive">삭제</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Right: contextual panel */}
          <aside>
            {selectedIcon ? (
              <SelectedIconPanel
                icon={selectedIcon}
                onClose={() => setSelected(undefined)}
                onEdit={() => setEditing(selectedIcon.id)}
                onRestore={() =>
                  setIcons((prev) => prev.map((i) =>
                    i.id === selectedIcon.id ? { ...i, position: { ...i.originPos } } : i,
                  ))
                }
                onDelete={() => {
                  setIcons((prev) => prev.filter((i) => i.id !== selectedIcon.id));
                  setSelected(undefined);
                  toast("아이콘을 삭제했습니다.");
                }}
              />
            ) : isEmptyPreset ? (
              <EmptyPresetPanel
                onAddIcon={() => setAddIconOpen(true)}
                onUploadWallpaper={openWallpaperPicker}
                hasWallpaper={hasWallpaper}
              />
            ) : (
              <EmptyPanel
                count={icons.length}
                mapped={preset.mappedCount}
                total={preset.iconCount}
                statusLabel={statusLabel}
                statusClass={statusClass}
              />
            )}
          </aside>
        </div>

        {editing && (
          <IconEditModal
            icon={icons.find((i) => i.id === editing)!}
            onClose={() => setEditing(null)}
          />
        )}

        <PresetInfoDialog
          open={presetInfoOpen}
          onOpenChange={setPresetInfoOpen}
          preset={preset}
        />
        <AddIconDialog
          open={addIconOpen}
          onOpenChange={setAddIconOpen}
        />
      </div>
    </TooltipProvider>
  );
}

function EmptyPanel({
  count, mapped, total, statusLabel, statusClass,
}: {
  count: number; mapped: number; total: number;
  statusLabel: string; statusClass: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
      <div className="space-y-1.5">
        <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center mb-2">
          <MousePointer2 className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-base font-bold">아이콘을 선택하세요</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          캔버스에서 아이콘을 선택하면 위치, 크기, 이미지, 매핑을 수정할 수 있습니다.
        </p>
      </div>
      <div className="border-t border-border pt-4 space-y-2.5 text-xs">
        <Row label="아이콘" value={`${count}개`} />
        <Row label="매핑" value={`${mapped}/${total}`} />
        <Row label="상태" value={<span className={cn("font-semibold", statusClass)}>{statusLabel}</span>} />
      </div>
    </div>
  );
}

function EmptyPresetPanel({
  onAddIcon, onUploadWallpaper, hasWallpaper,
}: {
  onAddIcon: () => void;
  onUploadWallpaper: () => void;
  hasWallpaper: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
      <div className="space-y-1.5">
        <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-base font-bold">새 프리셋을 시작하세요</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          배경화면을 업로드하고 아이콘을 추가해 나만의 프리셋을 만들 수 있습니다.
        </p>
      </div>
      <div className="border-t border-border pt-4 space-y-2">
        {!hasWallpaper && (
          <Button onClick={onUploadWallpaper} className="w-full bg-gradient-primary text-primary-foreground" size="sm">
            <ImageIcon className="h-3.5 w-3.5 mr-1.5" />배경화면 업로드
          </Button>
        )}
        <Button onClick={onAddIcon} variant={hasWallpaper ? "default" : "outline"} className="w-full" size="sm">
          <Plus className="h-3.5 w-3.5 mr-1.5" />아이콘 추가
        </Button>
      </div>
      <div className="border-t border-border pt-4 space-y-2.5 text-xs">
        <Row label="아이콘" value="0개" />
        <Row label="매핑" value="0/0" />
        <Row label="상태" value={<span className="text-muted-foreground">비어 있음</span>} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function SelectedIconPanel({
  icon, onClose, onEdit, onRestore, onDelete,
}: {
  icon: EditableIcon;
  onClose: () => void;
  onEdit: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const px = {
    x: Math.round((icon.position.x / 100) * RES_W),
    y: Math.round((icon.position.y / 100) * RES_H),
  };
  const isMoved = icon.position.x !== icon.originPos.x || icon.position.y !== icon.originPos.y;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-14 w-14 rounded-xl bg-muted grid place-items-center text-3xl shrink-0">
          {icon.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground">선택한 아이콘</div>
          <div className="font-bold truncate">{icon.label}</div>
          <Badge variant="outline" className="mt-1 text-[10px] border-success/40 text-success bg-success/10">
            연결됨
          </Badge>
        </div>
        <button onClick={onClose} className="h-7 w-7 grid place-items-center rounded hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="border-t border-border pt-3 space-y-2 text-xs">
        <Row label="크기" value={<span className="font-mono">{icon.size.w} × {icon.size.h}</span>} />
        <Row label="위치" value={<span className="font-mono">X {px.x}, Y {px.y}</span>} />
        <Row label="출처" value="프리셋 기본 아이콘" />
        <Row
          label="상태"
          value={
            isMoved ? (
              <Badge variant="outline" className="text-[10px] border-primary/40 text-primary bg-primary/10">로컬 수정됨</Badge>
            ) : (
              <span className="text-muted-foreground">원본 위치</span>
            )
          }
        />
      </div>

      <div className="border-t border-border pt-3 space-y-2">
        <Button onClick={onEdit} className="w-full bg-gradient-primary text-primary-foreground" size="sm">
          <Link2 className="h-3.5 w-3.5 mr-1.5" />매핑 변경
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={onEdit} variant="outline" size="sm">
            <ImageIcon className="h-3.5 w-3.5 mr-1.5" />이미지
          </Button>
          <Button onClick={onEdit} variant="outline" size="sm">크기/스타일</Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full text-xs">
              <MoreHorizontal className="h-3.5 w-3.5 mr-1.5" />더보기
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onEdit}>이름 변경</DropdownMenuItem>
            <DropdownMenuItem onClick={onRestore} disabled={!isMoved}>원본 위치로 복원</DropdownMenuItem>
            <DropdownMenuItem>연결 해제</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>삭제</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function PresetInfoDialog({
  open, onOpenChange, preset,
}: { open: boolean; onOpenChange: (v: boolean) => void; preset: typeof libraryPresets[number] }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{preset.name}</DialogTitle>
          <DialogDescription>{preset.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <img src={preset.thumbnail} alt="" className="w-full aspect-[16/10] rounded-lg object-cover border border-border" />
          <div className="grid grid-cols-2 gap-3 text-xs">
            <Row label="아이콘 수" value={`${preset.iconCount}`} />
            <Row label="매핑" value={`${preset.mappedCount}/${preset.iconCount}`} />
            <Row label="다운로드 날짜" value={preset.lastModified} />
            <Row label="원본 버전" value="v1.0" />
            {preset.sourceMarketId && <Row label="마켓 출처" value={<span className="text-primary">{preset.sourceMarketId}</span>} />}
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1.5">태그</div>
            <div className="flex flex-wrap gap-1">
              {preset.tags.map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted">#{t}</span>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddIconDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>아이콘 추가</DialogTitle>
          <DialogDescription>이 프리셋에 추가할 아이콘을 선택하세요.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="library">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="library"><Package className="h-3.5 w-3.5 mr-1.5" />내 보관함</TabsTrigger>
            <TabsTrigger value="market"><Store className="h-3.5 w-3.5 mr-1.5" />마켓</TabsTrigger>
            <TabsTrigger value="upload"><UploadIcon className="h-3.5 w-3.5 mr-1.5" />업로드</TabsTrigger>
          </TabsList>
          <TabsContent value="library" className="text-sm text-muted-foreground py-8 text-center">
            보관함의 개별 아이콘과 아이콘 팩이 여기에 표시됩니다.
          </TabsContent>
          <TabsContent value="market" className="text-sm text-muted-foreground py-8 text-center">
            마켓에서 아이콘을 검색해 추가할 수 있습니다.
          </TabsContent>
          <TabsContent value="upload" className="text-sm text-muted-foreground py-8 text-center">
            내 PC에서 PNG, SVG, ICO 파일을 업로드하세요.
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function SliderRow({
  label, unit, value, min, max, step, onChange, compact,
}: {
  label: string; unit: string; value: number;
  min: number; max: number; step: number;
  onChange: (v: number) => void; compact?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{Number.isInteger(step) ? Math.round(value) : value.toFixed(1)}{unit}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} className={compact ? "" : ""} />
    </div>
  );
}
