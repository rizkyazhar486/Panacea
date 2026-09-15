import { Link } from 'react-router-dom'
import { getVitals } from '../lib/healthVitals'

const PRIMARY = [
  {
    to: '/tubuh',
    eyebrow: 'Explore',
    title: 'Body Exposure',
    description: 'One complete anatomical atlas from whole body to deeper scales.',
  },
  {
    to: '/clinical',
    eyebrow: 'Decide',
    title: 'Clinical workspace',
    description: 'Clinical reasoning, scores and patient-facing decision support.',
  },
  {
    to: '/catatan',
    eyebrow: 'Remember',
    title: 'Records',
    description: 'Personal measurements, longitudinal notes and tracked health data.',
  },
  {
    to: '/rujukan',
    eyebrow: 'Verify',
    title: 'Reference',
    description: 'Evidence, medicines, education and source-backed medical material.',
  },
]

function value(value: number | undefined, suffix = '') {
  return typeof value === 'number' && Number.isFinite(value) ? `${value}${suffix}` : '—'
}

export function HomeUnified() {
  const vitals = getVitals()

  return (
    <main className="min-h-screen bg-[#030408] text-white">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <header className="border-b border-white/10 pb-6">
          <div className="text-[10px] font-black uppercase tracking-[.24em] text-cyan-300/80">Panaceamed</div>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-black tracking-[-.045em] text-white sm:text-5xl">One medical workspace.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-400 sm:text-base">
                Start with the patient, the body, the record or the evidence. Deep tools stay behind those four clear entry points instead of competing on the home screen.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/cari"
                className="rounded-full border border-white/12 bg-white/[.04] px-4 py-2 text-xs font-black text-white transition hover:bg-white/[.08]"
              >
                Search
              </Link>
              <Link
                to="/semua-fitur"
                className="rounded-full border border-white/12 bg-white/[.04] px-4 py-2 text-xs font-black text-white transition hover:bg-white/[.08]"
              >
                All tools
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-px overflow-hidden rounded-[26px] border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4" aria-label="Primary workspaces">
          {PRIMARY.map((item, index) => (
            <Link
              key={item.to}
              to={item.to}
              className={`group min-h-44 bg-[#06080d] p-5 transition hover:bg-[#090d14] ${index === 0 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
            >
              <div className="text-[9px] font-black uppercase tracking-[.19em] text-neutral-500 group-hover:text-cyan-300/80">{item.eyebrow}</div>
              <h2 className="mt-5 text-lg font-black tracking-[-.025em] text-white">{item.title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-neutral-400">{item.description}</p>
              <div className="mt-5 text-xs font-black text-white/70 transition group-hover:translate-x-1 group-hover:text-white">Open →</div>
            </Link>
          ))}
        </section>

        <section className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-white/10 py-3" aria-label="Latest body signals">
          <div className="mr-2 text-[9px] font-black uppercase tracking-[.18em] text-neutral-500">Latest signals</div>
          <div className="text-xs text-neutral-400">Pulse <strong className="ml-1 text-white">{value(vitals.restingHr, ' bpm')}</strong></div>
          <div className="text-xs text-neutral-400">HRV <strong className="ml-1 text-white">{value(vitals.hrvMs, ' ms')}</strong></div>
          <div className="text-xs text-neutral-400">SpO₂ <strong className="ml-1 text-white">{value(vitals.spo2Pct, '%')}</strong></div>
          <div className="text-xs text-neutral-400">Weight <strong className="ml-1 text-white">{value(vitals.weightKg, ' kg')}</strong></div>
          <Link to="/tubuh?t=klinis" className="ml-auto text-[10px] font-black text-cyan-300/80 hover:text-cyan-200">Inspect signals →</Link>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.18em] text-violet-300/70">Information architecture rule</div>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-neutral-500">
              Home is navigation, not a warehouse. Specialized simulators, trackers and calculators remain available, but they are reached through a clear domain or global search rather than duplicated as competing home widgets.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold">
            <Link to="/community" className="rounded-full border border-white/10 px-3 py-1.5 text-neutral-400 hover:text-white">Community</Link>
            <Link to="/connect" className="rounded-full border border-white/10 px-3 py-1.5 text-neutral-400 hover:text-white">Devices</Link>
            <Link to="/profile" className="rounded-full border border-white/10 px-3 py-1.5 text-neutral-400 hover:text-white">Profile</Link>
          </div>
        </section>
      </div>
    </main>
  )
}

export default HomeUnified
