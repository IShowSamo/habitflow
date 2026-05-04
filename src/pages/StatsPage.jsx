import { useStore } from '../store/useStore'
import { format } from 'date-fns'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import s from './StatsPage.module.css'

const todayKey = format(new Date(), 'yyyy-MM-dd')

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:8, padding:'8px 12px' }}>
      <p style={{ fontSize:12, color:'var(--text2)', marginBottom:4 }}>{label}</p>
      <p style={{ fontSize:14, fontWeight:600, color:'var(--accent)' }}>{Math.round(payload[0].value * 100)}%</p>
    </div>
  )
}

export default function StatsPage() {
  const { habits, getWeekData, getStreak, getMonthPct, logs } = useStore()

  const weekData = getWeekData()
  const bestStreak = Math.max(...habits.map(h => getStreak(h.id)), 0)
  const weekDone   = weekData.filter(d => d.pct >= 0.999).length
  const totalChecks = Object.values(logs).reduce((a, day) =>
    a + Object.values(day).filter(Boolean).length, 0)
  const weekAvg = weekData.reduce((a,d) => a + d.pct, 0) / 7

  const now = new Date()
  const COLORS = ['#6c63ff','#22c55e','#f59e0b','#ef4444','#06b6d4','#f97316','#8b5cf6']

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Statistics</h1>
        <p className={s.sub}>{format(now, 'MMMM yyyy')}</p>
      </div>

      {/* Stat cards */}
      <div className={s.grid}>
        <div className={s.statCard}>
          <div className={s.statVal} style={{ color:'var(--gold)' }}>🔥 {bestStreak}</div>
          <div className={s.statLabel}>Best Streak</div>
          <div className={s.statSub}>Tage in Folge</div>
        </div>
        <div className={s.statCard}>
          <div className={s.statVal}>{weekDone}/7</div>
          <div className={s.statLabel}>Perfekte Tage</div>
          <div className={s.statSub}>Diese Woche</div>
        </div>
        <div className={s.statCard}>
          <div className={s.statVal} style={{ color:'var(--accent)' }}>{totalChecks}</div>
          <div className={s.statLabel}>Total Checks</div>
          <div className={s.statSub}>Insgesamt</div>
        </div>
        <div className={s.statCard}>
          <div className={s.statVal} style={{ color:'var(--green)' }}>{Math.round(weekAvg * 100)}%</div>
          <div className={s.statLabel}>Wochenquote</div>
          <div className={s.statSub}>Ø täglich</div>
        </div>
      </div>

      {/* Weekly bar chart */}
      <div className={s.chartCard}>
        <div className={s.chartTitle}>Wöchentlicher Verlauf</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weekData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill:'#9090b0', fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `${Math.round(v*100)}%`} tick={{ fill:'#9090b0', fontSize:10 }} axisLine={false} tickLine={false} domain={[0,1]} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="pct" fill="var(--accent)" radius={[4,4,0,0]}
              label={false}
              background={{ fill:'var(--surface2)', radius:[4,4,0,0] }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-habit this month */}
      <div className={s.chartCard}>
        <div className={s.chartTitle}>Habit Erfolgsquote – {format(now,'MMMM')}</div>
        {habits.map((h, i) => {
          const pct = getMonthPct(h.id, now.getFullYear(), now.getMonth())
          return (
            <div key={h.id} className={s.habitRow}>
              <span className={s.habitRowIcon}>{h.icon}</span>
              <div className={s.habitRowName}>{h.name}</div>
              <div className={s.habitBarWrap}>
                <div className={s.habitBar} style={{ width:`${Math.round(pct*100)}%`, background: COLORS[i % COLORS.length] }} />
              </div>
              <span className={s.habitPct}>{Math.round(pct*100)}%</span>
            </div>
          )
        })}
      </div>

      {/* 30-day area chart */}
      {weekData.length > 0 && (
        <div className={s.chartCard}>
          <div className={s.chartTitle}>7-Tage Trend</div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={weekData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6c63ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill:'#9090b0', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${Math.round(v*100)}%`} tick={{ fill:'#9090b0', fontSize:10 }} axisLine={false} tickLine={false} domain={[0,1]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="pct" stroke="var(--accent)" strokeWidth={2}
                fill="url(#areaGrad)" dot={{ fill:'var(--accent)', r:3 }} activeDot={{ r:5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
