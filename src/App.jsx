import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useStore } from './store/useStore'
import AuthPage   from './pages/AuthPage'
import AppShell   from './pages/AppShell'
import Onboarding from './pages/Onboarding'
import Tutorial   from './pages/Tutorial'

export default function App() {
  const { user, setUser } = useStore()
  const [checking,     setChecking]     = useState(true)
  const [onboarded,    setOnboarded]    = useState(false)
  const [tutorialDone, setTutorialDone] = useState(false)

  useEffect(() => {
    // Check for existing session on load (persisted automatically by Supabase)
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) loadUserMeta(u)
      setChecking(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) loadUserMeta(u)
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadUserMeta = (u) => {
    const meta = u.user_metadata || {}
    setOnboarded(!!meta.onboarded)
    setTutorialDone(!!meta.tutorial_done)
  }

  const handleOnboardingFinish = async () => {
    await supabase.auth.updateUser({ data: { onboarded: true } })
    setOnboarded(true)
  }

  const handleTutorialFinish = async () => {
    await supabase.auth.updateUser({ data: { tutorial_done: true } })
    setTutorialDone(true)
  }

  // Show spinner while checking session
  if (checking) return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', gap: 16
    }}>
      <div style={{ fontSize: 36 }}>🌿</div>
      <Spinner />
      <p style={{ color: 'var(--text2)', fontSize: 13 }}>HabitFlow wird geladen...</p>
    </div>
  )

  if (!user) return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/*"   element={<Navigate to="/auth" />} />
    </Routes>
  )

  if (!onboarded) return <Onboarding onFinish={handleOnboardingFinish} />

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <AppShell />
      {!tutorialDone && <Tutorial onFinish={handleTutorialFinish} />}
    </div>
  )
}

function Spinner() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36"
      style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <circle cx="18" cy="18" r="14" fill="none" stroke="var(--surface2)" strokeWidth="3" />
      <circle cx="18" cy="18" r="14" fill="none" stroke="var(--accent)" strokeWidth="3"
        strokeDasharray="52 36" strokeLinecap="round" />
    </svg>
  )
}
