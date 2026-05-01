import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, Link2, Save, Copy, RotateCcw, Download, Trash2, MoreHorizontal, Image as ImageIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { libraryPresets } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { DesktopPreview } from "@/components/presets/DesktopPreview";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { IconEditModal } from "@/components/presets/IconEditModal";
import { cn } from "@/lib/utils";

export default function LibraryDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const preset = libraryPresets.find((p) => p.id === id) ?? libraryPresets[0];
  const [selected, setSelected] = useState<string | undefined>();
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => nav("/library")}>
          <ArrowLeft className="h-4 w-4 mr-1" />보관함
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">{preset.name}</h2>
          <p className="text-xs text-muted-foreground">로컬 프리셋 · 마지막 수정 {preset.lastModified}</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground"><Play className="h-4 w-4 mr-2" />바탕화면 적용</Button>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Preview + icon list */}
        <div className="space-y-4">
          <DesktopPreview wallpaper={preset.thumbnail} icons={preset.icons} selectedId={selected} onSelect={setSelected} />

          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold">포함된 아이콘 ({preset.icons.length})</h3>
            <div className="text-xs text-muted-foreground">매핑 {preset.mappedCount} / {preset.iconCount}</div>
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            {preset.icons.map((ic) => {
              const mapped = !!ic.mappedTo;
              return (
                <div
                  key={ic.id}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/40 transition",
                    selected === ic.id && "border-primary"
                  )}
                  onClick={() => setSelected(ic.id)}
                >
                  <div className="h-10 w-10 rounded-lg bg-muted grid place-items-center text-xl shrink-0">{ic.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{ic.label}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      {mapped ? <><CheckCircle2 className="h-3 w-3 text-success" />연결됨</> : <><AlertCircle className="h-3 w-3 text-warning" />연결 필요</>}
                      <span>· {ic.size.w}×{ic.size.h}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-7 w-7 grid place-items-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setEditing(ic.id)}>아이콘 수정</DropdownMenuItem>
                      <DropdownMenuItem>이미지 변경</DropdownMenuItem>
                      <DropdownMenuItem>이름 변경</DropdownMenuItem>
                      <DropdownMenuItem>위치/크기 수정</DropdownMenuItem>
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
            {preset.sourceMarketId && (
              <div className="text-[11px] text-muted-foreground border-t border-border pt-3">
                마켓 출처: <span className="text-primary">{preset.sourceMarketId}</span>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">주요 작업</div>
            <Button className="w-full bg-gradient-primary text-primary-foreground"><Play className="h-4 w-4 mr-2" />바탕화면 적용</Button>
            <Button variant="outline" className="w-full"><Link2 className="h-4 w-4 mr-2" />매핑 설정</Button>
            <Button variant="outline" className="w-full"><Save className="h-4 w-4 mr-2" />저장</Button>
            <Button variant="outline" className="w-full"><Copy className="h-4 w-4 mr-2" />새 프리셋으로 복제</Button>
            <Button variant="outline" className="w-full"><RotateCcw className="h-4 w-4 mr-2" />초기 상태로 복원</Button>
            <Button variant="outline" className="w-full"><Download className="h-4 w-4 mr-2" />다시 다운로드</Button>
            <Button variant="outline" className="w-full text-destructive hover:text-destructive"><Trash2 className="h-4 w-4 mr-2" />삭제</Button>
          </div>
        </aside>
      </div>

      {editing && (
        <IconEditModal
          icon={preset.icons.find((i) => i.id === editing)!}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}