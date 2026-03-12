
-- Fix: just re-run to ensure policies exist (they were created before the error)
-- Verify by selecting from pg_policies
SELECT policyname FROM pg_policies WHERE tablename = 'chat_messages' AND policyname IN ('Companion owners can read messages', 'Companion owners can insert replies');
