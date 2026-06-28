ALTER TABLE public.aaple_sarkar_applications DROP COLUMN IF EXISTS charged;
ALTER TABLE public.aaple_sarkar_applications ADD COLUMN charged NUMERIC(12,2) NOT NULL DEFAULT 0;