-- Create chat conversations table
create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  participant_1_id uuid not null references auth.users(id) on delete cascade,
  participant_2_id uuid not null references auth.users(id) on delete cascade,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(participant_1_id, participant_2_id)
);

-- Enable RLS
alter table public.chat_conversations enable row level security;

-- RLS Policies
create policy "Users can view their own conversations"
  on public.chat_conversations for select
  using (auth.uid() = participant_1_id or auth.uid() = participant_2_id);

create policy "Users can insert conversations they are part of"
  on public.chat_conversations for insert
  with check (auth.uid() = participant_1_id or auth.uid() = participant_2_id);

create policy "Users can update their own conversations"
  on public.chat_conversations for update
  using (auth.uid() = participant_1_id or auth.uid() = participant_2_id);

-- Create indexes
create index chat_conversations_participant_1_idx on public.chat_conversations(participant_1_id);
create index chat_conversations_participant_2_idx on public.chat_conversations(participant_2_id);
create index chat_conversations_last_message_idx on public.chat_conversations(last_message_at desc);
