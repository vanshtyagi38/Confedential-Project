
-- Add user_status column to user_profiles for online/offline toggle
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS user_status text NOT NULL DEFAULT 'offline';

-- User-to-user chat rooms
CREATE TABLE public.user_chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id uuid NOT NULL,
  user_b_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_a_id, user_b_id)
);

ALTER TABLE public.user_chat_rooms ENABLE ROW LEVEL SECURITY;

-- Users can read rooms they are part of
CREATE POLICY "Users can read own chat rooms" ON public.user_chat_rooms
  FOR SELECT TO authenticated
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- Users can create chat rooms
CREATE POLICY "Users can create chat rooms" ON public.user_chat_rooms
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- User-to-user chat messages
CREATE TABLE public.user_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.user_chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_chat_messages ENABLE ROW LEVEL SECURITY;

-- Only room participants can read messages
CREATE POLICY "Room participants can read messages" ON public.user_chat_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_chat_rooms r
    WHERE r.id = user_chat_messages.room_id
    AND (r.user_a_id = auth.uid() OR r.user_b_id = auth.uid())
  ));

-- Only room participants can insert messages  
CREATE POLICY "Room participants can insert messages" ON public.user_chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.user_chat_rooms r
      WHERE r.id = user_chat_messages.room_id
      AND (r.user_a_id = auth.uid() OR r.user_b_id = auth.uid())
    )
  );

-- User blocks table
CREATE TABLE public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own blocks" ON public.user_blocks
  FOR SELECT TO authenticated
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can insert blocks" ON public.user_blocks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete own blocks" ON public.user_blocks
  FOR DELETE TO authenticated
  USING (auth.uid() = blocker_id);

-- Enable realtime for user chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_chat_messages;

-- Admin access policies
CREATE POLICY "Admins full access user_chat_rooms" ON public.user_chat_rooms
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins full access user_chat_messages" ON public.user_chat_messages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins full access user_blocks" ON public.user_blocks
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
