import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useStore } from './store/useStore'
import AuthPage from './pages/AuthPage'
import AppShell from './pages/AppShell'

export default function App() {
  const { user, setUser } = useStore()
  const [checking, setChecking] = useState(true)

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

  if (checking) return (
    <div style={{
      height:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background:'var(--bg)', gap:16
    }}>
      <div style={{ fontSize:42 }}>🌿</div>
      <svg width="32" height="32" viewBox="0 0 32 32" style={{ animation:'spin 0.8s linear infinite' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <circle cx="16" cy="16" r="12" fill="none" stroke="#1a1a26" strokeWidth="3"/>
        <circle cx="16" cy="16" r="12" fill="none" stroke="#6c63ff" strokeWidth="3"
          strokeDasharray="44 32" strokeLinecap="round"/>
      </svg>
    </div>
  )

  if (!user) return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/*"   element={<Navigate to="/auth" />} />
    </Routes>
  )

  return <AppShell />
}
