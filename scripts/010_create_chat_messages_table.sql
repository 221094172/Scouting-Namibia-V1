-- Create chat messages table
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.chat_messages enable row level security;

-- RLS Policies
create policy "Users can view messages in their conversations"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.chat_conversations
      where id = conversation_id
      and (participant_1_id = auth.uid() or participant_2_id = auth.uid())
    )
  );

create policy "Users can insert messages in their conversations"
  on public.chat_messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.chat_conversations
      where id = conversation_id
      and (participant_1_id = auth.uid() or participant_2_id = auth.uid())
    )
  );

-- Create indexes
create index chat_messages_conversation_id_idx on public.chat_messages(conversation_id);
create index chat_messages_sender_id_idx on public.chat_messages(sender_id);
create index chat_messages_created_at_idx on public.chat_messages(created_at desc);
