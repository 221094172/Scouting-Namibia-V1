-- Create club vacancies table
create table if not exists public.club_vacancies (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  position text not null,
  requirements text,
  location text,
  application_deadline timestamptz,
  status text default 'open' check (status in ('open', 'closed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.club_vacancies enable row level security;

-- RLS Policies
create policy "Anyone can view open vacancies"
  on public.club_vacancies for select
  using (status = 'open');

create policy "Clubs can insert their own vacancies"
  on public.club_vacancies for insert
  with check (auth.uid() = club_id);

create policy "Clubs can update their own vacancies"
  on public.club_vacancies for update
  using (auth.uid() = club_id);

create policy "Clubs can delete their own vacancies"
  on public.club_vacancies for delete
  using (auth.uid() = club_id);

-- Create indexes
create index club_vacancies_club_id_idx on public.club_vacancies(club_id);
create index club_vacancies_status_idx on public.club_vacancies(status);
create index club_vacancies_position_idx on public.club_vacancies(position);
