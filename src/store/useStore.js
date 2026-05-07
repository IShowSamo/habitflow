import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

const today = () => format(new Date(), 'yyyy-MM-dd')

export const useStore = create((set, get) => ({
  user: null,
  habits: [],
  logs: {},      // { 'yyyy-MM-dd': { habitId: true/false } }
  loading: false,
  error: null,

  setUser: (user) => set({ user }),

  // ── Fetch all habits ───────────────────────────────────────────────────────
  fetchHabits: async () => {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('archived', false)
      .order('sort_order')
    if (error) { set({ error: error.message }); return }
    set({ habits: data || [] })
  },

  // ── Fetch logs for a date range ────────────────────────────────────────────
  fetchLogs: async (from, to) => {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('habit_id, log_date, done')
      .gte('log_date', from)
      .lte('log_date', to)
    if (error) return

    const logs = {}
    ;(data || []).forEach(({ habit_id, log_date, done }) => {
      if (!logs[log_date]) logs[log_date] = {}
      logs[log_date][habit_id] = done
    })
    set((s) => ({ logs: { ...s.logs, ...logs } }))
  },

  fetchTodayAndWeek: async () => {
    set({ loading: true })
    await get().fetchHabits()
    const t = new Date()
    const from = format(subDays(t, 30), 'yyyy-MM-dd')
    const to   = format(t, 'yyyy-MM-dd')
    await get().fetchLogs(from, to)
    set({ loading: false })
  },

  fetchMonth: async (year, month) => {
    const d = new Date(year, month, 1)
    const from = format(startOfMonth(d), 'yyyy-MM-dd')
    const to   = format(endOfMonth(d),   'yyyy-MM-dd')
    await get().fetchLogs(from, to)
  },

  // ── Toggle a habit for today ───────────────────────────────────────────────
  toggleHabit: async (habitId, dateOverride) => {
    const date = dateOverride || today()
    const current = get().logs[date]?.[habitId] ?? false
    const next = !current

    // Optimistic update
    set((s) => ({
      logs: { ...s.logs, [date]: { ...s.logs[date], [habitId]: next } }
    }))

    if (next) {
      await supabase.from('habit_logs').upsert(
        { habit_id: habitId, log_date: date, done: true, user_id: get().user.id },
        { onConflict: 'habit_id,log_date' }
      )
      // Check for perfect day & post to feed
      const { habits, getDoneCount, user: u, getStreak } = get()
      const doneAfter = getDoneCount(date)
      if (doneAfter === habits.length && habits.length > 0 && u) {
        const today2 = new Date().toISOString().slice(0,10)
        supabase.from('activity_feed')
          .select('id').eq('user_id', u.id).eq('type', 'perfect_day')
          .gte('created_at', today2).limit(1)
          .then(({ data }) => {
            if (!data?.length) {
              supabase.from('activity_feed').insert({
                user_id: u.id, type: 'perfect_day', payload: { date }
              }).catch(() => {})
            }
          })
      }
      // Streak milestone
      if (u) {
        const streak = getStreak(habitId)
        if ([7, 14, 30, 50, 100].includes(streak)) {
          supabase.from('activity_feed').insert({
            user_id: u.id, type: 'streak_milestone', payload: { streak }
          }).catch(() => {})
        }
      }
    } else {
      await supabase.from('habit_logs')
        .delete()
        .eq('habit_id', habitId)
        .eq('log_date', date)
    }
  },

  // ── Add habit ─────────────────────────────────────────────────────────────
  addHabit: async ({ name, icon, color, notif_time, notif_on }) => {
    const { habits, user } = get()
    const { data, error } = await supabase.from('habits').insert({
      user_id: user.id, name, icon, color,
      notif_time, notif_on,
      sort_order: habits.length,
    }).select().single()
    if (error) return
    set((s) => ({ habits: [...s.habits, data] }))
  },

  // ── Delete habit ──────────────────────────────────────────────────────────
  deleteHabit: async (id) => {
    await supabase.from('habits').update({ archived: true }).eq('id', id)
    set((s) => ({ habits: s.habits.filter(h => h.id !== id) }))
  },

  // ── Update habit ──────────────────────────────────────────────────────────
  updateHabit: async (id, patch) => {
    await supabase.from('habits').update(patch).eq('id', id)
    if (patch.archived === true) {
      // Remove from active list immediately
      set((s) => ({ habits: s.habits.filter(h => h.id !== id) }))
    } else {
      set((s) => ({ habits: s.habits.map(h => h.id === id ? { ...h, ...patch } : h) }))
    }
  },

  // ── Derived helpers ────────────────────────────────────────────────────────
  isChecked: (habitId, date) => !!get().logs[date]?.[habitId],

  getDoneCount: (date) => {
    const { habits, logs } = get()
    return habits.filter(h => logs[date]?.[h.id]).length
  },

  getPct: (date) => {
    const { habits } = get()
    if (!habits.length) return 0
    return get().getDoneCount(date) / habits.length
  },

  getStreak: (habitId) => {
    const { logs } = get()
    const today = new Date()
    const todayKey = format(today, 'yyyy-MM-dd')
    const yestKey  = format(subDays(today, 1), 'yyyy-MM-dd')

    // If neither today nor yesterday is checked → streak is 0 (broken)
    const todayDone = !!logs[todayKey]?.[habitId]
    const yestDone  = !!logs[yestKey]?.[habitId]
    if (!todayDone && !yestDone) return 0

    // Count backwards from whichever anchor is done
    let streak = 0
    for (let i = 0; i < 365; i++) {
      const k = format(subDays(today, i), 'yyyy-MM-dd')
      // Skip today if not yet tracked (streak still alive from yesterday)
      if (i === 0 && !todayDone) continue
      if (!logs[k]?.[habitId]) break
      streak++
    }
    return streak
  },

  getWeekData: () => {
    const t = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(t, 6 - i)
      const key = format(d, 'yyyy-MM-dd')
      return { key, label: format(d, 'EEE'), pct: get().getPct(key), isToday: key === today() }
    })
  },

  getMonthPct: (habitId, year, month) => {
    const { logs } = get()
    const start = new Date(year, month, 1)
    const end = new Date(Math.min(new Date(year, month + 1, 0), new Date()))
    const days = eachDayOfInterval({ start, end })
    const done = days.filter(d => logs[format(d, 'yyyy-MM-dd')]?.[habitId]).length
    return days.length ? done / days.length : 0
  },
}))
