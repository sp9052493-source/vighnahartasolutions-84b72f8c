REVOKE EXECUTE ON FUNCTION public.complete_document_request(uuid, uuid, text, jsonb, text) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_wallet(uuid, numeric, text) FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION public.complete_document_request(uuid, uuid, text, jsonb, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_adjust_wallet(uuid, numeric, text) TO service_role;