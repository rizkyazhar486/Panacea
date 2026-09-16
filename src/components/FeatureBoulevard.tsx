import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CANONICAL_CAPABILITIES,
  type CanonicalCapability,
  type CanonicalSuperPage,
} from '../lib/canonicalCapabilities'

type Zone = 'home' | 'learn' | 'body' | 'services' | 'all'

function superPageForZone(zone: Zone): CanonicalSuperPage | null {
  if (zone === 'body') return 'body'
  if (zone === 'learn' || zone === 'services') return 'clinical'
  if (zone === 'home') return 'for-you'
  return null
}

function textOf(feature: CanonicalCapability) {
  return `${feature.grup} ${feature.nama} ${feature.apa} ${feature.kw} ${feature.aliases.join(' ')}`.toLowerCase()
}

function aisleOf(feature: CanonicalCapability) {
  const text = textOf(feature)
  if (feature.superPage === 'clinical') {
    if (/radiolog|imaging|ct |mri|pet|x-ray|ultrasound/.test(text)) return 'Imaging & Diagnostics'
    if (/drug|pharma|medication|therapeutic/.test(text)) return 'Drugs & Therapeutics'
    if (/genom|gene|dna|rna|molecular|cell/.test(text)) return 'Genome, Cell & Molecular'
    if (/evidence|research|trial|discovery|innovation|invention/.test(text)) return 'Evidence & Discovery'
    if (/exam|osce|question|curriculum|study|learn|library/.test(text)) return 'Learning & Knowledge'
    if (/calculator|score|risk|lab/.test(text)) return 'Calculators, Labs & Scores'
    if (/emr|record|care|hospital|consult|emergency|pharmacy/.test(text)) return 'Care & Clinical Workflow'
    return 'Anatomy, Physiology & Clinical Tools'
  }
  if (feature.superPage === 'for-you') {
    if (/faith|religion|prayer|hadith|scripture|prophet/.test(text)) return 'Faith & Reflection'
    if (/finance|money|market|wallet|budget|invest|stock|crypto/.test(text)) return 'Finance & Markets'
    if (/account|profile|setting|billing|theme|notification/.test(text)) return 'Account & System'
    if (/message|social|community|feed|club|story|people/.test(text)) return 'Social & Community'
    return 'Personal Life & Intelligence'
  }
  if (/sleep|recovery|readiness/.test(text)) return 'Sleep & Recovery'
  if (/nutrition|food|hydration|macro|diet|caffeine|fasting/.test(text)) return 'Nutrition & Metabolism'
  if (/longevity|aging|age|prevention|wellness/.test(text)) return 'Longevity & Prevention'
  if (/data|lab|wearable|device|heart rate|hrv|spo2|vital/.test(text)) return 'Health Data & Wearables'
  if (/body|shape|composition|posture|skin|aesthetic/.test(text)) return 'Personal Body & Character'
  return 'Training, Movement & Performance'
}

