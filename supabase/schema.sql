create table if not exists conversations (
  id         uuid primary key default gen_random_uuid(),
  title      text,
  created_at timestamptz default now()
);

create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant', 'system')),
  content         text not null,
  created_at      timestamptz default now()
);

create index if not exists messages_conversation_id_idx on messages(conversation_id);
