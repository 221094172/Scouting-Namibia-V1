-- Create videos table for player showcase videos
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  video_url text not null,
  thumbnail_url text,
  duration_seconds integer,
  position text,
  region text,
  town text,
  view_count integer default 0,
  like_count integer default 0,
  comment_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.videos enable row level security;

-- RLS Policies
create policy "Anyone can view videos"
  on public.videos for select
  using (true);

create policy "Users can insert their own videos"
  on public.videos for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own videos"
  on public.videos for update
  using (auth.uid() = user_id);

create policy "Users can delete their own videos"
  on public.videos for delete
  using (auth.uid() = user_id);

-- Create indexes
create index videos_user_id_idx on public.videos(user_id);
create index videos_region_idx on public.videos(region);
create index videos_town_idx on public.videos(town);
create index videos_position_idx on public.videos(position);
create index videos_created_at_idx on public.videos(created_at desc);
