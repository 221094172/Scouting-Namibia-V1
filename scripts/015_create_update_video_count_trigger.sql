-- Create trigger to update player video count
create or replace function public.update_player_video_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    update public.player_profiles
    set video_count = video_count + 1
    where id = new.user_id;
  elsif TG_OP = 'DELETE' then
    update public.player_profiles
    set video_count = video_count - 1
    where id = old.user_id;
  end if;
  return null;
end;
$$;

-- Create trigger
drop trigger if exists update_video_count on public.videos;

create trigger update_video_count
  after insert or delete on public.videos
  for each row
  execute function public.update_player_video_count();
