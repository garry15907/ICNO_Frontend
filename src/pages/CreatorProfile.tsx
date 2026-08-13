import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Users, Upload, Download, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useMarketPresets,
  presetAverageRating,
  type MarketPresetRow,
} from "@/lib/market-presets";
import { MarketPresetCard } from "@/components/presets/MarketPresetCard";
import { MarketPresetModal } from "@/components/presets/MarketPresetModal";
import { FollowButton } from "@/components/presets/FollowButton";

type CreatorProfileRow = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  follower_count: number | null;
  bio: string | null;
};

export default function CreatorProfile() {
  const { name = "" } = useParams();
  const nav = useNavigate();

  const [profile, setProfile] = useState<CreatorProfileRow | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [open, setOpen] = useState<MarketPresetRow | null>(null);

  // 라우트 파라미터(name = display_name 또는 username)로 프로필 조회
  useEffect(() => {
    let alive = true;
    setLoadingProfile(true);
    const cols = "id, display_name, username, avatar_url, follower_count, bio";
    (async () => {
      let row: CreatorProfileRow | null = null;
      const byName = await supabase.from("profiles").select(cols).eq("display_name", name).limit(1);
      row = (byName.data?.[0] as CreatorProfileRow) ?? null;
      if (!row) {
        const byUser = await supabase.from("profiles").select(cols).eq("username", name).limit(1);
        row = (byUser.data?.[0] as CreatorProfileRow) ?? null;
      }
      if (alive) {
        setProfile(row);
        setLoadingProfile(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [name]);

  const { presets: allPresets } = useMarketPresets();
  const presets = useMemo(
    () => (profile ? allPresets.filter((p) => p.owner_id === profile.id) : []),
    [allPresets, profile],
  );

  const displayName = profile?.display_name || profile?.username || name;
  const handle = profile?.username ? `@${profile.username}` : null;
  const initial = displayName.slice(0, 1).toUpperCase();
  const followerCount = profile?.follower_count ?? 0;
  const uploadCount = presets.length;
  const totalDownloads = presets.reduce((s, p) => s + (p.downloads ?? 0), 0);
  const ratingSum = presets.reduce((s, p) => s + (p.rating_sum ?? 0), 0);
  const ratingCount = presets.reduce((s, p) => s + (p.rating_count ?? 0), 0);
  const avgRating = ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : "-";

  const Back = (
    <button
      onClick={() => nav(-1)}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
    >
      <ChevronLeft className="h-4 w-4" /> 뒤로 가기
    </button>
  );

  if (!loadingProfile && !profile) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        {Back}
        <div className="border border-dashed rounded-2xl p-12 text-center text-muted-foreground">
          '{name}' 크리에이터를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {Back}

      {/* 프로필 헤더 */}
      <div className="p-8 rounded-2xl bg-gradient-surface border border-border">
        <div className="flex items-start gap-6">
          <div className="h-24 w-24 rounded-full bg-gradient-primary grid place-items-center text-4xl font-bold text-white shadow-glow shrink-0 overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-bold truncate">{displayName}</h2>
            {handle && <div className="text-sm text-muted-foreground mt-0.5">{handle}</div>}
            {profile?.bio && (
              <p className="text-sm text-foreground/80 mt-2 whitespace-pre-wrap">{profile.bio}</p>
            )}
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
          <FollowButton userId={profile?.id} size="default" />
        </div>
      </div>

      {/* 프리셋 그리드 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          프리셋 <span className="text-muted-foreground text-sm">({presets.length})</span>
        </h3>
        {presets.length === 0 ? (
          <div className="border border-dashed rounded-2xl p-12 text-center text-muted-foreground">
            등록된 프리셋이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {presets.map((p) => (
              <MarketPresetCard key={p.id} preset={p} onClick={() => setOpen(p)} />
            ))}
          </div>
        )}
      </div>

      {open && <MarketPresetModal preset={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
