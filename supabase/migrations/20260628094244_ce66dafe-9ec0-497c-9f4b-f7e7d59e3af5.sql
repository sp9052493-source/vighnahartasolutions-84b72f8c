
-- Recreate auth.users -> handle_new_user trigger (was missing)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill missing profiles, wallets and roles for already-existing auth users
INSERT INTO public.profiles (id, full_name, phone, business_name)
SELECT u.id,
       COALESCE(u.raw_user_meta_data ->> 'full_name', split_part(u.email,'@',1)),
       u.raw_user_meta_data ->> 'phone',
       u.raw_user_meta_data ->> 'business_name'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

INSERT INTO public.wallets (user_id, balance)
SELECT u.id, 0
FROM auth.users u
LEFT JOIN public.wallets w ON w.user_id = u.id
WHERE w.user_id IS NULL;

-- Ensure at least one admin exists, default the rest to retailer
DO $$
DECLARE has_admin boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role='admin') INTO has_admin;
  IF NOT has_admin THEN
    INSERT INTO public.user_roles(user_id, role)
    SELECT id, 'admin'::public.app_role FROM auth.users
    WHERE email='officialopmangesh@gmail.com'
    ON CONFLICT DO NOTHING;
  END IF;
END$$;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, COALESCE((u.raw_user_meta_data ->> 'role')::public.app_role, 'retailer'::public.app_role)
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.user_id IS NULL;
