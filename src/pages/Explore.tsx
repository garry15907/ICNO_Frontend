import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import { PresetCard } from "@/components/presets/PresetCard";
import { marketplacePresets, wishlistIds } from "@/data/mockData";
import { ExplorePresetModal } from "@/components/presets/ExplorePresetModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const priceFilters = ["전체", "무료", "유료"] as const;
const categories = ["전체", "자연", "캐릭터", "다크", "미니멀", "게임", "파스텔", "사이버펑크"];
const sortOptions = ["인기순", "최신순", "다운로드순", "평점순"];

export default function Explore() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [price, setPrice] = useState<(typeof priceFilters)[number]>("전체");
  const [category, setCategory] = useState("전체");
  const [sort, setSort] = useState("인기순");
  const [wishlist, setWishlist] = useState<string[]>(wishlistIds);

  const openId = params.get("preset");
  const openPreset = marketplacePresets.find((p) => p.id === openId);

  const presets = useMemo(() => {
    let list = [...marketplacePresets];
    if (price === "무료") list = list.filter((p) => p.price === 0);
    if (price === "유료") list = list.filter((p) => p.price > 0);
    if (category !== "전체") list = list.filter((p) => p.category === category);
    if (query) list = list.filter((p) => (p.name + p.creator.name + p.tags.join(" ")).includes(query));
    if (sort === "다운로드순") list.sort((a, b) => b.downloads - a.downloads);
    if (sort === "평점순") list.sort((a, b) => b.rating - a.rating);
    if (sort === "최신순") list.reverse();
    return list;
  }, [price, category, query, sort]);

  const toggleWish = (id: string) =>
    setWishlist((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">마켓플레이스</h2>
        <p className="text-muted-foreground mt-1">전 세계 크리에이터의 데스크톱 프리셋을 둘러보세요.</p>
      </div>

      {/* Search bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="프리셋 이름, 태그, 크리에이터 검색"
            className="pl-9 h-11 bg-card"
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-40 h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            {sortOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground mr-1" />
        {priceFilters.map((f) => (
          <Chip key={f} active={price === f} onClick={() => setPrice(f)}>{f}</Chip>
        ))}
        <span className="mx-2 h-5 w-px bg-border" />
        {categories.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">라이선스 필터 (준비 중)</span>
      </div>

      {/* Grid */}
      {presets.length === 0 ? (
        <div className="border border-dashed rounded-2xl p-16 text-center text-muted-foreground">
          조건에 맞는 프리셋이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {presets.map((p) => (
            <PresetCard
              key={p.id}
              preset={p}
              wishlisted={wishlist.includes(p.id)}
              onWishlist={() => toggleWish(p.id)}
              onClick={() => setParams({ preset: p.id })}
            />
          ))}
        </div>
      )}

      {openPreset && (
        <ExplorePresetModal
          preset={openPreset}
          wishlisted={wishlist.includes(openPreset.id)}
          onWishlist={() => toggleWish(openPreset.id)}
          onClose={() => setParams({})}
        />
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow-glow"
          : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}