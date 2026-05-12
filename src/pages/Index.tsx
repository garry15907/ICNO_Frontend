import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { libraryPresets, marketplacePresets, marketItems, downloadedIds } from "@/data/mockData";
import { MarketItemCard } from "@/components/presets/PresetCard";
import { useToast } from "@/hooks/use-toast";
import { useWishlist } from "@/lib/wishlist";

const Index = () => {
  const nav = useNavigate();
  const { toast } = useToast();
  const { isWishlisted, toggle } = useWishlist();
  const toggleWish = (id: string) => {
    const added = toggle(id);
    toast({ title: added ? "찜 추가" : "찜 해제", description: added ? "찜 목록에 추가했어요." : "찜 목록에서 제거했어요." });
  };
  const current = libraryPresets.find((p) => p.status === "현재 적용 중")!;
  const recent = libraryPresets.slice(0, 3);
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
            <Button onClick={() => nav(`/library/${current.id}`)} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
              프리셋 관리
            </Button>
            <Button variant="outline" onClick={() => nav("/library")}>보관함 열기</Button>
          </div>
        </div>
      </section>

      <Section title="최근 사용한 프리셋">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {recent.map((lp) => (
            <button
              key={lp.id}
              onClick={() => nav(`/library/${lp.id}`)}
              className="group card-hover-surface rounded-2xl overflow-hidden border border-border bg-card shadow-card hover:shadow-glow will-change-transform transition-[transform,box-shadow,border-color] duration-300 text-left"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img src={lp.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="p-4">
                <div className="font-semibold text-sm">{lp.name}</div>
                <div className="text-xs text-muted-foreground">매핑 {lp.mappedCount} / {lp.iconCount} · {lp.status}</div>
              </div>
            </button>
          ))}
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
