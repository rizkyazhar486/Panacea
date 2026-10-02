import { useEffect, useMemo, useState } from 'react'
import { Prosa } from '../Prosa'
import {
  applyUniversalOperationAction,
  createUniversalOperationSimulation,
  operationSimulationCompletion,
  type OperationSimulationAction,
  type OperationSimulationProcedure,
} from '../../lib/universalOperationSimulator'

const ACTIONS: Array<{ action: OperationSimulationAction; label: string; note: string }> = [
  { action: 'orient-field', label: 'Orient field', note: 'Improve spatial orientation' },
  { action: 'identify-risk', label: 'Identify risks', note: 'Review structures at risk' },
  { action: 'inject-complication', label: 'Inject event', note: 'Training complication' },
  { action: 'stabilize-scenario', label: 'Safety response', note: 'Abstract response only' },
  { action: 'safety-review', label: 'Safety review', note: 'Hemostasis/final check' },
  { action: 'advance-phase', label: 'Next phase', note: 'Advance the story' },
]

function meter(value: number) {
  return Math.max(0, Math.min(100, value)) + '%'
}

export function UniversalOperationSimulationConsole({ procedure }: { procedure: OperationSimulationProcedure }) {
  const [state, setState] = useState(() => createUniversalOperationSimulation(procedure))

  useEffect(() => {
    setState(createUniversalOperationSimulation(procedure))
  }, [procedure])

  const phase = procedure.phases[Math.min(state.phaseIndex, procedure.phases.length - 1)]
  const completion = useMemo(() => operationSimulationCompletion(state, procedure), [state, procedure])

  function act(action: OperationSimulationAction) {
    setState((current) => applyUniversalOperationAction(current, action, procedure))
  }

  return (
    <section className="border-t border-white/8 bg-[#02070d] p-5 sm:p-6" aria-label="Universal operation simulation console">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-300">Universal operation simulation kernel</div>
          <h3 className="mt-1 text-xl font-black tracking-[-.03em] text-white">Interactive rehearsal state, not an operative recipe.</h3>
          <Prosa kelas="mt-1 text-[10px] leading-relaxed text-white/38">
            Inspired by microsurgical simulation: reference anatomy, synthetic monitor, field visibility, bleeding/hemostasis state, complication injection and phase progression share one reusable engine. No incision coordinates, device settings, implant dimensions, medication dosing or patient-specific navigation are generated.
          </Prosa>
        </div>

        <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-white/8 bg-black/30 p-2">
          <div className="px-2 py-1.5 text-center">
            <div className="text-[8px] font-black uppercase text-white/28">HR</div>
            <div className="mt-0.5 text-sm font-black text-emerald-200">{state.syntheticMonitor.heartRate}</div>
          </div>
          <div className="px-2 py-1.5 text-center">
            <div className="text-[8px] font-black uppercase text-white/28">SpO₂</div>
            <div className="mt-0.5 text-sm font-black text-cyan-200">{state.syntheticMonitor.spo2}%</div>
          </div>
          <div className="px-2 py-1.5 text-center">
            <div className="text-[8px] font-black uppercase text-white/28">MAP</div>
            <div className="mt-0.5 text-sm font-black text-amber-100">{state.syntheticMonitor.map}</div>
          </div>
          <div className="col-span-3 text-center text-[7px] font-bold uppercase tracking-wide text-white/20">synthetic training monitor · not clinical targets</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_.9fr]">
        <article className="rounded-2xl border border-white/8 bg-white/[.025] p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[9px] font-black uppercase tracking-wide text-white/30">Current phase</div>
            <div className="text-[9px] font-black text-emerald-300">{state.phaseIndex + 1}/{procedure.phases.length}</div>
          </div>
          <div className="mt-2 text-sm font-black text-white">{phase?.title ?? '—'}</div>
          <p className="mt-1 text-[10px] leading-relaxed text-white/38">{phase?.objective}</p>
          {state.complication && (
            <div className="mt-3 rounded-xl border border-rose-300/15 bg-rose-300/[.055] p-3">
              <div className="text-[8px] font-black uppercase tracking-wide text-rose-200">Injected training event</div>
              <div className="mt-1 text-[10px] font-bold text-white/65">{state.complication}</div>
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-white/8 bg-white/[.025] p-4">
          <div className="text-[9px] font-black uppercase tracking-wide text-white/30">Simulation state</div>
          {[
            ['Field clarity', state.fieldClarity],
            ['Risk awareness', state.riskAwareness],
            ['Completion', completion],
          ].map(([label, value]) => (
            <div key={String(label)} className="mt-3">
              <div className="flex items-center justify-between text-[9px] font-bold text-white/40"><span>{label}</span><span>{value}%</span></div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-emerald-300/75" style={{ width: meter(Number(value)) }} /></div>
            </div>
          ))}
          <div className="mt-3 flex flex-wrap gap-1.5 text-[8px] font-black uppercase tracking-wide">
            <span className="rounded-full border border-white/8 px-2 py-1 text-white/36">bleeding: {state.bleeding}</span>
            <span className="rounded-full border border-white/8 px-2 py-1 text-white/36">scenario: {state.scenario}</span>
            <span className="rounded-full border border-white/8 px-2 py-1 text-white/36">safety review: {state.hemostasisReviewed ? 'done' : 'pending'}</span>
          </div>
        </article>

        <article className="rounded-2xl border border-white/8 bg-white/[.025] p-4">
          <div className="text-[9px] font-black uppercase tracking-wide text-white/30">Training event log</div>
          <div className="mt-2 max-h-36 space-y-1.5 overflow-y-auto">
            {state.eventLog.slice(-6).reverse().map((entry, index) => (
              <div key={entry + '-' + index} className="rounded-xl bg-black/20 px-3 py-2 text-[9px] leading-relaxed text-white/40">{entry}</div>
            ))}
          </div>
        </article>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {ACTIONS.map((item) => (
          <button key={item.action} type="button" onClick={() => act(item.action)} disabled={item.action === 'advance-phase' && state.phaseIndex >= procedure.phases.length - 1} className="min-h-[62px] rounded-2xl border border-white/8 bg-white/[.025] px-3 py-2 text-left transition hover:bg-white/[.05] disabled:opacity-25">
            <div className="text-[10px] font-black text-white/72">{item.label}</div>
            <div className="mt-1 text-[8px] leading-snug text-white/28">{item.note}</div>
          </button>
        ))}
      </div>

      <button type="button" onClick={() => act('reset')} className="mt-3 rounded-full border border-white/8 px-3 py-2 text-[9px] font-black text-white/40">Reset simulation</button>
    </section>
  )
}
