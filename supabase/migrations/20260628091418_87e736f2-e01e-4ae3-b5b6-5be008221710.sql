
-- Site settings (single row keyed by id='global')
CREATE TABLE public.site_settings (
  id text PRIMARY KEY DEFAULT 'global',
  company_name text NOT NULL DEFAULT 'Vighnaharta Solutions',
  brand_tagline text DEFAULT 'Powered by Vighnaharta Group Limited',
  contact_email text DEFAULT 'officialworkmangesh@gmail.com',
  support_email text DEFAULT 'officialworkmangesh@gmail.com',
  phone text DEFAULT '+91-82084-12436',
  whatsapp text DEFAULT '+91-82084-12436',
  address_line1 text DEFAULT 'At Shendurwada',
  address_line2 text DEFAULT 'Tq. Gangapur',
  city text DEFAULT 'Aurangabad',
  state text DEFAULT 'Maharashtra',
  pincode text DEFAULT '431109',
  country text DEFAULT 'India',
  gst_number text,
  business_hours text DEFAULT 'Mon - Sat, 10:00 AM - 7:00 PM',
  logo_url text,
  favicon_url text,
  social jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (id = 'global')
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage site settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER site_settings_set_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.site_settings (id) VALUES ('global');

-- Editable site pages (about / privacy / terms / refund / hero / contact_intro / footer_note)
CREATE TABLE public.site_pages (
  slug text PRIMARY KEY,
  title text NOT NULL,
  meta_description text,
  content_md text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.site_pages TO anon, authenticated;
GRANT ALL ON public.site_pages TO service_role;
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read site pages" ON public.site_pages FOR SELECT USING (true);
CREATE POLICY "Admins manage site pages" ON public.site_pages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER site_pages_set_updated_at BEFORE UPDATE ON public.site_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_pages (slug, title, meta_description, content_md) VALUES
  ('about', 'About Vighnaharta Solutions',
   'Vighnaharta Solutions is a professional digital services company powered by Vighnaharta Group Limited.',
   E'## About Us\n\nVighnaharta Solutions is a professional digital services platform powered by **Vighnaharta Group Limited**, serving retailers and citizens across Maharashtra.\n\nWe provide PAN, Aadhaar, Aaple Sarkar certificates, recharges, document printing and more — all through a single secure portal.\n\n## Our Mission\n\nTo make government and utility services accessible to every village and town across India through trusted retail partners.'),
  ('privacy', 'Privacy Policy',
   'How Vighnaharta Solutions collects, uses and protects your information.',
   E'## Privacy Policy\n\nWe respect your privacy. This page explains what we collect and how it is used.\n\n### Information we collect\n- Account details (name, email, phone, business name)\n- Service inputs (document numbers you enter for verification)\n- Wallet & transaction data\n\n### How we use it\n- Deliver requested services\n- Maintain wallet ledger and receipts\n- Comply with legal obligations\n\n### Data protection\nAll data is stored on secured Indian servers and access is restricted to authorised personnel.\n\n### Contact\nFor any privacy request email **officialworkmangesh@gmail.com**.'),
  ('terms', 'Terms & Conditions',
   'Terms of use for the Vighnaharta Solutions portal.',
   E'## Terms & Conditions\n\nBy using this portal you agree to the following terms.\n\n1. You will provide accurate information for every service request.\n2. Service charges are debited from your wallet at the time of submission.\n3. Government services are processed by the respective department; delivery time is indicative.\n4. Misuse, fraud or impersonation will lead to account suspension and legal action.\n5. We reserve the right to update these terms at any time.'),
  ('refund', 'Refund Policy',
   'Refund policy for wallet top-ups and failed service requests.',
   E'## Refund Policy\n\n- **Failed service:** If a service request fails due to a technical issue at our end, the charged amount is automatically refunded to your wallet within 24 hours.\n- **Wallet top-up:** Successful wallet top-ups are non-refundable but the balance can be used for any service on the portal.\n- **Disputes:** Raise a ticket within 7 days at officialworkmangesh@gmail.com with the transaction reference.'),
  ('contact_intro', 'Contact Us',
   'Get in touch with the Vighnaharta Solutions team.',
   E'We are here to help. Reach out through any of the channels below and our team will respond within one business day.'),
  ('hero', 'Hero',
   'Homepage hero text',
   E'# Trusted partner for digital services\n\nPAN, Aadhaar, certificates, recharges & more — handled by your local Vighnaharta retailer.'),
  ('footer_note', 'Footer note', null,
   E'Vighnaharta Solutions is an authorised retail services platform powered by Vighnaharta Group Limited.');

-- Payment gateway configuration (public, non-secret fields only)
CREATE TABLE public.payment_gateways (
  provider text PRIMARY KEY,
  display_name text NOT NULL,
  mode text NOT NULL DEFAULT 'test' CHECK (mode IN ('test','live')),
  enabled boolean NOT NULL DEFAULT false,
  is_primary boolean NOT NULL DEFAULT false,
  merchant_id text,
  key_id_public text,
  webhook_url text,
  secret_key_name text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_gateways TO authenticated;
GRANT ALL ON public.payment_gateways TO service_role;
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read gateways" ON public.payment_gateways FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage gateways" ON public.payment_gateways FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER payment_gateways_set_updated_at BEFORE UPDATE ON public.payment_gateways
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.payment_gateways (provider, display_name, mode, enabled, is_primary, secret_key_name) VALUES
  ('paytm', 'Paytm', 'test', true, true, 'PAYTM_MERCHANT_KEY'),
  ('razorpay', 'Razorpay', 'test', false, false, 'RAZORPAY_KEY_SECRET'),
  ('cashfree', 'Cashfree', 'test', false, false, 'CASHFREE_SECRET_KEY');

-- Extend profiles with photo + KYC document URLs (admin manageable)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS kyc_aadhaar_url text,
  ADD COLUMN IF NOT EXISTS kyc_pan_url text,
  ADD COLUMN IF NOT EXISTS kyc_extra_url text;
