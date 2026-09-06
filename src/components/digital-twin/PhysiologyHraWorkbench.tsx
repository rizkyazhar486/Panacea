import { useMemo, useState } from 'react'
import { HraContextBridge } from './HraContextBridge'
import { HraResolvedAnatomyViewer } from './HraResolvedAnatomyViewer'
import { useVitals } from '../../lib/useVitals'
import { vitalsAge } from '../../lib/healthVitals'
import {
  PHYSIOLOGY_STATES,
  PHYSIOLOGY_SYSTEMS,
  cardiacOutputLMin,
  meanArterialPressure,
  minuteVentilationLMin,
  physiologyState,
  physiologySystem,
  pulsePressure,
  type PhysiologyProvenance,
  type PhysiologyStateKey,
  type PhysiologySystemKey,
} from '../../lib/bodyPhysiology'

type DisplayState = 'connected' | PhysiologyStateKey

type MetricItem = {
  label: string
  value: string
  provenance: PhysiologyProvenance
  detail: string
}

const PROVENANCE_STYLE: Record<PhysiologyProvenance, string> = {
  measured: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-200',
  derived: 'bg-cyan-50 text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-200',
  educational: 'bg-amber-50 text-amber-800 dark:bg-amber-300/10 dark:text-amber-200',
  unavailable: 'bg-neutral-100 text-neutral-500 dark:bg-white/10 dark:text-neutral-300',
}

