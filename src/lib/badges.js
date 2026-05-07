import { supabase } from './supabase'

export const BADGE_DEFINITIONS = [
  { type: 'first_check',    icon: '🌱', name: 'Erster Schritt',    desc: 'Erstes Habit abgehakt' },
  { type: 'streak_3',       icon: '🔥', name: '3 Tage Streak',     desc: '3 Tage in Folge' },
  { type: 'streak_7',       icon: '⚡', name: '1 Woche',           desc: '7 Tage Streak' },
  { type: 'streak_14',      icon: '💎', name: '2 Wochen',          desc: '14 Tage Streak' },
  { type: 'streak_30',      icon: '🏆', name: '1 Monat',           desc: '30 Tage Streak' },
  { type: 'streak_100',     icon: '👑', name: '100 Tage',          desc: '100 Tage Streak' },
  { type: 'perfect_week',   icon: '⭐', name: 'Perfekte Woche',    desc: 'Alle Habits eine ganze Woche' },
  { type: 'perfect_month',  icon: '🌟', name: 'Perfekter Monat',   desc: 'Alle Habits einen ganzen Monat' },
  { type: 'century',        icon: '💯', name: '100 Checks',        desc: '100 Habits insgesamt abgehakt' },
  { type: 'early_bird',     icon: '🌅', name: 'Frühaufsteher',     desc: '7 Tage vor 6 Uhr getrackt' },
  { type: 'consistent',     icon: '📈', name: 'Konstant',          desc: '80%+ Quote über 30 Tage' },
  { type: 'social',         icon: '👥', name: 'Sozial',            desc: 'Ersten Freund hinzugefügt' },
]

export async function checkAndAwardBadges(userId, stats) {
  const { streak, totalChecks, perfectWeek, perfectMonth, friendCount } = stats

  const toAward = []
  if (totalChecks >= 1)    toAward.push('first_check')
  if (streak >= 3)         toAward.push('streak_3')
  if (streak >= 7)         toAward.push('streak_7')
  if (streak >= 14)        toAward.push('streak_14')
  if (streak >= 30)        toAward.push('streak_30')
  if (streak >= 100)       toAward.push('streak_100')
  if (totalChecks >= 100)  toAward.push('century')
  if (perfectWeek)         toAward.push('perfect_week')
  if (perfectMonth)        toAward.push('perfect_month')
  if (friendCount >= 1)    toAward.push('social')

  if (!toAward.length) return []

  // Get already earned
  const { data: existing } = await supabase
    .from('badges').select('type').eq('user_id', userId)
  const earned = new Set((existing || []).map(b => b.type))

  const newBadges = toAward.filter(t => !earned.has(t))
  if (!newBadges.length) return []

  // Insert new badges
  await supabase.from('badges').upsert(
    newBadges.map(type => ({ user_id: userId, type })),
    { onConflict: 'user_id,type' }
  )

  // Post to activity feed
  for (const type of newBadges) {
    const def = BADGE_DEFINITIONS.find(b => b.type === type)
    await supabase.from('activity_feed').insert({
      user_id: userId, type: 'badge_earned',
      payload: { badge_type: type, icon: def?.icon, name: def?.name }
    })
  }

  return newBadges.map(t => BADGE_DEFINITIONS.find(b => b.type === t))
}

export async function postActivity(userId, type, payload) {
  // Avoid duplicate perfect_day posts
  if (type === 'perfect_day') {
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await supabase.from('activity_feed')
      .select('id').eq('user_id', userId).eq('type', 'perfect_day')
      .gte('created_at', today).limit(1)
    if (data?.length) return
  }
  await supabase.from('activity_feed').insert({ user_id: userId, type, payload })
}
