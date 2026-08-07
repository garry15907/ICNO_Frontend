import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
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
import { useAuth } from "@/lib/auth";
import { Download, LogIn, MonitorSmartphone, Loader2 } from "lucide-react";
import {
  ApiError,
  applyPresetLocal,
  createPreset,
  getPreset,
  updatePreset,
  type PresetModel,
} from "@/services/localEngineApi";
import {
  MarketplacePreset,
  marketplacePresets,
  libraryPresets,
} from "@/data/mockData";

export type SavedPresetSource = "download" | "purchase" | "manual_save";
export type DownloadStatus = "idle" | "downloading" | "success" | "failed";

export type SavedPreset = {
  id: string; // saved-record id
  userId: string;
  presetId: string;
  savedAt: string; // ISO date
  source: SavedPresetSource;
  isApplied: boolean;
  lastAppliedAt?: string;
  variantId?: string;
};

type LibraryContextValue = {
  savedPresets: SavedPreset[];
  savedPresetIds: string[];
  isSaved: (presetId: string) => boolean;
  downloadStatus: Record<string, DownloadStatus>;
  selectedDownloadPresetId: string | null;
  isLoggedIn: boolean;
  downloadCount: (preset: MarketplacePreset) => number;
  /** Attempts to save a preset to the library. Handles login gating + toast. */
  downloadPreset: (
    preset: MarketplacePreset,
    opts?: { source?: SavedPresetSource; variantId?: string },
  ) => Promise<{ ok: boolean; alreadySaved?: boolean }>;
  requestApply: (presetId: string) => Promise<void> | void;
  /**
   * Save an editor-built PresetModel to the local engine (POST or PUT
   * depending on `model.id`), then call apply-local. Emits the success
   * toast only after a real 2xx from apply-local. `onSaved` fires with
   * the persisted model so the caller can remember the backend id.
   */
  applyEditedPreset: (
    model: PresetModel,
    opts?: { onSaved?: (saved: PresetModel) => void },
  ) => Promise<void>;
  /** True while any preset is being applied to the local engine. */
  isApplying: boolean;
  /** The preset id currently being applied, if any. */
  applyingPresetId: string | null;
  /** Returns the library-detail route id for a saved marketplace preset, if any. */
  getLibraryIdForPreset: (presetId: string) => string | null;
};

const LibraryCtx = createContext<LibraryContextValue | null>(null);

const LOCAL_USER_ID = "u-local";

