import { useCallback, useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Store, Trash2, Loader2, Upload as UploadIcon, UploadCloud, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  listWallpaperLibrary,
  renameWallpaperAsset,
  deleteWallpaperAsset,
  applyWallpaper,
  uploadWallpaper,
  localEngineUrl,
  type WallpaperLibraryAsset,
} from "@/services/localEngineApi";
import { MarketWallpaperUploadModal } from "@/components/presets/MarketWallpaperUploadModal";
import type { WallpaperToUpload } from "@/services/marketWallpaperUpload";
import { CreateOption } from "@/components/presets/CreateOption";

/** 보관함 > 배경화면 탭 — 아이콘 보관함과 동일한 구조(단일 전용). */
export function WallpaperLibrary() {
  const nav = useNavigate();
  const [assets, setAssets] = useState<WallpaperLibraryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<WallpaperLibraryAsset | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<WallpaperLibraryAsset | null>(null);
  const [marketTarget, setMarketTarget] = useState<WallpaperToUpload | null>(null);
  const [marketPickerOpen, setMarketPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listWallpaperLibrary();
      setAssets(res.assets ?? []);
    } catch {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const on = () => void load();
    window.addEventListener("wallpaper-library:refresh", on);
    return () => window.removeEventListener("wallpaper-library:refresh", on);
  }, [load]);

  const srcOf = (a: WallpaperLibraryAsset) =>
    typeof a.url === "string" && a.url ? localEngineUrl(a.url) : localEngineUrl(`/api/wallpapers/library/${a.asset_id}/file`);

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let ok = 0;
    for (const f of Array.from(files)) {
      try {
        await uploadWallpaper(f);
        ok++;
      } catch {
        /* skip */
      }
    }
    setUploading(false);
    toast({ title: ok > 0 ? `배경화면 ${ok}장을 보관함에 추가했습니다.` : "업로드에 실패했습니다.", variant: ok > 0 ? undefined : "destructive" });
    void load();
  };

  const handleApply = async (a: WallpaperLibraryAsset) => {
    setBusyId(a.asset_id);
    try {
      await applyWallpaper(a.local_image_path);
      toast({ title: "배경화면을 적용했습니다." });
    } catch (e) {
      toast({
        title: "적용에 실패했습니다",
        description: e instanceof Error ? e.message : "ICNO 엔진 실행을 확인하세요.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const doRename = async () => {
    if (!renameTarget) return;
    const name = renameValue.trim();
    if (!name) return;
    try {
      await renameWallpaperAsset(renameTarget.asset_id, name);
      toast({ title: "이름을 변경했습니다." });
      setRenameTarget(null);
      void load();
    } catch (e) {
      toast({ title: "이름 변경에 실패했습니다", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteWallpaperAsset(deleteTarget.asset_id, true);
      toast({ title: "배경화면을 삭제했습니다." });
      setDeleteTarget(null);
      void load();
    } catch (e) {
      toast({ title: "삭제에 실패했습니다", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">
          내 배경화면을 관리하고 바로 적용하거나 마켓에 올릴 수 있습니다.
          {uploading ? " · 업로드 중…" : ""}
        </p>
      </div>

      {loading ? (
        <div className="border border-dashed border-border rounded-2xl p-16 text-center text-sm text-muted-foreground">
          불러오는 중…
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="group rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center min-h-[180px] gap-3"
          >
            <div className="h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-glow">
              <Plus className="h-6 w-6" />
            </div>
            <div className="text-sm font-semibold">새 배경화면 만들기</div>
            <div className="text-xs text-muted-foreground">마켓 · 로컬 가져오기 · 마켓에 업로드</div>
          </button>
          {assets.map((a) => (
            <div key={a.asset_id} className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
              <div className="relative aspect-video bg-muted/30 overflow-hidden">
                <img src={srcOf(a)} alt={a.display_name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              </div>
              <div className="p-3 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{a.display_name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {a.width && a.height ? `${a.width}×${a.height}` : "배경화면"}
                      {a.file_exists === false ? " · 파일 없음" : ""}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setRenameTarget(a);
                          setRenameValue(a.display_name);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-2" />이름 변경
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setMarketTarget({ id: a.asset_id, title: a.display_name, imageUrl: (a.url as string) || `/api/wallpapers/library/${a.asset_id}/file` })}
                      >
                        <Store className="h-3.5 w-3.5 mr-2" />마켓에 올리기
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(a)}>
                        <Trash2 className="h-3.5 w-3.5 mr-2" />삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Button size="sm" variant="outline" className="w-full" disabled={busyId === a.asset_id} onClick={() => void handleApply(a)}>
                  {busyId === a.asset_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "바탕화면에 적용"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          void handleUploadFiles(e.target.files);
          if (fileRef.current) fileRef.current.value = "";
        }}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>새 배경화면 만들기</DialogTitle>
            <DialogDescription>어떻게 시작할지 선택하세요</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 pt-2">
            <CreateOption
              icon={Store}
              title="마켓에서 불러오기"
              desc="마켓플레이스에서 배경화면을 다운로드"
              onClick={() => { setCreateOpen(false); nav("/explore"); }}
            />
            <CreateOption
              icon={UploadIcon}
              title="로컬 가져오기"
              desc="내 컴퓨터에서 이미지 파일을 올리기"
              onClick={() => { setCreateOpen(false); fileRef.current?.click(); }}
            />
            <CreateOption
              icon={UploadCloud}
              title="마켓에 업로드"
              desc="내 배경화면을 마켓에 게시하기"
              onClick={() => { setCreateOpen(false); setMarketPickerOpen(true); }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>이름 변경</DialogTitle>
          </DialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} maxLength={60} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameTarget(null)}>취소</Button>
            <Button onClick={doRename} disabled={!renameValue.trim()}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>배경화면 삭제</DialogTitle>
            <DialogDescription>
              “{deleteTarget?.display_name}”을 보관함과 로컬 파일에서 완전히 삭제합니다. 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>취소</Button>
            <Button variant="destructive" onClick={doDelete}>삭제</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {(marketTarget || marketPickerOpen) && (
        <MarketWallpaperUploadModal
          wallpaper={marketTarget}
          allWallpapers={assets.map((a) => ({
            id: a.asset_id,
            title: a.display_name,
            imageUrl: (a.url as string) || `/api/wallpapers/library/${a.asset_id}/file`,
          }))}
          onClose={() => {
            setMarketTarget(null);
            setMarketPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}