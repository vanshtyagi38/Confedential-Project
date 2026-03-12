
-- Allow companion owners to read messages sent to their companion
CREATE POLICY "Companion owners can read messages"
ON public.chat_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.companions
    WHERE companions.slug = chat_messages.companion_slug
    AND companions.owner_user_id = auth.uid()
    AND companions.is_real_user = true
    AND companions.status = 'active'
  )
);

-- Allow companion owners to insert replies (role=assistant) for their companion
CREATE POLICY "Companion owners can insert replies"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companions
    WHERE companions.slug = chat_messages.companion_slug
    AND companions.owner_user_id = auth.uid()
    AND companions.is_real_user = true
    AND companions.status = 'active'
  )
);
