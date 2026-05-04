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
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) {
        // Tutorial is per-user-id, stored in Supabase user metadata
        const meta = u.user_metadata || {}
        setOnboarded(!!meta.onboarded)
        setTutorialDone(!!meta.tutorial_done)
      }
      setChecking(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        const meta = u.user_metadata || {}
        setOnboarded(!!meta.onboarded)
        setTutorialDone(!!meta.tutorial_done)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleOnboardingFinish = async () => {
    await supabase.auth.updateUser({ data: { onboarded: true } })
    setOnboarded(true)
  }

  const handleTutorialFinish = async () => {
    await supabase.auth.updateUser({ data: { tutorial_done: true } })
    setTutorialDone(true)
  }

  if (checking) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <Spinner />
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
    <div style={{ height:'100%', position:'relative' }}>
      <AppShell />
      {!tutorialDone && <Tutorial onFinish={handleTutorialFinish} />}
    </div>
  )
}

function Spinner() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" style={{ animation:'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <circle cx="20" cy="20" r="16" fill="none" stroke="var(--surface2)" strokeWidth="3" />
      <circle cx="20" cy="20" r="16" fill="none" stroke="var(--accent)"   strokeWidth="3"
        strokeDasharray="60 44" strokeLinecap="round" />
    </svg>
  )
}
