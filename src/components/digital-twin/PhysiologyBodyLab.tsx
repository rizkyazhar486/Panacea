import { useEffect, useMemo, useState } from 'react'
import { Body3D, CT_WINDOWS, type AnatomyLayer, type MotionState } from '../Body3D'
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

const BADGE: Record<PhysiologyProvenance, string> = {
  measured: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200',
  derived: 'border-cyan-300/25 bg-cyan-300/[.08] text-cyan-200',
  educational: 'border-amber-200/25 bg-amber-200/[.07] text-amber-100',
  unavailable: 'border-white/10 bg-white/[.04] text-white/35',
}

function finite(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

function Metric({ label, value, unit, provenance, detail }: {
  label: string
  value: string | number
  unit?: string
  provenance: PhysiologyProvenance
  detail: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.035] p-3.5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[9px] font-black uppercase tracking-[.13em] text-white/35">{label}</span>
        <span className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-wide ${BADGE[provenance]}`}>{provenance}</span>
      </div>
      <div className="mt-2 text-2xl font-black tabular-nums text-white">{value}{unit && <span className="ml-1 text-[10px] font-bold text-white/35">{unit}</span>}</div>
      <p className="mt-1 text-[9px] leading-relaxed text-white/32">{detail}</p>
    </div>
  )
}

function SystemMetricGrid({
  systemKey,
  stateKey,
  connected,
}: {
  systemKey: PhysiologySystemKey
  stateKey: DisplayState
  connected: ReturnType<typeof useVitals>
}) {
  const reference = physiologyState(stateKey === 'connected' ? 'rest' : stateKey)
  const useConnected = stateKey === 'connected'
  const hrMeasured = finite(connected.heartRate) ?? finite(connected.restingHr)
  const rrMeasured = finite(connected.respRate)
  const sbpMeasured = finite(connected.systolic)
  const dbpMeasured = finite(connected.diastolic)
  const tempMeasured = finite(connected.bodyTempC)
  const spo2Measured = finite(connected.spo2Pct)
  const hrvMeasured = finite(connected.hrvMs)
  const vo2Measured = finite(connected.vo2max)

  const hr = useConnected ? (hrMeasured ?? reference.heartRate) : reference.heartRate
  const rr = useConnected ? (rrMeasured ?? reference.respRate) : reference.respRate
  const sbp = useConnected ? (sbpMeasured ?? reference.systolic) : reference.systolic
  const dbp = useConnected ? (dbpMeasured ?? reference.diastolic) : reference.diastolic
  const temp = useConnected ? (tempMeasured ?? reference.bodyTempC) : reference.bodyTempC
  const measured = (present: number | undefined): PhysiologyProvenance => useConnected && present !== undefined ? 'measured' : 'educational'

  if (systemKey === 'cardiovascular') {
    const map = meanArterialPressure(sbp, dbp)
    const pp = pulsePressure(sbp, dbp)
    const co = cardiacOutputLMin(hr, reference.strokeVolumeMl)
    return (
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <Metric label="Heart rate" value={Math.round(hr)} unit="bpm" provenance={measured(hrMeasured)} detail={useConnected && hrMeasured ? 'Connected vital.' : 'Reference state value.'} />
        <Metric label="Blood pressure" value={`${Math.round(sbp)}/${Math.round(dbp)}`} unit="mmHg" provenance={useConnected && sbpMeasured && dbpMeasured ? 'measured' : 'educational'} detail="Displayed only from connected BP or the selected reference state." />
        <Metric label="Mean arterial pressure" value={Math.round(map)} unit="mmHg" provenance="derived" detail="Calculated from the displayed systolic and diastolic pressure." />
        <Metric label="Pulse pressure" value={Math.round(pp)} unit="mmHg" provenance="derived" detail="SBP − DBP." />
        <Metric label="Cardiac output" value={co.toFixed(1)} unit="L/min" provenance="derived" detail={`HR × educational stroke-volume context (${reference.strokeVolumeMl} mL); not measured CO.`} />
        <Metric label="HRV" value={hrvMeasured ? Math.round(hrvMeasured) : '—'} unit={hrvMeasured ? 'ms' : undefined} provenance={hrvMeasured && useConnected ? 'measured' : 'unavailable'} detail={hrvMeasured && useConnected ? 'Connected HRV value.' : 'No current connected HRV used for this state.'} />
      </div>
    )
  }

  if (systemKey === 'respiratory') {
    const ventilation = minuteVentilationLMin(rr, reference.tidalVolumeMl)
    return (
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <Metric label="Respiratory rate" value={Math.round(rr)} unit="/min" provenance={measured(rrMeasured)} detail={useConnected && rrMeasured ? 'Connected respiratory rate.' : 'Reference state value.'} />
        <Metric label="SpO₂" value={spo2Measured && useConnected ? spo2Measured.toFixed(0) : '—'} unit={spo2Measured && useConnected ? '%' : undefined} provenance={spo2Measured && useConnected ? 'measured' : 'unavailable'} detail="No oxygen saturation is synthesized when a sensor value is absent." />
        <Metric label="Tidal-volume context" value={reference.tidalVolumeMl} unit="mL" provenance="educational" detail="State-level teaching value, not spirometry." />
        <Metric label="Minute ventilation" value={ventilation.toFixed(1)} unit="L/min" provenance="derived" detail="RR × educational tidal-volume context." />
        <Metric label="VO₂max" value={vo2Measured && useConnected ? vo2Measured.toFixed(1) : '—'} unit={vo2Measured && useConnected ? 'mL/kg/min' : undefined} provenance={vo2Measured && useConnected ? 'measured' : 'unavailable'} detail="Fitness capacity is shown only when connected; it is not inferred from the animation." />
      </div>
    )
  }

  if (systemKey === 'neuromuscular') {
    return (
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <Metric label="Contraction cue" value={reference.contractionRate || 0} unit="cycles/min" provenance="educational" detail="Visual timing cue only; not EMG or force measurement." />
        <Metric label="Motor-unit recruitment" value="Contextual" provenance="educational" detail="Recruitment depends on task, load, fatigue and neural drive; no percentage is fabricated." />
        <Metric label="Joint torque" value="Requires F + r" provenance="unavailable" detail="Torque is not computed without force and moment-arm inputs." />
      </div>
    )
  }

  if (systemKey === 'gastrointestinal') {
    return (
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <Metric label="Peristaltic cue" value={reference.peristalsisRate} unit="waves/min" provenance="educational" detail="A simplified propagation rate used only for the visual reference motion." />
        <Metric label="Transit time" value="—" provenance="unavailable" detail="No transit-time estimate is produced without an appropriate measurement or validated model." />
        <Metric label="Absorption" value="Process map" provenance="educational" detail="Transport mechanisms are explained qualitatively rather than assigned a fake percentage." />
      </div>
    )
  }

  if (systemKey === 'renal') {
    return (
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <Metric label="eGFR" value="—" provenance="unavailable" detail="Requires creatinine/cystatin C and a validated equation with the required patient inputs." />
        <Metric label="Filtration fraction" value="GFR / RPF" provenance="educational" detail="Formula is shown, but no number is invented without GFR and renal plasma flow." />
        <Metric label="Clearance" value="Ux·V / Px" provenance="educational" detail="Requires urine concentration, urine flow and plasma concentration." />
      </div>
    )
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      <Metric label="Body temperature" value={temp.toFixed(1)} unit="°C" provenance={measured(tempMeasured)} detail={useConnected && tempMeasured ? 'Connected temperature.' : 'Reference state value.'} />
      <Metric label="Heat storage" value="M − W ± R ± C ± K − E" provenance="educational" detail="Heat-balance relationship; not solved without metabolic and environmental inputs." />
      <Metric label="Sweat / skin blood flow" value="Contextual" provenance="educational" detail="No sweat rate or cutaneous flow is fabricated without sensors or validated inputs." />
    </div>
  )
}

export function PhysiologyBodyLab() {
  const vitals = useVitals()
  const [systemKey, setSystemKey] = useState<PhysiologySystemKey>('cardiovascular')
  const [stateKey, setStateKey] = useState<DisplayState>('rest')
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [selectedStructure, setSelectedStructure] = useState('')

  const system = physiologySystem(systemKey)
  const reference = physiologyState(stateKey === 'connected' ? 'rest' : stateKey)
  const connectedHr = finite(vitals.heartRate) ?? finite(vitals.restingHr)
  const connectedRr = finite(vitals.respRate)
  const hasConnected = Boolean(connectedHr || connectedRr || finite(vitals.systolic) || finite(vitals.spo2Pct) || finite(vitals.bodyTempC))
  const age = vitalsAge(vitals)

  useEffect(() => {
    setPhaseIndex(0)
    setSelectedStructure('')
  }, [systemKey])

  useEffect(() => {
    if (!playing || system.phases.length < 2) return
    const id = window.setInterval(() => setPhaseIndex((current) => (current + 1) % system.phases.length), 1800)
    return () => window.clearInterval(id)
  }, [playing, system.phases.length])

  useEffect(() => {
    if (stateKey === 'connected' && !hasConnected) setStateKey('rest')
  }, [hasConnected, stateKey])

  const layers = useMemo(() => new Set<AnatomyLayer['key']>(system.layers), [system.layers])
  const motion: MotionState = {
    heartRate: stateKey === 'connected' ? (connectedHr ?? reference.heartRate) : reference.heartRate,
    respRate: stateKey === 'connected' ? (connectedRr ?? reference.respRate) : reference.respRate,
    contractionRate: systemKey === 'neuromuscular' ? reference.contractionRate : 0,
    peristalsisRate: systemKey === 'gastrointestinal' ? reference.peristalsisRate : 0,
  }

  const selectedStateNote = stateKey === 'connected'
    ? `Connected measurements${age ? ` · ${age}` : ''}. Missing variables remain explicitly educational or unavailable.`
    : reference.note

  return (
    <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[#030914] text-white shadow-[0_36px_120px_rgba(0,0,0,.30)]">
      <header className="border-b border-white/8 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-4xl">
            <div className="text-[10px] font-black uppercase tracking-[.22em] text-emerald-300">Panacea Body Physiology · 4D</div>
            <h2 className="mt-2 text-2xl font-black tracking-[-.045em] sm:text-4xl">See function, timing and physiology—not decorative pulsing.</h2>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-white/50 sm:text-sm">Each system has an anatomical focus, a named physiological cycle, explicit equations and provenance. Real connected vitals are used only where they actually exist; derived and educational values stay visibly separate.</p>
          </div>
          <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[.055] p-3 text-[10px] leading-relaxed text-white/45">
            <div className="font-black uppercase tracking-wide text-emerald-300">Current state</div>
            <div className="mt-1 max-w-sm">{selectedStateNote}</div>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          <button disabled={!hasConnected} onClick={() => setStateKey('connected')} className={`shrink-0 rounded-full border px-4 py-2 text-[10px] font-black ${stateKey === 'connected' ? 'border-emerald-300 bg-emerald-300 text-black' : 'border-white/10 text-white/50'} disabled:cursor-not-allowed disabled:opacity-30`}>Connected data</button>
          {PHYSIOLOGY_STATES.map((state) => (
            <button key={state.key} onClick={() => setStateKey(state.key)} className={`shrink-0 rounded-full border px-4 py-2 text-[10px] font-black ${stateKey === state.key ? 'border-cyan-300 bg-cyan-300 text-black' : 'border-white/10 text-white/50'}`}>{state.label}</button>
          ))}
        </div>
      </header>

      <div className="grid 2xl:grid-cols-[230px_minmax(0,1fr)_390px]">
        <aside className="border-b border-white/8 p-4 2xl:border-b-0 2xl:border-r">
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-white/28">Physiological systems</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-1">
            {PHYSIOLOGY_SYSTEMS.map((item) => (
              <button key={item.key} onClick={() => setSystemKey(item.key)} className={`rounded-2xl border p-3 text-left transition ${systemKey === item.key ? 'border-emerald-300/30 bg-emerald-300/[.08]' : 'border-white/8 bg-white/[.025] hover:bg-white/[.045]'}`}>
                <div className="text-xs font-black text-white/85">{item.label}</div>
                <div className="mt-1 text-[9px] leading-relaxed text-white/30">{item.subtitle}</div>
              </button>
            ))}
          </div>
        </aside>

        <main className="min-w-0 border-b border-white/8 2xl:border-b-0 2xl:border-r">
          <div className="relative min-h-[610px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(0,191,99,.11),transparent_35%),radial-gradient(circle_at_88%_70%,rgba(74,190,255,.08),transparent_32%)]" />
            <div className="relative h-[610px]">
              <Body3D
                layers={layers}
                highlighted={[]}
                focusKeywords={system.focusKeywords}
                renderMode="anatomy"
                ctWindow={CT_WINDOWS[0]}
                slicePlane="none"
                slicePos={0.5}
                motion={motion}
                unfold={systemKey === 'neuromuscular' ? 0.04 : 0.08}
                dissect={systemKey === 'gastrointestinal' || systemKey === 'renal' ? 2 : 1}
                onPick={(_, label) => setSelectedStructure(label)}
              />
            </div>

            <div className="pointer-events-none absolute left-4 top-4 max-w-[78%] rounded-2xl border border-white/10 bg-black/48 p-4 backdrop-blur-xl">
              <div className="text-[8px] font-black uppercase tracking-[.18em] text-emerald-300">{system.label}</div>
              <div className="mt-1 text-lg font-black">{system.subtitle}</div>
              <p className="mt-1 text-[10px] leading-relaxed text-white/42">{system.explanation}</p>
              {selectedStructure && <div className="mt-2 text-[9px] font-bold text-cyan-200">Selected: {selectedStructure}</div>}
            </div>

            <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-black/55 p-4 backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[8px] font-black uppercase tracking-[.17em] text-cyan-300">Physiological cycle</div>
                  <div className="mt-1 text-sm font-black">{system.phases[phaseIndex]}</div>
                </div>
                <button onClick={() => setPlaying((value) => !value)} className="rounded-full border border-white/10 bg-white/[.05] px-3 py-2 text-[9px] font-black text-white/60">{playing ? 'Pause cycle' : 'Play cycle'}</button>
              </div>
              <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
                {system.phases.map((phase, index) => (
                  <button key={phase} onClick={() => setPhaseIndex(index)} className={`min-w-[118px] flex-1 rounded-xl border px-2.5 py-2 text-left text-[8px] font-bold leading-snug ${index === phaseIndex ? 'border-cyan-300/35 bg-cyan-300/[.10] text-cyan-100' : 'border-white/8 bg-white/[.025] text-white/32'}`}>
                    <span className="mr-1 text-white/22">{index + 1}.</span>{phase}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>

        <aside className="space-y-4 p-4">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-white/28">Quantitative readout</div>
            <div className="mt-3"><SystemMetricGrid systemKey={systemKey} stateKey={stateKey} connected={vitals} /></div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[.025] p-4">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-[#f0d68a]">Core equations</div>
            <div className="mt-3 space-y-2">
              {system.formulae.map((item) => (
                <div key={item.name} className="rounded-xl border border-white/8 bg-black/15 p-3">
                  <div className="text-[10px] font-black text-white/70">{item.name}</div>
                  <div className="mt-1 font-mono text-[12px] font-black text-emerald-200">{item.formula}</div>
                  <p className="mt-1 text-[9px] leading-relaxed text-white/28">{item.meaning}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200/12 bg-amber-200/[.04] p-4 text-[9px] leading-relaxed text-white/35">
            <strong className="text-amber-100/80">Physiology boundary:</strong> animation is a teaching representation of timing and system relationships. It is not echocardiography, spirometry, EMG, invasive hemodynamics, renal clearance measurement or a patient-specific simulator unless those data sources are explicitly connected and validated.
          </div>
        </aside>
      </div>
    </section>
  )
}

export default PhysiologyBodyLab
