import { lazy, Suspense, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FITUR_DARI_HUB } from '../lib/katalogFitur'

const PerformanceVisualizationDeck = lazy(() => import('./dashboard/PerformanceVisualizationDeck').then((m) => ({ default: m.PerformanceVisualizationDeck })))

type HubFeature = (typeof FITUR_DARI_HUB)[number]
type SuperPage = 'Your Body' | 'Clinical' | 'For You'

const ZONES: Array<{ key: SuperPage; to: string; glyph: string; micro: string; accent: string }> = [
  { key: 'Your Body', to: '/fitness-hub', glyph: '◎', micro: 'Move · Sleep · Recovery · Body · Fitness · Mind · Longevity · Nutrition · Data · VitaPulse', accent: 'from-cyan-300/[.18] via-emerald-300/[.08] to-blue-500/[.14]' },
  { key: 'Clinical', to: '/clinical-hub', glyph: '✚', micro: 'Body Explorer · Discovery · Genome · Drugs · Library · Ask · Calculators · Lab · Learn', accent: 'from-blue-300/[.18] via-violet-300/[.08] to-fuchsia-500/[.14]' },
  { key: 'For You', to: '/?space=for-you', glyph: '✦', micro: 'Faith · Finance · Score · Social · Community · AI · EMR · Care · Account · System', accent: 'from-violet-300/[.18] via-rose-300/[.08] to-amber-400/[.13]' },
]

function textOf(feature: HubFeature) {
  return `${feature.nama} ${feature.apa ?? ''} ${feature.kw ?? ''} ${feature.grup ?? ''}`
}

function canonical(to: string) {
  const redirects: Record<string, string> = {
    '/feed': '/?space=for-you&panel=social',
    '/community': '/?space=for-you&panel=community',
    '/clubs': '/?space=for-you&panel=community',
    '/sports-scores': '/?space=for-you&panel=score',
    '/scripture': '/?space=for-you&panel=faith',
    '/hadith': '/?space=for-you&panel=faith',
    '/prayer-times': '/?space=for-you&panel=faith',
    '/prophet-stories': '/?space=for-you&panel=faith',
    '/body-explorer': '/body-explorer',
    '/radiology': '/learn?t=radiology',
    '/med-study': '/learn?t=library',
    '/clinical-calculators': '/clinical-hub',
    '/latihan': '/fitness-hub?view=training',
    '/workout': '/fitness-hub?view=workout&t=sesi',
    '/recovery': '/fitness-hub?view=recovery',
    '/nutrition': '/fitness-hub?view=nutrition',
    '/health-data': '/fitness-hub?view=health-data',
  }
  return redirects[to] ?? to
}

function superPageOf(feature: HubFeature): SuperPage {
  const text = textOf(feature).toLowerCase()
  if (/social|community|club|message|faith|relig|prayer|adzan|quran|hadith|prophet|finance|money|market|account|profile|setting|theme|support|billing|price|chatbot|emr|care episode/.test(text)) return 'For You'
  if (/clinical|medical|diagnos|drug|gene|genom|body explorer|anatom|radiolog|learn|study|library|evidence|osce|calculator|lab|score|research|discovery|trial|pharmacy|hospital/.test(text)) return 'Clinical'
  return 'Your Body'
}

function surface(zone: SuperPage) {
  if (zone === 'Your Body') return 'border-cyan-300/15 bg-gradient-to-br from-cyan-300/[.11] via-emerald-300/[.045] to-transparent hover:border-cyan-200/35'
  if (zone === 'Clinical') return 'border-violet-300/15 bg-gradient-to-br from-violet-300/[.11] via-blue-300/[.045] to-transparent hover:border-violet-200/35'
  return 'border-rose-300/15 bg-gradient-to-br from-rose-300/[.10] via-amber-300/[.04] to-transparent hover:border-rose-200/35'
}

