
-- Add profile completion columns
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS contact text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS image_url text;

-- Allow users to delete own profile
CREATE POLICY "Users can delete own profile"
ON public.user_profiles
FOR DELETE
TO public
USING (auth.uid() = user_id);

-- Allow users to delete own messages
CREATE POLICY "Users can delete own messages"
ON public.chat_messages
FOR DELETE
TO public
USING (auth.uid() = user_id);

-- Allow admins to delete messages
CREATE POLICY "Admins can delete messages"
ON public.chat_messages
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update messages (for moderation)
CREATE POLICY "Admins can update messages"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create companion reports table
CREATE TABLE public.companion_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  companion_slug text NOT NULL,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companion_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own reports"
ON public.companion_reports
FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own reports"
ON public.companion_reports
FOR SELECT
TO public
USING (auth.uid() = user_id);

CREATE POLICY "Admins full access reports"
ON public.companion_reports
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete user profiles
CREATE POLICY "Admins can delete profiles"
ON public.user_profiles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow users to delete own streaks (for account deletion cleanup)
CREATE POLICY "Users can delete own streaks"
ON public.user_streaks
FOR DELETE
TO public
USING (auth.uid() = user_id);

-- Allow users to delete own transactions (for account deletion cleanup)  
CREATE POLICY "Users can delete own transactions"
ON public.wallet_transactions
FOR DELETE
TO public
USING (auth.uid() = user_id);

-- Allow users to delete own referrals
CREATE POLICY "Users can delete own referrals"
ON public.referrals
FOR DELETE
TO public
USING (auth.uid() = referrer_user_id);
