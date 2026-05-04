import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useSocialStore } from '../store/useSocialStore'
import { supabase } from '../lib/supabase'
import s from './SettingsPage.module.css'

export default function SettingsPage() {
  const { user } = useStore()
  const { updateProfile } = useSocialStore()
  const nav = useNavigate()

  const [profile, setProfile] = useState({ name:'', username:'', bio:'', is_public:true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('name,username,bio,is_public').eq('id', user.id).single()
      .then(({ data }) => { if (data) setProfile(p => ({ ...p, ...data })); setLoading(false) })
  }, [user])

  const save = async () => {
    setSaving(true); setMsg('')
    await updateProfile(user.id, {
      name: profile.name, username: profile.username.toLowerCase().replace(/[^a-z0-9_]/g,''),
      bio: profile.bio, is_public: profile.is_public,
    })
    setSaving(false); setMsg('Gespeichert ✓')
    setTimeout(() => setMsg(''), 2500)
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) return <div className={s.page} />

  return (
    <div className={s.page}>
      <button className={s.backBtn} onClick={() => nav(-1)}>‹ Zurück</button>

      <div className={s.header}>
        <h1 className={s.title}>Einstellungen</h1>
      </div>

      <div className={s.section}>
        <div className={s.sectionLabel}>Profil</div>

        <div className={s.field}>
          <label>Name</label>
          <input className={s.input} value={profile.name}
            onChange={e => setProfile(p => ({...p, name: e.target.value}))} placeholder="Dein Name" />
        </div>

        <div className={s.field}>
          <label>Username <span className={s.hint}>(nur a-z, 0-9, _)</span></label>
          <div className={s.inputWrap}>
            <span className={s.inputPre}>@</span>
            <input className={`${s.input} ${s.inputIndent}`} value={profile.username}
              onChange={e => setProfile(p => ({...p, username: e.target.value}))} placeholder="username" />
          </div>
        </div>

        <div className={s.field}>
          <label>Bio</label>
          <textarea className={s.textarea} value={profile.bio}
            onChange={e => setProfile(p => ({...p, bio: e.target.value}))}
            placeholder="Kurz über dich..." rows={3} />
        </div>

        <div className={s.toggleRow}>
          <div>
            <div className={s.toggleLabel}>Öffentliches Profil</div>
            <div className={s.toggleSub}>Andere können dein Profil & Stats sehen</div>
          </div>
          <label className={s.toggle}>
            <input type="checkbox" checked={profile.is_public}
              onChange={e => setProfile(p => ({...p, is_public: e.target.checked}))} />
            <span className={s.slider} />
          </label>
        </div>

        {msg && <div className={s.successMsg}>{msg}</div>}

        <button className={s.saveBtn} onClick={save} disabled={saving}>
          {saving ? 'Speichert...' : 'Speichern'}
        </button>
      </div>

      <div className={s.section}>
        <div className={s.sectionLabel}>Konto</div>
        <div className={s.infoRow}>
          <span className={s.infoLabel}>E-Mail</span>
          <span className={s.infoVal}>{user?.email}</span>
        </div>
        <div className={s.infoRow}>
          <span className={s.infoLabel}>Profil-Link</span>
          <span className={s.infoVal} style={{ color:'var(--accent2)' }}>
            /profile/{profile.username}
          </span>
        </div>
      </div>

      <div className={s.section}>
        <button className={s.logoutBtn} onClick={logout}>Ausloggen</button>
      </div>
    </div>
  )
}
