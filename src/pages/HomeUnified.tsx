import { Link } from 'react-router-dom'
import { getVitals } from '../lib/healthVitals'

const SUPER_PAGES = [
  {
    to: '/clinical',
    label: 'Clinical',
    hint: 'Assess · investigate · decide · monitor',
  },
  {
    to: '/tubuh',
    label: 'Explore',
    hint: 'Body · disease · intervention · discovery',
  },
]

const QUICK = [
  { to: '/tubuh?t=klinis', label: 'Health', hint: 'Signals & trends' },
  { to: '/catatan', label: 'Records', hint: 'Timeline & notes' },
  { to: '/rujukan', label: 'Evidence', hint: 'Verify & learn' },
  { to: '/connect', label: 'Devices', hint: 'Wearables & sync' },
]

function value(value: number | undefined, suffix = '') {
  return typeof value === 'number' && Number.isFinite(value) ? `${value}${suffix}` : '—'
}

export function HomeUnified() {
  const vitals = getVitals()

  return (
    <main
      className="min-h-screen text-white"
      style={{ background: 'var(--color-malam)' }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-[.22em] text-white/45">Panaceamed · Home</div>
            <h1 className="mt-1 truncate text-2xl font-black tracking-[-.04em] sm:text-3xl">Your health, at a glance.</h1>
          </div>
          <Link
            to="/cari"
            aria-label="Search Panaceamed"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/12 bg-white/[.045] text-lg text-white/80 transition hover:bg-white/[.08] hover:text-white"
          >
            ⌕
          </Link>
        </header>

        <section className="mt-3" aria-label="Latest body signals">
          <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto pb-1">
            {[
              ['Pulse', value(vitals.restingHr, ' bpm')],
              ['HRV', value(vitals.hrvMs, ' ms')],
              ['SpO₂', value(vitals.spo2Pct, '%')],
              ['Weight', value(vitals.weightKg, ' kg')],
            ].map(([label, reading]) => (
              <Link
                key={label}
                to="/tubuh?t=klinis"
                className="min-w-[132px] snap-start rounded-2xl border border-white/10 bg-white/[.035] px-3.5 py-3 transition hover:bg-white/[.065]"
              >
                <div className="text-[9px] font-bold uppercase tracking-[.13em] text-white/40">{label}</div>
                <div className="mt-1 text-lg font-black tracking-[-.03em] text-white">{reading}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-4 grid gap-2 sm:grid-cols-2" aria-label="Primary workspaces">
          {SUPER_PAGES.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group rounded-[22px] border border-white/10 bg-white/[.035] p-4 transition hover:-translate-y-0.5 hover:bg-white/[.065]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black tracking-[-.03em] text-white">{item.label}</h2>
                  <p className="mt-1 text-[11px] leading-snug text-white/45">{item.hint}</p>
                </div>
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black transition group-hover:translate-x-0.5"
                  style={{ background: 'var(--color-limau)', color: 'var(--color-malam)' }}
                  aria-hidden="true"
                >
                  →
                </span>
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-5" aria-labelledby="quick-heading">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 id="quick-heading" className="text-[10px] font-black uppercase tracking-[.18em] text-white/45">Quick access</h2>
            <span className="text-[10px] text-white/30">1 tap</span>
          </div>
          <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto pb-1">
            {QUICK.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group min-w-[148px] snap-start rounded-2xl border border-white/10 bg-white/[.025] px-3.5 py-3 transition hover:bg-white/[.055]"
              >
                <div className="text-xs font-black text-white/85 group-hover:text-white">{item.label}</div>
                <div className="mt-0.5 text-[10px] text-white/35">{item.hint}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-[24px] border border-white/10 bg-white/[.025]" aria-label="Explore the body">
          <Link to="/tubuh" className="group block p-4 sm:p-5">
            <div className="flex items-end justify-between gap-4">
              <div className="max-w-xl">
                <div className="text-[9px] font-black uppercase tracking-[.18em] text-white/40">Continue exploring</div>
                <h2 className="mt-1 text-xl font-black tracking-[-.035em] text-white sm:text-2xl">One body. Every scale.</h2>
                <p className="mt-1 text-[11px] leading-relaxed text-white/40">Whole body → organ → tissue → molecular, inside one continuous workspace.</p>
              </div>
              <span className="shrink-0 text-lg text-white/45 transition group-hover:translate-x-1 group-hover:text-white">→</span>
            </div>
          </Link>
        </section>
      </div>
    </main>
  )
}

export default HomeUnified