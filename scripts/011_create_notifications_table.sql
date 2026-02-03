-- Create notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('like', 'comment', 'save', 'message', 'follow')),
  title text not null,
  content text,
  link text,
  read boolean default false,
  from_user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.notifications enable row level security;

-- RLS Policies
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "System can insert notifications"
  on public.notifications for insert
  with check (true);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- Create indexes
create index notifications_user_id_idx on public.notifications(user_id);
create index notifications_created_at_idx on public.notifications(created_at desc);
create index notifications_read_idx on public.notifications(read);
