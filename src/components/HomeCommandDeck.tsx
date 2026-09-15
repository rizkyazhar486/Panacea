import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FITUR_DARI_HUB } from '../lib/katalogFitur'
import { PANACEA_SPACES, productSpaceForRoute, type ProductSpaceId } from '../lib/productSpaces'
import { useStore } from '../lib/store'
import { NAV_UNTUK_PENGATURAN } from './Shell'

type RegistryFeature = {
  to: string
  nama: string
  apa: string
  kw: string
  grup: string
  roles?: string[]
}

type MandatoryShortcut = {
  label: string
  hint: string
  to: string
  glyph: string
  match: RegExp
  surface: string
  edge: string
}

type SpaceFilter = 'all' | ProductSpaceId

const MANDATORY_SHORTCUTS: MandatoryShortcut[] = [
  {
    label: 'Score',
    hint: 'Clinical + health scoring',
    to: '/clinical-scores',
    glyph: '◎',
    match: /score|clinical calculator|risk score/i,
    surface: 'from-cyan-300/[.22] via-sky-500/[.08] to-blue-600/[.05]',
    edge: 'border-cyan-200/25 hover:border-cyan-100/60',
  },
  {
    label: 'Adzan',
    hint: 'Prayer time + faith',
    to: '/prayer-times',
    glyph: '◒',
    match: /adzan|prayer|shalat/i,
    surface: 'from-emerald-300/[.20] via-teal-500/[.08] to-cyan-600/[.04]',
    edge: 'border-emerald-200/25 hover:border-emerald-100/60',
  },
  {
    label: 'Stories',
    hint: 'Stories + reflection',
    to: '/prophet-stories',
    glyph: '◇',
    match: /stories|story|kisah nabi|prophet/i,
    surface: 'from-violet-300/[.22] via-fuchsia-500/[.08] to-indigo-600/[.05]',
    edge: 'border-violet-200/25 hover:border-violet-100/60',
  },
  {
    label: 'Motivation',
    hint: 'Resilience + direction',
    to: '/resilience-stories',
    glyph: '✦',
    match: /motivation|motivasi|resilience|life compass|gratitude/i,
    surface: 'from-amber-200/[.23] via-orange-500/[.08] to-rose-600/[.04]',
    edge: 'border-amber-100/25 hover:border-amber-100/60',
  },
  {
    label: 'Social',
    hint: 'Feed + people + clubs',
    to: '/feed',
    glyph: '◉',
    match: /social|feed|community|club/i,
    surface: 'from-rose-300/[.21] via-pink-500/[.08] to-violet-600/[.04]',
    edge: 'border-rose-200/25 hover:border-rose-100/60',
  },
  {
    label: 'Zone 2',
    hint: 'Aerobic base + endurance',
    to: '/fitness-hub?view=training',
    glyph: '⌁',
    match: /zone ?2|aerobic|endurance/i,
    surface: 'from-sky-200/[.23] via-cyan-500/[.08] to-emerald-600/[.05]',
    edge: 'border-sky-100/25 hover:border-sky-100/60',
  },
]

