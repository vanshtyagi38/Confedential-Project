DROP POLICY IF EXISTS "Public can read gateway settings" ON public.payment_gateway_settings;
CREATE POLICY "Signed-in users can read gateway settings" ON public.payment_gateway_settings FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Anyone can read presence" ON public.user_presence;
CREATE POLICY "Signed-in users can read presence" ON public.user_presence FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);