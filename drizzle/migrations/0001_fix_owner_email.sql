-- Owner email corrected to sanjanakavee2000@gmail.com (previous spelling had an extra "n").
create or replace function public.handle_owner_signup()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if lower(new.email) = 'sanjanakavee2000@gmail.com' then
    insert into public.user_roles(user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;

-- If the owner already signed up with the corrected address, grant admin now.
insert into public.user_roles(user_id, role)
  select id, 'admin' from auth.users where lower(email) = 'sanjanakavee2000@gmail.com'
  on conflict do nothing;
