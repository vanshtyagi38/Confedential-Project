
-- Allow room participants to delete messages
CREATE POLICY "Room participants can delete messages" ON public.user_chat_messages
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_chat_rooms r
    WHERE r.id = user_chat_messages.room_id
    AND (r.user_a_id = auth.uid() OR r.user_b_id = auth.uid())
  ));

-- Allow users to check if they are blocked by someone (needed for chat UX)
CREATE POLICY "Users can check if blocked" ON public.user_blocks
  FOR SELECT TO authenticated
  USING (auth.uid() = blocked_id);
