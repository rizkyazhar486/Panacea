import { useMemo, useState } from 'react'
import { IconActivity, IconBook, IconCheck, IconHeart, IconShield, IconSparkle } from '../icons'
import {
  ALL_SURGICAL_PROCEDURES,
  SURGICAL_SPECIALTIES,
  type SurgicalProcedure,
  type SurgicalSpecialty,
} from '../../lib/surgicalAtlasCatalog'
import {
  buildSurgicalCoverage,
  compareSurgicalProcedures,
  getSurgicalRecallPrompt,
  phaseCoverageKey,
  pickCoverageNext,
} from '../../lib/surgicalCurriculum'

const STORAGE_KEY = 'pmd_surgical_rehearsal_coverage_v1'

function readReviewed(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function specialtyLabel(value: SurgicalSpecialty) {
  return SURGICAL_SPECIALTIES.find((item) => item.key === value)?.label ?? value
}

function ProcedureSelect({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return (
    <label className="block">
      <span className="text-[9px] font-black uppercase tracking-[.15em] text-white/30">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-[#07111a] px-3 text-xs font-bold text-white outline-none focus:border-emerald-300/30">
        {ALL_SURGICAL_PROCEDURES.map((procedure) => <option key={procedure.id} value={procedure.id}>{procedure.name}</option>)}
      </select>
    </label>
  )
}

function ChipList({ items, empty = 'None shared in the current atlas records.' }: { items: string[]; empty?: string }) {
  if (!items.length) return <p className="text-[10px] leading-relaxed text-white/28">{empty}</p>
  return <div className="flex flex-wrap gap-1.5">{items.map((item) => <span key={item} className="rounded-full border border-white/10 bg-black/15 px-2.5 py-1 text-[9px] text-white/55">{item}</span>)}</div>
}

export function SurgicalRehearsalLab() {
  const [reviewed, setReviewed] = useState<string[]>(readReviewed)
  const [specialty, setSpecialty] = useState<'all' | SurgicalSpecialty>('all')
  const filtered = useMemo(() => specialty === 'all' ? ALL_SURGICAL_PROCEDURES : ALL_SURGICAL_PROCEDURES.filter((procedure) => procedure.specialty === specialty), [specialty])
  const [procedureId, setProcedureId] = useState(ALL_SURGICAL_PROCEDURES[0]?.id ?? '')
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [leftId, setLeftId] = useState(ALL_SURGICAL_PROCEDURES[0]?.id ?? '')
  const [rightId, setRightId] = useState(ALL_SURGICAL_PROCEDURES[1]?.id ?? ALL_SURGICAL_PROCEDURES[0]?.id ?? '')

  const procedure = ALL_SURGICAL_PROCEDURES.find((item) => item.id === procedureId) ?? filtered[0] ?? ALL_SURGICAL_PROCEDURES[0]
  const recall = procedure ? getSurgicalRecallPrompt(procedure, phaseIndex) : null
  const currentPhase = procedure?.phases[Math.min(phaseIndex, procedure.phases.length - 1)]
  const currentKey = procedure && currentPhase ? phaseCoverageKey(procedure.id, currentPhase.id) : ''
  const coverage = useMemo(() => buildSurgicalCoverage(reviewed), [reviewed])
  const left = ALL_SURGICAL_PROCEDURES.find((item) => item.id === leftId) ?? ALL_SURGICAL_PROCEDURES[0]
  const right = ALL_SURGICAL_PROCEDURES.find((item) => item.id === rightId) ?? ALL_SURGICAL_PROCEDURES[1] ?? ALL_SURGICAL_PROCEDURES[0]
  const comparison = left && right ? compareSurgicalProcedures(left, right) : null

  function persist(next: string[]) {
    setReviewed(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* local persistence is optional */ }
  }

  function markReviewed() {
    if (!currentKey) return
    persist(reviewed.includes(currentKey) ? reviewed : [...reviewed, currentKey])
  }

  function jumpToNextCoverage() {
    const next = pickCoverageNext(reviewed, specialty === 'all' ? undefined : specialty)
    if (!next) return
    setProcedureId(next.procedure.id)
    setPhaseIndex(next.procedure.phases.findIndex((phase) => phase.id === next.phase.id))
    setRevealed(false)
  }

  function chooseProcedure(id: string) {
    setProcedureId(id)
    setPhaseIndex(0)
    setRevealed(false)
  }

  if (!procedure || !currentPhase || !recall || !left || !right || !comparison) return null

  const pct = coverage.totalPhases ? Math.round((coverage.reviewedPhases / coverage.totalPhases) * 100) : 0

  return (
    <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[#030914] text-white shadow-[0_34px_110px_rgba(0,0,0,.30)]">
      <header className="border-b border-white/8 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-[#f0d68a]"><IconBook size={14} /> Panacea Surgical Rehearsal</div>
            <h2 className="mt-2 text-2xl font-black tracking-[-.045em] sm:text-4xl">Turn the atlas into active recall, not passive watching.</h2>
            <p className="mt-2 text-xs leading-relaxed text-white/48 sm:text-sm">Review anatomy, predict structures at risk before revealing them, and compare operations side by side. Progress below means atlas coverage only—it is not a credential, operative competence assessment, or authorization to perform surgery.</p>
          </div>
          <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[.055] px-4 py-3 text-right">
            <div className="text-[9px] font-black uppercase tracking-wide text-emerald-300">Atlas coverage</div>
            <div className="mt-1 text-2xl font-black">{coverage.reviewedPhases}/{coverage.totalPhases}</div>
            <div className="text-[9px] text-white/30">reviewed phases · {pct}%</div>
          </div>
        </div>
      </header>

      <div className="grid xl:grid-cols-[1.05fr_.95fr]">
        <div className="border-b border-white/8 p-5 sm:p-6 xl:border-b-0 xl:border-r">
          <div className="flex flex-wrap gap-2">
            {SURGICAL_SPECIALTIES.map((item) => (
              <button key={item.key} onClick={() => { setSpecialty(item.key); const first = item.key === 'all' ? ALL_SURGICAL_PROCEDURES[0] : ALL_SURGICAL_PROCEDURES.find((procedure) => procedure.specialty === item.key); if (first) chooseProcedure(first.id) }} className={`rounded-full border px-3 py-2 text-[9px] font-black ${specialty === item.key ? 'border-[#f0d68a]/35 bg-[#f0d68a] text-[#171106]' : 'border-white/10 text-white/45'}`}>{item.label}</button>
            ))}
          </div>

          <label className="mt-4 block">
            <span className="text-[9px] font-black uppercase tracking-[.15em] text-white/30">Rehearse operation</span>
            <select value={procedure.id} onChange={(event) => chooseProcedure(event.target.value)} className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-[#07111a] px-3 text-xs font-bold text-white outline-none">
              {filtered.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>

          <div className="mt-4 rounded-[26px] border border-white/8 bg-white/[.025] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[.15em] text-emerald-300">Phase {phaseIndex + 1}/{procedure.phases.length}</div>
                <div className="mt-1 text-lg font-black">{currentPhase.title}</div>
              </div>
              {reviewed.includes(currentKey) && <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/15 bg-emerald-300/[.06] px-2.5 py-1 text-[8px] font-black uppercase text-emerald-300"><IconCheck size={11} /> reviewed</span>}
            </div>

            <div className="mt-4 rounded-2xl border border-[#f0d68a]/12 bg-[#f0d68a]/[.04] p-4">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-[#f0d68a]"><IconSparkle size={13} /> Active recall</div>
              <div className="mt-2 text-sm font-black">{recall.title}</div>
              <p className="mt-1 text-xs leading-relaxed text-white/48">{recall.prompt}</p>
              {!revealed ? (
                <button onClick={() => setRevealed(true)} className="mt-4 rounded-full bg-[#f0d68a] px-4 py-2.5 text-[9px] font-black text-[#171106]">Reveal risk map</button>
              ) : (
                <div className="mt-4">
                  <ChipList items={recall.answer} />
                  <div className="mt-3 rounded-xl border border-emerald-300/10 bg-emerald-300/[.035] p-3">
                    <div className="text-[8px] font-black uppercase tracking-wide text-emerald-300">Safety checkpoint</div>
                    <p className="mt-1 text-[10px] leading-relaxed text-white/45">{recall.checkpoint}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button disabled={phaseIndex === 0} onClick={() => { setPhaseIndex((index) => Math.max(0, index - 1)); setRevealed(false) }} className="rounded-full border border-white/10 px-3 py-2 text-[9px] font-black text-white/55 disabled:opacity-25">Previous phase</button>
              <button onClick={markReviewed} className="rounded-full border border-emerald-300/15 bg-emerald-300/[.06] px-3 py-2 text-[9px] font-black text-emerald-200">Mark reviewed</button>
              <button disabled={phaseIndex >= procedure.phases.length - 1} onClick={() => { setPhaseIndex((index) => Math.min(procedure.phases.length - 1, index + 1)); setRevealed(false) }} className="rounded-full border border-white/10 px-3 py-2 text-[9px] font-black text-white/55 disabled:opacity-25">Next phase</button>
              <button onClick={jumpToNextCoverage} className="rounded-full border border-[#f0d68a]/15 px-3 py-2 text-[9px] font-black text-[#f0d68a]">Next unreviewed</button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {coverage.bySpecialty.map((item) => (
              <div key={item.specialty} className="rounded-2xl border border-white/8 bg-white/[.025] p-3">
                <div className="text-[9px] font-black text-white/65">{specialtyLabel(item.specialty)}</div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.05]"><div className="h-full rounded-full bg-emerald-300/70" style={{ width: `${item.total ? Math.round(item.reviewed / item.total * 100) : 0}%` }} /></div>
                <div className="mt-1 text-[8px] text-white/25">{item.reviewed}/{item.total} phases</div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-cyan-200"><IconActivity size={14} /> Operation compare</div>
          <h3 className="mt-2 text-xl font-black tracking-[-.03em]">See what changes when the operation changes.</h3>
          <p className="mt-1 text-[10px] leading-relaxed text-white/35">Comparison uses the atlas records only. “Shared” means both records mention the same structure or anatomy keyword; it does not imply identical operative risk.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ProcedureSelect label="Operation A" value={left.id} onChange={setLeftId} />
            <ProcedureSelect label="Operation B" value={right.id} onChange={setRightId} />
          </div>

          <div className="mt-4 grid gap-3">
            <article className="rounded-2xl border border-rose-300/12 bg-rose-300/[.04] p-4">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-rose-200"><IconHeart size={13} /> Shared risk-map terms</div>
              <div className="mt-3"><ChipList items={comparison.sharedRisks} /></div>
            </article>
            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-2xl border border-white/8 bg-white/[.025] p-4">
                <div className="text-[9px] font-black uppercase tracking-wide text-white/32">Only in {left.name}</div>
                <div className="mt-3"><ChipList items={comparison.leftOnlyRisks.slice(0, 12)} /></div>
              </article>
              <article className="rounded-2xl border border-white/8 bg-white/[.025] p-4">
                <div className="text-[9px] font-black uppercase tracking-wide text-white/32">Only in {right.name}</div>
                <div className="mt-3"><ChipList items={comparison.rightOnlyRisks.slice(0, 12)} /></div>
              </article>
            </div>
            <article className="rounded-2xl border border-cyan-300/12 bg-cyan-300/[.035] p-4">
              <div className="text-[9px] font-black uppercase tracking-wide text-cyan-200">Shared anatomy focus</div>
              <div className="mt-3"><ChipList items={comparison.sharedFocus.slice(0, 16)} /></div>
            </article>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#f0d68a]/12 bg-[#f0d68a]/[.04] p-4">
            <IconShield size={17} className="mt-0.5 shrink-0 text-[#f0d68a]" />
            <p className="text-[10px] leading-relaxed text-white/40"><strong className="text-white/68">Education boundary:</strong> this mode supports anatomy orientation and memory. It intentionally omits incision coordinates, drill trajectories, implant dimensions, energy/device settings, anesthetic dosing and patient-specific operative instructions.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
