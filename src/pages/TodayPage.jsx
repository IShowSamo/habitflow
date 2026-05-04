import { useState } from 'react'
import { format, subDays, addDays, isToday, isFuture } from 'date-fns'
import { de } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import s from './TodayPage.module.css'

const QUOTES = [
  { text: "Jeder Tag ist eine neue Chance, die Person zu werden, die du sein willst." },
  { text: "Disziplin ist die Brücke zwischen Zielen und Erfolg.", author: "Jim Rohn" },
  { text: "Kleine Gewohnheiten führen zu großen Veränderungen." },
  { text: "Erfolg ist die Summe kleiner Anstrengungen.", author: "Robert Collier" },
  { text: "Motivation bringt dich in Gang. Gewohnheit hält dich am Laufen.", author: "Jim Ryun" },
  { text: "Der beste Zeitpunkt war gestern. Der zweitbeste ist jetzt." },
  { text: "Dein zukünftiges Ich dankt dir für heute." },
  { text: "Stark sein ist nie einfach. Aber es lohnt sich immer." },
  { text: "Die einzige schlechte Einheit ist die, die du ausgelassen hast." },
  { text: "Du bist einen Tag näher an der Version von dir, die du dir vorstellst." },
  { text: "Wer aufhört, besser zu werden, hat aufgehört, gut zu sein." },
]

const LEVELS = [
  { lvl: 1, name: 'Beginner',    icon: '🌱', days: 0   },
  { lvl: 2, name: 'Consistent',  icon: '💪', days: 7   },
  { lvl: 3, name: 'Warrior',     icon: '⚔️', days: 21  },
  { lvl: 4, name: 'Champion',    icon: '🏆', days: 50  },
  { lvl: 5, name: 'Legend',      icon: '🔥', days: 100 },
]

function getLevel(totalDays) {
  let current = LEVELS[0]
  for (const l of LEVELS) {
    if (totalDays >= l.days) current = l
  }
  const nextIdx = LEVELS.findIndex(l => l.lvl === current.lvl) + 1
  const next = LEVELS[nextIdx] || null
  return { current, next, totalDays }
}

