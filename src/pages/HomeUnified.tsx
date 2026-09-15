import { Link } from 'react-router-dom'
import { getVitals } from '../lib/healthVitals'
import { FITUR_DARI_HUB } from '../lib/katalogFitur'
import { productSpaceForRoute, routePathOnly } from '../lib/productSpaces'

type Feature = {
  label: string
  to: string
  glyph: string
}

type Tone = {
  edge: string
  glow: string
  fill: string
  strong: string
}

type SuperPageId = 'body' | 'clinical' | 'you'

const TONES: Record<SuperPageId, Tone> = {
  body: {
    edge: 'rgba(45, 212, 191, .34)',
    glow: 'rgba(34, 211, 238, .18)',
    fill: 'rgba(8, 47, 73, .34)',
    strong: '#67e8f9',
  },
  clinical: {
    edge: 'rgba(129, 140, 248, .36)',
    glow: 'rgba(168, 85, 247, .18)',
    fill: 'rgba(49, 46, 129, .30)',
    strong: '#c4b5fd',
  },
  you: {
    edge: 'rgba(244, 114, 182, .34)',
    glow: 'rgba(251, 191, 36, .14)',
    fill: 'rgba(76, 29, 149, .24)',
    strong: '#f9a8d4',
  },
}

const YOUR_BODY: Feature[] = [
  { label: 'Today', to: '/ikhtisar', glyph: '◌' },
  { label: 'Move', to: '/latihan?t=gerak', glyph: '↗' },
  { label: 'Training', to: '/latihan', glyph: '△' },
  { label: 'Recovery', to: '/tubuh?t=pulih', glyph: '≈' },
  { label: 'Sleep', to: '/tubuh?t=tidur', glyph: '☾' },
  { label: 'Body', to: '/body', glyph: '◎' },
  { label: 'Fitness', to: '/fitness-hub', glyph: '◇' },
  { label: 'Mind', to: '/jiwa', glyph: '✦' },
  { label: 'Longevity', to: '/longevity', glyph: '∞' },
  { label: 'Nutrition', to: '/gizi', glyph: '◐' },
  { label: 'Health Data', to: '/health-data', glyph: '⌁' },
  { label: 'VitaPulse', to: '/vitapulse', glyph: '♥' },
  { label: 'Readiness', to: '/readiness', glyph: '◈' },
  { label: 'Body Battery', to: '/tubuh?t=energi', glyph: 'ϟ' },
  { label: 'Heart', to: '/tubuh?t=jantung', glyph: '♡' },
  { label: 'Breathwork', to: '/tubuh?t=napas', glyph: '≋' },
  { label: 'Chronotype', to: '/tubuh?t=kronotipe', glyph: '◒' },
  { label: 'Sleep Apnea', to: '/tubuh?t=apnea', glyph: '⋯' },
  { label: 'Hydration', to: '/gizi?t=cairan', glyph: '◉' },
  { label: 'Caffeine', to: '/gizi?t=kafein', glyph: '◇' },
  { label: 'Supplements', to: '/gizi?t=suplemen', glyph: '+' },
  { label: 'Sun Exposure', to: '/sun-exposure', glyph: '☼' },
  { label: 'Posture', to: '/tubuh?t=postur', glyph: '│' },
  { label: 'Workout', to: '/latihan?t=sesi', glyph: '▶' },
  { label: 'Endurance', to: '/latihan?t=endurance', glyph: '↻' },
  { label: 'Sports Lab', to: '/latihan?t=sportlab', glyph: '⌬' },
  { label: 'Body Toolkit', to: '/body-toolkit', glyph: '✣' },
  { label: 'Devices', to: '/connect', glyph: '⌁' },
]

