-- Run in Supabase SQL editor
-- Safe to run multiple times.

create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  prompt_date date not null unique,
  title text not null,
  body text not null,
  source text not null default 'curated',
  created_at timestamptz not null default now()
);

create index if not exists prompts_prompt_date_idx on public.prompts(prompt_date desc);

alter table public.prompts enable row level security;

create policy "authenticated_can_read_prompts"
  on public.prompts
  for select
  using (auth.role() = 'authenticated');

create policy "authenticated_can_insert_prompts"
  on public.prompts
  for insert
  with check (auth.role() = 'authenticated');

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  prompt_id uuid references public.prompts(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.entries
  add column if not exists prompt_id uuid references public.prompts(id) on delete cascade;

create index if not exists entries_user_id_idx on public.entries(user_id);
create index if not exists entries_entry_date_idx on public.entries(entry_date desc);

alter table public.entries enable row level security;

create policy "users_can_select_own_entries"
  on public.entries
  for select
  using (auth.uid() = user_id);

create policy "users_can_insert_own_entries"
  on public.entries
  for insert
  with check (auth.uid() = user_id);

create policy "users_can_update_own_entries"
  on public.entries
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create unique index if not exists entries_one_per_day_per_user
  on public.entries (user_id, entry_date);

create unique index if not exists entries_one_per_prompt_per_user
  on public.entries (user_id, prompt_id)
  where prompt_id is not null;
