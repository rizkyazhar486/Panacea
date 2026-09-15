import { useMemo, useState } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import {
  ENDOCRINE_EVIDENCE,
  ENDOCRINE_FEEDBACK_BOUNDARY,
  ENDOCRINE_FEEDBACK_DEFAULTS,
  ENDOCRINE_TEACHING_EQUATIONS,
  deriveEndocrineFeedback,
  endocrinePercent,
  type EndocrineFeedbackInputs,
} from '../../lib/endocrineFeedbackLab'

interface EndocrineFeedbackWorkbenchProps {
  selectedAtlasSystemId?: BodySystemId
}

const CONTROLS: readonly { key: keyof EndocrineFeedbackInputs; label: string; note: string }[] = [
  { key: 'hypothalamicDrive', label: 'Controller drive', note: 'Synthetic upstream hypothalamic/controller signal.' },
  { key: 'pituitaryGain', label: 'Pituitary gain', note: 'Synthetic amplification through a pituitary/tropic stage.' },
  { key: 'glandCapacity', label: 'Target-gland capacity', note: 'Synthetic downstream hormone-production capacity.' },
  { key: 'receptorSensitivity', label: 'Receptor sensitivity', note: 'Synthetic target-tissue response sensitivity.' },
  { key: 'hormoneClearance', label: 'Hormone clearance', note: 'Synthetic removal/inactivation pressure on circulating signal.' },
  { key: 'feedbackGain', label: 'Negative-feedback gain', note: 'Synthetic strength of target-signal feedback toward upstream control.' },
] as const

const OUTPUTS = [
  ['controllerResidualSignal', 'Controller residual'],
  ['pituitarySignal', 'Pituitary/tropic signal'],
  ['hormoneSignal', 'Hormone signal'],
  ['receptorEffectSignal', 'Target response'],
  ['feedbackSuppressionSignal', 'Feedback suppression'],
  ['clearancePressureSignal', 'Clearance pressure'],
  ['axisReserveSignal', 'Axis reserve'],
] as const

const AXIS_EXAMPLES = [
  ['HPA', 'hypothalamus → pituitary → adrenal → glucocorticoid feedback'],
  ['HPT', 'hypothalamus → pituitary → thyroid → thyroid-hormone feedback'],
  ['HPG', 'hypothalamus → pituitary → gonad → sex-steroid / peptide feedback'],
  ['GH–IGF', 'hypothalamic/pituitary GH control → IGF signaling → feedback'],
] as const

