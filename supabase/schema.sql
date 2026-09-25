create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  telegram_chat_id bigint not null,
  telegram_message_id bigint not null unique,
  content text not null,
  score numeric(5,2),
  status text not null default 'pending',
  rejection_reason text,
  created_at timestamptz not null default now()
);

create table if not exists drafts (
  id uuid primary key default gen_random_uuid(),
  note_id uuid references notes(id) on delete cascade,
  telegram_message_id bigint unique,
  draft_text text not null,
  status text not null default 'pending',
  decision_reason text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists voice_skill (
  id uuid primary key default gen_random_uuid(),
  skill_name text not null unique,
  tone_prompt text not null,
  created_at timestamptz not null default now()
);

insert into voice_skill (skill_name, tone_prompt)
values (
  'founder_voice',
  'Write concise, sharp, founder-led business updates that sound confident, practical, and specific. Prefer clear claims, concrete numbers, and a strong point of view without sounding inflated or promotional.'
)
on conflict (skill_name) do nothing;
