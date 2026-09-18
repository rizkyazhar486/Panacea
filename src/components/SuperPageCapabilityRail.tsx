import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FITUR_DARI_HUB, type Fitur } from '../lib/katalogFitur'

type Domain = 'body' | 'clinical' | 'for-you'
type Bucket = 'all' | 'core' | 'data' | 'action'

const DOMAIN_COPY: Record<Domain, { label: string; accent: string }> = {
  body: { label: 'Your Body', accent: 'from-emerald-300 via-cyan-300 to-blue-400' },
  clinical: { label: 'Clinical', accent: 'from-cyan-300 via-blue-400 to-violet-400' },
  'for-you': { label: 'For You', accent: 'from-violet-300 via-fuchsia-400 to-rose-300' },
}

const CLINICAL_PATHS = new Set([
  '/body-explorer', '/radiology', '/frontier-health', '/knowledge-bridge', '/electrophysiology', '/genome-lab',
  '/med-study', '/osce-ukmppd', '/evidence', '/drug-info', '/clinical-calculators', '/clinical-scores', '/translator',
  '/chatbot', '/emr', '/emergency', '/second-opinion', '/consult', '/hospitals', '/pharmacy', '/orders', '/data-lab',
])

function textOf(feature: Fitur) {
  return `${feature.grup} ${feature.nama} ${feature.apa} ${feature.kw}`.toLowerCase()
}

function matchesDomain(feature: Fitur, domain: Domain) {
  const text = textOf(feature)
  if (domain === 'for-you') return true
  if (domain === 'clinical') {
    return CLINICAL_PATHS.has(feature.to) || /clinical|medical|disease|drug|pharma|anatom|physiol|radiolog|imaging|genom|gene|dna|evidence|research|trial|diagnos|score|calculator|lab|emr|care|hospital|consult|emergency/.test(text)
  }
  return /fitness|longevity|sleep|recovery|readiness|training|workout|movement|nutrition|hydration|body|composition|health data|wearable|device|heart rate|hrv|spo2|vital|zone 2|vo2|strength|running|cycling|swim|posture|metabolic/.test(text)
}

function bucketOf(feature: Fitur): Exclude<Bucket, 'all'> {
  const text = textOf(feature)
  if (/data|lab|score|metric|track|wearable|monitor|record|emr|genom|gene|imaging|radiolog/.test(text)) return 'data'
  if (/plan|program|workout|consult|care|assistant|chat|emergency|pharmacy|order|reminder|guide|simulator|tool|calculator/.test(text)) return 'action'
  return 'core'
}

function canonical(feature: Fitur, domain: Domain) {
  if (domain === 'body') {
    const body: Record<string, string> = {
      '/body': '/fitness-hub?view=body',
      '/shape-forming': '/fitness-hub?view=character',
      '/latihan': '/fitness-hub?view=training',
      '/training-plan': '/fitness-hub?view=training&t=rencana',
      '/workout': '/fitness-hub?view=workout&t=sesi',
      '/recovery': '/fitness-hub?view=recovery',
      '/tubuh': '/fitness-hub?view=numbers',
      '/nutrition': '/fitness-hub?view=nutrition',
      '/health-data': '/fitness-hub?view=health-data',
      '/data-lab': '/fitness-hub?view=labs',
      '/longevity': '/fitness-hub?view=longevity',
      '/vitapulse': '/fitness-hub?view=vitapulse',
    }
    return body[feature.to] ?? feature.to
  }
  return feature.to
}

