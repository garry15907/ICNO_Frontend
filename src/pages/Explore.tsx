import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, Sparkles, Image as ImageIcon, Package, Layers, Monitor } from "lucide-react";
import { MarketItemCard } from "@/components/presets/PresetCard";
import { marketItems, type CreatorResolutionType } from "@/data/mockData";
import { useMarketPresets } from "@/lib/market-presets";
import { useWishlist } from "@/lib/wishlist";
import { MarketItemModal } from "@/components/presets/MarketItemModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useCurrentDisplay } from "@/lib/display";

const priceFilters = ["전체", "무료", "유료"] as const;
const categories = ["전체", "자연", "캐릭터", "다크", "미니멀", "게임", "파스텔", "사이버펑크"];
const sortOptions = ["인기순", "최신순", "다운로드순", "평점순", "가격 높은 순", "가격 낮은 순"];

const resolutionFilters: { id: "ALL" | CreatorResolutionType; label: string }[] = [
  { id: "ALL", label: "전체" },
  { id: "FHD", label: "FHD" },
  { id: "QHD", label: "QHD" },
  { id: "UHD", label: "UHD" },
  { id: "CUSTOM", label: "Custom" },
];

const typeFilters = [
  { id: "all", label: "전체", icon: Layers },
  { id: "preset", label: "프리셋", icon: Sparkles },
  { id: "icon", label: "아이콘", icon: ImageIcon },
  { id: "iconpack", label: "아이콘 팩", icon: Package },
] as const;

