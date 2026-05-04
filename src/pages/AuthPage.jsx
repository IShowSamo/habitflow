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
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)

  const handleReset = async () => {
    if (!resetEmail) return
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: window.location.origin + '/auth',
    })
    setLoading(false)
    if (error) setError(error.message)
    else setResetSent(true)
  }

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

          {mode === 'login' && !showReset && (
            <button type="button" className={s.forgotBtn}
              onClick={() => { setShowReset(true); setError(''); setSuccess('') }}>
              Passwort vergessen?
            </button>
          )}

          {showReset && (
            <div className={s.resetBox}>
              <p className={s.resetTitle}>Passwort zurücksetzen</p>
              {resetSent
                ? <p className={s.resetSuccess}>✓ E-Mail gesendet! Prüfe dein Postfach.</p>
                : <>
                    <input className={s.resetInput} type="email"
                      placeholder="Deine E-Mail-Adresse"
                      value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
                    <div className={s.resetBtns}>
                      <button type="button" className={s.resetCancel}
                        onClick={() => { setShowReset(false); setResetSent(false) }}>Abbrechen</button>
                      <button type="button" className={s.resetSend}
                        onClick={handleReset} disabled={loading}>
                        {loading ? '...' : 'Link senden'}
                      </button>
                    </div>
                  </>
              }
            </div>
          )}

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
