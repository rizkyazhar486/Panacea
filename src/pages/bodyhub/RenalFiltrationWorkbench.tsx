import { useMemo, useState } from 'react'
import { RENAL_FILTRATION_BOUNDARY, RENAL_FILTRATION_DEFAULTS, RENAL_FILTRATION_EQUATIONS, RENAL_FILTRATION_PROVENANCE, deriveRenalFiltration, type RenalFiltrationInputs } from '../../lib/renalFiltrationLab'

const controls: Array<{ key: keyof RenalFiltrationInputs; label: string }> = [
  { key: 'renalPlasmaFlow', label: 'Renal plasma-flow signal' },
  { key: 'filtrationBarrier', label: 'Filtration-barrier conductance' },
  { key: 'waterConservationDrive', label: 'Water-conservation drive' },
]

export default function RenalFiltrationWorkbench() {
  const [input, setInput] = useState(RENAL_FILTRATION_DEFAULTS)
  const signals = useMemo(() => deriveRenalFiltration(input), [input])
  return (
    <div className="grid gap-3 rounded-[24px] border border-white/[.07] bg-black/35 p-3 lg:grid-cols-[1.1fr_.9fr]">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.entries(signals).map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-white/[.06] bg-white/[.025] p-2.5">
              <div className="text-[9px] uppercase tracking-[.12em] text-white/38">{key.replace(/([A-Z])/g, ' $1')}</div>
              <div className="mt-1 text-lg font-black tabular-nums text-white/88">{Math.round(value * 100)}</div>
            </div>
          ))}
        </div>
        {controls.map(control => (
          <label key={control.key} className="block rounded-2xl border border-white/[.06] bg-white/[.02] p-2.5 text-[10px] text-white/55">
            <span className="flex justify-between gap-3"><span>{control.label}</span><span className="tabular-nums text-white/75">{input[control.key].toFixed(2)}</span></span>
            <input className="mt-2 w-full" type="range" min="0" max="1" step="0.01" value={input[control.key]} onChange={event => setInput(current => ({ ...current, [control.key]: Number(event.target.value) }))} />
          </label>
        ))}
      </div>
      <div className="space-y-2">
        <div className="rounded-2xl border border-white/[.06] bg-white/[.02] p-3">
          <div className="text-[9px] font-black uppercase tracking-[.15em] text-emerald-100/55">Formula ledger</div>
          {RENAL_FILTRATION_EQUATIONS.map(item => <div key={item.expression} className="mt-2"><div className="font-mono text-xs text-white/80">{item.expression}</div><div className="mt-0.5 text-[9px] leading-relaxed text-white/38">{item.meaning}</div></div>)}
        </div>
        <div className="rounded-2xl border border-amber-200/10 bg-amber-200/[.025] p-3 text-[9px] leading-relaxed text-white/42">{RENAL_FILTRATION_BOUNDARY}</div>
        <div className="rounded-2xl border border-white/[.06] bg-white/[.02] p-3 text-[9px] leading-relaxed text-white/38">
          {RENAL_FILTRATION_PROVENANCE.map(item => <div key={item.pmid} className="mb-2 last:mb-0"><span className="text-white/65">PMID {item.pmid}</span> · {item.citation} {item.supports} {item.reviewState}</div>)}
        </div>
      </div>
    </div>
  )
}
