import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useStore } from './store/useStore'
import AuthPage from './pages/AuthPage'
import AppShell from './pages/AppShell'

export default function App() {
  const { user, setUser } = useStore()
  // null = still checking, false = not logged in, object = logged in
  const [authState, setAuthState] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? false
      setUser(u || null)
      setAuthState(u)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? false
      setUser(u || null)
      setAuthState(u)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Still checking session - show nothing (transparent, not black)
  if (authState === null) return (
    <div style={{
      height: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    }}>
      <div style={{ fontSize: 48 }}>🌿</div>
      <p style={{ color: 'var(--text2)', fontSize: 14, fontWeight: 500 }}>HabitFlow</p>
    </div>
  )

  // Not logged in
  if (authState === false) return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/*" element={<Navigate to="/auth" replace />} />
    </Routes>
  )

  // Logged in
  return <AppShell />
}
