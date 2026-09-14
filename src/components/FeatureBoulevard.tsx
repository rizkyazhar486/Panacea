import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FITUR_DARI_HUB } from '../lib/katalogFitur'

type Zone = 'home' | 'learn' | 'body' | 'services' | 'all'

const LEARN_PATHS = new Set([
  '/body-explorer', '/radiology', '/frontier-health', '/knowledge-bridge', '/electrophysiology', '/genome-lab',
  '/med-study', '/osce-ukmppd', '/evidence', '/drug-info', '/clinical-calculators', '/translator', '/clinical-scores',
])
const SERVICE_PATHS = new Set(['/chatbot', '/emr', '/emergency', '/second-opinion', '/consult', '/hospitals', '/pharmacy', '/orders'])
const HOME_PATHS = new Set(['/community', '/feed', '/clubs', '/keuangan', '/sports-scores', '/messages', '/profile'])

function canonical(to: string): string {
  const learn: Record<string, string> = {
    '/body-explorer': '/learn?t=body',
    '/frontier-health': '/learn?t=discovery',
    '/radiology': '/learn?t=radiology',
    '/electrophysiology': '/learn?t=arrhythmia',
    '/genome-lab': '/learn?t=genome',
    '/knowledge-bridge': '/learn?t=knowledge',
    '/med-study': '/learn?t=library',
    '/evidence': '/learn?t=ask',
    '/drug-info': '/learn?t=drugs',
    '/clinical-calculators': '/learn?t=calculators',
  }
  const body: Record<string, string> = {
    '/body': '/fitness-hub?view=body',
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
    '/community': '/?t=social',
    '/clubs': '/?t=clubs',
    '/keuangan': '/?t=finance',
    '/sports-scores': '/?t=scores',
  }
  return learn[to] ?? body[to] ?? services[to] ?? home[to] ?? to
}

function belongs(zone: Zone, to: string, group: string): boolean {
  if (zone === 'all') return true
  const g = group.toLowerCase()
  if (zone === 'learn') return LEARN_PATHS.has(to) || g.includes('clinical') || g.includes('learn') || g.includes('education')
  if (zone === 'services') return SERVICE_PATHS.has(to) || g.includes('service')
  if (zone === 'home') return HOME_PATHS.has(to) || g.includes('money') || g.includes('social') || g.includes('content') || g.includes('home')
  return !LEARN_PATHS.has(to) && !SERVICE_PATHS.has(to) && !HOME_PATHS.has(to) && (g.includes('fitness') || g.includes('longevity') || g.includes('health') || g.includes('body'))
}

export function FeatureBoulevard({ zone = 'all', title = 'Feature Boulevard' }: { zone?: Zone; title?: string }) {
  const [q, setQ] = useState('')
  const rows = useMemo(() => {
    const seen = new Set<string>()
    const filtered = FITUR_DARI_HUB.filter((f) => {
      if (seen.has(f.to)) return false
      seen.add(f.to)
      if (!belongs(zone, f.to, f.grup)) return false
      const needle = q.trim().toLowerCase()
      if (!needle) return true
      return `${f.nama} ${f.apa} ${f.kw} ${f.grup}`.toLowerCase().includes(needle)
    })
    const grouped = new Map<string, typeof filtered>()
    for (const f of filtered) {
      const list = grouped.get(f.grup) ?? []
      list.push(f)
      grouped.set(f.grup, list)
    }
    return [...grouped.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [q, zone])

  const total = rows.reduce((n, [, items]) => n + items.length, 0)

  return (
    <section className="rounded-[30px] border border-white/10 bg-white/70 p-4 shadow-[0_18px_60px_rgba(10,20,30,.08)] backdrop-blur-xl dark:bg-white/[.035] sm:p-5" aria-label={title}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-brand">One-tap directory</div>
          <h2 className="mt-1 text-xl font-black tracking-tight text-ink dark:text-white">{title}</h2>
          <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">Everything is kept on the surface: swipe an aisle, tap once, or type what you need. No nested “show more” steps.</p>
        </div>
        <span className="rounded-full bg-brand/10 px-3 py-1.5 text-[10px] font-black text-brand">{total} tools visible</span>
      </div>

      <div className="mt-3 flex min-h-[46px] items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 dark:border-white/10 dark:bg-black/20">
        <span aria-hidden className="text-neutral-400">⌕</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a feature or goal…" className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-neutral-400 dark:text-white" />
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

      {rows.length === 0 && <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-xs text-neutral-500 dark:border-white/10">No matching feature. Try a broader word.</div>}
    </section>
  )
}

export default FeatureBoulevard
