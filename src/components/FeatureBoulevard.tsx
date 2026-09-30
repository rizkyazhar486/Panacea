import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FITUR_DARI_HUB } from '../lib/katalogFitur'

type Zone = 'home' | 'learn' | 'body' | 'services' | 'all'

type Placement = { zone: Exclude<Zone, 'all'>; aisle: string }

const LEARN_PATHS = new Set([
  '/body-explorer', '/radiology', '/frontier-health', '/knowledge-bridge', '/electrophysiology', '/genome-lab',
  '/med-study', '/osce-ukmppd', '/evidence', '/drug-info', '/clinical-calculators', '/translator', '/clinical-scores',
])
const SERVICE_PATHS = new Set(['/chatbot', '/emr', '/emergency', '/second-opinion', '/consult', '/hospitals', '/pharmacy', '/orders'])
const HOME_PATHS = new Set([
  '/community', '/feed', '/clubs', '/keuangan', '/markets', '/sports-scores', '/messages', '/profile',
  '/scripture', '/hadith', '/prayer-times', '/prophet-stories', '/education',
])

function canonical(to: string): string {
  const learn: Record<string, string> = {
    '/body-explorer': '/learn?t=body',
    '/frontier-health': '/learn?t=discovery',
    '/radiology': '/learn?t=radiology',
    '/electrophysiology': '/learn?t=arrhythmia',
    '/genome-lab': '/learn?t=genome',
    '/knowledge-bridge': '/learn?t=knowledge',
    '/med-study': '/learn?t=library',
    '/osce-ukmppd': '/learn?t=curriculum',
    '/evidence': '/learn?t=ask',
    '/drug-info': '/learn?t=drugs',
    '/clinical-calculators': '/learn?t=calculators',
  }
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
  const services: Record<string, string> = {
    '/chatbot': '/clinical-hub?t=assistant',
    '/emr': '/clinical-hub?t=records',
    '/emergency': '/clinical-hub?t=emergency',
  }
  const home: Record<string, string> = {
    '/feed': '/?t=social',
    '/community': '/?t=community',
    '/clubs': '/?t=clubs',
    '/keuangan': '/?t=finance',
    '/markets': '/?t=markets',
    '/sports-scores': '/?t=scores',
    '/scripture': '/?t=religion&faith=scripture',
    '/hadith': '/?t=religion&faith=hadith',
    '/prayer-times': '/?t=religion&faith=prayer',
    '/prophet-stories': '/?t=religion&faith=stories',
    '/education': '/?t=learn',
  }
  return learn[to] ?? body[to] ?? services[to] ?? home[to] ?? to
}

