CREATE TABLE public.market_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 500),
  tags TEXT[] NOT NULL DEFAULT '{}',
  wallpaper_path TEXT,
  canvas JSONB NOT NULL DEFAULT '{"w":1920,"h":1080}'::jsonb,
  icons JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_presets TO authenticated;
GRANT SELECT ON public.market_presets TO anon;
GRANT ALL ON public.market_presets TO service_role;

ALTER TABLE public.market_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "market_presets_select_public" ON public.market_presets
  FOR SELECT TO anon, authenticated
  USING (is_public = true OR owner_id = auth.uid());

CREATE POLICY "market_presets_insert" ON public.market_presets
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "market_presets_update_own" ON public.market_presets
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "market_presets_delete_own" ON public.market_presets
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE INDEX market_presets_owner_idx ON public.market_presets (owner_id);
CREATE INDEX market_presets_public_created_idx ON public.market_presets (created_at DESC) WHERE is_public;

CREATE TRIGGER update_market_presets_updated_at
  BEFORE UPDATE ON public.market_presets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();