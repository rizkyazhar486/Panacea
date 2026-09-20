import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FITUR_DARI_HUB, type Fitur } from '../lib/katalogFitur'

type Domain = 'body' | 'clinical' | 'for-you'
type Bucket = 'all' | 'core' | 'data' | 'action'

const DOMAIN_COPY: Record<Domain, { label: string }> = {
  body: { label: 'Your Body' },
  clinical: { label: 'Clinical' },
  'for-you': { label: 'For You' },
}

const CLINICAL_PATHS = new Set([
  '/body-explorer', '/radiology', '/frontier-health', '/knowledge-bridge', '/electrophysiology', '/genome-lab',
  '/med-study', '/osce-ukmppd', '/evidence', '/drug-info', '/clinical-calculators', '/clinical-scores', '/translator',
  '/chatbot', '/emr', '/emergency', '/second-opinion', '/consult', '/hospitals', '/pharmacy', '/orders', '/data-lab',
])

const FOR_YOU_PATHS = new Set([
  '/feed', '/community', '/clubs', '/keuangan', '/markets', '/sports-scores', '/messages', '/profile',
  '/scripture', '/hadith', '/prayer-times', '/prophet-stories', '/education', '/life-compass', '/ikigai',
  '/harada', '/gratitude', '/resilience-stories', '/connect', '/my-story', '/planning', '/my-materials',
])

function textOf(feature: Fitur) {
  return `${feature.grup} ${feature.nama} ${feature.apa} ${feature.kw}`.toLowerCase()
}

function matchesDomain(feature: Fitur, domain: Domain) {
  const text = textOf(feature)
  if (domain === 'for-you') {
    return FOR_YOU_PATHS.has(feature.to)
      || /social|community|friend|partner|relationship|family|story|journal|gratitude|resilience|purpose|ikigai|goal|planning|career|finance|money|budget|wallet|market|invest|club|message|profile|account|faith|religion|prayer|hadith|scripture|prophet|mental|habit|attention|motivation/.test(text)
  }
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
    <section
      className="overflow-hidden rounded-[16px] border border-white/[.08] bg-[#05070a] p-3 text-white sm:p-4"
      aria-label={`${config.label} capabilities`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[10px] font-bold uppercase tracking-[.12em] text-white/38">Tools</div>
          <h2 className="truncate text-base font-black tracking-[-.02em] sm:text-lg">{config.label}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setFindOpen((value) => !value)}
            className="min-h-11 rounded-[10px] border border-white/10 px-3 text-[11px] font-bold text-white/64 transition-colors hover:border-white/20 hover:text-white"
            aria-expanded={findOpen}
          >
            {findOpen ? 'Close find' : 'Find'}
          </button>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="min-h-11 rounded-[10px] border border-white/10 px-3 text-[11px] font-bold text-white/72 transition-colors hover:border-white/20 hover:text-white"
            aria-expanded={expanded}
          >
            {expanded ? 'Compact' : `All ${items.length}`}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {findOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: .14 }}
            className="mt-3 border-t border-white/[.08] pt-3"
          >
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar" aria-label="Capability filters">
              {(['all', 'core', 'data', 'action'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setBucket(item)}
                  aria-pressed={bucket === item}
                  className={`min-h-11 shrink-0 rounded-[9px] border px-3 text-[10px] font-bold uppercase tracking-[.08em] transition-colors ${
                    bucket === item
                      ? 'border-brand/55 bg-brand/12 text-brand'
                      : 'border-white/[.08] text-white/48 hover:border-white/18 hover:text-white'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <label className="flex min-h-11 items-center gap-2 border-b border-white/[.12] px-0.5 focus-within:border-brand/55">
              <span className="text-white/36" aria-hidden>⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tools"
                className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-white outline-none placeholder:text-white/28"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="grid min-h-11 min-w-11 place-items-center text-white/45 transition-colors hover:text-white"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        layout
        transition={{ duration: .18 }}
        className={`mt-3 grid gap-x-4 gap-y-0 ${
          expanded
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'grid-flow-col auto-cols-[168px] overflow-x-auto pb-1 no-scrollbar sm:auto-cols-[188px]'
        }`}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((feature) => (
            <motion.div
              key={`${feature.to}|${feature.nama}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: .12 }}
            >
              <Link
                to={canonical(feature, domain)}
                className="group flex min-h-[68px] flex-col justify-center border-t border-white/[.08] py-3 transition-colors hover:border-white/20"
              >
                <span className="truncate text-[9px] font-bold uppercase tracking-[.1em] text-white/32">{feature.grup}</span>
                <strong className="mt-1 line-clamp-1 text-[12px] font-black leading-tight text-white/84 transition-colors group-hover:text-brand">
                  {feature.nama}
                </strong>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {items.length === 0 && (
        <div className="mt-3 border-t border-white/[.08] py-4 text-[11px] font-semibold text-white/42">
          No tools match this filter; clear search or choose All.
        </div>
      )}
    </section>
  )
}

export default SuperPageCapabilityRail
