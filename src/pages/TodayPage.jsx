import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import s from './TodayPage.module.css'

const todayKey = format(new Date(), 'yyyy-MM-dd')
  const nav = useNavigate()

export default function TodayPage() {
  const { habits, toggleHabit, isChecked, getDoneCount, getStreak, user } = useStore()
  const done  = getDoneCount(todayKey)
  const total = habits.length
  const pct   = total ? done / total : 0

  const R = 44
  const circ = 2 * Math.PI * R
  const dash = circ * pct

  const dateStr = format(new Date(), "EEEE, d. MMMM", { locale: de })

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className={s.page}>
      {/* Header */}
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Today</h1>
          <p className={s.sub}>{dateStr}</p>
        </div>
        <button className={s.avatar} onClick={() => nav('/settings')} title="Settings">
          {user?.email?.[0]?.toUpperCase() || 'U'}
        </button>
      </div>

      {/* Progress ring */}
      <div className={s.ringCard}>
        <div className={s.ringRow}>
          <svg width="110" height="110" viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)' }}>
            <defs>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#6c63ff" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <circle cx="55" cy="55" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle cx="55" cy="55" r={R} fill="none" stroke="url(#ringGrad)" strokeWidth="8"
              strokeDasharray={`${dash.toFixed(1)} ${circ.toFixed(1)}`} strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.5s ease' }} />
          </svg>

          <div className={s.ringInfo}>
            <div className={s.ringPct}>{Math.round(pct * 100)}%</div>
            <div className={s.ringLabel}>{done} von {total} Habits</div>
            <div className={s.ringMood}>
              {done === total && total > 0 ? '🔥 Perfekter Tag!'
               : done === 0 ? 'Los geht\'s!'
               : 'Weiter so! 💪'}
            </div>
          </div>
        </div>

        <div className={s.progBar}>
          <div className={s.progFill} style={{ width: `${Math.round(pct * 100)}%` }} />
        </div>
      </div>

      {/* Habit list */}
      <div className={s.list}>
        {habits.map(h => {
          const checked = isChecked(h.id, todayKey)
          const streak  = getStreak(h.id)
          return (
            <button key={h.id} className={`${s.habitCard} ${checked ? s.done : ''}`}
              onClick={() => toggleHabit(h.id)}>
              <div className={s.habitIcon} style={{ background: h.color + '22' }}>{h.icon}</div>
              <div className={s.habitInfo}>
                <div className={s.habitName}>{h.name}</div>
                <div className={s.habitStreak}>
                  {streak > 0
                    ? <><span style={{ color: 'var(--gold)' }}>🔥 {streak} Tage</span> Streak</>
                    : 'Noch kein Streak'}
                </div>
              </div>
              <div className={`${s.checkCircle} ${checked ? s.checked : ''}`}>
                {checked
                  ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7l4 4 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  : <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
                    </svg>
                }
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
