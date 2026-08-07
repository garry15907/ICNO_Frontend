REVOKE ALL ON FUNCTION public.sync_preset_counters() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.sync_rating_counters() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.sync_follow_counters() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;