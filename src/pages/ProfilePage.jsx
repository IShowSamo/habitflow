import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useStore } from '../store/useStore'
import { useSocialStore } from '../store/useSocialStore'
import { Avatar } from './SocialPage'
import s from './ProfilePage.module.css'

export default function ProfilePage() {
  const { username } = useParams()
  const nav = useNavigate()
  const { user } = useStore()
  const { fetchProfile, viewedProfile, loading, getFriendshipStatus, sendRequest, removeConnection, fetchFriends } = useSocialStore()

  const [friendship, setFriendship] = useState(null)   // null | { id, status, requester }
  const [actionDone, setActionDone] = useState(false)

  const todayKey = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    fetchProfile(username)
  }, [username])

  useEffect(() => {
    if (!viewedProfile || !user) return
    const { profile } = viewedProfile
    if (profile.id === user.id) return  // own profile
    getFriendshipStatus(user.id, profile.id).then(setFriendship)
  }, [viewedProfile, user])

  const handleFriendAction = async () => {
    const { profile } = viewedProfile
    if (!friendship) {
      await sendRequest(user.id, profile.id)
      setFriendship({ status: 'pending', requester: user.id })
      setActionDone(true)
    } else if (friendship.status === 'accepted') {
      await removeConnection(friendship.id, user.id)
      await fetchFriends(user.id)
      setFriendship(null)
    }
  }

  if (loading) return (
    <div className={s.loadWrap}>
      <svg width="36" height="36" viewBox="0 0 36 36" style={{ animation:'spin 0.8s linear infinite' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <circle cx="18" cy="18" r="14" fill="none" stroke="var(--surface2)" strokeWidth="3"/>
        <circle cx="18" cy="18" r="14" fill="none" stroke="var(--accent)" strokeWidth="3" strokeDasharray="52 36" strokeLinecap="round"/>
      </svg>
    </div>
  )

  if (!viewedProfile) return (
    <div className={s.loadWrap}>
      <p style={{ color:'var(--text2)' }}>Profil nicht gefunden.</p>
      <button className={s.backBtn} onClick={() => nav(-1)}>← Zurück</button>
    </div>
  )

  const { profile, habits, logs, streaks, todayPct, monthPct } = viewedProfile
  const isMe = profile.id === user?.id
  const todayDone = habits.filter(h => logs[todayKey]?.[h.id]).length
  const bestStreak = Math.max(...Object.values(streaks), 0)
  const COLORS = ['#6c63ff','#22c55e','#f59e0b','#ef4444','#06b6d4','#f97316','#8b5cf6']

  const friendBtnLabel = () => {
    if (!friendship || actionDone && !friendship)          return '+ Adden'
    if (actionDone || friendship.status === 'pending')     return 'Anfrage gesendet'
    if (friendship.status === 'accepted')                  return 'Freunde ✓'
    return '+ Adden'
  }
  const friendBtnStyle = friendship?.status === 'accepted' ? s.friendedBtn : s.addBtn

  return (
    <div className={s.page}>
      {/* Back */}
      <button className={s.backBtn} onClick={() => nav(-1)}>‹ Zurück</button>

      {/* Profile hero */}
      <div className={s.hero}>
        <Avatar name={profile.name || profile.username} url={profile.avatar_url} size={72} />
        <h1 className={s.heroName}>{profile.name || profile.username}</h1>
        <p className={s.heroUser}>@{profile.username}</p>
        {profile.bio && <p className={s.heroBio}>{profile.bio}</p>}

        {!isMe && (
          <button
            className={`${s.heroBtn} ${friendship?.status === 'accepted' ? s.heroFriended : ''}`}
            onClick={handleFriendAction}
            disabled={friendship?.status === 'pending' || actionDone}>
            {friendBtnLabel()}
          </button>
        )}
        {isMe && (
          <button className={s.heroBtn} onClick={() => nav('/settings')}>Profil bearbeiten</button>
        )}
      </div>

      {/* Stats row */}
      <div className={s.statsRow}>
        <div className={s.statBox}>
          <div className={s.statVal} style={{ color:'var(--gold)' }}>🔥 {bestStreak}</div>
          <div className={s.statLabel}>Best Streak</div>
        </div>
        <div className={s.statBox}>
          <div className={s.statVal}>{habits.length}</div>
          <div className={s.statLabel}>Habits</div>
        </div>
        <div className={s.statBox}>
          <div className={s.statVal} style={{ color:'var(--green)' }}>{Math.round(monthPct*100)}%</div>
          <div className={s.statLabel}>Dieser Monat</div>
        </div>
      </div>

      {/* Today progress */}
      <div className={s.card}>
        <div className={s.cardTitle}>Heute</div>
        <div className={s.todayRow}>
          <div className={s.todayPct}>{Math.round(todayPct * 100)}%</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, color:'var(--text2)', marginBottom:8 }}>
              {todayDone} von {habits.length} Habits erledigt
            </div>
            <div className={s.progBar}>
              <div className={s.progFill} style={{ width:`${Math.round(todayPct*100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Habits - show icons only, no names for privacy */}
      <div className={s.card}>
        <div className={s.cardTitle}>Aktive Habits ({habits.length})</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
          {habits.map(h => {
            const streak = streaks[h.id] || 0
            const checked = logs[todayKey]?.[h.id]
            return (
              <div key={h.id} title={streak > 0 ? `🔥 ${streak} Tage Streak` : 'Kein Streak'}
                style={{
                  width:48, height:48, borderRadius:12,
                  background: h.color + '22',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:22, position:'relative',
                  border: checked ? '2px solid #22c55e' : '2px solid transparent',
                }}>
                {h.icon}
                {streak > 0 && (
                  <div style={{
                    position:'absolute', bottom:-4, right:-4,
                    background:'var(--gold)', borderRadius:'50%',
                    width:16, height:16, fontSize:9, fontWeight:700,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'#000',
                  }}>{streak}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Month completion - aggregate only */}
      <div className={s.card}>
        <div className={s.cardTitle}>Monatsquote (gesamt)</div>
        {habits.slice(0,1).map((h, i) => {
          const now = new Date()
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          // Count ALL days from month start to today
          const totalDays = Math.floor((now - monthStart) / 86400000) + 1
          let doneDays = 0
          for (let d = 0; d < totalDays; d++) {
            const dd = new Date(monthStart)
            dd.setDate(dd.getDate() + d)
            const k = dd.toISOString().slice(0,10)
            if (logs[k]?.[h.id]) doneDays++
          }
          const pct = totalDays > 0 ? doneDays / totalDays : 0
          return (
            <div key={h.id} className={s.barRow}>
              <span className={s.barIcon}>{h.icon}</span>
              <div className={s.barWrap}>
                <div className={s.barFill} style={{ width:`${Math.round(pct*100)}%`, background: COLORS[i%COLORS.length] }} />
              </div>
              <span className={s.barPct}>{Math.round(pct*100)}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
