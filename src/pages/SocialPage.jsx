import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useSocialStore } from '../store/useSocialStore'
import s from './SocialPage.module.css'

const TABS = ['Friends', 'Leaderboard', 'Suchen']

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

export default function SocialPage() {
  const { user } = useStore()
  const {
    friends, requests, leaderboard, searchResults, inAppNotifs,
    fetchFriends, fetchRequests, fetchLeaderboard, fetchInAppNotifs, markNotifsRead,
    searchUsers, sendRequest, acceptRequest, removeConnection,
  } = useSocialStore()

  const [tab, setTab]       = useState('Friends')
  const [query, setQuery]   = useState('')
  const [sent, setSent]     = useState({})
  const [showNotifs, setShowNotifs] = useState(false)
  // Auto-open notif panel if there are pending requests
  useEffect(() => {
    if (requests.length > 0 || inAppNotifs.some(n => !n.read && n.type === 'friend_request')) {
      setShowNotifs(true)
    }
  }, [requests.length, inAppNotifs.length])
  const nav = useNavigate()

  useEffect(() => {
    if (!user) return
    fetchFriends(user.id)
    fetchRequests(user.id)
    fetchLeaderboard()
    fetchInAppNotifs(user.id)
  }, [user])

  useEffect(() => {
    const t = setTimeout(() => searchUsers(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const handleSend = async (toId) => {
    setSent(s => ({ ...s, [toId]: true }))
    await sendRequest(user.id, toId)
  }

  const unreadCount = inAppNotifs.filter(n => !n.read).length
  const pendingSent = [] // could track sent requests

  return (
    <div className={s.page}>

      {/* Header */}
      <div className={s.header}>
        <h1 className={s.title}>Community</h1>
        <button className={s.notifBtn} onClick={() => {
          setShowNotifs(v => !v)
          if (!showNotifs && unreadCount > 0) markNotifsRead(user.id)
        }}>
          🔔
          {unreadCount > 0 && <span className={s.notifDot}>{unreadCount}</span>}
        </button>
      </div>

      {/* Notification dropdown */}
      {showNotifs && (
        <div className={s.notifPanel}>
          <div className={s.notifPanelTitle}>Benachrichtigungen</div>
          {inAppNotifs.length === 0
            ? <div className={s.notifEmpty}>Keine Benachrichtigungen</div>
            : inAppNotifs.map(n => {
              // Find matching pending request for friend_request notifications
              const pendingReq = n.type === 'friend_request'
                ? requests.find(r => r.id === n.from_id)
                : null

              return (
                <div key={n.id} className={`${s.notifItem} ${!n.read ? s.notifUnread : ''}`}>
                  <Avatar name={n.from_name || '?'} url={n.from_avatar} size={36} />
                  <div className={s.notifText}>
                    <div>
                      {n.type === 'friend_request'
                        ? <><b>{n.from_name}</b> hat dir eine Freundschaftsanfrage geschickt</>
                        : <><b>{n.from_name}</b> hat deine Anfrage angenommen! 🎉</>
                      }
                    </div>
                    <div className={s.notifTime}>{new Date(n.created_at).toLocaleDateString('de-DE')}</div>
                    {n.type === 'friend_request' && (
                      <NotifRequestActions
                        fromId={n.from_id}
                        fromName={n.from_name}
                        requests={requests}
                        userId={user.id}
                        acceptRequest={acceptRequest}
                        removeConnection={removeConnection}
                        onDone={() => fetchInAppNotifs(user.id)}
                      />
                    )}
                  </div>
                </div>
              )
            })
          }
        </div>
      )}

      {/* Incoming requests */}
      {requests.length > 0 && (
        <div className={s.section}>
          <div className={s.sectionLabel}>📨 Ausstehende Anfragen</div>
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
          <button key={t} className={`${s.tab} ${tab===t ? s.active : ''}`} onClick={() => setTab(t)}>{t}</button>
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
            <span className={s.lbHeaderLabel} style={{ flex:1, marginLeft:78 }}>Spieler</span>
            <span className={s.lbHeaderLabel} style={{ width:52, textAlign:'center' }}>Heute ✓</span>
            <span className={s.lbHeaderLabel} style={{ width:80, textAlign:'right' }}>Level</span>
          </div>
          {leaderboard.length === 0
            ? <div className={s.empty}><p>Adde Freunde um das Leaderboard zu sehen!</p></div>
            : leaderboard.map((entry, i) => {
              const isMe = entry.user_id === user?.id
              const lvl  = getLevel(entry.streak_days || 0)
              return (
                <div key={entry.user_id}
                  className={`${s.lbRow} ${isMe ? s.lbMe : ''}`}
                  onClick={() => !isMe && nav(`/profile/${entry.username}`)}>
                  <div className={s.lbRank}>
                    {i===0 ? '🥇' : i===1 ? '🥈' : i===2 ? '🥉' : `#${i+1}`}
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
                    <div className={s.lbLevelBadge}>{lvl.icon} {lvl.name}</div>
                  </div>
                </div>
              )
            })
          }
        </div>
      )}

      {/* Search */}
      {tab === 'Suchen' && (
        <div className={s.section}>
          <div className={s.searchWrap}>
            <span className={s.searchIcon}>🔍</span>
            <input className={s.searchInput} placeholder="Username oder Name suchen..."
              value={query} onChange={e => setQuery(e.target.value)} autoFocus />
            {query.length > 0 && (
              <button className={s.searchClear} onClick={() => setQuery('')}>✕</button>
            )}
          </div>
          {searchResults.map(u => {
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
                  : wasSent  ? <div className={s.sentTag}>Gesendet ✓</div>
                  : <button className={s.addBtn} onClick={() => handleSend(u.id)}>+ Adden</button>
                )}
              </div>
            )
          })}
          {query.length >= 2 && searchResults.length === 0 && (
            <div className={s.empty}><p>Kein User gefunden.</p></div>
          )}
        </div>
      )}
    </div>
  )
}

function NotifRequestActions({ fromId, requests, userId, acceptRequest, removeConnection, onDone }) {
  const [done, setDone] = useState(false)
  const [action, setAction] = useState(null)

  // Find the friendship request
  // requests items: { friendshipId, id (user profile id), username, name, avatar_url }
  const req = requests.find(r => r.id === fromId)

  if (done) return (
    <div style={{ fontSize:12, color: action==='accept' ? 'var(--green)' : 'var(--text3)', marginTop:6 }}>
      {action === 'accept' ? '✓ Angenommen' : '✕ Abgelehnt'}
    </div>
  )

  if (!req) return (
    <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>
      Bereits bearbeitet
    </div>
  )

  return (
    <div style={{ display:'flex', gap:8, marginTop:8 }}>
      <button
        onClick={async (e) => { e.stopPropagation(); await acceptRequest(req.friendshipId, userId); setAction('accept'); setDone(true); onDone() }}
        style={{
          padding:'6px 14px', borderRadius:99, border:'none',
          background:'rgba(34,197,94,0.15)', color:'var(--green)',
          fontSize:12, fontWeight:600, cursor:'pointer'
        }}>✓ Annehmen</button>
      <button
        onClick={async (e) => { e.stopPropagation(); await removeConnection(req.friendshipId, userId); setAction('decline'); setDone(true); onDone() }}
        style={{
          padding:'6px 14px', borderRadius:99,
          border:'1px solid var(--border2)',
          background:'transparent', color:'var(--text2)',
          fontSize:12, fontWeight:600, cursor:'pointer'
        }}>✕ Ablehnen</button>
    </div>
  )
}


export function Avatar({ name, url, size = 40 }) {
  const initials = (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
  const hue = [...(name||'')].reduce((a,c) => a+c.charCodeAt(0), 0) % 360
  if (url) return <img src={url} style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} alt={name} />
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:`hsl(${hue},55%,38%)`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size*0.35, fontWeight:700, color:'white',
    }}>{initials}</div>
  )
}
