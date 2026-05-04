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
  const [showOnboard,  setShowOnboard]  = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) applyMeta(u)
      setChecking(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) applyMeta(u)
      // New sign-up: show onboarding
      if (event === 'SIGNED_IN') {
        const meta = session?.user?.user_metadata || {}
        if (!meta.onboarded) setShowOnboard(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const applyMeta = (u) => {
    const meta = u.user_metadata || {}
    // Only show onboarding on explicit new signup, not on existing users
    if (!meta.onboarded && !meta.tutorial_done) {
      // Check if they have existing data (existing user without meta)
      supabase.from('habits').select('id').eq('user_id', u.id).limit(1).then(({ data }) => {
        if (!data || data.length === 0) {
          // Truly new user
          setShowOnboard(true)
        } else {
          // Existing user – mark as onboarded silently
          supabase.auth.updateUser({ data: { onboarded: true, tutorial_done: true } })
          setShowOnboard(false)
          setShowTutorial(false)
        }
      })
    } else {
      setShowOnboard(!meta.onboarded)
      setShowTutorial(meta.onboarded && !meta.tutorial_done)
    }
  }

  const finishOnboarding = async () => {
    await supabase.auth.updateUser({ data: { onboarded: true } })
    setShowOnboard(false)
    setShowTutorial(true)
  }

  const finishTutorial = async () => {
    await supabase.auth.updateUser({ data: { tutorial_done: true } })
    setShowTutorial(false)
  }

  if (checking) return (
    <div style={{
      height:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background:'var(--bg)', gap:16
    }}>
      <div style={{ fontSize:40 }}>🌿</div>
      <svg width="36" height="36" viewBox="0 0 36 36"
        style={{ animation:'spin 0.8s linear infinite' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <circle cx="18" cy="18" r="14" fill="none" stroke="var(--surface2)" strokeWidth="3"/>
        <circle cx="18" cy="18" r="14" fill="none" stroke="var(--accent)" strokeWidth="3"
          strokeDasharray="52 36" strokeLinecap="round"/>
      </svg>
      <p style={{ color:'var(--text2)', fontSize:13 }}>Wird geladen...</p>
    </div>
  )

  if (!user) return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/*"   element={<Navigate to="/auth" />} />
    </Routes>
  )

  if (showOnboard) return <Onboarding onFinish={finishOnboarding} />

  return (
    <div style={{ height:'100%', position:'relative' }}>
      <AppShell />
      {showTutorial && <Tutorial onFinish={finishTutorial} />}
    </div>
  )
}
