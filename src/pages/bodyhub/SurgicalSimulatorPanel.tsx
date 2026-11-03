import { useMemo, useState } from 'react'
import {
  SURGICAL_SIMULATION_PROCEDURES,
  applySurgicalSimulationAction,
  createSurgicalSimulationState,
  currentSurgicalPhase,
  getSurgicalProcedure,
  surgicalSimulationProgress,
  type SurgicalAction,
  type SurgicalProcedureId,
  type SurgicalToolClass,
} from '../../lib/surgicalSimulation'
import {
  calculateLaparoscopicErgonomics,
  evaluatePneumoperitoneumHemodynamics,
  evaluateDiathermyEnergyDelivery,
  evaluateStrasbergCriticalViewOfSafety,
  evaluateOsatsCompetency,
  type OsatsDimensionScore,
} from '../../domains/surgical/index.ts'

export interface SurgicalSimulatorPanelProps {
  onSorot?: (names: string[]) => void
  onKedalaman?: (depth: number) => void
}

const ACTIONS: Array<{ id: SurgicalAction; label: string }> = [
  { id: 'orient', label: 'Orient' }, { id: 'identify', label: 'Identify' }, { id: 'access', label: 'Access' },
  { id: 'expose', label: 'Expose' }, { id: 'prepare', label: 'Prepare' }, { id: 'connect', label: 'Connect' },
  { id: 'control', label: 'Control' }, { id: 'divide', label: 'Divide' }, { id: 'deliver', label: 'Deliver' },
  { id: 'retrieve', label: 'Retrieve' }, { id: 'tunnel', label: 'Tunnel' }, { id: 'verify', label: 'Verify' },
  { id: 'close', label: 'Close' },
]

const TOOLS: Array<{ id: SurgicalToolClass; label: string }> = [
  { id: 'none', label: 'Observe' }, { id: 'scalpel', label: 'Scalpel' }, { id: 'forceps', label: 'Forceps' },
  { id: 'retractor', label: 'Retractor' }, { id: 'needle-holder', label: 'Needle holder' }, { id: 'suction', label: 'Suction' },
  { id: 'energy', label: 'Energy' }, { id: 'laparoscope', label: 'Laparoscope' }, { id: 'vascular-clamp', label: 'Vascular clamp' },
  { id: 'drill', label: 'Drill' }, { id: 'shunt-system', label: 'Shunt system' },
]

function depthForPhase(index: number, total: number) {
  return total <= 1 ? 0 : Math.round((index / (total - 1)) * 5)
}

type SimulatorSubTab = 'workflow' | 'ergonomics' | 'hemodynamics' | 'energy' | 'cvs' | 'osats'

