-- Create saved players table for coaches and clubs to bookmark players
create table if not exists public.saved_players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references auth.users(id) on delete cascade,
  category text, -- e.g., "For Tryouts", "Potential Star"
  notes text,
  created_at timestamptz default now(),
  unique(user_id, player_id)
);

-- Enable RLS
alter table public.saved_players enable row level security;

-- RLS Policies
create policy "Users can view their own saved players"
  on public.saved_players for select
  using (auth.uid() = user_id);

create policy "Users can insert their own saved players"
  on public.saved_players for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own saved players"
  on public.saved_players for update
  using (auth.uid() = user_id);

create policy "Users can delete their own saved players"
  on public.saved_players for delete
  using (auth.uid() = user_id);

-- Create indexes
create index saved_players_user_id_idx on public.saved_players(user_id);
create index saved_players_player_id_idx on public.saved_players(player_id);
