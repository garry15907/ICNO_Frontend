CREATE TYPE public.notification_type AS ENUM ('comment','like','download','rating','follow');

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  type public.notification_type NOT NULL,
  preset_id uuid REFERENCES public.market_presets(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated USING (recipient_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE TO authenticated USING (recipient_id = auth.uid());

CREATE INDEX notifications_recipient_idx ON public.notifications (recipient_id, created_at DESC);
CREATE INDEX notifications_unread_idx ON public.notifications (recipient_id) WHERE is_read = false;

-- preset-based notifications (comments, wishlists, downloads, ratings)
CREATE OR REPLACE FUNCTION public.notify_preset_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_type public.notification_type;
BEGIN
  v_type := TG_ARGV[0]::public.notification_type;
  SELECT owner_id INTO v_owner FROM public.market_presets WHERE id = NEW.preset_id;
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.notifications (recipient_id, actor_id, type, preset_id)
  VALUES (v_owner, NEW.user_id, v_type, NEW.preset_id);
  RETURN NULL;
END; $$;

CREATE TRIGGER notify_on_comment AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_preset_activity('comment');
CREATE TRIGGER notify_on_wishlist AFTER INSERT ON public.wishlists
  FOR EACH ROW EXECUTE FUNCTION public.notify_preset_activity('like');
CREATE TRIGGER notify_on_download AFTER INSERT ON public.downloads
  FOR EACH ROW EXECUTE FUNCTION public.notify_preset_activity('download');
CREATE TRIGGER notify_on_rating AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.notify_preset_activity('rating');

-- follow notifications
CREATE OR REPLACE FUNCTION public.notify_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.follower_id = NEW.following_id THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.notifications (recipient_id, actor_id, type)
  VALUES (NEW.following_id, NEW.follower_id, 'follow');
  RETURN NULL;
END; $$;

CREATE TRIGGER notify_on_follow AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_follow();

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;