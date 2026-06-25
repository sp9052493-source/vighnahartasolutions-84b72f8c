
CREATE TYPE public.application_status AS ENUM ('submitted','under_review','approved','rejected','completed');

CREATE TABLE public.aaple_sarkar_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  service_label text NOT NULL,
  applicant_name text NOT NULL,
  applicant_name_mr text,
  father_name text,
  mobile text NOT NULL,
  email text,
  address text NOT NULL,
  district text,
  taluka text,
  pincode text,
  purpose text,
  notes text,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  status public.application_status NOT NULL DEFAULT 'submitted',
  admin_remarks text,
  result_doc_url text,
  cost numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.aaple_sarkar_applications TO authenticated;
GRANT ALL ON public.aaple_sarkar_applications TO service_role;

ALTER TABLE public.aaple_sarkar_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own or admin views all"
ON public.aaple_sarkar_applications FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own applications"
ON public.aaple_sarkar_applications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins update applications"
ON public.aaple_sarkar_applications FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_aaple_sarkar_user ON public.aaple_sarkar_applications(user_id);
CREATE INDEX idx_aaple_sarkar_status ON public.aaple_sarkar_applications(status);

CREATE TRIGGER set_aaple_sarkar_updated_at
BEFORE UPDATE ON public.aaple_sarkar_applications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
