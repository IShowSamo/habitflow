import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { format, subDays, startOfMonth, eachDayOfInterval } from 'date-fns'

export const useSocialStore = create((set, get) => ({
  friends: [],          // accepted friendships with profile info
  requests: [],         // incoming pending requests
  leaderboard: [],      // leaderboard entries
  viewedProfile: null,  // { profile, habits, logs, streaks }
  searchResults: [],
  loading: false,

  // ── Fetch accepted friends ─────────────────────────────────────────────────
  fetchFriends: async (myId) => {
    const { data } = await supabase
      .from('friendships')
      .select(`
        id, status, requester, addressee,
        requester_profile:profiles!friendships_requester_fkey(id,username,name,avatar_url),
        addressee_profile:profiles!friendships_addressee_fkey(id,username,name,avatar_url)
      `)
      .eq('status', 'accepted')
      .or(`requester.eq.${myId},addressee.eq.${myId}`)

    const friends = (data || []).map(f => {
      const isMine = f.requester === myId
      return {
        friendshipId: f.id,
        ...( isMine ? f.addressee_profile : f.requester_profile )
      }
    })
    set({ friends })
  },

  // ── Fetch incoming requests ────────────────────────────────────────────────
  fetchRequests: async (myId) => {
    const { data } = await supabase
      .from('friendships')
      .select(`id, requester, requester_profile:profiles!friendships_requester_fkey(id,username,name,avatar_url)`)
      .eq('addressee', myId)
      .eq('status', 'pending')
    set({ requests: (data || []).map(r => ({ friendshipId: r.id, ...r.requester_profile })) })
  },

  // ── Search users by username ───────────────────────────────────────────────
  searchUsers: async (query) => {
    if (!query || query.length < 2) { set({ searchResults: [] }); return }
    // Search by username OR name
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, name, avatar_url, is_public')
      .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
      .eq('is_public', true)
      .limit(15)
    if (error) console.error('Search error:', error)
    set({ searchResults: data || [] })
  },

  // ── Send friend request ────────────────────────────────────────────────────
  sendRequest: async (myId, toUserId) => {
    const { error } = await supabase.from('friendships').insert({
      requester: myId, addressee: toUserId, status: 'pending'
    })
    return !error
  },

  // ── Accept request ─────────────────────────────────────────────────────────
  acceptRequest: async (friendshipId, myId) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
    await get().fetchRequests(myId)
    await get().fetchFriends(myId)
  },

  // ── Decline / remove ──────────────────────────────────────────────────────
  removeConnection: async (friendshipId, myId) => {
    await supabase.from('friendships').delete().eq('id', friendshipId)
    await get().fetchRequests(myId)
    await get().fetchFriends(myId)
  },

  // ── Leaderboard ────────────────────────────────────────────────────────────
  fetchLeaderboard: async () => {
    const { data } = await supabase.from('leaderboard').select('*')
    if (!data) return
    // Sort by streak days desc, then today_checks
    const sorted = [...data].sort((a, b) =>
      b.streak_days - a.streak_days || b.today_checks - a.today_checks
    )
    set({ leaderboard: sorted })
  },

  // ── Load a user's public profile ──────────────────────────────────────────
  fetchProfile: async (username) => {
    set({ loading: true, viewedProfile: null })

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, name, avatar_url, bio, is_public')
      .ilike('username', username)
      .single()
    if (!profile) { set({ loading: false }); return }

    // Get their habits
    const { data: habits } = await supabase
      .from('friend_habits')
      .select('*')
      .eq('user_id', profile.id)
      .order('sort_order')

    // Get their logs (last 31 days)
    const from = format(subDays(new Date(), 31), 'yyyy-MM-dd')
    const to   = format(new Date(), 'yyyy-MM-dd')
    const { data: rawLogs } = await supabase
      .from('friend_logs')
      .select('habit_id, log_date, done')
      .eq('user_id', profile.id)
      .gte('log_date', from)
      .lte('log_date', to)

    // Build logs map
    const logs = {}
    ;(rawLogs || []).forEach(({ habit_id, log_date, done }) => {
      if (!logs[log_date]) logs[log_date] = {}
      logs[log_date][habit_id] = done
    })

    // Compute streaks per habit
    const streaks = {}
    ;(habits || []).forEach(h => {
      let streak = 0
      for (let i = 0; i < 365; i++) {
        const k = format(subDays(new Date(), i), 'yyyy-MM-dd')
        if (i === 0 && !logs[k]?.[h.id]) continue
        if (!logs[k]?.[h.id]) break
        streak++
      }
      streaks[h.id] = streak
    })

    // Today pct
    const todayKey = format(new Date(), 'yyyy-MM-dd')
    const todayDone = (habits || []).filter(h => logs[todayKey]?.[h.id]).length
    const todayPct  = habits?.length ? todayDone / habits.length : 0

    // Month pct – count ALL days from month start to today
    const now2 = new Date()
    const mStart = startOfMonth(now2)
    const allMonthDays = eachDayOfInterval({ start: mStart, end: now2 })
    let monthChecks = 0
    allMonthDays.forEach(d => {
      const k = format(d, 'yyyy-MM-dd')
      ;(habits || []).forEach(h => { if (logs[k]?.[h.id]) monthChecks++ })
    })
    const monthPossible = allMonthDays.length * Math.max((habits || []).length, 1)
    const monthPct = monthPossible > 0 ? monthChecks / monthPossible : 0

    set({ viewedProfile: { profile, habits: habits || [], logs, streaks, todayPct, monthPct }, loading: false })
  },

  // ── Check friendship status with a user ───────────────────────────────────
  getFriendshipStatus: async (myId, theirId) => {
    const { data } = await supabase
      .from('friendships')
      .select('id, status, requester')
      .or(`and(requester.eq.${myId},addressee.eq.${theirId}),and(requester.eq.${theirId},addressee.eq.${myId})`)
      .single()
    return data || null
  },

  // ── Update own profile ─────────────────────────────────────────────────────
  updateProfile: async (userId, patch) => {
    await supabase.from('profiles').update(patch).eq('id', userId)
  },
}))
