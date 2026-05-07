import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import { BADGE_DEFINITIONS, checkAndAwardBadges } from '../lib/badges'
import { format, subDays, startOfYear, eachDayOfInterval } from 'date-fns'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import s from './StatsPage.module.css'

const LEVELS = [
  { lvl:1, name:'Beginner',   icon:'🌱', days:0   },
  { lvl:2, name:'Consistent', icon:'💪', days:7   },
  { lvl:3, name:'Warrior',    icon:'⚔️', days:21  },
  { lvl:4, name:'Champion',   icon:'🏆', days:50  },
  { lvl:5, name:'Legend',     icon:'🔥', days:100 },
]

function getLevel(streak) {
  let l = LEVELS[0]
  for (const x of LEVELS) { if (streak >= x.days) l = x }
  return l
}

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
  const { habits, getWeekData, getStreak, getMonthPct, logs, user } = useStore()
  const [badges, setBadges] = useState([])
  const [newBadges, setNewBadges] = useState([])
  const [yearData, setYearData] = useState([])

  const weekData  = getWeekData()
  const bestStreak = Math.max(...habits.map(h => getStreak(h.id)), 0)
  const weekDone   = weekData.filter(d => d.pct >= 0.999).length
  const totalChecks = Object.values(logs).reduce((a, day) =>
    a + Object.values(day).filter(Boolean).length, 0)
  const weekAvg = weekData.reduce((a,d) => a+d.pct, 0) / 7
  const now = new Date()
  const lvl = getLevel(bestStreak)
  const COLORS = ['#6c63ff','#22c55e','#f59e0b','#ef4444','#06b6d4','#f97316','#8b5cf6']

  useEffect(() => {
    if (!user) return
    loadBadges()
    buildYearData()
    // Check for new badges
    checkAndAwardBadges(user.id, {
      streak: bestStreak, totalChecks,
      perfectWeek: weekDone >= 7,
      perfectMonth: false,
      friendCount: 0,
    }).then(nb => { if (nb?.length) setNewBadges(nb) })
  }, [user, bestStreak, totalChecks])

  const loadBadges = async () => {
    const { data } = await supabase.from('badges').select('*').eq('user_id', user.id)
    setBadges(data || [])
  }

  const buildYearData = () => {
    const start = startOfYear(now)
    const days  = eachDayOfInterval({ start, end: now })
    setYearData(days.map(d => {
      const k = format(d, 'yyyy-MM-dd')
      const pct = habits.length ? (Object.values(logs[k] || {}).filter(Boolean).length / habits.length) : 0
      return { date: d, key: k, pct, month: d.getMonth() }
    }))
  }

  const earnedTypes = new Set(badges.map(b => b.type))

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Statistics</h1>
        <p className={s.sub}>{format(now, 'MMMM yyyy')}</p>
      </div>

      {/* New badge toast */}
      {newBadges.map(b => (
        <div key={b.type} className={s.badgeToast}>
          <span>{b.icon}</span>
          <div>
            <div className={s.badgeToastTitle}>Neues Badge freigeschaltet!</div>
            <div className={s.badgeToastName}>{b.name} – {b.desc}</div>
          </div>
        </div>
      ))}

      {/* Level card */}
      <div className={s.levelCard}>
        <div className={s.levelLeft}>
          <span className={s.levelIcon}>{lvl.icon}</span>
          <div>
            <div className={s.levelName}>Lvl {lvl.lvl} · {lvl.name}</div>
            <div className={s.levelSub}>{bestStreak} Tage Best Streak</div>
          </div>
        </div>
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

      {/* Year heatmap */}
      <div className={s.chartCard}>
        <div className={s.chartTitle}>Jahresübersicht</div>
        <div className={s.heatmap}>
          {yearData.map(d => {
            const intensity = d.pct === 0 ? 0 : d.pct < 0.4 ? 1 : d.pct < 0.7 ? 2 : d.pct < 1 ? 3 : 4
            return (
              <div key={d.key} className={s.heatCell}
                style={{ background: [
                  'var(--surface2)',
                  'rgba(34,197,94,0.2)',
                  'rgba(34,197,94,0.4)',
                  'rgba(34,197,94,0.7)',
                  '#22c55e',
                ][intensity] }}
                title={`${d.key}: ${Math.round(d.pct*100)}%`}
              />
            )
          })}
        </div>
        <div className={s.heatLegend}>
          <span style={{color:'var(--text3)', fontSize:10}}>Wenig</span>
          {[0,1,2,3,4].map(i => (
            <div key={i} className={s.heatCell} style={{ background: [
              'var(--surface2)','rgba(34,197,94,0.2)','rgba(34,197,94,0.4)','rgba(34,197,94,0.7)','#22c55e'
            ][i], width:10, height:10 }} />
          ))}
          <span style={{color:'var(--text3)', fontSize:10}}>Viel</span>
        </div>
      </div>

      {/* Weekly bar */}
      <div className={s.chartCard}>
        <div className={s.chartTitle}>Wöchentlicher Verlauf</div>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={weekData} margin={{ top:4, right:4, left:-20, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill:'#9090b0', fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `${Math.round(v*100)}%`} tick={{ fill:'#9090b0', fontSize:10 }} axisLine={false} tickLine={false} domain={[0,1]} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="pct" fill="var(--accent)" radius={[4,4,0,0]}
              background={{ fill:'var(--surface2)', radius:[4,4,0,0] }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-habit */}
      <div className={s.chartCard}>
        <div className={s.chartTitle}>Habit Erfolgsquote – {format(now,'MMMM')}</div>
        {habits.map((h, i) => {
          const pct = getMonthPct(h.id, now.getFullYear(), now.getMonth())
          return (
            <div key={h.id} className={s.habitRow}>
              <span className={s.habitRowIcon}>{h.icon}</span>
              <div className={s.habitRowName}>{h.name}</div>
              <div className={s.habitBarWrap}>
                <div className={s.habitBar} style={{ width:`${Math.round(pct*100)}%`, background: COLORS[i%COLORS.length] }} />
              </div>
              <span className={s.habitPct}>{Math.round(pct*100)}%</span>
            </div>
          )
        })}
      </div>

      {/* Badges */}
      <div className={s.chartCard}>
        <div className={s.chartTitle}>Badges ({badges.length}/{BADGE_DEFINITIONS.length})</div>
        <div className={s.badgeGrid}>
          {BADGE_DEFINITIONS.map(b => {
            const earned = earnedTypes.has(b.type)
            return (
              <div key={b.type} className={`${s.badgeItem} ${earned ? s.badgeEarned : s.badgeLocked}`}
                title={b.desc}>
                <div className={s.badgeIcon}>{earned ? b.icon : '🔒'}</div>
                <div className={s.badgeName}>{b.name}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