function place(to: string, group: string, name: string, keywords: string): Placement {
  const text = `${group} ${name} ${keywords}`.toLowerCase()

  if (SERVICE_PATHS.has(to) || /emr|emergency|hospital|consult|pharmacy|care|service|second opinion/.test(text)) {
    if (/emergency|first aid|sos/.test(text)) return { zone: 'services', aisle: 'Emergency & First Aid' }
    if (/emr|record|clinical data|patient/.test(text)) return { zone: 'services', aisle: 'Medical Records & Care' }
    if (/hospital|consult|pharmacy|order|provider/.test(text)) return { zone: 'services', aisle: 'Care, Providers & Pharmacy' }
    return { zone: 'services', aisle: 'AI Help & Services' }
  }

  if (HOME_PATHS.has(to) || /social|community|content|money|finance|market|stock|score|club|religion|faith|prayer|hadith|scripture/.test(text)) {
    if (/religion|faith|prayer|hadith|scripture|prophet/.test(text) || ['/scripture', '/hadith', '/prayer-times', '/prophet-stories'].includes(to)) return { zone: 'home', aisle: 'Religion & Reflection' }
    if (/market|stock|crypto|forex|commodity/.test(text)) return { zone: 'home', aisle: 'Markets & Investing' }
    if (/money|finance|fund|wallet|budget/.test(text)) return { zone: 'home', aisle: 'Finance & Emergency Fund' }
    if (/score|league|match|sport score/.test(text) || to === '/sports-scores') return { zone: 'home', aisle: 'Scores & Sports' }
    if (/club|challenge|group/.test(text) || to === '/clubs') return { zone: 'home', aisle: 'Clubs & Challenges' }
    if (/learn|read|article|education/.test(text) || to === '/education') return { zone: 'home', aisle: 'Read & Learn' }
    return { zone: 'home', aisle: 'Social & Community' }
  }

  if (LEARN_PATHS.has(to) || /clinical|learn|education|medical|disease|drug|anatom|radiolog|genome|evidence|research|exam|osce|calculator/.test(text)) {
    if (/radiolog|imaging|ct |mri|pet|x-ray|ultrasound/.test(text) || to === '/radiology') return { zone: 'learn', aisle: 'Imaging & Diagnostics' }
    if (/drug|herbal|pharma|medication/.test(text) || to === '/drug-info') return { zone: 'learn', aisle: 'Drugs & Therapeutics' }
    if (/genome|gene|dna|rna|molecular|cell/.test(text) || to === '/genome-lab') return { zone: 'learn', aisle: 'Genome, Cell & Molecular' }
    if (/evidence|research|trial|discovery|innovation|invention/.test(text)) return { zone: 'learn', aisle: 'Evidence, Discovery & Research' }
    if (/exam|osce|question|curriculum|study/.test(text)) return { zone: 'learn', aisle: 'Cases, Exams & Curriculum' }
    if (/calculator|score|risk/.test(text)) return { zone: 'learn', aisle: 'Clinical Calculators & Scores' }
    if (/body|anatom|physiology|biomechan|arrhythm|ecg/.test(text)) return { zone: 'learn', aisle: 'Visual Anatomy & Simulation' }
    return { zone: 'learn', aisle: 'Medical Library & Knowledge' }
  }

  if (/sleep|recovery|readiness/.test(text)) return { zone: 'body', aisle: 'Sleep & Recovery' }
  if (/nutrition|food|hydration|macro|diet|caffeine|fasting/.test(text)) return { zone: 'body', aisle: 'Nutrition & Metabolism' }
  if (/longevity|aging|age|prevention|wellness/.test(text)) return { zone: 'body', aisle: 'Longevity & Prevention' }
  if (/data|lab|wearable|device|heart rate|hrv|spo2|vital/.test(text)) return { zone: 'body', aisle: 'Health Data, Labs & Wearables' }
  if (/body|shape|composition|posture|skin|aesthetic/.test(text)) return { zone: 'body', aisle: 'Personal Body & Character' }
  return { zone: 'body', aisle: 'Training, Movement & Performance' }
}

