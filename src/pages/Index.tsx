import { useNavigate } from "react-router-dom";
import { Sparkles, Play, Power, Loader2, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { libraryPresets, marketplacePresets, marketItems, downloadedIds, LibraryStatus } from "@/data/mockData";
import { MarketItemCard } from "@/components/presets/PresetCard";
import { useToast } from "@/hooks/use-toast";
import { useWishlist } from "@/lib/wishlist";
import { useLibrary } from "@/lib/library";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  ApiError,
  deactivateOverlay,
  getActivePreset,
  localEngineUrl,
  type PresetModel,
} from "@/services/localEngineApi";
import { PresetMiniPreview } from "@/components/presets/PresetMiniPreview";

const statusStyles: Record<LibraryStatus, string> = {
  "현재 적용 중": "bg-success text-success-foreground border-success",
  "매핑 필요": "bg-warning text-background border-warning",
  "로컬 수정됨": "bg-primary/15 text-primary border-primary/30",
  "다운로드됨": "bg-muted text-muted-foreground border-border",
  "구매함": "bg-accent text-accent-foreground border-border",
  "내가 만든 프리셋": "bg-primary/15 text-primary border-primary/30",
};
const visibleStatuses: LibraryStatus[] = ["현재 적용 중", "매핑 필요"];

const Index = () => {
  const nav = useNavigate();
  const { toast } = useToast();
  const { isWishlisted, toggle } = useWishlist();
  const { requestApply } = useLibrary();
  const [deactivating, setDeactivating] = useState(false);
  // Live "currently applied" preset pulled from the local engine. `null`
  // means the engine is reachable but nothing is applied; `undefined`
  // means we haven't fetched yet or the engine is offline.
  const [activePreset, setActivePreset] = useState<PresetModel | null | undefined>(undefined);
  const refetchActive = async () => {
    try {
      const res = await getActivePreset();
      setActivePreset(res?.active ?? null);
    } catch {
      setActivePreset(null);
    }
  };
  useEffect(() => {
    refetchActive();
    const onFocus = () => refetchActive();
    const onRefresh = () => refetchActive();
    window.addEventListener("focus", onFocus);
    window.addEventListener("presets:refresh", onRefresh as EventListener);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("presets:refresh", onRefresh as EventListener);
    };
  }, []);
  const handleDeactivate = async () => {
    if (deactivating) return;
    setDeactivating(true);
    try {
      await deactivateOverlay();
      setActivePreset(null);
      toast({ title: "기본 바탕화면으로 복원됐어요" });
    } catch (err) {
      console.error("[home] deactivate failed", err);
      toast({
        title: "프리셋을 끄지 못했습니다.",
        description:
          err instanceof ApiError && err.status === 0
            ? "ICNO Desktop App이 실행 중인지 확인해주세요."
            : err instanceof Error
              ? err.message
              : "알 수 없는 오류",
        variant: "destructive",
      });
    } finally {
      setDeactivating(false);
    }
  };
  const toggleWish = (id: string) => {
    const added = toggle(id);
    toast({ title: added ? "찜 추가" : "찜 해제", description: added ? "찜 목록에 추가했어요." : "찜 목록에서 제거했어요." });
  };
  const recent = libraryPresets.slice(0, 3);
  const creatorMap = new Map(marketplacePresets.map((m) => [m.id, m.creator.name] as const));
  const presetItems = marketItems.filter((i) => i.type === "preset");
  const recentDownloads = presetItems.filter((p) => downloadedIds.includes(p.id)).slice(0, 4);
  const popular = [...presetItems].sort((a: any, b: any) => b.downloads - a.downloads).slice(0, 4);

  return (
    <div className="space-y-10">
      {/* Hero / current preset */}
      <section className="relative overflow-hidden rounded-3xl border border-border shadow-card">
        {activePreset ? (
          <>
            <div className="absolute inset-0">
              <PresetMiniPreview preset={activePreset} className="w-full h-full" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/30" />
            <div className="relative p-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-3">
                <Sparkles className="h-3.5 w-3.5" /> 현재 적용 중인 프리셋
              </div>
              <h2 className="text-4xl font-bold tracking-tight mb-3">
                {activePreset.name || "이름 없는 프리셋"}
              </h2>
              <div className="flex gap-3 mt-6">
                {activePreset.id && (
                  <Button
                    onClick={() => nav(`/upload?preset=${activePreset.id}`)}
                    className="bg-gradient-primary text-primary-foreground hover:opacity-90"
                  >
                    프리셋 관리
                  </Button>
                )}
                <Button variant="outline" onClick={() => nav("/library")}>보관함 열기</Button>
                <Button variant="outline" onClick={handleDeactivate} disabled={deactivating}>
                  {deactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                  끄기
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="relative p-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              <ImageOff className="h-3.5 w-3.5" /> 적용 중인 프리셋 없음
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              지금은 기본 바탕화면을 사용 중이에요
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              보관함에서 프리셋을 선택해 적용해보세요.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => nav("/library")} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                보관함 열기
              </Button>
              <Button variant="outline" onClick={() => nav("/explore")}>탐색하기</Button>
            </div>
          </div>
        )}
      </section>

      <Section title="최근 사용한 프리셋">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {recent.map((lp) => {
            const creator = (lp as any)._creator ?? (lp.sourceMarketId ? creatorMap.get(lp.sourceMarketId) : undefined);
            return (
              <div
                key={lp.id}
                className="group relative rounded-2xl overflow-hidden bg-card border border-border shadow-card hover:shadow-glow transition-all"
              >
                <div
                  className="relative aspect-[16/10] overflow-hidden cursor-pointer"
                  onClick={() => nav(`/upload?preset=${lp.id}`)}
                >
                  <img src={lp.thumbnail} alt={lp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  {visibleStatuses.includes(lp.status) && (
                    <span className={cn("absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md border shadow-card", statusStyles[lp.status])}>
                      {lp.status}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate">{lp.name}</h3>
                    {creator && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">@{creator}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-3 h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      requestApply(lp.sourceMarketId ?? lp.id);
                    }}
                  >
                    <Play className="h-3.5 w-3.5 mr-1.5" />
                    적용하기
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="최근 다운로드한 프리셋" right={<Button variant="ghost" size="sm" onClick={() => nav("/profile/downloads")}>전체 보기</Button>}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {recentDownloads.map((p) => (
            <MarketItemCard
              key={p.id}
              item={p}
              wishlisted={isWishlisted(p.id)}
              onWishlist={() => toggleWish(p.id)}
              onClick={() => nav(`/explore?item=${p.id}`)}
            />
          ))}
        </div>
      </Section>

      <Section title="인기 프리셋" right={<Button variant="ghost" size="sm" onClick={() => nav("/explore")}>마켓 둘러보기</Button>}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {popular.map((p) => (
            <MarketItemCard
              key={p.id}
              item={p}
              wishlisted={isWishlisted(p.id)}
              onWishlist={() => toggleWish(p.id)}
              onClick={() => nav(`/explore?item=${p.id}`)}
            />
          ))}
        </div>
      </Section>
    </div>
  );
};

function Section({ title, subtitle, right, children }: { title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export default Index;
