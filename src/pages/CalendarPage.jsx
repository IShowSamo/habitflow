import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval,
         getDay, addMonths, subMonths, isSameDay, isAfter } from 'date-fns'
import { de } from 'date-fns/locale'
import { useStore } from '../store/useStore'
import s from './CalendarPage.module.css'

const DOW = ['Mo','Di','Mi','Do','Fr','Sa','So']

export default function CalendarPage() {
  const { getPct, fetchMonth } = useStore()
  const [month, setMonth] = useState(new Date())
  const today = new Date()

  const changeMonth = async (dir) => {
    const next = dir > 0 ? addMonths(month, 1) : subMonths(month, 1)
    setMonth(next)
    await fetchMonth(next.getFullYear(), next.getMonth())
  }

  const start  = startOfMonth(month)
  const end    = endOfMonth(month)
  const days   = eachDayOfInterval({ start, end })
  const offset = (getDay(start) + 6) % 7 // Monday-first

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Calendar</h1>
      </div>

      <div className={s.card}>
        <div className={s.monthNav}>
          <button className={s.navBtn} onClick={() => changeMonth(-1)}>‹</button>
          <span className={s.monthLabel}>{format(month, 'MMMM yyyy', { locale: de })}</span>
          <button className={s.navBtn} onClick={() => changeMonth(1)}>›</button>
        </div>

        <div className={s.calGrid}>
          {DOW.map(d => <div key={d} className={s.dowLabel}>{d}</div>)}

          {Array.from({ length: offset }, (_, i) => <div key={`p${i}`} />)}

          {days.map(day => {
            const key      = format(day, 'yyyy-MM-dd')
            const pct      = getPct(key)
            const isFuture = isAfter(day, today)
            const isToday2 = isSameDay(day, today)

            let cls = s.calDay
            if (isFuture)       cls += ' ' + s.future
            else if (pct >= 1)  cls += ' ' + s.full
            else if (pct > 0)   cls += ' ' + s.partial
            else                cls += ' ' + s.empty
            if (isToday2)       cls += ' ' + s.todayDay

            return (
              <div key={key} className={cls}>
                <span>{day.getDate()}</span>
                {!isFuture && pct > 0 && pct < 1 && (
                  <div className={s.pctDot} style={{ width: `${Math.round(pct*100)}%` }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className={s.legend}>
        <div className={s.legendItem}>
          <div className={s.legendDot} style={{ background:'var(--green)' }} />
          <span>Alle Habits ✓</span>
        </div>
        <div className={s.legendItem}>
          <div className={s.legendDot} style={{ background:'rgba(108,99,255,0.4)' }} />
          <span>Teilweise</span>
        </div>
        <div className={s.legendItem}>
          <div className={s.legendDot} style={{ background:'var(--surface3)' }} />
          <span>Nichts</span>
        </div>
      </div>
    </div>
  )
}
