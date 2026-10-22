alter type public.service_type add value if not exists 'casual';

-- Hour range a time slot occupies, so hourly graduation slots and longer slots can be compared.
create or replace function public.slot_range(t text)
returns int4range language sql immutable set search_path = public as $$
  select case
    when t = 'Full day' then int4range(0, 24)
    when t like 'Morning%' then int4range(8, 12)
    when t like 'Afternoon%' then int4range(12, 16)
    when t like 'Golden hour%' then int4range(16, 19)
    when t like 'Evening%' then int4range(19, 24)
    when t ~ '^\d{2}:00' then int4range(substr(t,1,2)::int, substr(t,1,2)::int + 1)
    else int4range(0, 24)
  end
$$;

-- A day is full when every hour from 8am to midnight is covered by confirmed bookings.
create or replace function public.is_day_full(_day date)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.bookings where booking_date = _day and status = 'confirmed')
    and not exists (
      select 1 from generate_series(8, 23) h
      where not exists (
        select 1 from public.bookings b
        where b.booking_date = _day and b.status = 'confirmed' and public.slot_range(b.preferred_time) @> h
      )
    )
$$;

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
    if public.is_day_full(new.booking_date) then
      raise exception 'This date is fully booked. Please choose another date.';
    end if;
    if exists (
      select 1 from public.bookings b
      where b.booking_date = new.booking_date and b.status = 'confirmed'
        and public.slot_range(b.preferred_time) && public.slot_range(new.preferred_time)
    ) then
      raise exception 'This time slot is no longer available. Please choose another time.';
    end if;
  else
    if new.status = 'confirmed' and (old.status <> 'confirmed' or old.booking_date <> new.booking_date or old.preferred_time <> new.preferred_time) then
      if exists (
        select 1 from public.bookings b
        where b.booking_date = new.booking_date and b.status = 'confirmed' and b.id <> new.id
          and public.slot_range(b.preferred_time) && public.slot_range(new.preferred_time)
      ) then
        raise exception 'Another booking already holds this time slot on this date.';
      end if;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

create or replace function public.get_blocked_dates(_from date, _to date)
returns table(day date, status text) language sql stable security definer set search_path = public as $$
  select a.day, a.status::text from public.availability a
    where a.day between _from and _to and a.status <> 'available'
  union
  select d.booking_date, 'booked' from (
    select distinct booking_date from public.bookings
    where booking_date between _from and _to and status = 'confirmed'
  ) d where public.is_day_full(d.booking_date)
$$;
grant execute on function public.get_blocked_dates(date, date) to anon, authenticated;