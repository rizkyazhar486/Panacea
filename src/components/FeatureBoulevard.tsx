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

  return (
    <section className="rounded-[30px] border border-white/10 bg-white/70 p-4 shadow-[0_18px_60px_rgba(10,20,30,.08)] backdrop-blur-xl dark:bg-white/[.035] sm:p-5" aria-label={title}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-brand">Feature boulevard · mall layout</div>
          <h2 className="mt-1 text-xl font-black tracking-tight text-ink dark:text-white">{title}</h2>
          <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">Every capability gets a visible “store” in a predictable aisle. Swipe an aisle, tap once, or search by goal. New features can scale into the same map without adding another layer of menus.</p>
        </div>
        <span className="rounded-full bg-brand/10 px-3 py-1.5 text-[10px] font-black text-brand">{total} tools visible</span>
      </div>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Feature aisles">
        <button type="button" onClick={() => setAisle(null)} className={`min-h-[40px] shrink-0 rounded-full border px-3 text-[10px] font-black ${aisle === null ? 'border-brand bg-brand text-white' : 'border-neutral-200 bg-white text-neutral-600 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300'}`}>All aisles</button>
        {aisles.map(([name, count]) => (
          <button key={name} type="button" onClick={() => setAisle(aisle === name ? null : name)} className={`min-h-[40px] shrink-0 rounded-full border px-3 text-[10px] font-black ${aisle === name ? 'border-brand bg-brand text-white' : 'border-neutral-200 bg-white text-neutral-600 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300'}`}>{name} · {count}</button>
        ))}
      </div>

      <div className="mt-3 flex min-h-[46px] items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 dark:border-white/10 dark:bg-black/20">
        <span aria-hidden className="text-neutral-400">⌕</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a feature, disease, goal or tool…" className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-neutral-400 dark:text-white" />
        {q && <button type="button" onClick={() => setQ('')} className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-500 dark:bg-white/10" aria-label="Clear search">×</button>}
      </div>

      <div className="mt-4 space-y-4">
        {rows.map(([group, items]) => (
          <div key={group}>
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <h3 className="text-[11px] font-black uppercase tracking-[.12em] text-neutral-600 dark:text-neutral-300">{group}</h3>
              <span className="text-[9px] font-bold text-neutral-400">{items.length}</span>
            </div>
            <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto pb-1">
              {items.map((item) => (
                <Link key={item.to} to={canonical(item.to)} className="group min-h-[84px] w-[190px] shrink-0 snap-start rounded-2xl border border-neutral-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md dark:border-white/10 dark:bg-white/[.04] sm:w-[220px]">
                  <div className="line-clamp-2 text-[12px] font-black leading-tight text-ink group-hover:text-brand dark:text-white">{item.nama}</div>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">{item.apa}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {rows.length === 0 && <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-xs text-neutral-500 dark:border-white/10">No matching feature. Try a broader word or another aisle.</div>}
    </section>
  )
}

export default FeatureBoulevard
