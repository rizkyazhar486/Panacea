import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LIFE_READING_LIBRARY, WEALTH_PILLARS, type WealthPillar } from '../lib/lifeLearning'

type Filter = WealthPillar | 'all'

const SAVED_KEY = 'pmd_life_library_saved_v1'
const READ_KEY = 'pmd_life_library_read_v1'

function loadSet(key: string) {
  try { return new Set<string>(JSON.parse(localStorage.getItem(key) || '[]')) } catch { return new Set<string>() }
}
function persistSet(key: string, value: Set<string>) {
  try { localStorage.setItem(key, JSON.stringify([...value])) } catch { /* storage unavailable */ }
}

export function LifeLibraryWorkbench() {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [savedOnly, setSavedOnly] = useState(false)
  const [saved, setSaved] = useState<Set<string>>(() => loadSet(SAVED_KEY))
  const [read, setRead] = useState<Set<string>>(() => loadSet(READ_KEY))
  const [open, setOpen] = useState<string | null>(null)

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    return LIFE_READING_LIBRARY.filter((item) => {
      if (filter !== 'all' && item.pillar !== filter) return false
      if (savedOnly && !saved.has(item.id)) return false
      if (!q) return true
      return `${item.title} ${item.summary} ${item.source} ${item.body.join(' ')} ${item.pillar}`.toLowerCase().includes(q)
    })
  }, [filter, query, savedOnly, saved])

  function toggleSaved(id: string) {
    setSaved((previous) => {
      const next = new Set(previous)
      next.has(id) ? next.delete(id) : next.add(id)
      persistSet(SAVED_KEY, next)
      return next
    })
  }
  function toggleRead(id: string) {
    setRead((previous) => {
      const next = new Set(previous)
      next.has(id) ? next.delete(id) : next.add(id)
      persistSet(READ_KEY, next)
      return next
    })
  }

  const completion = LIFE_READING_LIBRARY.length ? Math.round((read.size / LIFE_READING_LIBRARY.length) * 100) : 0

  return (
    <section className="mx-auto max-w-5xl overflow-hidden rounded-[30px] border border-neutral-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,.07)] dark:border-white/10 dark:bg-[#0d1117]">
      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-700 dark:text-emerald-300">Seven forms of wealth · reading workspace</div>
            <h2 className="mt-1 text-2xl font-black tracking-[-.035em] text-neutral-950 dark:text-white">Read less randomly. Convert reading into a decision or action.</h2>
            <p className="mt-2 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">21 original Panacea reading briefs across time, health, finance, knowledge, social life, family and career. Save what matters, mark what you have finished, then use the reflection and action prompt.</p>
          </div>
          <div className="min-w-[126px] rounded-2xl bg-neutral-950 p-3 text-white dark:bg-white dark:text-neutral-950">
            <div className="text-[9px] font-black uppercase tracking-wide opacity-55">Library progress</div>
            <div className="mt-1 text-2xl font-black tabular-nums">{completion}%</div>
            <div className="text-[9px] font-semibold opacity-55">{read.size}/{LIFE_READING_LIBRARY.length} read</div>
          </div>
        </div>

        <div className="no-scrollbar -mx-1 mt-4 flex snap-x gap-2 overflow-x-auto px-1 pb-2">
          <button type="button" onClick={() => setFilter('all')} className={`shrink-0 snap-start rounded-full border px-3 py-2 text-[10px] font-black ${filter === 'all' ? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950' : 'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300'}`}>All · {LIFE_READING_LIBRARY.length}</button>
          {WEALTH_PILLARS.map((pillar) => (
            <button key={pillar.id} type="button" onClick={() => setFilter(pillar.id)} className={`shrink-0 snap-start rounded-full border px-3 py-2 text-[10px] font-black ${filter === pillar.id ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300'}`}>{pillar.emoji} {pillar.label}</button>
          ))}
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search: sleep, money, recall, family, career…" className="min-h-11 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 text-[12px] font-semibold text-neutral-900 outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-white/[.04] dark:text-white" />
          <button type="button" aria-pressed={savedOnly} onClick={() => setSavedOnly((value) => !value)} className={`min-h-11 rounded-2xl px-4 text-[10px] font-black ${savedOnly ? 'bg-amber-200 text-amber-950' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>★ Saved only</button>
        </div>
      </div>

      <div className="border-t border-neutral-100 p-3 dark:border-white/10 sm:p-4">
        {items.length === 0 && <div className="rounded-2xl bg-neutral-50 p-6 text-center text-xs text-neutral-500 dark:bg-white/[.04]">No reading matched this filter.</div>}
        <div className="grid gap-2 md:grid-cols-2">
          {items.map((item) => {
            const pillar = WEALTH_PILLARS.find((entry) => entry.id === item.pillar)
            const isOpen = open === item.id
            return (
              <article key={item.id} className={`rounded-[24px] border p-4 transition ${read.has(item.id) ? 'border-emerald-300/70 bg-emerald-50/40 dark:border-emerald-400/20 dark:bg-emerald-400/[.06]' : 'border-neutral-200 bg-white dark:border-white/10 dark:bg-white/[.025]'}`}>
                <div className="flex items-start justify-between gap-3">
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setOpen(isOpen ? null : item.id)} aria-expanded={isOpen}>
                    <div className="text-[9px] font-black uppercase tracking-[.13em] text-neutral-400">{pillar?.emoji} {pillar?.label} · {item.minutes} min · {item.level}</div>
                    <h3 className="mt-1 text-[15px] font-black leading-tight text-neutral-950 dark:text-white">{item.title}</h3>
                    <p className="mt-2 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{item.summary}</p>
                  </button>
                  <button type="button" onClick={() => toggleSaved(item.id)} aria-label={saved.has(item.id) ? 'Remove bookmark' : 'Save reading'} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm ${saved.has(item.id) ? 'bg-amber-200 text-amber-900' : 'bg-neutral-100 text-neutral-400 dark:bg-white/10'}`}>★</button>
                </div>

                {isOpen && (
                  <div className="mt-4 space-y-3 border-t border-neutral-100 pt-4 dark:border-white/10">
                    <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">{item.source}</div>
                    {item.body.map((paragraph, index) => <p key={index} className="text-[12px] leading-[1.75] text-neutral-700 dark:text-neutral-200">{paragraph}</p>)}
                    <div className="rounded-2xl bg-sky-50 p-3 dark:bg-sky-400/10"><div className="text-[9px] font-black uppercase tracking-wide text-sky-700 dark:text-sky-300">Reflect</div><p className="mt-1 text-[11px] leading-relaxed text-neutral-700 dark:text-neutral-200">{item.reflection}</p></div>
                    <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-400/10"><div className="text-[9px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Do one thing</div><p className="mt-1 text-[11px] font-semibold text-neutral-800 dark:text-neutral-100">{item.action}</p></div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => toggleRead(item.id)} className={`rounded-full px-3 py-2 text-[10px] font-black ${read.has(item.id) ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200' : 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950'}`}>{read.has(item.id) ? '✓ Read' : 'Mark as read'}</button>
                      {item.routes.map((route) => <Link key={route} to={route} className="rounded-full bg-neutral-100 px-3 py-2 text-[10px] font-black text-neutral-700 dark:bg-white/10 dark:text-neutral-200">Open related tool →</Link>)}
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default LifeLibraryWorkbench
