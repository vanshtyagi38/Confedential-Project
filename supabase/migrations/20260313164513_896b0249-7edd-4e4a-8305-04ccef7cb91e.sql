-- Critical: Allow authenticated users to read basic profile info of online users
-- This fixes the "Finding Someone" section which queries user_profiles for online users
CREATE POLICY "Authenticated users can read online profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (user_status = 'online');