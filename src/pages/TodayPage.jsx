import { useState, useRef, useEffect } from 'react'
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
  { text: "Wer aufhört, besser zu werden, hat aufgehört, gut zu sein.", author: "" },
  { text: "Motivation bringt dich in Gang. Gewohnheit hält dich am Laufen.", author: "Jim Ryun" },
  { text: "Der beste Zeitpunkt war gestern. Der zweitbeste ist jetzt.", author: "" },
  { text: "Stark sein ist nie einfach. Aber es lohnt sich immer.", author: "" },
  { text: "Dein zukünftiges Ich dankt dir für heute.", author: "" },
]

function getDailyQuote() {
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
  return QUOTES[dayOfYear % QUOTES.length]
}

function schedulePushReminder(habits, logs) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const doneCount = habits.filter(h => logs[todayKey]?.[h.id]).length
  const total = habits.length
  if (doneCount === total || total === 0) return

  // Schedule at 18:00 if not all done
  const now = new Date()
  const reminder = new Date()
  reminder.setHours(18, 0, 0, 0)
  if (reminder <= now) reminder.setDate(reminder.getDate() + 1)

  const ms = reminder - now
  const streakMotivations = [
    "🔥 Brich deinen Streak nicht! Du hast heute noch Habits offen.",
    "💪 Fast da! Noch ein paar Habits für heute.",
    "⚡ Dein zukünftiges Ich zählt auf dich – tracke jetzt!",
    "🎯 Der Tag ist noch nicht rum. Hol dir deinen 100%!",
  ]
  const msg = streakMotivations[Math.floor(Math.random() * streakMotivations.length)]

  setTimeout(() => {
    new Notification('HabitFlow 🌿', { body: msg, icon: '/icon-192.png' })
  }, ms)
}

async function requestAndSchedule(habits, logs) {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') {
    await Notification.requestPermission()
  }
  schedulePushReminder(habits, logs)
}

export default function TodayPage() {
  const { habits, toggleHabit, isChecked, getDoneCount, getStreak, user, fetchLogs, logs } = useStore()
  const nav = useNavigate()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [streakMsg, setStreakMsg] = useState(null)
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  const dateKey      = format(selectedDate, 'yyyy-MM-dd')
  const isCurrentDay = isToday(selectedDate)
  const isFutureDay  = isFuture(selectedDate)
  const done  = getDoneCount(dateKey)
  const total = habits.length
  const pct   = total ? done / total : 0

  const quote = getDailyQuote()

  // Check streak whenever habits load (they come in async)
  useEffect(() => {
    if (!habits.length) return

    // Show streak reminder on login
    const bestStreak = Math.max(...habits.map(h => getStreak(h.id)), 0)
    const todayKey2  = format(new Date(), 'yyyy-MM-dd')
    const todayDone  = getDoneCount(todayKey2)

    if (bestStreak >= 2 && todayDone === 0) {
      setStreakMsg(`🔥 Du hast einen ${bestStreak}-Tage Streak! Tracke heute um ihn nicht zu brechen.`)
    } else if (bestStreak >= 7) {
      setStreakMsg(`🏆 Wahnsinn! ${bestStreak} Tage am Stück. Weiter so!`)
    }

    // Schedule push notification
    requestAndSchedule(habits, logs)
  }, [habits.length])

  const goToToday = () => setSelectedDate(new Date())

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  const handleTouchEnd = async (e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    touchStartX.current = null
    touchStartY.current = null
    // Only trigger if horizontal swipe is dominant (not a scroll)
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx) * 0.8) return
    if (dx < 0 && !isCurrentDay) {
      // swipe left = newer day
      const next = addDays(selectedDate, 1)
      setSelectedDate(next)
      await fetchLogs(format(next, 'yyyy-MM-dd'), format(next, 'yyyy-MM-dd'))
    } else if (dx > 0) {
      // swipe right = older day
      const prev = subDays(selectedDate, 1)
      setSelectedDate(prev)
      await fetchLogs(format(prev, 'yyyy-MM-dd'), format(prev, 'yyyy-MM-dd'))
    }
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    return { date: d, key: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE', { locale: de }), num: d.getDate() }
  })

  const R = 44, circ = 2 * Math.PI * R, dash = circ * pct

  return (
    <div className={s.page} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

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

      {/* Streak login reminder */}
      {streakMsg && isCurrentDay && (
        <div className={s.streakBanner} onClick={() => setStreakMsg(null)}>
          <span>{streakMsg}</span>
          <span className={s.streakBannerClose}>✕</span>
        </div>
      )}

      {/* Motivational quote */}
      {isCurrentDay && (
        <div className={s.quoteCard}>
          <div className={s.quoteIcon}>💬</div>
          <div className={s.quoteContent}>
            <p className={s.quoteText}>"{quote.text}"</p>
            {quote.author && <p className={s.quoteAuthor}>— {quote.author}</p>}
          </div>
        </div>
      )}

      {/* Day chips */}
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
               : done === 0 ? (isCurrentDay ? 'Los geht\'s!' : '😔 Nichts erledigt')
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
              style={{ opacity: isFutureDay ? 0.4 : 1, cursor: isFutureDay ? 'default' : 'pointer' }}>
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
