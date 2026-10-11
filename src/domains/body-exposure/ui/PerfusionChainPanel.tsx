import { useEffect, useMemo, useState } from 'react'
import {
  DISPLAY_SCALE, EMPTY_SCENARIO, SCENARIO_LABEL, barFraction, evaluatePerfusionScenario,
  type PerfusionScenarioResult, type ScenarioFieldId, type ScenarioText,
} from '../engine/perfusionScenario'

// Skenario what-if jantung -> otak. Bukan data pasien dan bukan alat klinis; semua kolom mulai kosong.
const FIELDS: readonly ScenarioFieldId[] = ['hr', 'edv', 'esv', 'svr', 'cvp', 'icp']

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!query) return
    setReduced(query.matches)
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function FlowDiagram({ result, reduced }: { result: PerfusionScenarioResult; reduced: boolean }) {
  const co = barFraction(result.cardiacOutputLMin, DISPLAY_SCALE.cardiacOutputLMin)
  const map = barFraction(result.meanArterialPressureMmHg, DISPLAY_SCALE.pressureMmHg)
  const cpp = barFraction(Math.max(0, result.cerebralPerfusionPressureMmHg), DISPLAY_SCALE.pressureMmHg)
  // Lebar pipa mengikuti nilai pada skala tampilan tetap; durasi aliran lebih cepat saat curah jantung lebih besar.
  const body = 3 + co * 15
  const neck = 2 + map * 12
  const brain = 2 + cpp * 12
  const seconds = (3.2 - co * 2.4).toFixed(2)
  const flow = (path: string, width: number) => (
    <path d={path} fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth={Math.max(1.5, width / 4)} strokeLinecap="round" strokeDasharray="2 12">
      {!reduced && <animate attributeName="stroke-dashoffset" from="28" to="0" dur={`${seconds}s`} repeatCount="indefinite" />}
    </path>
  )
  return (
    <svg viewBox="0 0 320 170" role="img" className="w-full max-w-md" aria-label={`Schematic: cardiac output ${result.cardiacOutputLMin.toFixed(1)} litres per minute, mean arterial pressure ${result.meanArterialPressureMmHg.toFixed(0)} millimetres of mercury, cerebral perfusion pressure ${result.cerebralPerfusionPressureMmHg.toFixed(0)} millimetres of mercury. Not anatomical.`}>
      <path d="M52 112 L52 70 Q52 38 92 38 L206 38" fill="none" stroke="#e11d48" strokeOpacity="0.55" strokeWidth={body} strokeLinecap="round" />
      {flow('M52 112 L52 70 Q52 38 92 38 L206 38', body)}
      <path d="M206 38 L258 38 L258 78" fill="none" stroke="#dc2626" strokeOpacity="0.55" strokeWidth={neck} strokeLinecap="round" strokeLinejoin="round" />
      {flow('M206 38 L258 38 L258 78', neck)}
      <path d="M258 78 L258 96" fill="none" stroke="#b91c1c" strokeOpacity="0.55" strokeWidth={brain} strokeLinecap="round" />
      <ellipse cx="52" cy="128" rx="26" ry="22" fill="#e11d48" fillOpacity="0.25" stroke="#e11d48" strokeWidth="2" />
      <ellipse cx="258" cy="116" rx="40" ry="26" fill="#6366f1" fillOpacity="0.2" stroke="#6366f1" strokeWidth="2" />
      <g className="fill-neutral-700 dark:fill-neutral-200" fontSize="11" fontWeight="700" textAnchor="middle">
        <text x="52" y="132">Heart</text>
        <text x="258" y="120">Brain</text>
        <text x="130" y="28">CO {result.cardiacOutputLMin.toFixed(1)} L/min</text>
        <text x="282" y="62" textAnchor="end">MAP {result.meanArterialPressureMmHg.toFixed(0)}</text>
        <text x="258" y="158">CPP {result.cerebralPerfusionPressureMmHg.toFixed(0)} mmHg</text>
      </g>
    </svg>
  )
}

export function PerfusionChainPanel() {
  const [text, setText] = useState<ScenarioText>(EMPTY_SCENARIO)
  const reduced = usePrefersReducedMotion()
  const scenario = useMemo(() => evaluatePerfusionScenario(text), [text])

  return (
    <details className="rounded-2xl border border-neutral-200 p-3 text-sm dark:border-white/10" data-testid="perfusion-chain-panel">
      <summary className="cursor-pointer font-bold">Heart to brain: a perfusion scenario (research)</summary>
      <p className="mt-2 rounded-xl bg-amber-50 p-2 text-[13px] text-amber-900 dark:bg-amber-400/10 dark:text-amber-100" role="note">
        Research and education only: a what-if on steady-state textbook relations, not patient data, not clinically validated, and not for diagnosis or treatment.
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {FIELDS.map((id) => (
          <label key={id} className="flex flex-col justify-end text-[13px] font-bold">{SCENARIO_LABEL[id].label} ({SCENARIO_LABEL[id].unit})
            <input inputMode="decimal" autoComplete="off" value={text[id]} aria-label={`Scenario: ${SCENARIO_LABEL[id].label}`}
              onChange={(e) => setText((t) => ({ ...t, [id]: e.target.value }))}
              className="mt-1 min-h-[44px] w-full rounded-xl border border-neutral-300 bg-white px-2 dark:border-white/20 dark:bg-neutral-900" />
          </label>
        ))}
      </div>
      <div className="mt-3" aria-live="polite">
        {scenario.status === 'incomplete' && <p className="text-[13px]">Enter all six values to see the chain. Still missing: {scenario.missing.map((id) => SCENARIO_LABEL[id].label.toLowerCase()).join(', ')}.</p>}
        {scenario.status === 'invalid' && <p className="text-[13px] text-amber-800 dark:text-amber-200" role="alert">{scenario.reason}</p>}
        {scenario.status === 'ok' && (
          <div className="space-y-2">
            <FlowDiagram result={scenario.result} reduced={reduced} />
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]">
              <dt>Stroke volume</dt><dd className="font-bold">{scenario.result.strokeVolumeMl.toFixed(0)} mL</dd>
              <dt>Cardiac output</dt><dd className="font-bold">{scenario.result.cardiacOutputLMin.toFixed(2)} L/min</dd>
              <dt>Mean arterial pressure</dt><dd className="font-bold">{scenario.result.meanArterialPressureMmHg.toFixed(1)} mmHg</dd>
              <dt>Cerebral perfusion pressure</dt><dd className="font-bold">{scenario.result.cerebralPerfusionPressureMmHg.toFixed(1)} mmHg</dd>
            </dl>
            <p className="text-[12px] text-neutral-600 dark:text-neutral-300">
              {scenario.result.gradient === 'non-positive'
                ? 'Intracranial pressure is at or above mean arterial pressure here, so there is no positive driving gradient in this model.'
                : 'Arterial pressure exceeds intracranial pressure here, so the model has a positive driving gradient.'}
              {' '}Pressure gradient only: this is not cerebral blood flow, and it ignores autoregulation, pulsatility and regional flow. Pipe widths use a fixed display scale, not reference ranges.
            </p>
          </div>
        )}
      </div>
      <p className="mt-2 text-[11px] text-neutral-500">Relations: CO = HR × (EDV − ESV); MAP = CO × SVR / 80 + CVP; CPP = MAP − ICP; sources: NCBI Bookshelf NBK470455, NBK556075, NBK538226, NBK537271.</p>
    </details>
  )
}
