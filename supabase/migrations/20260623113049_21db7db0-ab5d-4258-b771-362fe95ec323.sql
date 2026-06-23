CREATE TABLE public.payment_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id text NOT NULL UNIQUE,
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  provider text NOT NULL DEFAULT 'paytm',
  provider_txn_id text,
  provider_response jsonb,
  credited boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_orders TO authenticated;
GRANT ALL ON public.payment_orders TO service_role;

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recharge orders"
  ON public.payment_orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER set_payment_orders_updated_at
  BEFORE UPDATE ON public.payment_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.services (code, name, price, distributor_commission, active, sort_order)
VALUES ('RATION', 'Ration Card Print', 30.00, 3.00, true, 8)
ON CONFLICT (code) DO NOTHING;