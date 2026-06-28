CREATE TABLE IF NOT EXISTS public.service_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_key text NOT NULL,
  service_label text NOT NULL,
  customer_name text,
  summary text,
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS service_drafts_user_updated_idx
  ON public.service_drafts (user_id, updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_drafts TO authenticated;
GRANT ALL ON public.service_drafts TO service_role;

ALTER TABLE public.service_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own drafts" ON public.service_drafts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own drafts" ON public.service_drafts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own drafts" ON public.service_drafts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own drafts" ON public.service_drafts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER service_drafts_set_updated_at
  BEFORE UPDATE ON public.service_drafts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
