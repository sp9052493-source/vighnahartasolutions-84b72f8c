
-- 1) Restrict sensitive columns on public.services from being read by client roles.
--    Admin reads/writes go through SECURITY DEFINER / service_role server functions.
REVOKE SELECT (distributor_commission, retailer_commission, api_endpoint, api_provider, api_notes, api_enabled)
  ON public.services FROM authenticated;
REVOKE SELECT (distributor_commission, retailer_commission, api_endpoint, api_provider, api_notes, api_enabled)
  ON public.services FROM anon;

-- 2) Remove user-facing INSERT policy on udyam_application_events.
--    Events must be written exclusively by server-side service_role paths.
DROP POLICY IF EXISTS "udyam event insert" ON public.udyam_application_events;
