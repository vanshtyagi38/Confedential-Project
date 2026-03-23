
-- Change default free minutes from 5 to 3 for new users
ALTER TABLE public.user_profiles ALTER COLUMN balance_minutes SET DEFAULT 3;

-- Create reels table
CREATE TABLE public.reels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_url text NOT NULL,
  thumbnail_url text,
  caption text DEFAULT '',
  companion_slug text,
  likes_count integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

-- Public can read active reels
CREATE POLICY "Public can read active reels" ON public.reels
  FOR SELECT TO public USING (is_active = true);

-- Admins full access
CREATE POLICY "Admins full access reels" ON public.reels
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
