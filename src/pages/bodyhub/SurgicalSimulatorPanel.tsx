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

export function SurgicalSimulatorPanel({ onSorot, onKedalaman }: SurgicalSimulatorPanelProps) {
  const [procedureId, setProcedureId] = useState<SurgicalProcedureId>('cabg')
  const [state, setState] = useState(() => createSurgicalSimulationState('cabg'))
  const [tool, setTool] = useState<SurgicalToolClass>('none')
  const procedure = useMemo(() => getSurgicalProcedure(procedureId), [procedureId])
  const phase = currentSurgicalPhase(state)
  const progress = surgicalSimulationProgress(state)

  function chooseProcedure(next: SurgicalProcedureId) {
    setProcedureId(next)
    setState(createSurgicalSimulationState(next))
    setTool('none')
    onSorot?.([])
    onKedalaman?.(0)
  }

  function runAction(action: SurgicalAction) {
    const next = applySurgicalSimulationAction(state, action, tool)
    setState(next)
    const active = currentSurgicalPhase(next)
    onSorot?.(active.focus)
    onKedalaman?.(depthForPhase(next.phaseIndex, getSurgicalProcedure(next.procedureId).phases.length))
  }

  function reset() {
    setState(createSurgicalSimulationState(procedureId))
    setTool('none')
    onSorot?.([])
    onKedalaman?.(0)
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-cyan-300/15 bg-[#02070b] text-white">
      <div className="border-b border-white/10 bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,.16),transparent_35%),radial-gradient(circle_at_85%_0%,rgba(139,92,246,.12),transparent_30%)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-200/80">Interactive surgery simulator · runtime v1</div>
            <h3 className="mt-1 text-lg font-black">Procedure environment + state machine</h3>
          </div>
          <button type="button" onClick={reset} className="min-h-10 rounded-full border border-white/15 px-3 text-[10px] font-black text-white/75 hover:bg-white/10">
            Reset
          </button>
        </div>
        <p className="mt-1.5 max-w-4xl text-[10px] leading-relaxed text-white/55">
          Body Exposure 3D is the anatomy canvas; simulator phases drive shared focus, dissection depth, action validation and telemetry while advanced physics and procedure-specific assets remain gated until validated.
        </p>
      </div>

      <div className="p-3 sm:p-4">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1" aria-label="Surgical simulator procedures">
          {SURGICAL_SIMULATION_PROCEDURES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === procedureId}
              onClick={() => chooseProcedure(item.id)}
              className={'min-h-10 shrink-0 rounded-full border px-3 text-[10px] font-black transition ' + (
                item.id === procedureId
                  ? 'border-cyan-200 bg-cyan-200 text-black'
                  : 'border-white/10 bg-white/[.035] text-white/65 hover:border-white/20 hover:text-white'
              )}
            >
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
              <span className="rounded-full border border-violet-300/20 bg-violet-300/[.07] px-2 py-1 text-[8px] font-black uppercase tracking-[.14em] text-violet-200">
                {procedure.scene}
              </span>
            </div>

            <p className="mt-2 text-[10px] leading-relaxed text-white/55">{procedure.goal}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10" aria-label={'Simulation progress ' + progress + '%'}>
              <div className="h-full rounded-full bg-cyan-300 transition-[width]" style={{ width: String(progress) + '%' }} />
            </div>

            <div className="mt-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[.045] p-3">
              <div className="text-[8px] font-black uppercase tracking-[.16em] text-cyan-200/70">
                Phase {state.phaseIndex + 1} / {procedure.phases.length}
              </div>
              <div className="mt-0.5 text-sm font-black">{state.completed ? 'Simulation complete' : phase.label}</div>
              <p className="mt-2 text-[10px] leading-relaxed text-white/70">
                {state.completed ? 'Review telemetry, replay the case, or switch procedure.' : phase.objective}
              </p>

              {!state.completed && (
                <>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-white/10 bg-black/20 p-2.5">
                      <div className="text-[8px] font-black uppercase tracking-[.14em] text-white/40">Anatomy focus</div>
                      <div className="mt-1 text-[10px] leading-relaxed text-white/70">{phase.focus.join(' · ')}</div>
                      <button type="button" onClick={() => onSorot?.(phase.focus)} className="mt-2 min-h-9 rounded-full border border-cyan-300/20 px-2.5 text-[9px] font-black text-cyan-200">
                        Highlight on shared 3D body
                      </button>
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
                        <button
                          key={item.id}
                          type="button"
                          aria-pressed={tool === item.id}
                          onClick={() => setTool(item.id)}
                          className={'min-h-9 shrink-0 rounded-full border px-2.5 text-[9px] font-bold ' + (
                            tool === item.id ? 'border-white bg-white text-black' : 'border-white/10 text-white/55'
                          )}
                        >
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

              <div className={'mt-3 rounded-lg border p-2.5 text-[10px] leading-relaxed ' + (
                state.completed
                  ? 'border-emerald-300/20 bg-emerald-300/[.05] text-emerald-100'
                  : 'border-white/10 bg-black/20 text-white/60'
              )}>
                {state.feedback}
              </div>
            </div>
          </div>

          <aside className="space-y-2">
            <div className="rounded-2xl border border-white/10 bg-white/[.025] p-3">
              <div className="text-[8px] font-black uppercase tracking-[.16em] text-white/40">Live telemetry</div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {[
                  ['Safety', state.safetyScore], ['Accuracy', state.accuracyScore], ['Efficiency', state.efficiencyScore],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-xl border border-white/10 bg-black/20 p-2 text-center">
                    <div className="text-base font-black">{value}</div>
                    <div className="text-[8px] font-bold uppercase tracking-wide text-white/35">{label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[9px] text-white/45">
                Correct actions {state.correctActions} · Attempts {state.attempts}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[.04] p-3">
              <div className="text-[8px] font-black uppercase tracking-[.16em] text-amber-200/75">Fidelity boundary</div>
              <p className="mt-1 text-[9px] leading-relaxed text-white/50">{procedure.evidenceBoundary}</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

export default SurgicalSimulatorPanel
