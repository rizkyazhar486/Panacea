import { Link } from 'react-router-dom'
import { IconChat, IconPlus } from './icons'
import '../styles/home-intent-motion.css'

const heroActions = [
  { to: '/chatbot', label: 'Ask Panacea', icon: IconChat },
  { to: '/harian', label: 'Log today', icon: IconPlus },
] as const

export function HomeVisualLanding() {
  return (
    <section className="panacea-intent-hero" aria-label="Panaceamed actions">
      <div className="panacea-intent-hero__copy">
        <span className="panacea-intent-hero__eyebrow">Do next</span>
        <h1>One tap, then act.</h1>
      </div>

      <div className="panacea-intent-hero__actions" aria-label="Primary health actions">
        {heroActions.map(({ to, label, icon: Icon }, index) => (
          <Link
            key={label}
            to={to}
            className="panacea-intent-action"
            data-size={index === 0 ? 'lead' : 'unit'}
            aria-label={label}
          >
            <span className="panacea-intent-action__icon" aria-hidden="true"><Icon size={20} /></span>
            <span className="panacea-intent-action__label">{label}</span>
            <span className="panacea-intent-action__arrow" aria-hidden>↗</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default HomeVisualLanding