export function SurgicalSimulatorPanel({ onSorot, onKedalaman }: SurgicalSimulatorPanelProps) {
  const [activeTab, setActiveTab] = useState<SimulatorSubTab>('workflow')
  const [procedureId, setProcedureId] = useState<SurgicalProcedureId>('cabg')
  const [state, setState] = useState(() => createSurgicalSimulationState('cabg'))
  const [tool, setTool] = useState<SurgicalToolClass>('none')
  const procedure = useMemo(() => getSurgicalProcedure(procedureId), [procedureId])
  const phase = currentSurgicalPhase(state)
  const progress = surgicalSimulationProgress(state)

  const [leftPortX, setLeftPortX] = useState(-60)
  const [rightPortX, setRightPortX] = useState(60)
  const [targetDepthZ, setTargetDepthZ] = useState(0)
  const [cameraY, setCameraY] = useState(-150)

  const ergonomics = useMemo(() => calculateLaparoscopicErgonomics({
    targetMm: { x: 0, y: 0, z: targetDepthZ },
    cameraPortMm: { x: 0, y: cameraY, z: 80 },
    leftPortMm: { x: leftPortX, y: -100, z: 50 },
    rightPortMm: { x: rightPortX, y: -100, z: 50 },
  }), [leftPortX, rightPortX, targetDepthZ, cameraY])

  const [iapMmHg, setIapMmHg] = useState(12)
  const [durationMin, setDurationMin] = useState(45)
  const [trendelenburgAngle, setTrendelenburgAngle] = useState(10)

  const hemodynamics = useMemo(() => evaluatePneumoperitoneumHemodynamics({
    intraAbdominalPressureMmHg: iapMmHg,
    baselineCardiacOutputLMin: 5.0,
    baselineMeanArterialPressureMmHg: 90,
    durationMinutes: durationMin,
    patientTrendelenburgAngleDeg: trendelenburgAngle,
  }), [iapMmHg, durationMin, trendelenburgAngle])

  const [diathermyPower, setDiathermyPower] = useState(30)
  const [diathermyMode, setDiathermyMode] = useState<'monopolar-cut' | 'monopolar-coag' | 'bipolar-coag' | 'ultrasonic'>('monopolar-coag')
  const [burstDuration, setBurstDuration] = useState(2.0)
  const [distToAdjacentMm, setDistToAdjacentMm] = useState(3.5)

  const energyResult = useMemo(() => evaluateDiathermyEnergyDelivery({
    powerWatts: diathermyPower,
    mode: diathermyMode,
    burstDurationSeconds: burstDuration,
    distanceToAdjacentVulnerableStructureMm: distToAdjacentMm,
    structureLabel: 'Common Bile Duct / Ureter',
  }), [diathermyPower, diathermyMode, burstDuration, distToAdjacentMm])

  const [cvsHepatocystic, setCvsHepatocystic] = useState(true)
  const [cvsCysticPlate, setCvsCysticPlate] = useState(true)
  const [cvsTwoStructures, setCvsTwoStructures] = useState(true)
  const [cvsInfundibular, setCvsInfundibular] = useState(true)
  const [cvsCbdIdentified, setCvsCbdIdentified] = useState(true)

  const cvsResult = useMemo(() => evaluateStrasbergCriticalViewOfSafety({
    hepatocysticTriangleCleared: cvsHepatocystic,
    cysticPlateExposed: cvsCysticPlate,
    twoAndOnlyTwoStructuresVisible: cvsTwoStructures,
    infundibularTractionApplied: cvsInfundibular,
    commonBileDuctIdentified: cvsCbdIdentified,
  }), [cvsHepatocystic, cvsCysticPlate, cvsTwoStructures, cvsInfundibular, cvsCbdIdentified])

  const [osatsScores, setOsatsScores] = useState<Record<string, number>>({
    'respect-for-tissue': 4, 'time-and-motion': 3, 'instrument-handling': 4,
    'knowledge-of-instruments': 4, 'flow-of-operation': 3, 'use-of-assistants': 4, 'knowledge-of-procedure': 4,
  })

  const osatsResult = useMemo(() => {
    const formatted: OsatsDimensionScore[] = Object.entries(osatsScores).map(([dimension, score]) => ({
      dimension: dimension as OsatsDimensionScore['dimension'],
      score: Math.max(1, Math.min(5, score)) as OsatsDimensionScore['score'],
      evidenceNotes: `Score ${score} recorded in rehearsal`,
    }))
    return evaluateOsatsCompetency({ candidateId: 'learner-fellow-01', procedureId, scores: formatted })
  }, [osatsScores, procedureId])

  function chooseProcedure(next: SurgicalProcedureId) {
    setProcedureId(next); setState(createSurgicalSimulationState(next)); setTool('none')
    onSorot?.([]); onKedalaman?.(0)
  }

  function runAction(action: SurgicalAction) {
    const next = applySurgicalSimulationAction(state, action, tool)
    setState(next)
    const active = currentSurgicalPhase(next)
    onSorot?.(active.focus)
    onKedalaman?.(depthForPhase(next.phaseIndex, getSurgicalProcedure(next.procedureId).phases.length))
  }

  function reset() {
    setState(createSurgicalSimulationState(procedureId)); setTool('none')
    onSorot?.([]); onKedalaman?.(0)
  }

  return (
    <section className="dark overflow-hidden rounded-2xl border border-cyan-300/15 bg-[#02070b] text-white">
      <div className="border-b border-white/10 bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,.16),transparent_35%),radial-gradient(circle_at_85%_0%,rgba(139,92,246,.12),transparent_30%)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-200/80">Interactive surgery simulator · runtime v2</div>
            <h3 className="mt-1 text-lg font-black">Procedural Environment, Biomechanics &amp; OSATS Telemetry</h3>
          </div>
          <button type="button" onClick={reset} className="min-h-10 rounded-full border border-white/15 px-3 text-[10px] font-black text-white/75 hover:bg-white/10">Reset</button>
        </div>
        <p className="mt-1.5 max-w-4xl text-[10px] leading-relaxed text-white/55">
          Body Exposure 3D is the anatomy canvas; simulator drives procedural workflow, laparoscopic port geometry, electrosurgical physics, Strasberg CVS verification, and OSATS competency assessment.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
          {[
            { id: 'workflow', label: '1. Procedure Workflow' },
            { id: 'ergonomics', label: '2. Port Ergonomics' },
            { id: 'hemodynamics', label: '3. Pneumoperitoneum' },
            { id: 'energy', label: '4. Diathermy Physics' },
            { id: 'cvs', label: '5. Strasberg CVS' },
            { id: 'osats', label: '6. OSATS Scorecard' },
          ].map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id as SimulatorSubTab)}
              style={{
                minHeight: '30px', borderRadius: '9999px', padding: '4px 10px', fontSize: '9px', fontWeight: 800,
                border: activeTab === tab.id ? '1px solid #22d3ee' : '1px solid rgba(255,255,255,0.12)',
                backgroundColor: activeTab === tab.id ? '#22d3ee' : 'rgba(255,255,255,0.04)',
                color: activeTab === tab.id ? '#000000' : 'rgba(255,255,255,0.7)', cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {activeTab === 'workflow' && (
          <>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1" aria-label="Surgical simulator procedures">
              {SURGICAL_SIMULATION_PROCEDURES.map((item) => (
                <button key={item.id} type="button" aria-pressed={item.id === procedureId} onClick={() => chooseProcedure(item.id)}
                  className={'min-h-10 shrink-0 rounded-full border px-3 text-[10px] font-black transition ' + (item.id === procedureId ? 'border-cyan-200 bg-cyan-200 text-black' : 'border-white/10 bg-white/[.035] text-white/65 hover:border-white/20 hover:text-white')}>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="rounded-2xl border border-white/10 bg-white/[.025] p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-200/70">{procedure.specialty} · {procedure.region}</div>
                    <div className="mt-0.5 text-base font-black">{procedure.label}</div>
                  </div>
                  <span className="rounded-full border border-violet-300/20 bg-violet-300/[.07] px-2 py-1 text-[8px] font-black uppercase tracking-[.14em] text-violet-200">{procedure.scene}</span>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-white/55">{procedure.goal}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-cyan-300 transition-[width]" style={{ width: String(progress) + '%' }} />
                </div>
                <div className="mt-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[.045] p-3">
                  <div className="text-[8px] font-black uppercase tracking-[.16em] text-cyan-200/70">Phase {state.phaseIndex + 1} / {procedure.phases.length}</div>
                  <div className="mt-0.5 text-sm font-black">{state.completed ? 'Simulation complete' : phase.label}</div>
                  <p className="mt-2 text-[10px] leading-relaxed text-white/70">{state.completed ? 'Review telemetry, replay the case, or switch procedure.' : phase.objective}</p>
                  {!state.completed && (
                    <>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-lg border border-white/10 bg-black/20 p-2.5">
                          <div className="text-[8px] font-black uppercase tracking-[.14em] text-white/40">Anatomy focus</div>
                          <div className="mt-1 text-[10px] leading-relaxed text-white/70">{phase.focus.join(' · ')}</div>
                          <button type="button" onClick={() => onSorot?.(phase.focus)} className="mt-2 min-h-9 rounded-full border border-cyan-300/20 px-2.5 text-[9px] font-black text-cyan-200">Highlight on shared 3D body</button>
                        </div>
                        <div className="rounded-lg border border-rose-300/10 bg-rose-300/[.035] p-2.5">
                          <div className="text-[8px] font-black uppercase tracking-[.14em] text-rose-200/70">Structures / states at risk</div>
                          <div className="mt-1 text-[10px] leading-relaxed text-white/60">{phase.hazards.join(' · ')}</div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-[8px] font-black uppercase tracking-[.14em] text-white/40">Tool class</div>
                        <div className="no-scrollbar mt-1.5 flex gap-1.5 overflow-x-auto pb-1">
                          {TOOLS.map((item) => (
                            <button key={item.id} type="button" aria-pressed={tool === item.id} onClick={() => setTool(item.id)}
                              className={'min-h-9 shrink-0 rounded-full border px-2.5 text-[9px] font-bold ' + (tool === item.id ? 'border-white bg-white text-black' : 'border-white/10 text-white/55')}>
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-[8px] font-black uppercase tracking-[.14em] text-white/40">Simulator action</div>
                        <div className="mt-1.5 grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                          {ACTIONS.map((item) => (
                            <button key={item.id} type="button" onClick={() => runAction(item.id)}
                              className="min-h-10 rounded-xl border border-white/10 bg-white/[.035] px-2 text-[9px] font-black text-white/70 hover:border-cyan-300/30 hover:bg-cyan-300/[.06] hover:text-white active:scale-[.98]">
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  <div className={'mt-3 rounded-lg border p-2.5 text-[10px] leading-relaxed ' + (state.completed ? 'border-emerald-300/20 bg-emerald-300/[.05] text-emerald-100' : 'border-white/10 bg-black/20 text-white/60')}>{state.feedback}</div>
                </div>
              </div>
              <aside className="space-y-2">
                <div className="rounded-2xl border border-white/10 bg-white/[.025] p-3">
                  <div className="text-[8px] font-black uppercase tracking-[.16em] text-white/40">Live telemetry</div>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {[['Safety', state.safetyScore], ['Accuracy', state.accuracyScore], ['Efficiency', state.efficiencyScore]].map(([label, value]) => (
                      <div key={String(label)} className="rounded-xl border border-white/10 bg-black/20 p-2 text-center">
                        <div className="text-base font-black">{value}</div>
                        <div className="text-[8px] font-bold uppercase tracking-wide text-white/35">{label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-[9px] text-white/45">Correct actions {state.correctActions} · Attempts {state.attempts}</div>
                </div>
                <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[.04] p-3">
                  <div className="text-[8px] font-black uppercase tracking-[.16em] text-amber-200/75">Fidelity boundary</div>
                  <p className="mt-1 text-[9px] leading-relaxed text-white/50">{procedure.evidenceBoundary}</p>
                </div>
              </aside>
            </div>
          </>
        )}

        {activeTab === 'ergonomics' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#22d3ee' }}>Port Geometry Parameters (Hanna 1997)</div>
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}><span>Left Port X</span><span style={{ color: '#22d3ee' }}>{leftPortX} mm</span></div>
                  <input type="range" min="-120" max="-20" step="5" value={leftPortX} onChange={(e) => setLeftPortX(Number(e.target.value))} style={{ width: '100%', accentColor: '#22d3ee' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}><span>Right Port X</span><span style={{ color: '#22d3ee' }}>{rightPortX} mm</span></div>
                  <input type="range" min="20" max="120" step="5" value={rightPortX} onChange={(e) => setRightPortX(Number(e.target.value))} style={{ width: '100%', accentColor: '#22d3ee' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}><span>Target Depth Z</span><span style={{ color: '#22d3ee' }}>{targetDepthZ} mm</span></div>
                  <input type="range" min="-50" max="50" step="5" value={targetDepthZ} onChange={(e) => setTargetDepthZ(Number(e.target.value))} style={{ width: '100%', accentColor: '#22d3ee' }} />
                </div>
              </div>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#a78bfa' }}>Biomechanical Ergonomics Feedback</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)' }}>Triangulation</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: ergonomics.collisionRisk ? '#f43f5e' : '#22d3ee' }}>{ergonomics.triangulationAngleDeg}°</div>
                </div>
                <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)' }}>Quality</div>
                  <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'capitalize', color: ergonomics.collisionRisk ? '#f43f5e' : '#34d399' }}>{ergonomics.ergonomicQuality}</div>
                </div>
              </div>
              <div style={{ marginTop: '10px', padding: '10px', borderRadius: '10px', backgroundColor: ergonomics.collisionRisk ? 'rgba(244,63,94,0.1)' : 'rgba(34,211,238,0.1)' }}>
                <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.3' }}>{ergonomics.feedback}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hemodynamics' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#22d3ee' }}>Insufflation Pressure (IAP)</div>
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}><span>IAP Pressure</span><span style={{ color: iapMmHg > 15 ? '#f43f5e' : '#22d3ee' }}>{iapMmHg} mmHg</span></div>
                  <input type="range" min="8" max="20" step="1" value={iapMmHg} onChange={(e) => setIapMmHg(Number(e.target.value))} style={{ width: '100%', accentColor: '#22d3ee' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}><span>Duration</span><span style={{ color: '#fcd34d' }}>{durationMin} min</span></div>
                  <input type="range" min="15" max="240" step="15" value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} style={{ width: '100%', accentColor: '#fcd34d' }} />
                </div>
              </div>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#f59e0b' }}>Physiological Response</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)' }}>Cardiac Output</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: hemodynamics.cardiacOutputDeltaPercent < -15 ? '#f43f5e' : '#34d399' }}>{hemodynamics.adjustedCardiacOutputLMin} L/min</div>
                </div>
                <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)' }}>Hypercapnia</div>
                  <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'capitalize', color: hemodynamics.hypercapniaRiskTier === 'critical' ? '#f43f5e' : '#34d399' }}>{hemodynamics.hypercapniaRiskTier}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'energy' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#22d3ee' }}>Diathermy Energy Delivery</div>
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                  {(['monopolar-coag', 'monopolar-cut', 'bipolar-coag', 'ultrasonic'] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setDiathermyMode(m)} style={{ padding: '4px', borderRadius: '6px', fontSize: '8px', fontWeight: 700, border: diathermyMode === m ? '1px solid #22d3ee' : '1px solid rgba(255,255,255,0.1)', backgroundColor: diathermyMode === m ? 'rgba(34,211,238,0.2)' : 'transparent', color: '#ffffff', cursor: 'pointer' }}>{m.replace('-', ' ')}</button>
                  ))}
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}><span>Power (Watts)</span><span style={{ color: '#f59e0b' }}>{diathermyPower} W</span></div>
                  <input type="range" min="10" max="60" step="5" value={diathermyPower} onChange={(e) => setDiathermyPower(Number(e.target.value))} style={{ width: '100%', accentColor: '#f59e0b' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}><span>Burst Duration</span><span style={{ color: burstDuration > 3.5 ? '#f43f5e' : '#22d3ee' }}>{burstDuration.toFixed(1)} s</span></div>
                  <input type="range" min="0.5" max="6.0" step="0.5" value={burstDuration} onChange={(e) => setBurstDuration(Number(e.target.value))} style={{ width: '100%', accentColor: '#22d3ee' }} />
                </div>
              </div>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#f43f5e' }}>Thermal Lateral Spread</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)' }}>Spread Radius</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#fcd34d' }}>{energyResult.estimatedLateralThermalSpreadMm} mm</div>
                </div>
                <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)' }}>Safe Margin</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: energyResult.collateralThermalHazard ? '#f43f5e' : '#34d399' }}>{energyResult.safeClearanceMarginMm} mm</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cvs' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#22d3ee' }}>Strasberg CVS Criteria (1995)</div>
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: '1. Hepatocystic triangle cleared of fat/fibrous tissue', val: cvsHepatocystic, set: setCvsHepatocystic },
                  { label: '2. Lower third of gallbladder dissected off liver bed', val: cvsCysticPlate, set: setCvsCysticPlate },
                  { label: '3. Two & only two structures seen entering gallbladder', val: cvsTwoStructures, set: setCvsTwoStructures },
                ].map((crit, idx) => (
                  <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px', color: '#ffffff', cursor: 'pointer' }}>
                    <input type="checkbox" checked={crit.val} onChange={(e) => crit.set(e.target.checked)} style={{ accentColor: '#22d3ee' }} />
                    <span>{crit.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#a78bfa' }}>Clipping Safety Gate</div>
              <div style={{ marginTop: '10px', padding: '12px', borderRadius: '10px', backgroundColor: cvsResult.cvsAchieved ? 'rgba(52,211,153,0.1)' : 'rgba(244,63,94,0.1)' }}>
                <div style={{ fontSize: '12px', fontWeight: 900, color: cvsResult.cvsAchieved ? '#34d399' : '#f43f5e' }}>
                  {cvsResult.cvsAchieved ? '✓ CVS ACHIEVED — Safe to Clip' : '🚫 CVS NOT ACHIEVED — Clipping Blocked'}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'osats' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#22d3ee' }}>OSATS 7 Dimensions (Martin 1997)</div>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {Object.keys(osatsScores).map((dim) => (
                  <div key={dim} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px' }}>
                    <span style={{ textTransform: 'capitalize' }}>{dim.replace(/-/g, ' ')}</span>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button key={v} type="button" onClick={() => setOsatsScores((prev) => ({ ...prev, [dim]: v }))}
                          style={{ width: '20px', height: '20px', borderRadius: '4px', fontSize: '8px', fontWeight: 800, border: osatsScores[dim] === v ? '1px solid #22d3ee' : '1px solid rgba(255,255,255,0.1)', backgroundColor: osatsScores[dim] === v ? '#22d3ee' : 'transparent', color: osatsScores[dim] === v ? '#000000' : 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#a78bfa' }}>OSATS Assessment Score</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)' }}>Total Score</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#22d3ee' }}>{osatsResult.totalScore} / 35</div>
                </div>
                <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)' }}>Tier</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#34d399' }}>{osatsResult.competencyTier}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default SurgicalSimulatorPanel
