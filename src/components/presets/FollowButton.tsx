import { useEffect, useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMarketSocial } from "@/lib/market-social";

/** Follow / unfollow toggle. Hidden when the target is the signed-in user. */
export function FollowButton({
  userId,
  size = "sm",
  className,
}: {
  userId: string | null | undefined;
  size?: "sm" | "default";
  className?: string;
}) {
  const { isFollowing, toggleFollow } = useMarketSocial();
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  if (!userId || (me && me === userId)) return null;
  const following = isFollowing(userId);

  return (
    <Button
      size={size}
      variant={following ? "outline" : "default"}
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        void toggleFollow(userId);
      }}
    >
      {following ? (
        <>
          <UserCheck className="h-3.5 w-3.5 mr-1.5" />팔로잉
        </>
      ) : (
        <>
          <UserPlus className="h-3.5 w-3.5 mr-1.5" />팔로우
        </>
      )}
    </Button>
  );
}