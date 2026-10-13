CREATE TABLE public.recharge_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 provider text NOT NULL CHECK (provider IN ('razorpay','phonepe')),
 provider_order_id text NOT NULL,
 plan_id text NOT NULL,
 amount_paise bigint NOT NULL CHECK (amount_paise > 0),
 minutes numeric NOT NULL CHECK (minutes > 0),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','credited')),
 provider_payment_id text,
 credited_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(provider, provider_order_id),
 UNIQUE(provider, provider_payment_id)
);
GRANT SELECT ON public.recharge_orders TO authenticated;
GRANT ALL ON public.recharge_orders TO service_role;
ALTER TABLE public.recharge_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own recharge orders" ON public.recharge_orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.credit_verified_recharge(p_provider text, p_order_id text, p_payment_id text, p_amount_paise bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order public.recharge_orders%ROWTYPE; v_balance numeric;
BEGIN
 SELECT * INTO v_order FROM public.recharge_orders WHERE provider=p_provider AND provider_order_id=p_order_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Recharge order not found'; END IF;
 IF v_order.amount_paise <> p_amount_paise OR p_payment_id IS NULL OR length(p_payment_id)=0 THEN RAISE EXCEPTION 'Payment details do not match order'; END IF;
 IF v_order.status = 'credited' THEN
  IF v_order.provider_payment_id <> p_payment_id THEN RAISE EXCEPTION 'Payment does not match credited order'; END IF;
  SELECT balance_minutes INTO v_balance FROM public.user_profiles WHERE user_id=v_order.user_id;
  RETURN jsonb_build_object('success',true,'already_credited',true,'new_balance',v_balance,'minutes_added',v_order.minutes);
 END IF;
 UPDATE public.user_profiles SET balance_minutes=COALESCE(balance_minutes,0)+v_order.minutes WHERE user_id=v_order.user_id RETURNING balance_minutes INTO v_balance;
 IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
 INSERT INTO public.wallet_transactions(user_id,type,minutes,amount,description) VALUES(v_order.user_id,'credit',v_order.minutes,v_order.amount_paise/100.0, CASE WHEN p_provider='razorpay' THEN 'Razorpay payment: ' ELSE 'PhonePe completed: ' END || p_payment_id || ' | Plan: ' || v_order.plan_id);
 UPDATE public.recharge_orders SET status='credited',provider_payment_id=p_payment_id,credited_at=now() WHERE id=v_order.id;
 RETURN jsonb_build_object('success',true,'already_credited',false,'new_balance',v_balance,'minutes_added',v_order.minutes);
END; $$;
REVOKE ALL ON FUNCTION public.credit_verified_recharge(text,text,text,bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_verified_recharge(text,text,text,bigint) TO service_role;