import { useMemo, useState } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import {
  BODY_LEARNING_ROUTE_BOUNDARY,
  buildBodyLearningRoute,
  listBodyLearningRouteTargets,
} from '../../lib/bodyLearningRouteComposer'
import { getBodyEvidenceSource } from '../../lib/bodyEvidenceProvenance'
import type { UnifiedMechanismNodeKind } from '../../lib/bodyUnifiedMechanismGraph'

const STEP_CLASS: Record<UnifiedMechanismNodeKind, string> = {
  'atlas-system': 'border-cyan-300/18 bg-cyan-300/[.045]',
  'physiology-system': 'border-emerald-300/18 bg-emerald-300/[.045]',
  'pathophysiology-scenario': 'border-rose-300/18 bg-rose-300/[.045]',
  'pathophysiology-step': 'border-orange-200/14 bg-orange-200/[.04]',
  'pharmacology-class': 'border-violet-300/18 bg-violet-300/[.045]',
  'pharmacology-step': 'border-fuchsia-300/14 bg-fuchsia-300/[.04]',
}

interface LearningRouteComposerPanelProps {
  selectedAtlasSystemId: BodySystemId
}

export function LearningRouteComposerPanel({ selectedAtlasSystemId }: LearningRouteComposerPanelProps) {
  const targets = useMemo(() => listBodyLearningRouteTargets(), [])
  const [targetId, setTargetId] = useState('pathophysiology:atherosclerosis')
  const [completed, setCompleted] = useState<Set<string>>(() => new Set())
  const route = useMemo(() => buildBodyLearningRoute(selectedAtlasSystemId, targetId), [selectedAtlasSystemId, targetId])

  const targetStillExists = targets.some((target) => target.id === targetId)
  const effectiveTargetId = targetStillExists ? targetId : (targets[0]?.id ?? 'pathophysiology:atherosclerosis')
  const effectiveRoute = effectiveTargetId === targetId ? route : buildBodyLearningRoute(selectedAtlasSystemId, effectiveTargetId)
  const stepCount = effectiveRoute?.steps.length ?? 0
  const completedCount = effectiveRoute?.steps.filter((step) => completed.has(step.nodeId)).length ?? 0
  const progressFraction = stepCount === 0 ? 0 : completedCount / stepCount
  const progressPercent = Math.round(progressFraction * 100)
  const evidencePercent = Math.round((effectiveRoute?.evidenceCoverageFraction ?? 0) * 100)

  function toggleStep(nodeId: string) {
    setCompleted((current) => {
      const next = new Set(current)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }

  function resetRoute() {
    setCompleted(new Set())
  }

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/[.08] bg-black/60 p-3 shadow-[0_28px_100px_rgba(0,0,0,.28)] backdrop-blur-2xl sm:p-4 lg:p-5" aria-labelledby="learning-route-title">
      <div className="pointer-events-none absolute -left-16 top-0 h-44 w-44 rounded-full bg-emerald-400/[.04] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 right-[8%] h-44 w-44 rounded-full bg-violet-500/[.04] blur-3xl" aria-hidden />

      <header className="relative grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,.75fr)] xl:items-end">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[.22em] text-emerald-100/80">Mechanism Learning Route</span>
            <span className="rounded-full border border-white/10 bg-white/[.035] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.13em] text-white/45">graph-backed curriculum</span>
            <span className="rounded-full border border-amber-200/10 bg-amber-200/[.035] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.13em] text-amber-50/55">education only</span>
          </div>
          <h3 id="learning-route-title" className="mt-2 text-xl font-black tracking-[-.03em] text-white sm:text-2xl lg:text-3xl">
            Turn one atlas selection into a traceable learning journey.
          </h3>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-white/52">
            Start from the system currently selected in the 3D atlas, choose a disease network or pharmacology mechanism, and follow the shortest curated knowledge route. Biomedical steps inherit the same PubMed provenance ledger used by the evidence observatory.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl border border-white/[.065] bg-white/[.022] p-2.5">
            <div className="text-xl font-black text-white">{stepCount}</div>
            <div className="text-[8px] font-black uppercase tracking-[.09em] text-white/28">route steps</div>
          </div>
          <div className="rounded-2xl border border-white/[.065] bg-white/[.022] p-2.5">
            <div className="text-xl font-black text-emerald-100">{progressPercent}%</div>
            <div className="text-[8px] font-black uppercase tracking-[.09em] text-white/28">learning progress</div>
          </div>
          <div className="rounded-2xl border border-white/[.065] bg-white/[.022] p-2.5">
            <div className="text-xl font-black text-cyan-100">{evidencePercent}%</div>
            <div className="text-[8px] font-black uppercase tracking-[.09em] text-white/28">biomed anchored</div>
          </div>
        </div>
      </header>

      <div className="relative mt-4 grid gap-3 lg:grid-cols-[minmax(280px,.65fr)_minmax(0,1.35fr)]">
        <aside className="rounded-[24px] border border-white/[.07] bg-white/[.02] p-3.5">
          <div className="text-[9px] font-black uppercase tracking-[.14em] text-white/30">Route controls</div>
          <div className="mt-3 rounded-[18px] border border-cyan-300/10 bg-cyan-300/[.025] p-3">
            <div className="text-[8px] font-black uppercase tracking-[.12em] text-cyan-100/50">Live starting system</div>
            <div className="mt-1 text-sm font-black text-white/80">{selectedAtlasSystemId}</div>
            <div className="mt-1 text-[9px] font-medium leading-relaxed text-white/32">Changes automatically when the user selects another system in the source-backed 3D atlas.</div>
          </div>

          <label className="mt-3 block">
            <span className="text-[9px] font-black uppercase tracking-[.12em] text-white/32">Learning destination</span>
            <select
              value={effectiveTargetId}
              onChange={(event) => {
                setTargetId(event.target.value)
                setCompleted(new Set())
              }}
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-white/[.08] bg-black/60 px-3 text-xs font-bold text-white/72 outline-none transition focus:border-emerald-300/25 focus:ring-2 focus:ring-emerald-300/20"
            >
              <optgroup label="Disease networks">
                {targets.filter((target) => target.kind === 'pathophysiology-scenario').map((target) => (
                  <option key={target.id} value={target.id}>{target.label}</option>
                ))}
              </optgroup>
              <optgroup label="Pharmacology mechanisms">
                {targets.filter((target) => target.kind === 'pharmacology-class').map((target) => (
                  <option key={target.id} value={target.id}>{target.label}</option>
                ))}
              </optgroup>
            </select>
          </label>

          <div className="mt-3 rounded-[18px] border border-white/[.06] bg-black/25 p-3">
            <div className="flex items-center justify-between gap-2 text-[8px] font-black uppercase tracking-[.1em] text-white/28">
              <span>Completion</span>
              <span>{completedCount}/{stepCount}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[.055]">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,rgba(52,211,153,.75),rgba(34,211,238,.7),rgba(139,92,246,.7))] transition-[width] duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="mt-2 font-mono text-[9px] font-black text-emerald-100/60">progress = completed steps / route steps</div>
            <p className="mt-1 text-[8px] font-medium leading-relaxed text-white/25">Progress is local learning-state metadata only; it has no relationship to competence certification or clinical performance.</p>
          </div>

          <button
            type="button"
            onClick={resetRoute}
            className="mt-3 min-h-[42px] w-full rounded-xl border border-white/[.07] bg-white/[.025] text-[10px] font-black text-white/42 transition hover:bg-white/[.05] hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            Reset route progress
          </button>
        </aside>

        <div className="rounded-[24px] border border-white/[.07] bg-black/30 p-3.5 sm:p-4">
          {!effectiveRoute ? (
            <div className="grid min-h-56 place-items-center rounded-[20px] border border-white/[.06] bg-white/[.018] p-5 text-center">
              <div>
                <div className="text-sm font-black text-white/60">No curated route available</div>
                <p className="mt-1 text-[10px] font-medium text-white/30">The composer refuses to invent a bridge when the current graph contains no route.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[.14em] text-emerald-100/50">Active learning route</div>
                  <div className="mt-1 text-sm font-black text-white/80">{selectedAtlasSystemId} → {effectiveRoute.targetLabel}</div>
                </div>
                <div className="rounded-full border border-cyan-300/10 bg-cyan-300/[.025] px-2.5 py-1 text-[8px] font-black uppercase tracking-[.09em] text-cyan-100/50">
                  {effectiveRoute.evidenceAnchoredBiomedicalStepCount}/{effectiveRoute.biomedicalStepCount} biomedical steps evidence-anchored
                </div>
              </div>

              <div className="mt-3 grid gap-2.5">
                {effectiveRoute.steps.map((step, index) => {
                  const done = completed.has(step.nodeId)
                  const evidence = step.referencePmids.map((pmid) => getBodyEvidenceSource(pmid))
                  return (
                    <article key={`${step.nodeId}-${index}`} className={`rounded-[20px] border p-3 transition ${STEP_CLASS[step.nodeKind]} ${done ? 'opacity-65' : 'opacity-100'}`}>
                      <div className="grid grid-cols-[34px_minmax(0,1fr)] gap-2.5">
                        <button
                          type="button"
                          aria-pressed={done}
                          aria-label={`${done ? 'Mark incomplete' : 'Mark complete'}: ${step.label}`}
                          onClick={() => toggleStep(step.nodeId)}
                          className={`grid h-8 w-8 place-items-center rounded-full border text-[10px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50 ${done ? 'border-emerald-300/25 bg-emerald-300/[.12] text-emerald-100' : 'border-white/10 bg-black/35 text-white/35 hover:text-white/65'}`}
                        >
                          {done ? '✓' : index + 1}
                        </button>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[8px] font-black uppercase tracking-[.1em] text-white/30">{step.nodeKind}</span>
                            {step.transitionFromPrevious && <span className="rounded-full border border-white/[.06] bg-black/20 px-2 py-0.5 text-[7px] font-bold text-white/24">{step.transitionFromPrevious}</span>}
                          </div>
                          <div className={`mt-1 text-xs font-black text-white/75 ${done ? 'line-through decoration-white/20' : ''}`}>{step.label}</div>
                          <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-white/40">{step.objective}</p>
                          <p className="mt-1 text-[9px] font-medium leading-relaxed text-white/26">{step.context}</p>

                          {evidence.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {evidence.map((source) => (
                                <a
                                  key={source.pmid}
                                  href={source.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-full border border-white/[.065] bg-black/25 px-2 py-0.5 text-[7px] font-black uppercase tracking-[.08em] text-cyan-100/45 transition hover:border-cyan-300/15 hover:text-cyan-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40"
                                >
                                  PMID {source.pmid}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="relative mt-3 grid gap-2 md:grid-cols-3">
        <div className="rounded-[18px] border border-white/[.06] bg-white/[.018] p-3">
          <div className="text-[8px] font-black uppercase tracking-[.1em] text-white/28">Route source</div>
          <div className="mt-1 font-mono text-[9px] font-black text-cyan-100/60">BFS(graph, atlas, target)</div>
          <p className="mt-1 text-[8px] font-medium leading-relaxed text-white/24">Uses the same deterministic unified graph; it does not ask an LLM to invent a curriculum edge.</p>
        </div>
        <div className="rounded-[18px] border border-white/[.06] bg-white/[.018] p-3">
          <div className="text-[8px] font-black uppercase tracking-[.1em] text-white/28">Progress formula</div>
          <div className="mt-1 font-mono text-[9px] font-black text-emerald-100/60">P = completed / total route steps</div>
          <p className="mt-1 text-[8px] font-medium leading-relaxed text-white/24">Local UI state only, not a validated learning outcome measure.</p>
        </div>
        <div className="rounded-[18px] border border-white/[.06] bg-white/[.018] p-3">
          <div className="text-[8px] font-black uppercase tracking-[.1em] text-white/28">Evidence coverage</div>
          <div className="mt-1 font-mono text-[9px] font-black text-violet-100/60">E = anchored biomedical steps / biomedical steps</div>
          <p className="mt-1 text-[8px] font-medium leading-relaxed text-white/24">Provenance completeness only; not evidence strength.</p>
        </div>
      </div>

      <p className="relative mt-3 rounded-[20px] border border-amber-200/10 bg-amber-200/[.03] px-3 py-2.5 text-[9px] font-semibold leading-relaxed text-amber-50/45">
        {BODY_LEARNING_ROUTE_BOUNDARY}
      </p>
    </section>
  )
}

export default LearningRouteComposerPanel
