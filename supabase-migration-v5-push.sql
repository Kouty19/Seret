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
