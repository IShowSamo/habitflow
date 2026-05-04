import { useState } from 'react'
import s from './Onboarding.module.css'

const SLIDES = [
  {
    icon: '✦',
    gradient: 'linear-gradient(135deg, #7c6dfa, #a89bfc)',
    title: 'Willkommen bei\nHabitflow',
    sub: 'Dein persönlicher Coach für bessere Gewohnheiten – jeden Tag.',
    cta: "Los geht's",
  },
  {
    icon: '🔥',
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    title: 'Streaks &\nMotivation',
    sub: 'Baue Streaks auf, steige im Level auf – von Beginner bis Legend.',
    cta: 'Weiter',
    feature: { label: 'Level-System', desc: 'Beginner → Consistent → Warrior → Champion → Legend' },
  },
  {
    icon: '📊',
    gradient: 'linear-gradient(135deg, #06b6d4, #34d399)',
    title: 'Deine Stats\nim Blick',
    sub: 'Detaillierte Charts zeigen dir deinen Fortschritt täglich, wöchentlich und monatlich.',
    cta: 'Weiter',
    feature: { label: 'Statistiken', desc: 'Wochentrend · Erfolgsquote · Perfekte Tage' },
  },
  {
    icon: '👥',
    gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    title: 'Community &\nFreunde',
    sub: 'Adde Freunde, schicke Freundschaftsanfragen und vergleiche euch im Leaderboard.',
    cta: 'Weiter',
    feature: { label: 'Social Features', desc: 'Freundschaftsanfragen · Leaderboard · Profile' },
  },
  {
    icon: '🎯',
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
    title: 'Bereit\nanzufangen?',
    sub: 'Starte jetzt mit deinen ersten Habits. Du kannst jederzeit neue hinzufügen.',
    cta: 'App starten',
    final: true,
  },
]

export default function Onboarding({ onFinish }) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(true)
  const slide = SLIDES[step]
  const total = SLIDES.length

  const go = (dir) => {
    setVisible(false)
    setTimeout(() => {
      const next = step + dir
      if (next >= total) { onFinish(); return }
      if (next < 0) return
      setStep(next)
      setVisible(true)
    }, 180)
  }

  return (
    <div className={s.page}>
      {!slide.final && (
        <button className={s.skip} onClick={onFinish}>Überspringen</button>
      )}

      <div className={`${s.content} ${visible ? s.visible : s.hidden}`}>
        <div className={s.iconBubble} style={{ background: slide.gradient }}>
          {slide.icon}
        </div>

        <h1 className={s.title}>{slide.title}</h1>
        <p className={s.sub}>{slide.sub}</p>

        {slide.feature && (
          <div className={s.featurePill}>
            <div className={s.featureLabel}>{slide.feature.label}</div>
            <div className={s.featureDesc}>{slide.feature.desc}</div>
          </div>
        )}
      </div>

      <div className={s.bottom}>
        <div className={s.dots}>
          {SLIDES.map((_, i) => (
            <div key={i} className={`${s.dot} ${i === step ? s.dotActive : i < step ? s.dotDone : ''}`} />
          ))}
        </div>

        <div className={s.btns}>
          {step > 0 && (
            <button className={s.backBtn} onClick={() => go(-1)}>Zurück</button>
          )}
          <button className={s.nextBtn} onClick={() => go(1)}>
            {slide.cta}
          </button>
        </div>
      </div>
    </div>
  )
}
