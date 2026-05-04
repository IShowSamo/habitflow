-- Run this in Supabase SQL Editor to fix the leaderboard view

drop view if exists public.leaderboard;

create or replace view public.leaderboard as
  select
    p.id as user_id,
    p.username,
    p.name,
    p.avatar_url,
    count(hl.id) filter (
      where hl.done = true 
      and hl.log_date >= current_date - 6
      and hl.log_date <= current_date
    ) as week_checks,
    count(hl.id) filter (
      where hl.done = true 
      and hl.log_date = current_date
    ) as today_checks,
    count(distinct h.id) as total_habits
  from public.profiles p
  left join public.habits h on h.user_id = p.id and h.archived = false
  left join public.habit_logs hl on hl.habit_id = h.id
  where p.is_public = true
     or p.id = auth.uid()
     or exists (
       select 1 from public.friendships f
       where f.status = 'accepted'
         and ((f.requester = auth.uid() and f.addressee = p.id)
           or (f.addressee = auth.uid() and f.requester = p.id))
     )
  group by p.id, p.username, p.name, p.avatar_url;
