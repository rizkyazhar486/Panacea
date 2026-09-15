import { useMemo, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { FITUR_DARI_HUB } from '../lib/katalogFitur'
import { IconBook, IconGauge, IconMoon, IconRun, IconSparkle, IconUsers } from './icons'

type HubFeature = (typeof FITUR_DARI_HUB)[number]
type ActionIcon = ComponentType<{ size?: number; className?: string }>
type Anchor = {
  label: string
  hint: string
  to: string
  icon: ActionIcon
  surface: string
  glow: string
}

const FEATURE_LIMIT = 96

const FALLBACK_ANCHORS: Anchor[] = [
  { label: 'Score', hint: 'Clinical & health scores', to: '/clinical-scores', icon: IconGauge, surface: 'from-sky-400/24 via-cyan-300/10 to-blue-500/20', glow: 'shadow-[0_14px_42px_rgba(56,189,248,.16)]' },
  { label: 'Adzan', hint: 'Prayer time', to: '/prayer-times', icon: IconMoon, surface: 'from-emerald-300/24 via-teal-300/10 to-cyan-500/16', glow: 'shadow-[0_14px_42px_rgba(52,211,153,.14)]' },
  { label: 'Stories', hint: 'Stories & reflection', to: '/prophet-stories', icon: IconBook, surface: 'from-violet-400/24 via-fuchsia-300/10 to-indigo-500/18', glow: 'shadow-[0_14px_42px_rgba(167,139,250,.15)]' },
  { label: 'Motivation', hint: 'Reset your direction', to: '/resilience-stories', icon: IconSparkle, surface: 'from-amber-300/25 via-orange-300/10 to-rose-500/16', glow: 'shadow-[0_14px_42px_rgba(251,191,36,.13)]' },
  { label: 'Social', hint: 'People & activity', to: '/?t=social', icon: IconUsers, surface: 'from-rose-400/24 via-pink-300/10 to-violet-500/18', glow: 'shadow-[0_14px_42px_rgba(244,114,182,.14)]' },
  { label: 'Zone 2', hint: 'Aerobic base', to: '/latihan?t=endurance', icon: IconRun, surface: 'from-cyan-300/25 via-sky-300/10 to-emerald-400/16', glow: 'shadow-[0_14px_42px_rgba(34,211,238,.14)]' },
]

const MATCHERS: Array<{ index: number; rx: RegExp }> = [
  { index: 0, rx: /score|clinical calculator|risk score/i },
  { index: 1, rx: /adzan|prayer|shalat/i },
  { index: 2, rx: /stories|story|kisah nabi|prophet/i },
  { index: 3, rx: /motivation|motivasi|resilience|life compass|gratitude/i },
  { index: 4, rx: /social|feed|community/i },
  { index: 5, rx: /zone ?2|aerobic|endurance/i },
]

const CATEGORY_ORDER = ['Daily', 'Body', 'Fitness', 'Mind', 'Clinical', 'Learn', 'Social', 'Faith', 'Tools']

function textOf(feature: HubFeature) {
  return `${feature.nama} ${feature.apa ?? ''} ${feature.kw ?? ''} ${feature.grup ?? ''}`
}

function categoryOf(feature: HubFeature): string {
  const text = textOf(feature).toLowerCase()
  if (/prayer|adzan|hadith|scripture|quran|prophet|faith|relig/.test(text)) return 'Faith'
  if (/social|community|feed|club|message|story/.test(text)) return 'Social'
  if (/clinical|score|risk|emergency|drug|hospital|diagnos|medical|emr/.test(text)) return 'Clinical'
  if (/learn|study|education|library|evidence|exam|osce|research/.test(text)) return 'Learn'
  if (/mind|mental|mood|gratitude|resilience|stress|breath/.test(text)) return 'Mind'
  if (/run|training|workout|fitness|sport|endurance|zone|strength|movement/.test(text)) return 'Fitness'
  if (/body|sleep|recovery|nutrition|heart|health|longevity|vital|lab|wearable/.test(text)) return 'Body'
  if (/calculator|tool|simulat|tracker|data|search/.test(text)) return 'Tools'
  return 'Daily'
}

function canonical(to: string) {
  const redirects: Record<string, string> = {
    '/feed': '/?t=social',
    '/community': '/?t=community',
    '/clubs': '/?t=clubs',
    '/sports-scores': '/?t=scores',
    '/scripture': '/?t=religion&faith=scripture',
    '/hadith': '/?t=religion&faith=hadith',
    '/prayer-times': '/?t=religion&faith=prayer',
    '/prophet-stories': '/?t=religion&faith=stories',
    '/body-explorer': '/learn?t=body',
    '/radiology': '/learn?t=radiology',
    '/med-study': '/learn?t=library',
    '/clinical-calculators': '/learn?t=calculators',
    '/latihan': '/fitness-hub?view=training',
    '/workout': '/fitness-hub?view=workout&t=sesi',
    '/recovery': '/fitness-hub?view=recovery',
    '/nutrition': '/fitness-hub?view=nutrition',
    '/health-data': '/fitness-hub?view=health-data',
  }
  return redirects[to] ?? to
}

function featureSurface(category: string) {
  switch (category) {
    case 'Fitness': return 'border-cyan-300/16 bg-gradient-to-br from-cyan-300/[.13] via-sky-400/[.055] to-transparent hover:border-cyan-200/40'
    case 'Body': return 'border-emerald-300/16 bg-gradient-to-br from-emerald-300/[.13] via-teal-400/[.05] to-transparent hover:border-emerald-200/40'
    case 'Mind': return 'border-violet-300/16 bg-gradient-to-br from-violet-300/[.13] via-fuchsia-400/[.05] to-transparent hover:border-violet-200/40'
    case 'Clinical': return 'border-blue-300/16 bg-gradient-to-br from-blue-300/[.13] via-indigo-400/[.05] to-transparent hover:border-blue-200/40'
    case 'Learn': return 'border-amber-300/16 bg-gradient-to-br from-amber-300/[.13] via-orange-400/[.05] to-transparent hover:border-amber-200/40'
    case 'Social': return 'border-rose-300/16 bg-gradient-to-br from-rose-300/[.13] via-pink-400/[.05] to-transparent hover:border-rose-200/40'
    case 'Faith': return 'border-teal-300/16 bg-gradient-to-br from-teal-300/[.13] via-emerald-400/[.05] to-transparent hover:border-teal-200/40'
    case 'Tools': return 'border-fuchsia-300/16 bg-gradient-to-br from-fuchsia-300/[.12] via-violet-400/[.05] to-transparent hover:border-fuchsia-200/40'
    default: return 'border-sky-300/16 bg-gradient-to-br from-sky-300/[.12] via-violet-400/[.04] to-transparent hover:border-sky-200/40'
  }
}

export function HomeCommandDeck() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [expanded, setExpanded] = useState(false)

  const uniqueFeatures = useMemo(() => {
    const seen = new Set<string>()
    return FITUR_DARI_HUB.filter((feature) => {
      const key = canonical(feature.to)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, FEATURE_LIMIT)
  }, [])

  const anchors = useMemo(() => {
    return FALLBACK_ANCHORS.map((fallback, index) => {
      const matcher = MATCHERS.find((item) => item.index === index)
      const feature = matcher ? uniqueFeatures.find((item) => matcher.rx.test(textOf(item))) : undefined
      return feature ? { ...fallback, to: canonical(feature.to) } : fallback
    })
  }, [uniqueFeatures])

  const categories = useMemo(() => {
    const available = new Set(uniqueFeatures.map(categoryOf))
    return ['All', ...CATEGORY_ORDER.filter((item) => available.has(item))]
  }, [uniqueFeatures])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return uniqueFeatures.filter((feature) => {
      if (category !== 'All' && categoryOf(feature) !== category) return false
      return !needle || textOf(feature).toLowerCase().includes(needle)
    })
  }, [category, query, uniqueFeatures])

  const visible = expanded || query || category !== 'All' ? filtered : filtered.slice(0, 18)

  return (
    <section className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-[#01040a]/95 p-3 text-white shadow-[0_28px_90px_rgba(0,0,0,.5)] sm:p-5" aria-label="Panacea command deck">
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/12 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute right-[-6rem] top-10 h-72 w-72 rounded-full bg-violet-500/12 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-[-8rem] left-1/3 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/55 to-transparent" aria-hidden />

      <div className="relative flex items-center justify-between gap-3 px-1 pb-3">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-200/80">Today</div>
          <h2 className="truncate text-xl font-black tracking-[-.025em] sm:text-2xl">Your Panacea</h2>
        </div>
        <div className="shrink-0 rounded-full border border-emerald-300/20 bg-emerald-300/[.08] px-3 py-1.5 text-[10px] font-black text-emerald-200">
          {uniqueFeatures.length} active
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {anchors.map((anchor) => {
          const AnchorIcon = anchor.icon
          return (
            <Link
              key={anchor.label}
              to={anchor.to}
              aria-label={`${anchor.label}: ${anchor.hint}`}
              className={`group min-h-[104px] overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-br ${anchor.surface} p-3 ${anchor.glow} transition duration-200 hover:-translate-y-0.5 hover:border-white/25 active:scale-[.985]`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-[13px] border border-white/12 bg-black/22 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.12)]" aria-hidden>
                  <AnchorIcon size={19} />
                </span>
                <span className="text-white/42 transition group-hover:translate-x-0.5 group-hover:text-white/75" aria-hidden>↗</span>
              </div>
              <div className="mt-3 text-sm font-black tracking-tight">{anchor.label}</div>
              <div className="mt-0.5 truncate text-[10px] font-semibold text-white/52">{anchor.hint}</div>
            </Link>
          )
        })}
      </div>

      <div className="relative mt-3 rounded-[22px] border border-white/[.08] bg-white/[.025] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.04)] backdrop-blur-xl sm:p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-[15px] border border-cyan-200/12 bg-black/35 px-3 focus-within:border-cyan-200/40">
            <span className="text-cyan-200/70" aria-hidden>⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find any capability…"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/30"
            />
            {query && <button type="button" onClick={() => setQuery('')} className="grid h-7 w-7 place-items-center rounded-full text-white/55 hover:bg-white/10 hover:text-white" aria-label="Clear search">×</button>}
          </label>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="min-h-[44px] shrink-0 rounded-[15px] border border-violet-300/16 bg-violet-300/[.08] px-4 text-xs font-black text-violet-100 transition hover:border-violet-200/35 hover:bg-violet-300/[.12]"
          >
            {expanded ? 'Compact' : `Browse ${uniqueFeatures.length}`}
          </button>
        </div>

        <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto pb-1" aria-label="Feature categories">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
              className={`min-h-[36px] shrink-0 rounded-full border px-3 text-[10px] font-black transition ${category === item ? 'border-cyan-200/45 bg-cyan-200 text-[#02050a]' : 'border-white/[.08] bg-white/[.035] text-white/62 hover:border-white/20 hover:text-white'}`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
          {visible.map((feature) => {
            const featureCategory = categoryOf(feature)
            return (
              <Link
                key={`${feature.to}-${feature.nama}`}
                to={canonical(feature.to)}
                className={`group min-h-[74px] rounded-[16px] border p-2.5 transition duration-200 hover:-translate-y-px active:scale-[.985] ${featureSurface(featureCategory)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-[9px] font-black uppercase tracking-[.11em] text-white/42">{featureCategory}</span>
                  <span className="text-[10px] text-white/28 transition group-hover:text-white/70">↗</span>
                </div>
                <div className="mt-2 line-clamp-2 text-[11px] font-black leading-tight text-white/88">{feature.nama}</div>
              </Link>
            )
          })}
        </div>

        {visible.length === 0 && (
          <div className="grid min-h-[96px] place-items-center text-sm font-semibold text-white/44">No matching capability.</div>
        )}

        {!expanded && !query && category === 'All' && filtered.length > visible.length && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-2 w-full rounded-[14px] border border-white/[.07] bg-white/[.025] py-2.5 text-[10px] font-black text-white/54 transition hover:border-cyan-200/25 hover:bg-cyan-200/[.05] hover:text-cyan-100"
          >
            Show all {uniqueFeatures.length} capabilities
          </button>
        )}
      </div>
    </section>
  )
}

export default HomeCommandDeck