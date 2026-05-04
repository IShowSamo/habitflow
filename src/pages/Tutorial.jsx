import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import s from './Tutorial.module.css'

const STEPS = [
  {
    page: '/',
    title: 'Habits tracken',
    desc: 'Tippe auf einen Habit um ihn für heute als erledigt zu markieren. Der grüne Haken bestätigt deinen Fortschritt.',
    icon: '✅',
    spotX: '50%', spotY: '62%',
    tipY: '73%', arrow: 'down',
  },
  {
    page: '/',
    title: 'Tagesfortschritt',
    desc: 'Der Ring zeigt wie viele deiner Habits du heute bereits erledigt hast. Ziel: 100%!',
    icon: '⭕',
    spotX: '28%', spotY: '35%',
    tipY: '48%', arrow: 'up',
  },
  {
    page: '/',
    title: 'Dein Level & XP',
    desc: 'Mit jedem Streak-Tag steigst du im Level auf – von Beginner bis zur Legende.',
    icon: '🏆',
    spotX: '50%', spotY: '27%',
    tipY: '38%', arrow: 'up',
  },
  {
    page: '/stats',
    title: 'Statistiken',
    desc: 'Hier siehst du deinen Wochentrend, Erfolgsquoten pro Habit und deine besten Streaks.',
    icon: '📊',
    spotX: '50%', spotY: '45%',
    tipY: '55%', arrow: 'center',
  },
  {
    page: '/habits',
    title: 'Habit hinzufügen',
    desc: 'Tippe auf das + oben rechts um einen neuen Habit zu erstellen. Icon, Farbe und Erinnerung wählen.',
    icon: '➕',
    spotX: '88%', spotY: '7%',
    tipY: '18%', arrow: 'up',
  },
  {
    page: '/social',
    title: 'Freunde adden',
    desc: 'Im "Suchen" Tab kannst du nach Usernamen suchen und eine Freundschaftsanfrage (FA) schicken.',
    icon: '👥',
    spotX: '50%', spotY: '50%',
    tipY: '60%', arrow: 'center',
  },
]

export default function Tutorial({ onFinish }) {
  const [step, setStep] = useState(0)
  const [animIn, setAnimIn] = useState(true)
  const nav = useNavigate()
  const current = STEPS[step]
  const total = STEPS.length

  useEffect(() => {
    nav(current.page, { replace: true })
  }, [step])

  const go = (dir) => {
    setAnimIn(false)
    setTimeout(() => {
      const next = step + dir
      if (next >= total) { onFinish(); return }
      if (next < 0) { onFinish(); return }
      setStep(next)
      setAnimIn(true)
    }, 160)
  }

  const SPOT = 110

  return (
    <div className={s.overlay}>
      {/* SVG mask overlay */}
      <svg className={s.mask} onClick={() => go(1)}>
        <defs>
          <mask id={`tmask${step}`}>
            <rect width="100%" height="100%" fill="white" />
            <ellipse
              cx={current.spotX} cy={current.spotY}
              rx={SPOT / 2} ry={SPOT / 2.2}
              fill="black"
            />
          </mask>
        </defs>
        <rect width="100%" height="100%"
          fill="rgba(0,0,0,0.72)"
          mask={`url(#tmask${step})`}
        />
      </svg>

      {/* Pulsing ring */}
      <div className={s.pulse} style={{
        left: current.spotX, top: current.spotY,
        width: SPOT + 16, height: SPOT / 2.2 * 2 + 16,
      }} />

      {/* Tooltip */}
      <div
        className={`${s.tooltip} ${animIn ? s.tooltipIn : s.tooltipOut}`}
        style={{
          top: current.tipY,
          transform: `translate(-50%, ${current.arrow === 'up' ? '0' : '-100%'})`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {current.arrow === 'down' && <div className={s.arrowDown} />}
        {current.arrow === 'up'   && <div className={s.arrowUp} />}

        <div className={s.tooltipHeader}>
          <div className={s.tooltipIcon}>{current.icon}</div>
          <div>
            <div className={s.tooltipTitle}>{current.title}</div>
            <div className={s.tooltipStep}>Schritt {step + 1} von {total}</div>
          </div>
        </div>

        <p className={s.tooltipDesc}>{current.desc}</p>

        <div className={s.progressDots}>
          {STEPS.map((_, i) => (
            <div key={i} className={`${s.progressDot} ${
              i === step ? s.progressDotActive :
              i < step   ? s.progressDotDone : ''
            }`} />
          ))}
        </div>

        <div className={s.tooltipBtns}>
          {step > 0 && (
            <button className={s.backBtn} onClick={() => go(-1)}>← Zurück</button>
          )}
          <button className={s.nextBtn} onClick={() => go(1)}>
            {step === total - 1 ? '🎉 Fertig!' : 'Weiter →'}
          </button>
        </div>

        <button className={s.skipBtn} onClick={onFinish}>Tutorial überspringen</button>
      </div>

      <style>{`
        @keyframes tutPulse {
          0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.7; }
          50% { transform: translate(-50%,-50%) scale(1.08); opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
