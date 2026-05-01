import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Play, Link2, Save, Copy, RotateCcw, Download, Trash2,
  MoreHorizontal, Image as ImageIcon, CheckCircle2, AlertCircle,
  Move, Grid3x3, Magnet, History, MousePointer2, Info,
} from "lucide-react";
import { libraryPresets, IconAsset } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconEditModal } from "@/components/presets/IconEditModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type EditableIcon = IconAsset & { mappedTo?: string; originPos: { x: number; y: number } };

export default function LibraryDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const preset = libraryPresets.find((p) => p.id === id) ?? libraryPresets[0];

  const [icons, setIcons] = useState<EditableIcon[]>(() =>
    preset.icons.map((i) => ({ ...i, originPos: { ...i.position } })),
  );
  const [savedIcons, setSavedIcons] = useState<EditableIcon[]>(icons);
  const [selected, setSelected] = useState<string | undefined>();
  const [editing, setEditing] = useState<string | null>(null);

  // Edit canvas state
  const [editMode, setEditMode] = useState(true);
  const [layoutMode, setLayoutMode] = useState<"free" | "grid">("free");
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string>(preset.lastModified + " 14:32");

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  // Resolution reference (for px display)
  const RES_W = 1920;
  const RES_H = 1080;

  const dirty = useMemo(
    () => icons.some((i, idx) => {
      const s = savedIcons[idx];
      return !s || s.position.x !== i.position.x || s.position.y !== i.position.y;
    }),
    [icons, savedIcons],
  );

  const modifiedFromOrigin = useMemo(
    () => icons.some((i) => i.position.x !== i.originPos.x || i.position.y !== i.originPos.y),
    [icons],
  );

  const selectedIcon = icons.find((i) => i.id === selected);

  // pct -> px
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
    if (snapToGrid || layoutMode === "grid") {
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
    setSavedIcons(icons);
    const now = new Date();
    setLastSavedAt(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    );
    toast.success("위치가 저장되었습니다", {
      description: "내 보관함 프리셋에만 적용되며, 마켓 원본은 그대로입니다.",
    });
  };

  const handleResetPositions = () => {
    setIcons((prev) => prev.map((i) => ({ ...i, position: { ...savedIcons.find((s) => s.id === i.id)?.position ?? i.originPos } })));
    toast("저장된 위치로 되돌렸습니다");
  };

  const handleRestoreOrigin = () => {
    setIcons((prev) => prev.map((i) => ({ ...i, position: { ...i.originPos } })));
    toast("마켓 원본 위치로 복원했습니다");
  };

  const handleGridAlign = () => {
    setLayoutMode("grid");
    setIcons((prev) =>
      prev.map((i, idx) => ({
        ...i,
        position: {
          x: 6 + (idx % 4) * 12,
          y: 8 + Math.floor(idx / 4) * 18,
        },
      })),
    );
    toast("그리드 정렬을 적용했습니다");
  };

  const handleSnapSelected = () => {
    if (!selectedIcon) return;
    setIcons((prev) =>
      prev.map((i) =>
        i.id === selectedIcon.id
          ? { ...i, position: { x: snap(i.position.x, 6), y: snap(i.position.y, 9) } }
          : i,
      ),
    );
  };

  const handleRestoreOriginIcon = (iconId: string) => {
    setIcons((prev) =>
      prev.map((i) => (i.id === iconId ? { ...i, position: { ...i.originPos } } : i)),
    );
  };

  const handleSaveSingle = (iconId: string) => {
    setSavedIcons((prev) => {
      const cur = icons.find((i) => i.id === iconId);
      if (!cur) return prev;
      return prev.map((s) => (s.id === iconId ? { ...s, position: { ...cur.position } } : s));
    });
    toast.success("현재 위치가 저장되었습니다");
  };

  // Warn user about unsaved changes
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => nav("/library")}>
          <ArrowLeft className="h-4 w-4 mr-1" />보관함
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">{preset.name}</h2>
            {dirty && (
              <Badge variant="outline" className="border-warning/50 text-warning bg-warning/10">
                저장되지 않은 위치 변경
              </Badge>
            )}
            {!dirty && modifiedFromOrigin && (
              <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10">
                로컬 수정됨
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            로컬 프리셋 · 마지막 위치 저장 {lastSavedAt}
          </p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground"><Play className="h-4 w-4 mr-2" />바탕화면 적용</Button>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-4">
          {/* Position editor toolbar */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2.5">
            <div className="flex items-center gap-2 px-2">
              <Move className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">위치 편집 모드</span>
              <Switch checked={editMode} onCheckedChange={setEditMode} />
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center rounded-md border border-border overflow-hidden">
              <button
                onClick={() => setLayoutMode("free")}
                className={cn(
                  "px-3 h-8 text-xs font-medium flex items-center gap-1.5",
                  layoutMode === "free" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                <MousePointer2 className="h-3.5 w-3.5" />자유 배치
              </button>
              <button
                onClick={handleGridAlign}
                className={cn(
                  "px-3 h-8 text-xs font-medium flex items-center gap-1.5 border-l border-border",
                  layoutMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                <Grid3x3 className="h-3.5 w-3.5" />그리드 정렬
              </button>
            </div>
            <Button
              variant={snapToGrid ? "default" : "outline"}
              size="sm"
              onClick={() => setSnapToGrid((v) => !v)}
              className="h-8"
            >
              <Magnet className="h-3.5 w-3.5 mr-1" />그리드에 맞추기
            </Button>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={handleResetPositions} className="h-8" disabled={!dirty}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />위치만 초기화
            </Button>
            <Button variant="outline" size="sm" onClick={handleRestoreOrigin} className="h-8">
              <History className="h-3.5 w-3.5 mr-1" />원본 위치로 복원
            </Button>
            <Button
              size="sm"
              onClick={handleSavePositions}
              disabled={!dirty}
              className="h-8 bg-gradient-primary text-primary-foreground"
            >
              <Save className="h-3.5 w-3.5 mr-1" />위치 저장
            </Button>
          </div>

          {/* Interactive canvas */}
          <div
            ref={canvasRef}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onClick={(e) => { if (e.target === e.currentTarget) setSelected(undefined); }}
            className={cn(
              "relative w-full aspect-[16/10] rounded-xl overflow-hidden border-2 shadow-card bg-muted select-none",
              editMode ? "border-primary/50 cursor-crosshair" : "border-border",
            )}
            style={
              editMode
                ? {
                    backgroundImage: `url(${preset.thumbnail})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : { backgroundImage: `url(${preset.thumbnail})`, backgroundSize: "cover", backgroundPosition: "center" }
            }
          >
            {/* Grid overlay when in grid mode or snap on */}
            {editMode && (snapToGrid || layoutMode === "grid") && (
              <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, hsl(var(--primary) / 0.4) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary) / 0.4) 1px, transparent 1px)",
                  backgroundSize: "6% 9%",
                }}
              />
            )}

            {/* Editor mode banner */}
            {editMode && (
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-primary/90 backdrop-blur px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-lg">
                <Move className="h-3 w-3" />
                드래그해서 아이콘을 자유롭게 이동하세요
              </div>
            )}

            {/* Selected coords pill */}
            {selectedIcon && (
              <div className="absolute top-3 right-3 z-10 rounded-md bg-background/90 backdrop-blur px-3 py-1.5 text-[11px] font-mono shadow-lg border border-border">
                <span className="text-muted-foreground">{selectedIcon.label}</span>
                <span className="mx-2 text-border">|</span>
                <span className="text-primary font-semibold">
                  X {toPx(selectedIcon.position.x, selectedIcon.position.y).x}, Y {toPx(selectedIcon.position.x, selectedIcon.position.y).y}
                </span>
              </div>
            )}

            {/* Icons */}
            {icons.map((ic) => {
              const isDragging = draggingId === ic.id;
              const isSelected = selected === ic.id;
              const isMoved = ic.position.x !== ic.originPos.x || ic.position.y !== ic.originPos.y;
              return (
                <div
                  key={ic.id}
                  onPointerDown={(e) => onPointerDown(e, ic)}
                  style={{
                    left: `${ic.position.x}%`,
                    top: `${ic.position.y}%`,
                    touchAction: "none",
                  }}
                  className={cn(
                    "absolute flex flex-col items-center gap-1 group/icon transition-shadow",
                    editMode ? "cursor-grab" : "cursor-pointer",
                    isDragging && "cursor-grabbing opacity-70 scale-110 z-20 drop-shadow-2xl",
                  )}
                >
                  <div
                    className={cn(
                      "h-12 w-12 rounded-xl bg-background/80 backdrop-blur grid place-items-center text-2xl shadow-card transition-all relative",
                      isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-transparent",
                      isDragging && "ring-2 ring-primary shadow-glow",
                    )}
                  >
                    {ic.emoji}
                    {isMoved && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-warning ring-2 ring-background" />
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-white drop-shadow-lg px-1 leading-tight pointer-events-none">
                    {ic.label}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Info className="h-3 w-3" />
            아이콘 위치 변경은 내 보관함에만 저장되며, 마켓 원본에는 영향을 주지 않습니다.
          </p>

          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold">포함된 아이콘 ({icons.length})</h3>
            <div className="text-xs text-muted-foreground">매핑 {preset.mappedCount} / {preset.iconCount}</div>
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            {icons.map((ic) => {
              const mapped = !!ic.mappedTo;
              const px = toPx(ic.position.x, ic.position.y);
              const isMoved = ic.position.x !== ic.originPos.x || ic.position.y !== ic.originPos.y;
              return (
                <div
                  key={ic.id}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/40 transition cursor-pointer",
                    selected === ic.id && "border-primary",
                  )}
                  onClick={() => setSelected(ic.id)}
                >
                  <div className="h-10 w-10 rounded-lg bg-muted grid place-items-center text-xl shrink-0">{ic.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-1.5">
                      {ic.label}
                      {isMoved && <span className="h-1.5 w-1.5 rounded-full bg-warning" />}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 flex-wrap">
                      {mapped ? <><CheckCircle2 className="h-3 w-3 text-success" />연결됨</> : <><AlertCircle className="h-3 w-3 text-warning" />연결 필요</>}
                      <span>· {ic.size.w}×{ic.size.h}</span>
                      <span className="font-mono">· X {px.x}, Y {px.y}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="h-7 w-7 grid place-items-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => { setSelected(ic.id); setEditMode(true); }}>
                        위치 수정
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSaveSingle(ic.id)}>
                        현재 위치 저장
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRestoreOriginIcon(ic.id)}>
                        원본 위치로 복원
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setSelected(ic.id); handleSnapSelected(); }}>
                        그리드에 맞추기
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setEditing(ic.id)}>아이콘 수정</DropdownMenuItem>
                      <DropdownMenuItem>이미지 변경</DropdownMenuItem>
                      <DropdownMenuItem>이름 변경</DropdownMenuItem>
                      <DropdownMenuItem>스타일 수정</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>대상 프로그램 매핑</DropdownMenuItem>
                      <DropdownMenuItem>연결 해제</DropdownMenuItem>
                      <DropdownMenuItem>복제</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive">삭제</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">프리셋 정보</div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">프리셋 이름</div>
              <div className="text-sm font-semibold">{preset.name}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">설명</div>
              <div className="text-sm">{preset.description}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">태그</div>
              <div className="flex flex-wrap gap-1">
                {preset.tags.map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted">#{t}</span>
                ))}
              </div>
            </div>
            <div className="border-t border-border pt-3 space-y-2">
              <div className="text-xs text-muted-foreground">배경화면</div>
              <div className="flex items-center gap-3">
                <img src={preset.thumbnail} className="h-12 w-20 object-cover rounded-md" alt="" />
                <Button variant="outline" size="sm"><ImageIcon className="h-3.5 w-3.5 mr-1" />변경</Button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground border-t border-border pt-3">
              매핑 진행률 <span className="text-foreground font-semibold">{preset.mappedCount}/{preset.iconCount}</span>
              <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-primary" style={{ width: `${(preset.mappedCount / preset.iconCount) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Position state panel */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">위치 상태</div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">배치 모드</span>
              <span className="font-semibold">{layoutMode === "free" ? "자유 배치" : "그리드"}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">위치 수정 상태</span>
              {dirty ? (
                <Badge variant="outline" className="border-warning/50 text-warning bg-warning/10 text-[10px]">
                  저장되지 않음
                </Badge>
              ) : modifiedFromOrigin ? (
                <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-[10px]">
                  로컬 수정됨
                </Badge>
              ) : (
                <span className="font-semibold">원본</span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">마지막 위치 저장</span>
              <span className="font-mono">{lastSavedAt}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">해상도 기준</span>
              <span className="font-mono">{RES_W} × {RES_H}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">저장 방식</span>
              <span className="font-semibold">픽셀 + 비율 보정</span>
            </div>
            {preset.sourceMarketId && (
              <div className="text-[11px] text-muted-foreground border-t border-border pt-3">
                마켓 출처: <span className="text-primary">{preset.sourceMarketId}</span>
                <div className="mt-1">원본 위치는 그대로 보존됩니다.</div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">주요 작업</div>
            <Button className="w-full bg-gradient-primary text-primary-foreground"><Play className="h-4 w-4 mr-2" />바탕화면 적용</Button>
            <Button variant="outline" className="w-full" onClick={handleSavePositions} disabled={!dirty}>
              <Save className="h-4 w-4 mr-2" />위치 저장
            </Button>
            <Button variant="outline" className="w-full"><Link2 className="h-4 w-4 mr-2" />매핑 설정</Button>
            <Button variant="outline" className="w-full"><Copy className="h-4 w-4 mr-2" />새 프리셋으로 복제</Button>
            <Button variant="outline" className="w-full" onClick={handleRestoreOrigin}>
              <RotateCcw className="h-4 w-4 mr-2" />원본 위치로 복원
            </Button>
            <Button variant="outline" className="w-full"><Download className="h-4 w-4 mr-2" />다시 다운로드</Button>
            <Button variant="outline" className="w-full text-destructive hover:text-destructive"><Trash2 className="h-4 w-4 mr-2" />삭제</Button>
          </div>
        </aside>
      </div>

      {editing && (
        <IconEditModal
          icon={icons.find((i) => i.id === editing)!}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
