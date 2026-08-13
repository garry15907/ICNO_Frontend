import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FollowButton } from "@/components/presets/FollowButton";

type CreatorRow = {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  follower_count: number | null;
};

/**
 * 마켓 상세의 제작자 표시 카드.
 * profiles(display_name / username / avatar_url / follower_count)를 조회해
 * 아바타 + 이름 + @핸들 + 팔로워 수 + 팔로우 버튼을 보여준다.
 * 아바타는 avatar_url 이 있으면 이미지, 없으면 이름 첫 글자 이니셜(퍼플 배경).
 */
export function CreatorCard({ userId }: { userId: string | null | undefined }) {
  const nav = useNavigate();
  const [p, setP] = useState<CreatorRow | null>(null);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    void supabase
      .from("profiles")
      .select("display_name, username, avatar_url, follower_count")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (alive) setP((data as CreatorRow) ?? null);
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  const name = p?.display_name || p?.username || "크리에이터";
  const handle = p?.username ? `@${p.username}` : null;
  const followers = p?.follower_count ?? 0;
  const initial = name.slice(0, 1).toUpperCase();
  const hasProfile = !!(p?.display_name || p?.username);

  const goProfile = () => {
    if (hasProfile) nav(`/creator/${encodeURIComponent(name)}`);
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-3">
      <button
        type="button"
        onClick={goProfile}
        className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label={`${name} 프로필 보기`}
      >
        <div className="h-11 w-11 rounded-full bg-gradient-primary grid place-items-center text-base font-semibold text-white overflow-hidden">
          {p?.avatar_url ? (
            <img src={p.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            initial
          )}
        </div>
      </button>

      <button
        type="button"
        onClick={goProfile}
        className="min-w-0 flex-1 text-left focus:outline-none"
      >
        <div className="font-semibold text-sm truncate">{name}</div>
        {handle && <div className="text-xs text-muted-foreground truncate">{handle}</div>}
        <div className="text-xs text-muted-foreground">
          팔로워 {followers.toLocaleString()}
        </div>
      </button>

      <FollowButton userId={userId} />
    </div>
  );
}
