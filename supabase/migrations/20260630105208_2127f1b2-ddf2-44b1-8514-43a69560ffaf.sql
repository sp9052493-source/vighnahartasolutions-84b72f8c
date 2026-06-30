-- Udyam Aadhaar Registration module

-- Enum
DO $$ BEGIN
  CREATE TYPE public.udyam_status AS ENUM (
    'draft','submitted','payment_received','documents_verified','processing','approved','rejected','completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Application sequence + number generator
CREATE SEQUENCE IF NOT EXISTS public.udyam_application_seq;

CREATE OR REPLACE FUNCTION public.generate_udyam_application_no()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_n bigint;
BEGIN
  v_n := nextval('public.udyam_application_seq');
  RETURN 'UDYAM-' || to_char(now(), 'YYYYMM') || '-' || lpad(v_n::text, 6, '0');
END; $$;

-- Main applications table
CREATE TABLE IF NOT EXISTS public.udyam_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_no text UNIQUE NOT NULL DEFAULT public.generate_udyam_application_no(),
  status public.udyam_status NOT NULL DEFAULT 'draft',

  -- personal
  aadhaar_number text,
  pan_number text,
  name_as_aadhaar text,
  name_as_pan text,
  dob date,
  mobile text,
  email text,
  gender text,
  category text,

  -- business
  business_name text,
  business_type text,
  business_start_date date,
  business_address text,
  state text,
  district text,
  city text,
  village text,
  pincode text,
  investment_amount numeric(14,2),
  annual_turnover numeric(14,2),
  gst_available boolean DEFAULT false,
  gst_number text,

  -- bank
  bank_name text,
  ifsc text,
  account_number text,

  -- employees
  employees_male int DEFAULT 0,
  employees_female int DEFAULT 0,
  employees_other int DEFAULT 0,

  -- workflow
  remarks text,
  certificate_url text,
  acknowledgement_url text,
  total_charged numeric(12,2) DEFAULT 0,
  wallet_txn_id uuid,

  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.udyam_applications TO authenticated;
GRANT ALL ON public.udyam_applications TO service_role;

ALTER TABLE public.udyam_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "udyam own select" ON public.udyam_applications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "udyam own insert" ON public.udyam_applications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "udyam own update" ON public.udyam_applications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "udyam admin delete" ON public.udyam_applications
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER udyam_apps_updated_at BEFORE UPDATE ON public.udyam_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Documents
CREATE TABLE IF NOT EXISTS public.udyam_application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.udyam_applications(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.udyam_application_documents TO authenticated;
GRANT ALL ON public.udyam_application_documents TO service_role;

ALTER TABLE public.udyam_application_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "udyam doc select" ON public.udyam_application_documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.udyam_applications a
            WHERE a.id = application_id
              AND (a.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
  );

CREATE POLICY "udyam doc insert" ON public.udyam_application_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.udyam_applications a
            WHERE a.id = application_id
              AND (a.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
  );

CREATE POLICY "udyam doc delete" ON public.udyam_application_documents
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.udyam_applications a
            WHERE a.id = application_id
              AND (a.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
  );

-- Events / activity log
CREATE TABLE IF NOT EXISTS public.udyam_application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.udyam_applications(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id),
  actor_role text,
  event_type text NOT NULL,
  from_status public.udyam_status,
  to_status public.udyam_status,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.udyam_application_events TO authenticated;
GRANT ALL ON public.udyam_application_events TO service_role;

ALTER TABLE public.udyam_application_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "udyam event select" ON public.udyam_application_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.udyam_applications a
            WHERE a.id = application_id
              AND (a.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
  );

CREATE POLICY "udyam event insert" ON public.udyam_application_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.udyam_applications a
            WHERE a.id = application_id
              AND (a.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
  );

-- Wallet charge RPC (mirrors charge_gst_application)
CREATE OR REPLACE FUNCTION public.charge_udyam_application(p_user_id uuid, p_app_id uuid, p_amount numeric)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_balance numeric(12,2);
  v_new_balance numeric(12,2);
  v_txn_id uuid;
  v_app_no text;
BEGIN
  IF p_amount < 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;

  SELECT application_no INTO v_app_no FROM public.udyam_applications
    WHERE id = p_app_id AND user_id = p_user_id;
  IF v_app_no IS NULL THEN RAISE EXCEPTION 'Application not found'; END IF;

  IF p_amount = 0 THEN
    UPDATE public.udyam_applications SET total_charged = 0 WHERE id = p_app_id;
    RETURN 0;
  END IF;

  SELECT balance INTO v_balance FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Wallet not found'; END IF;
  IF v_balance < p_amount THEN RAISE EXCEPTION 'INSUFFICIENT_BALANCE'; END IF;

  v_new_balance := v_balance - p_amount;
  UPDATE public.wallets SET balance = v_new_balance, updated_at = now() WHERE user_id = p_user_id;

  INSERT INTO public.wallet_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_user_id, -p_amount, 'debit', 'Udyam Registration ' || v_app_no, v_new_balance)
  RETURNING id INTO v_txn_id;

  UPDATE public.udyam_applications
    SET total_charged = p_amount, wallet_txn_id = v_txn_id
    WHERE id = p_app_id;

  RETURN v_new_balance;
END; $$;

-- Realtime publication for retailer live status
ALTER PUBLICATION supabase_realtime ADD TABLE public.udyam_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.udyam_application_events;

-- Seed service row so it appears in service grid + pricing system
INSERT INTO public.services (code, name, category, price, distributor_commission, active, api_enabled, description)
VALUES ('UDYAM', 'Udyam Aadhaar Registration', 'Registration', 299, 30, true, false,
        'MSME Udyam Aadhaar registration with end-to-end document processing.')
ON CONFLICT (code) DO NOTHING;
