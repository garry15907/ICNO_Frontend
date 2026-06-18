import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload as UploadIcon,
  ImageIcon,
  ShieldCheck,
  Check,
  FileJson,
  Layers,
  X,
  Sparkles,
  Monitor,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type IconFile = { file: File; previewUrl: string };
type LayoutData = {
  wallpaper?: string;
  icons: { name: string; x: number; y: number; size?: number; file?: string }[];
};

const CATEGORIES = ["자연", "캐릭터", "다크", "미니멀", "게임", "파스텔", "사이버펑크"];

// Lightweight JSONC parser: strip // and /* */ comments, then JSON.parse.
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

export default function Upload() {
  const { toast } = useToast();

  // Files
  const [wallpaper, setWallpaper] = useState<{ file: File; url: string } | null>(null);
  const [icons, setIcons] = useState<IconFile[]>([]);
  const [layoutFile, setLayoutFile] = useState<File | null>(null);
  const [layoutData, setLayoutData] = useState<LayoutData | null>(null);
  const [layoutError, setLayoutError] = useState<string | null>(null);

  // Meta
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // Publish settings
  const [isPublic, setIsPublic] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState<string>("");
  const [allowComments, setAllowComments] = useState(true);
  const [allowRatings, setAllowRatings] = useState(true);

  // Refs
  const wallpaperInput = useRef<HTMLInputElement>(null);
  const iconsInput = useRef<HTMLInputElement>(null);
  const layoutInput = useRef<HTMLInputElement>(null);

  // --- Handlers ---
  const onWallpaper = (file?: File) => {
    if (!file) return;
    if (!/\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
      toast({ title: "지원하지 않는 형식", description: "JPG, PNG, WEBP, GIF만 업로드할 수 있어요." });
      return;
    }
    setWallpaper({ file, url: URL.createObjectURL(file) });
  };

  const onIcons = (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => /\.(png|svg|ico)$/i.test(f.name));
    if (!arr.length) {
      toast({ title: "지원하지 않는 형식", description: "PNG, SVG, ICO만 업로드할 수 있어요." });
      return;
    }
    setIcons((prev) => [...prev, ...arr.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))]);
  };

  const onLayout = async (file?: File) => {
    if (!file) return;
    if (!/\.(jsonc?|json\.c)$/i.test(file.name)) {
      setLayoutError("배치 정보 파일 형식이 올바르지 않습니다. (.json, .jsonc 지원)");
      setLayoutFile(file);
      setLayoutData(null);
      return;
    }
    try {
      const text = await file.text();
      const parsed = parseJsonc(text) as LayoutData;
      if (!parsed || !Array.isArray(parsed.icons)) {
        throw new Error("icons 배열이 필요합니다.");
      }
      setLayoutFile(file);
      setLayoutData(parsed);
      setLayoutError(null);
    } catch (e) {
      setLayoutFile(file);
      setLayoutData(null);
      setLayoutError("배치 정보 파일 형식이 올바르지 않습니다.");
    }
  };

  const addTag = () => {
    const t = tagInput.trim().replace(/,$/, "");
    if (!t) return;
    if (!tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  // --- Checklist ---
  const checks = [
    { key: "wp", label: "배경화면 업로드", done: !!wallpaper },
    { key: "ic", label: "아이콘 파일 업로드", done: icons.length > 0 },
    { key: "lo", label: "배치 정보 파일 업로드", done: !!layoutData },
    { key: "info", label: "프리셋 정보 입력", done: name.trim().length > 0 && category.length > 0 },
    { key: "sale", label: "판매 설정 완료", done: !isPaid || (!!price && Number(price) > 0) },
  ];
  const allDone = checks.every((c) => c.done);

  const handlePublish = () => {
    if (!allDone) return;
    toast({ title: "프리셋이 게시되었습니다", description: `${name} · ${icons.length}개 아이콘` });
  };

  // --- Preview placement ---
  const previewIcons = useMemo(() => {
    if (!layoutData) return [];
    return layoutData.icons.slice(0, 40).map((it, i) => {
      const match = icons.find((ic) => ic.file.name === it.file || ic.file.name === it.name);
      return {
        key: i,
        x: Math.max(2, Math.min(94, Number(it.x) || (5 + (i % 8) * 11))),
        y: Math.max(2, Math.min(90, Number(it.y) || (8 + Math.floor(i / 8) * 18))),
        url: match?.previewUrl,
        name: it.name || it.file || `icon-${i}`,
      };
    });
  }, [layoutData, icons]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Hidden inputs */}
      <input ref={wallpaperInput} type="file" accept=".jpg,.jpeg,.png,.webp,.gif" className="hidden"
        onChange={(e) => onWallpaper(e.target.files?.[0])} />
      <input ref={iconsInput} type="file" multiple accept=".png,.svg,.ico" className="hidden"
        onChange={(e) => e.target.files && onIcons(e.target.files)} />
      <input ref={layoutInput} type="file" accept=".json,.jsonc,.c" className="hidden"
        onChange={(e) => onLayout(e.target.files?.[0])} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">프리셋 등록</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            배경화면, 아이콘, 배치 정보를 업로드해 나만의 데스크탑 프리셋을 공유하세요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-lg">임시저장</Button>
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

      {/* Notice */}
      <div className="rounded-xl border border-border/60 bg-card/40 px-4 py-3 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <div className="font-semibold">로컬 매핑 정보는 자동으로 제거됩니다</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            대상 프로그램, 파일, 폴더, 단축아이콘 경로 등 PC 정보는 마켓에 업로드되지 않습니다.
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.05fr_1fr] gap-6">
        {/* LEFT: Preview + Checklist */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-border/60 bg-card/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">데스크탑 미리보기</h2>
              </div>
              {wallpaper && (
                <span className="text-[11px] text-muted-foreground">
                  {previewIcons.length > 0 ? `${previewIcons.length}개 아이콘 배치됨` : "배치 정보 대기 중"}
                </span>
              )}
            </div>
            <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-border bg-muted">
              {wallpaper ? (
                <img src={wallpaper.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-center px-6">
                  <div className="text-muted-foreground">
                    <Monitor className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <div className="text-sm">배경화면과 배치 정보를 업로드하면 미리보기가 표시됩니다.</div>
                  </div>
                </div>
              )}
              {wallpaper && previewIcons.map((ic) => (
                <div
                  key={ic.key}
                  style={{ left: `${ic.x}%`, top: `${ic.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
                >
                  <div className="h-11 w-11 rounded-xl bg-background/85 backdrop-blur grid place-items-center text-xl shadow-card overflow-hidden">
                    {ic.url ? (
                      <img src={ic.url} alt="" className="h-9 w-9 object-contain" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-[10px] text-white drop-shadow-lg max-w-[64px] truncate">{ic.name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Checklist */}
          <section className="rounded-2xl border border-border/60 bg-card/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">업로드 완료 체크리스트</h2>
              <span className="text-xs text-muted-foreground">
                {checks.filter((c) => c.done).length} / {checks.length}
              </span>
            </div>
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
            <Button
              onClick={handlePublish}
              disabled={!allDone}
              className={cn(
                "w-full mt-5 h-11 rounded-lg font-semibold",
                allDone
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
                  : "bg-muted text-muted-foreground cursor-not-allowed",
              )}
            >
              <Sparkles className="h-4 w-4" /> {allDone ? "게시하기" : "필수 항목을 완료해주세요"}
            </Button>
          </section>
        </div>

        {/* RIGHT: Steps */}
        <div className="space-y-6">
          {/* Step 1 */}
          <StepCard step="01" title="파일 업로드" desc="프리셋을 구성할 파일들을 업로드해주세요.">
            <div className="space-y-3">
              <UploadCard
                icon={<ImageIcon className="h-5 w-5" />}
                title="배경화면"
                desc="데스크탑에 적용될 배경 이미지"
                formats="JPG · PNG · WEBP · GIF"
                done={!!wallpaper}
                fileName={wallpaper?.file.name}
                fileMeta={wallpaper ? `${extOf(wallpaper.file.name)} · ${formatBytes(wallpaper.file.size)}` : undefined}
                onClick={() => wallpaperInput.current?.click()}
                onDrop={(f) => onWallpaper(f[0])}
                onClear={() => setWallpaper(null)}
              />

              <UploadCard
                icon={<Layers className="h-5 w-5" />}
                title="아이콘 파일"
                desc="여러 개의 아이콘을 한 번에 업로드"
                formats="PNG · SVG · ICO"
                done={icons.length > 0}
                fileName={icons.length > 0 ? `${icons.length}개 파일 선택됨` : undefined}
                onClick={() => iconsInput.current?.click()}
                onDrop={(f) => onIcons(f)}
                onClear={icons.length > 0 ? () => setIcons([]) : undefined}
              />

              {icons.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-muted/30 border border-border/40">
                  {icons.map((ic, i) => (
                    <div key={i} className="group relative rounded-lg bg-background/60 border border-border/40 p-2">
                      <button
                        onClick={() => setIcons((p) => p.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/90 border border-border opacity-0 group-hover:opacity-100 grid place-items-center transition"
                        aria-label="삭제"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="aspect-square rounded-md bg-muted/50 grid place-items-center overflow-hidden">
                        <img src={ic.previewUrl} alt="" className="max-h-full max-w-full object-contain" />
                      </div>
                      <div className="mt-1.5 text-[11px] truncate" title={ic.file.name}>{ic.file.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {extOf(ic.file.name)} · {formatBytes(ic.file.size)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <UploadCard
                icon={<FileJson className="h-5 w-5" />}
                title="배치 정보 파일"
                desc="아이콘 위치·크기·연결 정보를 담은 설정 파일"
                formats=".json · .jsonc"
                done={!!layoutData}
                error={layoutError ?? undefined}
                fileName={layoutFile?.name}
                fileMeta={
                  layoutData
                    ? `배치 정보 확인 완료 · ${layoutData.icons.length}개 아이콘`
                    : layoutFile && !layoutError
                      ? "파싱 중..."
                      : undefined
                }
                onClick={() => layoutInput.current?.click()}
                onDrop={(f) => onLayout(f[0])}
                onClear={
                  layoutFile
                    ? () => {
                        setLayoutFile(null);
                        setLayoutData(null);
                        setLayoutError(null);
                      }
                    : undefined
                }
              />
            </div>
          </StepCard>

          {/* Step 2 */}
          <StepCard step="02" title="프리셋 정보" desc="마켓에 표시될 기본 정보를 입력해주세요.">
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

          {/* Step 3 */}
          <StepCard step="03" title="공개 및 판매 설정" desc="누구에게 어떻게 공개할지 선택하세요.">
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
        </div>
      </div>
    </div>
  );
}

// --- Building blocks ---

function StepCard({
  step,
  title,
  desc,
  children,
}: {
  step: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
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

function UploadCard({
  icon,
  title,
  desc,
  formats,
  done,
  error,
  fileName,
  fileMeta,
  onClick,
  onDrop,
  onClear,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  formats: string;
  done?: boolean;
  error?: string;
  fileName?: string;
  fileMeta?: string;
  onClick: () => void;
  onDrop: (files: File[]) => void;
  onClear?: () => void;
}) {
  const [drag, setDrag] = useState(false);
  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDrag(false);
    const f = Array.from(e.dataTransfer.files);
    if (f.length) onDrop(f);
  };
  return (
    <button
      type="button"
      onClick={onClick}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      className={cn(
        "w-full text-left rounded-xl border bg-background/40 hover:bg-background/70 transition-all p-4 flex items-center gap-4",
        drag && "border-primary bg-primary/5",
        done && !error ? "border-primary/40" : "border-border/60",
        error && "border-destructive/60",
      )}
    >
      <div className={cn(
        "h-10 w-10 rounded-lg grid place-items-center shrink-0",
        done && !error ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{title}</span>
          {done && !error && (
            <Badge className="bg-primary/15 text-primary hover:bg-primary/15 border-0 text-[10px] h-5 px-1.5 gap-1">
              <Check className="h-3 w-3" /> 완료
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 truncate">
          {fileName ?? desc}
        </div>
        <div className="text-[11px] text-muted-foreground/80 mt-0.5 truncate">
          {fileMeta ?? formats}
        </div>
        {error && (
          <div className="text-[11px] text-destructive mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {error}
          </div>
        )}
      </div>
      {onClear ? (
        <span
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="h-8 w-8 rounded-md hover:bg-muted grid place-items-center text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </span>
      ) : (
        <span className="h-8 px-3 rounded-md border border-border text-xs grid place-items-center text-muted-foreground">
          <UploadIcon className="h-3.5 w-3.5" />
        </span>
      )}
    </button>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
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