-- aggregates
ALTER TABLE public.market_presets
  ADD COLUMN IF NOT EXISTS likes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS downloads integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wishlist_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comment_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_sum integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS follower_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count integer NOT NULL DEFAULT 0;

DROP POLICY IF EXISTS market_presets_select_public ON public.market_presets;
CREATE POLICY market_presets_select_public ON public.market_presets
  FOR SELECT TO anon, authenticated
  USING ((is_public = true AND is_hidden = false) OR owner_id = auth.uid());

-- likes
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preset_id uuid NOT NULL REFERENCES public.market_presets(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, preset_id)
);
GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;
GRANT ALL ON public.likes TO service_role;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY likes_select_own ON public.likes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY likes_insert_own ON public.likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY likes_delete_own ON public.likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- wishlists
CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preset_id uuid NOT NULL REFERENCES public.market_presets(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, preset_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlists TO authenticated;
GRANT ALL ON public.wishlists TO service_role;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY wishlists_select_own ON public.wishlists FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY wishlists_insert_own ON public.wishlists FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY wishlists_delete_own ON public.wishlists FOR DELETE TO authenticated USING (user_id = auth.uid());

-- downloads
CREATE TABLE IF NOT EXISTS public.downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preset_id uuid NOT NULL REFERENCES public.market_presets(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.downloads TO authenticated;
GRANT ALL ON public.downloads TO service_role;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY downloads_select_own ON public.downloads FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY downloads_insert_own ON public.downloads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ratings
CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preset_id uuid NOT NULL REFERENCES public.market_presets(id) ON DELETE CASCADE,
  score smallint NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, preset_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ratings TO authenticated;
GRANT ALL ON public.ratings TO service_role;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY ratings_select_own ON public.ratings FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY ratings_insert_own ON public.ratings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY ratings_update_own ON public.ratings FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY ratings_delete_own ON public.ratings FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- comments
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preset_id uuid NOT NULL REFERENCES public.market_presets(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY comments_select_visible ON public.comments
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.market_presets p
    WHERE p.id = comments.preset_id
      AND ((p.is_public = true AND p.is_hidden = false) OR p.owner_id = auth.uid())
  ));
CREATE POLICY comments_insert_own ON public.comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY comments_update_own ON public.comments FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY comments_delete_own ON public.comments FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- follows
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
GRANT SELECT ON public.follows TO anon;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY follows_select_all ON public.follows FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY follows_insert_own ON public.follows FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
CREATE POLICY follows_delete_own ON public.follows FOR DELETE TO authenticated USING (follower_id = auth.uid());

-- reports
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preset_id uuid REFERENCES public.market_presets(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('spam','inappropriate','copyright','malware','other')),
  detail text CHECK (detail IS NULL OR char_length(detail) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY reports_select_own ON public.reports FOR SELECT TO authenticated USING (reporter_id = auth.uid());
CREATE POLICY reports_insert_own ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());

-- counter triggers
CREATE OR REPLACE FUNCTION public.sync_preset_counters()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE col text; delta int;
BEGIN
  col := TG_ARGV[0];
  IF TG_OP = 'INSERT' THEN delta := 1; ELSE delta := -1; END IF;
  EXECUTE format('UPDATE public.market_presets SET %I = GREATEST(%I + $1, 0) WHERE id = $2', col, col)
    USING delta, COALESCE(NEW.preset_id, OLD.preset_id);
  RETURN NULL;
END; $$;

CREATE TRIGGER likes_counter AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_preset_counters('likes');
CREATE TRIGGER wishlists_counter AFTER INSERT OR DELETE ON public.wishlists
  FOR EACH ROW EXECUTE FUNCTION public.sync_preset_counters('wishlist_count');
CREATE TRIGGER downloads_counter AFTER INSERT OR DELETE ON public.downloads
  FOR EACH ROW EXECUTE FUNCTION public.sync_preset_counters('downloads');
CREATE TRIGGER comments_counter AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.sync_preset_counters('comment_count');

CREATE OR REPLACE FUNCTION public.sync_rating_counters()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.market_presets
      SET rating_sum = rating_sum + NEW.score, rating_count = rating_count + 1
      WHERE id = NEW.preset_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.market_presets
      SET rating_sum = GREATEST(rating_sum - OLD.score + NEW.score, 0)
      WHERE id = NEW.preset_id;
  ELSE
    UPDATE public.market_presets
      SET rating_sum = GREATEST(rating_sum - OLD.score, 0),
          rating_count = GREATEST(rating_count - 1, 0)
      WHERE id = OLD.preset_id;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER ratings_counter AFTER INSERT OR UPDATE OR DELETE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.sync_rating_counters();

CREATE OR REPLACE FUNCTION public.sync_follow_counters()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSE
    UPDATE public.profiles SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.following_id;
    UPDATE public.profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER follows_counter AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.sync_follow_counters();

-- view counter RPC
CREATE OR REPLACE FUNCTION public.increment_view(p_preset_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.market_presets SET views = views + 1
  WHERE id = p_preset_id AND is_public = true AND is_hidden = false;
$$;
GRANT EXECUTE ON FUNCTION public.increment_view(uuid) TO anon, authenticated;