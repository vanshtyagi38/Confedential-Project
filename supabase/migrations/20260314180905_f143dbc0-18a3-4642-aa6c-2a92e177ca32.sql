-- Performance indexes for 10K concurrent users

-- Chat messages: high-traffic table, needs composite indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_companion ON public.chat_messages (user_id, companion_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_slug_created ON public.chat_messages (companion_slug, created_at DESC);

-- User chat messages: user-to-user needs fast room lookups
CREATE INDEX IF NOT EXISTS idx_user_chat_messages_room_created ON public.user_chat_messages (room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_chat_messages_sender ON public.user_chat_messages (sender_id);

-- User chat rooms: fast participant lookups
CREATE INDEX IF NOT EXISTS idx_user_chat_rooms_user_a ON public.user_chat_rooms (user_a_id);
CREATE INDEX IF NOT EXISTS idx_user_chat_rooms_user_b ON public.user_chat_rooms (user_b_id);

-- User presence: critical for concurrent user tracking
CREATE INDEX IF NOT EXISTS idx_user_presence_online ON public.user_presence (is_online) WHERE is_online = true;

-- User profiles: fast lookups by user_id and status
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles (user_status) WHERE user_status = 'online';

-- Companions: fast slug lookups  
CREATE INDEX IF NOT EXISTS idx_companions_slug ON public.companions (slug);
CREATE INDEX IF NOT EXISTS idx_companions_active ON public.companions (status) WHERE status = 'active';

-- API request logs: time-series optimization
CREATE INDEX IF NOT EXISTS idx_api_logs_fn_status_time ON public.api_request_logs (function_name, status_code, created_at DESC);

-- Alert thresholds table for admin alerting
CREATE TABLE IF NOT EXISTS public.api_alert_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL UNIQUE,
  threshold_value numeric NOT NULL,
  window_minutes integer NOT NULL DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  last_triggered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.api_alert_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage alert thresholds" ON public.api_alert_thresholds
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default thresholds
INSERT INTO public.api_alert_thresholds (metric_name, threshold_value, window_minutes) VALUES
  ('error_rate_percent', 10, 5),
  ('avg_response_time_ms', 5000, 5),
  ('total_errors_count', 50, 5),
  ('p95_response_time_ms', 8000, 15)
ON CONFLICT (metric_name) DO NOTHING;

-- API alerts log table
CREATE TABLE IF NOT EXISTS public.api_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  metric_name text NOT NULL,
  current_value numeric NOT NULL,
  threshold_value numeric NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.api_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read alerts" ON public.api_alerts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert alerts" ON public.api_alerts
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Admins can update alerts" ON public.api_alerts
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_api_alerts_created ON public.api_alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_alerts_resolved ON public.api_alerts (resolved_at) WHERE resolved_at IS NULL;