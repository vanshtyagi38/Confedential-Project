
-- Remove duplicate companion_applications per user (keep the latest one)
DELETE FROM public.companion_applications
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.companion_applications
  ORDER BY user_id, created_at DESC
);

-- Remove duplicate companions per owner_user_id where is_real_user = true (keep the latest one)
DELETE FROM public.companions
WHERE is_real_user = true
AND owner_user_id IS NOT NULL
AND id NOT IN (
  SELECT DISTINCT ON (owner_user_id) id
  FROM public.companions
  WHERE is_real_user = true AND owner_user_id IS NOT NULL
  ORDER BY owner_user_id, created_at DESC
);

-- Add unique constraint on companion_applications (one app per user)
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_companion_application ON public.companion_applications (user_id);

-- Add unique partial index on companions (one real-user companion per owner)
CREATE UNIQUE INDEX IF NOT EXISTS unique_owner_real_companion ON public.companions (owner_user_id) WHERE is_real_user = true AND owner_user_id IS NOT NULL;
