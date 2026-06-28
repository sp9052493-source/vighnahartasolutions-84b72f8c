
-- Aaple Sarkar service catalog (admin-managed)
CREATE TABLE IF NOT EXISTS public.aaple_sarkar_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_mr text NOT NULL,
  desc_en text NOT NULL DEFAULT '',
  desc_mr text NOT NULL DEFAULT '',
  tone text NOT NULL DEFAULT 'from-[oklch(0.55_0.15_255)] to-[oklch(0.4_0.12_265)]',
  price numeric(10,2) NOT NULL DEFAULT 0,
  extra_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  required_docs jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.aaple_sarkar_services TO authenticated;
GRANT ALL  ON public.aaple_sarkar_services TO service_role;

ALTER TABLE public.aaple_sarkar_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth read sarkar services" ON public.aaple_sarkar_services;
CREATE POLICY "auth read sarkar services" ON public.aaple_sarkar_services
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin manage sarkar services" ON public.aaple_sarkar_services;
CREATE POLICY "admin manage sarkar services" ON public.aaple_sarkar_services
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_aaple_sarkar_services_updated ON public.aaple_sarkar_services;
CREATE TRIGGER trg_aaple_sarkar_services_updated
  BEFORE UPDATE ON public.aaple_sarkar_services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed catalog from current hardcoded list (idempotent)
INSERT INTO public.aaple_sarkar_services (type, name_en, name_mr, desc_en, desc_mr, tone, price, extra_fields, required_docs, sort_order) VALUES
('income','Income Certificate','उत्पन्न प्रमाणपत्र','Certificate of annual income from the Revenue Department.','महसूल विभागाकडून वार्षिक उत्पन्नाचे प्रमाणपत्र.','from-[oklch(0.55_0.15_255)] to-[oklch(0.4_0.12_265)]',50,
 '[{"key":"annualIncome","en":"Annual Income (₹)","mr":"वार्षिक उत्पन्न (₹)","type":"number","required":true},{"key":"occupation","en":"Occupation","mr":"व्यवसाय","required":true}]'::jsonb,
 '[{"id":"aadhaar","en":"Aadhaar Card","mr":"आधार कार्ड","required":true},{"id":"photo","en":"Passport Size Photo","mr":"पासपोर्ट आकाराचा फोटो","required":true},{"id":"ration","en":"Ration Card","mr":"रेशन कार्ड"},{"id":"income_proof","en":"Income Proof / Salary Slip","mr":"उत्पन्नाचा पुरावा / पगार स्लिप","required":true},{"id":"talathi","en":"Talathi Report","mr":"तलाठी अहवाल"}]'::jsonb,10),
('domicile','Domicile Certificate','अधिवास प्रमाणपत्र','Proof of permanent residence in Maharashtra.','महाराष्ट्रातील कायमस्वरूपी रहिवासाचा पुरावा.','from-[oklch(0.6_0.15_155)] to-[oklch(0.5_0.13_160)]',60,
 '[{"key":"yearsOfResidence","en":"Years of Residence in Maharashtra","mr":"महाराष्ट्रातील वास्तव्य (वर्षे)","type":"number","required":true},{"key":"birthPlace","en":"Place of Birth","mr":"जन्मस्थान","required":true}]'::jsonb,
 '[{"id":"aadhaar","en":"Aadhaar Card","mr":"आधार कार्ड","required":true},{"id":"photo","en":"Passport Size Photo","mr":"पासपोर्ट आकाराचा फोटो","required":true},{"id":"ration","en":"Ration Card","mr":"रेशन कार्ड"},{"id":"school_leaving","en":"School Leaving Certificate","mr":"शाळा सोडल्याचा दाखला","required":true},{"id":"electricity","en":"Electricity / Property Bill","mr":"वीज / मालमत्ता बिल"}]'::jsonb,20),
('caste','Caste Certificate','जात प्रमाणपत्र','SC / ST / OBC / VJNT caste certificate.','अनुसूचित जाती / जमाती / ओबीसी / वि.जा.भ.ज. जात प्रमाणपत्र.','from-[oklch(0.7_0.16_55)] to-[oklch(0.62_0.16_45)]',80,
 '[{"key":"caste","en":"Caste","mr":"जात","required":true},{"key":"subCaste","en":"Sub-Caste","mr":"पोट जात"},{"key":"religion","en":"Religion","mr":"धर्म","required":true}]'::jsonb,
 '[{"id":"aadhaar","en":"Aadhaar Card","mr":"आधार कार्ड","required":true},{"id":"photo","en":"Passport Size Photo","mr":"पासपोर्ट आकाराचा फोटो","required":true},{"id":"ration","en":"Ration Card","mr":"रेशन कार्ड"},{"id":"father_caste","en":"Father''s Caste Certificate / Proof","mr":"वडिलांचे जात प्रमाणपत्र / पुरावा","required":true},{"id":"school_leaving","en":"School Leaving Certificate","mr":"शाळा सोडल्याचा दाखला","required":true}]'::jsonb,30),
