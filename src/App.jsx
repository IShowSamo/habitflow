import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useStore } from './store/useStore'
import AuthPage   from './pages/AuthPage'
import AppShell   from './pages/AppShell'
import Onboarding from './pages/Onboarding'
import Tutorial   from './pages/Tutorial'

export default function App() {
  const { user, setUser } = useStore()
  const [checking,      setChecking]      = useState(true)
  const [onboarded,     setOnboarded]     = useState(() => !!localStorage.getItem('hf_onboarded'))
  const [tutorialDone,  setTutorialDone]  = useState(() => !!localStorage.getItem('hf_tutorial'))

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setChecking(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleOnboardingFinish = () => {
    localStorage.setItem('hf_onboarded', '1')
    setOnboarded(true)
  }

  const handleTutorialFinish = () => {
    localStorage.setItem('hf_tutorial', '1')
    setTutorialDone(true)
  }

  if (checking) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <Spinner />
    </div>
  )

  // Not logged in → show auth
  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/*"   element={<Navigate to="/auth" />} />
      </Routes>
    )
  }

  // First launch → Onboarding
  if (!onboarded) {
    return <Onboarding onFinish={handleOnboardingFinish} />
  }

  // After onboarding → Tutorial (shown once, overlaid on top of AppShell)
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <AppShell />
      {!tutorialDone && (
        <Tutorial onFinish={handleTutorialFinish} />
      )}
    </div>
  )
}

function Spinner() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="20" cy="20" r="16" fill="none" stroke="var(--surface2)" strokeWidth="3" />
      <circle cx="20" cy="20" r="16" fill="none" stroke="var(--accent)"   strokeWidth="3"
        strokeDasharray="60 44" strokeLinecap="round" />
    </svg>
  )
}
