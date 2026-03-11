
-- Support messages table for Help & Support chat
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  sender TEXT NOT NULL DEFAULT 'user', -- 'user' or 'admin'
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Users can insert their own messages
CREATE POLICY "Users can insert own support messages" ON public.support_messages
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);

-- Users can read their own messages
CREATE POLICY "Users can read own support messages" ON public.support_messages
  FOR SELECT TO public USING (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "Admins full access support" ON public.support_messages
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Update referral processing: give referrer 5 free minutes instead of just spin
CREATE OR REPLACE FUNCTION public.process_referral(p_referral_code TEXT, p_referred_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
BEGIN
  -- Find the referrer
  SELECT user_id INTO v_referrer_id
  FROM user_profiles
  WHERE referral_code = p_referral_code
  LIMIT 1;

  IF v_referrer_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Don't allow self-referral
  IF v_referrer_id = p_referred_user_id THEN
    RETURN FALSE;
  END IF;

  -- Check if already referred
  IF EXISTS (
    SELECT 1 FROM referrals
    WHERE referrer_user_id = v_referrer_id
    AND referred_user_id = p_referred_user_id
  ) THEN
    RETURN FALSE;
  END IF;

  -- Create referral record
  INSERT INTO referrals (referrer_user_id, referred_user_id, referral_code, status)
  VALUES (v_referrer_id, p_referred_user_id, p_referral_code, 'completed');

  -- Give referrer 5 free minutes + 1 spin credit
  UPDATE user_profiles
  SET balance_minutes = balance_minutes + 5,
      spin_credits = spin_credits + 1
  WHERE user_id = v_referrer_id;

  -- Log the reward transaction
  INSERT INTO wallet_transactions (user_id, type, minutes, amount, description)
  VALUES (v_referrer_id, 'credit', 5, 0, '🎁 Referral reward: +5 minutes! A friend joined using your link.');

  RETURN TRUE;
END;
$$;