const SPACE_VISUAL: Record<ProductSpaceId, { glyph: string; chip: string; card: string; glow: string }> = {
  today: {
    glyph: '◉',
    chip: 'border-cyan-200/30 bg-cyan-200/[.10] text-cyan-100',
    card: 'border-cyan-200/15 bg-gradient-to-br from-cyan-300/[.11] via-blue-500/[.04] to-transparent hover:border-cyan-100/45',
    glow: 'from-cyan-300/18',
  },
  body: {
    glyph: '◎',
    chip: 'border-emerald-200/30 bg-emerald-200/[.10] text-emerald-100',
    card: 'border-emerald-200/15 bg-gradient-to-br from-emerald-300/[.11] via-teal-500/[.04] to-transparent hover:border-emerald-100/45',
    glow: 'from-emerald-300/18',
  },
  move: {
    glyph: '↗',
    chip: 'border-sky-200/30 bg-sky-200/[.10] text-sky-100',
    card: 'border-sky-200/15 bg-gradient-to-br from-sky-300/[.11] via-cyan-500/[.04] to-transparent hover:border-sky-100/45',
    glow: 'from-sky-300/18',
  },
  learn: {
    glyph: '◇',
    chip: 'border-violet-200/30 bg-violet-200/[.10] text-violet-100',
    card: 'border-violet-200/15 bg-gradient-to-br from-violet-300/[.11] via-fuchsia-500/[.04] to-transparent hover:border-violet-100/45',
    glow: 'from-violet-300/18',
  },
  care: {
    glyph: '+',
    chip: 'border-rose-200/30 bg-rose-200/[.10] text-rose-100',
    card: 'border-rose-200/15 bg-gradient-to-br from-rose-300/[.11] via-pink-500/[.04] to-transparent hover:border-rose-100/45',
    glow: 'from-rose-300/18',
  },
  discover: {
    glyph: '✦',
    chip: 'border-amber-100/30 bg-amber-200/[.10] text-amber-100',
    card: 'border-amber-100/15 bg-gradient-to-br from-amber-200/[.12] via-orange-500/[.04] to-transparent hover:border-amber-100/45',
    glow: 'from-amber-200/18',
  },
  community: {
    glyph: '∞',
    chip: 'border-fuchsia-200/30 bg-fuchsia-200/[.10] text-fuchsia-100',
    card: 'border-fuchsia-200/15 bg-gradient-to-br from-fuchsia-300/[.11] via-violet-500/[.04] to-transparent hover:border-fuchsia-100/45',
    glow: 'from-fuchsia-300/18',
  },
  system: {
    glyph: '⌘',
    chip: 'border-white/20 bg-white/[.055] text-white/78',
    card: 'border-white/10 bg-gradient-to-br from-white/[.07] via-cyan-500/[.025] to-transparent hover:border-white/28',
    glow: 'from-white/10',
  },
}

const SPACE_IMPACT: Record<ProductSpaceId, string> = {
  today: 'Turns scattered daily signals into one actionable operating picture.',
  body: 'Connects anatomy, physiology, imaging and personal measurements into one body model.',
  move: 'Translates training, sleep and recovery data into practical performance decisions.',
  learn: 'Compresses medical knowledge, evidence, calculators and study workflows into one learning layer.',
  care: 'Links records, clinical tools, services and emergency actions around the care journey.',
  discover: 'Packages simulation, longevity, research and advanced data tools into one experimental layer.',
  community: 'Connects people, stories, clubs and shared health activity without taking over the Home surface.',
  system: 'Keeps settings, billing, permissions and product controls reachable without visual clutter.',
}

function textOf(feature: RegistryFeature) {
  return `${feature.nama} ${feature.apa} ${feature.kw} ${feature.grup} ${feature.to}`
}

function buildRegistry(): RegistryFeature[] {
  const map = new Map<string, RegistryFeature>()

  for (const feature of FITUR_DARI_HUB) {
    map.set(feature.to, {
      to: feature.to,
      nama: feature.nama,
      apa: feature.apa ?? '',
      kw: feature.kw ?? '',
      grup: feature.grup ?? '',
    })
  }

  for (const nav of NAV_UNTUK_PENGATURAN) {
    const existing = map.get(nav.to)
    map.set(nav.to, {
      to: nav.to,
      nama: existing?.nama ?? nav.label,
      apa: existing?.apa ?? '',
      kw: existing?.kw ?? `${nav.label} ${nav.group}`,
      grup: existing?.grup || nav.group,
      roles: nav.roles,
    })
  }

  return [...map.values()]
    .filter((feature) => feature.to !== '/' && feature.to !== '/semua-fitur')
    .sort((a, b) => a.nama.localeCompare(b.nama))
}

function routeForShortcut(shortcut: MandatoryShortcut, registry: RegistryFeature[]) {
  return registry.find((feature) => shortcut.match.test(textOf(feature)))?.to ?? shortcut.to
}

function featureSummary(feature: RegistryFeature) {
  if (feature.apa.trim()) return feature.apa
  if (feature.grup.trim()) return feature.grup
  return 'Open capability'
}