const CLINICAL: Feature[] = [
  { label: 'Clinical', to: '/clinical', glyph: '✚' },
  { label: 'Body Explorer', to: '/body-explorer', glyph: '◎' },
  { label: 'Discovery', to: '/frontier-health', glyph: '✦' },
  { label: 'Genome', to: '/genome-lab', glyph: '⌘' },
  { label: 'Drugs', to: '/rujukan?t=obat', glyph: '◫' },
  { label: 'Invention', to: '/bio-simulators', glyph: '⌬' },
  { label: 'Innovation', to: '/knowledge-bridge', glyph: '↯' },
  { label: 'Medical Library', to: '/rujukan', glyph: '▤' },
  { label: 'Ask Health', to: '/chatbot', glyph: '✺' },
  { label: 'Calculators', to: '/calculator-hub', glyph: '∑' },
  { label: 'Lab Decoder', to: '/rujukan?t=lab', glyph: '⌗' },
  { label: 'Learn', to: '/learn', glyph: '△' },
  { label: 'Look Up', to: '/cari', glyph: '⌕' },
  { label: 'Clinical Scores', to: '/clinical-scores', glyph: '#' },
  { label: 'Clinical Hub', to: '/clinical-hub', glyph: '⊕' },
  { label: 'Radiology', to: '/radiology', glyph: '◍' },
  { label: 'Electrophysiology', to: '/electrophysiology', glyph: 'ϟ' },
  { label: 'Predictive Models', to: '/predictive-models-toolkit', glyph: '⌁' },
  { label: 'Data Lab', to: '/data-lab', glyph: '▦' },
  { label: 'Advanced Data', to: '/data-lab-advanced', glyph: '◈' },
  { label: 'Trials', to: '/rujukan?t=uji', glyph: '◌' },
  { label: 'Evidence', to: '/rujukan?t=bukti', glyph: '✓' },
  { label: 'Second Opinion', to: '/second-opinion', glyph: 'Ⅱ' },
  { label: 'Assessment', to: '/assessment', glyph: '◇' },
  { label: 'Emergency', to: '/emergency', glyph: '!' },
  { label: 'First Aid', to: '/rujukan?t=pertolongan', glyph: '+' },
  { label: 'Psych Exam', to: '/psychiatric-status-exam', glyph: '◐' },
  { label: 'OSCE · UKMPPD', to: '/osce-ukmppd', glyph: '✎' },
]

const FOR_YOU: Feature[] = [
  { label: 'Faith', to: '/scripture', glyph: '✦' },
  { label: 'Hadith', to: '/hadith', glyph: '◌' },
  { label: 'Prayer', to: '/prayer-times', glyph: '☾' },
  { label: 'Finance', to: '/keuangan', glyph: '↗' },
  { label: 'Score', to: '/sports-scores', glyph: '#' },
  { label: 'Social', to: '/feed', glyph: '●' },
  { label: 'Community', to: '/community', glyph: '◎' },
  { label: 'AI Chatbot', to: '/chatbot', glyph: '✺' },
  { label: 'AI-EMR', to: '/emr', glyph: '▤' },
  { label: 'Care', to: '/care-episode', glyph: '♥' },
  { label: 'Account', to: '/profile', glyph: '◉' },
  { label: 'Manage Features', to: '/atur-fitur', glyph: '⌘' },
  { label: 'Settings', to: '/settings', glyph: '⚙' },
  { label: 'Messages', to: '/messages', glyph: '✉' },
  { label: 'Theme', to: '/settings', glyph: '◐' },
  { label: 'Help', to: '/tutorial', glyph: '?' },
  { label: 'Notifications', to: '/notifikasi', glyph: '◔' },
  { label: 'My Story', to: '/my-story', glyph: '✎' },
  { label: 'Family', to: '/family-health', glyph: '◇' },
  { label: 'Marketplace', to: '/marketplace', glyph: '▦' },
  { label: 'My Materials', to: '/my-materials', glyph: '▤' },
  { label: 'Planning', to: '/planning', glyph: '✓' },
  { label: 'Consult', to: '/consult', glyph: '✚' },
  { label: 'Hospitals', to: '/hospitals', glyph: '⌂' },
  { label: 'Pharmacy', to: '/pharmacy', glyph: '◫' },
  { label: 'Orders', to: '/orders', glyph: '↻' },
  { label: 'Clubs', to: '/clubs', glyph: '○' },
  { label: 'All Features', to: '/semua-fitur', glyph: '⋯' },
]

const FORCE_YOU = new Set([
  '/chatbot', '/emr', '/care-episode', '/profile', '/settings', '/atur-fitur',
  '/messages', '/feed', '/community', '/social', '/scripture', '/hadith',
  '/prayer-times', '/keuangan', '/tutorial', '/notifikasi', '/notifications',
  '/marketplace', '/my-materials', '/planning', '/consult', '/hospitals',
  '/pharmacy', '/orders', '/clubs', '/family-health',
])

const FORCE_CLINICAL = new Set([
  '/clinical', '/clinical-hub', '/body-explorer', '/frontier-health', '/genome-lab',
  '/drug-info', '/rujukan', '/calculator-hub', '/clinical-calculators', '/clinical-scores',
  '/lab-decoder', '/learn', '/med-study', '/osce-ukmppd', '/radiology',
  '/electrophysiology', '/knowledge-bridge', '/bio-simulators', '/data-lab',
  '/data-lab-advanced', '/predictive-models-toolkit', '/second-opinion',
  '/psychiatric-status-exam', '/emergency',
])

function superPageFor(to: string, group = ''): SuperPageId {
  const path = routePathOnly(to)
  if (FORCE_YOU.has(path)) return 'you'
  if (FORCE_CLINICAL.has(path)) return 'clinical'

  const space = productSpaceForRoute(to, group)
  if (space === 'today' || space === 'body' || space === 'move') return 'body'
  if (space === 'learn' || space === 'discover') return 'clinical'
  return 'you'
}

