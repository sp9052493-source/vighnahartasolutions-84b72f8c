
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='admin_adjust_wallet' AND pronamespace='public'::regnamespace) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.admin_adjust_wallet(uuid, numeric, text) FROM PUBLIC, anon, authenticated';
  END IF;
END $$;
