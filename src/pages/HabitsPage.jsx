import { useState } from 'react'
import { useStore } from '../store/useStore'
import s from './HabitsPage.module.css'

const EMOJIS = ['⭐','🏃','🧠','💊','🥗','😴','🧘','✍️','🎯','🚴','🙏','🌊','📖','🎵','💻','🌱','🦷','🧹','💸','❤️']
const COLORS  = ['#6c63ff','#22c55e','#f59e0b','#ef4444','#06b6d4','#f97316','#8b5cf6','#ec4899','#14b8a6','#84cc16']

const DEFAULT_HABITS = [
  { name:'5 Uhr aufstehen', icon:'🌅', color:'#f59e0b', notif_time:'05:00', notif_on:true },
  { name:'Gym',             icon:'💪', color:'#ef4444', notif_time:'07:00', notif_on:true },
  { name:'Keine Pornos',    icon:'🚫', color:'#8b5cf6', notif_time:'21:00', notif_on:false },
  { name:'Lesen / Lernen',  icon:'📚', color:'#3b82f6', notif_time:'20:00', notif_on:true },
  { name:'Kein Alkohol',    icon:'🍺', color:'#22c55e', notif_time:'18:00', notif_on:false },
  { name:'Social Media Detox (max 1h)', icon:'📵', color:'#f97316', notif_time:'09:00', notif_on:true },
  { name:'Kalte Dusche',    icon:'🚿', color:'#06b6d4', notif_time:'07:30', notif_on:true },
]

function requestNotifPermission(cb) {
  if (!('Notification' in window)) { alert('Push Notifications werden auf diesem Gerät nicht unterstützt.'); return }
  Notification.requestPermission().then(perm => {
    if (perm === 'granted') cb()
    else alert('Benachrichtigungen wurden abgelehnt. Bitte in den Browser-Einstellungen erlauben.')
  })
}

export default function HabitsPage() {
  const { habits, addHabit, deleteHabit, updateHabit } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [seedLoading, setSeedLoading] = useState(false)
  const [form, setForm] = useState({ name:'', icon:'⭐', color:'#6c63ff', notif_time:'08:00', notif_on:true })

  const handleAdd = async () => {
    if (!form.name.trim()) return
    await addHabit(form)
    setForm({ name:'', icon:'⭐', color:'#6c63ff', notif_time:'08:00', notif_on:true })
    setShowForm(false)
  }

  const handleSeed = async () => {
    setSeedLoading(true)
    for (const h of DEFAULT_HABITS) await addHabit(h)
    setSeedLoading(false)
  }

  const handleNotifToggle = async (h, val) => {
    if (val) {
      requestNotifPermission(async () => {
        await updateHabit(h.id, { notif_on: true })
        scheduleNotification(h)
      })
    } else {
      await updateHabit(h.id, { notif_on: false })
    }
  }

  const scheduleNotification = (h) => {
    const [hr, min] = h.notif_time.split(':').map(Number)
    const now = new Date()
    const next = new Date()
    next.setHours(hr, min, 0, 0)
    if (next <= now) next.setDate(next.getDate() + 1)
    const ms = next - now
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('HabitFlow 🌿', { body: `Zeit für: ${h.icon} ${h.name}`, icon: '/icon-192.png' })
      }
    }, ms)
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>My Habits</h1>
        <button className={s.addBtn} onClick={() => setShowForm(v => !v)}>
          {showForm ? '✕' : '+ Neu'}
        </button>
      </div>

      {/* Seed button if no habits */}
      {habits.length === 0 && !showForm && (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>🌱</div>
          <p className={s.emptyText}>Noch keine Habits.</p>
          <button className={s.seedBtn} onClick={handleSeed} disabled={seedLoading}>
            {seedLoading ? 'Wird geladen...' : 'Standard-Habits laden'}
          </button>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className={s.formCard}>
          <div className={s.formField}>
            <label>Name</label>
            <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
              placeholder="z.B. Meditation" type="text" className={s.input} />
          </div>

          <div className={s.formField}>
            <label>Icon</label>
            <div className={s.emojiGrid}>
              {EMOJIS.map(e => (
                <button key={e} className={`${s.emojiBtn} ${form.icon===e ? s.emojiSel : ''}`}
                  onClick={() => setForm(f => ({...f, icon:e}))}>{e}</button>
              ))}
            </div>
          </div>

          <div className={s.formField}>
            <label>Farbe</label>
            <div className={s.colorRow}>
              {COLORS.map(c => (
                <button key={c} className={`${s.colorDot} ${form.color===c ? s.colorSel : ''}`}
                  style={{ background: c }} onClick={() => setForm(f => ({...f, color:c}))} />
              ))}
            </div>
          </div>

          <div className={s.formField}>
            <label>Erinnerung</label>
            <input type="time" value={form.notif_time}
              onChange={e => setForm(f => ({...f, notif_time: e.target.value}))} className={s.input} />
          </div>

          <div className={s.formBtns}>
            <button className={s.cancelBtn} onClick={() => setShowForm(false)}>Abbrechen</button>
            <button className={s.confirmBtn} onClick={handleAdd}>Hinzufügen</button>
          </div>
        </div>
      )}

      {/* Habit list */}
      {habits.length > 0 && (
        <>
          <div className={s.sectionLabel}>Aktive Habits</div>
          {habits.map(h => (
            <div key={h.id} className={s.manageCard}>
              <div className={s.manageIcon} style={{ background: h.color + '22' }}>{h.icon}</div>
              <div className={s.manageName}>{h.name}</div>
              <div className={s.manageActions}>
                <label className={s.toggle}>
                  <input type="checkbox" checked={h.notif_on}
                    onChange={e => handleNotifToggle(h, e.target.checked)} />
                  <span className={s.toggleSlider} />
                </label>
                <button className={s.delBtn} onClick={() => deleteHabit(h.id)}>✕</button>
              </div>
            </div>
          ))}

          <div className={s.sectionLabel} style={{ marginTop: 24 }}>Erinnerungen</div>
          {habits.map(h => (
            <div key={h.id} className={s.notifCard}>
              <div>
                <div className={s.notifName}>{h.icon} {h.name}</div>
                <div className={s.notifTime}>{h.notif_time} Uhr</div>
              </div>
              <label className={s.toggle}>
                <input type="checkbox" checked={h.notif_on}
                  onChange={e => handleNotifToggle(h, e.target.checked)} />
                <span className={s.toggleSlider} />
              </label>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
