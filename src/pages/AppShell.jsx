import { useEffect } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { useStore } from '../store/useStore'
import TodayPage    from './TodayPage'
import StatsPage    from './StatsPage'
import CalendarPage from './CalendarPage'
import HabitsPage   from './HabitsPage'
import SocialPage   from './SocialPage'
import ProfilePage  from './ProfilePage'
import SettingsPage from './SettingsPage'
import s from './AppShell.module.css'

const NAV = [
  { to: '/',       label: 'Today',     icon: '☀' },
  { to: '/stats',  label: 'Stats',     icon: '▦' },
  { to: '/social', label: 'Community', icon: '◎' },
  { to: '/habits', label: 'Habits',    icon: '✦' },
]

export default function AppShell() {
  const { fetchTodayAndWeek } = useStore()

  // Fetch in background — don't block render
  useEffect(() => { fetchTodayAndWeek() }, [])

  return (
    <div className={s.shell}>
      <main className={s.main}>
        <Routes>
          <Route index                    element={<TodayPage />} />
          <Route path="stats"             element={<StatsPage />} />
          <Route path="calendar"          element={<CalendarPage />} />
          <Route path="habits"            element={<HabitsPage />} />
          <Route path="social"            element={<SocialPage />} />
          <Route path="profile/:username" element={<ProfilePage />} />
          <Route path="settings"          element={<SettingsPage />} />
        </Routes>
      </main>

      <nav className={s.nav}>
        {NAV.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to==='/'} className={({ isActive }) => `${s.navItem} ${isActive ? s.active : ''}`}>
            <span className={s.navIcon}>{icon}</span>
            <span className={s.navLabel}>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
