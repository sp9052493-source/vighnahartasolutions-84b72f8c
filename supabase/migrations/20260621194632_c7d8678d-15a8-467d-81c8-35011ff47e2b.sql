-- Atomic document-request completion with wallet debit + distributor commission
CREATE OR REPLACE FUNCTION public.complete_document_request(
  p_user_id uuid,
  p_service_id uuid,
  p_input text,
  p_result jsonb,
  p_doc_url text
)
RETURNS public.document_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service public.services%ROWTYPE;
  v_balance numeric(12,2);
  v_new_balance numeric(12,2);
  v_parent uuid;
  v_request public.document_requests;
BEGIN
  SELECT * INTO v_service FROM public.services WHERE id = p_service_id AND active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not available';
  END IF;

  -- Lock the wallet row to prevent double spend
  SELECT balance INTO v_balance FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF v_balance < v_service.price THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
  END IF;

  v_new_balance := v_balance - v_service.price;
  UPDATE public.wallets SET balance = v_new_balance, updated_at = now() WHERE user_id = p_user_id;

  INSERT INTO public.wallet_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_user_id, -v_service.price, 'debit', v_service.name || ' request', v_new_balance);

  INSERT INTO public.document_requests (user_id, service_id, service_name, input_value, status, result_data, document_url, cost)
  VALUES (p_user_id, p_service_id, v_service.name, p_input, 'completed', p_result, p_doc_url, v_service.price)
  RETURNING * INTO v_request;

  -- Pay distributor commission to the member's parent, if any
  SELECT parent_id INTO v_parent FROM public.profiles WHERE id = p_user_id;
  IF v_parent IS NOT NULL AND v_service.distributor_commission > 0 THEN
    UPDATE public.wallets SET balance = balance + v_service.distributor_commission, updated_at = now()
    WHERE user_id = v_parent
    RETURNING balance INTO v_new_balance;
    IF FOUND THEN
      INSERT INTO public.wallet_transactions (user_id, amount, type, description, balance_after)
      VALUES (v_parent, v_service.distributor_commission, 'commission', 'Commission: ' || v_service.name, v_new_balance);
    END IF;
  END IF;

  RETURN v_request;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_document_request(uuid, uuid, text, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_document_request(uuid, uuid, text, jsonb, text) TO service_role;

-- Admin wallet adjustment (top up / deduct)
CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_description text
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance numeric(12,2);
BEGIN
  UPDATE public.wallets SET balance = balance + p_amount, updated_at = now()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
  END IF;

  INSERT INTO public.wallet_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_user_id, p_amount, CASE WHEN p_amount >= 0 THEN 'topup' ELSE 'debit' END,
          COALESCE(p_description, 'Admin adjustment'), v_new_balance);

  RETURN v_new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_adjust_wallet(uuid, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_adjust_wallet(uuid, numeric, text) TO service_role;