function finite(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

function format(value: number, digits = 0) {
  return digits ? value.toFixed(digits) : String(Math.round(value))
}

export function PhysiologyHraWorkbench() {
  const vitals = useVitals()
  const [systemKey, setSystemKey] = useState<PhysiologySystemKey>('cardiovascular')
  const [stateKey, setStateKey] = useState<DisplayState>('rest')
  const [phaseIndex, setPhaseIndex] = useState(0)

  const system = physiologySystem(systemKey)
  const reference = physiologyState(stateKey === 'connected' ? 'rest' : stateKey)
  const age = vitalsAge(vitals)

  const hrMeasured = finite(vitals.heartRate) ?? finite(vitals.restingHr)
  const rrMeasured = finite(vitals.respRate)
  const sbpMeasured = finite(vitals.systolic)
  const dbpMeasured = finite(vitals.diastolic)
  const tempMeasured = finite(vitals.bodyTempC)
  const spo2Measured = finite(vitals.spo2Pct)
  const hrvMeasured = finite(vitals.hrvMs)
  const vo2Measured = finite(vitals.vo2max)
  const hasConnected = Boolean(hrMeasured || rrMeasured || sbpMeasured || spo2Measured || tempMeasured)
  const connected = stateKey === 'connected' && hasConnected

  const hr = connected ? (hrMeasured ?? reference.heartRate) : reference.heartRate
  const rr = connected ? (rrMeasured ?? reference.respRate) : reference.respRate
  const sbp = connected ? (sbpMeasured ?? reference.systolic) : reference.systolic
  const dbp = connected ? (dbpMeasured ?? reference.diastolic) : reference.diastolic
  const temp = connected ? (tempMeasured ?? reference.bodyTempC) : reference.bodyTempC

  const sourceTerms = useMemo(() => [...system.focusKeywords], [system])

  const metrics = useMemo<MetricItem[]>(() => {
    const measuredOrReference = (actual: number | undefined): PhysiologyProvenance => connected && actual != null ? 'measured' : 'educational'

    if (systemKey === 'cardiovascular') {
      const map = meanArterialPressure(sbp, dbp)
      const pp = pulsePressure(sbp, dbp)
      const co = cardiacOutputLMin(hr, reference.strokeVolumeMl)
      return [
        { label: 'Heart rate', value: `${format(hr)} bpm`, provenance: measuredOrReference(hrMeasured), detail: connected && hrMeasured ? 'Connected vital.' : 'Selected educational reference state.' },
        { label: 'Blood pressure', value: `${format(sbp)}/${format(dbp)} mmHg`, provenance: connected && sbpMeasured && dbpMeasured ? 'measured' : 'educational', detail: connected && sbpMeasured && dbpMeasured ? 'Connected systolic/diastolic pressure.' : 'Selected educational reference state.' },
        { label: 'Mean arterial pressure', value: `${format(map)} mmHg`, provenance: 'derived', detail: 'MAP ≈ DBP + (SBP − DBP) / 3 using the displayed pressures.' },
        { label: 'Pulse pressure', value: `${format(pp)} mmHg`, provenance: 'derived', detail: 'PP = SBP − DBP.' },
        { label: 'Cardiac output context', value: `${format(co, 1)} L/min`, provenance: 'derived', detail: `CO = HR × SV using ${reference.strokeVolumeMl} mL educational stroke-volume context; not a measured cardiac output.` },
        { label: 'HRV', value: connected && hrvMeasured ? `${format(hrvMeasured)} ms` : 'Not available', provenance: connected && hrvMeasured ? 'measured' : 'unavailable', detail: 'Panacea does not synthesize HRV when no connected value exists.' },
      ]
    }

    if (systemKey === 'respiratory') {
      const ventilation = minuteVentilationLMin(rr, reference.tidalVolumeMl)
      return [
        { label: 'Respiratory rate', value: `${format(rr)} /min`, provenance: measuredOrReference(rrMeasured), detail: connected && rrMeasured ? 'Connected respiratory rate.' : 'Selected educational reference state.' },
        { label: 'SpO₂', value: connected && spo2Measured ? `${format(spo2Measured)}%` : 'Not available', provenance: connected && spo2Measured ? 'measured' : 'unavailable', detail: 'No oxygen saturation is invented when the sensor value is absent.' },
        { label: 'Tidal-volume context', value: `${reference.tidalVolumeMl} mL`, provenance: 'educational', detail: 'Teaching context only; not spirometry.' },
        { label: 'Minute ventilation', value: `${format(ventilation, 1)} L/min`, provenance: 'derived', detail: 'V̇E = RR × VT using the displayed RR and educational VT context.' },
        { label: 'VO₂max', value: connected && vo2Measured ? `${format(vo2Measured, 1)} mL/kg/min` : 'Not available', provenance: connected && vo2Measured ? 'measured' : 'unavailable', detail: 'Shown only when a connected VO₂max value exists.' },
      ]
    }

    if (systemKey === 'neuromuscular') {
      return [
        { label: 'Motor-unit recruitment', value: 'Task dependent', provenance: 'educational', detail: 'Recruitment varies with task, load, fatigue and neural drive; no activation percentage is fabricated.' },
        { label: 'Joint torque', value: 'τ = r × F', provenance: 'unavailable', detail: 'A numeric torque requires force and moment-arm inputs.' },
        { label: 'Mechanical power', value: 'P = F · v', provenance: 'unavailable', detail: 'A numeric power value requires measured force and velocity.' },
      ]
    }

    if (systemKey === 'gastrointestinal') {
      return [
        { label: 'Peristalsis', value: 'Process sequence', provenance: 'educational', detail: 'The phase rail explains propagation; the bowel source GLB remains static.' },
        { label: 'Transit time', value: 'Not available', provenance: 'unavailable', detail: 'Requires an appropriate measurement or validated model.' },
        { label: 'Transport relation', value: 'V̇ = Q × (Cin − Cout)', provenance: 'educational', detail: 'General Fick mass-balance relation; no patient number is produced without flow and concentrations.' },
      ]
    }

    if (systemKey === 'renal') {
      return [
        { label: 'eGFR', value: 'Not available', provenance: 'unavailable', detail: 'Requires creatinine/cystatin C and the inputs required by a validated equation.' },
        { label: 'Filtration fraction', value: 'FF = GFR / RPF', provenance: 'educational', detail: 'No value is calculated without GFR and renal plasma flow.' },
        { label: 'Clearance', value: 'Cx = (Ux × V) / Px', provenance: 'educational', detail: 'Requires urine concentration, urine flow and plasma concentration.' },
      ]
    }

    return [
      { label: 'Body temperature', value: `${format(temp, 1)} °C`, provenance: measuredOrReference(tempMeasured), detail: connected && tempMeasured ? 'Connected temperature.' : 'Selected educational reference state.' },
      { label: 'Heat balance', value: 'S = M − W ± R ± C ± K − E', provenance: 'educational', detail: 'Heat-storage relation; not solved without metabolic and environmental inputs.' },
      { label: 'Sweat / skin blood flow', value: 'Not measured', provenance: 'unavailable', detail: 'No sweat rate or cutaneous flow is fabricated without an appropriate data source.' },
    ]
  }, [connected, dbp, dbpMeasured, hr, hrMeasured, hrvMeasured, reference, rr, rrMeasured, sbp, sbpMeasured, spo2Measured, systemKey, temp, tempMeasured, vo2Measured])

  function chooseSystem(next: PhysiologySystemKey) {
    setSystemKey(next)
    setPhaseIndex(0)
  }

  const stateNote = connected
    ? `Connected measurements${age ? ` · age context ${age}` : ''}. Missing variables remain explicitly educational or unavailable.`
    : reference.note

  return (
    <div className="space-y-4">
      <section className="rounded-[30px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#090d11] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-700 dark:text-emerald-300">HRA-native physiology workbench</div>
            <h2 className="mt-1 text-xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-2xl">Function without deforming the anatomy.</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">Choose a physiological system. Panacea keeps HuBMAP HRA geometry fixed, then places measured, derived, educational and unavailable physiology beside it. Timing is represented by explicit phases—not by making organs pulse or wobble.</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-[10px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/[.035] dark:text-neutral-400">{stateNote}</div>
        </div>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {PHYSIOLOGY_SYSTEMS.map((item) => (
            <button key={item.key} onClick={() => chooseSystem(item.key)} className={`min-w-[155px] shrink-0 rounded-2xl border p-3 text-left transition ${item.key === systemKey ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-300/30 dark:bg-emerald-300/10' : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300 dark:border-white/10 dark:bg-white/[.025]'}`}>
              <div className="text-[11px] font-black text-neutral-950 dark:text-white">{item.label}</div>
              <div className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">{item.subtitle}</div>
            </button>
          ))}
        </div>

        <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
          <button disabled={!hasConnected} onClick={() => setStateKey('connected')} className={`shrink-0 rounded-full border px-3 py-2 text-[9px] font-black ${stateKey === 'connected' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10 dark:text-neutral-300'} disabled:cursor-not-allowed disabled:opacity-35`}>Connected data</button>
          {PHYSIOLOGY_STATES.map((state) => (
            <button key={state.key} onClick={() => setStateKey(state.key)} className={`shrink-0 rounded-full border px-3 py-2 text-[9px] font-black ${stateKey === state.key ? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950' : 'border-neutral-200 text-neutral-500 dark:border-white/10 dark:text-neutral-300'}`}>{state.label}</button>
          ))}
        </div>
      </section>

      <HraResolvedAnatomyViewer
        title={`${system.label} · source anatomy`}
        description="Static upstream HRA geometry. Changing physiology state, phase or connected metrics never morphs this source model."
        terms={sourceTerms}
        maxResults={14}
      />

      <HraContextBridge title={`${system.label} · mapped source structures`} terms={sourceTerms} maxResults={12} />

      <section className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#090d11] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-700 dark:text-cyan-300">Physiology cycle</div>
            <h3 className="mt-1 text-lg font-black text-neutral-950 dark:text-white">{system.label}</h3>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">{system.explanation}</p>
          </div>
          <div className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[9px] font-black text-neutral-500 dark:border-white/10 dark:bg-white/[.035] dark:text-neutral-300">Phase {phaseIndex + 1}/{system.phases.length}</div>
        </div>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {system.phases.map((phase, index) => (
            <button key={phase} onClick={() => setPhaseIndex(index)} className={`min-w-[190px] shrink-0 rounded-2xl border p-3 text-left ${index === phaseIndex ? 'border-cyan-300 bg-cyan-50 dark:border-cyan-300/30 dark:bg-cyan-300/10' : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.025]'}`}>
              <div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">{String(index + 1).padStart(2, '0')}</div>
              <div className="mt-1 text-[11px] font-black text-neutral-950 dark:text-white">{phase}</div>
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((item) => (
            <article key={item.label} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]">
              <div className="flex items-start justify-between gap-2">
                <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">{item.label}</div>
                <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase ${PROVENANCE_STYLE[item.provenance]}`}>{item.provenance}</span>
              </div>
              <div className="mt-2 text-lg font-black text-neutral-950 dark:text-white">{item.value}</div>
              <p className="mt-1 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">{item.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-4 grid gap-2 lg:grid-cols-2">
          {system.formulae.map((formula) => (
            <article key={formula.name} className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
              <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">{formula.name}</div>
              <div className="mt-1 font-mono text-[12px] font-black text-neutral-950 dark:text-white">{formula.formula}</div>
              <p className="mt-1 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">{formula.meaning}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
