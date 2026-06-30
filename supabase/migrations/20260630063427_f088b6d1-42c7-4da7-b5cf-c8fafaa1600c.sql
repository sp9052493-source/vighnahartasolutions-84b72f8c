
-- ============ Sequences ============
CREATE SEQUENCE IF NOT EXISTS public.gst_application_seq START 1;

-- ============ Tables ============

CREATE TABLE public.gst_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_no text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','pending','in_progress','query_raised','approved','rejected','completed','on_hold')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  applicant_name text NOT NULL,
  mobile text NOT NULL,
  email text NOT NULL,
  pan text NOT NULL,
  aadhaar_last4 text,

  business_name text NOT NULL,
  trade_name text,
  constitution text NOT NULL,
  nature_of_business text NOT NULL,
  commencement_date date,

  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  district text NOT NULL,
  state text NOT NULL,
  pin_code text NOT NULL,

  bank_account_name text,
  bank_account_no text,
  bank_ifsc text,
  bank_name text,
  bank_branch text,

  signatory_name text,
  signatory_designation text,
  signatory_pan text,
  signatory_mobile text,
  signatory_email text,

  hsn_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
  estimated_turnover numeric(14,2),
  existing_registration text,

  service_charge numeric(12,2) NOT NULL DEFAULT 0,
  govt_fee numeric(12,2) NOT NULL DEFAULT 0,
  total_charged numeric(12,2) NOT NULL DEFAULT 0,
  wallet_txn_id uuid,

  arn_no text,
  gstin text,
  certificate_path text,
  acknowledgement_path text,
  admin_remarks text,
  internal_notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX gst_apps_user_idx ON public.gst_applications(user_id);
CREATE INDEX gst_apps_status_idx ON public.gst_applications(status);
CREATE INDEX gst_apps_created_idx ON public.gst_applications(created_at DESC);
CREATE INDEX gst_apps_district_idx ON public.gst_applications(district);

GRANT SELECT, INSERT, UPDATE ON public.gst_applications TO authenticated;
GRANT ALL ON public.gst_applications TO service_role;

ALTER TABLE public.gst_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Retailers view own GST apps" ON public.gst_applications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Retailers create own GST apps" ON public.gst_applications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Retailers update own draft GST apps" ON public.gst_applications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status IN ('new','query_raised'))
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all GST apps" ON public.gst_applications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- documents ----------
CREATE TABLE public.gst_application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.gst_applications(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX gst_docs_app_idx ON public.gst_application_documents(application_id);

GRANT SELECT, INSERT, DELETE ON public.gst_application_documents TO authenticated;
GRANT ALL ON public.gst_application_documents TO service_role;

ALTER TABLE public.gst_application_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own GST docs" ON public.gst_application_documents
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.gst_applications a WHERE a.id = application_id AND a.user_id = auth.uid())
  );

CREATE POLICY "Insert own GST docs" ON public.gst_application_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.gst_applications a WHERE a.id = application_id AND a.user_id = auth.uid())
  );

CREATE POLICY "Admins delete GST docs" ON public.gst_application_documents
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ---------- events ----------
CREATE TABLE public.gst_application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.gst_applications(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_status text,
  to_status text,
  message text,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX gst_events_app_idx ON public.gst_application_events(application_id, created_at DESC);

GRANT SELECT ON public.gst_application_events TO authenticated;
GRANT ALL ON public.gst_application_events TO service_role;

ALTER TABLE public.gst_application_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own GST events" ON public.gst_application_events
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.gst_applications a WHERE a.id = application_id AND a.user_id = auth.uid())
  );

-- ---------- config ----------
CREATE TABLE public.gst_service_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_charge numeric(12,2) NOT NULL DEFAULT 499,
  govt_fee numeric(12,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  turnaround_text text NOT NULL DEFAULT '7–15 working days',
  instructions_en text NOT NULL DEFAULT '',
  instructions_mr text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.gst_service_config TO anon, authenticated;
GRANT ALL ON public.gst_service_config TO service_role;

ALTER TABLE public.gst_service_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read GST config" ON public.gst_service_config
  FOR SELECT USING (true);

CREATE POLICY "Admins update GST config" ON public.gst_service_config
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ updated_at triggers ============
CREATE TRIGGER trg_gst_apps_updated
  BEFORE UPDATE ON public.gst_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_gst_config_updated
  BEFORE UPDATE ON public.gst_service_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ Application no generator ============
CREATE OR REPLACE FUNCTION public.generate_gst_application_no()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_n bigint;
BEGIN
  v_n := nextval('public.gst_application_seq');
  RETURN 'GST-' || to_char(now(), 'YYYYMM') || '-' || lpad(v_n::text, 6, '0');
END;
$$;

-- ============ Wallet debit ============
CREATE OR REPLACE FUNCTION public.charge_gst_application(
  p_user_id uuid,
  p_app_id uuid,
  p_amount numeric
) RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance numeric(12,2);
  v_new_balance numeric(12,2);
  v_txn_id uuid;
  v_app_no text;
BEGIN
  IF p_amount < 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  SELECT application_no INTO v_app_no FROM public.gst_applications WHERE id = p_app_id AND user_id = p_user_id;
  IF v_app_no IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  IF p_amount = 0 THEN
    UPDATE public.gst_applications SET total_charged = 0 WHERE id = p_app_id;
    RETURN 0;
  END IF;

  SELECT balance INTO v_balance FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
  END IF;

  v_new_balance := v_balance - p_amount;
  UPDATE public.wallets SET balance = v_new_balance, updated_at = now() WHERE user_id = p_user_id;

  INSERT INTO public.wallet_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_user_id, -p_amount, 'debit', 'GST Registration ' || v_app_no, v_new_balance)
  RETURNING id INTO v_txn_id;

  UPDATE public.gst_applications
    SET total_charged = p_amount, wallet_txn_id = v_txn_id
    WHERE id = p_app_id;

  RETURN v_new_balance;
END;
$$;

-- ============ Seed config ============
INSERT INTO public.gst_service_config (service_charge, govt_fee, active, turnaround_text, instructions_en, instructions_mr)
VALUES (
  499, 0, true, '7–15 working days',
  E'Eligibility:\n- Businesses with turnover above the GST threshold, or those choosing voluntary registration.\n\nRequired Documents:\n- PAN of applicant / business\n- Aadhaar of applicant\n- Passport-size photograph\n- Cancelled cheque / bank passbook\n- Electricity bill of premises\n- Rent agreement or ownership proof\n- NOC from owner (if rented)\n- Business proof / partnership deed / incorporation certificate\n- Authorised signatory photo and signature\n\nProcessing Time: 7–15 working days after submission.\n\nGovernment Fee: Nil for new GST registration.\n\nImportant Notes:\n- Ensure all documents are clear and legible.\n- Email and mobile must be active for OTP verification.\n- Wrong/incomplete details may delay processing.',
  E'पात्रता:\n- जीएसटी मर्यादेपेक्षा जास्त उलाढाल असलेले व्यवसाय किंवा स्वेच्छेने नोंदणी करणारे.\n\nआवश्यक कागदपत्रे:\n- पॅन, आधार, फोटो, रद्द केलेला धनादेश, वीज बिल, भाडे करार / NOC, व्यवसाय पुरावा, स्वाक्षरी.\n\nप्रक्रिया वेळ: ७–१५ कार्यालयीन दिवस.\n\nशासकीय शुल्क: नवीन जीएसटी नोंदणीसाठी कोणतेही शुल्क नाही.'
);
