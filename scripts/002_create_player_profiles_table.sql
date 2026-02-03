-- Create player-specific profile data
create table if not exists public.player_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  age integer,
  position text,
  preferred_foot text check (preferred_foot in ('left', 'right', 'both')),
  height_cm integer,
  weight_kg integer,
  experience_years integer,
  current_club text,
  achievements text,
  video_count integer default 0,
  profile_views integer default 0,
  follower_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.player_profiles enable row level security;

-- RLS Policies
create policy "Anyone can view player profiles"
  on public.player_profiles for select
  using (true);

create policy "Players can insert their own profile"
  on public.player_profiles for insert
  with check (auth.uid() = id);

create policy "Players can update their own profile"
  on public.player_profiles for update
  using (auth.uid() = id);

create policy "Players can delete their own profile"
  on public.player_profiles for delete
  using (auth.uid() = id);

-- Create indexes
create index player_profiles_position_idx on public.player_profiles(position);
create index player_profiles_age_idx on public.player_profiles(age);
