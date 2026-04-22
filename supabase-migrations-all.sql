-- Migration v4 — Stories 24h + reactions
-- Run this in Supabase SQL editor.

create table if not exists public.stories (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id bigint references public.user_profiles(id) on delete cascade,
  tmdb_id bigint not null,
  media_type text not null check (media_type in ('movie','tv')),
  title text not null,
  poster text,
  rating int not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index if not exists stories_user_id_idx on public.stories(user_id);
create index if not exists stories_expires_at_idx on public.stories(expires_at);

alter table public.stories enable row level security;

-- Owners can manage their own stories
drop policy if exists stories_owner_all on public.stories;
create policy stories_owner_all on public.stories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Friends can read each other's non-expired stories
drop policy if exists stories_friends_read on public.stories;
create policy stories_friends_read on public.stories
  for select using (
    expires_at > now() and (
      user_id = auth.uid() or exists (
        select 1 from public.friendships f
        where f.status = 'accepted' and (
          (f.user_id = auth.uid() and f.friend_id = stories.user_id) or
          (f.friend_id = auth.uid() and f.user_id = stories.user_id)
        )
      )
    )
  );

create table if not exists public.story_reactions (
  id bigserial primary key,
  story_id bigint not null references public.stories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (story_id, user_id, emoji)
);

create index if not exists story_reactions_story_id_idx on public.story_reactions(story_id);

alter table public.story_reactions enable row level security;

drop policy if exists story_reactions_owner_all on public.story_reactions;
create policy story_reactions_owner_all on public.story_reactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists story_reactions_author_read on public.story_reactions;
create policy story_reactions_author_read on public.story_reactions
  for select using (
    user_id = auth.uid() or exists (
      select 1 from public.stories s where s.id = story_reactions.story_id and s.user_id = auth.uid()
    )
  );

-- Optional: cron/pg_cron cleanup (Supabase offers pg_cron extension)
-- select cron.schedule('stories-cleanup', '0 * * * *', $$ delete from public.stories where expires_at < now() - interval '7 days' $$);
-- Migration v5 — Web Push subscriptions

create table if not exists public.push_subscriptions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_sub_user_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists push_sub_owner on public.push_subscriptions;
create policy push_sub_owner on public.push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- When you're ready to actually send push notifications, you'll need:
--   1. VAPID key pair (generate via `npx web-push generate-vapid-keys`)
--   2. Set env vars VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY on Vercel
--   3. Expose the public key at /api/vapid-public-key (already wired in server.js)
--   4. A scheduled job or trigger that iterates push_subscriptions and POSTs
--      to each endpoint using the Web Push protocol (npm `web-push` package).
--
-- The client-side subscription save is already wired (see enablePushNotifications()).
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
