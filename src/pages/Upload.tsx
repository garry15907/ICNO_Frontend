import { useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
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
  Search,
  Pencil,
  Link2,
  Link2Off,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { libraryPresets } from "@/data/mockData";

type IconAsset = { id: string; file: File; previewUrl: string };
// Matches icons_config.json spec. `assetId`/`fileName` are internal-only fields
// used to bind the in-memory File preview; they are NOT serialized to UI/paths.
type PlacedIcon = {
  id: string;
  // internal binding to uploaded File preview
  assetId: string;
  fileName: string;
  // ===== icons_config.json fields =====
  name: string;
  image_path: string;
  target_path: string;
  // Pixel coordinates in the desktop canvas reference frame
  // (matches icons_config.json — NOT a percentage).
  x: number;
  y: number;
  size: number; // px
  show_name: boolean;
  font_family: string;
  font_size: number;
  font_bold: boolean;
  font_italic: boolean;
  font_color: string;
  outline_color: string;
  hover_image_path: string;
};

const DEFAULT_ICON: Omit<PlacedIcon, "id" | "assetId" | "fileName" | "name" | "x" | "y"> = {
  image_path: "",
  target_path: "",
  size: 72,
  show_name: true,
  font_family: "Malgun Gothic, sans-serif",
  font_size: 10,
  font_bold: false,
  font_italic: false,
  font_color: "#ffffff",
  outline_color: "#000000",
  hover_image_path: "",
};

// Fill missing fields with defaults so legacy/partial data stays compatible.
function normalizeIcon(raw: any, i = 0): PlacedIcon {
  return {
    id: raw?.id ?? uid(),
    assetId: raw?.assetId ?? "",
    fileName: raw?.fileName ?? raw?.file ?? "",
    name: raw?.name ?? raw?.label ?? `아이콘 ${i + 1}`,
    image_path: raw?.image_path ?? "",
    target_path: raw?.target_path ?? "",
    x: Number.isFinite(Number(raw?.x)) ? Math.round(Number(raw?.x)) : 100,
    y: Number.isFinite(Number(raw?.y)) ? Math.round(Number(raw?.y)) : 100,
    size: Number(raw?.size ?? raw?.width) || 72,
    show_name: raw?.show_name ?? raw?.showLabel ?? true,
    font_family: normalizeFontFamily(raw?.font_family),
    font_size: Number(raw?.font_size) || 10,
    font_bold: !!raw?.font_bold,
    font_italic: !!raw?.font_italic,
    font_color: raw?.font_color ?? "#ffffff",
    outline_color: raw?.outline_color ?? "#000000",
    hover_image_path: raw?.hover_image_path ?? "",
  };
}

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

// Show only the basename of a Windows/POSIX path. UI must never expose the
// full absolute target_path/image_path — those stay in internal data only.
function basenameOf(p?: string) {
  if (!p) return "";
  const norm = p.replace(/[\\/]+$/, "");
  const idx = Math.max(norm.lastIndexOf("\\"), norm.lastIndexOf("/"));
  return idx >= 0 ? norm.slice(idx + 1) : norm;
}

const LEGACY_FONT_MAP: Record<string, string> = {
  "맑은 고딕": "Malgun Gothic, sans-serif",
  "malgun gothic": "Malgun Gothic, sans-serif",
  pretendard: "Pretendard, sans-serif",
  noto: "Noto Sans KR, sans-serif",
  inter: "Inter, sans-serif",
  system: "system-ui, -apple-system, sans-serif",
};
function normalizeFontFamily(value?: string) {
  if (!value) return "Malgun Gothic, sans-serif";
  return LEGACY_FONT_MAP[value.toLowerCase()] ?? value;
}

// Reference desktop canvas size used by icons_config.json pixel coordinates.
// Editor & previews scale visually around this logical resolution but the
// stored x/y values remain pixels in this coordinate space.
const CANVAS_W = 1920;
const CANVAS_H = 1080;

export default function Upload() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const presetIdParam = searchParams.get("preset");

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

  // Load a library preset into the editor when `?preset=<id>` is present, so
  // every library card and the "새 프리셋 만들기" flow share the same
  // fullscreen editor experience.
  useEffect(() => {
    if (!presetIdParam) return;
    const preset = libraryPresets.find((p) => p.id === presetIdParam);

    let wpUrl: string | undefined;
    let savedIcons: any[] | undefined;
    let savedName: string | undefined;
    try {
      const raw =
        localStorage.getItem(`preset-saved:${presetIdParam}`) ??
        localStorage.getItem(`preset-draft:${presetIdParam}`);
      if (raw) {
        const data = JSON.parse(raw);
        if (data?.wallpaper) wpUrl = data.wallpaper;
        if (Array.isArray(data?.icons)) savedIcons = data.icons;
        if (data?.name) savedName = data.name;
      }
    } catch {}

    if (!wpUrl && preset?.thumbnail && preset.thumbnail !== "/placeholder.svg") {
      wpUrl = preset.thumbnail;
    }
    if (wpUrl) {
      const stub = new File([], "wallpaper", { type: "image/*" });
      setWallpaper({ file: stub, url: wpUrl });
    }

    const sourceIcons = savedIcons ?? preset?.icons ?? [];
    if (sourceIcons.length) {
      const next: PlacedIcon[] = sourceIcons.map((it: any, i: number) => {
        // LibraryDetail/mockData icons use {position:{x,y}} as percentages
        // (0–100). Upload editor uses px in a 1920x1080 canvas.
        const px = it?.x ?? it?.position?.x ?? 0;
        const py = it?.y ?? it?.position?.y ?? 0;
        const isPercent = px <= 100 && py <= 100 && !("size" in (it ?? {}));
        return normalizeIcon({
          ...it,
          name: it?.name ?? it?.label ?? `아이콘 ${i + 1}`,
          x: isPercent ? Math.round((px / 100) * CANVAS_W) : px,
          y: isPercent ? Math.round((py / 100) * CANVAS_H) : py,
        }, i);
      });
      setPlaced(next);
    }

    if (preset?.name && !name) setName(savedName ?? preset.name);
    if (preset?.description && !description) setDescription(preset.description);
    setEditorOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetIdParam]);

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
    toast({ title: "프리셋이 적용되었습니다", description: `${name || "이름 없는 프리셋"} · ${placed.length}개 아이콘` });
  };

  const handleSaveDraft = () => {
    toast({ title: "저장되었습니다", description: name || "이름 없는 프리셋" });
  };

  const assetById = useMemo(() => {
    const m = new Map<string, IconAsset>();
    iconAssets.forEach((a) => m.set(a.id, a));
    return m;
  }, [iconAssets]);

  // Scale logical 1920x1080 canvas to fit the small preview box.
  const previewBoxRef = useRef<HTMLButtonElement>(null);
  const [previewScale, setPreviewScale] = useState(0.25);
  useEffect(() => {
    const el = previewBoxRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setPreviewScale(w / CANVAS_W);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">프리셋 수정</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            배경화면과 아이콘 배치를 자유롭게 수정해보세요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-lg" onClick={handleSaveDraft}>
            <Save className="h-4 w-4" /> 저장하기
          </Button>
          <Button
            onClick={handlePublish}
            className="rounded-lg h-10 px-5 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
          >
            <Sparkles className="h-4 w-4" /> 적용하기
          </Button>
        </div>
      </div>

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
              ref={previewBoxRef}
              onClick={() => setEditorOpen(true)}
              className="relative w-full aspect-video rounded-xl overflow-hidden border border-border bg-muted group cursor-pointer"
            >
              {wallpaper ? (
                <img src={wallpaper.url} alt="" className="absolute inset-0 w-full h-full object-contain" />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-center px-6 bg-gradient-to-br from-muted/40 to-muted/10">
                  <div className="text-muted-foreground">
                    <Monitor className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <div className="text-sm font-medium text-foreground">배경화면과 아이콘을 추가해 프리셋을 구성하세요.</div>
                    <div className="text-xs mt-1">미리보기를 클릭하면 전체화면 편집 모드로 이동합니다.</div>
                  </div>
                </div>
              )}
              {wallpaper && (
                <div
                  className="absolute top-0 left-0 pointer-events-none"
                  style={{
                    width: CANVAS_W,
                    height: CANVAS_H,
                    transform: `scale(${previewScale})`,
                    transformOrigin: "top left",
                  }}
                >
                  {placed.map((ic) => {
                    const a = assetById.get(ic.assetId);
                    return (
                    <div
                        key={ic.id}
                        style={{ left: `${ic.x}px`, top: `${ic.y}px`, "--desktop-icon-size": `${ic.size}px` } as CSSProperties}
                        className="absolute desktopIconWrapper"
                      >
                        <div className="desktopIconImageBox">
                          {a ? <img src={a.previewUrl} alt="" className="desktopIconImage" draggable={false} /> : <ImageIcon className="h-4 w-4 text-white/70 drop-shadow" />}
                        </div>
                        {ic.show_name && (
                          <div className="desktopIconLabel text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)", fontSize: `${ic.font_size}px`, fontFamily: ic.font_family }}>{ic.name}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
  const [editIconOpen, setEditIconOpen] = useState(false);
  const [search, setSearch] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);
  const [stageScale, setStageScale] = useState(1);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  // Tracks whether we need to re-enter fullscreen after a native file picker
  // closes. Browsers exit fullscreen when <input type=file> opens.
  const shouldRestoreFsRef = useRef(false);

  useEffect(() => {
    // Do not auto-enter browser fullscreen; user can toggle via toolbar.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onFsChange = () => setIsBrowserFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("fullscreenchange", onFsChange);
    };
  }, []);

  // Scale the logical 16:9 desktop stage. Browser fullscreen keeps the current
  // cover behavior, while the normal editor view contains the whole stage so
  // the wallpaper is never cropped by the inspector/sidebar layout.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) {
        const fit = isBrowserFullscreen ? Math.max : Math.min;
        setStageScale(fit(w / CANVAS_W, h / CANVAS_H));
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isBrowserFullscreen]);

  const enterBrowserFullscreen = () => {
    const el = rootRef.current;
    if (el && !document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  };
  const exitBrowserFullscreen = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Open a native file picker while preserving the editor's fullscreen mode.
  // After the picker closes, focus returns to the window — we use that signal
  // to restore fullscreen if the browser forced an exit.
  const safeOpenFilePicker = (input: HTMLInputElement | null) => {
    if (!input) return;
    shouldRestoreFsRef.current = !!document.fullscreenElement;
    input.click();
  };

  // Pick a program/file/folder to bind as the selected icon's launch target.
  // Prefers Electron native dialog when available; falls back to <input type=file>.
  const pickTargetForSelected = async () => {
    if (!selected) return;
    const api = (window as any).electronAPI;
    if (api?.selectIconTarget) {
      shouldRestoreFsRef.current = !!document.fullscreenElement;
      try {
        const result = await api.selectIconTarget();
        const path: string | undefined = result?.path ?? result;
        if (path) update(selected.id, { target_path: path });
      } catch {
        toast({ title: "선택을 취소했습니다" });
      }
      return;
    }
    safeOpenFilePicker(targetInputRef.current);
  };

  useEffect(() => {
    const restore = () => {
      if (!shouldRestoreFsRef.current) return;
      // give the file dialog a moment to fully release fullscreen control
      window.setTimeout(() => {
        if (!document.fullscreenElement) enterBrowserFullscreen();
        shouldRestoreFsRef.current = false;
      }, 120);
    };
    window.addEventListener("focus", restore);
    return () => window.removeEventListener("focus", restore);
  }, []);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  const update = (id: string, patch: Partial<PlacedIcon>) => {
    setItems((arr) => arr.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    setDirty(true);
  };

  const addToCanvas = (asset: IconAsset) => {
    const n = items.length;
    // Place new icons on a px grid in the logical desktop canvas.
    const cols = 10;
    const cellW = 140;
    const cellH = 160;
    const x = 80 + (n % cols) * cellW;
    const y = 80 + Math.floor(n / cols) * cellH;
    const next: PlacedIcon = normalizeIcon({
      assetId: asset.id,
      fileName: asset.file.name,
      name: asset.file.name.replace(/\.[^.]+$/, ""),
      image_path: asset.file.name, // internal-only — UI never shows this
      x, y,
    });
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
      const list = Array.isArray(parsed) ? parsed : parsed?.icons;
      if (!Array.isArray(list)) throw new Error();
      const next: PlacedIcon[] = list.map((it: any, i: number) => {
        const match = iconAssets.find(
          (a) => a.file.name === it.fileName || a.file.name === it.image_path || a.file.name === it.name,
        );
        return normalizeIcon({ ...it, assetId: match?.id ?? "" }, i);
      });
      setItems(next);
      setDirty(true);
      toast({ title: "배치 정보가 적용되었습니다" });
    } catch {
      toast({ title: "오류", description: "배치 정보 파일 형식이 올바르지 않습니다." });
    }
  };

  const dragRef = useRef<{ id: string; offX: number; offY: number } | null>(null);
  const pressRef = useRef<{ id: string; startX: number; startY: number; moved: boolean } | null>(null);
  const DRAG_THRESHOLD = 4;
  // Pixel-based dragging in the logical 1920x1080 canvas frame.
  // No percent conversions. Grid snap is only applied on pointer-up when ON.
  const GRID_PX = 20;
  const onPointerDown = (e: ReactPointerEvent, ic: PlacedIcon) => {
    e.stopPropagation();
    dragRef.current = {
      id: ic.id,
      // Store icon origin px and starting mouse px; we'll add raw deltas / scale.
      offX: ic.x,
      offY: ic.y,
    };
    pressRef.current = { id: ic.id, startX: e.clientX, startY: e.clientY, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!dragRef.current || !pressRef.current) return;
    const dxScreen = e.clientX - pressRef.current.startX;
    const dyScreen = e.clientY - pressRef.current.startY;
    if (!pressRef.current.moved) {
      if (Math.hypot(dxScreen, dyScreen) < DRAG_THRESHOLD) return;
      pressRef.current.moved = true;
      setSelectedId(dragRef.current.id);
    }
    const scale = stageScale || 1;
    const x = Math.max(0, Math.min(CANVAS_W, Math.round(dragRef.current.offX + dxScreen / scale)));
    const y = Math.max(0, Math.min(CANVAS_H, Math.round(dragRef.current.offY + dyScreen / scale)));
    update(dragRef.current.id, { x, y });
  };
  const onPointerUp = (_e: ReactPointerEvent) => {
    if (pressRef.current && !pressRef.current.moved) {
      setSelectedId(pressRef.current.id);
    } else if (dragRef.current && grid) {
      // Snap to nearest grid cell on release when grid snap is ON.
      const id = dragRef.current.id;
      setItems((arr) => arr.map((it) => it.id === id ? {
        ...it,
        x: Math.round(it.x / GRID_PX) * GRID_PX,
        y: Math.round(it.y / GRID_PX) * GRID_PX,
      } : it));
    }
    dragRef.current = null;
    pressRef.current = null;
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedId) {
        setItems((a) => a.filter((i) => i.id !== selectedId));
        setSelectedId(null);
        setDirty(true);
      }
      if (e.key === "Escape") {
        e.preventDefault();
        if (editIconOpen || assetOpen || confirmCancel) return;
        if (selectedId) {
          setSelectedId(null);
        } else {
          if (dirty) setConfirmCancel(true);
          else onClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, dirty, editIconOpen, assetOpen, confirmCancel, onClose]);

  const tryClose = () => {
    if (dirty) setConfirmCancel(true);
    else onClose();
  };

  const content = (
    <div ref={rootRef} className="fixed inset-0 z-[100] bg-background overflow-hidden animate-fade-in flex flex-col">
      {/* Hidden fallback when not running under Electron — captures filename as target_path. */}
      <input
        ref={targetInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && selected) {
            // In browser there's no absolute path, so store the file name.
            // Electron path (preferred) sets the real absolute path.
            update(selected.id, { target_path: (file as any).path || file.name });
          }
          e.target.value = "";
        }}
      />
      {/* Top toolbar */}
      <div className="h-14 border-b border-border/60 bg-card/80 backdrop-blur flex items-center px-4 gap-3 shrink-0">
        <div className="text-sm font-semibold shrink-0 flex items-center gap-2">
          <Pencil className="h-3.5 w-3.5 text-primary" /> 프리셋 편집
        </div>
        <div className="flex-1 flex items-center justify-center gap-2">
          <div className="relative w-64 max-w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="프리셋 크리에이터 태그 검색"
              className="h-8 pl-8 text-xs bg-background/60"
            />
          </div>
          <ToolbarBtn icon={<ImagePlus className="h-3.5 w-3.5" />} onClick={() => setAssetOpen("wallpaper")}>배경화면 변경</ToolbarBtn>
          <ToolbarBtn icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setAssetOpen("icons")}>아이콘 추가</ToolbarBtn>
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
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isBrowserFullscreen ? (
            <ToolbarBtn icon={<Maximize2 className="h-3.5 w-3.5" />} onClick={exitBrowserFullscreen}>전체화면 나가기</ToolbarBtn>
          ) : (
            <button
              onClick={enterBrowserFullscreen}
              className="h-8 px-3 rounded-md text-xs flex items-center gap-1.5 bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25"
            >
              <Maximize2 className="h-3.5 w-3.5" /> 전체화면으로 보기
            </button>
          )}
          <Button size="sm" variant="ghost" className="h-8" onClick={tryClose}>취소</Button>
          <Button size="sm" className="h-8 bg-primary hover:bg-primary/90" onClick={() => onSave(items)}>
            <Save className="h-3.5 w-3.5" /> 저장하고 나가기
          </Button>
        </div>
      </div>

      {!isBrowserFullscreen && (
        <div className="px-4 py-2 bg-primary/10 border-b border-primary/20 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-primary/90">
            전체화면이 해제되었습니다. 다시 전체화면으로 편집할 수 있습니다.
          </div>
          <button
            onClick={enterBrowserFullscreen}
            className="h-7 px-3 rounded-md text-[11px] flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Maximize2 className="h-3 w-3" /> 전체화면으로 보기
          </button>
        </div>
      )}

      {/* Body: wallpaper preview area + inspector side panel, fully separated. */}
      <div className="flex-1 flex min-h-0">
        {/* Wallpaper preview area — its own column. The uploaded wallpaper and
            icon grid live inside the same 16:9 stage, so leaving fullscreen no
            longer lets the side panel/toolbar crop the image width. */}
        <div
          className="flex-1 min-w-0 relative bg-black overflow-hidden"
          onClick={() => setSelectedId(null)}
        >
          {!wallpaper && (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground pointer-events-none">
              <div className="text-center">
                <Monitor className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <div className="text-sm">상단 "배경화면 변경"으로 배경을 선택하세요.</div>
              </div>
            </div>
          )}

          <div
            ref={stageRef}
            className="absolute inset-0"
          >
            {/* Logical 1920x1080 monitor stage covering the available area. */}
            <div
              ref={canvasRef}
              className="absolute shadow-2xl ring-1 ring-white/10 overflow-hidden"
              style={{
                width: CANVAS_W,
                height: CANVAS_H,
                transform: `scale(${stageScale})`,
                transformOrigin: "center center",
                left: "50%",
                top: "50%",
                marginLeft: -CANVAS_W / 2,
                marginTop: -CANVAS_H / 2,
              }}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              {wallpaper && (
                <img src={wallpaper.url} alt="" className="absolute inset-0 h-full w-full object-cover pointer-events-none" />
              )}
              {grid && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary) / 0.3) 1px, transparent 1px)",
                    backgroundSize: `${20}px ${20}px`,
                  }}
                />
              )}
              {items.map((ic) => {
                const a = iconAssets.find((x) => x.id === ic.assetId);
                const isSel = ic.id === selectedId;
                return (
                    <div
                      key={ic.id}
                      onPointerDown={(e) => onPointerDown(e, ic)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ left: `${ic.x}px`, top: `${ic.y}px`, "--desktop-icon-size": `${ic.size}px` } as CSSProperties}
                      className="absolute desktopIconWrapper cursor-grab active:cursor-grabbing select-none"
                    >
                      <div className="desktopIconImageBox">
                        {a ? (
                          <img src={a.previewUrl} alt="" className="desktopIconImage pointer-events-none" draggable={false} />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-white/70 drop-shadow" />
                        )}
                        {isSel && (
                          <>
                            <span className="absolute -top-1 -left-1 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_0_2px_rgba(0,0,0,0.4)]" />
                            <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_0_2px_rgba(0,0,0,0.4)]" />
                            <span className="absolute -bottom-1 -left-1 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_0_2px_rgba(0,0,0,0.4)]" />
                            <span className="absolute -bottom-1 -right-1 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_0_2px_rgba(0,0,0,0.4)]" />
                          </>
                        )}
                      </div>
                      {ic.show_name && (
                        <div
                          className="desktopIconLabel"
                          style={{
                            textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                            color: ic.font_color,
                            fontFamily: ic.font_family,
                            fontSize: `${ic.font_size}px`,
                            fontWeight: ic.font_bold ? 700 : 400,
                            fontStyle: ic.font_italic ? "italic" : "normal",
                            WebkitTextStroke: `0.4px ${ic.outline_color}`,
                          }}
                        >
                          {ic.name}
                        </div>
                      )}
                    </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right inspector — separate column, opaque, never overlaps the preview. */}
        <aside className="w-72 shrink-0 border-l border-border bg-card p-4 overflow-y-auto">
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
                <Input className="mt-1 h-8 text-xs" value={selected.name} onChange={(e) => update(selected.id, { name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px]">X (px)</Label>
                  <Input type="number" className="mt-1 h-8 text-xs" value={Math.round(selected.x)} onChange={(e) => update(selected.id, { x: Math.round(Number(e.target.value) || 0) })} />
                </div>
                <div>
                  <Label className="text-[11px]">Y (px)</Label>
                  <Input type="number" className="mt-1 h-8 text-xs" value={Math.round(selected.y)} onChange={(e) => update(selected.id, { y: Math.round(Number(e.target.value) || 0) })} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-[11px]">크기</Label>
                  <span className="text-[11px] text-muted-foreground">{selected.size}px</span>
                </div>
                <Slider
                  className="mt-2"
                  value={[selected.size]}
                  min={32}
                  max={512}
                  step={1}
                  onValueChange={(v) => update(selected.id, { size: v[0] })}
                />
              </div>
              <div className="flex items-center justify-between py-1">
                <Label className="text-xs">이름 표시</Label>
                <Switch checked={selected.show_name} onCheckedChange={(v) => update(selected.id, { show_name: v })} />
              </div>
              {/* 연결 대상 (target_path) — 사용자가 아이콘에 매핑할 프로그램/파일/폴더 */}
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5 text-primary" />
                  <Label className="text-xs font-semibold">연결 대상</Label>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  이 아이콘을 클릭했을 때 실행할 프로그램, 파일, 폴더를 선택하세요.
                </p>
                <div className="text-[11px]">
                  {selected.target_path ? (
                    <span className="text-foreground">
                      연결됨:&nbsp;
                      <span className="font-medium text-primary truncate inline-block max-w-[180px] align-bottom">
                        {basenameOf(selected.target_path)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">연결된 대상 없음</span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-[11px]" onClick={pickTargetForSelected}>
                    <FolderOpen className="h-3 w-3" /> {selected.target_path ? "연결 변경" : "프로그램/파일 선택"}
                  </Button>
                  {selected.target_path && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[11px] text-muted-foreground hover:text-destructive"
                      onClick={() => update(selected.id, { target_path: "" })}
                    >
                      <Link2Off className="h-3 w-3" /> 해제
                    </Button>
                  )}
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setEditIconOpen(true)}>
                <Pencil className="h-3.5 w-3.5" /> 상세 편집
              </Button>
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
          openFilePicker={safeOpenFilePicker}
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

      {editIconOpen && selected && (
        <IconDetailEditModal
          icon={selected}
          asset={iconAssets.find((x) => x.id === selected.assetId) ?? null}
          iconAssets={iconAssets}
          onPickAsset={(assetId) => update(selected.id, { assetId })}
          onAddIcons={onAddIcons}
          openFilePicker={safeOpenFilePicker}
          onSave={(patch) => { update(selected.id, patch); setEditIconOpen(false); }}
          onClose={() => setEditIconOpen(false)}
        />
      )}
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : content;
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
  openFilePicker,
  onClose,
}: {
  tab: "wallpaper" | "icons" | "layout";
  wallpaper: { file: File; url: string } | null;
  iconAssets: IconAsset[];
  onWallpaper: (f?: File) => void;
  onAddIcons: (f: FileList | File[]) => void;
  onAddToCanvas: (a: IconAsset) => void;
  onImportLayout: (f: File) => void;
  openFilePicker: (input: HTMLInputElement | null) => void;
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
              onClick={() => openFilePicker(wallpaperInput.current)}
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
              onClick={() => openFilePicker(iconsInput.current)}
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
              onClick={() => openFilePicker(layoutInput.current)}
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

// =====================================================================
// Icon Detail Edit Modal
// =====================================================================

const FONTS = [
  { value: "Malgun Gothic, sans-serif", label: "맑은 고딕" },
  { value: "Pretendard, sans-serif", label: "Pretendard" },
  { value: "Noto Sans KR, sans-serif", label: "Noto Sans KR" },
  { value: "Inter, sans-serif", label: "Inter" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "system-ui, -apple-system, sans-serif", label: "System" },
];
const COLORS = ["#ffffff", "#000000", "#a78bfa", "#60a5fa", "#34d399", "#fbbf24", "#f87171", "#ec4899"];

function IconDetailEditModal({
  icon,
  asset,
  iconAssets,
  onPickAsset,
  onAddIcons,
  openFilePicker,
  onSave,
  onClose,
}: {
  icon: PlacedIcon;
  asset: IconAsset | null;
  iconAssets: IconAsset[];
  onPickAsset: (assetId: string) => void;
  onAddIcons: (f: FileList | File[]) => void;
  openFilePicker: (input: HTMLInputElement | null) => void;
  onSave: (patch: Partial<PlacedIcon>) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(icon.name);
  const [size, setSize] = useState(icon.size);
  const [showLabel, setShowLabel] = useState(icon.show_name);
  const [assetId, setAssetId] = useState(icon.assetId);
  const [font, setFont] = useState(icon.font_family);
  const [fontSize, setFontSize] = useState(icon.font_size);
  const [bold, setBold] = useState(icon.font_bold);
  const [italic, setItalic] = useState(icon.font_italic);
  const [textColor, setTextColor] = useState(icon.font_color);
  const [strokeColor, setStrokeColor] = useState(icon.outline_color);
  const fileInput = useRef<HTMLInputElement>(null);

  const previewAsset = iconAssets.find((a) => a.id === assetId) ?? asset;

  const handleSave = () => {
    onPickAsset(assetId);
    onSave({
      name: label,
      size,
      show_name: showLabel,
      font_family: font,
      font_size: fontSize,
      font_bold: bold,
      font_italic: italic,
      font_color: textColor,
      outline_color: strokeColor,
    });
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm grid place-items-center p-6" onClick={onClose}>
      <div
        className="w-full max-w-3xl bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border/60">
          <div className="text-base font-semibold">아이콘 수정</div>
          <div className="text-xs text-muted-foreground mt-0.5">선택한 아이콘 설정 변경</div>
        </div>

        <div className="grid grid-cols-[1fr_280px] gap-0 max-h-[70vh]">
          {/* Form */}
          <div className="p-6 space-y-5 overflow-y-auto scrollbar-thin">
            <div>
              <Label className="text-xs">아이콘 이름</Label>
              <Input className="mt-1.5" value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs">커스텀 이미지 선택</Label>
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  accept=".png,.svg,.ico"
                  className="hidden"
                  onChange={(e) => e.target.files && onAddIcons(e.target.files)}
                />
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openFilePicker(fileInput.current)}>
                  <UploadIcon className="h-3 w-3" /> 업로드
                </Button>
              </div>
              {iconAssets.length > 0 ? (
                <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto pr-1">
                  {iconAssets.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setAssetId(a.id)}
                      className={cn(
                        "aspect-square rounded-lg border bg-background/40 grid place-items-center overflow-hidden transition-all",
                        assetId === a.id ? "border-primary ring-2 ring-primary/40" : "border-border/60 hover:border-primary/50",
                      )}
                    >
                      <img src={a.previewUrl} alt="" className="max-h-[75%] max-w-[75%] object-contain" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground text-center py-4 rounded-lg border border-dashed border-border/60">
                  업로드된 이미지가 없습니다.
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs">아이콘 크기</Label>
                <span className="text-xs text-muted-foreground">{size}px</span>
              </div>
              <Slider value={[size]} min={40} max={512} step={1} onValueChange={(v) => setSize(v[0])} />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs">이름 표시</Label>
              <Switch checked={showLabel} onCheckedChange={setShowLabel} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">폰트</Label>
                <Select value={font} onValueChange={setFont}>
                  <SelectTrigger className="mt-1.5 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[120]">
                    {FONTS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs">폰트 크기</Label>
                  <span className="text-xs text-muted-foreground">{fontSize}px</span>
                </div>
                <Slider value={[fontSize]} min={8} max={28} step={1} onValueChange={(v) => setFontSize(v[0])} />
              </div>
            </div>

            <div>
              <Label className="text-xs">글자색</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setTextColor(c)}
                    style={{ background: c }}
                    className={cn(
                      "h-7 w-7 rounded-md border-2 transition-all",
                      textColor === c ? "border-primary scale-110" : "border-border/40",
                    )}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">외곽선색</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setStrokeColor(c)}
                    style={{ background: c }}
                    className={cn(
                      "h-7 w-7 rounded-md border-2 transition-all",
                      strokeColor === c ? "border-primary scale-110" : "border-border/40",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="border-l border-border/60 bg-muted/20 p-6 flex flex-col items-center justify-center">
            <div className="text-[11px] text-muted-foreground mb-4 uppercase tracking-wider">미리보기</div>
            <div className="desktopIconWrapper" style={{ "--desktop-icon-size": `${Math.min(size, 180)}px` } as CSSProperties}>
              <div
                className="desktopIconImageBox rounded-xl bg-background/60 border border-border/40 overflow-hidden shadow-card"
              >
                {previewAsset ? (
                  <img src={previewAsset.previewUrl} alt="" className="desktopIconImage max-h-[75%] max-w-[75%]" draggable={false} />
                ) : (
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              {showLabel && (
                <div
                  className="desktopIconLabel max-w-[200px] truncate"
                  style={{
                    fontFamily: font,
                    fontSize: `${fontSize}px`,
                    color: textColor,
                    WebkitTextStroke: `0.5px ${strokeColor}`,
                  }}
                >
                  {label || "아이콘 이름"}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border/60">
          <Button variant="ghost" onClick={onClose}>취소</Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={handleSave}>수정 완료</Button>
        </div>
      </div>
    </div>
  );
}
