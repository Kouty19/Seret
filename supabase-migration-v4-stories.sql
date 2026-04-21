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
