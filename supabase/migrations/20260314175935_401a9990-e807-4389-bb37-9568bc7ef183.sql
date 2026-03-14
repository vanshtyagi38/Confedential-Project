CREATE TABLE public.api_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  method text NOT NULL DEFAULT 'POST',
  status_code integer NOT NULL,
  response_time_ms integer NOT NULL,
  error_message text,
  user_id uuid,
  ip_address text,
  api_version text DEFAULT 'v1',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read api logs" ON public.api_request_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert api logs" ON public.api_request_logs
  FOR INSERT TO public WITH CHECK (true);

CREATE INDEX idx_api_request_logs_created_at ON public.api_request_logs (created_at DESC);
CREATE INDEX idx_api_request_logs_function_name ON public.api_request_logs (function_name);