export function FeatureBoulevard({ zone = 'all', title = 'Feature Boulevard' }: { zone?: Zone; title?: string }) {
  const [q, setQ] = useState('')
  const [aisle, setAisle] = useState<string | null>(null)
  const superPage = superPageForZone(zone)

  const placed = useMemo(() => {
    return CANONICAL_CAPABILITIES
      .filter((feature) => !superPage || feature.superPage === superPage)
      .map((feature) => ({ ...feature, aisle: aisleOf(feature) }))
  }, [superPage])

  const aisles = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of placed) counts.set(item.aisle, (counts.get(item.aisle) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [placed])

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const filtered = placed.filter((feature) => {
      if (aisle && feature.aisle !== aisle) return false
      if (!needle) return true
      return `${feature.nama} ${feature.apa} ${feature.kw} ${feature.grup} ${feature.aisle} ${feature.aliases.join(' ')}`.toLowerCase().includes(needle)
    })
    const grouped = new Map<string, typeof filtered>()
    for (const feature of filtered) {
      const list = grouped.get(feature.aisle) ?? []
      list.push(feature)
      grouped.set(feature.aisle, list)
    }
    return [...grouped.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [aisle, placed, q])

  const total = rows.reduce((count, [, items]) => count + items.length, 0)
  const idleChip = 'border-white/10 bg-black/45 text-white/70 hover:border-cyan-300/25 hover:bg-cyan-300/[.06] hover:text-white'
  const activeChip = 'border-cyan-200/60 bg-gradient-to-r from-emerald-300 via-cyan-300 to-violet-300 text-[#020509] shadow-[0_8px_24px_rgba(34,211,238,.14)]'

  return (
    <section className="relative isolate overflow-hidden rounded-[26px] border border-white/10 bg-[#020509]/95 p-3 text-white shadow-[0_24px_80px_rgba(0,0,0,.44)] backdrop-blur-2xl sm:rounded-[30px] sm:p-5" aria-label={title}>
      <div className="pointer-events-none absolute -right-20 -top-24 h-60 w-60 rounded-full bg-emerald-400/[.10] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-24 bottom-[-7rem] h-64 w-64 rounded-full bg-violet-500/[.10] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute left-1/3 top-[-9rem] h-56 w-56 rounded-full bg-cyan-400/[.07] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" aria-hidden />

      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-200/90 sm:text-[10px]">Canonical boulevard · direct access</div>
          <h2 className="mt-1 text-lg font-black tracking-tight text-white sm:text-xl">{title}</h2>
          <p className="mt-1 max-w-3xl text-[10px] font-medium leading-relaxed text-white/58 sm:text-[11px]">Search or swipe through one canonical capability registry without adding another menu layer.</p>
        </div>
        <span className="rounded-full border border-emerald-300/25 bg-emerald-300/[.08] px-3 py-1.5 text-[9px] font-black text-emerald-200 sm:text-[10px]">{total} capabilities</span>
      </div>

      <div className="no-scrollbar relative mt-3 flex snap-x snap-mandatory gap-1.5 overflow-x-auto overscroll-x-contain pb-1 sm:gap-2" aria-label="Feature aisles">
        <button type="button" onClick={() => setAisle(null)} aria-pressed={aisle === null} className={`min-h-[40px] shrink-0 snap-start rounded-[13px] border px-3 text-[10px] font-black transition duration-200 active:scale-[.98] ${aisle === null ? activeChip : idleChip}`}>All aisles</button>
        {aisles.map(([name, count]) => (
          <button key={name} type="button" onClick={() => setAisle(aisle === name ? null : name)} aria-pressed={aisle === name} className={`min-h-[40px] shrink-0 snap-start rounded-[13px] border px-3 text-[10px] font-black transition duration-200 active:scale-[.98] ${aisle === name ? activeChip : idleChip}`}>{name} · {count}</button>
        ))}
      </div>

      <div className="relative mt-3 flex min-h-[46px] items-center gap-2 rounded-[16px] border border-white/10 bg-black/55 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur-xl transition focus-within:border-cyan-300/35 focus-within:bg-cyan-300/[.035]">
        <span aria-hidden className="text-cyan-200/75">⌕</span>
        <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search a feature, goal or tool…" className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/32" />
        {q && <button type="button" onClick={() => setQ('')} className="grid h-8 w-8 place-items-center rounded-[10px] border border-white/10 bg-white/[.045] text-cyan-200 transition hover:border-cyan-300/25 hover:bg-cyan-300/[.08]" aria-label="Clear search">×</button>}
      </div>

      <div className="relative mt-4 space-y-4">
        {rows.map(([group, items]) => (
          <div key={group}>
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <h3 className="text-[10px] font-black uppercase tracking-[.14em] text-white/72 sm:text-[11px]">{group}</h3>
              <span className="rounded-full border border-white/[.06] bg-white/[.035] px-2 py-0.5 text-[9px] font-black text-emerald-200/85">{items.length}</span>
            </div>
            <div className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-1">
              {items.map((item) => (
                <Link key={item.canonicalId} to={item.canonicalTo} className="group relative min-h-[88px] w-[184px] shrink-0 snap-start overflow-hidden rounded-[17px] border border-white/[.085] bg-[#05090f]/82 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.045)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/24 hover:bg-cyan-300/[.045] hover:shadow-[0_14px_38px_rgba(0,191,99,.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/35 sm:w-[220px]">
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/24 to-transparent" aria-hidden />
                  <div className="line-clamp-2 text-[12px] font-black leading-tight text-white transition group-hover:text-cyan-100">{item.nama}</div>
                  <p className="mt-1 line-clamp-2 text-[10px] font-medium leading-relaxed text-white/46 transition group-hover:text-white/68">{item.apa}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {rows.length === 0 && <div className="relative mt-4 rounded-[16px] border border-dashed border-cyan-300/20 bg-cyan-300/[.035] p-6 text-center text-xs font-semibold text-white/58">No matching capability. Try a broader word or another aisle.</div>}
    </section>
  )
}

export default FeatureBoulevard
