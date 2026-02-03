-- Create club-specific profile data
create table if not exists public.club_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  club_name text not null,
  founded_year integer,
  league text,
  category text,
  stadium text,
  contact_person text,
  logo_url text,
  verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.club_profiles enable row level security;

-- RLS Policies
create policy "Anyone can view club profiles"
  on public.club_profiles for select
  using (true);

create policy "Clubs can insert their own profile"
  on public.club_profiles for insert
  with check (auth.uid() = id);

create policy "Clubs can update their own profile"
  on public.club_profiles for update
  using (auth.uid() = id);

create policy "Clubs can delete their own profile"
  on public.club_profiles for delete
  using (auth.uid() = id);

-- Create index
create index club_profiles_league_idx on public.club_profiles(league);
