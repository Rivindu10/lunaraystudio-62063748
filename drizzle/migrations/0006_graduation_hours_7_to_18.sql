-- Graduation hourly slots now run 7:00–18:00, so a day counts as full only once every hour from 7am is covered.
create or replace function public.is_day_full(_day date)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.bookings where booking_date = _day and status = 'confirmed')
    and not exists (
      select 1 from generate_series(7, 23) h
      where not exists (
        select 1 from public.bookings b
        where b.booking_date = _day and b.status = 'confirmed' and public.slot_range(b.preferred_time) @> h
      )
    )
$$;