import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, Package as PackageIcon, AlertTriangle } from "lucide-react";
import type { MarketIcon, MarketIconPack } from "@/data/mockData";
import {
  UserIconAsset,
  applyUserIconToPreset as svcApply,
  deleteUserIconAsset as svcDelete,
  downloadIconPackToLibrary,
  downloadIconToLibrary,
  getIconUsage,
  getUserIconAssets,
  isIconDownloaded as svcIsDownloaded,
  renameUserIconAsset as svcRename,
} from "@/services/iconLibraryService";

export type IconDownloadStatus = "idle" | "downloading" | "success" | "failed";

type EditingContext = {
  libraryPresetId: string;
  iconMappingId?: string;
} | null;

type PickHandler = (asset: UserIconAsset) => void;

type Ctx = {
  userIcons: UserIconAsset[];
  downloadedIconIds: string[];
  isDownloaded: (originalIconId: string) => boolean;
  iconDownloadStatus: Record<string, IconDownloadStatus>;
  selectedUserIconAssetId: string | null;
  setSelectedUserIconAssetId: (id: string | null) => void;

  downloadIcon: (icon: MarketIcon) => Promise<UserIconAsset | null>;
  downloadPack: (pack: MarketIconPack) => Promise<{ added: number; skipped: number }>;
  requestDelete: (id: string) => void;
  renameIcon: (id: string, newTitle: string) => void;

  // Editing session (used by "프리셋에 사용" flow)
  editingContext: EditingContext;
  setEditingContext: (ctx: EditingContext) => void;
  applyIconToCurrentPreset: (userIconAssetId: string) => void;

  // Preset editor picker registration — lets the icon library modal talk to
  // whichever preset editor opened it.
  registerPickHandler: (handler: PickHandler | null) => void;
  pickHandler: PickHandler | null;

  usageOf: (userIconAssetId: string) => { presetIds: string[]; count: number };
};

const IconLibCtx = createContext<Ctx | null>(null);

