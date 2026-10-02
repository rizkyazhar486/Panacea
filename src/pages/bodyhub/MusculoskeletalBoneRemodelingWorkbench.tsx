import { useMemo, useState } from 'react'
import {
  MUSCULOSKELETAL_REMODELING_BOUNDARY,
  MUSCULOSKELETAL_REMODELING_DEFAULTS,
  MUSCULOSKELETAL_REMODELING_PROVENANCE,
  deriveBoneRemodeling,
  type MusculoskeletalBoneRemodelingInputs,
} from '../../lib/musculoskeletalBoneRemodelingLab'

const CONTROLS: readonly { key: keyof MusculoskeletalBoneRemodelingInputs; label: string }[] = [
  { key: 'ranklDrive', label: 'RANKL drive' },
  { key: 'opgBrake', label: 'OPG brake' },
  { key: 'osteoclastCapacity', label: 'Osteoclast capacity' },
  { key: 'osteoblastCapacity', label: 'Osteoblast capacity' },
]

export default function MusculoskeletalBoneRemodelingWorkbench() {
  const [inputs, setInputs] = useState<MusculoskeletalBoneRemodelingInputs>(MUSCULOSKELETAL_REMODELING_DEFAULTS)
  const signals = useMemo(() => deriveBoneRemodeling(inputs), [inputs])
  const update = (key: keyof MusculoskeletalBoneRemodelingInputs, value: number) => setInputs((current) => ({ ...current, [key]: value }))
  return <section data-body-musculoskeletal-remodeling="v1" className="rounded-[28px] border border-white/[.08] bg-black/35 p-4 text-white">
    <div className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-100/60">Musculoskeletal · schematic physiology</div>
    <h4 className="mt-1 text-lg font-black">Bone Remodeling Cycle</h4>
    <p className="mt-2 text-[10px] text-white/45">Synthetic teaching signals connect RANKL/OPG regulation, osteoclast resorption and coupled osteoblast formation.</p>
    <div className="mt-4 grid gap-2 md:grid-cols-2">{CONTROLS.map((control) => <label key={control.key} className="rounded-2xl border border-white/[.07] p-3"><span className="text-[9px] font-bold">{control.label}</span><output className="float-right text-[9px] text-emerald-100/65">{Math.round(inputs[control.key] * 100)}%</output><input aria-label={control.label} className="mt-3 w-full accent-emerald-300" type="range" min="0" max="1" step="0.01" value={inputs[control.key]} onChange={(event) => update(control.key, Number(event.target.value))}/></label>)}</div>
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><Signal label="Resorption" value={signals.resorptionSignal}/><Signal label="Formation" value={signals.formationSignal}/><Signal label="Coupling" value={signals.couplingSignal}/><Signal label="Balance" value={signals.balanceSignal}/></div>
    <p className="mt-4 text-[9px] leading-relaxed text-white/38">{MUSCULOSKELETAL_REMODELING_BOUNDARY}</p>
    <p className="mt-2 text-[8px] text-white/28">Evidence anchor: PMID {MUSCULOSKELETAL_REMODELING_PROVENANCE[0].pmid} · DOI {MUSCULOSKELETAL_REMODELING_PROVENANCE[0].doi} · peer-reviewed review · no Panaceamed validation claim.</p>
  </section>
}

function Signal({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-white/[.07] p-3"><div className="text-[8px] uppercase text-white/35">{label}</div><div className="mt-1 text-xl font-black">{Math.round(value * 100)}</div></div>
}
