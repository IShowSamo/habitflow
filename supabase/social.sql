-- ─────────────────────────────────────────────────────────────────────────────
-- Run this in Supabase SQL Editor AFTER the base schema.sql
-- Adds: usernames, friend requests, public profiles, leaderboard view
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Add username + bio + public flag to profiles ──────────────────────────────
alter table public.profiles
  add column if not exists username   text unique,
  add column if not exists bio        text default '',
  add column if not exists is_public  boolean default true,
  add column if not exists updated_at timestamptz default now();

-- Username index for fast lookup
create unique index if not exists profiles_username_idx on public.profiles (lower(username));

-- ── Friendships ───────────────────────────────────────────────────────────────
-- status: 'pending' | 'accepted' | 'blocked'
create table if not exists public.friendships (
  id          uuid default uuid_generate_v4() primary key,
  requester   uuid references auth.users on delete cascade not null,
  addressee   uuid references auth.users on delete cascade not null,
  status      text not null default 'pending' check (status in ('pending','accepted','blocked')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (requester, addressee)
);
alter table public.friendships enable row level security;

-- Users can see friendships they're part of
create policy "See own friendships" on public.friendships
  for select using (auth.uid() = requester or auth.uid() = addressee);

-- Send a friend request
create policy "Send friend request" on public.friendships
  for insert with check (auth.uid() = requester);

-- Accept / block / cancel (only parties involved)
create policy "Manage own friendships" on public.friendships
  for update using (auth.uid() = requester or auth.uid() = addressee);

create policy "Delete own friendships" on public.friendships
  for delete using (auth.uid() = requester or auth.uid() = addressee);

-- ── Public habit_logs view (only for public profiles + accepted friends) ──────
-- We expose a view so friends can read each other's logs
create or replace view public.friend_logs as
  select
    hl.habit_id,
    hl.log_date,
    hl.done,
    hl.user_id,
    p.username,
    p.name,
    p.avatar_url
  from public.habit_logs hl
  join public.profiles p on p.id = hl.user_id
  where p.is_public = true
     or hl.user_id = auth.uid()
     or exists (
       select 1 from public.friendships f
       where f.status = 'accepted'
         and ((f.requester = auth.uid() and f.addressee = hl.user_id)
           or (f.addressee = auth.uid() and f.requester = hl.user_id))
     );

-- ── Public habits view ────────────────────────────────────────────────────────
create or replace view public.friend_habits as
  select
    h.id, h.user_id, h.name, h.icon, h.color, h.sort_order,
    p.username, p.name as user_name, p.avatar_url
  from public.habits h
  join public.profiles p on p.id = h.user_id
  where h.archived = false
    and (
      p.is_public = true
      or h.user_id = auth.uid()
      or exists (
        select 1 from public.friendships f
        where f.status = 'accepted'
          and ((f.requester = auth.uid() and f.addressee = h.user_id)
            or (f.addressee = auth.uid() and f.requester = h.user_id))
      )
    );

-- ── Leaderboard view (friends only, last 7 days) ──────────────────────────────
create or replace view public.leaderboard as
  select
    p.id as user_id,
    p.username,
    p.name,
    p.avatar_url,
    count(hl.id) filter (where hl.done = true and hl.log_date >= current_date - 7) as week_checks,
    count(hl.id) filter (where hl.done = true and hl.log_date = current_date)       as today_checks,
    count(distinct h.id) as total_habits
  from public.profiles p
  left join public.habits h    on h.user_id = p.id and h.archived = false
  left join public.habit_logs hl on hl.user_id = p.id
  where p.is_public = true
     or p.id = auth.uid()
     or exists (
       select 1 from public.friendships f
       where f.status = 'accepted'
         and ((f.requester = auth.uid() and f.addressee = p.id)
           or (f.addressee = auth.uid() and f.requester = p.id))
     )
  group by p.id, p.username, p.name, p.avatar_url;

-- ── Add username on signup (update trigger) ───────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
begin
  base_username := lower(regexp_replace(split_part(new.email,'@',1), '[^a-z0-9]', '', 'g'));
  if length(base_username) < 3 then base_username := 'user'; end if;
  final_username := base_username;

  loop
    begin
      insert into public.profiles (id, email, name, username)
      values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), final_username);
      exit;
    exception when unique_violation then
      suffix := suffix + 1;
      final_username := base_username || suffix::text;
    end;
  end loop;
  return new;
end;
$$;
