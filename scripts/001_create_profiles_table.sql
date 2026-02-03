-- Create profiles table that extends auth.users with role-specific data
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null check (role in ('player', 'coach', 'club')),
  region text,
  town text,
  bio text,
  phone_number text,
  profile_image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS Policies for profiles
create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- Create index for faster queries
create index profiles_role_idx on public.profiles(role);
create index profiles_region_idx on public.profiles(region);
create index profiles_town_idx on public.profiles(town);
