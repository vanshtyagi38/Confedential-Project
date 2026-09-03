ALTER TABLE public.user_profiles ALTER COLUMN balance_minutes SET DEFAULT 0.5;

CREATE OR REPLACE FUNCTION public.deduct_chat_time(p_user_id uuid, p_companion_slug text, p_amount numeric DEFAULT 0.5)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_balance numeric;
BEGIN
  UPDATE user_profiles
  SET balance_minutes = GREATEST(0, balance_minutes - p_amount)
  WHERE user_id = p_user_id AND balance_minutes > 0
  RETURNING balance_minutes INTO v_balance;

  IF v_balance IS NULL THEN
    SELECT balance_minutes INTO v_balance FROM user_profiles WHERE user_id = p_user_id;
    RETURN COALESCE(v_balance, 0);
  END IF;

  INSERT INTO wallet_transactions (user_id, type, minutes, amount, description)
  VALUES (p_user_id, 'debit', p_amount, 0, '💬 Chat time: ' || COALESCE(p_companion_slug, 'unknown'));

  RETURN v_balance;
END;
$$;