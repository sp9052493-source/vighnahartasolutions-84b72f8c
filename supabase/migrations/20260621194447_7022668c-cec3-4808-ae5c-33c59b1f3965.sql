-- ===== Roles =====
CREATE TYPE public.app_role AS ENUM ('admin', 'distributor', 'retailer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid()
  ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'distributor' THEN 2 ELSE 3 END
  LIMIT 1
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== Profiles =====
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text,
  business_name text,
  status text NOT NULL DEFAULT 'active',
  parent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Distributors can view their retailers" ON public.profiles
  FOR SELECT TO authenticated USING (parent_id = auth.uid());

-- ===== Wallets =====
CREATE TABLE public.wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric(12,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet" ON public.wallets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all wallets" ON public.wallets
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ===== Wallet transactions =====
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  type text NOT NULL,
  description text,
  balance_after numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON public.wallet_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ===== Services =====
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'document',
  price numeric(10,2) NOT NULL DEFAULT 0,
  retailer_commission numeric(10,2) NOT NULL DEFAULT 0,
  distributor_commission numeric(10,2) NOT NULL DEFAULT 0,
  input_label text NOT NULL DEFAULT 'Number',
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can view active services" ON public.services
  FOR SELECT TO authenticated USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage services" ON public.services
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== Document requests =====
CREATE TABLE public.document_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id),
  service_name text NOT NULL,
  input_value text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  result_data jsonb,
  document_url text,
  cost numeric(10,2) NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_requests TO authenticated;
GRANT ALL ON public.document_requests TO service_role;
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests" ON public.document_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all requests" ON public.document_requests
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ===== New-user trigger: profile + wallet + bootstrap admin =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, business_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'business_name'
  );

  INSERT INTO public.wallets (user_id, balance) VALUES (NEW.id, 0);

  SELECT count(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'retailer'));
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== updated_at helper =====
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== Seed services =====
INSERT INTO public.services (code, name, description, price, retailer_commission, distributor_commission, input_label, sort_order) VALUES
  ('DL',       'Driving License',  'Fetch and download Driving License details as PDF.', 30, 10, 5, 'Driving License Number', 1),
  ('PAN',      'PAN Card',         'Fetch and download PAN Card details as PDF.',        25, 8,  4, 'PAN Number',             2),
  ('AADHAAR',  'Aadhaar',          'Fetch and download Aadhaar verification as PDF.',    20, 6,  3, 'Aadhaar Number',         3),
  ('VOTER',    'Voter ID',         'Fetch and download Voter ID details as PDF.',        20, 6,  3, 'Voter ID (EPIC) Number', 4),
  ('PASSPORT', 'Passport',         'Fetch and download Passport status as PDF.',         40, 12, 6, 'Passport File Number',   5);