export function HomeCommandDeck() {
  const [query, setQuery] = useState('')
  const [zone, setZone] = useState<SuperPage | 'All'>('All')
  const [expanded, setExpanded] = useState(false)

  const uniqueFeatures = useMemo(() => {
    const seen = new Set<string>()
    return FITUR_DARI_HUB.filter((feature) => {
      const key = `${canonical(feature.to)}|${feature.nama}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [])

  const zoneCounts = useMemo(() => {
    const counts: Record<SuperPage, number> = { 'Your Body': 0, Clinical: 0, 'For You': 0 }
    uniqueFeatures.forEach((feature) => { counts[superPageOf(feature)] += 1 })
    return counts
  }, [uniqueFeatures])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return uniqueFeatures.filter((feature) => {
      const featureZone = superPageOf(feature)
      if (zone !== 'All' && featureZone !== zone) return false
      return !needle || textOf(feature).toLowerCase().includes(needle)
    })
  }, [query, uniqueFeatures, zone])

  const visible = expanded || query || zone !== 'All' ? filtered : filtered.slice(0, 12)

  return (
    <main className="relative isolate overflow-hidden rounded-[30px] border border-white/10 bg-[#01040a]/95 p-3 text-white shadow-[0_28px_90px_rgba(0,0,0,.5)] sm:p-5" aria-label="Panacea Home OS">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute right-[-7rem] top-16 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/55 to-transparent" aria-hidden />

      <header className="relative flex items-end justify-between gap-3 px-1 pb-4">
        <div><div className="text-[10px] font-black uppercase tracking-[.19em] text-cyan-200/75">Today</div><h1 className="mt-1 text-2xl font-black tracking-[-.035em]">Your Panacea</h1></div>
        <div className="rounded-full border border-emerald-300/20 bg-emerald-300/[.08] px-3 py-1.5 text-[10px] font-black text-emerald-200">{uniqueFeatures.length} active</div>
      </header>

      <section className="relative grid gap-3 lg:grid-cols-3" aria-label="Three Panacea super pages">
        {ZONES.map((item) => (
          <article key={item.key} className={`overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br ${item.accent} p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]`}>
            <div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-[15px] border border-white/10 bg-black/20 text-xl">{item.glyph}</span><span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[9px] font-black">{zoneCounts[item.key]} widgets</span></div>
            <div className="mt-5 text-lg font-black tracking-[-.02em]">{item.key}</div>
            <div className="mt-1 truncate text-[10px] font-bold text-white/45">{item.micro}</div>
            <div className="mt-4 flex gap-2"><button type="button" onClick={() => { setZone(item.key); setExpanded(true) }} className="rounded-full border border-white/10 bg-white/[.06] px-3 py-2 text-[10px] font-black">Widgets</button><Link to={item.to} className="rounded-full bg-white px-3 py-2 text-[10px] font-black text-black">Open →</Link></div>
          </article>
        ))}
      </section>

      <section className="relative mt-5" aria-label="Live body widgets">
        <Suspense fallback={<div className="grid min-h-[220px] place-items-center rounded-[26px] border border-white/10 bg-white/[.03] text-xs font-black text-white/45">Loading live widgets…</div>}>
          <PerformanceVisualizationDeck mode="home" />
        </Suspense>
      </section>

      <section className="relative mt-5 rounded-[24px] border border-white/[.08] bg-white/[.025] p-3 backdrop-blur-xl" aria-label="All functional destinations">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-[15px] border border-cyan-200/12 bg-black/35 px-3 focus-within:border-cyan-200/40"><span className="text-cyan-200/70" aria-hidden>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find any capability…" className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/30" />{query && <button type="button" onClick={() => setQuery('')} className="grid h-7 w-7 place-items-center rounded-full text-white/55 hover:bg-white/10">×</button>}</label>
          <button type="button" onClick={() => setExpanded((value) => !value)} className="min-h-[44px] rounded-[15px] border border-violet-300/16 bg-violet-300/[.08] px-4 text-xs font-black text-violet-100">{expanded ? 'Compact' : `Browse ${uniqueFeatures.length}`}</button>
        </div>

        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">{(['All', 'Your Body', 'Clinical', 'For You'] as const).map((item) => <button key={item} type="button" onClick={() => setZone(item)} className={`min-h-[36px] shrink-0 rounded-full border px-3 text-[10px] font-black ${zone === item ? 'border-cyan-200/45 bg-cyan-200 text-black' : 'border-white/[.08] bg-white/[.035] text-white/60'}`}>{item}</button>)}</div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {visible.map((feature) => {
            const featureZone = superPageOf(feature)
            return <Link key={`${feature.to}-${feature.nama}`} to={canonical(feature.to)} className={`group min-h-[92px] rounded-[18px] border p-3 transition hover:-translate-y-px active:scale-[.985] ${surface(featureZone)}`}><div className="flex items-center justify-between gap-2"><span className="truncate text-[8px] font-black uppercase tracking-[.12em] text-white/40">{featureZone}</span><span className="text-white/30 group-hover:text-white/70">↗</span></div><div className="mt-3 line-clamp-2 text-[11px] font-black leading-tight text-white/90">{feature.nama}</div></Link>
          })}
        </div>

        {visible.length === 0 && <div className="grid min-h-[96px] place-items-center text-sm font-semibold text-white/40">No matching capability.</div>}
      </section>
    </main>
  )
}

export default HomeCommandDeck
