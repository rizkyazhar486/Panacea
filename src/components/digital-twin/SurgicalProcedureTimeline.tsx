import { useEffect, useMemo, useState } from 'react'
import {
  ALL_SURGICAL_PROCEDURES,
  SURGICAL_SPECIALTIES,
  getSurgicalCatalogStats,
  searchAllSurgicalProcedures,
  type SurgicalSpecialty,
} from '../../lib/surgicalAtlasCatalog'

function specialtyLabel(value: SurgicalSpecialty) {
  return SURGICAL_SPECIALTIES.find((item) => item.key === value)?.label ?? value
}

export function SurgicalProcedureTimeline() {
  const stats = useMemo(() => getSurgicalCatalogStats(), [])
  const [query, setQuery] = useState('')
  const [specialty, setSpecialty] = useState<'all' | SurgicalSpecialty>('all')
  const filtered = useMemo(() => searchAllSurgicalProcedures(query, specialty), [query, specialty])
  const [selectedId, setSelectedId] = useState(ALL_SURGICAL_PROCEDURES[0]?.id ?? '')
  const procedure = ALL_SURGICAL_PROCEDURES.find((item) => item.id === selectedId) ?? filtered[0] ?? ALL_SURGICAL_PROCEDURES[0]
  const [phaseIndex, setPhaseIndex] = useState(0)
  const phase = procedure?.phases[Math.min(phaseIndex, Math.max(0, procedure.phases.length - 1))]

  useEffect(() => {
    if (!filtered.length) return
    if (!filtered.some((item) => item.id === selectedId)) setSelectedId(filtered[0].id)
  }, [filtered, selectedId])

  useEffect(() => setPhaseIndex(0), [selectedId])

  if (!procedure || !phase) return null

  return (
    <section className="overflow-hidden rounded-[30px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#090d11]">
      <header className="border-b border-neutral-200 p-4 dark:border-white/10 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-amber-700 dark:text-amber-300">Procedure timeline · education layer</div>
            <h3 className="mt-1 text-xl font-black tracking-tight text-neutral-950 dark:text-white">Study the operation without pretending the timeline is anatomy.</h3>
            <p className="mt-1 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">The HRA workbench above is the source-anatomy layer. This module handles procedure selection, phases, objectives, structures at risk, checkpoints and curriculum context. It does not generate incision coordinates, device settings or patient-specific operative instructions.</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-center dark:border-white/10 dark:bg-white/[.025]"><div className="text-base font-black text-neutral-950 dark:text-white">{stats.procedures}</div><div className="text-[8px] font-black uppercase text-neutral-400">operations</div></div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-center dark:border-white/10 dark:bg-white/[.025]"><div className="text-base font-black text-neutral-950 dark:text-white">{stats.specialties}</div><div className="text-[8px] font-black uppercase text-neutral-400">specialties</div></div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-center dark:border-white/10 dark:bg-white/[.025]"><div className="text-base font-black text-neutral-950 dark:text-white">{stats.phases}</div><div className="text-[8px] font-black uppercase text-neutral-400">phases</div></div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 xl:grid-cols-[1fr_auto]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search operation, organ, region, complication or structure at risk…" className="h-11 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 text-xs font-semibold text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-amber-400 dark:border-white/10 dark:bg-white/[.04] dark:text-white" />
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
            {SURGICAL_SPECIALTIES.map((item) => (
              <button key={item.key} onClick={() => setSpecialty(item.key)} className={`shrink-0 rounded-full border px-3 py-2 text-[9px] font-black ${specialty === item.key ? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950' : 'border-neutral-200 text-neutral-500 dark:border-white/10 dark:text-neutral-300'}`}>{item.label}</button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid xl:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="max-h-[650px] overflow-y-auto border-b border-neutral-200 p-3 dark:border-white/10 xl:border-b-0 xl:border-r">
          <div className="mb-2 flex items-center justify-between px-1 text-[8px] font-black uppercase tracking-[.14em] text-neutral-400"><span>Operation library</span><span>{filtered.length}</span></div>
          <div className="space-y-1.5">
            {filtered.map((item) => (
              <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-2xl border p-3 text-left ${item.id === procedure.id ? 'border-amber-300 bg-amber-50 dark:border-amber-300/30 dark:bg-amber-300/10' : 'border-neutral-200 bg-white hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[.02] dark:hover:bg-white/[.05]'}`}>
                <div className="text-[8px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">{specialtyLabel(item.specialty)} · {item.approach}</div>
                <div className="mt-1 text-[11px] font-black text-neutral-950 dark:text-white">{item.name}</div>
                <div className="mt-1 text-[9px] text-neutral-400">{item.region} · {item.phases.length} phases</div>
              </button>
            ))}
          </div>
        </aside>

        <div className="min-w-0 space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.14em] text-neutral-400">Selected operation</div>
              <h4 className="mt-1 text-xl font-black text-neutral-950 dark:text-white">{procedure.name}</h4>
              <p className="mt-1 max-w-4xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">{procedure.summary}</p>
            </div>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[9px] font-black text-neutral-500 dark:border-white/10 dark:bg-white/[.035] dark:text-neutral-300">{procedure.evidenceLevel.replace('-', ' ')}</span>
          </div>

          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {procedure.phases.map((item, index) => (
              <button key={item.id} onClick={() => setPhaseIndex(index)} className={`min-w-[210px] shrink-0 rounded-2xl border p-3 text-left ${index === phaseIndex ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-300/30 dark:bg-emerald-300/10' : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.025]'}`}>
                <div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">Phase {index + 1}</div>
                <div className="mt-1 text-[11px] font-black text-neutral-950 dark:text-white">{item.title}</div>
                <div className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">{item.objective}</div>
              </button>
            ))}
          </div>

          <article className="rounded-[26px] border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/[.025]">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-700 dark:text-emerald-300">{phase.title}</div>
            <div className="mt-2 text-sm font-black text-neutral-950 dark:text-white">Objective</div>
            <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{phase.objective}</p>
            <div className="mt-3 text-sm font-black text-neutral-950 dark:text-white">Orientation narrative</div>
            <p className="mt-1 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">{phase.narration}</p>
          </article>

          <div className="grid gap-3 lg:grid-cols-2">
            <article className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-300/20 dark:bg-rose-300/[.055]">
              <div className="text-[9px] font-black uppercase tracking-[.14em] text-rose-700 dark:text-rose-200">Structures at risk</div>
              <div className="mt-3 flex flex-wrap gap-1.5">{phase.structuresAtRisk.length ? phase.structuresAtRisk.map((item) => <span key={item} className="rounded-full border border-rose-200 bg-white px-2.5 py-1.5 text-[9px] font-bold text-rose-800 dark:border-rose-300/20 dark:bg-white/[.04] dark:text-rose-100">{item}</span>) : <span className="text-[10px] text-neutral-500">No specific risk structure listed in this atlas record.</span>}</div>
            </article>
            <article className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-300/20 dark:bg-cyan-300/[.055]">
              <div className="text-[9px] font-black uppercase tracking-[.14em] text-cyan-700 dark:text-cyan-200">Safety checkpoint</div>
              <p className="mt-3 text-[10px] leading-relaxed text-cyan-900/80 dark:text-cyan-100/75">{phase.checkpoint}</p>
            </article>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <article className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10"><div className="text-[9px] font-black uppercase text-neutral-400">Anatomy focus</div><div className="mt-2 flex flex-wrap gap-1.5">{phase.focusKeywords.map((item) => <span key={item} className="rounded-full bg-neutral-100 px-2 py-1 text-[9px] font-semibold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">{item}</span>)}</div></article>
            <article className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10"><div className="text-[9px] font-black uppercase text-neutral-400">Instrument families</div><div className="mt-2 flex flex-wrap gap-1.5">{phase.instrumentFamilies.map((item) => <span key={item} className="rounded-full bg-neutral-100 px-2 py-1 text-[9px] font-semibold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">{item}</span>)}</div></article>
            <article className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10"><div className="text-[9px] font-black uppercase text-neutral-400">Complication awareness</div><div className="mt-2 flex flex-wrap gap-1.5">{procedure.complications.slice(0, 8).map((item) => <span key={item} className="rounded-full bg-neutral-100 px-2 py-1 text-[9px] font-semibold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">{item}</span>)}</div></article>
          </div>

          <details className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
            <summary className="cursor-pointer text-[10px] font-black text-neutral-700 dark:text-neutral-200">Learning objectives & patient-specific gate</summary>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div>{procedure.learningObjectives.map((item) => <div key={item} className="mb-2 rounded-xl bg-neutral-50 p-3 text-[10px] text-neutral-600 dark:bg-white/[.025] dark:text-neutral-300">• {item}</div>)}</div>
              <div>{procedure.patientSpecificInputs.map((item) => <div key={item} className="mb-2 rounded-xl bg-neutral-50 p-3 text-[10px] text-neutral-600 dark:bg-white/[.025] dark:text-neutral-300">Requires source data: {item}</div>)}</div>
            </div>
          </details>
        </div>
      </div>
    </section>
  )
}
