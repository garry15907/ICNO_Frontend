import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Users, Upload, Download, Star, UserPlus, UserMinus, Package, Image as ImageIcon, Layers } from "lucide-react";
import {
  marketplacePresets,
  marketIcons,
  marketIconPacks,
  followedCreators,
  type MarketplacePreset,
  type MarketIcon,
  type MarketIconPack,
} from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

export default function CreatorProfile() {
  const { name = "" } = useParams();
  const nav = useNavigate();

  const presets = useMemo(
    () => marketplacePresets.filter((p) => p.creator.name === name),
    [name],
  );
  const icons = useMemo(
    () => marketIcons.filter((i) => i.creator.name === name),
    [name],
  );
  const packs = useMemo(
    () => marketIconPacks.filter((p) => p.creator.name === name),
    [name],
  );

  // 크리에이터 메타: 팔로우 목록 우선, 없으면 첫 상품에서 가져오기
  const followMeta = followedCreators.find((c) => c.name === name);
  const fallback =
    presets[0]?.creator || icons[0]?.creator || packs[0]?.creator;
  const role = followMeta?.role || fallback?.role || "크리에이터";
  const avatar = followMeta?.avatar || fallback?.avatar || "👤";

  const totalDownloads =
    presets.reduce((s, p) => s + p.downloads, 0) +
    icons.reduce((s, i) => s + i.downloads, 0) +
    packs.reduce((s, p) => s + p.downloads, 0);
  const ratedItems = [
    ...presets.map((p) => p.rating),
    ...icons.map((i) => i.rating),
    ...packs.map((p) => p.rating),
  ];
  const avgRating = ratedItems.length
    ? (ratedItems.reduce((s, r) => s + r, 0) / ratedItems.length).toFixed(2)
    : "-";
  const uploadCount = presets.length + icons.length + packs.length;
  const followerCount = followMeta?.followers ?? 0;

  const [following, setFollowing] = useState(!!followMeta);
  const toggleFollow = () => {
    setFollowing((f) => {
      toast({
        title: f ? "팔로우 해제됨" : "팔로우 시작",
        description: f
          ? `@${name} 팔로우를 해제했습니다.`
          : `@${name} 크리에이터를 팔로우합니다.`,
      });
      return !f;
    });
  };

  if (uploadCount === 0 && !followMeta) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <button
          onClick={() => nav(-1)}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ChevronLeft className="h-4 w-4" /> 뒤로 가기
        </button>
        <div className="border border-dashed rounded-2xl p-12 text-center text-muted-foreground">
          @{name} 크리에이터를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <button
        onClick={() => nav(-1)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ChevronLeft className="h-4 w-4" /> 뒤로 가기
      </button>

      <div className="p-8 rounded-2xl bg-gradient-surface border border-border">
        <div className="flex items-start gap-6">
          <div className="h-24 w-24 rounded-full bg-gradient-primary grid place-items-center text-5xl shadow-glow shrink-0">
            {avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-3xl font-bold">@{name}</h2>
              <Badge variant="secondary" className="text-[10px]">{role}</Badge>
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> 팔로워 {followerCount.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1">
                <Upload className="h-3.5 w-3.5" /> 업로드 {uploadCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <Download className="h-3.5 w-3.5" /> 총 다운로드 {totalDownloads.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-amber-500" /> 평균 ★{avgRating}
              </span>
            </div>
          </div>
          <Button
            onClick={toggleFollow}
            variant={following ? "outline" : "default"}
            className={following ? "" : "bg-gradient-primary text-primary-foreground"}
          >
            {following ? (
              <><UserMinus className="h-4 w-4 mr-1" /> 팔로잉</>
            ) : (
              <><UserPlus className="h-4 w-4 mr-1" /> 팔로우</>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="presets" className="w-full">
        <TabsList>
          <TabsTrigger value="presets" className="gap-1.5">
            <Package className="h-3.5 w-3.5" /> 프리셋 <span className="text-muted-foreground">({presets.length})</span>
          </TabsTrigger>
          <TabsTrigger value="icons" className="gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" /> 아이콘 <span className="text-muted-foreground">({icons.length})</span>
          </TabsTrigger>
          <TabsTrigger value="packs" className="gap-1.5">
            <Layers className="h-3.5 w-3.5" /> 아이콘 팩 <span className="text-muted-foreground">({packs.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="mt-6">
          {presets.length === 0 ? (
            <Empty text="등록된 프리셋이 없습니다." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {presets.map((p) => <PresetCard key={p.id} preset={p} onOpen={() => nav(`/explore?preset=${p.id}`)} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="icons" className="mt-6">
          {icons.length === 0 ? (
            <Empty text="등록된 아이콘이 없습니다." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {icons.map((i) => <IconCard key={i.id} icon={i} onOpen={() => nav(`/explore?item=${i.id}`)} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="packs" className="mt-6">
          {packs.length === 0 ? (
            <Empty text="등록된 아이콘 팩이 없습니다." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {packs.map((p) => <PackCard key={p.id} pack={p} onOpen={() => nav(`/explore?item=${p.id}`)} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PresetCard({ preset, onOpen }: { preset: MarketplacePreset; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group text-left rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-glow transition-all"
    >
      <div className="aspect-video overflow-hidden">
        <img
          src={preset.thumbnail}
          alt={preset.name}
          className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform"
        />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="font-semibold text-sm truncate">{preset.name}</div>
          <span className="text-xs font-semibold shrink-0">
            {preset.price === 0 ? "무료" : `₩${preset.price.toLocaleString()}`}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-2">
          <span>★{preset.rating}</span>
          <span>· {preset.downloads.toLocaleString()} 다운로드</span>
        </div>
      </div>
    </button>
  );
}

function IconCard({ icon, onOpen }: { icon: MarketIcon; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group text-left rounded-2xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-glow transition-all"
    >
      <div className="aspect-square rounded-xl bg-muted/40 grid place-items-center text-5xl">
        {icon.emoji}
      </div>
      <div className="mt-3">
        <div className="font-semibold text-sm truncate">{icon.name}</div>
        <div className="text-xs text-muted-foreground mt-0.5 truncate">{icon.fileType} · {icon.resolution}</div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[11px] text-muted-foreground">★{icon.rating} · {icon.downloads.toLocaleString()}</span>
          <span className="text-xs font-semibold">
            {icon.price === 0 ? "무료" : `₩${icon.price.toLocaleString()}`}
          </span>
        </div>
      </div>
    </button>
  );
}

function PackCard({ pack, onOpen }: { pack: MarketIconPack; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group text-left rounded-2xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-glow transition-all"
    >
      <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-muted/40">
        {pack.thumbnailEmojis.slice(0, 6).map((e, i) => (
          <div key={i} className="aspect-square grid place-items-center text-2xl bg-background/60 rounded-lg">{e}</div>
        ))}
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="font-semibold text-sm truncate">{pack.name}</div>
          <span className="text-xs font-semibold shrink-0">
            {pack.price === 0 ? "무료" : `₩${pack.price.toLocaleString()}`}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {pack.icons.length}종 · ★{pack.rating} · {pack.downloads.toLocaleString()} 다운로드
        </div>
      </div>
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="border border-dashed rounded-2xl p-12 text-center text-muted-foreground">{text}</div>;
}