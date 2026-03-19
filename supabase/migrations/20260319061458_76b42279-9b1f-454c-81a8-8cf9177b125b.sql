
CREATE TABLE public.seo_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (track views from public visitors)
CREATE POLICY "Public can insert page views" ON public.seo_page_views
  FOR INSERT TO public WITH CHECK (true);

-- Admins can read all views
CREATE POLICY "Admins can read page views" ON public.seo_page_views
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Create index for fast counting by slug
CREATE INDEX idx_seo_page_views_slug ON public.seo_page_views (slug);
