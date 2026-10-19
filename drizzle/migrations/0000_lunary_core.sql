
create type public.app_role as enum ('admin');
create type public.service_type as enum ('graduation','birthday','wedding','engagement','events');
create type public.booking_status as enum ('pending','confirmed','rejected','cancelled');
create type public.day_status as enum ('available','unavailable','booked');
create type public.portfolio_category as enum ('graduation','birthday','wedding','engagement','events');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid());

create or replace function public.handle_owner_signup()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if lower(new.email) = 'sanjanakaveen2000@gmail.com' then
    insert into public.user_roles(user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_created_owner after insert on auth.users
  for each row execute function public.handle_owner_signup();

create table public.availability (
  day date primary key,
  status public.day_status not null default 'unavailable',
  note text,
  updated_at timestamptz not null default now()
);
grant select on public.availability to anon, authenticated;
grant insert, update, delete on public.availability to authenticated;
grant all on public.availability to service_role;
alter table public.availability enable row level security;
create policy "Anyone can view availability" on public.availability for select to anon, authenticated using (true);
create policy "Admins manage availability" on public.availability for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 255),
  phone text not null check (char_length(phone) between 5 and 30),
  service public.service_type not null,
  booking_date date not null,
  end_date date,
  preferred_time text not null check (char_length(preferred_time) <= 60),
  location text not null check (char_length(location) <= 200),
  message text check (char_length(message) <= 2000),
  status public.booking_status not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index bookings_one_confirmed_per_day on public.bookings(booking_date) where status = 'confirmed';
grant insert on public.bookings to anon, authenticated;
grant select, update, delete on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;
create policy "Public can request bookings" on public.bookings for insert to anon, authenticated
  with check (status = 'pending' and admin_note is null);
create policy "Admins read bookings" on public.bookings for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Admins update bookings" on public.bookings for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "Admins delete bookings" on public.bookings for delete to authenticated using (public.has_role(auth.uid(),'admin'));

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
    if exists (select 1 from public.availability a where a.day = new.booking_date and a.status <> 'available')
       or exists (select 1 from public.bookings b where b.booking_date = new.booking_date and b.status = 'confirmed') then
      raise exception 'This date is no longer available. Please choose another date.';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger bookings_validate before insert or update on public.bookings
  for each row execute function public.validate_booking();

create or replace function public.get_blocked_dates(_from date, _to date)
returns table(day date, status text) language sql stable security definer set search_path = public as $$
  select a.day, a.status::text from public.availability a
    where a.day between _from and _to and a.status <> 'available'
  union
  select b.booking_date, 'booked' from public.bookings b
    where b.booking_date between _from and _to and b.status = 'confirmed'
$$;
grant execute on function public.get_blocked_dates(date, date) to anon, authenticated;

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 255),
  service text check (char_length(service) <= 60),
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);
grant insert on public.contact_messages to anon, authenticated;
grant select, delete on public.contact_messages to authenticated;
grant all on public.contact_messages to service_role;
alter table public.contact_messages enable row level security;
create policy "Public can send messages" on public.contact_messages for insert to anon, authenticated with check (true);
create policy "Admins read messages" on public.contact_messages for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Admins delete messages" on public.contact_messages for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.portfolio_photos (
  id uuid primary key default gen_random_uuid(),
  category public.portfolio_category not null,
  storage_path text not null,
  alt text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.portfolio_photos to anon, authenticated;
grant insert, update, delete on public.portfolio_photos to authenticated;
grant all on public.portfolio_photos to service_role;
alter table public.portfolio_photos enable row level security;
create policy "Anyone views portfolio" on public.portfolio_photos for select to anon, authenticated using (true);
create policy "Admins manage portfolio" on public.portfolio_photos for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "Public read portfolio images" on storage.objects for select to anon, authenticated using (bucket_id = 'portfolio');
create policy "Admins upload portfolio images" on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio' and public.has_role(auth.uid(),'admin'));
create policy "Admins delete portfolio images" on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio' and public.has_role(auth.uid(),'admin'));