export function SuperPageCapabilityRail({ domain, initialLimit = 24 }: { domain: Domain; initialLimit?: number }) {
  const [query, setQuery] = useState('')
  const [bucket, setBucket] = useState<Bucket>('all')
  const [expanded, setExpanded] = useState(false)
  const [findOpen, setFindOpen] = useState(false)
  const config = DOMAIN_COPY[domain]

  const items = useMemo(() => {
    const seen = new Set<string>()
    const needle = query.trim().toLowerCase()
    return FITUR_DARI_HUB.filter((feature) => matchesDomain(feature, domain)).filter((feature) => {
      const key = `${feature.to}|${feature.nama}`
      if (seen.has(key)) return false
      seen.add(key)
      if (bucket !== 'all' && bucketOf(feature) !== bucket) return false
      if (needle && !textOf(feature).includes(needle)) return false
      return true
    })
  }, [bucket, domain, query])

  const previewLimit = Math.min(initialLimit, 10)
  const visible = expanded ? items : items.slice(0, previewLimit)

  return (
    <section className="relative isolate overflow-hidden rounded-[30px] border border-white/[.08] bg-[#01040a]/92 p-4 text-white shadow-[0_24px_72px_rgba(0,0,0,.35)] backdrop-blur-2xl sm:p-5" aria-label={`${config.label} capabilities`}>
      <div className={`pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r ${config.accent} opacity-70`} aria-hidden />
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-400/[.07] blur-3xl" aria-hidden />

      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[9px] font-black uppercase tracking-[.2em] text-white/38">Tools</div>
          <h2 className="truncate text-base font-black tracking-[-.02em] sm:text-lg">{config.label}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFindOpen((value) => !value)}
            className="min-h-[38px] rounded-full border border-white/10 bg-white/[.035] px-3 text-[10px] font-black text-white/62 transition hover:border-cyan-200/25 hover:text-white"
            aria-expanded={findOpen}
          >
            {findOpen ? 'Close find' : 'Find'}
          </button>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="min-h-[38px] rounded-full border border-white/10 bg-white/[.04] px-3 text-[10px] font-black text-white/72 transition hover:border-cyan-200/30 hover:text-white"
            aria-expanded={expanded}
          >
            {expanded ? 'Compact' : `All ${items.length}`}
          </button>
        </div>
      </div>

      {findOpen && (
        <div className="relative mt-3 rounded-[18px] border border-white/[.07] bg-black/20 p-2.5">
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar" aria-label="Capability filters">
            {(['all', 'core', 'data', 'action'] as const).map((item) => (
              <button key={item} type="button" onClick={() => setBucket(item)} aria-pressed={bucket === item} className={`min-h-[36px] shrink-0 rounded-full border px-3 text-[9px] font-black uppercase tracking-[.1em] transition ${bucket === item ? 'border-cyan-200/45 bg-cyan-200 text-black' : 'border-white/[.08] bg-white/[.025] text-white/50 hover:text-white'}`}>
                {item}
              </button>
            ))}
          </div>

          <label className="mt-2 flex min-h-[42px] items-center gap-2 rounded-[14px] border border-white/[.08] bg-black/28 px-3 focus-within:border-cyan-200/30">
            <span className="text-cyan-100/50" aria-hidden>⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tools…" className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-white outline-none placeholder:text-white/28" />
            {query && <button type="button" onClick={() => setQuery('')} className="grid h-7 w-7 place-items-center rounded-full text-white/45 hover:bg-white/[.06] hover:text-white" aria-label="Clear search">×</button>}
          </label>
        </div>
      )}

      <motion.div layout className={`relative mt-3 grid gap-2 ${expanded ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-flow-col auto-cols-[156px] overflow-x-auto pb-1 no-scrollbar sm:auto-cols-[174px]'}`}>
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((feature, index) => (
            <motion.div key={`${feature.to}|${feature.nama}`} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: .97 }} transition={{ duration: .18, delay: Math.min(index, 8) * .015 }}>
              <Link to={canonical(feature, domain)} className="group relative flex min-h-[80px] flex-col justify-between overflow-hidden rounded-[16px] border border-white/[.07] bg-white/[.022] p-2.5 transition hover:-translate-y-0.5 hover:border-cyan-200/25 hover:bg-cyan-200/[.045] active:scale-[.985]">
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-[9px] font-black uppercase tracking-[.12em] text-white/34">{feature.grup}</span>
                  <span className="text-[10px] text-cyan-100/35 transition group-hover:text-cyan-100/80" aria-hidden>↗</span>
                </div>
                <strong className="line-clamp-1 text-[12px] font-black leading-tight text-white/88">{feature.nama}</strong>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {items.length === 0 && <div className="mt-4 rounded-[18px] border border-white/[.07] bg-white/[.025] p-4 text-center text-[10px] font-black text-white/35">No match</div>}
    </section>
  )
}

export default SuperPageCapabilityRail
