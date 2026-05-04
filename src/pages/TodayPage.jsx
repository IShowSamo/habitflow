import { useState, useEffect } from 'react'
import { format, subDays, addDays, isToday, isFuture } from 'date-fns'
import { de } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import s from './TodayPage.module.css'

const QUOTES = [
  { text: "Disziplin ist die Brücke zwischen Zielen und Erfolg.", author: "Jim Rohn" },
  { text: "Du musst nicht großartig starten, aber du musst starten, um großartig zu werden.", author: "Zig Ziglar" },
  { text: "Kleine Gewohnheiten führen zu großen Veränderungen.", author: "" },
  { text: "Jeder Tag ist eine neue Chance, die Person zu werden, die du sein willst.", author: "" },
  { text: "Erfolg ist die Summe kleiner Anstrengungen, die jeden Tag wiederholt werden.", author: "Robert Collier" },
  { text: "Die einzige schlechte Einheit ist die, die du ausgelassen hast.", author: "" },
  { text: "Du bist einen Tag näher an der Version von dir, die du dir vorstellst.", author: "" },
  { text: "Motivation bringt dich in Gang. Gewohnheit hält dich am Laufen.", author: "Jim Ryun" },
  { text: "Der beste Zeitpunkt war gestern. Der zweitbeste ist jetzt.", author: "" },
  { text: "Stark sein ist nie einfach. Aber es lohnt sich immer.", author: "" },
  { text: "Dein zukünftiges Ich dankt dir für heute.", author: "" },
]

function getDailyQuote() {
  const day = Math.floor((Date.now() - new Date(new Date().getFullYear(),0,0)) / 86400000)
  return QUOTES[day % QUOTES.length]
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

  const goPrev = async () => {
    const prev = subDays(selectedDate, 7)
    setSelectedDate(prev)
    const from = format(subDays(prev, 6), 'yyyy-MM-dd')
    const to   = format(prev, 'yyyy-MM-dd')
    await fetchLogs(from, to)
  }

  const goNext = async () => {
    if (isCurrentDay) return
    const next = addDays(selectedDate, 7)
    const capped = new Date(Math.min(next, new Date()))
    setSelectedDate(capped)
    const from = format(subDays(capped, 6), 'yyyy-MM-dd')
    const to   = format(capped, 'yyyy-MM-dd')
    await fetchLogs(from, to)
  }

  // Show 7 days centered around selectedDate
  const weekAnchor = isCurrentDay ? new Date() : selectedDate
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(weekAnchor, 6 - i)
    return { date: d, key: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE', { locale: de }), num: d.getDate() }
  })

  return (
    <div className={s.page}>

      {/* Header */}
      <div className={s.header}>
        <div>
          <h1 className={s.title}>{isCurrentDay ? 'Today' : format(selectedDate, 'd. MMMM', { locale: de })}</h1>
          <p className={s.sub}>{format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de })}</p>
        </div>
        <button className={s.avatar} onClick={() => nav('/settings')}>
          {user?.email?.[0]?.toUpperCase() || 'U'}
        </button>
      </div>

      {/* Streak banner */}
        </div>
      )}

      {/* Quote */}
      {isCurrentDay && (
        <div className={s.quoteCard}>
          <div className={s.quoteIcon}>💬</div>
          <div className={s.quoteContent}>
            <p className={s.quoteText}>"{quote.text}"</p>
            {quote.author && <p className={s.quoteAuthor}>— {quote.author}</p>}
          </div>
        </div>
      )}

      {/* Day navigator with arrows */}
      <div className={s.dayNavRow}>
        <button className={s.dayArrow} onClick={goPrev}>‹</button>
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
        <button className={s.dayArrow} onClick={goNext} disabled={isCurrentDay}
          style={{ opacity: isCurrentDay ? 0.25 : 1 }}>›</button>
      </div>

      {!isCurrentDay && (
        <button className={s.backToToday} onClick={() => setSelectedDate(new Date())}>
          ↩ Zurück zu heute
        </button>
      )}

      {/* Progress ring */}
      <div className={s.ringCard}>
        <div className={s.ringRow}>
          <svg width="110" height="110" viewBox="0 0 110 110" style={{ transform:'rotate(-90deg)' }}>
            <defs>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6c63ff" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <circle cx="55" cy="55" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle cx="55" cy="55" r={R} fill="none" stroke="url(#ringGrad)" strokeWidth="8"
              strokeDasharray={`${dash.toFixed(1)} ${circ.toFixed(1)}`} strokeLinecap="round"
              style={{ transition:'stroke-dasharray 0.5s ease' }} />
          </svg>
          <div className={s.ringInfo}>
            <div className={s.ringPct}>{Math.round(pct * 100)}%</div>
            <div className={s.ringLabel}>{done} von {total} Habits</div>
            <div className={s.ringMood}>
              {isFutureDay ? '🔮 Zukunft'
               : done === total && total > 0 ? '🔥 Perfekter Tag!'
               : done === 0 ? (isCurrentDay ? "Los geht's!" : '😔 Nichts erledigt')
               : 'Weiter so! 💪'}
            </div>
          </div>
        </div>
        <div className={s.progBar}>
          <div className={s.progFill} style={{ width:`${Math.round(pct*100)}%` }} />
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
              disabled={isFutureDay}>
              <div className={s.habitIcon} style={{ background: h.color + '22' }}>{h.icon}</div>
              <div className={s.habitInfo}>
                <div className={s.habitName}>{h.name}</div>
                <div className={s.habitStreak}>
                  {streak > 0
                    ? <><span style={{ color:'var(--gold)' }}>🔥 {streak} Tage</span> Streak</>
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
