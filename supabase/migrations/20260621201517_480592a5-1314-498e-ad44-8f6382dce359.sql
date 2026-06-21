ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS api_provider text NOT NULL DEFAULT 'demo',
  ADD COLUMN IF NOT EXISTS api_endpoint text,
  ADD COLUMN IF NOT EXISTS api_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS api_notes text;