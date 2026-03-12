
-- User presence table for online/offline tracking
CREATE TABLE public.user_presence (
  user_id uuid PRIMARY KEY,
  is_online boolean NOT NULL DEFAULT false,
  last_seen timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read presence"
ON public.user_presence FOR SELECT TO public
USING (true);

CREATE POLICY "Users can upsert own presence"
ON public.user_presence FOR INSERT TO public
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence"
ON public.user_presence FOR UPDATE TO public
USING (auth.uid() = user_id);

CREATE POLICY "Admins full access presence"
ON public.user_presence FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscriptions"
ON public.push_subscriptions FOR ALL TO public
USING (auth.uid() = user_id);

CREATE POLICY "Admins full access push"
ON public.push_subscriptions FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin notifications table
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  link text,
  type text NOT NULL DEFAULT 'announcement',
  target text NOT NULL DEFAULT 'all',
  target_user_ids uuid[] DEFAULT '{}',
  sent_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access notifications"
ON public.admin_notifications FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can read own notifications"
ON public.admin_notifications FOR SELECT TO public
USING (target = 'all' OR auth.uid() = ANY(target_user_ids));

-- Add interests field to companions
ALTER TABLE public.companions ADD COLUMN IF NOT EXISTS interests text DEFAULT '';

-- Add interests to companion_applications
ALTER TABLE public.companion_applications ADD COLUMN IF NOT EXISTS interests text DEFAULT '';

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Enable realtime for user_presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
