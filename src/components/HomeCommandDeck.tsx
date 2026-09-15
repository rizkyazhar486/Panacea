import { useMemo, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { FITUR_DARI_HUB } from '../lib/katalogFitur'
import { useStore } from '../lib/store'
import { IconBook, IconGauge, IconMoon, IconRun, IconSparkle, IconUsers } from './icons'

type HubFeature = (typeof FITUR_DARI_HUB)[number]
type ActionIcon = ComponentType<{ size?: number; className?: string }>
type Domain = 'Your Body' | 'Clinical' | 'For You'
type Category = 'Daily' | 'Body' | 'Fitness' | 'Mind' | 'Clinical' | 'Learn' | 'Social' | 'Faith' | 'Finance' | 'Account' | 'Tools'
type Anchor = {
  label: string
  hint: string
  to: string
  icon: ActionIcon
  surface: string
  glow: string
}
type DomainSpec = {
  key: Domain
  short: string
  hint: string
  icon: ActionIcon
  categories: Category[]
  surface: string
  accent: string
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

const CATEGORY_ORDER: Category[] = ['Daily', 'Body', 'Fitness', 'Mind', 'Clinical', 'Learn', 'Social', 'Faith', 'Finance', 'Account', 'Tools']

const DOMAINS: DomainSpec[] = [
  {
    key: 'Your Body',
    short: 'Body',
    hint: 'Health · movement · recovery',
    icon: IconRun,
    categories: ['Daily', 'Body', 'Fitness', 'Mind'],
    surface: 'from-cyan-300/[.20] via-emerald-300/[.08] to-blue-500/[.14]',
    accent: 'bg-cyan-200',
  },
  {
    key: 'Clinical',
    short: 'Clinical',
    hint: 'Care · evidence · tools',
    icon: IconGauge,
    categories: ['Clinical', 'Learn', 'Tools'],
    surface: 'from-blue-300/[.20] via-violet-300/[.08] to-fuchsia-500/[.13]',
    accent: 'bg-violet-200',
  },
  {
    key: 'For You',
    short: 'For You',
    hint: 'People · faith · life',
    icon: IconUsers,
    categories: ['Social', 'Faith', 'Finance', 'Account'],
    surface: 'from-rose-300/[.18] via-amber-200/[.07] to-violet-500/[.13]',
    accent: 'bg-rose-200',
  },
]

function textOf(feature: HubFeature) {
  return `${feature.nama} ${feature.apa ?? ''} ${feature.kw ?? ''} ${feature.grup ?? ''}`
}

function categoryOf(feature: HubFeature): Category {
  const text = textOf(feature).toLowerCase()
  if (/prayer|adzan|hadith|scripture|quran|prophet|faith|relig/.test(text)) return 'Faith'
  if (/finance|money|market|wallet|asset|invest|budget|expense|income|crypto|stock/.test(text)) return 'Finance'
  if (/account|profile|setting|billing|subscription|notification|manage feature|theme/.test(text)) return 'Account'
  if (/social|community|feed|club|message|story/.test(text)) return 'Social'
  if (/clinical|score|risk|emergency|drug|hospital|diagnos|medical|emr/.test(text)) return 'Clinical'
  if (/learn|study|education|library|evidence|exam|osce|research/.test(text)) return 'Learn'
  if (/mind|mental|mood|gratitude|resilience|stress|breath/.test(text)) return 'Mind'
  if (/run|training|workout|fitness|sport|endurance|zone|strength|movement/.test(text)) return 'Fitness'
  if (/body|sleep|recovery|nutrition|heart|health|longevity|vital|lab|wearable/.test(text)) return 'Body'
  if (/calculator|tool|simulat|tracker|data|search/.test(text)) return 'Tools'
  return 'Daily'
}

function domainOf(category: Category): Domain {
  if (['Daily', 'Body', 'Fitness', 'Mind'].includes(category)) return 'Your Body'
  if (['Clinical', 'Learn', 'Tools'].includes(category)) return 'Clinical'
  return 'For You'
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

function featureSurface(category: Category) {
  switch (category) {
    case 'Fitness': return 'border-cyan-300/16 bg-gradient-to-br from-cyan-300/[.13] via-sky-400/[.055] to-transparent hover:border-cyan-200/40'
    case 'Body': return 'border-emerald-300/16 bg-gradient-to-br from-emerald-300/[.13] via-teal-400/[.05] to-transparent hover:border-emerald-200/40'
    case 'Mind': return 'border-violet-300/16 bg-gradient-to-br from-violet-300/[.13] via-fuchsia-400/[.05] to-transparent hover:border-violet-200/40'
    case 'Clinical': return 'border-blue-300/16 bg-gradient-to-br from-blue-300/[.13] via-indigo-400/[.05] to-transparent hover:border-blue-200/40'
    case 'Learn': return 'border-amber-300/16 bg-gradient-to-br from-amber-300/[.13] via-orange-400/[.05] to-transparent hover:border-amber-200/40'
    case 'Social': return 'border-rose-300/16 bg-gradient-to-br from-rose-300/[.13] via-pink-400/[.05] to-transparent hover:border-rose-200/40'
    case 'Faith': return 'border-teal-300/16 bg-gradient-to-br from-teal-300/[.13] via-emerald-400/[.05] to-transparent hover:border-teal-200/40'
    case 'Finance': return 'border-amber-300/16 bg-gradient-to-br from-amber-300/[.13] via-yellow-400/[.045] to-transparent hover:border-amber-200/40'
    case 'Account': return 'border-slate-200/14 bg-gradient-to-br from-white/[.09] via-slate-300/[.035] to-transparent hover:border-white/28'
    case 'Tools': return 'border-fuchsia-300/16 bg-gradient-to-br from-fuchsia-300/[.12] via-violet-400/[.05] to-transparent hover:border-fuchsia-200/40'
    default: return 'border-sky-300/16 bg-gradient-to-br from-sky-300/[.12] via-violet-400/[.04] to-transparent hover:border-sky-200/40'
  }
}

export function HomeCommandDeck() {
  const { account } = useStore()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'All' | Category>('All')
  const [domain, setDomain] = useState<'All' | Domain>('All')
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

  const categoryCounts = useMemo(() => {
    const counts = new Map<Category, number>()
    for (const feature of uniqueFeatures) {
      const current = categoryOf(feature)
      counts.set(current, (counts.get(current) ?? 0) + 1)
    }
    return counts
  }, [uniqueFeatures])

  const domainCounts = useMemo(() => {
    const counts = new Map<Domain, number>()
    for (const feature of uniqueFeatures) {
      const current = domainOf(categoryOf(feature))
      counts.set(current, (counts.get(current) ?? 0) + 1)
    }
    return counts
  }, [uniqueFeatures])

  const categories = useMemo(() => {
    const available = new Set(uniqueFeatures.map(categoryOf))
    return ['All', ...CATEGORY_ORDER.filter((item) => available.has(item))] as Array<'All' | Category>
  }, [uniqueFeatures])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return uniqueFeatures.filter((feature) => {
      const featureCategory = categoryOf(feature)
      if (domain !== 'All' && domainOf(featureCategory) !== domain) return false
      if (category !== 'All' && featureCategory !== category) return false
      return !needle || textOf(feature).toLowerCase().includes(needle)
    })
  }, [category, domain, query, uniqueFeatures])

  const visible = expanded || query || category !== 'All' || domain !== 'All' ? filtered : filtered.slice(0, 18)
  const firstName = account?.name?.trim().split(/\s+/)[0] || 'there'
  const initials = (account?.name || 'P').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  const maxCategory = Math.max(1, ...CATEGORY_ORDER.map((item) => categoryCounts.get(item) ?? 0))

  const chooseDomain = (next: Domain) => {
    setDomain((current) => current === next ? 'All' : next)
    setCategory('All')
    setExpanded(false)
  }

  const resetFilters = () => {
    setQuery('')
    setCategory('All')
    setDomain('All')
    setExpanded(false)
  }

  return (
    <section className="relative isolate overflow-hidden rounded-[32px] border border-white/[.09] bg-[#01040a]/96 p-3 text-white shadow-[0_32px_110px_rgba(0,0,0,.52)] sm:p-5 lg:p-6" aria-label="Panacea command deck">
      <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-cyan-400/[.11] blur-[88px]" aria-hidden />
      <div className="pointer-events-none absolute right-[-8rem] top-2 h-96 w-96 rounded-full bg-violet-500/[.105] blur-[96px]" aria-hidden />
      <div className="pointer-events-none absolute bottom-[-10rem] left-1/3 h-80 w-80 rounded-full bg-emerald-400/[.075] blur-[96px]" aria-hidden />
      <div className="pointer-events-none absolute inset-x-14 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/60 to-transparent" aria-hidden />

      {/* Personalized, glanceable hero: identity + one system status, no paragraph wall. */}
      <header className="relative grid gap-5 px-1 pb-6 pt-1 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.72fr)] lg:items-end lg:gap-8 lg:pb-8">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/15 bg-gradient-to-br from-cyan-200/24 via-violet-300/18 to-fuchsia-300/16 text-xs font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_8px_28px_rgba(34,211,238,.10)]" aria-hidden>
              {initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[10px] font-black uppercase tracking-[.18em] text-cyan-100/62">Panaceamed · Home</div>
              <h2 className="truncate text-2xl font-black tracking-[-.035em] sm:text-3xl">Welcome, {firstName}</h2>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-200/18 bg-emerald-300/[.07] px-3 py-1.5 text-[10px] font-black text-emerald-100">{uniqueFeatures.length} live capabilities</span>
            <span className="rounded-full border border-cyan-200/14 bg-cyan-300/[.055] px-3 py-1.5 text-[10px] font-black text-cyan-100">3 super-pages</span>
            {(domain !== 'All' || category !== 'All' || query) && (
              <button type="button" onClick={resetFilters} className="rounded-full border border-white/12 bg-white/[.045] px-3 py-1.5 text-[10px] font-black text-white/70 transition hover:border-white/24 hover:text-white">Reset view</button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-white/[.08] bg-white/[.028] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.05)] backdrop-blur-xl" aria-label="Capability coverage">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-[10px] font-black uppercase tracking-[.15em] text-white/44">Coverage</span>
            <span className="text-[10px] font-black text-white/70">at a glance</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-4">
            {CATEGORY_ORDER.filter((item) => (categoryCounts.get(item) ?? 0) > 0).slice(0, 8).map((item) => {
              const count = categoryCounts.get(item) ?? 0
              const height = Math.max(18, Math.round((count / maxCategory) * 54))
              return (
                <button key={item} type="button" onClick={() => { setCategory(item); setDomain('All'); setExpanded(false) }} className="group flex min-w-0 flex-col justify-end rounded-[12px] border border-white/[.055] bg-black/20 p-1.5 text-left transition hover:border-cyan-200/25 hover:bg-white/[.04]" aria-label={`${item}: ${count} capabilities`}>
                  <span className="mb-1 block w-full rounded-[7px] bg-gradient-to-t from-cyan-400/55 via-blue-400/35 to-violet-300/55 transition group-hover:brightness-125" style={{ height }} aria-hidden />
                  <span className="truncate text-[8px] font-black text-white/45">{item}</span>
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Three large super-page objects: fewer choices, more capability. */}
      <div className="relative grid gap-3 md:grid-cols-3" aria-label="Super pages">
        {DOMAINS.map((item) => {
          const DomainIcon = item.icon
          const selected = domain === item.key
          const count = domainCounts.get(item.key) ?? 0
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => chooseDomain(item.key)}
              aria-pressed={selected}
              className={`group relative min-h-[154px] overflow-hidden rounded-[26px] border p-4 text-left transition duration-300 active:scale-[.985] ${selected ? 'border-white/35 bg-white/[.075] shadow-[0_18px_60px_rgba(0,0,0,.32)]' : 'border-white/[.09] bg-white/[.028] hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[.045]'}`}
            >
              <span className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.surface} opacity-75 transition group-hover:opacity-100`} aria-hidden />
              <span className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full border border-white/[.08] bg-white/[.03] blur-[1px]" aria-hidden />
              <span className="relative flex h-full flex-col justify-between gap-7">
                <span className="flex items-start justify-between gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-[15px] border border-white/15 bg-black/22 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.14)]" aria-hidden><DomainIcon size={21} /></span>
                  <span className="text-3xl font-black tracking-[-.06em] text-white/90">{count}</span>
                </span>
                <span className="block min-w-0">
                  <span className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${item.accent}`} aria-hidden />
                    <span className="truncate text-lg font-black tracking-tight">{item.short}</span>
                  </span>
                  <span className="mt-1 block truncate text-[10px] font-bold text-white/48">{item.hint}</span>
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Familiar quick actions stay visible, but each one performs a real navigation. */}
      <div className="relative mt-7">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <span className="text-[10px] font-black uppercase tracking-[.16em] text-white/46">Quick actions</span>
          <span className="text-[10px] font-bold text-white/30">one tap</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {anchors.map((anchor) => {
            const AnchorIcon = anchor.icon
            return (
              <Link
                key={anchor.label}
                to={anchor.to}
                aria-label={`${anchor.label}: ${anchor.hint}`}
                className={`group min-h-[112px] overflow-hidden rounded-[22px] border border-white/[.09] bg-gradient-to-br ${anchor.surface} p-3.5 ${anchor.glow} transition duration-200 hover:-translate-y-0.5 hover:border-white/24 active:scale-[.985]`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-[13px] border border-white/12 bg-black/22 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.12)]" aria-hidden><AnchorIcon size={19} /></span>
                  <span className="text-white/36 transition group-hover:translate-x-0.5 group-hover:text-white/72" aria-hidden>↗</span>
                </div>
                <div className="mt-3 truncate text-sm font-black tracking-tight">{anchor.label}</div>
                <div className="mt-0.5 truncate text-[10px] font-semibold text-white/48">{anchor.hint}</div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Progressive disclosure: search/filter first, dense catalogue only when requested. */}
      <div className="relative mt-8 rounded-[26px] border border-white/[.075] bg-white/[.022] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.035)] backdrop-blur-xl sm:p-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <label className="flex min-h-[48px] min-w-0 flex-1 items-center gap-2.5 rounded-[17px] border border-cyan-200/12 bg-black/30 px-3.5 transition focus-within:border-cyan-200/42 focus-within:bg-black/42">
            <span className="text-cyan-100/66" aria-hidden>⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find any capability…" className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/28" />
            {query && <button type="button" onClick={() => setQuery('')} className="grid h-7 w-7 place-items-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white" aria-label="Clear search">×</button>}
          </label>
          <button type="button" onClick={() => setExpanded((value) => !value)} className="min-h-[48px] shrink-0 rounded-[17px] border border-violet-300/15 bg-violet-300/[.07] px-4 text-xs font-black text-violet-50 transition hover:border-violet-200/32 hover:bg-violet-300/[.11]">
            {expanded ? 'Compact' : `Browse ${filtered.length}`}
          </button>
        </div>

        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Feature categories">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => { setCategory(item); if (item !== 'All') setDomain('All') }}
              aria-pressed={category === item}
              className={`min-h-[36px] shrink-0 rounded-full border px-3 text-[10px] font-black transition ${category === item ? 'border-cyan-100/48 bg-cyan-100 text-[#02050a]' : 'border-white/[.075] bg-white/[.028] text-white/58 hover:border-white/18 hover:bg-white/[.045] hover:text-white'}`}
            >
              {item}{item !== 'All' ? ` · ${categoryCounts.get(item) ?? 0}` : ''}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {visible.map((feature) => {
            const featureCategory = categoryOf(feature)
            return (
              <Link
                key={`${feature.to}-${feature.nama}`}
                to={canonical(feature.to)}
                className={`group min-h-[82px] rounded-[18px] border p-3 transition duration-200 hover:-translate-y-px active:scale-[.985] ${featureSurface(featureCategory)}`}
                aria-label={`${feature.nama} · ${featureCategory}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-[8px] font-black uppercase tracking-[.12em] text-white/38">{featureCategory}</span>
                  <span className="text-[10px] text-white/26 transition group-hover:text-white/68" aria-hidden>↗</span>
                </div>
                <div className="mt-3 truncate text-[11px] font-black leading-tight text-white/88">{feature.nama}</div>
              </Link>
            )
          })}
        </div>

        {visible.length === 0 && (
          <div className="mx-auto my-5 grid min-h-[180px] max-w-xl place-items-center rounded-[22px] border border-dashed border-white/10 bg-black/18 p-6 text-center">
            <div>
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-[16px] border border-cyan-200/14 bg-cyan-300/[.06] text-lg text-cyan-100" aria-hidden>⌕</div>
              <div className="mt-4 text-sm font-black text-white/88">No matching capability</div>
              <button type="button" onClick={resetFilters} className="mt-3 min-h-[40px] rounded-full border border-cyan-100/28 bg-cyan-100 px-4 text-[10px] font-black text-[#02050a] transition hover:brightness-110">Show everything</button>
            </div>
          </div>
        )}

        {!expanded && !query && category === 'All' && domain === 'All' && filtered.length > visible.length && (
          <button type="button" onClick={() => setExpanded(true)} className="mt-3 w-full rounded-[16px] border border-white/[.065] bg-white/[.022] py-3 text-[10px] font-black text-white/52 transition hover:border-cyan-200/24 hover:bg-cyan-200/[.045] hover:text-cyan-50">
            Show all {uniqueFeatures.length} capabilities
          </button>
        )}
      </div>
    </section>
  )
}

export default HomeCommandDeck
