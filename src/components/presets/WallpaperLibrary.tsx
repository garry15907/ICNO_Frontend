import { useCallback, useEffect, useState } from "react";
import { Image as ImageIcon, MoreHorizontal, Pencil, Store, Trash2, Loader2, Upload as UploadIcon, Compass } from "lucide-react";
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
  const [uploading, setUploading] = useState(false);

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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">내 배경화면을 관리하고 바로 적용하거나 마켓에 올릴 수 있습니다.</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => nav("/explore")} className="gap-1.5">
            <Compass className="h-3.5 w-3.5" /> 마켓에서 찾기
          </Button>
          <label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={(e) => void handleUploadFiles(e.target.files)}
            />
            <Button size="sm" asChild disabled={uploading} className="gap-1.5">
              <span>
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadIcon className="h-3.5 w-3.5" />}
                배경화면 추가
              </span>
            </Button>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="border border-dashed border-border rounded-2xl p-16 text-center text-sm text-muted-foreground">
          불러오는 중…
        </div>
      ) : assets.length === 0 ? (
        <div className="border border-dashed border-border rounded-2xl p-16 text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 grid place-items-center text-primary">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div className="font-semibold">배경화면이 없습니다</div>
          <p className="text-sm text-muted-foreground">
            파일을 추가하거나 마켓에서 배경화면을 다운로드하면 이곳에 보입니다.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {marketTarget && (
        <MarketWallpaperUploadModal wallpaper={marketTarget} onClose={() => setMarketTarget(null)} />
      )}
    </div>
  );
}