function getDailyQuote() {
  const day = Math.floor((Date.now() - new Date(new Date().getFullYear(),0,0)) / 86400000)
  return QUOTES[day % QUOTES.length]
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function TodayPage() {
  const { habits, toggleHabit, isChecked, getDoneCount, getStreak, user, fetchLogs, logs } = useStore()
  const nav = useNavigate()
  const [selectedDate, setSelectedDate] = useState(new Date())

  const dateKey      = format(selectedDate, 'yyyy-MM-dd')
  const isCurrentDay = isToday(selectedDate)
  const isFutureDay  = isFuture(selectedDate)
  const done  = getDoneCount(dateKey)
  const total = habits.length
  const pct   = total ? done / total : 0
  const quote = getDailyQuote()
  const R = 44, circ = 2 * Math.PI * R, dash = circ * pct

  // Calculate total streak days across all habits for level
  const bestStreak  = habits.length ? Math.max(...habits.map(h => getStreak(h.id)), 0) : 0
  const levelInfo   = getLevel(bestStreak)
  const { current: lvl, next: nextLvl } = levelInfo
  const lvlProgress = nextLvl
    ? ((bestStreak - lvl.days) / (nextLvl.days - lvl.days)) * 100
    : 100

  // Week strip: show 7 days anchored to selected date
  const weekEnd = isCurrentDay ? new Date() : selectedDate
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(weekEnd, 6 - i)
    return { date: d, key: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE', { locale: de }), num: d.getDate() }
  })

  // Mini week bar (completion dots)
  const miniWeek = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    const k = format(d, 'yyyy-MM-dd')
    const p = getDoneCount(k) / Math.max(total, 1)
    return { key: k, pct: p, isToday: isToday(d) }
  })

  const goPrev = async () => {
    const prev = subDays(selectedDate, 7)
    setSelectedDate(prev)
    await fetchLogs(format(subDays(prev, 6), 'yyyy-MM-dd'), format(prev, 'yyyy-MM-dd'))
  }
  const goNext = async () => {
    if (isCurrentDay) return
    const raw  = addDays(selectedDate, 7)
    const next = raw > new Date() ? new Date() : raw
    setSelectedDate(next)
    await fetchLogs(format(subDays(next, 6), 'yyyy-MM-dd'), format(next, 'yyyy-MM-dd'))
  }

  return (
    <div className={s.page}>

      {/* Header */}
      <div className={s.header}>
        <div>
          <p className={s.dateSmall}>{format(new Date(), 'EEEE, d. MMMM', { locale: de })}</p>
          <h1 className={s.greeting}>{getGreeting()} {isCurrentDay ? '👋' : ''}</h1>
        </div>
        <button className={s.avatar} onClick={() => nav('/settings')}>
          {user?.email?.[0]?.toUpperCase() || 'U'}
        </button>
      </div>

      {/* Quote */}
      <div className={s.quoteCard}>
        <span className={s.quoteIcon}>💬</span>
        <p className={s.quoteText}>"{quote.text}"</p>
      </div>

      {/* Level bar */}
      <div className={s.levelCard}>
        <div className={s.levelLeft}>
          <span className={s.levelIcon}>{lvl.icon}</span>
          <div>
            <div className={s.levelName}>Lvl {lvl.lvl} · {lvl.name}</div>
            <div className={s.levelSub}>{bestStreak} / {nextLvl ? nextLvl.days : bestStreak} Tage</div>
          </div>
        </div>
        <div className={s.levelBarWrap}>
          <div className={s.levelBarFill} style={{ width: Math.min(lvlProgress, 100) + '%' }} />
        </div>
      </div>

      {/* Ring + mini week bars */}
      <div className={s.ringCard}>
        <div className={s.ringRow}>
          <svg width="100" height="100" viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
            <defs>
              <linearGradient id="rg" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6c63ff" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <circle cx="55" cy="55" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle cx="55" cy="55" r={R} fill="none" stroke="url(#rg)" strokeWidth="8"
              strokeDasharray={dash.toFixed(1) + ' ' + circ.toFixed(1)} strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.5s ease' }} />
          </svg>
          <div className={s.ringInfo}>
            <div className={s.ringPct}>{Math.round(pct * 100)}%</div>
            <div className={s.ringLabel}>{done} von {total} Habits</div>
            <div className={s.ringMood}>
              {isFutureDay ? '🔮 Zukunft'
               : done === total && total > 0 ? '🔥 Perfekt!'
               : done === 0 ? (isCurrentDay ? "Los geht's!" : '😔 Nichts')
               : '💪 Weiter so!'}
            </div>
          </div>
          {/* Mini week completion bars */}
          <div className={s.miniWeek}>
            {miniWeek.map(d => (
              <div key={d.key} className={s.miniDay}>
                <div className={s.miniBarTrack}>
                  <div className={s.miniBarFill} style={{
                    height: Math.round(d.pct * 100) + '%',
                    background: d.isToday ? '#6c63ff' : '#22c55e',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={s.progBar}>
          <div className={s.progFill} style={{ width: Math.round(pct * 100) + '%' }} />
        </div>
      </div>

      {/* Day navigator */}
      <div className={s.dayNavRow}>
        <button className={s.dayArrow} onClick={goPrev}>‹</button>
        <div className={s.dayNav}>
          {weekDays.map(d => (
            <button key={d.key}
              className={[s.dayChip, d.key === dateKey ? s.dayChipActive : '', isToday(d.date) ? s.dayChipToday : ''].filter(Boolean).join(' ')}
              onClick={() => { setSelectedDate(d.date); fetchLogs(d.key, d.key) }}>
              <span className={s.dayChipLabel}>{d.label}</span>
              <span className={s.dayChipNum}>{d.num}</span>
            </button>
          ))}
        </div>
        <button className={s.dayArrow} onClick={goNext} disabled={isCurrentDay}
          style={{ opacity: isCurrentDay ? 0.25 : 1 }}>›</button>
      </div>

      {!isCurrentDay && (
        <button className={s.backToToday} onClick={() => setSelectedDate(new Date())}>
          ↩ Zurück zu heute
        </button>
      )}

      {/* Habit list */}
      <div className={s.sectionTitle}>HABITS FÜR HEUTE</div>
      <div className={s.list}>
        {habits.map(h => {
          const checked = isChecked(h.id, dateKey)
          const streak  = getStreak(h.id)
          return (
            <button key={h.id}
              className={s.habitCard + (checked ? ' ' + s.done : '')}
              onClick={() => { if (!isFutureDay) toggleHabit(h.id, dateKey) }}
              disabled={isFutureDay}>
              <div className={s.habitIcon} style={{ background: h.color + '22' }}>{h.icon}</div>
              <div className={s.habitInfo}>
                <div className={s.habitName}>{h.name}</div>
                {streak > 0 && <div className={s.habitStreak}>🔥 {streak} Tage Streak</div>}
              </div>
              <div className={s.checkCircle + (checked ? ' ' + s.checked : '')}>
                {checked
                  ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7l4 4 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
