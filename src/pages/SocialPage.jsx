import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useSocialStore } from '../store/useSocialStore'
import s from './SocialPage.module.css'


const LEVELS = [
  { lvl: 1, name: 'Beginner',   icon: '🌱', days: 0   },
  { lvl: 2, name: 'Consistent', icon: '💪', days: 7   },
  { lvl: 3, name: 'Warrior',    icon: '⚔️', days: 21  },
  { lvl: 4, name: 'Champion',   icon: '🏆', days: 50  },
  { lvl: 5, name: 'Legend',     icon: '🔥', days: 100 },
]
function getLevel(streak) {
  let l = LEVELS[0]
  for (const x of LEVELS) { if (streak >= x.days) l = x }
  return l
}

const TABS = ['Friends', 'Leaderboard', 'Suchen']

export default function SocialPage() {
  const { user } = useStore()
  const {
    friends, requests, leaderboard, searchResults,
    fetchFriends, fetchRequests, fetchLeaderboard,
    searchUsers, sendRequest, acceptRequest, removeConnection,
  } = useSocialStore()

  const [tab, setTab]     = useState('Friends')
  const [query, setQuery] = useState('')
  const [sent, setSent]   = useState({})
  const nav = useNavigate()

  useEffect(() => {
    if (!user) return
    fetchFriends(user.id)
    fetchRequests(user.id)
    fetchLeaderboard()
  }, [user])

  useEffect(() => {
    const t = setTimeout(() => searchUsers(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const handleSend = async (toId) => {
    setSent(s => ({ ...s, [toId]: true }))
    await sendRequest(user.id, toId)
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Community</h1>
        {requests.length > 0 && <div className={s.badge}>{requests.length}</div>}
      </div>

      {/* Incoming requests */}
      {requests.length > 0 && (
        <div className={s.section}>
          <div className={s.sectionLabel}>Anfragen</div>
          {requests.map(r => (
            <div key={r.friendshipId} className={s.requestCard}>
              <Avatar name={r.name || r.username} url={r.avatar_url} />
              <div className={s.cardInfo}>
                <div className={s.cardName}>{r.name || r.username}</div>
                <div className={s.cardSub}>@{r.username}</div>
              </div>
              <div className={s.requestBtns}>
                <button className={s.acceptBtn} onClick={() => acceptRequest(r.friendshipId, user.id)}>✓</button>
                <button className={s.declineBtn} onClick={() => removeConnection(r.friendshipId, user.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className={s.tabs}>
        {TABS.map(t => (
          <button key={t} className={`${s.tab} ${tab===t?s.active:''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* Friends */}
      {tab === 'Friends' && (
        <div className={s.section}>
          {friends.length === 0
            ? <div className={s.empty}><span>👥</span><p>Noch keine Freunde.<br/>Suche nach Usernamen!</p></div>
            : friends.map(f => (
              <div key={f.id} className={s.friendCard} onClick={() => nav(`/profile/${f.username}`)}>
                <Avatar name={f.name || f.username} url={f.avatar_url} />
                <div className={s.cardInfo}>
                  <div className={s.cardName}>{f.name || f.username}</div>
                  <div className={s.cardSub}>@{f.username}</div>
                </div>
                <div className={s.chevron}>›</div>
              </div>
            ))
          }
        </div>
      )}

      {/* Leaderboard */}
      {tab === 'Leaderboard' && (
        <div className={s.section}>
          <div className={s.lbHeader}>
            <span className={s.lbHeaderLabel} style={{ flex:1, marginLeft: 82 }}>Spieler</span>
            <span className={s.lbHeaderLabel} style={{ width:52, textAlign:'center' }}>Heute ✓</span>
            <span className={s.lbHeaderLabel} style={{ width:60, textAlign:'center' }}>Level</span>
          </div>
          {leaderboard.map((entry, i) => {
            const isMe = entry.user_id === user?.id
            return (
              <div key={entry.user_id}
                className={`${s.lbRow} ${isMe ? s.lbMe : ''}`}
                onClick={() => !isMe && nav(`/profile/${entry.username}`)}>
                <div className={s.lbRank}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                </div>
                <Avatar name={entry.name || entry.username} url={entry.avatar_url} size={36} />
                <div className={s.cardInfo}>
                  <div className={s.cardName}>{isMe ? 'Du' : (entry.name || entry.username)}</div>
                  <div className={s.cardSub}>@{entry.username}</div>
                </div>
                <div className={s.lbToday}>
                  <span className={s.lbTodayNum}>{entry.today_checks}</span>
                  <span className={s.lbTodayTotal}>/{entry.total_habits}</span>
                </div>
                <div className={s.lbLevel}>
                  {(() => {
                    const l = getLevel(entry.streak_days || 0)
                    return (
                      <div className={s.lbLevelBadge}>
                        <span>{l.icon}</span>
                        <span>{l.name}</span>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Search */}
      {tab === 'Suchen' && (
        <div className={s.section}>
          <input className={s.searchInput} placeholder="Username suchen..."
            value={query} onChange={e => setQuery(e.target.value)} autoFocus />
          {searchResults.length > 0 && query.length >= 2 && (
            searchResults.map(u => {
              const isMe     = u.id === user?.id
              const isFriend = friends.some(f => f.id === u.id)
              const wasSent  = sent[u.id]
              return (
                <div key={u.id} className={s.friendCard}>
                  <Avatar name={u.name || u.username} url={u.avatar_url} />
                  <div className={s.cardInfo} onClick={() => nav(`/profile/${u.username}`)}>
                    <div className={s.cardName}>{u.name || u.username}</div>
                    <div className={s.cardSub}>@{u.username}</div>
                  </div>
                  {!isMe && (
                    isFriend   ? <div className={s.friendTag}>Freund ✓</div>
                    : wasSent  ? <div className={s.sentTag}>Gesendet</div>
                    : <button className={s.addBtn} onClick={() => handleSend(u.id)}>+ Adden</button>
                  )}
                </div>
              )
            })
          )}
          {query.length >= 2 && searchResults.length === 0 && (
            <div className={s.empty}><p>Kein User gefunden.</p></div>
          )}
        </div>
      )}
    </div>
  )
}

export function Avatar({ name, url, size = 40 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
  const hue = [...(name||'')].reduce((a,c) => a + c.charCodeAt(0), 0) % 360
  if (url) return <img src={url} style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} alt={name} />
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:`hsl(${hue},55%,38%)`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize: size*0.35, fontWeight:700, color:'white',
    }}>{initials}</div>
  )
}
