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