function glyphFor(to: string, group = '') {
  const page = superPageFor(to, group)
  if (page === 'body') return '◎'
  if (page === 'clinical') return '✚'
  return '✦'
}

function compileFeatures(seed: Feature[], page: SuperPageId): Feature[] {
  const map = new Map<string, Feature>()
  for (const item of seed) map.set(item.to, item)
  for (const item of FITUR_DARI_HUB) {
    if (superPageFor(item.to, item.grup) !== page) continue
    if (!map.has(item.to)) {
      map.set(item.to, { label: item.nama, to: item.to, glyph: glyphFor(item.to, item.grup) })
    }
  }
  return [...map.values()]
}

const BODY_FEATURES = compileFeatures(YOUR_BODY, 'body')
const CLINICAL_FEATURES = compileFeatures(CLINICAL, 'clinical')
const YOU_FEATURES = compileFeatures(FOR_YOU, 'you')

function reading(value: number | undefined, suffix = '') {
  return typeof value === 'number' && Number.isFinite(value) ? `${value}${suffix}` : '—'
}

function CapabilityRail({ items, tone }: { items: Feature[]; tone: Tone }) {
  return (
    <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-1" role="list">
      {items.map((item) => (
        <Link
          key={`${item.to}-${item.label}`}
          to={item.to}
          role="listitem"
          aria-label={`Open ${item.label}`}
          className="group min-w-[136px] snap-start overflow-hidden rounded-[22px] border px-3.5 py-3.5 transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          style={{
            borderColor: tone.edge,
            background: `linear-gradient(145deg, ${tone.fill}, rgba(3,7,18,.72))`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,.08), 0 14px 44px ${tone.glow}`,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-base font-black" style={{ color: tone.strong }} aria-hidden="true">{item.glyph}</span>
            <span className="text-[9px] font-black uppercase tracking-[.14em] text-white/35">1 tap</span>
          </div>
          <div className="mt-5 truncate text-[12px] font-black tracking-[-.015em] text-white/90">{item.label}</div>
          <div className="mt-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-[.12em] text-white/35">
            <span>Open</span>
            <span className="transition group-hover:translate-x-0.5">→</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

function SectionTitle({ label, to, tone, count }: { label: string; to: string; tone: Tone; count: number }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <Link to={to} className="truncate text-[18px] font-black tracking-[-.035em] text-white sm:text-xl">
        {label}
      </Link>
      <Link
        to={to}
        className="shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[.14em] text-white/70 transition hover:text-white"
        style={{ borderColor: tone.edge, background: tone.fill }}
      >
        {count} widgets →
      </Link>
    </div>
  )
}

export function HomeUnified() {
  const vitals = getVitals()
  const bodyTone = TONES.body
  const clinicalTone = TONES.clinical
  const youTone = TONES.you

  const signals = [
    { label: 'Pulse', value: reading(vitals.restingHr, ' bpm'), to: '/tubuh?t=jantung' },
    { label: 'HRV', value: reading(vitals.hrvMs, ' ms'), to: '/tubuh?t=pulih' },
    { label: 'SpO₂', value: reading(vitals.spo2Pct, '%'), to: '/tubuh?t=klinis' },
    { label: 'Weight', value: reading(vitals.weightKg, ' kg'), to: '/body' },
  ]

  return (
    <main
      className="min-h-screen overflow-x-hidden text-white"
      style={{
        background:
          'radial-gradient(circle at 14% -8%, rgba(34,211,238,.15), transparent 28%), radial-gradient(circle at 88% 8%, rgba(168,85,247,.14), transparent 30%), radial-gradient(circle at 52% 72%, rgba(244,114,182,.08), transparent 32%), var(--color-malam)',
      }}
    >
      <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 pb-5">
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-[.24em] text-white/40">Panaceamed OS</div>
            <h1 className="mt-1 truncate text-2xl font-black tracking-[-.045em] sm:text-3xl">Everything important. One home.</h1>
          </div>
          <Link
            to="/cari"
            aria-label="Search every Panaceamed feature"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-cyan-300/20 bg-cyan-300/[.06] text-lg text-cyan-100 shadow-[0_12px_36px_rgba(34,211,238,.12)] transition hover:bg-cyan-300/[.11]"
          >
            ⌕
          </Link>
        </header>

        <nav className="no-scrollbar mb-7 flex snap-x gap-3 overflow-x-auto" aria-label="Three Panaceamed super pages">
          {[
            ['Your Body', '/tubuh', bodyTone],
            ['Clinical', '/clinical', clinicalTone],
            ['For You', '/', youTone],
          ].map(([label, to, tone]) => {
            const currentTone = tone as Tone
            return (
              <Link
                key={label as string}
                to={to as string}
                className="min-w-[132px] snap-start rounded-full border px-4 py-2.5 text-center text-[11px] font-black tracking-[-.01em] text-white/85 transition hover:-translate-y-0.5 hover:text-white"
                style={{ borderColor: currentTone.edge, background: currentTone.fill }}
              >
                {label as string}
              </Link>
            )
          })}
        </nav>

        <section className="mb-9" aria-label="Your Body super page widgets">
          <SectionTitle label="Your Body" to="/tubuh" tone={bodyTone} count={BODY_FEATURES.length} />
          <div
            className="mb-4 overflow-hidden rounded-[28px] border p-4 sm:p-5"
            style={{
              borderColor: bodyTone.edge,
              background: `linear-gradient(130deg, ${bodyTone.fill}, rgba(2,6,23,.84) 58%)`,
              boxShadow: `0 18px 60px ${bodyTone.glow}, inset 0 1px 0 rgba(255,255,255,.08)`,
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <Link to="/tubuh?t=klinis" className="truncate text-[11px] font-black uppercase tracking-[.18em] text-cyan-100/70">Live body signals</Link>
              <Link to="/connect" className="shrink-0 text-[10px] font-bold text-white/40 hover:text-white">Sync →</Link>
            </div>
            <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
              {signals.map((signal) => (
                <Link
                  key={signal.label}
                  to={signal.to}
                  className="min-w-[132px] rounded-[20px] border border-cyan-200/15 bg-cyan-100/[.045] px-3.5 py-3 transition hover:bg-cyan-100/[.08]"
                >
                  <div className="text-[9px] font-black uppercase tracking-[.15em] text-white/35">{signal.label}</div>
                  <div className="mt-2 truncate text-lg font-black tracking-[-.035em] text-white">{signal.value}</div>
                </Link>
              ))}
            </div>
          </div>
          <CapabilityRail items={BODY_FEATURES} tone={bodyTone} />
        </section>

        <section className="mb-9" aria-label="Clinical super page widgets">
          <SectionTitle label="Clinical" to="/clinical" tone={clinicalTone} count={CLINICAL_FEATURES.length} />
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            {[
              ['Ask Health', '/chatbot', 'Ask a clinical question', '✺'],
              ['Calculate', '/calculator-hub', 'Scores · doses · labs', '∑'],
              ['Look Up', '/cari', 'Evidence · drugs · disease', '⌕'],
            ].map(([label, to, action, glyph]) => (
              <Link
                key={label}
                to={to}
                className="group rounded-[24px] border p-4 transition hover:-translate-y-0.5"
                style={{
                  borderColor: clinicalTone.edge,
                  background: `linear-gradient(145deg, ${clinicalTone.fill}, rgba(2,6,23,.82))`,
                  boxShadow: `0 16px 50px ${clinicalTone.glow}, inset 0 1px 0 rgba(255,255,255,.07)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black" style={{ color: clinicalTone.strong }}>{glyph}</span>
                  <span className="text-[9px] font-black uppercase tracking-[.14em] text-white/35">Run →</span>
                </div>
                <div className="mt-7 truncate text-base font-black tracking-[-.025em] text-white">{label}</div>
                <div className="mt-1 truncate text-[10px] font-semibold text-white/35 group-hover:text-white/55">{action}</div>
              </Link>
            ))}
          </div>
          <CapabilityRail items={CLINICAL_FEATURES} tone={clinicalTone} />
        </section>

        <section aria-label="For You super page widgets">
          <SectionTitle label="For You" to="/" tone={youTone} count={YOU_FEATURES.length} />
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Prayer', '/prayer-times', '☾'],
              ['Messages', '/messages', '✉'],
              ['AI-EMR', '/emr', '▤'],
              ['Care', '/care-episode', '♥'],
            ].map(([label, to, glyph]) => (
              <Link
                key={label}
                to={to}
                className="group rounded-[24px] border p-4 transition hover:-translate-y-0.5"
                style={{
                  borderColor: youTone.edge,
                  background: `linear-gradient(145deg, ${youTone.fill}, rgba(2,6,23,.82))`,
                  boxShadow: `0 16px 48px ${youTone.glow}, inset 0 1px 0 rgba(255,255,255,.07)`,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xl font-black" style={{ color: youTone.strong }}>{glyph}</span>
                  <span className="text-[9px] font-black uppercase tracking-[.14em] text-white/30">Open</span>
                </div>
                <div className="mt-7 truncate text-[12px] font-black text-white/90 group-hover:text-white">{label}</div>
              </Link>
            ))}
          </div>
          <CapabilityRail items={YOU_FEATURES} tone={youTone} />
        </section>
      </div>
    </main>
  )
}

export default HomeUnified
