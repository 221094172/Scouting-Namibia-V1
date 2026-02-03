-- Create follows table for following players
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(follower_id, following_id)
);

-- Enable RLS
alter table public.follows enable row level security;

-- RLS Policies
create policy "Anyone can view follows"
  on public.follows for select
  using (true);

create policy "Users can follow others"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- Create indexes
create index follows_follower_id_idx on public.follows(follower_id);
create index follows_following_id_idx on public.follows(following_id);
