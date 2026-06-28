-- Per-user confidential service pricing (admin-only)
CREATE TABLE IF NOT EXISTS public.user_service_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  distributor_commission numeric(12,2) NOT NULL DEFAULT 0 CHECK (distributor_commission >= 0),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, service_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_service_pricing TO authenticated;
GRANT ALL ON public.user_service_pricing TO service_role;

ALTER TABLE public.user_service_pricing ENABLE ROW LEVEL SECURITY;

-- ONLY admins can see or change these overrides. Retailers/distributors must never read them.
CREATE POLICY "Admins manage pricing overrides"
  ON public.user_service_pricing FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER user_service_pricing_set_updated_at
  BEFORE UPDATE ON public.user_service_pricing
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Update document completion to honor per-user pricing overrides (confidential).
CREATE OR REPLACE FUNCTION public.complete_document_request(p_user_id uuid, p_service_id uuid, p_input text, p_result jsonb, p_doc_url text)
 RETURNS document_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_service public.services%ROWTYPE;
  v_override public.user_service_pricing%ROWTYPE;
  v_price numeric(12,2);
  v_dist_comm numeric(12,2);
  v_balance numeric(12,2);
  v_new_balance numeric(12,2);
  v_parent uuid;
  v_request public.document_requests;
BEGIN
  SELECT * INTO v_service FROM public.services WHERE id = p_service_id AND active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not available';
  END IF;

  SELECT * INTO v_override FROM public.user_service_pricing
    WHERE user_id = p_user_id AND service_id = p_service_id;

  IF FOUND THEN
    v_price := v_override.price;
    v_dist_comm := v_override.distributor_commission;
  ELSE
    v_price := v_service.price;
    v_dist_comm := v_service.distributor_commission;
  END IF;

  SELECT balance INTO v_balance FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF v_balance < v_price THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
  END IF;

  v_new_balance := v_balance - v_price;
  UPDATE public.wallets SET balance = v_new_balance, updated_at = now() WHERE user_id = p_user_id;

  INSERT INTO public.wallet_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_user_id, -v_price, 'debit', v_service.name || ' request', v_new_balance);

  INSERT INTO public.document_requests (user_id, service_id, service_name, input_value, status, result_data, document_url, cost)
  VALUES (p_user_id, p_service_id, v_service.name, p_input, 'completed', p_result, p_doc_url, v_price)
  RETURNING * INTO v_request;

  SELECT parent_id INTO v_parent FROM public.profiles WHERE id = p_user_id;
  IF v_parent IS NOT NULL AND v_dist_comm > 0 THEN
    UPDATE public.wallets SET balance = balance + v_dist_comm, updated_at = now()
    WHERE user_id = v_parent
    RETURNING balance INTO v_new_balance;
    IF FOUND THEN
      INSERT INTO public.wallet_transactions (user_id, amount, type, description, balance_after)
      VALUES (v_parent, v_dist_comm, 'commission', 'Commission: ' || v_service.name, v_new_balance);
    END IF;
  END IF;

  RETURN v_request;
END;
$function$;