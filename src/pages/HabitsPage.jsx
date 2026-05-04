import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
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

export default function HabitsPage() {
  const { habits, addHabit, updateHabit, user } = useStore()
  const [archived, setArchived] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [seedLoading, setSeedLoading] = useState(false)
  const [form, setForm] = useState({ name:'', icon:'⭐', color:'#6c63ff', notif_time:'08:00', notif_on:true })

  // Load archived habits
  const fetchArchived = async () => {
    if (!user) return
    const { data } = await supabase.from('habits')
      .select('*').eq('user_id', user.id).eq('archived', true).order('sort_order')
    setArchived(data || [])
  }

  useEffect(() => { fetchArchived() }, [user])

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

  // Archive (soft delete)
  const archiveHabit = async (id) => {
    await updateHabit(id, { archived: true })
    await fetchArchived()
  }

  // Restore from archive
  const restoreHabit = async (h) => {
    await supabase.from('habits').update({ archived: false }).eq('id', h.id)
    // Refresh both lists
    const { fetchTodayAndWeek } = useStore.getState()
    await fetchTodayAndWeek()
    await fetchArchived()
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>My Habits</h1>
        <button className={`${s.addBtn} ${showForm ? s.addBtnClose : ''}`}
          onClick={() => setShowForm(v => !v)}>
          {showForm ? '✕ Schließen' : '+ Neu'}
        </button>
      </div>

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

      {/* Active habits */}
      {habits.length > 0 && (
        <>
          <div className={s.sectionLabel}>Aktive Habits ({habits.length})</div>
          {habits.map(h => (
            <div key={h.id} className={s.manageCard}>
              <div className={s.manageIcon} style={{ background: h.color + '22' }}>{h.icon}</div>
              <div className={s.manageName}>{h.name}</div>
              <div className={s.manageActions}>
                <button className={s.archiveBtn} onClick={() => archiveHabit(h.id)} title="Deaktivieren">
                  ⏸
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Archived habits */}
      <div className={s.archivedHeader} onClick={() => { setShowArchived(v => !v); fetchArchived() }}>
        <span className={s.sectionLabel} style={{ margin: 0 }}>
          Deaktivierte Habits {archived.length > 0 ? `(${archived.length})` : ''}
        </span>
        <span style={{ color: 'var(--text3)', fontSize: 18 }}>{showArchived ? '▲' : '▼'}</span>
      </div>

      {showArchived && (
        archived.length === 0
          ? <div className={s.emptyArchive}>Keine deaktivierten Habits</div>
          : archived.map(h => (
            <div key={h.id} className={`${s.manageCard} ${s.archivedCard}`}>
              <div className={s.manageIcon} style={{ background: h.color + '22', opacity: 0.5 }}>{h.icon}</div>
              <div className={s.manageName} style={{ opacity: 0.5 }}>{h.name}</div>
              <div className={s.manageActions}>
                <button className={s.restoreBtn} onClick={() => restoreHabit(h)} title="Wiederherstellen">
                  ▶ Aktivieren
                </button>
              </div>
            </div>
          ))
      )}
    </div>
  )
}
