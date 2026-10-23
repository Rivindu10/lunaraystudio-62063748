CREATE OR REPLACE FUNCTION public.booking_slot_ranges(t text)
RETURNS int4multirange LANGUAGE sql IMMUTABLE SET search_path = public AS $$
 SELECT range_agg(public.slot_range(trim(s))) FROM string_to_table(t, '|') AS s;
$$;
GRANT EXECUTE ON FUNCTION public.booking_slot_ranges(text) TO anon, authenticated, service_role;
CREATE OR REPLACE FUNCTION public.get_taken_slots(_day date)
RETURNS TABLE(preferred_time text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT trim(s) FROM public.bookings b CROSS JOIN LATERAL string_to_table(b.preferred_time, '|') AS s
 WHERE b.booking_date = _day AND b.status = 'confirmed';
$$;
CREATE OR REPLACE FUNCTION public.is_day_full(_day date)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT exists (SELECT 1 FROM public.bookings WHERE booking_date = _day AND status = 'confirmed')
 AND NOT exists (SELECT 1 FROM generate_series(7,23) h WHERE NOT exists (
 SELECT 1 FROM public.bookings b WHERE b.booking_date = _day AND b.status = 'confirmed' AND public.booking_slot_ranges(b.preferred_time) @> h));
$$;
CREATE OR REPLACE FUNCTION public.validate_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE chosen text[]; n integer;
BEGIN
 IF TG_OP = 'INSERT' OR new.preferred_time IS DISTINCT FROM old.preferred_time OR new.service IS DISTINCT FROM old.service THEN
  SELECT array_agg(trim(s)) INTO chosen FROM string_to_table(new.preferred_time, '|') AS s;
  n := cardinality(chosen);
  IF new.service = 'graduation' THEN
   IF n IS NULL OR n NOT BETWEEN 1 AND 3 OR (SELECT count(DISTINCT s) FROM unnest(chosen) s) <> n
     OR EXISTS (SELECT 1 FROM unnest(chosen) s WHERE s !~ '^(0[7-9]|1[0-7]):00 – (0[8-9]|1[0-8]):00$' OR substr(s,10,2)::int <> substr(s,1,2)::int + 1) THEN
    RAISE EXCEPTION 'Please select one to three available hourly graduation time slots (up to 3 hours).';
   END IF;
  ELSIF n IS NULL OR n <> 1 THEN
   RAISE EXCEPTION 'Please choose one time slot for this service.';
  END IF;
 END IF;
 PERFORM pg_advisory_xact_lock(73190, new.booking_date - DATE '2000-01-01');
 IF TG_OP = 'INSERT' THEN
  IF new.booking_date < current_date THEN RAISE EXCEPTION 'Please choose a future date.'; END IF;
  IF new.end_date IS NOT NULL AND new.end_date < new.booking_date THEN RAISE EXCEPTION 'End date must be after the start date.'; END IF;
  IF exists (SELECT 1 FROM public.availability a WHERE a.day = new.booking_date AND a.status <> 'available') THEN RAISE EXCEPTION 'This date is no longer available. Please choose another date.'; END IF;
  IF public.is_day_full(new.booking_date) THEN RAISE EXCEPTION 'This date is fully booked. Please choose another date.'; END IF;
  IF exists (SELECT 1 FROM public.bookings b WHERE b.booking_date = new.booking_date AND b.status = 'confirmed' AND public.booking_slot_ranges(b.preferred_time) && public.booking_slot_ranges(new.preferred_time)) THEN
   RAISE EXCEPTION 'A selected time slot is no longer available. Please choose another time.';
  END IF;
 ELSIF new.status = 'confirmed' AND (old.status <> 'confirmed' OR old.booking_date <> new.booking_date OR old.preferred_time <> new.preferred_time) THEN
  IF exists (SELECT 1 FROM public.bookings b WHERE b.booking_date = new.booking_date AND b.status = 'confirmed' AND b.id <> new.id AND public.booking_slot_ranges(b.preferred_time) && public.booking_slot_ranges(new.preferred_time)) THEN
   RAISE EXCEPTION 'Another booking already holds a selected time slot on this date.';
  END IF;
 END IF;
 new.updated_at := now();
 RETURN new;
END $$;