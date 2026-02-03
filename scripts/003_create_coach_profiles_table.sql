-- Create coach-specific profile data
create table if not exists public.coach_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  coaching_license text,
  years_experience integer,
  specialization text,
  current_club text,
  verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.coach_profiles enable row level security;

-- RLS Policies
create policy "Anyone can view coach profiles"
  on public.coach_profiles for select
  using (true);

create policy "Coaches can insert their own profile"
  on public.coach_profiles for insert
  with check (auth.uid() = id);

create policy "Coaches can update their own profile"
  on public.coach_profiles for update
  using (auth.uid() = id);

create policy "Coaches can delete their own profile"
  on public.coach_profiles for delete
  using (auth.uid() = id);
