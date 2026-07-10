import { useNavigate } from "react-router-dom";
import { Sparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { libraryPresets, marketplacePresets, marketItems, downloadedIds, LibraryStatus } from "@/data/mockData";
import { MarketItemCard } from "@/components/presets/PresetCard";
import { useToast } from "@/hooks/use-toast";
import { useWishlist } from "@/lib/wishlist";
import { useLibrary } from "@/lib/library";
import { cn } from "@/lib/utils";

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
  const toggleWish = (id: string) => {
    const added = toggle(id);
    toast({ title: added ? "찜 추가" : "찜 해제", description: added ? "찜 목록에 추가했어요." : "찜 목록에서 제거했어요." });
  };
  const current = libraryPresets.find((p) => p.status === "현재 적용 중")!;
  const recent = libraryPresets.slice(0, 3);
  const creatorMap = new Map(marketplacePresets.map((m) => [m.id, m.creator.name] as const));
  const presetItems = marketItems.filter((i) => i.type === "preset");
  const recentDownloads = presetItems.filter((p) => downloadedIds.includes(p.id)).slice(0, 4);
  const popular = [...presetItems].sort((a: any, b: any) => b.downloads - a.downloads).slice(0, 4);

  return (
    <div className="space-y-10">
      {/* Hero / current preset */}
      <section className="relative overflow-hidden rounded-3xl border border-border shadow-card">
        <img src={current.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/30" />
        <div className="relative p-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            <Sparkles className="h-3.5 w-3.5" /> 현재 적용 중인 프리셋
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-3">{current.name}</h2>
          <div className="flex gap-3 mt-6">
            <Button onClick={() => nav(`/upload?preset=${current.id}`)} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
              프리셋 관리
            </Button>
            <Button variant="outline" onClick={() => nav("/library")}>보관함 열기</Button>
          </div>
        </div>
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
