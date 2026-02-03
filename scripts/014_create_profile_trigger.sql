-- Create trigger function to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role, region, town)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', 'User'),
    coalesce(new.raw_user_meta_data ->> 'role', 'player'),
    coalesce(new.raw_user_meta_data ->> 'region', null),
    coalesce(new.raw_user_meta_data ->> 'town', null)
  )
  on conflict (id) do nothing;

  -- Create role-specific profile
  if (new.raw_user_meta_data ->> 'role') = 'player' then
    insert into public.player_profiles (id)
    values (new.id)
    on conflict (id) do nothing;
  elsif (new.raw_user_meta_data ->> 'role') = 'coach' then
    insert into public.coach_profiles (id)
    values (new.id)
    on conflict (id) do nothing;
  elsif (new.raw_user_meta_data ->> 'role') = 'club' then
    insert into public.club_profiles (
      id,
      club_name
    )
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'club_name', 'Unnamed Club')
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

-- Drop trigger if exists and create new one
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
