-- ============================================================
-- Seret — Supabase Schema
-- Run this in the Supabase SQL Editor to set up your database
-- ============================================================

-- 1. Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  share_code text unique default substr(md5(random()::text), 1, 8),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Anyone can read profiles (needed for friend search)
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can update only their own profile
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Library items
create table public.library_items (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  tmdb_id int not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  year text,
  poster text,
  backdrop text,
  overview text,
  rating real,
  user_rating int default 0 check (user_rating between 0 and 10),
  added_at timestamptz default now(),
  unique (user_id, tmdb_id, media_type)
);

alter table public.library_items enable row level security;

-- Users can read their own library
create policy "Users can read own library"
  on public.library_items for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can insert/update/delete their own library items
create policy "Users can insert own library items"
  on public.library_items for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own library items"
  on public.library_items for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own library items"
  on public.library_items for delete
  to authenticated
  using (auth.uid() = user_id);

-- Index for fast lookups
create index idx_library_user on public.library_items(user_id);

-- 3. Friendships
create table public.friendships (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  friend_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz default now(),
  unique (user_id, friend_id),
  check (user_id <> friend_id)
);

alter table public.friendships enable row level security;

-- Users can see friendships they're part of
create policy "Users can see own friendships"
  on public.friendships for select
  to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- Users can send friend requests
create policy "Users can send friend requests"
  on public.friendships for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can accept/reject requests sent to them
create policy "Users can update requests sent to them"
  on public.friendships for update
  to authenticated
  using (auth.uid() = friend_id);

-- Users can delete friendships they're part of
create policy "Users can delete own friendships"
  on public.friendships for delete
  to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

create index idx_friendships_user on public.friendships(user_id);
create index idx_friendships_friend on public.friendships(friend_id);

-- 4. Policy that depends on friendships table (must come after friendships is created)
-- Users can read friends' libraries (accepted friendships)
create policy "Users can read friends libraries"
  on public.library_items for select
  to authenticated
  using (
    exists (
      select 1 from public.friendships
      where status = 'accepted'
        and (
          (user_id = auth.uid() and friend_id = library_items.user_id)
          or (friend_id = auth.uid() and user_id = library_items.user_id)
        )
    )
  );
