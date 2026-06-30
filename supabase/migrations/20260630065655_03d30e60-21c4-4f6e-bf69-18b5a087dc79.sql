
-- 1) Lock down SECURITY DEFINER function execution
REVOKE EXECUTE ON FUNCTION public.admin_adjust_wallet(uuid, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.charge_gst_application(uuid, uuid, numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.complete_document_request(uuid, uuid, text, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_gst_application_no() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- has_role is required by RLS policies executed by authenticated users; keep it executable
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2) Explicitly block direct INSERTs into gst_application_events by authenticated users.
-- All event inserts must go through service_role (supabaseAdmin) inside server functions.
CREATE POLICY "Block direct event inserts"
  ON public.gst_application_events
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- 3) Allow admins to view all payment orders for reconciliation
CREATE POLICY "Admins can view all payment orders"
  ON public.payment_orders
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4) Hide internal API config columns on services from non-admin authenticated users.
-- Authenticated users read services via narrow column projection in the client (useServices).
-- Admin reads/writes go through server functions using the service_role client.
REVOKE SELECT (api_endpoint, api_notes, api_provider) ON public.services FROM authenticated;
REVOKE SELECT (api_endpoint, api_notes, api_provider) ON public.services FROM anon;
