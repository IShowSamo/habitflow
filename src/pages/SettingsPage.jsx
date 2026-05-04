import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useSocialStore } from '../store/useSocialStore'
import { supabase } from '../lib/supabase'
import s from './SettingsPage.module.css'

export default function SettingsPage() {
  const { user } = useStore()
  const { updateProfile } = useSocialStore()
  const nav = useNavigate()
  const fileRef = useRef()

  const [profile, setProfile] = useState({ name:'', username:'', bio:'', is_public:true, avatar_url:'' })
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg]             = useState('')
  const [error, setError]         = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('name,username,bio,is_public,avatar_url').eq('id', user.id).single()
      .then(({ data }) => { if (data) setProfile(p => ({ ...p, ...data })); setLoading(false) })
  }, [user])

  const save = async () => {
    setSaving(true); setMsg(''); setError('')
    const clean = profile.username.toLowerCase().replace(/[^a-z0-9_]/g,'')
    const { error: err } = await supabase.from('profiles').update({
      name: profile.name, username: clean,
      bio: profile.bio, is_public: profile.is_public,
      avatar_url: profile.avatar_url,
    }).eq('id', user.id)
    setSaving(false)
    if (err) setError(err.message)
    else { setMsg('Gespeichert ✓'); setTimeout(() => setMsg(''), 2500) }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate
    if (!file.type.startsWith('image/')) { setError('Nur Bilder erlaubt'); return }
    if (file.size > 2 * 1024 * 1024)    { setError('Max. 2MB'); return }

    setUploading(true); setError('')

    // Convert to base64 data URL for simple storage
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result

      // Try Supabase Storage first, fall back to data URL
      try {
        const ext  = file.name.split('.').pop()
        const path = `avatars/${user.id}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('avatars')
          .upload(path, file, { upsert: true, contentType: file.type })

        if (!upErr) {
          const { data } = supabase.storage.from('avatars').getPublicUrl(path)
          setProfile(p => ({ ...p, avatar_url: data.publicUrl + '?t=' + Date.now() }))
        } else {
          // Fallback: store as data URL directly in profile
          setProfile(p => ({ ...p, avatar_url: dataUrl }))
        }
      } catch {
        setProfile(p => ({ ...p, avatar_url: dataUrl }))
      }
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const logout = async () => { await supabase.auth.signOut() }

  const initials = (profile.name || user?.email || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
  const hue = [...(profile.name || '')].reduce((a,c) => a + c.charCodeAt(0), 0) % 360

  if (loading) return <div className={s.page} />

  return (
    <div className={s.page}>
      <button className={s.backBtn} onClick={() => nav(-1)}>‹ Zurück</button>

      <div className={s.header}>
        <h1 className={s.title}>Einstellungen</h1>
      </div>

      {/* Avatar upload */}
      <div className={s.section}>
        <div className={s.sectionLabel}>Profilbild</div>
        <div className={s.avatarWrap}>
          <div className={s.avatarPreview} style={{ background: `hsl(${hue},55%,38%)` }}
            onClick={() => fileRef.current?.click()}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="avatar" className={s.avatarImg} />
              : <span className={s.avatarInitials}>{initials}</span>
            }
            <div className={s.avatarOverlay}>
              {uploading ? '⏳' : '📷'}
            </div>
          </div>
          <div className={s.avatarInfo}>
            <button className={s.uploadBtn} onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? 'Wird hochgeladen...' : 'Bild hochladen'}
            </button>
            <p className={s.uploadHint}>JPG, PNG oder GIF · max. 2MB</p>
            {profile.avatar_url && (
              <button className={s.removeBtn} onClick={() => setProfile(p => ({...p, avatar_url:''}))}>
                Bild entfernen
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
            onChange={handleAvatarUpload} />
        </div>
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

        {error && <div className={s.errorMsg}>{error}</div>}
        {msg   && <div className={s.successMsg}>{msg}</div>}

        <button className={s.saveBtn} onClick={save} disabled={saving || uploading}>
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
          <span className={s.infoVal} style={{ color:'var(--accent2)' }}>/profile/{profile.username}</span>
        </div>
      </div>

      <div className={s.section}>
        <button className={s.logoutBtn} onClick={logout}>Ausloggen</button>
      </div>
    </div>
  )
}
