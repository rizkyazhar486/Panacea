import { Link } from 'react-router-dom'
import { IconChat, IconPlus, IconStethoscope, IconGauge, IconPill, IconChartUp } from './icons'
import '../styles/home-intent-motion.css'

// Enam tujuan inti, satu ketukan dari beranda. Pemilik meminta Clinical,
// data harian, dosis obat dan kalkulator WAJIB ada di beranda; sebelumnya
// kalkulator dan dosis hanya bisa dicapai lewat pencarian. Enam adalah batas
// hukum kesederhanaan (DOCS/RUTHLESS-SIMPLICITY.md) dan mengisi kisi 2 kolom.
export const HOME_CORE_ACTIONS = [
  { to: '/chatbot', label: 'Ask Panacea', icon: IconChat },
  { to: '/harian', label: 'Log today', icon: IconPlus },
  { to: '/clinical-hub', label: 'Clinical', icon: IconStethoscope },
  { to: '/ikhtisar', label: 'Daily data', icon: IconChartUp },
  { to: '/drug-info', label: 'Drug dose', icon: IconPill },
  { to: '/clinical-calculators', label: 'Calculators', icon: IconGauge },
] as const
const heroActions = HOME_CORE_ACTIONS

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
