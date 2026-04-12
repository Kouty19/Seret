-- ============================================================
-- Seret v3 — Migration for profiles, journal, social layer
-- Run this AFTER v2 migration
-- ============================================================

-- 1. Multi-profiles per account (like Netflix)
create table if not exists public.user_profiles (
  id bigint generated always as identity primary key,
  account_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  avatar text default '🧘',
  kind text default 'solo' check (kind in ('solo', 'couple', 'family', 'kid')),
  created_at timestamptz default now()
);

alter table public.user_profiles enable row level security;

create policy "Users manage own sub-profiles"
  on public.user_profiles for all
  to authenticated
  using (auth.uid() = account_id)
  with check (auth.uid() = account_id);

-- 2. Add profile_id to library_items (nullable for backward compat)
alter table public.library_items add column if not exists profile_id bigint references public.user_profiles(id) on delete cascade;

-- 3. Private journal entries
create table if not exists public.journal_entries (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  profile_id bigint references public.user_profiles(id) on delete cascade,
  tmdb_id int not null,
  media_type text not null,
  entry text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, profile_id, tmdb_id, media_type)
);

alter table public.journal_entries enable row level security;

create policy "Users manage own journal"
  on public.journal_entries for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Friend recommendations (personal picks sent to friends)
create table if not exists public.recommendations (
  id bigint generated always as identity primary key,
  from_user_id uuid references public.profiles(id) on delete cascade not null,
  to_user_id uuid references public.profiles(id) on delete cascade not null,
  tmdb_id int not null,
  media_type text not null,
  title text not null,
  poster text,
  message text,
  status text default 'sent' check (status in ('sent', 'seen', 'watched', 'dismissed')),
  created_at timestamptz default now()
);

alter table public.recommendations enable row level security;

create policy "Recos visible to both"
  on public.recommendations for select
  to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Send recos"
  on public.recommendations for insert
  to authenticated
  with check (auth.uid() = from_user_id);

create policy "Receiver updates status"
  on public.recommendations for update
  to authenticated
  using (auth.uid() = to_user_id);

-- 5. Calibration likes/dislikes from onboarding
create table if not exists public.calibration (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  profile_id bigint references public.user_profiles(id) on delete cascade,
  tmdb_id int not null,
  media_type text not null,
  liked boolean not null,
  created_at timestamptz default now(),
  unique (user_id, profile_id, tmdb_id, media_type)
);

alter table public.calibration enable row level security;

create policy "Users manage own calibration"
  on public.calibration for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
