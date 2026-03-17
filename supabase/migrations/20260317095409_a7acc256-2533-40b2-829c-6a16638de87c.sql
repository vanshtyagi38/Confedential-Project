
-- Create seo_pages table
CREATE TABLE public.seo_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  page_type text NOT NULL DEFAULT 'custom',
  primary_keyword text NOT NULL DEFAULT '',
  secondary_keywords text DEFAULT '',
  city text,
  title text NOT NULL DEFAULT '',
  meta_description text NOT NULL DEFAULT '',
  content_html text NOT NULL DEFAULT '',
  faq_json jsonb DEFAULT '[]'::jsonb,
  related_slugs text[] DEFAULT '{}',
  template_id text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

-- Create seo_templates table
CREATE TABLE public.seo_templates (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  title_template text NOT NULL DEFAULT '',
  content_prompt text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_templates ENABLE ROW LEVEL SECURITY;

-- seo_pages RLS: admins full CRUD
CREATE POLICY "Admins full access seo_pages" ON public.seo_pages FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- seo_pages RLS: public can read published pages
CREATE POLICY "Public can read published seo_pages" ON public.seo_pages FOR SELECT TO public
  USING (status = 'published');

-- seo_templates RLS: admins full CRUD
CREATE POLICY "Admins full access seo_templates" ON public.seo_templates FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- seo_templates RLS: public can read templates
CREATE POLICY "Public can read seo_templates" ON public.seo_templates FOR SELECT TO public
  USING (true);

-- Index on slug for fast lookups
CREATE INDEX idx_seo_pages_slug ON public.seo_pages (slug);
CREATE INDEX idx_seo_pages_status ON public.seo_pages (status);

-- Seed default templates
INSERT INTO public.seo_templates (id, name, title_template, content_prompt) VALUES
('city_chat', 'City Chat Page', 'Chat with {keyword} in {city} | SingleTape', 'Write a 800-1200 word SEO article about chatting with {keyword} in {city}. Include sections about safety, features, and why SingleTape is the best platform. Make it engaging, human-like, and conversational. Include 3-5 FAQs.'),
('intent', 'Intent Page', 'Best way to {keyword} | SingleTape', 'Write a 800-1200 word SEO article about {keyword}. Focus on how SingleTape helps users achieve this. Include benefits, features, safety tips, and a compelling call-to-action. Include 3-5 FAQs.'),
('alternative', 'Alternative Page', '{keyword} - Best Alternative | SingleTape', 'Write a 800-1200 word SEO article positioning SingleTape as the best alternative for {keyword}. Compare features, highlight advantages, and include user testimonials style content. Include 3-5 FAQs.');
