
CREATE TABLE public.payment_gateway_settings (
  id text PRIMARY KEY DEFAULT 'default',
  razorpay_enabled boolean NOT NULL DEFAULT true,
  phonepe_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_gateway_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage gateway settings" ON public.payment_gateway_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can read gateway settings" ON public.payment_gateway_settings
  FOR SELECT TO public
  USING (true);

INSERT INTO public.payment_gateway_settings (id, razorpay_enabled, phonepe_enabled) VALUES ('default', true, false);
