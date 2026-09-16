import { Link } from 'react-router-dom'
import { IconHeart, IconRun, IconSparkle, IconStethoscope } from './icons'
import '../styles/home-intent-motion.css'

const heroActions = [
  { to: '/tubuh', label: 'Your Body', icon: IconHeart, tone: 'body' },
  { to: '/clinical-hub', label: 'Clinical', icon: IconStethoscope, tone: 'clinical' },
  { to: '/latihan', label: 'Move', icon: IconRun, tone: 'move' },
  { to: '/?t=for-you', label: 'For You', icon: IconSparkle, tone: 'you' },
] as const

export function HomeVisualLanding() {
  return (
    <section className="panacea-intent-hero" aria-label="Panaceamed health overview">
      <div className="panacea-intent-hero__media" aria-hidden="true">
        <div className="panacea-intent-hero__nature" />
        <div className="panacea-intent-hero__human" />
        <div className="panacea-intent-hero__veil" />
        <div className="panacea-intent-hero__halo" />
      </div>

      <div className="panacea-intent-hero__top">
        <div className="panacea-intent-hero__eyebrow">
          <span className="panacea-intent-hero__pulse" aria-hidden="true" />
          PANACEAMED.ID
        </div>
        <div className="panacea-intent-hero__signal" aria-label="Living health system"><span /><span /><span /></div>
      </div>

      <div className="panacea-intent-hero__copy">
        <p>Human · clinical · contextual</p>
        <h1>Health, made visible.</h1>
      </div>

      <div className="panacea-intent-hero__actions" aria-label="Open a Panacea super page">
        {heroActions.map(({ to, label, icon: Icon, tone }) => (
          <Link key={label} to={to} className="panacea-intent-action" data-tone={tone} aria-label={`Open ${label}`}>
            <span className="panacea-intent-action__icon" aria-hidden="true"><Icon size={21} /></span>
            <span className="panacea-intent-action__label">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default HomeVisualLanding
