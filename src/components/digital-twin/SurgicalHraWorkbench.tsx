import { useEffect, useMemo, useState } from 'react'
import { HraContextBridge } from './HraContextBridge'
import {
  ALL_SURGICAL_PROCEDURES,
  SURGICAL_SPECIALTIES,
  getSurgicalHraTerms,
  searchAllSurgicalProcedures,
  type SurgicalSpecialty,
} from '../../lib/surgicalAtlasCatalog'

function specialtyLabel(value: SurgicalSpecialty) {
  return SURGICAL_SPECIALTIES.find((item) => item.key === value)?.label ?? value
}

export function SurgicalHraWorkbench() {
  const [query, setQuery] = useState('')
  const [specialty, setSpecialty] = useState<'all' | SurgicalSpecialty>('all')
  const filtered = useMemo(() => searchAllSurgicalProcedures(query, specialty), [query, specialty])
  const [selectedId, setSelectedId] = useState(ALL_SURGICAL_PROCEDURES[0]?.id ?? '')
  const procedure = ALL_SURGICAL_PROCEDURES.find((item) => item.id === selectedId) ?? filtered[0] ?? ALL_SURGICAL_PROCEDURES[0]
  const [phaseIndex, setPhaseIndex] = useState(0)
  const phase = procedure?.phases[Math.min(phaseIndex, Math.max(0, procedure.phases.length - 1))]
  const terms = useMemo(() => procedure ? getSurgicalHraTerms(procedure, phaseIndex, 14) : [], [procedure, phaseIndex])

  useEffect(() => {
    if (!filtered.length) return
    if (!filtered.some((item) => item.id === selectedId)) setSelectedId(filtered[0].id)
  }, [filtered, selectedId])

  useEffect(() => {
    setPhaseIndex(0)
  }, [selectedId])

  if (!procedure || !phase) return null

  return (
    <section className="overflow-hidden rounded-[30px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0e12]">
      <header className="border-b border-neutral-200 p-4 dark:border-white/10 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-700 dark:text-cyan-300">Surgical source anatomy</div>
            <h2 className="mt-1 text-xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-2xl">Operation → phase → HRA structures</h2>
            <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">Select an operation and phase. Panacea derives anatomy terms from the procedure record and resolves them against HuBMAP HRA releases instead of drawing an unverified operative scene.</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-right dark:border-white/10 dark:bg-white/[.035]">
            <div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">Current source context</div>
            <div className="mt-1 text-[11px] font-black text-neutral-950 dark:text-white">{specialtyLabel(procedure.specialty)} · {procedure.region}</div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 xl:grid-cols-[1fr_auto]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search operation, organ, region or risk structure…"
            className="h-11 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 text-xs font-semibold text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-cyan-400 dark:border-white/10 dark:bg-white/[.04] dark:text-white"
          />
          <div className="no-scrollbar flex max-w-full gap-1.5 overflow-x-auto pb-1">
            {SURGICAL_SPECIALTIES.map((item) => (
              <button
                key={item.key}
                onClick={() => setSpecialty(item.key)}
                className={`shrink-0 rounded-full border px-3 py-2 text-[9px] font-black ${specialty === item.key ? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950' : 'border-neutral-200 text-neutral-500 dark:border-white/10 dark:text-neutral-300'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid xl:grid-cols-[300px_1fr]">
        <aside className="max-h-[560px] overflow-y-auto border-b border-neutral-200 p-3 dark:border-white/10 xl:border-b-0 xl:border-r">
          <div className="mb-2 flex items-center justify-between px-1 text-[8px] font-black uppercase tracking-[.16em] text-neutral-400">
            <span>Procedures</span><span>{filtered.length}</span>
          </div>
          <div className="space-y-1.5">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-2xl border p-3 text-left transition ${item.id === procedure.id ? 'border-cyan-300 bg-cyan-50 dark:border-cyan-300/30 dark:bg-cyan-300/10' : 'border-neutral-200 bg-white hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[.02] dark:hover:bg-white/[.05]'}`}
              >
                <div className="text-[8px] font-black uppercase tracking-wide text-cyan-700 dark:text-cyan-300">{specialtyLabel(item.specialty)}</div>
                <div className="mt-1 text-[11px] font-black text-neutral-950 dark:text-white">{item.name}</div>
                <div className="mt-1 text-[9px] text-neutral-400">{item.region} · {item.phases.length} phases</div>
              </button>
            ))}
          </div>
        </aside>

        <div className="min-w-0 space-y-4 p-4 sm:p-5">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-neutral-400">Selected operation</div>
            <div className="mt-1 text-lg font-black text-neutral-950 dark:text-white">{procedure.name}</div>
            <p className="mt-1 max-w-4xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">{procedure.summary}</p>
          </div>

          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {procedure.phases.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setPhaseIndex(index)}
                className={`min-w-[185px] shrink-0 rounded-2xl border p-3 text-left ${index === phaseIndex ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-300/30 dark:bg-emerald-300/10' : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.025]'}`}
              >
                <div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">Phase {index + 1}</div>
                <div className="mt-1 text-[11px] font-black text-neutral-950 dark:text-white">{item.title}</div>
                <div className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">{item.objective}</div>
              </button>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_.9fr]">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]">
              <div className="text-[8px] font-black uppercase tracking-[.14em] text-neutral-400">Source query terms</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {terms.map((term) => <span key={term} className="rounded-full border border-neutral-200 bg-white px-2.5 py-1.5 text-[9px] font-bold text-neutral-600 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300">{term}</span>)}
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]">
              <div className="text-[8px] font-black uppercase tracking-[.14em] text-neutral-400">Structures at risk · phase</div>
              <div className="mt-2 space-y-1.5">
                {phase.structuresAtRisk.slice(0, 6).map((item) => <div key={item} className="text-[10px] font-semibold text-neutral-700 dark:text-neutral-300">• {item}</div>)}
              </div>
            </div>
          </div>

          <HraContextBridge title={`${procedure.name} · ${phase.title}`} terms={terms} maxResults={12} />
        </div>
      </div>
    </section>
  )
}
