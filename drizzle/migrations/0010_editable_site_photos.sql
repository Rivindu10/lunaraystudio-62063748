CREATE TABLE public.site_photos (image_key text PRIMARY KEY, storage_path text NOT NULL CHECK (storage_path LIKE 'site/%'), alt text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.site_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_photos TO authenticated;
GRANT ALL ON public.site_photos TO service_role;
ALTER TABLE public.site_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views site photos" ON public.site_photos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage site photos" ON public.site_photos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins read portfolio storage" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'portfolio' AND public.has_role(auth.uid(), 'admin'));