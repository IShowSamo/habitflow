import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useStore } from './store/useStore'
import AuthPage  from './pages/AuthPage'
import AppShell  from './pages/AppShell'
import Tutorial  from './pages/Tutorial'

export default function App() {
  const { setUser } = useStore()
  const [ready,       setReady]       = useState(false)
  const [authed,      setAuthed]      = useState(false)
  const [showTutorial,setShowTutorial] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      setAuthed(!!u)
      if (u) checkTutorial(u)
      setReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null
      setUser(u)
      setAuthed(!!u)
      if (u) checkTutorial(u)
      if (!u) setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkTutorial = async (u) => {
    // Check if user has seen tutorial (stored in user metadata)
    const meta = u.user_metadata || {}
    if (meta.tutorial_done) { setReady(true); return }

    // Check if truly new user (no habits yet)
    const { data } = await supabase
      .from('habits')
      .select('id')
      .eq('user_id', u.id)
      .limit(1)

    if (!data || data.length === 0) {
      // New user - show tutorial
      setShowTutorial(true)
    }
    setReady(true)
  }

  const finishTutorial = async () => {
    await supabase.auth.updateUser({ data: { tutorial_done: true } })
    setShowTutorial(false)
  }

  if (!ready) return (
    <div style={{
      height: '100vh', background: '#0a0a0f',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 14,
    }}>
      <div style={{ fontSize: 52 }}>🌿</div>
      <p style={{ color: '#9090b0', fontSize: 14, fontWeight: 500 }}>HabitFlow</p>
    </div>
  )

  if (!authed) return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/*"   element={<Navigate to="/auth" replace />} />
    </Routes>
  )

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <AppShell />
      {showTutorial && <Tutorial onFinish={finishTutorial} />}
    </div>
  )
}
