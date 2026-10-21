-- Allow several confirmed bookings on one day, as long as each holds a different time slot.
drop index if exists public.bookings_one_confirmed_per_day;
create index bookings_confirmed_by_date on public.bookings(booking_date) where status = 'confirmed';

-- Slot-level rules: a day is fully booked only when a full-day booking exists or all five time slots are taken.
create or replace function public.validate_booking()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.booking_date < current_date then
      raise exception 'Please choose a future date.';
    end if;
    if new.end_date is not null and new.end_date < new.booking_date then
      raise exception 'End date must be after the start date.';
    end if;
    if exists (select 1 from public.availability a where a.day = new.booking_date and a.status <> 'available') then
      raise exception 'This date is no longer available. Please choose another date.';
    end if;
    if exists (
      select 1 from public.bookings b
      where b.booking_date = new.booking_date and b.status = 'confirmed'
        and (b.preferred_time = 'Full day'
             or (select count(*) from public.bookings b2 where b2.booking_date = b.booking_date and b2.status = 'confirmed') >= 5)
    ) then
      raise exception 'This date is fully booked. Please choose another date.';
    end if;
  else
    -- On update: when a booking is confirmed (or its date/slot changes while confirmed), the slot must be free.
    if new.status = 'confirmed' and (old.status <> 'confirmed' or old.booking_date <> new.booking_date or old.preferred_time <> new.preferred_time) then
      if exists (
        select 1 from public.bookings b
        where b.booking_date = new.booking_date and b.status = 'confirmed' and b.id <> new.id
          and (b.preferred_time = 'Full day' or new.preferred_time = 'Full day' or b.preferred_time = new.preferred_time)
      ) then
        raise exception 'Another booking already holds this time slot on this date.';
      end if;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger bookings_validate on public.bookings;
create trigger bookings_validate before insert or update on public.bookings
  for each row execute function public.validate_booking();

-- Calendar: return a day as blocked only when the studio closed it, or when it is fully booked.
create or replace function public.get_blocked_dates(_from date, _to date)
returns table(day date, status text) language sql stable security definer set search_path = public as $$
  select a.day, a.status::text from public.availability a
    where a.day between _from and _to and a.status <> 'available'
  union
  select b.booking_date, 'booked' from public.bookings b
    where b.booking_date between _from and _to and b.status = 'confirmed'
      and (b.preferred_time = 'Full day'
           or (select count(*) from public.bookings b2 where b2.booking_date = b.booking_date and b2.status = 'confirmed') >= 5)
$$;

-- Which time slots are already taken on a given day (public read-only labels, no personal data).
create or replace function public.get_taken_slots(_day date)
returns table(preferred_time text) language sql stable security definer set search_path = public as $$
  select b.preferred_time from public.bookings b
  where b.booking_date = _day and b.status = 'confirmed'
$$;
grant execute on function public.get_blocked_dates(date, date) to anon, authenticated;
grant execute on function public.get_taken_slots(date) to anon, authenticated;