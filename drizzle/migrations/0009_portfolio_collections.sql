ALTER TYPE public.portfolio_category ADD VALUE IF NOT EXISTS 'casual';
CREATE TABLE public.portfolio_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  date_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category, slug)
);
GRANT SELECT ON public.portfolio_collections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.portfolio_collections TO authenticated;
GRANT ALL ON public.portfolio_collections TO service_role;
ALTER TABLE public.portfolio_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views collections" ON public.portfolio_collections FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage collections" ON public.portfolio_collections FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
ALTER TABLE public.portfolio_photos ADD COLUMN collection_id uuid REFERENCES public.portfolio_collections(id) ON DELETE CASCADE;