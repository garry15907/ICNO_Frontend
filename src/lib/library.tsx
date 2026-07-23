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
import { Download, LogIn, MonitorSmartphone, Loader2 } from "lucide-react";
import { reloadOverlay, startOverlay, ApiError } from "@/services/api";
import {
  MarketplacePreset,
  marketplacePresets,
  downloadedIds as initialDownloadedIds,
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
  setLoggedIn: (v: boolean) => void;
  downloadCount: (preset: MarketplacePreset) => number;
  /** Attempts to save a preset to the library. Handles login gating + toast. */
  downloadPreset: (
    preset: MarketplacePreset,
    opts?: { source?: SavedPresetSource; variantId?: string },
  ) => Promise<{ ok: boolean; alreadySaved?: boolean }>;
  requestApply: (presetId: string) => void;
  /** Returns the library-detail route id for a saved marketplace preset, if any. */
  getLibraryIdForPreset: (presetId: string) => string | null;
};

const LibraryCtx = createContext<LibraryContextValue | null>(null);

const MOCK_USER_ID = "u-local";

function seedSavedFromDownloaded(): SavedPreset[] {
  return initialDownloadedIds.map((pid, i) => ({
    id: `sv-seed-${i}`,
    userId: MOCK_USER_ID,
    presetId: pid,
    savedAt: new Date(Date.now() - (i + 1) * 86400_000).toISOString(),
    source: "download",
    isApplied: false,
  }));
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const nav = useNavigate();
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>(() => seedSavedFromDownloaded());
  const [downloadStatus, setDownloadStatus] = useState<Record<string, DownloadStatus>>({});
  const [selectedDownloadPresetId, setSelectedDownloadPresetId] = useState<string | null>(null);
  const [downloadBumps, setDownloadBumps] = useState<Record<string, number>>({});
  const [isLoggedIn, setLoggedIn] = useState(true); // mock; swap for real auth later

  // login modal state
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  // apply modal state
  const [applyTargetId, setApplyTargetId] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

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
        userId: MOCK_USER_ID,
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

  const requestApply = useCallback(async (presetId: string) => {
    // Attempt to talk to the real FastAPI desktop engine first. On success
    // we skip the "install the app" prompt entirely; on failure we fall
    // back to the existing install-required modal so the user knows why.
    setApplying(true);
    try {
      await reloadOverlay();
      toast({ title: "프리셋이 데스크톱에 적용되었습니다." });
    } catch (err) {
      if (err instanceof ApiError && err.status !== 0) {
        // Overlay might not be running yet — try starting it once.
        try {
          await startOverlay();
          await reloadOverlay();
          toast({ title: "프리셋이 데스크톱에 적용되었습니다." });
          setApplying(false);
          return;
        } catch (err2) {
          console.error("[library] apply failed after start-overlay retry", err2);
        }
      }
      // Network error or repeated failure → show install-required modal.
      setApplyTargetId(presetId);
      toast({
        title: "데스크톱 앱에 연결할 수 없습니다.",
        description: "ICNO Desktop App이 실행 중인지 확인해주세요.",
        variant: "destructive",
      });
    } finally {
      setApplying(false);
    }
  }, []);

  const value = useMemo<LibraryContextValue>(
    () => ({
      savedPresets,
      savedPresetIds,
      isSaved,
      downloadStatus,
      selectedDownloadPresetId,
      isLoggedIn,
      setLoggedIn,
      downloadCount,
      downloadPreset,
      requestApply,
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
                setLoggedIn(true);
                setLoginPromptOpen(false);
                toast({ title: "로그인되었습니다" });
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