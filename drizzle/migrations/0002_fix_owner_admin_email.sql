CREATE OR REPLACE FUNCTION public.handle_owner_signup() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  if lower(new.email) in ('sanjanakavee2000@gmail.com','sanjanakaveen2000@gmail.com') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;
INSERT INTO public.user_roles(user_id, role) SELECT id, 'admin'::app_role FROM auth.users WHERE lower(email)='sanjanakavee2000@gmail.com' ON CONFLICT DO NOTHING;