export function FeatureBoulevard({ zone = 'all', title = 'Feature Boulevard' }: { zone?: Zone; title?: string }) {
  const [q, setQ] = useState('')
  const [aisle, setAisle] = useState<string | null>(null)

  const placed = useMemo(() => {
    const seen = new Set<string>()
    return FITUR_DARI_HUB.flatMap((f) => {
      if (seen.has(f.to)) return []
      seen.add(f.to)
      const placement = place(f.to, f.grup, f.nama, `${f.apa} ${f.kw}`)
      if (zone !== 'all' && placement.zone !== zone) return []
      return [{ ...f, ...placement }]
    })
  }, [zone])

  const aisles = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of placed) counts.set(item.aisle, (counts.get(item.aisle) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [placed])

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const filtered = placed.filter((f) => {
      if (aisle && f.aisle !== aisle) return false
      if (!needle) return true
      return `${f.nama} ${f.apa} ${f.kw} ${f.grup} ${f.aisle}`.toLowerCase().includes(needle)
    })
    const grouped = new Map<string, typeof filtered>()
    for (const f of filtered) {
      const list = grouped.get(f.aisle) ?? []
      list.push(f)
      grouped.set(f.aisle, list)
    }
    return [...grouped.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [q, aisle, placed])

  const total = rows.reduce((n, [, items]) => n + items.length, 0)
  const idleChip = 'border-white/10 bg-black/45 text-white/70 hover:border-cyan-300/25 hover:bg-cyan-300/[.06] hover:text-white'
  const activeChip = 'border-cyan-200/60 bg-gradient-to-r from-emerald-300 via-cyan-300 to-violet-300 text-[#020509] shadow-[0_8px_24px_rgba(34,211,238,.14)]'

  return (
    <section
      className="dark relative isolate overflow-hidden rounded-[26px] border border-white/10 bg-[#020509]/95 p-3 text-white shadow-[0_24px_80px_rgba(0,0,0,.44)] backdrop-blur-2xl sm:rounded-[30px] sm:p-5"
      aria-label={title}
    >
      <div className="pointer-events-none absolute -right-20 -top-24 h-60 w-60 rounded-full bg-emerald-400/[.10] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-24 bottom-[-7rem] h-64 w-64 rounded-full bg-violet-500/[.10] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute left-1/3 top-[-9rem] h-56 w-56 rounded-full bg-cyan-400/[.07] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" aria-hidden />

      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-200/90 sm:text-[10px]">Feature boulevard · direct access</div>
          <h2 className="mt-1 text-lg font-black tracking-tight text-white sm:text-xl">{title}</h2>
          <p className="mt-1 max-w-3xl text-[10px] font-medium leading-relaxed text-white/58 sm:text-[11px]">
            Search or swipe through capabilities without adding another menu layer. Every tool stays in a predictable workspace.
          </p>
        </div>
        <span className="rounded-full border border-emerald-300/25 bg-emerald-300/[.08] px-3 py-1.5 text-[9px] font-black text-emerald-200 sm:text-[10px]">{total} tools</span>
      </div>

      <div className="no-scrollbar relative mt-3 flex snap-x snap-mandatory gap-1.5 overflow-x-auto overscroll-x-contain pb-1 sm:gap-2" aria-label="Feature aisles">
        <button
          type="button"
          onClick={() => setAisle(null)}
          aria-pressed={aisle === null}
          className={`min-h-[40px] shrink-0 snap-start rounded-[13px] border px-3 text-[10px] font-black transition duration-200 active:scale-[.98] ${aisle === null ? activeChip : idleChip}`}
        >
          All aisles
        </button>
        {aisles.map(([name, count]) => (
          <button
            key={name}
            type="button"
            onClick={() => setAisle(aisle === name ? null : name)}
            aria-pressed={aisle === name}
            className={`min-h-[40px] shrink-0 snap-start rounded-[13px] border px-3 text-[10px] font-black transition duration-200 active:scale-[.98] ${aisle === name ? activeChip : idleChip}`}
          >
            {name} · {count}
          </button>
        ))}
      </div>

      <div className="relative mt-3 flex min-h-[46px] items-center gap-2 rounded-[16px] border border-white/10 bg-black/55 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur-xl transition focus-within:border-cyan-300/35 focus-within:bg-cyan-300/[.035]">
        <span aria-hidden className="text-cyan-200/75">⌕</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a feature, disease, goal or tool…"
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/32"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ('')}
            className="grid h-8 w-8 place-items-center rounded-[10px] border border-white/10 bg-white/[.045] text-cyan-200 transition hover:border-cyan-300/25 hover:bg-cyan-300/[.08]"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
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
                <Link
                  key={item.to}
                  to={canonical(item.to)}
                  className="group relative min-h-[88px] w-[184px] shrink-0 snap-start overflow-hidden rounded-[17px] border border-white/[.085] bg-[#05090f]/82 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.045)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/24 hover:bg-cyan-300/[.045] hover:shadow-[0_14px_38px_rgba(0,191,99,.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/35 sm:w-[220px]"
                >
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/24 to-transparent" aria-hidden />
                  <div className="line-clamp-2 text-[12px] font-black leading-tight text-white transition group-hover:text-cyan-100">{item.nama}</div>
                  <p className="mt-1 line-clamp-2 text-[10px] font-medium leading-relaxed text-white/46 transition group-hover:text-white/68">{item.apa}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {rows.length === 0 && (
        <div className="relative mt-4 rounded-[16px] border border-dashed border-cyan-300/20 bg-cyan-300/[.035] p-6 text-center text-xs font-semibold text-white/58">
          No matching feature. Try a broader word or another aisle.
        </div>
      )}
    </section>
  )
}

export default FeatureBoulevard
