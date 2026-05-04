-- Run this in Supabase SQL Editor
-- Fixes leaderboard to show consecutive streak days instead of week_checks

drop view if exists public.leaderboard;

create or replace view public.leaderboard as
  with streak_calc as (
    -- For each user, count consecutive days going back from today
    -- where at least 1 habit was completed
    select
      hl.user_id,
      hl.log_date,
      row_number() over (partition by hl.user_id order by hl.log_date desc) as rn,
      (current_date - hl.log_date) as days_ago
    from (
      select distinct user_id, log_date
      from public.habit_logs
      where done = true
    ) hl
  ),
  streaks as (
    select
      user_id,
      count(*) as streak_days
    from streak_calc
    where rn = days_ago + 1  -- consecutive
       or (days_ago = 0)     -- today counts
    group by user_id
  )
  select
    p.id as user_id,
    p.username,
    p.name,
    p.avatar_url,
    count(hl.id) filter (
      where hl.done = true and hl.log_date = current_date
    ) as today_checks,
    count(distinct h.id) as total_habits,
    coalesce(st.streak_days, 0) as streak_days
  from public.profiles p
  left join public.habits h on h.user_id = p.id and h.archived = false
  left join public.habit_logs hl on hl.habit_id = h.id
  left join streaks st on st.user_id = p.id
  where p.is_public = true
     or p.id = auth.uid()
     or exists (
       select 1 from public.friendships f
       where f.status = 'accepted'
         and ((f.requester = auth.uid() and f.addressee = p.id)
           or (f.addressee = auth.uid() and f.requester = p.id))
     )
  group by p.id, p.username, p.name, p.avatar_url, st.streak_days;