export default function Explore() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [price, setPrice] = useState<(typeof priceFilters)[number]>("전체");
  const [category, setCategory] = useState("전체");
  const [sort, setSort] = useState("인기순");
  const [typeFilter, setTypeFilter] = useState<"all" | "preset" | "icon" | "iconpack">("all");
  const { wishlist, isWishlisted, toggle } = useWishlist();
  const [filterOpen, setFilterOpen] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [resolution, setResolution] = useState<"ALL" | CreatorResolutionType>("ALL");
  const [matchOnly, setMatchOnly] = useState(false);
  const display = useCurrentDisplay();
  const { presets: cloudPresets } = useMarketPresets();
  const cloudMatches = useMemo(
    () =>
      cloudPresets.filter(
        (p) =>
          (typeFilter === "all" || typeFilter === "preset") &&
          (!query || (p.name + " " + p.tags.join(" ")).includes(query)),
      ),
    [cloudPresets, typeFilter, query],
  );

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.toLowerCase().includes(categoryQuery.toLowerCase())),
    [categoryQuery],
  );

  const openId = params.get("item") ?? params.get("preset");
  const openItem = marketItems.find((p) => p.id === openId);

  const items = useMemo(() => {
    let list = [...marketItems];
    if (typeFilter !== "all") list = list.filter((p) => p.type === typeFilter);
    if (price === "무료") list = list.filter((p) => p.price === 0);
    if (price === "유료") list = list.filter((p) => p.price > 0);
    if (category !== "전체") list = list.filter((p: any) => p.category === category);
    if (query) list = list.filter((p: any) => (p.name + p.creator.name + p.tags.join(" ")).includes(query));
    if (resolution !== "ALL") {
      list = list.filter((p: any) => p.type !== "preset" || p.creatorResolutionType === resolution);
    }
    if (matchOnly) {
      list = list.filter(
        (p: any) =>
          p.type !== "preset" ||
          (p.creatorResolutionWidth === display.width && p.creatorResolutionHeight === display.height),
      );
    }
    if (sort === "다운로드순") list.sort((a: any, b: any) => b.downloads - a.downloads);
    if (sort === "평점순") list.sort((a: any, b: any) => b.rating - a.rating);
    if (sort === "최신순") list.reverse();
    if (sort === "가격 높은 순") list.sort((a, b) => b.price - a.price);
    if (sort === "가격 낮은 순") list.sort((a, b) => a.price - b.price);
    return list;
  }, [typeFilter, price, category, query, sort, resolution, matchOnly, display]);

  const toggleWish = (id: string) => { toggle(id); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">마켓플레이스</h2>
        <p className="text-muted-foreground mt-1">데스크톱 프리셋, 아이콘 단품, 아이콘 팩을 둘러보세요.</p>
      </div>

      {/* Product type tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-1">
        {typeFilters.map((t) => (
          <button
            key={t.id}
            onClick={() => setTypeFilter(t.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition",
              typeFilter === t.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
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
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-11 gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              필터
              {(price !== "전체" || category !== "전체" || resolution !== "ALL" || matchOnly) && (
                <span className="ml-1 text-[10px] font-semibold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                  {(price !== "전체" ? 1 : 0) + (category !== "전체" ? 1 : 0) + (resolution !== "ALL" ? 1 : 0) + (matchOnly ? 1 : 0)}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-96 p-4 space-y-4 max-h-[80vh] overflow-y-auto">
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">가격</div>
              <div className="flex flex-wrap gap-2">
                {priceFilters.map((f) => (
                  <Chip key={f} active={price === f} onClick={() => setPrice(f)}>{f}</Chip>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Monitor className="h-3 w-3" />제작 해상도
                  <span className="text-[10px] text-muted-foreground/70 ml-1">(프리셋만 적용)</span>
                </div>
                {resolution !== "ALL" && (
                  <button onClick={() => setResolution("ALL")} className="text-[11px] text-primary hover:underline">선택 해제</button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {resolutionFilters.map((r) => (
                  <Chip key={r.id} active={resolution === r.id} onClick={() => setResolution(r.id)}>{r.label}</Chip>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/40 border border-border p-3">
                <div className="min-w-0">
                  <div className="text-xs font-medium">내 해상도와 일치하는 프리셋만 보기</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">현재 화면: {display.label}</div>
                </div>
                <Switch checked={matchOnly} onCheckedChange={setMatchOnly} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-muted-foreground">카테고리</div>
                {category !== "전체" && (
                  <button onClick={() => setCategory("전체")} className="text-[11px] text-primary hover:underline">선택 해제</button>
                )}
              </div>
              <div className="relative mb-2">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={categoryQuery}
                  onChange={(e) => setCategoryQuery(e.target.value)}
                  placeholder="카테고리 검색"
                  className="pl-8 h-8 text-xs"
                />
              </div>
              <ScrollArea className="h-48 -mx-1 px-1">
                <div className="flex flex-wrap gap-2 pb-1">
                  <Chip active={category === "전체"} onClick={() => setCategory("전체")}>전체</Chip>
                  {filteredCategories.filter((c) => c !== "전체").map((c) => (
                    <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
                  ))}
                  {filteredCategories.length === 0 && (
                    <div className="w-full text-center text-xs text-muted-foreground py-6">검색 결과가 없습니다.</div>
                  )}
                </div>
              </ScrollArea>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">스타일</div>
              <div className="text-[11px] text-muted-foreground/70">곧 제공됩니다</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">색상 / 무드</div>
              <div className="text-[11px] text-muted-foreground/70">곧 제공됩니다</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">라이선스</div>
              <div className="text-[11px] text-muted-foreground/70">곧 제공됩니다</div>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => { setPrice("전체"); setCategory("전체"); setCategoryQuery(""); setResolution("ALL"); setMatchOnly(false); }}>초기화</Button>
              <Button size="sm" onClick={() => setFilterOpen(false)}>적용</Button>
            </div>
          </PopoverContent>
        </Popover>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-40 h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            {sortOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Active filter chips */}
      <div className="flex flex-wrap items-center gap-2 min-h-0">
        {price !== "전체" && (
          <Chip active onClick={() => setPrice("전체")}>{price} ✕</Chip>
        )}
        {category !== "전체" && (
          <Chip active onClick={() => setCategory("전체")}>{category} ✕</Chip>
        )}
        {resolution !== "ALL" && (
          <Chip active onClick={() => setResolution("ALL")}>{resolution} ✕</Chip>
        )}
        {matchOnly && (
          <Chip active onClick={() => setMatchOnly(false)}>내 해상도만 ({display.label}) ✕</Chip>
        )}
      </div>

      {/* 클라우드 마켓 프리셋 */}
      {cloudMatches.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">마켓 프리셋</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {cloudMatches.map((p) => (
              <div key={p.id} className="rounded-2xl overflow-hidden bg-card border border-border shadow-card">
                <div className="aspect-[16/10] bg-muted overflow-hidden">
                  {p.thumbnailUrl ? (
                    <img src={p.thumbnailUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted to-background" />
                  )}
                </div>
                <div className="p-4 space-y-1">
                  <div className="text-sm font-semibold truncate">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    아이콘 {p.icons.length}개 · {p.created_at.slice(0, 10)}
                  </div>
                  {p.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                  )}
                  {p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {p.tags.map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {items.length === 0 ? (
        <div className="border border-dashed rounded-2xl p-16 text-center text-muted-foreground">
          {cloudMatches.length > 0
            ? "다른 상품(아이콘·팩)은 아직 없습니다."
            : marketItems.length === 0
            ? "아직 마켓에 올라온 항목이 없습니다."
            : "조건에 맞는 상품이 없습니다."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((p) => (
            <MarketItemCard
              key={p.id}
              item={p}
              wishlisted={wishlist.includes(p.id)}
              onWishlist={() => toggleWish(p.id)}
              onClick={() => setParams({ item: p.id })}
            />
          ))}
        </div>
      )}

      {openItem && (
        <MarketItemModal
          item={openItem}
          wishlisted={wishlist.includes(openItem.id)}
          onWishlist={() => toggleWish(openItem.id)}
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