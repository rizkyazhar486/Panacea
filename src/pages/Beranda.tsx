import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { DeferredBodyExposureWidget } from '../components/dashboard/DeferredHomeSections'
import { HomeSectionBoundary } from '../components/HomeSectionBoundary'
import '../styles/panacea-system.css'

const PRIMARY = [
  { to: '/tubuh', icon: '♥', label: 'Body signals', note: 'Vitals, sleep and movement' },
  { to: '/latihan', icon: '↗', label: 'Training', note: 'Start, review and progress' },
  { to: '/readiness', icon: '◌', label: 'Readiness', note: 'Recovery context for today' },
  { to: '/recovery', icon: '☾', label: 'Recovery', note: 'Sleep and recovery tools' },
]

const MORE = [
  { to: '/semua-fitur', label: 'All features' },
  { to: '/med-study', label: 'Learn' },
  { to: '/community', label: 'Community' },
  { to: '/planning', label: 'Plan' },
]

export default function Beranda() {
  const { account } = useStore()
  const firstName = account?.name?.trim().split(/\s+/)[0] || ''

  return (
    <main className="p-page grid gap-4 sm:gap-5" aria-label="Panacea Home overview">
      <section className="p-glass p-home-hero" aria-labelledby="panacea-home-title">
        <div className="p-kicker">Panacea · Today</div>
        <h1 id="panacea-home-title" className="p-home-title">
          {firstName ? `Hi, ${firstName}. ` : ''}One calm place for your health.
        </h1>
        <p className="p-home-copy">
          Start with what matters now. Deeper tools stay available without competing for attention on your first screen.
        </p>
        <div className="p-home-cta-row">
          <Link to="/chatbot" className="p-button-primary p-interactive">Ask Panacea <span aria-hidden>✦</span></Link>
          <Link to="/harian" className="p-button-secondary p-interactive">Log today <span aria-hidden>＋</span></Link>
          <Link to="/semua-fitur" className="p-button-secondary p-interactive">Explore <span aria-hidden>›</span></Link>
          <Link to="/emergency" className="p-button-secondary p-interactive">SOS</Link>
        </div>
      </section>

      <section aria-labelledby="home-primary-actions">
        <div className="p-section-heading">
          <div>
            <div className="p-kicker">Daily essentials</div>
            <h2 id="home-primary-actions">What do you need now?</h2>
          </div>
        </div>
        <div className="p-action-grid">
          {PRIMARY.map((item) => (
            <Link key={item.to} to={item.to} className="p-action-card p-interactive">
              <span className="p-action-icon" aria-hidden>{item.icon}</span>
              <span>
                <span className="block text-[13px] font-black">{item.label}</span>
                <span className="mt-1 block text-[11px] font-semibold leading-snug" style={{ color: 'var(--p-muted)' }}>{item.note}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <HomeSectionBoundary label="Body Exposure">
        <DeferredBodyExposureWidget />
      </HomeSectionBoundary>

      <details className="p-glass overflow-hidden p-4 sm:p-5">
        <summary className="p-interactive flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-[16px] px-1 font-black text-[13px]">
          <span>
            <span className="p-kicker block">Everything else</span>
            <span className="mt-1 block text-[15px]">Open when you need more</span>
          </span>
          <span aria-hidden>＋</span>
        </summary>
        <div className="p-more-grid">
          {MORE.map((item) => (
            <Link key={item.to} to={item.to} className="p-more-link p-interactive">
              <span>{item.label}</span><span aria-hidden>›</span>
            </Link>
          ))}
        </div>
      </details>
    </main>
  )
}