('age_nationality_domicile','Age, Nationality & Domicile','वय, राष्ट्रीयत्व व अधिवास','Combined age, nationality and domicile certificate.','वय, राष्ट्रीयत्व व अधिवास यांचे एकत्रित प्रमाणपत्र.','from-[oklch(0.58_0.18_25)] to-[oklch(0.5_0.16_20)]',70,
 '[{"key":"dob","en":"Date of Birth","mr":"जन्म दिनांक","required":true},{"key":"birthPlace","en":"Place of Birth","mr":"जन्मस्थान","required":true}]'::jsonb,
 '[{"id":"aadhaar","en":"Aadhaar Card","mr":"आधार कार्ड","required":true},{"id":"photo","en":"Passport Size Photo","mr":"पासपोर्ट आकाराचा फोटो","required":true},{"id":"ration","en":"Ration Card","mr":"रेशन कार्ड"},{"id":"birth_cert","en":"Birth Certificate","mr":"जन्म दाखला","required":true},{"id":"school_leaving","en":"School Leaving Certificate","mr":"शाळा सोडल्याचा दाखला","required":true}]'::jsonb,40),
('non_creamy_layer','Non-Creamy Layer','नॉन-क्रिमिलेअर प्रमाणपत्र','Non-creamy layer certificate for OBC / VJNT applicants.','ओबीसी / वि.जा.भ.ज. अर्जदारांसाठी नॉन-क्रिमिलेअर प्रमाणपत्र.','from-[oklch(0.5_0.13_300)] to-[oklch(0.42_0.12_295)]',90,
 '[{"key":"caste","en":"Caste","mr":"जात","required":true},{"key":"annualIncome","en":"Family Annual Income (₹)","mr":"कुटुंबाचे वार्षिक उत्पन्न (₹)","type":"number","required":true}]'::jsonb,
 '[{"id":"aadhaar","en":"Aadhaar Card","mr":"आधार कार्ड","required":true},{"id":"photo","en":"Passport Size Photo","mr":"पासपोर्ट आकाराचा फोटो","required":true},{"id":"ration","en":"Ration Card","mr":"रेशन कार्ड"},{"id":"caste_cert","en":"Caste Certificate","mr":"जात प्रमाणपत्र","required":true},{"id":"income_proof","en":"Income Proof (3 years)","mr":"उत्पन्नाचा पुरावा (३ वर्षे)","required":true}]'::jsonb,50),
('senior_citizen','Senior Citizen Certificate','ज्येष्ठ नागरिक प्रमाणपत्र','Certificate confirming senior citizen status.','ज्येष्ठ नागरिक असल्याचे प्रमाणपत्र.','from-[oklch(0.6_0.16_20)] to-[oklch(0.5_0.14_15)]',40,
 '[{"key":"dob","en":"Date of Birth","mr":"जन्म दिनांक","required":true}]'::jsonb,
 '[{"id":"aadhaar","en":"Aadhaar Card","mr":"आधार कार्ड","required":true},{"id":"photo","en":"Passport Size Photo","mr":"पासपोर्ट आकाराचा फोटो","required":true},{"id":"ration","en":"Ration Card","mr":"रेशन कार्ड"},{"id":"age_proof","en":"Age Proof (Aadhaar / PAN / Birth Cert.)","mr":"वयाचा पुरावा (आधार / पॅन / जन्म दाखला)","required":true}]'::jsonb,60),
('solvency','Solvency Certificate','आर्थिक सक्षमता प्रमाणपत्र','Financial solvency certificate from the Revenue Department.','महसूल विभागाकडून आर्थिक सक्षमता प्रमाणपत्र.','from-[oklch(0.55_0.14_220)] to-[oklch(0.45_0.12_230)]',120,
 '[{"key":"solvencyAmount","en":"Required Solvency Amount (₹)","mr":"आवश्यक सक्षमता रक्कम (₹)","type":"number","required":true},{"key":"purposeDetail","en":"Purpose / Tender Reference","mr":"कारण / निविदा संदर्भ","type":"textarea","required":true}]'::jsonb,
 '[{"id":"aadhaar","en":"Aadhaar Card","mr":"आधार कार्ड","required":true},{"id":"photo","en":"Passport Size Photo","mr":"पासपोर्ट आकाराचा फोटो","required":true},{"id":"ration","en":"Ration Card","mr":"रेशन कार्ड"},{"id":"bank_statement","en":"Bank Statement (6 months)","mr":"बँक स्टेटमेंट (६ महिने)","required":true},{"id":"property_docs","en":"Property / Asset Documents","mr":"मालमत्ता / स्थावर मिळकत कागदपत्रे","required":true},{"id":"itr","en":"Income Tax Return","mr":"आयकर विवरणपत्र (ITR)"}]'::jsonb,70),
('ews','EWS Certificate','आर्थिकदृष्ट्या दुर्बल घटक प्रमाणपत्र','Economically Weaker Section (EWS) certificate.','आर्थिकदृष्ट्या दुर्बल घटक (EWS) प्रमाणपत्र.','from-[oklch(0.6_0.13_185)] to-[oklch(0.5_0.12_190)]',80,
 '[{"key":"annualIncome","en":"Family Annual Income (₹)","mr":"कुटुंबाचे वार्षिक उत्पन्न (₹)","type":"number","required":true},{"key":"landHolding","en":"Agricultural Land (acres)","mr":"शेतजमीन (एकर)","type":"number"}]'::jsonb,
 '[{"id":"aadhaar","en":"Aadhaar Card","mr":"आधार कार्ड","required":true},{"id":"photo","en":"Passport Size Photo","mr":"पासपोर्ट आकाराचा फोटो","required":true},{"id":"ration","en":"Ration Card","mr":"रेशन कार्ड"},{"id":"income_proof","en":"Income Proof","mr":"उत्पन्नाचा पुरावा","required":true},{"id":"land_proof","en":"Land / Property Records (7/12)","mr":"जमिनीचे रेकॉर्ड (७/१२)"}]'::jsonb,80)
ON CONFLICT (type) DO NOTHING;
