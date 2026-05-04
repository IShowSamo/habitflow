-- Run this in your Supabase SQL Editor (supabase.com → SQL Editor)
-- Creates all tables with Row Level Security so each user only sees their own data

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Profiles ────────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text,
  name        text,
  avatar_url  text,
  created_at  timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users see own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Habits ──────────────────────────────────────────────────────────────────
create table public.habits (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references auth.users on delete cascade not null,
  name        text not null,
  icon        text not null default '⭐',
  color       text not null default '#6c63ff',
  notif_time  text default '08:00',
  notif_on    boolean default true,
  sort_order  integer default 0,
  archived    boolean default false,
  created_at  timestamptz default now()
);
alter table public.habits enable row level security;
create policy "Users manage own habits" on public.habits for all using (auth.uid() = user_id);

-- ── Habit logs ───────────────────────────────────────────────────────────────
create table public.habit_logs (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references auth.users on delete cascade not null,
  habit_id    uuid references public.habits on delete cascade not null,
  log_date    date not null,
  done        boolean default true,
  created_at  timestamptz default now(),
  unique(habit_id, log_date)
);
alter table public.habit_logs enable row level security;
create policy "Users manage own logs" on public.habit_logs for all using (auth.uid() = user_id);

-- Indexes for performance
create index on public.habit_logs (user_id, log_date);
create index on public.habit_logs (habit_id, log_date);
create index on public.habits (user_id, sort_order);
