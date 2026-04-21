-- Migration v6 — Cinema Night polls

create table if not exists public.cinema_polls (
  id bigserial primary key,
  creator_id uuid not null references auth.users(id) on delete cascade,
  candidates jsonb not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists cinema_polls_creator_idx on public.cinema_polls(creator_id);

alter table public.cinema_polls enable row level security;
drop policy if exists cinema_polls_all on public.cinema_polls;
-- Any authenticated user can read any poll (shared via link)
create policy cinema_polls_read on public.cinema_polls for select using (auth.uid() is not null);
create policy cinema_polls_insert on public.cinema_polls for insert with check (creator_id = auth.uid());
create policy cinema_polls_owner on public.cinema_polls for update using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy cinema_polls_del on public.cinema_polls for delete using (creator_id = auth.uid());

create table if not exists public.cinema_votes (
  id bigserial primary key,
  poll_id bigint not null references public.cinema_polls(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  candidate_index int not null,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

alter table public.cinema_votes enable row level security;
drop policy if exists cinema_votes_owner on public.cinema_votes;
create policy cinema_votes_read on public.cinema_votes for select using (auth.uid() is not null);
create policy cinema_votes_write on public.cinema_votes for insert with check (user_id = auth.uid());
create policy cinema_votes_update on public.cinema_votes for update using (user_id = auth.uid()) with check (user_id = auth.uid());
