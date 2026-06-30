-- 1) Column-level lockdown for public.services
-- Revoke broad table SELECT from non-admin roles, then explicitly grant only safe columns.
-- Commissions, API endpoint / provider / notes are admin-only and reached via the service_role.
REVOKE SELECT ON public.services FROM authenticated;
REVOKE SELECT ON public.services FROM anon;

GRANT SELECT
  (id, code, name, description, category, price, input_label, active, sort_order, created_at, api_enabled)
  ON public.services TO authenticated;

-- INSERT/UPDATE/DELETE for services are guarded by RLS ("Admins can manage services").
-- Keep table-level write grants so admins can still edit through the policy.
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;

-- 2) has_role: switch to SECURITY INVOKER.
-- user_roles has an RLS policy ("Users can view their own roles") allowing
-- auth.uid() = user_id, which is exactly what has_role checks, so invoker mode works.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 3) Admin storage access for the documents bucket
CREATE POLICY "Admins can read all documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));