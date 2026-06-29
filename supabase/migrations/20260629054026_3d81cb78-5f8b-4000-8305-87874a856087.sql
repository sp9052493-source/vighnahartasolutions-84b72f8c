
-- 1) payment_gateways: restrict reads to admins
DROP POLICY IF EXISTS "Authenticated read gateways" ON public.payment_gateways;
CREATE POLICY "Admins read gateways"
  ON public.payment_gateways
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) user_service_pricing: allow owning user to read their overrides
CREATE POLICY "Users read own pricing overrides"
  ON public.user_service_pricing
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 3) Revoke EXECUTE on get_my_role from signed-in users (unused in app)
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO service_role;
