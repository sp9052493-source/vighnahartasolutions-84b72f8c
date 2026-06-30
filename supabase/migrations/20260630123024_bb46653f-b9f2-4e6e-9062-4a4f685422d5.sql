
-- 1. Revoke EXECUTE on privileged SECURITY DEFINER functions from anon/authenticated.
--    These are only called via service_role from server functions.
REVOKE EXECUTE ON FUNCTION public.admin_adjust_wallet(uuid, numeric, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.complete_document_request(uuid, uuid, text, jsonb, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.charge_udyam_application(uuid, uuid, numeric) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.charge_gst_application(uuid, uuid, numeric) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.charge_shopact_application(uuid, uuid, numeric) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.charge_fssai_application(uuid, uuid, numeric) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_udyam_application_no() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_gst_application_no() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_shopact_application_no() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_fssai_application_no() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.udyam_config_touch_updated_at() FROM anon, authenticated, public;
-- get_my_role: not called from client; remove anon, keep authenticated off too
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM anon, authenticated, public;
-- Note: has_role(uuid, app_role) is intentionally left executable to authenticated;
-- it is called by client/server code and by RLS policies as the calling user.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;

-- 2. Hide distributor_commission from authenticated/anon on service_config tables.
REVOKE SELECT (distributor_commission) ON public.fssai_service_config FROM authenticated, anon;
REVOKE SELECT (distributor_commission) ON public.shopact_service_config FROM authenticated, anon;

-- 3. Re-assert column revokes on services table for sensitive internal columns.
REVOKE SELECT (api_endpoint, api_provider, api_notes, api_enabled, distributor_commission, retailer_commission)
  ON public.services FROM authenticated, anon;

-- 4. Document invariants on wallets and payment_orders (no client write policy by design).
COMMENT ON TABLE public.wallets IS
  'Wallet balances. Writes ONLY via service_role server functions (e.g. admin_adjust_wallet, charge_* RPCs). RLS deny-all for writes is intentional.';
COMMENT ON TABLE public.payment_orders IS
  'Payment orders. Writes ONLY via service_role server functions and verified webhook handlers. RLS deny-all for writes is intentional.';
