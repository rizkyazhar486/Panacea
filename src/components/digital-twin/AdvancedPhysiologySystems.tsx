import { useEffect, useMemo, useState } from 'react'
import { Body3D, CT_WINDOWS, type AnatomyLayer, type MotionState } from '../Body3D'
import { useVitals } from '../../lib/useVitals'
import { vitalsAge } from '../../lib/healthVitals'
import { PHYSIOLOGY_STATES, physiologyState, type PhysiologyStateKey } from '../../lib/bodyPhysiology'
import {
  ADVANCED_PHYSIOLOGY_SYSTEMS,
  SYSTEMIC_COUPLING,
  advancedPhysiologySystem,
  ratePressureProduct,
  type AdvancedPhysiologyProvenance,
  type AdvancedPhysiologySystemKey,
} from '../../lib/advancedPhysiology'

type DisplayState = 'connected' | PhysiologyStateKey

const PROVENANCE: Record<AdvancedPhysiologyProvenance, string> = {
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
  provenance: AdvancedPhysiologyProvenance
  detail: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.035] p-3.5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[9px] font-black uppercase tracking-[.13em] text-white/35">{label}</span>
        <span className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-wide ${PROVENANCE[provenance]}`}>{provenance}</span>
      </div>
      <div className="mt-2 text-xl font-black tabular-nums text-white sm:text-2xl">
        {value}{unit && <span className="ml-1 text-[10px] font-bold text-white/35">{unit}</span>}
      </div>
      <p className="mt-1 text-[9px] leading-relaxed text-white/35">{detail}</p>
    </div>
  )
}

function AdvancedMetrics({ systemKey, stateKey, connected }: {
  systemKey: AdvancedPhysiologySystemKey
  stateKey: DisplayState
  connected: ReturnType<typeof useVitals>
}) {
  const useConnected = stateKey === 'connected'
  const ref = physiologyState(useConnected ? 'rest' : stateKey)
  const hrMeasured = finite(connected.heartRate) ?? finite(connected.restingHr)
  const hrvMeasured = finite(connected.hrvMs)
  const sbpMeasured = finite(connected.systolic)
  const dbpMeasured = finite(connected.diastolic)
  const spo2Measured = finite(connected.spo2Pct)
  const basalMeasured = finite(connected.bmrKcal) ?? finite(connected.basalKcal)
  const activeMeasured = finite(connected.activeKcal)
  const fatMeasured = finite(connected.bodyFatPct)

  if (systemKey === 'endocrine') {
    return (
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Fasting glucose" value="—" provenance="unavailable" detail="Requires an actual fasting glucose measurement; no value is inferred from wearables." />
        <Metric label="Fasting insulin" value="—" provenance="unavailable" detail="Required for HOMA-IR; Panacea does not fabricate insulin concentration." />
        <Metric label="Basal energy context" value={useConnected && basalMeasured ? Math.round(basalMeasured) : '—'} unit={useConnected && basalMeasured ? 'kcal/day' : undefined} provenance={useConnected && basalMeasured ? 'measured' : 'unavailable'} detail="Shown only when a connected source provides a basal/BMR estimate; not a thyroid test." />
        <Metric label="Hormone feedback" value="Control loop" provenance="educational" detail="Hypothalamus/pituitary/gland/target feedback is shown structurally, not as patient hormone concentrations." />
      </div>
    )
  }

  if (systemKey === 'hepatic-metabolic') {
    return (
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Basal energy" value={useConnected && basalMeasured ? Math.round(basalMeasured) : '—'} unit={useConnected && basalMeasured ? 'kcal/day' : undefined} provenance={useConnected && basalMeasured ? 'measured' : 'unavailable'} detail="Connected estimate if available; metabolic flux is not inferred from it." />
        <Metric label="Active energy" value={useConnected && activeMeasured ? Math.round(activeMeasured) : '—'} unit={useConnected && activeMeasured ? 'kcal' : undefined} provenance={useConnected && activeMeasured ? 'measured' : 'unavailable'} detail="Connected activity energy only; not hepatic glucose output." />
        <Metric label="Body fat" value={useConnected && fatMeasured ? fatMeasured.toFixed(1) : '—'} unit={useConnected && fatMeasured ? '%' : undefined} provenance={useConnected && fatMeasured ? 'measured' : 'unavailable'} detail="Body-composition context when connected; it is not a liver-fat measurement." />
        <Metric label="RER" value="—" provenance="unavailable" detail="V̇CO₂/V̇O₂ requires measured respiratory gases; heart rate is not substituted." />
      </div>
    )
  }

  if (systemKey === 'hematology-immune') {
    return (
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="SpO₂ context" value={useConnected && spo2Measured ? Math.round(spo2Measured) : '—'} unit={useConnected && spo2Measured ? '%' : undefined} provenance={useConnected && spo2Measured ? 'measured' : 'unavailable'} detail="Pulse-oximeter context only; it does not provide hemoglobin concentration or full arterial O₂ content." />
        <Metric label="Hemoglobin" value="—" provenance="unavailable" detail="Requires a measured CBC or equivalent laboratory source." />
        <Metric label="Arterial O₂ content" value="—" provenance="unavailable" detail="CaO₂ is not calculated without hemoglobin and appropriate oxygen measurements." />
        <Metric label="CBC / immune cells" value="—" provenance="unavailable" detail="WBC differential, platelets and immune-cell counts remain absent until real laboratory data are connected." />
      </div>
    )
  }

  if (systemKey === 'autonomic') {
    const hr = useConnected ? (hrMeasured ?? ref.heartRate) : ref.heartRate
    const sbp = useConnected ? (sbpMeasured ?? ref.systolic) : ref.systolic
    const dbp = useConnected ? (dbpMeasured ?? ref.diastolic) : ref.diastolic
    const rpp = ratePressureProduct(hr, sbp)
    const bpMeasured = Boolean(useConnected && sbpMeasured && dbpMeasured)
    const rppProvenance: AdvancedPhysiologyProvenance = useConnected && hrMeasured && sbpMeasured ? 'derived' : 'educational'
    return (
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Heart rate" value={Math.round(hr)} unit="bpm" provenance={useConnected && hrMeasured ? 'measured' : 'educational'} detail={useConnected && hrMeasured ? 'Connected heart-rate signal.' : 'Selected educational state.'} />
        <Metric label="HRV" value={useConnected && hrvMeasured ? Math.round(hrvMeasured) : '—'} unit={useConnected && hrvMeasured ? 'ms' : undefined} provenance={useConnected && hrvMeasured ? 'measured' : 'unavailable'} detail="HRV is shown only when connected; no sympathetic/parasympathetic percentage is inferred from it." />
        <Metric label="Blood pressure" value={`${Math.round(sbp)}/${Math.round(dbp)}`} unit="mmHg" provenance={bpMeasured ? 'measured' : 'educational'} detail={bpMeasured ? 'Connected blood pressure.' : 'Selected educational state.'} />
        <Metric label="Rate-pressure product" value={rpp ? Math.round(rpp).toLocaleString() : '—'} unit="bpm·mmHg" provenance={rppProvenance} detail="HR × SBP. Cardiovascular workload context only; not a direct autonomic-tone measurement." />
      </div>
    )
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Individual reproductive state" value="—" provenance="unavailable" detail="No cycle, ovulation, fertility or gonadal state is inferred without explicit relevant context." />
      <Metric label="LH / FSH" value="—" provenance="unavailable" detail="Requires laboratory measurement when clinically indicated." />
      <Metric label="Sex steroids" value="—" provenance="unavailable" detail="Testosterone, estradiol and progesterone are never synthesized from unrelated wearables." />
      <Metric label="HPG axis" value="Process map" provenance="educational" detail="GnRH → LH/FSH → gonadal function → feedback is visualized without assuming sex or cycle phase." />
    </div>
  )
}

export function AdvancedPhysiologySystems() {
  const vitals = useVitals()
  const [systemKey, setSystemKey] = useState<AdvancedPhysiologySystemKey>('endocrine')
  const [stateKey, setStateKey] = useState<DisplayState>('rest')
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [selectedStructure, setSelectedStructure] = useState('')

  const system = advancedPhysiologySystem(systemKey)
  const reference = physiologyState(stateKey === 'connected' ? 'rest' : stateKey)
  const connectedHr = finite(vitals.heartRate) ?? finite(vitals.restingHr)
  const connectedRr = finite(vitals.respRate)
  const hasConnected = Boolean(
    connectedHr || connectedRr || finite(vitals.systolic) || finite(vitals.hrvMs) ||
    finite(vitals.spo2Pct) || finite(vitals.bmrKcal) || finite(vitals.basalKcal) ||
    finite(vitals.activeKcal) || finite(vitals.bodyFatPct),
  )
  const age = vitalsAge(vitals)

  useEffect(() => {
    setPhaseIndex(0)
    setSelectedStructure('')
  }, [systemKey])

  useEffect(() => {
    if (!playing || system.phases.length < 2) return
    const id = window.setInterval(() => setPhaseIndex((current) => (current + 1) % system.phases.length), 2200)
    return () => window.clearInterval(id)
  }, [playing, system.phases.length])

  useEffect(() => {
    if (stateKey === 'connected' && !hasConnected) setStateKey('rest')
  }, [hasConnected, stateKey])

  const layers = useMemo(
    () => new Set<AnatomyLayer['key']>(system.layers as AnatomyLayer['key'][]),
    [system.layers],
  )

  const motion: MotionState = {
    heartRate: stateKey === 'connected' ? (connectedHr ?? reference.heartRate) : reference.heartRate,
    respRate: stateKey === 'connected' ? (connectedRr ?? reference.respRate) : reference.respRate,
    contractionRate: 0,
    peristalsisRate: systemKey === 'hepatic-metabolic' ? Math.max(0, reference.peristalsisRate * 0.4) : 0,
  }

  const stateNote = stateKey === 'connected'
    ? `Connected context${age ? ` · ${age}` : ''}. Only variables actually present are marked measured.`
    : physiologyState(stateKey).note

  return (
    <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[#040811] text-white shadow-[0_30px_110px_rgba(0,0,0,.28)]">
      <header className="border-b border-white/8 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-4xl">
            <div className="text-[10px] font-black uppercase tracking-[.22em] text-violet-300">Integrated physiology · control systems</div>
            <h2 className="mt-2 text-2xl font-black tracking-[-.045em] sm:text-3xl">Endocrine, metabolic, immune, autonomic and reproductive physiology</h2>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-white/50 sm:text-sm">These systems are primarily regulatory networks, not things that should visibly “pulse.” The 3D anatomy therefore provides spatial context while the phase timeline explains signaling, feedback and transport. Missing hormones and laboratory values stay explicitly unavailable.</p>
          </div>
          <div className="rounded-2xl border border-violet-300/15 bg-violet-300/[.055] p-3 text-[10px] leading-relaxed text-white/45">
            <div className="font-black uppercase tracking-wide text-violet-300">Provenance rule</div>
            <div className="mt-1 max-w-sm">{stateNote}</div>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          <button disabled={!hasConnected} onClick={() => setStateKey('connected')} className={`shrink-0 rounded-full border px-4 py-2 text-[10px] font-black ${stateKey === 'connected' ? 'border-emerald-300 bg-emerald-300 text-black' : 'border-white/10 text-white/50'} disabled:cursor-not-allowed disabled:opacity-30`}>Connected data</button>
          {PHYSIOLOGY_STATES.map((state) => (
            <button key={state.key} onClick={() => setStateKey(state.key)} className={`shrink-0 rounded-full border px-4 py-2 text-[10px] font-black ${stateKey === state.key ? 'border-violet-300 bg-violet-300 text-black' : 'border-white/10 text-white/50'}`}>{state.label}</button>
          ))}
        </div>
      </header>

      <div className="grid 2xl:grid-cols-[250px_minmax(0,1fr)_410px]">
        <aside className="border-b border-white/8 p-4 2xl:border-b-0 2xl:border-r">
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-white/28">Regulatory systems</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-1">
            {ADVANCED_PHYSIOLOGY_SYSTEMS.map((item) => (
              <button key={item.key} onClick={() => setSystemKey(item.key)} className={`rounded-2xl border p-3 text-left transition ${systemKey === item.key ? 'border-violet-300/30 bg-violet-300/[.08]' : 'border-white/8 bg-white/[.025] hover:bg-white/[.045]'}`}>
                <div className="text-xs font-black text-white/85">{item.label}</div>
                <div className="mt-1 text-[9px] leading-relaxed text-white/30">{item.subtitle}</div>
              </button>
            ))}
          </div>
        </aside>

        <main className="min-w-0 border-b border-white/8 2xl:border-b-0 2xl:border-r">
          <div className="relative min-h-[560px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_18%,rgba(139,92,246,.12),transparent_36%),radial-gradient(circle_at_88%_75%,rgba(0,191,99,.06),transparent_32%)]" />
            <div className="relative h-[560px]">
              <Body3D
                layers={layers}
                highlighted={[]}
                focusKeywords={system.focusKeywords}
                renderMode="anatomy"
                ctWindow={CT_WINDOWS[0]}
                slicePlane="none"
                slicePos={0.5}
                motion={motion}
                unfold={systemKey === 'hematology-immune' ? 0.1 : 0.06}
                dissect={systemKey === 'endocrine' || systemKey === 'reproductive' || systemKey === 'hepatic-metabolic' ? 2 : 1}
                onPick={(_, label) => setSelectedStructure(label)}
              />
            </div>

            <div className="pointer-events-none absolute left-4 top-4 max-w-[78%] rounded-2xl border border-white/10 bg-black/48 p-4 backdrop-blur-xl">
              <div className="text-[9px] font-black uppercase tracking-[.17em] text-violet-300">{system.label}</div>
              <div className="mt-1 text-sm font-black text-white/90">{system.phases[phaseIndex]}</div>
              <div className="mt-1 text-[9px] leading-relaxed text-white/40">{system.explanation}</div>
            </div>

            {selectedStructure && (
              <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl border border-white/10 bg-black/55 px-3 py-2 text-[10px] font-bold text-white/65 backdrop-blur-xl">
                Selected anatomy · {selectedStructure}
              </div>
            )}
          </div>
        </main>

        <aside className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.16em] text-white/28">Physiological cycle</div>
              <div className="mt-1 text-sm font-black text-white/85">{system.subtitle}</div>
            </div>
            <button onClick={() => setPlaying((value) => !value)} className="rounded-full border border-white/10 px-3 py-2 text-[9px] font-black text-white/55 hover:bg-white/[.05]">{playing ? 'Pause' : 'Play'}</button>
          </div>

          <div className="mt-4 space-y-2">
            {system.phases.map((phase, index) => (
              <button key={phase} onClick={() => { setPhaseIndex(index); setPlaying(false) }} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${phaseIndex === index ? 'border-violet-300/30 bg-violet-300/[.08]' : 'border-white/8 bg-white/[.02]'}`}>
                <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[8px] font-black ${phaseIndex === index ? 'bg-violet-300 text-black' : 'bg-white/8 text-white/35'}`}>{index + 1}</span>
                <span className="text-[10px] font-bold leading-relaxed text-white/60">{phase}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 text-[9px] font-black uppercase tracking-[.16em] text-white/28">Equations / constraints</div>
          <div className="mt-2 space-y-2">
            {system.formulae.map((formula) => (
              <div key={formula.name} className="rounded-xl border border-white/8 bg-white/[.025] p-3">
                <div className="text-[9px] font-black text-white/70">{formula.name}</div>
                <div className="mt-1 font-mono text-[10px] text-violet-200">{formula.formula}</div>
                <div className="mt-1 text-[9px] leading-relaxed text-white/32">{formula.meaning}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-amber-200/10 bg-amber-200/[.035] p-3">
            <div className="text-[8px] font-black uppercase tracking-wide text-amber-100/70">Requires real measurement for personalization</div>
            <div className="mt-1 text-[9px] leading-relaxed text-white/35">{system.requiredMeasurements.join(' · ')}</div>
          </div>
        </aside>
      </div>

      <div className="border-t border-white/8 p-4 sm:p-5">
        <div className="text-[9px] font-black uppercase tracking-[.18em] text-white/28">Observable and unavailable metrics</div>
        <div className="mt-3"><AdvancedMetrics systemKey={systemKey} stateKey={stateKey} connected={vitals} /></div>
      </div>

      <div className="border-t border-white/8 p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-white/28">Whole-body coupling</div>
            <div className="mt-1 text-sm font-black text-white/80">How regulatory systems shift across physiological states</div>
          </div>
          <div className="text-[9px] text-white/28">Directional educational context · not patient prediction</div>
        </div>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-white/8">
          <table className="min-w-[900px] w-full border-collapse text-left text-[9px]">
            <thead className="bg-white/[.035] text-white/40">
              <tr>
                <th className="px-3 py-2 font-black uppercase tracking-wide">Coupling</th>
                <th className="px-3 py-2 font-black uppercase tracking-wide">Rest</th>
                <th className="px-3 py-2 font-black uppercase tracking-wide">Exercise</th>
                <th className="px-3 py-2 font-black uppercase tracking-wide">Recovery</th>
                <th className="px-3 py-2 font-black uppercase tracking-wide">Sleep</th>
              </tr>
            </thead>
            <tbody>
              {SYSTEMIC_COUPLING.map((row) => (
                <tr key={row.label} className="border-t border-white/8 text-white/45">
                  <td className="px-3 py-2 font-black text-white/65">{row.label}</td>
                  <td className="px-3 py-2">{row.rest}</td>
                  <td className="px-3 py-2">{row.exercise}</td>
                  <td className="px-3 py-2">{row.recovery}</td>
                  <td className="px-3 py-2">{row.sleep}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default AdvancedPhysiologySystems
