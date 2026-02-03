-- Create comments table for videos
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.comments enable row level security;

-- RLS Policies
create policy "Anyone can view comments"
  on public.comments for select
  using (true);

create policy "Users can insert their own comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own comments"
  on public.comments for update
  using (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- Create indexes
create index comments_video_id_idx on public.comments(video_id);
create index comments_user_id_idx on public.comments(user_id);
create index comments_created_at_idx on public.comments(created_at desc);
