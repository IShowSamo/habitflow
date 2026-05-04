import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useStore } from './store/useStore'
import AuthPage from './pages/AuthPage'
import AppShell from './pages/AppShell'

export default function App() {
  const { setUser } = useStore()
  const [ready, setReady]   = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      setAuthed(!!u)
      setReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null
      setUser(u)
      setAuthed(!!u)
      setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!ready) return (
    <div style={{
      height: '100vh',
      background: '#0a0a0f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    }}>
      <div style={{ fontSize: 52 }}>🌿</div>
      <p style={{ color: '#9090b0', fontSize: 14 }}>HabitFlow</p>
    </div>
  )

  if (!authed) return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/*"   element={<Navigate to="/auth" replace />} />
    </Routes>
  )

  return <AppShell />
}
