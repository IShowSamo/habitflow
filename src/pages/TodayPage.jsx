import { useState, useRef } from 'react'
import { format, subDays, addDays, isToday, isFuture } from 'date-fns'
import { de } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import s from './TodayPage.module.css'

export default function TodayPage() {
  const { habits, toggleHabit, isChecked, getDoneCount, getStreak, user, fetchLogs } = useStore()
  const nav = useNavigate()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const touchStartX = useRef(null)

  const dateKey = format(selectedDate, 'yyyy-MM-dd')
  const isCurrentDay = isToday(selectedDate)
  const isFutureDay  = isFuture(selectedDate)

  const done  = getDoneCount(dateKey)
  const total = habits.length
  const pct   = total ? done / total : 0

  const R = 44
  const circ = 2 * Math.PI * R
  const dash = circ * pct

  const goToToday = () => setSelectedDate(new Date())

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = async (e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 50) return  // ignore small swipes
    if (dx < 0) {
      // swipe left = go to next day (newer)
      if (!isCurrentDay) {
        const next = addDays(selectedDate, 1)
        setSelectedDate(next)
        const k = format(next, 'yyyy-MM-dd')
        await fetchLogs(k, k)
      }
    } else {
      // swipe right = go to previous day (older)
      const prev = subDays(selectedDate, 1)
      setSelectedDate(prev)
      const k = format(prev, 'yyyy-MM-dd')
      await fetchLogs(k, k)
    }
  }

  // Build last 7 days for quick picker
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    return { date: d, key: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE', { locale: de }), num: d.getDate() }
  })

  return (
    <div className={s.page} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Header */}
      <div className={s.header}>
        <div>
          <h1 className={s.title}>
            {isCurrentDay ? 'Today' : format(selectedDate, 'd. MMMM', { locale: de })}
          </h1>
          <p className={s.sub}>{format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de })}</p>
        </div>
        <button className={s.avatar} onClick={() => nav('/settings')}>
          {user?.email?.[0]?.toUpperCase() || 'U'}
        </button>
      </div>

      {/* Day chips - swipeable, no arrow buttons */}
      <div className={s.dayNav}>
        {last7.map(d => (
          <button key={d.key}
            className={`${s.dayChip} ${d.key === dateKey ? s.dayChipActive : ''} ${isToday(d.date) ? s.dayChipToday : ''}`}
            onClick={() => { setSelectedDate(d.date); fetchLogs(d.key, d.key) }}>
            <span className={s.dayChipLabel}>{d.label}</span>
            <span className={s.dayChipNum}>{d.num}</span>
          </button>
        ))}
      </div>

      {!isCurrentDay && (
        <button className={s.backToToday} onClick={goToToday}>↩ Zurück zu heute</button>
      )}

      {/* Progress ring */}
      <div className={s.ringCard}>
        <div className={s.ringRow}>
          <svg width="110" height="110" viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)' }}>
            <defs>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6c63ff" />
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
              {isFutureDay ? '🔮 Zukunft'
               : done === total && total > 0 ? '🔥 Perfekter Tag!'
               : done === 0 ? (isCurrentDay ? 'Los geht\'s!' : '😔 Nichts erledigt')
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
          const checked = isChecked(h.id, dateKey)
          const streak  = getStreak(h.id)
          return (
            <button key={h.id}
              className={`${s.habitCard} ${checked ? s.done : ''}`}
              onClick={() => !isFutureDay && toggleHabit(h.id, dateKey)}
              style={{ opacity: isFutureDay ? 0.4 : 1, cursor: isFutureDay ? 'default' : 'pointer' }}>
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
