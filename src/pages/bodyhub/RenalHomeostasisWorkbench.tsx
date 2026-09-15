import { useMemo, useState } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import {
  RENAL_EVIDENCE,
  RENAL_HOMEOSTASIS_BOUNDARY,
  RENAL_HOMEOSTASIS_DEFAULTS,
  RENAL_TEACHING_EQUATIONS,
  deriveRenalHomeostasis,
  renalPercent,
  type RenalHomeostasisInputs,
} from '../../lib/renalHomeostasisLab'

interface RenalHomeostasisWorkbenchProps {
  selectedAtlasSystemId?: BodySystemId
}

const CONTROLS: readonly { key: keyof RenalHomeostasisInputs; label: string; note: string }[] = [
  { key: 'perfusionDrive', label: 'Renal perfusion drive', note: 'Synthetic pressure/flow support to the glomerular circulation.' },
  { key: 'filtrationCapacity', label: 'Filtration capacity', note: 'Synthetic filtration-barrier/Kf capacity; not measured or estimated GFR.' },
  { key: 'sodiumReabsorption', label: 'Na⁺ reabsorption drive', note: 'Synthetic net tubular sodium-retention tendency.' },
  { key: 'waterReabsorption', label: 'Water reabsorption drive', note: 'Synthetic collecting-system water-conservation tendency.' },
  { key: 'raasDrive', label: 'RAAS drive', note: 'Synthetic salt/volume-conservation feedback signal.' },
  { key: 'acidExcretion', label: 'Acid excretion support', note: 'Synthetic renal contribution to acid-base homeostasis.' },
] as const

const OUTPUTS = [
  ['filtrationSignal', 'Filtration'],
  ['sodiumRetentionSignal', 'Na⁺ retention'],
  ['waterRetentionSignal', 'Water retention'],
  ['volumeConservationSignal', 'Volume conservation'],
  ['concentratingSignal', 'Concentrating'],
  ['acidBaseSupportSignal', 'Acid-base support'],
  ['tubularWorkSignal', 'Tubular work'],
  ['homeostaticReserveSignal', 'Homeostatic reserve'],
] as const

const NEPHRON_SEGMENTS = [
  ['Glomerulus', 'Filtration interface'],
  ['Proximal tubule', 'Bulk solute + water reclamation'],
  ['Loop of Henle', 'Countercurrent / medullary gradient context'],
  ['Distal nephron', 'Fine electrolyte handling'],
  ['Collecting duct', 'Hormone-sensitive water / electrolyte handling'],
] as const

