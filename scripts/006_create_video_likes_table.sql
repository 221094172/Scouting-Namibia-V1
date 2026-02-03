-- Create video likes table
create table if not exists public.video_likes (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(video_id, user_id)
);

-- Enable RLS
alter table public.video_likes enable row level security;

-- RLS Policies
create policy "Anyone can view likes"
  on public.video_likes for select
  using (true);

create policy "Users can insert their own likes"
  on public.video_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own likes"
  on public.video_likes for delete
  using (auth.uid() = user_id);

-- Create indexes
create index video_likes_video_id_idx on public.video_likes(video_id);
create index video_likes_user_id_idx on public.video_likes(user_id);
