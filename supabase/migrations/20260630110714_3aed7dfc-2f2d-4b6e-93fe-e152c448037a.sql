
CREATE TABLE IF NOT EXISTS public.udyam_service_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_charge numeric(10,2) NOT NULL DEFAULT 249,
  govt_fee numeric(10,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  turnaround_text text NOT NULL DEFAULT '24-48 working hours',
  instructions_en text NOT NULL DEFAULT 'Keep Aadhaar, PAN, bank passbook, business proof and a passport-size photograph ready before starting the application.',
  instructions_mr text NOT NULL DEFAULT 'अर्ज सुरू करण्यापूर्वी आधार, पॅन, बँक पासबुक, व्यवसाय पुरावा आणि पासपोर्ट साईज फोटो तयार ठेवा.',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.udyam_service_config TO authenticated;
GRANT ALL ON public.udyam_service_config TO service_role;

ALTER TABLE public.udyam_service_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "udyam config read" ON public.udyam_service_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "udyam config admin write" ON public.udyam_service_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.udyam_config_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER udyam_config_updated_at BEFORE UPDATE ON public.udyam_service_config
  FOR EACH ROW EXECUTE FUNCTION public.udyam_config_touch_updated_at();

INSERT INTO public.udyam_service_config (service_charge, govt_fee)
SELECT 249, 0
WHERE NOT EXISTS (SELECT 1 FROM public.udyam_service_config);