export default function RenalHomeostasisWorkbench({ selectedAtlasSystemId }: RenalHomeostasisWorkbenchProps) {
  const [inputs, setInputs] = useState<RenalHomeostasisInputs>(RENAL_HOMEOSTASIS_DEFAULTS)
  const outputs = useMemo(() => deriveRenalHomeostasis(inputs), [inputs])
  if (selectedAtlasSystemId !== 'urinary') return null

  function update(key: keyof RenalHomeostasisInputs, value: number) {
    setInputs((current) => ({ ...current, [key]: value }))
  }

  return (
    <section data-body-renal-homeostasis="v1" className="overflow-hidden rounded-[28px] border border-sky-300/10 bg-[linear-gradient(145deg,rgba(56,189,248,.055),rgba(2,6,12,.95)_40%,rgba(99,102,241,.05))] text-white shadow-[0_24px_80px_rgba(0,0,0,.28)]">
      <header className="border-b border-white/[.08] p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="text-[9px] font-black uppercase tracking-[.22em] text-sky-200/80">Renal Wave · filtration → tubule → homeostasis</div>
            <h3 className="mt-1.5 text-lg font-black sm:text-xl">Renal filtration, volume & acid–base lab</h3>
            <p className="mt-1.5 text-[10px] leading-relaxed text-white/45 sm:text-[11px]">Follow renal physiology from glomerular filtration into tubular sodium/water handling, RAAS-linked volume conservation and acid-base support using bounded synthetic signals rather than patient laboratory values.</p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[8px] font-black uppercase tracking-[.12em]">
            <span className="rounded-full border border-sky-300/15 bg-sky-300/[.05] px-2.5 py-1 text-sky-100/75">6 controls</span>
            <span className="rounded-full border border-indigo-300/15 bg-indigo-300/[.05] px-2.5 py-1 text-indigo-100/75">nephron map</span>
            <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[.05] px-2.5 py-1 text-emerald-100/75">PubMed anchored</span>
          </div>
        </div>
      </header>

      <div className="grid gap-3 p-3 sm:p-4 2xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,.92fr)]">
        <div className="space-y-3">
          <article className="rounded-[22px] border border-white/[.08] bg-black/20 p-3.5 sm:p-4">
            <div className="flex items-end justify-between gap-3">
              <div><div className="text-[8px] font-black uppercase tracking-[.16em] text-sky-200/65">Interactive physiology</div><h4 className="mt-1 text-sm font-black">Synthetic homeostatic controls</h4></div>
              <button type="button" onClick={() => setInputs(RENAL_HOMEOSTASIS_DEFAULTS)} className="rounded-full border border-white/[.08] bg-white/[.035] px-3 py-1.5 text-[8px] font-black text-white/45 hover:bg-white/[.06]">Reset</button>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {CONTROLS.map((control) => <label key={control.key} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3"><div className="flex justify-between gap-2"><span className="text-[9px] font-black text-white/75">{control.label}</span><span className="font-mono text-[9px] font-black text-sky-100/70">{Math.round(inputs[control.key] * 100)}</span></div><input className="mt-2 w-full accent-sky-300" type="range" min="0" max="1" step="0.01" value={inputs[control.key]} onChange={(event) => update(control.key, Number(event.target.value))} /><p className="mt-1 text-[8px] leading-relaxed text-white/28">{control.note}</p></label>)}
            </div>
          </article>

          <article className="rounded-[22px] border border-white/[.08] bg-black/20 p-3.5 sm:p-4">
            <div className="text-[8px] font-black uppercase tracking-[.16em] text-indigo-200/65">Nephron flow</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-5">
              {NEPHRON_SEGMENTS.map(([label, note], index) => <div key={label} className="relative rounded-2xl border border-white/[.07] bg-white/[.025] p-3"><div className="text-[8px] font-black text-white/72">{index + 1}. {label}</div><p className="mt-1 text-[8px] leading-relaxed text-white/28">{note}</p>{index < NEPHRON_SEGMENTS.length - 1 && <span aria-hidden className="absolute -right-2 top-1/2 hidden text-white/20 sm:block">→</span>}</div>)}
            </div>
            <div className="mt-3 rounded-2xl border border-amber-300/10 bg-amber-300/[.025] p-3 text-[9px] leading-relaxed text-amber-50/45">Dominant teaching axis: <span className="font-black text-amber-100/75">{outputs.dominantAxis.replaceAll('-', ' ')}</span>. This is a model-state descriptor, not a diagnosis or severity grade.</div>
          </article>
        </div>

        <aside className="space-y-3">
          <article className="rounded-[22px] border border-white/[.08] bg-white/[.02] p-3.5">
            <div className="text-[8px] font-black uppercase tracking-[.16em] text-violet-200/65">Homeostasis board</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">{OUTPUTS.map(([key, label]) => { const value = outputs[key]; return <div key={key} className="rounded-2xl border border-white/[.07] bg-black/20 p-3"><div className="flex justify-between gap-2"><span className="text-[8px] font-black text-white/45">{label}</span><span className="font-mono text-[9px] font-black text-white/70">{renalPercent(value)}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.05]"><div className="h-full rounded-full bg-white/45" style={{ width: `${renalPercent(value)}%` }} /></div></div> })}</div>
          </article>

          <article className="rounded-[22px] border border-amber-300/10 bg-amber-300/[.025] p-3.5"><div className="text-[8px] font-black uppercase tracking-[.16em] text-amber-200/65">Formula ledger</div><div className="mt-2 space-y-2">{RENAL_TEACHING_EQUATIONS.map((equation) => <div key={equation.expression} className="rounded-2xl border border-white/[.07] bg-black/20 p-3"><div className="text-[8px] font-black text-white/35">{equation.label}</div><div className="mt-1 break-words font-mono text-[11px] font-black text-white/78">{equation.expression}</div><p className="mt-1.5 text-[8px] leading-relaxed text-white/28">{equation.note}</p></div>)}</div></article>

          <article className="rounded-[22px] border border-sky-300/10 bg-sky-300/[.025] p-3.5"><div className="text-[8px] font-black uppercase tracking-[.16em] text-sky-200/65">Evidence ledger</div><div className="mt-2 space-y-2">{RENAL_EVIDENCE.map((source) => <a key={source.pmid} href={source.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-white/[.07] bg-black/20 p-3 hover:border-sky-300/20"><div className="flex justify-between gap-2"><span className="text-[8px] font-black text-sky-100/70">PMID {source.pmid}</span><span className="text-[8px] text-white/25">{source.year} ↗</span></div><div className="mt-1 text-[9px] font-black leading-snug text-white/65">{source.title}</div><p className="mt-1.5 text-[8px] leading-relaxed text-white/28">{source.role}</p></a>)}</div></article>
        </aside>
      </div>

      <p className="mx-3 mb-3 rounded-2xl border border-rose-300/10 bg-rose-300/[.025] p-3 text-[8px] leading-relaxed text-rose-50/45 sm:mx-4 sm:mb-4"><span className="font-black text-rose-100/65">Boundary:</span> {RENAL_HOMEOSTASIS_BOUNDARY}</p>
    </section>
  )
}
