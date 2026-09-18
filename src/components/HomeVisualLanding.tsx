import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { IconChat, IconPlus } from './icons'
import '../styles/home-intent-motion.css'

const heroActions = [
  { to: '/chatbot', label: 'Ask Panacea', icon: IconChat },
  { to: '/harian', label: 'Log today', icon: IconPlus },
] as const

export function HomeVisualLanding() {
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const onPointerMove = (event: PointerEvent) => {
      const box = hero.getBoundingClientRect()
      const x = Math.max(0, Math.min(1, (event.clientX - box.left) / box.width))
      const y = Math.max(0, Math.min(1, (event.clientY - box.top) / box.height))
      hero.style.setProperty('--intent-x', `${(x - 0.5) * 2}`)
      hero.style.setProperty('--intent-y', `${(y - 0.5) * 2}`)
      hero.style.setProperty('--intent-px', `${x * 100}%`)
      hero.style.setProperty('--intent-py', `${y * 100}%`)
    }
    const reset = () => {
      hero.style.setProperty('--intent-x', '0')
      hero.style.setProperty('--intent-y', '0')
      hero.style.setProperty('--intent-px', '50%')
      hero.style.setProperty('--intent-py', '50%')
    }
    hero.addEventListener('pointermove', onPointerMove)
    hero.addEventListener('pointerleave', reset)
    return () => {
      hero.removeEventListener('pointermove', onPointerMove)
      hero.removeEventListener('pointerleave', reset)
    }
  }, [])

  return (
    <section ref={heroRef} className="panacea-intent-hero" aria-label="Panaceamed health overview">
      <div className="panacea-intent-hero__media" aria-hidden="true">
        <div className="panacea-intent-hero__nature" />
        <div className="panacea-intent-hero__human" />
        <div className="panacea-intent-hero__veil" />
        <div className="panacea-intent-hero__halo" />
        <div className="panacea-intent-hero__scan" />
      </div>

      <div className="panacea-intent-hero__copy">
        <h1>Health, made visible.</h1>
      </div>

      <div className="panacea-intent-hero__actions" aria-label="Primary health actions">
        {heroActions.map(({ to, label, icon: Icon }) => (
          <Link key={label} to={to} className="panacea-intent-action" aria-label={label}>
            <span className="panacea-intent-action__icon" aria-hidden="true"><Icon size={20} /></span>
            <span className="panacea-intent-action__label">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default HomeVisualLanding
