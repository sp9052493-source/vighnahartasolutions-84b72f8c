
-- =============================================================
-- Shop Act + Food License (FSSAI) Registration Modules
-- Mirrors the existing Udyam Registration pattern
-- =============================================================

-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.shopact_status AS ENUM (
    'draft','submitted','payment_received','documents_verified','processing',
    'need_more_documents','approved','rejected','completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.fssai_status AS ENUM (
    'draft','submitted','payment_received','documents_verified','processing',
    'need_more_documents','approved','rejected','completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ SEQUENCES + APP NUMBER GENERATORS ============
CREATE SEQUENCE IF NOT EXISTS public.shopact_application_seq;
CREATE SEQUENCE IF NOT EXISTS public.fssai_application_seq;

CREATE OR REPLACE FUNCTION public.generate_shopact_application_no()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_n bigint;
BEGIN
  v_n := nextval('public.shopact_application_seq');
  RETURN 'SHOPACT-' || to_char(now(),'YYYY') || '-' || lpad(v_n::text, 6, '0');
END; $$;

CREATE OR REPLACE FUNCTION public.generate_fssai_application_no()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_n bigint;
BEGIN
  v_n := nextval('public.fssai_application_seq');
  RETURN 'FSSAI-' || to_char(now(),'YYYY') || '-' || lpad(v_n::text, 6, '0');
END; $$;

-- ============ SHOP ACT APPLICATIONS ============
CREATE TABLE IF NOT EXISTS public.shopact_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_no text UNIQUE NOT NULL DEFAULT public.generate_shopact_application_no(),
  status public.shopact_status NOT NULL DEFAULT 'draft',

  -- Owner
  owner_name text,
  father_name text,
  dob date,
  gender text,
  mobile text,
  email text,
  aadhaar_number text,
  pan_number text,

  -- Residential address
  res_address text,
  res_city text,
  res_district text,
  res_state text,
  res_pincode text,

  -- Business
  business_name text,
  business_type text,
  business_nature text,
  business_start_date date,
  business_address text,
  business_city text,
  business_district text,
  business_state text,
  business_pincode text,

  -- Employees
  employees_male int DEFAULT 0,
  employees_female int DEFAULT 0,
  employees_other int DEFAULT 0,

  -- Workflow
  remarks text,
  certificate_url text,
  total_charged numeric(12,2) DEFAULT 0,
  wallet_txn_id uuid,

  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shopact_apps_user_idx ON public.shopact_applications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS shopact_apps_status_idx ON public.shopact_applications(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopact_applications TO authenticated;
GRANT ALL ON public.shopact_applications TO service_role;

ALTER TABLE public.shopact_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shopact own select" ON public.shopact_applications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "shopact own insert" ON public.shopact_applications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "shopact own update" ON public.shopact_applications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "shopact admin delete" ON public.shopact_applications
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER shopact_apps_updated_at BEFORE UPDATE ON public.shopact_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SHOP ACT DOCUMENTS ============
CREATE TABLE IF NOT EXISTS public.shopact_application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.shopact_applications(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopact_application_documents TO authenticated;
GRANT ALL ON public.shopact_application_documents TO service_role;
ALTER TABLE public.shopact_application_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shopact doc select" ON public.shopact_application_documents
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.shopact_applications a WHERE a.id = application_id
      AND (a.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "shopact doc insert" ON public.shopact_application_documents
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.shopact_applications a WHERE a.id = application_id
      AND (a.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "shopact doc delete" ON public.shopact_application_documents
  FOR DELETE TO authenticated USING (EXISTS (
    SELECT 1 FROM public.shopact_applications a WHERE a.id = application_id
      AND (a.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

-- ============ SHOP ACT EVENTS ============
CREATE TABLE IF NOT EXISTS public.shopact_application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.shopact_applications(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id),
  actor_role text,
  event_type text NOT NULL,
  from_status public.shopact_status,
  to_status public.shopact_status,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.shopact_application_events TO authenticated;
GRANT ALL ON public.shopact_application_events TO service_role;
ALTER TABLE public.shopact_application_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shopact event select" ON public.shopact_application_events
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.shopact_applications a WHERE a.id = application_id
      AND (a.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "shopact event insert" ON public.shopact_application_events
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.shopact_applications a WHERE a.id = application_id
      AND (a.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

-- ============ SHOP ACT SERVICE CONFIG ============
CREATE TABLE IF NOT EXISTS public.shopact_service_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price numeric(12,2) NOT NULL DEFAULT 499,
  distributor_commission numeric(12,2) NOT NULL DEFAULT 50,
  instructions text DEFAULT 'Provide accurate business and owner details. Keep all documents ready in PDF/JPG (max 2 MB each).',
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shopact_service_config TO authenticated;
GRANT ALL ON public.shopact_service_config TO service_role;
ALTER TABLE public.shopact_service_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shopact cfg read" ON public.shopact_service_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "shopact cfg admin write" ON public.shopact_service_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.shopact_service_config (price, distributor_commission) VALUES (499, 50)
  ON CONFLICT DO NOTHING;

-- ============ SHOP ACT WALLET CHARGE RPC ============
CREATE OR REPLACE FUNCTION public.charge_shopact_application(p_user_id uuid, p_app_id uuid, p_amount numeric)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_balance numeric(12,2); v_new_balance numeric(12,2); v_txn_id uuid; v_app_no text;
BEGIN
  IF p_amount < 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  SELECT application_no INTO v_app_no FROM public.shopact_applications WHERE id = p_app_id AND user_id = p_user_id;
  IF v_app_no IS NULL THEN RAISE EXCEPTION 'Application not found'; END IF;
  IF p_amount = 0 THEN
    UPDATE public.shopact_applications SET total_charged = 0 WHERE id = p_app_id;
    RETURN 0;
  END IF;
  SELECT balance INTO v_balance FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Wallet not found'; END IF;
  IF v_balance < p_amount THEN RAISE EXCEPTION 'INSUFFICIENT_BALANCE'; END IF;
  v_new_balance := v_balance - p_amount;
  UPDATE public.wallets SET balance = v_new_balance, updated_at = now() WHERE user_id = p_user_id;
  INSERT INTO public.wallet_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_user_id, -p_amount, 'debit', 'Shop Act Registration ' || v_app_no, v_new_balance)
  RETURNING id INTO v_txn_id;
  UPDATE public.shopact_applications SET total_charged = p_amount, wallet_txn_id = v_txn_id WHERE id = p_app_id;
  RETURN v_new_balance;
END; $$;

-- ============ FSSAI APPLICATIONS ============
CREATE TABLE IF NOT EXISTS public.fssai_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_no text UNIQUE NOT NULL DEFAULT public.generate_fssai_application_no(),
  status public.fssai_status NOT NULL DEFAULT 'draft',

  -- Personal
  applicant_name text,
  father_name text,
  dob date,
  gender text,
  mobile text,
  email text,
  aadhaar_number text,
  pan_number text,

  -- Business
  business_name text,
  business_type text,
  food_category text,
  license_type text, -- Basic / State / Central
  validity_years int DEFAULT 1,

  -- Business address
  business_address text,
  business_city text,
  business_district text,
  business_state text,
  business_pincode text,

  -- Workflow
  remarks text,
  certificate_url text,
  total_charged numeric(12,2) DEFAULT 0,
  wallet_txn_id uuid,

  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fssai_apps_user_idx ON public.fssai_applications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS fssai_apps_status_idx ON public.fssai_applications(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fssai_applications TO authenticated;
GRANT ALL ON public.fssai_applications TO service_role;
ALTER TABLE public.fssai_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fssai own select" ON public.fssai_applications
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "fssai own insert" ON public.fssai_applications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "fssai own update" ON public.fssai_applications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "fssai admin delete" ON public.fssai_applications
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER fssai_apps_updated_at BEFORE UPDATE ON public.fssai_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ FSSAI DOCUMENTS ============
CREATE TABLE IF NOT EXISTS public.fssai_application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.fssai_applications(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fssai_application_documents TO authenticated;
GRANT ALL ON public.fssai_application_documents TO service_role;
ALTER TABLE public.fssai_application_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fssai doc select" ON public.fssai_application_documents
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.fssai_applications a WHERE a.id = application_id
      AND (a.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "fssai doc insert" ON public.fssai_application_documents
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.fssai_applications a WHERE a.id = application_id
      AND (a.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "fssai doc delete" ON public.fssai_application_documents
  FOR DELETE TO authenticated USING (EXISTS (
    SELECT 1 FROM public.fssai_applications a WHERE a.id = application_id
      AND (a.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

-- ============ FSSAI EVENTS ============
CREATE TABLE IF NOT EXISTS public.fssai_application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.fssai_applications(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id),
  actor_role text,
  event_type text NOT NULL,
  from_status public.fssai_status,
  to_status public.fssai_status,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.fssai_application_events TO authenticated;
GRANT ALL ON public.fssai_application_events TO service_role;
ALTER TABLE public.fssai_application_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fssai event select" ON public.fssai_application_events
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.fssai_applications a WHERE a.id = application_id
      AND (a.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "fssai event insert" ON public.fssai_application_events
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.fssai_applications a WHERE a.id = application_id
      AND (a.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

-- ============ FSSAI SERVICE CONFIG ============
CREATE TABLE IF NOT EXISTS public.fssai_service_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  basic_price numeric(12,2) NOT NULL DEFAULT 699,
  state_price numeric(12,2) NOT NULL DEFAULT 2499,
  central_price numeric(12,2) NOT NULL DEFAULT 6499,
  distributor_commission numeric(12,2) NOT NULL DEFAULT 75,
  instructions text DEFAULT 'Select correct license type (Basic, State, Central) based on annual turnover. Keep KYC and business documents ready.',
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fssai_service_config TO authenticated;
GRANT ALL ON public.fssai_service_config TO service_role;
ALTER TABLE public.fssai_service_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fssai cfg read" ON public.fssai_service_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "fssai cfg admin write" ON public.fssai_service_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.fssai_service_config DEFAULT VALUES ON CONFLICT DO NOTHING;

-- ============ FSSAI WALLET CHARGE RPC ============
CREATE OR REPLACE FUNCTION public.charge_fssai_application(p_user_id uuid, p_app_id uuid, p_amount numeric)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_balance numeric(12,2); v_new_balance numeric(12,2); v_txn_id uuid; v_app_no text;
BEGIN
  IF p_amount < 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  SELECT application_no INTO v_app_no FROM public.fssai_applications WHERE id = p_app_id AND user_id = p_user_id;
  IF v_app_no IS NULL THEN RAISE EXCEPTION 'Application not found'; END IF;
  IF p_amount = 0 THEN
    UPDATE public.fssai_applications SET total_charged = 0 WHERE id = p_app_id;
    RETURN 0;
  END IF;
  SELECT balance INTO v_balance FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Wallet not found'; END IF;
  IF v_balance < p_amount THEN RAISE EXCEPTION 'INSUFFICIENT_BALANCE'; END IF;
  v_new_balance := v_balance - p_amount;
  UPDATE public.wallets SET balance = v_new_balance, updated_at = now() WHERE user_id = p_user_id;
  INSERT INTO public.wallet_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_user_id, -p_amount, 'debit', 'FSSAI Registration ' || v_app_no, v_new_balance)
  RETURNING id INTO v_txn_id;
  UPDATE public.fssai_applications SET total_charged = p_amount, wallet_txn_id = v_txn_id WHERE id = p_app_id;
  RETURN v_new_balance;
END; $$;

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopact_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopact_application_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fssai_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fssai_application_events;

-- ============ SEED SERVICE ROWS ============
INSERT INTO public.services (code, name, category, price, distributor_commission, active, api_enabled, description)
VALUES ('SHOPACT', 'Shop Act Registration', 'Registration', 499, 50, true, false,
        'Shop & Establishment Act (Gumasta) registration with end-to-end document processing.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.services (code, name, category, price, distributor_commission, active, api_enabled, description)
VALUES ('FSSAI', 'Food License (FSSAI) Registration', 'Registration', 699, 75, true, false,
        'FSSAI Food License registration — Basic / State / Central with document processing.')
ON CONFLICT (code) DO NOTHING;
