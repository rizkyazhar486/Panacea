import { useMemo, useState } from 'react'
import {
  ENDOCRINE_HPT_BOUNDARY,
  ENDOCRINE_HPT_DEFAULTS,
  ENDOCRINE_HPT_PROVENANCE,
  deriveHptAxis,
  type EndocrineHptInputs,
} from '../../lib/endocrineHptAxisLab'

const CONTROLS: readonly { key: keyof EndocrineHptInputs; label: string }[] = [
  { key: 'hypothalamicDrive', label: 'Hypothalamic drive' },
  { key: 'pituitaryResponsiveness', label: 'Pituitary responsiveness' },
  { key: 'thyroidResponsiveness', label: 'Thyroid responsiveness' },
  { key: 'thyroidHormone', label: 'Thyroid-hormone feedback' },
]

export default function EndocrineHptAxisWorkbench() {
  const [inputs, setInputs] = useState<EndocrineHptInputs>(ENDOCRINE_HPT_DEFAULTS)
  const signals = useMemo(() => deriveHptAxis(inputs), [inputs])
  const update = (key: keyof EndocrineHptInputs, value: number) => setInputs((current) => ({ ...current, [key]: value }))
  return <section data-body-endocrine-hpt="v1" className="rounded-[28px] border border-white/[.08] bg-black/35 p-4 text-white">
    <div className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-100/60">Endocrine · schematic physiology</div>
    <h4 className="mt-1 text-lg font-black">Hypothalamic–Pituitary–Thyroid Feedback</h4>
    <p className="mt-2 text-[10px] text-white/45">Synthetic teaching signals for TRH → TSH → thyroid-hormone drive and thyroid-hormone negative feedback; not patient laboratory values.</p>
    <div className="mt-4 grid gap-2 md:grid-cols-2">{CONTROLS.map((control) => <label key={control.key} className="rounded-2xl border border-white/[.07] p-3"><span className="text-[9px] font-bold">{control.label}</span><output className="float-right text-[9px] text-emerald-100/65">{Math.round(inputs[control.key] * 100)}%</output><input aria-label={control.label} className="mt-3 w-full accent-emerald-300" type="range" min="0" max="1" step="0.01" value={inputs[control.key]} onChange={(event) => update(control.key, Number(event.target.value))}/></label>)}</div>
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><Signal label="TRH" value={signals.trhSignal}/><Signal label="TSH" value={signals.tshSignal}/><Signal label="TH output" value={signals.thyroidHormoneSignal}/><Signal label="Feedback" value={signals.feedbackSignal}/></div>
    <p className="mt-4 text-[9px] leading-relaxed text-white/38">{ENDOCRINE_HPT_BOUNDARY}</p>
    <p className="mt-2 text-[8px] text-white/28">Evidence anchor: PMID {ENDOCRINE_HPT_PROVENANCE[0].pmid} · peer-reviewed review · source identity retained · no Panaceamed validation claim.</p>
  </section>
}

function Signal({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-white/[.07] p-3"><div className="text-[8px] uppercase text-white/35">{label}</div><div className="mt-1 text-xl font-black">{Math.round(value * 100)}</div></div>
}
