import { useEffect, useMemo, useState } from 'react'
import {
  HRA_LIBRARY,
  HRA_MAPPING_CSV,
  HRA_V2_CROSSWALK_CSV,
  HRA_V2_MODELS_REPOSITORY,
  searchHraEvidence,
  type HraEvidenceRecord,
} from '../../lib/hraRepository'

type Props = {
  title?: string
  terms: string[]
  maxResults?: number
}

function uniqueTerms(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

function sourceHref(record: HraEvidenceRecord) {
  if (record.model?.htmlUrl) return record.model.htmlUrl
  return HRA_V2_MODELS_REPOSITORY
}

export function HraContextBridge({ title = 'Source anatomy matches', terms, maxResults = 10 }: Props) {
  const normalizedTerms = useMemo(() => uniqueTerms(terms).slice(0, 8), [terms])
  const [records, setRecords] = useState<HraEvidenceRecord[]>([])
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')

  useEffect(() => {
    let cancelled = false
    if (!normalizedTerms.length) {
      setRecords([])
      setState('idle')
      return () => { cancelled = true }
    }

    setState('loading')
    Promise.allSettled(normalizedTerms.map((term) => searchHraEvidence(term, 8)))
      .then((results) => {
        if (cancelled) return
        const merged: HraEvidenceRecord[] = []
        const seen = new Set<string>()
        for (const result of results) {
          if (result.status !== 'fulfilled') continue
          for (const record of result.value) {
            const key = `${record.label.toLowerCase()}|${record.ontologyId || record.modelStem}`
            if (seen.has(key)) continue
            seen.add(key)
            merged.push(record)
            if (merged.length >= maxResults) break
          }
          if (merged.length >= maxResults) break
        }
        setRecords(merged)
        setState(merged.length ? 'ready' : 'error')
      })
      .catch(() => {
        if (!cancelled) setState('error')
      })

    return () => { cancelled = true }
  }, [normalizedTerms, maxResults])

  return (
    <section className="rounded-[26px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[.035]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-700 dark:text-cyan-300">HuBMAP Human Reference Atlas</div>
          <h3 className="mt-1 text-[15px] font-black text-neutral-950 dark:text-white">{title}</h3>
          <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">Panacea resolves these terms against the live v1.2 browser-loadable GLB index and the newer v2.0 ASCT+B → 3D crosswalk. Simulation labels stay separate from source anatomy.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <a href={HRA_LIBRARY} target="_blank" rel="noreferrer" className="rounded-full border border-neutral-200 px-2.5 py-1.5 text-[9px] font-black text-neutral-600 dark:border-white/10 dark:text-neutral-300">HRA library ↗</a>
          <a href={HRA_MAPPING_CSV} target="_blank" rel="noreferrer" className="rounded-full border border-neutral-200 px-2.5 py-1.5 text-[9px] font-black text-neutral-600 dark:border-white/10 dark:text-neutral-300">v1.2 map ↗</a>
          <a href={HRA_V2_CROSSWALK_CSV} target="_blank" rel="noreferrer" className="rounded-full border border-neutral-200 px-2.5 py-1.5 text-[9px] font-black text-neutral-600 dark:border-white/10 dark:text-neutral-300">v2 crosswalk ↗</a>
        </div>
      </div>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        {state === 'loading' && Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[112px] w-[220px] shrink-0 animate-pulse rounded-2xl bg-neutral-100 dark:bg-white/[.05]" />
        ))}

        {state === 'ready' && records.map((record) => (
          <a
            key={`${record.release}-${record.label}-${record.ontologyId}-${record.modelStem}`}
            href={sourceHref(record)}
            target="_blank"
            rel="noreferrer"
            className="w-[235px] shrink-0 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 transition hover:-translate-y-0.5 hover:border-cyan-300 dark:border-white/10 dark:bg-white/[.035]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-cyan-50 px-2 py-1 text-[8px] font-black uppercase tracking-wide text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-200">HRA {record.release}</span>
              <span className="text-[8px] font-bold text-neutral-400">source ↗</span>
            </div>
            <div className="mt-2 line-clamp-2 text-[11px] font-black leading-snug text-neutral-950 dark:text-white">{record.label}</div>
            <div className="mt-1 truncate text-[9px] font-semibold text-neutral-500 dark:text-neutral-400">{record.ontologyId || record.nodeName || 'mapped structure'}</div>
            <div className="mt-2 truncate text-[8px] text-neutral-400">{record.model?.name || record.modelStem}</div>
          </a>
        ))}
      </div>

      {state === 'error' && (
        <div className="mt-3 rounded-2xl border border-dashed border-neutral-200 p-3 text-[10px] text-neutral-500 dark:border-white/10 dark:text-neutral-400">No mapped HRA structure was returned for this context. The simulation remains available, but Panacea does not invent an anatomical source match.</div>
      )}
    </section>
  )
}
