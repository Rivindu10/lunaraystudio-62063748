DROP POLICY IF EXISTS "Public can send messages" ON public.contact_messages;
CREATE POLICY "Public can send messages" ON public.contact_messages
FOR INSERT TO anon, authenticated
WITH CHECK (
  char_length(btrim(name)) BETWEEN 1 AND 120
  AND char_length(btrim(email)) BETWEEN 3 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND char_length(btrim(message)) BETWEEN 1 AND 2000
  AND (service IS NULL OR char_length(service) <= 100)
);