export function IconLibraryProvider({ children }: { children: ReactNode }) {
  const nav = useNavigate();
  const [userIcons, setUserIcons] = useState<UserIconAsset[]>(() => getUserIconAssets());
  const [iconDownloadStatus, setStatus] = useState<Record<string, IconDownloadStatus>>({});
  const [selectedUserIconAssetId, setSelectedUserIconAssetId] = useState<string | null>(null);
  const [editingContext, setEditingContext] = useState<EditingContext>(null);
  const [pickHandler, setPickHandler] = useState<PickHandler | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserIconAsset | null>(null);
  const [needsPresetOpen, setNeedsPresetOpen] = useState(false);

  const refresh = useCallback(() => setUserIcons(getUserIconAssets()), []);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("storage", handler);
    window.addEventListener("focus", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("focus", handler);
    };
  }, [refresh]);

  const downloadedIconIds = useMemo(
    () => userIcons.map((u) => u.originalIconId),
    [userIcons],
  );
  const isDownloaded = useCallback(
    (id: string) => downloadedIconIds.includes(id),
    [downloadedIconIds],
  );

  const downloadIcon = useCallback<Ctx["downloadIcon"]>(async (icon) => {
    if (svcIsDownloaded(icon.id)) {
      toast({ title: "이미 내 아이콘 보관함에 저장된 아이콘입니다." });
      return null;
    }
    setStatus((s) => ({ ...s, [icon.id]: "downloading" }));
    await new Promise((r) => setTimeout(r, 350));
    const asset = downloadIconToLibrary(icon);
    refresh();
    setStatus((s) => ({ ...s, [icon.id]: asset ? "success" : "failed" }));
    if (asset) {
      toast({
        title: "아이콘이 내 아이콘 보관함에 저장되었습니다.",
        description: icon.name,
        action: (
          <button
            onClick={() => nav("/library?tab=icons")}
            className="text-xs font-semibold px-2.5 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90"
          >
            아이콘 보관함에서 보기
          </button>
        ) as any,
      });
    }
    return asset;
  }, [nav, refresh]);

  const downloadPack = useCallback<Ctx["downloadPack"]>(async (pack) => {
    setStatus((s) => ({ ...s, [pack.id]: "downloading" }));
    await new Promise((r) => setTimeout(r, 400));
    const { added, skipped } = downloadIconPackToLibrary(pack);
    refresh();
    setStatus((s) => ({ ...s, [pack.id]: added.length ? "success" : "failed" }));
    if (added.length) {
      toast({
        title: `아이콘 팩 ${added.length}개가 내 아이콘 보관함에 저장되었습니다.`,
        description: skipped ? `${skipped}개는 이미 저장되어 있어 건너뛰었습니다.` : pack.name,
        action: (
          <button
            onClick={() => nav("/library?tab=icons")}
            className="text-xs font-semibold px-2.5 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90"
          >
            아이콘 보관함에서 보기
          </button>
        ) as any,
      });
    } else {
      toast({ title: "이미 내 아이콘 보관함에 저장된 아이콘입니다." });
    }
    return { added: added.length, skipped };
  }, [nav, refresh]);

  const requestDelete = useCallback((id: string) => {
    const target = userIcons.find((u) => u.id === id);
    if (target) setDeleteTarget(target);
  }, [userIcons]);

  const renameIcon = useCallback((id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    svcRename(id, trimmed);
    refresh();
    toast({ title: "아이콘 이름이 변경되었습니다.", description: trimmed });
  }, [refresh]);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    svcDelete(deleteTarget.id);
    refresh();
    toast({ title: "아이콘을 보관함에서 삭제했습니다." });
    setDeleteTarget(null);
  };

  const applyIconToCurrentPreset = useCallback((userIconAssetId: string) => {
    if (!editingContext) {
      setNeedsPresetOpen(true);
      setSelectedUserIconAssetId(userIconAssetId);
      return;
    }
    if (editingContext.iconMappingId) {
      svcApply(editingContext.libraryPresetId, editingContext.iconMappingId, userIconAssetId);
    }
  }, [editingContext]);

  const registerPickHandler = useCallback((h: PickHandler | null) => {
    setPickHandler(() => h);
  }, []);

  const usageOf = useCallback((id: string) => getIconUsage(id), []);

  const value = useMemo<Ctx>(() => ({
    userIcons,
    downloadedIconIds,
    isDownloaded,
    iconDownloadStatus,
    selectedUserIconAssetId,
    setSelectedUserIconAssetId,
    downloadIcon,
    downloadPack,
    requestDelete,
    renameIcon,
    editingContext,
    setEditingContext,
    applyIconToCurrentPreset,
    registerPickHandler,
    pickHandler,
    usageOf,
  }), [
    userIcons, downloadedIconIds, isDownloaded, iconDownloadStatus,
    selectedUserIconAssetId, downloadIcon, downloadPack, requestDelete,
    editingContext, applyIconToCurrentPreset, registerPickHandler, pickHandler, usageOf, renameIcon,
  ]);

  const deleteUsage = deleteTarget ? getIconUsage(deleteTarget.id) : null;

  return (
    <IconLibCtx.Provider value={value}>
      {children}

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              이 아이콘을 내 아이콘 보관함에서 삭제하시겠습니까?
            </DialogTitle>
            <DialogDescription>
              이미 프리셋에서 사용 중인 아이콘인 경우, 해당 프리셋의 아이콘 이미지도 영향을 받을 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          {deleteUsage && deleteUsage.count > 0 && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-foreground/80">
              현재 {deleteUsage.count}개의 프리셋에서 사용 중입니다.
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>취소</Button>
            <Button variant="destructive" onClick={confirmDelete}>삭제</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* "Pick a preset first" prompt */}
      <Dialog open={needsPresetOpen} onOpenChange={(o) => !o && setNeedsPresetOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageIcon className="h-4 w-4 text-primary" />
              프리셋을 먼저 선택해주세요
            </DialogTitle>
            <DialogDescription>
              이 아이콘을 사용할 프리셋을 먼저 선택해주세요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNeedsPresetOpen(false)}>취소</Button>
            <Button
              className="bg-gradient-primary text-primary-foreground"
              onClick={() => {
                setNeedsPresetOpen(false);
                nav("/library?tab=presets");
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              보관함의 프리셋 보기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </IconLibCtx.Provider>
  );
}

export function useIconLibrary() {
  const ctx = useContext(IconLibCtx);
  if (!ctx) throw new Error("useIconLibrary must be used within IconLibraryProvider");
  return ctx;
}