export function LibraryProvider({ children }: { children: ReactNode }) {
  const nav = useNavigate();
  const { session } = useAuth();
  // 마켓 다운로드 기록은 아직 백엔드가 없어 세션 내에서만 유지됩니다.
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  const [downloadStatus, setDownloadStatus] = useState<Record<string, DownloadStatus>>({});
  const [selectedDownloadPresetId, setSelectedDownloadPresetId] = useState<string | null>(null);
  const [downloadBumps, setDownloadBumps] = useState<Record<string, number>>({});
  const isLoggedIn = !!session;

  // login modal state
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  // apply modal state
  const [applyTargetId, setApplyTargetId] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyingPresetId, setApplyingPresetId] = useState<string | null>(null);

  const savedPresetIds = useMemo(() => savedPresets.map((s) => s.presetId), [savedPresets]);

  const isSaved = useCallback((pid: string) => savedPresetIds.includes(pid), [savedPresetIds]);

  const getLibraryIdForPreset = useCallback(
    (presetId: string): string | null => {
      const sv = savedPresets.find((s) => s.presetId === presetId);
      if (sv) return `lib-saved-${sv.id}`;
      const lp = libraryPresets.find((p) => p.sourceMarketId === presetId);
      return lp?.id ?? null;
    },
    [savedPresets],
  );

  const downloadCount = useCallback(
    (preset: MarketplacePreset) => preset.downloads + (downloadBumps[preset.id] ?? 0),
    [downloadBumps],
  );

  const downloadPreset = useCallback<LibraryContextValue["downloadPreset"]>(
    async (preset, opts) => {
      if (!isLoggedIn) {
        setLoginPromptOpen(true);
        return { ok: false };
      }
      if (isSaved(preset.id)) {
        toast({ title: "이미 보관함에 저장된 프리셋입니다." });
        return { ok: false, alreadySaved: true };
      }
      setSelectedDownloadPresetId(preset.id);
      setDownloadStatus((s) => ({ ...s, [preset.id]: "downloading" }));
      // Simulate an async save (structure ready for Supabase swap).
      await new Promise((r) => setTimeout(r, 400));
      const record: SavedPreset = {
        id: `sv-${Date.now()}`,
        userId: LOCAL_USER_ID,
        presetId: preset.id,
        savedAt: new Date().toISOString(),
        source: opts?.source ?? "download",
        isApplied: false,
        variantId: opts?.variantId,
      };
      setSavedPresets((prev) => [record, ...prev]);
      setDownloadBumps((b) => ({ ...b, [preset.id]: (b[preset.id] ?? 0) + 1 }));
      setDownloadStatus((s) => ({ ...s, [preset.id]: "success" }));
      setSelectedDownloadPresetId(null);
      toast({
        title: "프리셋이 내 보관함에 저장되었습니다.",
        description: preset.name,
        action: (
          <button
            onClick={() => nav(`/upload?preset=lib-saved-${record.id}`)}
            className="text-xs font-semibold px-2.5 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90"
          >
            보관함에서 열기
          </button>
        ) as any,
      });
      return { ok: true };
    },
    [isLoggedIn, isSaved, nav],
  );

  // Shared failure-toast helper. `network` toggles the "please install"
  // modal for cases where the engine is unreachable.
  const surfaceApplyError = useCallback((err: unknown, presetId?: string) => {
    const isNetwork = err instanceof ApiError && err.status === 0;
    const description = isNetwork
      ? "ICNO Desktop App이 실행 중인지 확인해주세요."
      : err instanceof Error
        ? err.message
        : "알 수 없는 오류가 발생했습니다.";
    if (isNetwork && presetId) setApplyTargetId(presetId);
    toast({ title: "프리셋 적용에 실패했습니다.", description, variant: "destructive" });
  }, []);

  // Legacy call path used by marketplace/library cards. These callers
  // only know a preset id — they cannot rebuild the PresetModel, so we
  // simply forward to `POST /api/presets/{id}/apply-local`. If the id
  // isn't on the engine (e.g. it's a mock/marketplace id that was never
  // saved), we tell the user to open the editor and save first.
  const requestApply = useCallback(async (presetId: string) => {
    setApplying(true);
    setApplyingPresetId(presetId);
    try {
      try {
        await getPreset(presetId);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          toast({
            title: "저장된 프리셋이 아닙니다.",
            description: "프리셋 편집에서 저장한 뒤 적용해주세요.",
            variant: "destructive",
          });
          return;
        }
        throw err;
      }
      await applyPresetLocal(presetId);
      toast({ title: "프리셋이 데스크톱에 적용되었습니다." });
    } catch (err) {
      console.error("[library] apply-local failed", err);
      surfaceApplyError(err, presetId);
    } finally {
      setApplying(false);
      setApplyingPresetId(null);
    }
  }, [surfaceApplyError]);

  const applyEditedPreset = useCallback<LibraryContextValue["applyEditedPreset"]>(
    async (model, opts) => {
      setApplying(true);
      setApplyingPresetId(model.id || "current");
      try {
        // 1) Save preset: PUT when we already have a backend id, else POST.
        const saved = model.id
          ? await updatePreset(model.id, model)
          : await createPreset(model);
        const savedId = saved?.id ?? model.id ?? "";
        if (!savedId) throw new ApiError("Preset save did not return an id.", 500, saved);
        opts?.onSaved?.(saved);

        // 2) Apply.
        await applyPresetLocal(savedId);
        toast({ title: "프리셋이 데스크톱에 적용되었습니다." });
      } catch (err) {
        console.error("[library] applyEditedPreset failed", err);
        surfaceApplyError(err, model.id || undefined);
      } finally {
        setApplying(false);
        setApplyingPresetId(null);
      }
    },
    [surfaceApplyError],
  );

  const value = useMemo<LibraryContextValue>(
    () => ({
      savedPresets,
      savedPresetIds,
      isSaved,
      downloadStatus,
      selectedDownloadPresetId,
      isLoggedIn,
      downloadCount,
      downloadPreset,
      requestApply,
      applyEditedPreset,
      isApplying: applying,
      applyingPresetId,
      getLibraryIdForPreset,
    }),
    [
      savedPresets,
      savedPresetIds,
      isSaved,
      downloadStatus,
      selectedDownloadPresetId,
      isLoggedIn,
      downloadCount,
      downloadPreset,
      requestApply,
      applyEditedPreset,
      applying,
      applyingPresetId,
      getLibraryIdForPreset,
    ],
  );

  const applyPreset = applyTargetId
    ? marketplacePresets.find((p) => p.id === applyTargetId)
    : undefined;

  return (
    <LibraryCtx.Provider value={value}>
      {children}

      {/* Login required prompt */}
      <Dialog open={loginPromptOpen} onOpenChange={setLoginPromptOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>로그인이 필요합니다</DialogTitle>
            <DialogDescription>
              프리셋을 다운로드하고 보관함에 저장하려면 로그인이 필요합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoginPromptOpen(false)}>
              취소
            </Button>
            <Button
              className="bg-gradient-primary text-primary-foreground"
              onClick={() => {
                setLoginPromptOpen(false);
                nav("/auth?redirect=" + encodeURIComponent(window.location.pathname));
              }}
            >
              <LogIn className="h-4 w-4 mr-1.5" />
              로그인하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply -> Desktop App install required modal */}
      <Dialog open={!!applyTargetId} onOpenChange={(o) => !o && setApplyTargetId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MonitorSmartphone className="h-4 w-4 text-primary" />
              ICNO Desktop App이 필요합니다
            </DialogTitle>
            <DialogDescription>
              프리셋을 실제 데스크톱에 적용하려면 ICNO Desktop App을 설치해야 합니다.
              {applyPreset ? ` (${applyPreset.name})` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
            데스크톱 앱이 배경화면과 아이콘 배치를 OS에 안전하게 적용합니다.
            현재 브라우저에서는 미리보기만 지원됩니다.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyTargetId(null)}>
              닫기
            </Button>
            <Button
              className="bg-gradient-primary text-primary-foreground"
              onClick={() => {
                toast({ title: "설치 안내 페이지로 이동합니다" });
                setApplyTargetId(null);
              }}
            >
              <Download className="h-4 w-4 mr-1.5" />
              앱 설치하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global apply-in-progress overlay */}
      {applying && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="rounded-xl border bg-card px-4 py-3 shadow-lg flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            데스크톱에 프리셋을 적용하는 중…
          </div>
        </div>
      )}
    </LibraryCtx.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryCtx);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
}