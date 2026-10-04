import { useMemo, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ALVEOLAR_GAS_BOUNDARY, ALVEOLAR_GAS_CONTROLS, ALVEOLAR_GAS_DEFAULTS, ALVEOLAR_GAS_MODELS, alveolarFrequencySweep, evaluateAlveolarGasBudget, type AlveolarGasScenario } from '../engine/alveolarGasBudget'
import { buktiUntuk } from '../../../lib/ecmo/bukti'

/** Teaching parameters do not mutate recorded human state. */
export function AlveolarGasBudgetLab() {
  const [scenario, setScenario] = useState<AlveolarGasScenario>({ ...ALVEOLAR_GAS_DEFAULTS })
  const budget = useMemo(() => evaluateAlveolarGasBudget(scenario), [scenario])
  const curve = useMemo(() => alveolarFrequencySweep(scenario), [scenario])
  return <details data-alveolar-gas-budget="v1" className="mt-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/[.025] p-3">
    <summary className="cursor-pointer text-xs font-bold text-cyan-100">Zoom into the gas budget · unit-based teaching model</summary>
    <p className="mt-3 text-[11px] leading-relaxed text-white/60">Explore ventilation → alveolar CO₂ → alveolar O₂ using independent teaching parameters.</p>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">{ALVEOLAR_GAS_CONTROLS.map(control => <label key={control.key} className="block min-w-0 text-[11px] text-white/70">
      <span>{control.label} · {control.unit}</span><output className="ml-2 font-mono text-cyan-100">{scenario[control.key]}</output>
      <input type="range" aria-label={`Gas budget: ${control.label}`} min={control.min} max={control.max} step={control.step} value={scenario[control.key]} onChange={event => setScenario(current => ({ ...current, [control.key]: Number(event.target.value) }))} className="mt-2 block w-full accent-cyan-300" />
    </label>)}</div>
    <button type="button" onClick={() => setScenario({ ...ALVEOLAR_GAS_DEFAULTS })} className="mt-3 min-h-10 rounded-xl border border-white/20 px-3 text-xs">Reset teaching scenario</button>
    {budget.ok ? <dl aria-live="polite" className="mt-3 grid gap-2 sm:grid-cols-2">
      {[['Minute ventilation', budget.minuteVentilationLMin, 'L/min BTPS'], ['Alveolar ventilation', budget.alveolarVentilationLMin, 'L/min BTPS'], ['Alveolar CO₂', budget.alveolarCo2MmHg, 'mmHg'], ['Alveolar O₂', budget.alveolarO2MmHg, 'mmHg']].map(([label, value, unit]) => <div key={label} className="rounded-xl border border-white/10 p-3"><dt className="text-[11px] text-white/60">{label}</dt><dd className="mt-1 font-mono text-sm">{Number(value).toFixed(2)} {unit}<span className="ml-2 text-[10px] text-amber-200">simulated</span></dd></div>)}
    </dl> : <p role="status" className="mt-3 rounded-xl border border-amber-200/30 p-3 text-xs text-amber-100">Unsupported scenario: {budget.detail}</p>}
    <figure className="mt-4 min-w-0">
      <figcaption className="mb-2 text-[11px] text-white/60">Steady-state frequency sweep · CO₂ (amber), O₂ (cyan), with gaps for unsupported mixtures.</figcaption>
      <div className="h-48 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={curve} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
        <XAxis dataKey="breathsPerMinute" tick={{ fill: '#94a3b8', fontSize: 10 }} /><YAxis width={42} tick={{ fill: '#94a3b8', fontSize: 10 }} /><Tooltip contentStyle={{ background: '#07111a', borderColor: '#334155', fontSize: 11 }} labelFormatter={label => `${label} breaths/min`} />
        <Line name="Alveolar CO₂ (mmHg)" dataKey="co2MmHg" stroke="#fbbf24" dot={false} isAnimationActive={false} connectNulls={false} />
        <Line name="Alveolar O₂ (mmHg)" dataKey="o2MmHg" stroke="#67e8f9" dot={false} isAnimationActive={false} connectNulls={false} />
      </LineChart></ResponsiveContainer></div>
    </figure>
    <details className="mt-3 text-[11px] leading-relaxed text-white/60"><summary className="cursor-pointer font-bold">Equations, provenance & limits</summary>
      <p className="mt-2">{ALVEOLAR_GAS_BOUNDARY}</p>
      {ALVEOLAR_GAS_MODELS.map(model => <div key={model.id} className="mt-3"><p className="break-words font-mono text-cyan-100">{model.persamaan}</p><p>{Object.entries(model.satuan).map(([key, unit]) => `${key}: ${unit}`).join('; ')}</p>{buktiUntuk(model.id).map(evidence => <a key={evidence.id} href={`https://pmc.ncbi.nlm.nih.gov/articles/${evidence.pmcid}/`} target="_blank" rel="noreferrer" className="mt-1 block text-cyan-200 underline">{evidence.sitasi} · Appendix · equation provenance, not Panacea validation</a>)}</div>)}
    </details>
  </details>
}
