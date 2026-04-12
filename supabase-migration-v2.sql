-- ============================================================
-- Seret v2 — Migration for new features
-- Run this AFTER supabase-schema.sql in the Supabase SQL Editor
-- ============================================================

-- 1. Extend library_items with status, viewing context, priority, comment
alter table public.library_items add column if not exists status text default 'watched' check (status in ('watched', 'to_watch'));
alter table public.library_items add column if not exists viewing_context text check (viewing_context in ('solo', 'couple', 'family', 'friends') or viewing_context is null);
alter table public.library_items add column if not exists priority int default 0;
alter table public.library_items add column if not exists comment text;
alter table public.library_items add column if not exists not_interested boolean default false;
alter table public.library_items add column if not exists content_type text default 'movie' check (content_type in ('movie', 'tv', 'documentary', 'anime'));

-- 2. User stats (points, streak, badges)
create table if not exists public.user_stats (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  points int default 0,
  streak_days int default 0,
  last_activity_date date,
  badges text[] default '{}',
  updated_at timestamptz default now()
);

alter table public.user_stats enable row level security;

create policy "Users can read own stats"
  on public.user_stats for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Friends can read each others stats"
  on public.user_stats for select
  to authenticated
  using (
    exists (
      select 1 from public.friendships
      where status = 'accepted'
        and (
          (user_id = auth.uid() and friend_id = user_stats.user_id)
          or (friend_id = auth.uid() and user_id = user_stats.user_id)
        )
    )
  );

create policy "Users can insert own stats"
  on public.user_stats for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own stats"
  on public.user_stats for update
  to authenticated
  using (auth.uid() = user_id);

-- 3. User events (for AI behavior tracking)
create table if not exists public.user_events (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  event_type text not null,
  tmdb_id int,
  media_type text,
  metadata jsonb,
  created_at timestamptz default now()
);

alter table public.user_events enable row level security;

create policy "Users can read own events"
  on public.user_events for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own events"
  on public.user_events for insert
  to authenticated
  with check (auth.uid() = user_id);

create index if not exists idx_events_user on public.user_events(user_id, created_at desc);

-- 4. Reactions on friend items
create table if not exists public.reactions (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  target_user_id uuid references public.profiles(id) on delete cascade not null,
  tmdb_id int not null,
  media_type text not null,
  emoji text not null,
  created_at timestamptz default now(),
  unique (user_id, target_user_id, tmdb_id, media_type, emoji)
);

alter table public.reactions enable row level security;

create policy "Reactions visible to both parties"
  on public.reactions for select
  to authenticated
  using (auth.uid() = user_id or auth.uid() = target_user_id);

create policy "Users can create reactions"
  on public.reactions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own reactions"
  on public.reactions for delete
  to authenticated
  using (auth.uid() = user_id);

-- 5. Challenges between friends
create table if not exists public.challenges (
  id bigint generated always as identity primary key,
  from_user_id uuid references public.profiles(id) on delete cascade not null,
  to_user_id uuid references public.profiles(id) on delete cascade not null,
  tmdb_id int not null,
  media_type text not null,
  title text not null,
  poster text,
  message text,
  status text default 'pending' check (status in ('pending', 'accepted', 'completed')),
  created_at timestamptz default now()
);

alter table public.challenges enable row level security;

create policy "Challenges visible to both parties"
  on public.challenges for select
  to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Users can send challenges"
  on public.challenges for insert
  to authenticated
  with check (auth.uid() = from_user_id);

create policy "Recipients can update challenges"
  on public.challenges for update
  to authenticated
  using (auth.uid() = to_user_id);