export function HomeCommandDeck() {
  const { account } = useStore()
  const [query, setQuery] = useState('')
  const [spaceFilter, setSpaceFilter] = useState<SpaceFilter>('all')

  const registry = useMemo(() => {
    const all = buildRegistry()
    if (!account?.role) return all
    return all.filter((feature) => !feature.roles?.length || feature.roles.includes(account.role))
  }, [account?.role])

  const shortcuts = useMemo(
    () => MANDATORY_SHORTCUTS.map((shortcut) => ({ ...shortcut, to: routeForShortcut(shortcut, registry) })),
    [registry],
  )

  const counts = useMemo(() => {
    const next = new Map<ProductSpaceId, number>()
    for (const feature of registry) {
      const id = productSpaceForRoute(feature.to, feature.grup)
      next.set(id, (next.get(id) ?? 0) + 1)
    }
    return next
  }, [registry])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return registry.filter((feature) => {
      const id = productSpaceForRoute(feature.to, feature.grup)
      if (spaceFilter !== 'all' && id !== spaceFilter) return false
      if (!needle) return true
      return needle.split(/\s+/).every((token) => textOf(feature).toLowerCase().includes(token))
    })
  }, [query, registry, spaceFilter])

  const activeSpace = spaceFilter === 'all' ? null : PANACEA_SPACES.find((space) => space.id === spaceFilter) ?? null

  return (
    <section
      className="relative isolate overflow-hidden rounded-[34px] border border-cyan-100/[.10] bg-[#01030a] px-4 py-5 text-white shadow-[0_34px_120px_rgba(0,0,0,.56)] sm:px-7 sm:py-7 lg:px-10 lg:py-9"
      aria-label="Panacea Home supermega page"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(55,220,255,.12),transparent_26%),radial-gradient(circle_at_72%_4%,rgba(147,90,255,.13),transparent_28%),radial-gradient(circle_at_94%_45%,rgba(255,102,196,.09),transparent_26%),radial-gradient(circle_at_44%_105%,rgba(25,255,180,.08),transparent_31%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-x-14 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" aria-hidden />

      <div className="relative space-y-7 sm:space-y-9 lg:space-y-11">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[.24em] text-cyan-100/66">Panacea Home</div>
            <h1 className="mt-2 text-[clamp(1.7rem,4vw,3.25rem)] font-black leading-[.95] tracking-[-.05em] text-white">
              Everything important. One surface.
            </h1>
          </div>
          <div className="flex shrink-0 gap-2.5">
            <div className="rounded-full border border-cyan-200/20 bg-cyan-200/[.07] px-4 py-2 text-[10px] font-black text-cyan-100">
              {registry.length} capabilities
            </div>
            <div className="rounded-full border border-violet-200/20 bg-violet-200/[.07] px-4 py-2 text-[10px] font-black text-violet-100">
              {PANACEA_SPACES.length} systems
            </div>
          </div>
        </header>

        <section aria-label="Priority shortcuts">
          <div className="no-scrollbar grid auto-cols-[minmax(168px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-1 lg:grid-flow-row lg:grid-cols-6 lg:overflow-visible">
            {shortcuts.map((shortcut) => (
              <Link
                key={shortcut.label}
                to={shortcut.to}
                className={`group relative min-h-[122px] overflow-hidden rounded-[24px] border bg-gradient-to-br ${shortcut.surface} ${shortcut.edge} p-4 transition duration-300 hover:-translate-y-1 active:scale-[.985]`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-[14px] border border-white/12 bg-black/18 text-xl shadow-[inset_0_1px_0_rgba(255,255,255,.12)]">
                    {shortcut.glyph}
                  </span>
                  <span className="text-white/35 transition group-hover:translate-x-1 group-hover:text-white/80">↗</span>
                </div>
                <div className="mt-4 text-[15px] font-black tracking-[-.02em]">{shortcut.label}</div>
                <div className="mt-1 truncate text-[10px] font-semibold text-white/48">{shortcut.hint}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[30px] border border-white/[.08] bg-black/24 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.04)] backdrop-blur-2xl sm:p-6 lg:p-7" aria-label="Universal capability browser">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="text-[10px] font-black uppercase tracking-[.20em] text-white/40">Supermega capability map</div>
              <h2 className="mt-2 text-xl font-black tracking-[-.035em] sm:text-2xl">
                The whole product, compressed into one widget.
              </h2>
              <p className="mt-2 max-w-xl text-[11px] font-semibold leading-relaxed text-white/46">
                Search, filter, then open. The page stays short while every registered destination remains reachable here.
              </p>
            </div>

            <label className="flex min-h-[50px] w-full items-center gap-3 rounded-[18px] border border-cyan-100/15 bg-cyan-100/[.035] px-4 transition focus-within:border-cyan-100/45 lg:max-w-[460px]">
              <span className="text-cyan-100/70" aria-hidden>⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search any feature, score, tool, dataset…"
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/28"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="grid h-8 w-8 place-items-center rounded-full text-white/48 transition hover:bg-white/10 hover:text-white"
                  aria-label="Clear capability search"
                >
                  ×
                </button>
              )}
            </label>
          </div>

          <div className="no-scrollbar mt-6 flex gap-2.5 overflow-x-auto pb-2" aria-label="Product systems">
            <button
              type="button"
              onClick={() => setSpaceFilter('all')}
              aria-pressed={spaceFilter === 'all'}
              className={`min-h-[42px] shrink-0 rounded-full border px-4 text-[10px] font-black transition ${
                spaceFilter === 'all'
                  ? 'border-white/70 bg-white text-black'
                  : 'border-white/10 bg-white/[.035] text-white/58 hover:border-white/25 hover:text-white'
              }`}
            >
              All <span className="ml-1 opacity-45">{registry.length}</span>
            </button>

            {PANACEA_SPACES.map((space) => {
              const visual = SPACE_VISUAL[space.id]
              const active = spaceFilter === space.id
              return (
                <button
                  key={space.id}
                  type="button"
                  onClick={() => setSpaceFilter(active ? 'all' : space.id)}
                  aria-pressed={active}
                  className={`min-h-[42px] shrink-0 rounded-full border px-4 text-[10px] font-black transition ${
                    active ? 'border-white/70 bg-white text-black' : visual.chip
                  }`}
                >
                  <span aria-hidden>{visual.glyph}</span> {space.shortLabel}{' '}
                  <span className="ml-1 opacity-45">{counts.get(space.id) ?? 0}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.16em] text-white/34">
                {activeSpace ? activeSpace.eyebrow : 'Entire Panacea'}
              </div>
              <div className="mt-1 text-sm font-black text-white/92">
                {activeSpace ? activeSpace.label : `${filtered.length} reachable capabilities`}
              </div>
              <div className="mt-1 max-w-3xl text-[10px] font-semibold leading-relaxed text-white/42">
                {activeSpace ? SPACE_IMPACT[activeSpace.id] : 'One searchable layer across daily health, body, movement, medical learning, care, discovery, community and system controls.'}
              </div>
            </div>
            <div className="text-[10px] font-black text-white/34">
              {filtered.length} shown · horizontal browse
            </div>
          </div>

          <div className="no-scrollbar mt-4 grid max-h-[258px] auto-cols-[minmax(184px,214px)] grid-flow-col grid-rows-2 gap-3 overflow-x-auto overscroll-x-contain pb-2 pr-2 sm:auto-cols-[minmax(210px,244px)]">
            {filtered.map((feature) => {
              const spaceId = productSpaceForRoute(feature.to, feature.grup)
              const visual = SPACE_VISUAL[spaceId]
              return (
                <Link
                  key={feature.to}
                  to={feature.to}
                  className={`group relative min-h-[116px] overflow-hidden rounded-[20px] border p-4 transition duration-300 hover:-translate-y-0.5 active:scale-[.985] ${visual.card}`}
                >
                  <div className={`pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b ${visual.glow} to-transparent opacity-60`} aria-hidden />
                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate text-[9px] font-black uppercase tracking-[.13em] text-white/40">
                        {visual.glyph} {PANACEA_SPACES.find((space) => space.id === spaceId)?.shortLabel ?? spaceId}
                      </span>
                      <span className="text-[10px] text-white/26 transition group-hover:translate-x-0.5 group-hover:text-white/72">↗</span>
                    </div>
                    <div className="mt-3 line-clamp-2 text-[12px] font-black leading-[1.18] tracking-[-.01em] text-white/92">
                      {feature.nama}
                    </div>
                    <div className="mt-auto line-clamp-1 pt-2 text-[9px] font-semibold text-white/38">
                      {featureSummary(feature)}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div className="mt-4 grid min-h-[116px] place-items-center rounded-[20px] border border-white/[.07] bg-white/[.025] text-sm font-semibold text-white/42">
              No matching capability.
            </div>
          )}
        </section>

        <footer className="no-scrollbar flex items-center gap-3 overflow-x-auto border-t border-white/[.06] pt-5 text-[9px] font-black uppercase tracking-[.14em] text-white/30">
          <span className="shrink-0 text-cyan-100/55">One Home</span>
          <span>•</span>
          <span className="shrink-0">Wide spacing</span>
          <span>•</span>
          <span className="shrink-0">No duplicated Home tabs</span>
          <span>•</span>
          <span className="shrink-0">Full capability registry</span>
          <span>•</span>
          <span className="shrink-0">Search-first depth</span>
        </footer>
      </div>
    </section>
  )
}
