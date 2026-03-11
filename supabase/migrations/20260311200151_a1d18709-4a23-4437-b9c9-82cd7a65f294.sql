
-- Storage bucket for companion profile images
INSERT INTO storage.buckets (id, name, public) VALUES ('companion-images', 'companion-images', true);

-- Allow authenticated users to upload to companion-images
CREATE POLICY "Users can upload companion images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'companion-images');

-- Anyone can read companion images
CREATE POLICY "Anyone can read companion images" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'companion-images');

-- Owners and admins can delete companion images
CREATE POLICY "Admins can delete companion images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'companion-images' AND has_role(auth.uid(), 'admin'::app_role));
