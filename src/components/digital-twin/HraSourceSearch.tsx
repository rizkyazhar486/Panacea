import { FormEvent, useState } from 'react'
import { resolveHraQuery, type HraResolvedRecord } from '../../lib/hraResolver'

export function HraSourceSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<HraResolvedRecord[]>([])
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    const clean = query.trim()
    if (!clean) return
    setState('loading')
    setError('')
    try {
      const next = await resolveHraQuery(clean, 30)
      setResults(next)
      setState(next.length ? 'ready' : 'error')
      if (!next.length) setError('No HRA structure matched this query.')
    } catch (reason) {
      setResults([])
      setState('error')
      setError(reason instanceof Error ? reason.message : 'HRA search failed.')
    }
  }

  return (
    <section className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[.035] sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-700 dark:text-cyan-300">HRA source search</div>
          <h3 className="mt-1 text-lg font-black text-neutral-950 dark:text-white">Search anatomy across HRA releases</h3>
          <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">Search labels such as meniscus, mitral valve, retina, pancreas, trachea, femur or kidney cortex. Results distinguish actual browser-loadable GLB geometry from mapping-only records.</p>
        </div>
        <div className="text-[9px] font-bold text-neutral-400">v1.2 geometry · v1.4 geometry/crosswalk · v2 mapping</div>
      </div>

      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search anatomical structure or ontology ID…"
          className="h-11 min-w-0 flex-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 text-xs font-semibold text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-cyan-400 dark:border-white/10 dark:bg-white/[.04] dark:text-white"
        />
        <button type="submit" disabled={state === 'loading'} className="h-11 shrink-0 rounded-2xl bg-neutral-950 px-4 text-[10px] font-black text-white disabled:opacity-50 dark:bg-white dark:text-neutral-950">
          {state === 'loading' ? 'Searching…' : 'Search HRA'}
        </button>
      </form>

      {state === 'ready' && (
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {results.map((record) => (
            <a key={`${record.release}-${record.label}-${record.ontologyId}-${record.modelStem}`} href={record.sourceUrl} target="_blank" rel="noreferrer" className="w-[250px] shrink-0 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 hover:border-cyan-300 dark:border-white/10 dark:bg-white/[.025]">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-cyan-50 px-2 py-1 text-[8px] font-black text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-200">HRA {record.release}</span>
                <span className={`rounded-full px-2 py-1 text-[8px] font-black ${record.renderable ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200' : 'bg-neutral-100 text-neutral-500 dark:bg-white/10 dark:text-neutral-300'}`}>{record.renderable ? '3D available' : 'mapping only'}</span>
              </div>
              <div className="mt-2 line-clamp-2 text-[11px] font-black text-neutral-950 dark:text-white">{record.label}</div>
              <div className="mt-1 truncate text-[9px] text-neutral-500 dark:text-neutral-400">{record.ontologyId || record.nodeName}</div>
              <div className="mt-2 truncate text-[8px] text-neutral-400">{record.model?.name || record.modelStem}</div>
            </a>
          ))}
        </div>
      )}

      {state === 'error' && <div className="mt-3 rounded-2xl border border-dashed border-neutral-200 p-3 text-[10px] text-neutral-500 dark:border-white/10 dark:text-neutral-400">{error}</div>}
    </section>
  )
}
