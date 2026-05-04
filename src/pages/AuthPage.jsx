import { useState } from 'react'
import { supabase } from '../lib/supabase'
import s from './AuthPage.module.css'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { name } }
      })
      if (error) setError(error.message)
      else setSuccess('Check deine E-Mail und bestätige deinen Account!')
    }
    setLoading(false)
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.logo}>
          <span className={s.logoIcon}>🌿</span>
          <h1 className={s.logoText}>HabitFlow</h1>
          <p className={s.logoSub}>Build the life you want, one habit at a time.</p>
        </div>

        <div className={s.tabs}>
          <button className={`${s.tab} ${mode==='login'?s.active:''}`} onClick={()=>setMode('login')}>Login</button>
          <button className={`${s.tab} ${mode==='signup'?s.active:''}`} onClick={()=>setMode('signup')}>Registrieren</button>
        </div>

        <form onSubmit={submit} className={s.form}>
          {mode === 'signup' && (
            <div className={s.field}>
              <label>Name</label>
              <input type="text" value={name} onChange={e=>setName(e.target.value)}
                placeholder="Dein Name" required autoComplete="name" />
            </div>
          )}
          <div className={s.field}>
            <label>E-Mail</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="deine@email.de" required autoComplete="email" />
          </div>
          <div className={s.field}>
            <label>Passwort</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="Mindestens 6 Zeichen" required autoComplete={mode==='login'?'current-password':'new-password'} minLength={6} />
          </div>

          {error   && <div className={s.error}>{error}</div>}
          {success && <div className={s.success}>{success}</div>}

          <button type="submit" className={s.submit} disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Einloggen' : 'Account erstellen'}
          </button>
        </form>

        <p className={s.footer}>
          {mode === 'login' ? 'Noch kein Account? ' : 'Bereits registriert? '}
          <button className={s.switchBtn} onClick={()=>setMode(mode==='login'?'signup':'login')}>
            {mode === 'login' ? 'Registrieren' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  )
}
