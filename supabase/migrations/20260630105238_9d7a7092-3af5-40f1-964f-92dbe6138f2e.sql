REVOKE EXECUTE ON FUNCTION public.charge_udyam_application(uuid, uuid, numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_udyam_application_no() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.charge_udyam_application(uuid, uuid, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_udyam_application_no() TO service_role;