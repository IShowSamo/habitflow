import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { useSocialStore } from '../store/useSocialStore'
import { Avatar } from './SocialPage'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import s from './FeedPage.module.css'

function activityText(item) {
  const p = item.payload || {}
  switch(item.type) {
    case 'perfect_day':      return { icon:'🔥', text:'Hat heute alle Habits erledigt!' }
    case 'streak_milestone': return { icon:'⚡', text:`${p.streak} Tage Streak erreicht!` }
    case 'badge_earned':     return { icon: p.icon || '🏆', text:`Badge freigeschaltet: ${p.name}` }
    case 'habit_added':      return { icon: p.habit_icon || '✨', text:`Neues Habit gestartet: ${p.habit_name}` }
    case 'manual_post':      return { icon: p.emoji || '💪', text: p.text || '' }
    default:                 return { icon:'📌', text:'Aktivität' }
  }
}

export default function FeedPage() {
  const { user } = useStore()
  const { friends } = useSocialStore()
  const [feed, setFeed]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [reactions, setReactions] = useState({}) // { activityId: count }
  const [myReactions, setMyReactions] = useState(new Set())
  const nav = useNavigate()

  useEffect(() => {
    if (!user) return
    loadFeed()
  }, [user, friends.length])

  const loadFeed = async () => {
    setLoading(true)
    // Get feed from self + friends
    const friendIds = friends.map(f => f.id)
    const allIds = [user.id, ...friendIds]

    const { data } = await supabase
      .from('activity_feed')
      .select(`*, profiles:user_id(id, name, username, avatar_url)`)
      .in('user_id', allIds)
      .order('created_at', { ascending: false })
      .limit(50)

    setFeed(data || [])

    // Load reactions
    if (data?.length) {
      const ids = data.map(d => d.id)
      const { data: reacts } = await supabase
        .from('reactions').select('activity_id, user_id').in('activity_id', ids)

      const counts = {}
      const mine   = new Set()
      ;(reacts || []).forEach(r => {
        counts[r.activity_id] = (counts[r.activity_id] || 0) + 1
        if (r.user_id === user.id) mine.add(r.activity_id)
      })
      setReactions(counts)
      setMyReactions(mine)
    }
    setLoading(false)
  }

  const toggleReact = async (activityId) => {
    if (myReactions.has(activityId)) {
      await supabase.from('reactions').delete()
        .eq('activity_id', activityId).eq('user_id', user.id)
      setMyReactions(s => { const n = new Set(s); n.delete(activityId); return n })
      setReactions(r => ({ ...r, [activityId]: Math.max((r[activityId]||1)-1, 0) }))
    } else {
      await supabase.from('reactions').upsert({ activity_id: activityId, user_id: user.id })
      setMyReactions(s => new Set([...s, activityId]))
      setReactions(r => ({ ...r, [activityId]: (r[activityId]||0)+1 }))
    }
  }

  const [showPost, setShowPost] = useState(false)
  const [postText, setPostText] = useState('')
  const POST_EMOJIS = ['💪','🔥','⚡','🏆','😤','🎯','✅','🌱']
  const [postEmoji, setPostEmoji] = useState('💪')

  const submitPost = async () => {
    if (!postText.trim()) return
    await supabase.from('activity_feed').insert({
      user_id: user.id,
      type: 'manual_post',
      payload: { text: postText, emoji: postEmoji }
    })
    setPostText(''); setShowPost(false)
    loadFeed()
  }

  if (loading) return (
    <div className={s.page}>
      <div className={s.header}><h1 className={s.title}>Feed</h1></div>
      <div className={s.empty}><p>Lädt...</p></div>
    </div>
  )

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Feed</h1>
          <p className={s.sub}>Was deine Freunde machen</p>
        </div>
        <button className={s.postBtn} onClick={() => setShowPost(v => !v)}>
          {showPost ? '✕' : '+ Post'}
        </button>
      </div>

      {showPost && (
        <div className={s.postBox}>
          <div className={s.postEmojiRow}>
            {['💪','🔥','⚡','🏆','😤','🎯','✅','🌱'].map(e => (
              <button key={e} className={`${s.postEmoji} ${postEmoji===e ? s.postEmojiSel : ''}`}
                onClick={() => setPostEmoji(e)}>{e}</button>
            ))}
          </div>
          <textarea className={s.postInput} placeholder="Was motiviert dich heute?"
            value={postText} onChange={e => setPostText(e.target.value)} rows={2} />
          <button className={s.postSubmit} onClick={submitPost} disabled={!postText.trim()}>
            Posten
          </button>
        </div>
      )}

      {feed.length === 0 ? (
        <div className={s.empty}>
          <span>🌱</span>
          <p>Noch nichts im Feed.<br/>Adde Freunde um ihre Aktivitäten zu sehen!</p>
        </div>
      ) : feed.map(item => {
        const profile = item.profiles
        const { icon, text } = activityText(item)
        const isMe = item.user_id === user.id
        const reacted = myReactions.has(item.id)
        const reactCount = reactions[item.id] || 0

        return (
          <div key={item.id} className={s.feedCard}>
            <div className={s.feedHeader}>
              <div style={{ cursor:'pointer' }}
                onClick={() => profile?.username && nav(`/profile/${profile.username}`)}>
                <Avatar name={profile?.name || profile?.username} url={profile?.avatar_url} size={38} />
              </div>
              <div className={s.feedMeta}>
                <div className={s.feedName}>
                  {isMe ? 'Du' : (profile?.name || profile?.username)}
                </div>
                <div className={s.feedTime}>
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: de })}
                </div>
              </div>
            </div>

            <div className={s.feedBody}>
              <span className={s.feedActivityIcon}>{icon}</span>
              <span className={s.feedText}>{text}</span>
            </div>

            <div className={s.feedFooter}>
              <button
                className={`${s.reactBtn} ${reacted ? s.reacted : ''}`}
                onClick={() => toggleReact(item.id)}>
                👏 {reactCount > 0 ? reactCount : ''}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