export default function EndocrineFeedbackWorkbench({ selectedAtlasSystemId }: EndocrineFeedbackWorkbenchProps) {
  const [inputs, setInputs] = useState<EndocrineFeedbackInputs>(ENDOCRINE_FEEDBACK_DEFAULTS)
  const outputs = useMemo(() => deriveEndocrineFeedback(inputs), [inputs])
  if (selectedAtlasSystemId !== 'endocrine') return null

  function update(key: keyof EndocrineFeedbackInputs, value: number) {
    setInputs((current) => ({ ...current, [key]: value }))
  }

  return (
    <section data-body-endocrine-feedback="v1" className="overflow-hidden rounded-[28px] border border-violet-300/10 bg-[linear-gradient(145deg,rgba(139,92,246,.06),rgba(2,6,12,.95)_42%,rgba(236,72,153,.045))] text-white shadow-[0_24px_80px_rgba(0,0,0,.28)]">
      <header className="border-b border-white/[.08] p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="text-[9px] font-black uppercase tracking-[.22em] text-violet-200/80">Endocrine Wave · controller → receptor → feedback</div>
            <h3 className="mt-1.5 text-lg font-black sm:text-xl">Endocrine feedback & receptor-response lab</h3>
            <p className="mt-1.5 text-[10px] leading-relaxed text-white/45 sm:text-[11px]">Explore a generic endocrine control architecture across upstream drive, pituitary gain, gland output, receptor sensitivity, clearance and negative feedback. It intentionally does not pretend all endocrine axes share identical timing or transfer functions.</p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[8px] font-black uppercase tracking-[.12em]"><span className="rounded-full border border-violet-300/15 bg-violet-300/[.05] px-2.5 py-1 text-violet-100/75">6 controls</span><span className="rounded-full border border-fuchsia-300/15 bg-fuchsia-300/[.05] px-2.5 py-1 text-fuchsia-100/75">negative feedback</span><span className="rounded-full border border-cyan-300/15 bg-cyan-300/[.05] px-2.5 py-1 text-cyan-100/75">PubMed anchored</span></div>
        </div>
      </header>

      <div className="grid gap-3 p-3 sm:p-4 2xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,.92fr)]">
        <div className="space-y-3">
          <article className="rounded-[22px] border border-white/[.08] bg-black/20 p-3.5 sm:p-4">
            <div className="flex items-end justify-between gap-3"><div><div className="text-[8px] font-black uppercase tracking-[.16em] text-violet-200/65">Interactive control system</div><h4 className="mt-1 text-sm font-black">Synthetic endocrine-axis controls</h4></div><button type="button" onClick={() => setInputs(ENDOCRINE_FEEDBACK_DEFAULTS)} className="rounded-full border border-white/[.08] bg-white/[.035] px-3 py-1.5 text-[8px] font-black text-white/45">Reset</button></div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">{CONTROLS.map((control) => <label key={control.key} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3"><div className="flex justify-between gap-2"><span className="text-[9px] font-black text-white/75">{control.label}</span><span className="font-mono text-[9px] font-black text-violet-100/70">{Math.round(inputs[control.key] * 100)}</span></div><input className="mt-2 w-full accent-violet-300" type="range" min="0" max="1" step="0.01" value={inputs[control.key]} onChange={(event) => update(control.key, Number(event.target.value))} /><p className="mt-1 text-[8px] leading-relaxed text-white/28">{control.note}</p></label>)}</div>
          </article>

          <article className="rounded-[22px] border border-white/[.08] bg-black/20 p-3.5 sm:p-4">
            <div className="text-[8px] font-black uppercase tracking-[.16em] text-fuchsia-200/65">Feedback topology</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-5">
              {['Controller','Pituitary','Target gland','Receptor / tissue','Feedback'].map((label, index) => <div key={label} className="relative rounded-2xl border border-white/[.07] bg-white/[.025] p-3"><div className="text-[8px] font-black text-white/70">{index + 1}. {label}</div>{index < 4 && <span aria-hidden className="absolute -right-2 top-1/2 hidden text-white/20 sm:block">→</span>}</div>)}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">{AXIS_EXAMPLES.map(([label, note]) => <div key={label} className="rounded-2xl border border-white/[.07] bg-white/[.02] p-3"><div className="text-[8px] font-black text-violet-100/70">{label}</div><p className="mt-1 text-[8px] leading-relaxed text-white/28">{note}</p></div>)}</div>
            <div className="mt-3 rounded-2xl border border-amber-300/10 bg-amber-300/[.025] p-3 text-[9px] text-amber-50/45">Dominant teaching constraint: <span className="font-black text-amber-100/75">{outputs.dominantConstraint.replaceAll('-', ' ')}</span>. This is not an endocrine diagnosis.</div>
          </article>
        </div>

        <aside className="space-y-3">
          <article className="rounded-[22px] border border-white/[.08] bg-white/[.02] p-3.5"><div className="text-[8px] font-black uppercase tracking-[.16em] text-cyan-200/65">Axis signal board</div><div className="mt-2 grid gap-2 sm:grid-cols-2">{OUTPUTS.map(([key, label]) => { const value = outputs[key]; return <div key={key} className="rounded-2xl border border-white/[.07] bg-black/20 p-3"><div className="flex justify-between gap-2"><span className="text-[8px] font-black text-white/45">{label}</span><span className="font-mono text-[9px] font-black text-white/70">{endocrinePercent(value)}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.05]"><div className="h-full rounded-full bg-white/45" style={{ width: `${endocrinePercent(value)}%` }} /></div></div> })}</div></article>

          <article className="rounded-[22px] border border-amber-300/10 bg-amber-300/[.025] p-3.5"><div className="text-[8px] font-black uppercase tracking-[.16em] text-amber-200/65">Formula ledger</div><div className="mt-2 space-y-2">{ENDOCRINE_TEACHING_EQUATIONS.map((equation) => <div key={equation.expression} className="rounded-2xl border border-white/[.07] bg-black/20 p-3"><div className="text-[8px] font-black text-white/35">{equation.label}</div><div className="mt-1 break-words font-mono text-[11px] font-black text-white/78">{equation.expression}</div><p className="mt-1.5 text-[8px] leading-relaxed text-white/28">{equation.note}</p></div>)}</div></article>

          <article className="rounded-[22px] border border-violet-300/10 bg-violet-300/[.025] p-3.5"><div className="text-[8px] font-black uppercase tracking-[.16em] text-violet-200/65">Evidence ledger</div><div className="mt-2 space-y-2">{ENDOCRINE_EVIDENCE.map((source) => <a key={source.pmid} href={source.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-white/[.07] bg-black/20 p-3 hover:border-violet-300/20"><div className="flex justify-between gap-2"><span className="text-[8px] font-black text-violet-100/70">PMID {source.pmid}</span><span className="text-[8px] text-white/25">{source.year} ↗</span></div><div className="mt-1 text-[9px] font-black leading-snug text-white/65">{source.title}</div><p className="mt-1.5 text-[8px] leading-relaxed text-white/28">{source.role}</p></a>)}</div></article>
        </aside>
      </div>

      <p className="mx-3 mb-3 rounded-2xl border border-rose-300/10 bg-rose-300/[.025] p-3 text-[8px] leading-relaxed text-rose-50/45 sm:mx-4 sm:mb-4"><span className="font-black text-rose-100/65">Boundary:</span> {ENDOCRINE_FEEDBACK_BOUNDARY}</p>
    </section>
  )
}
