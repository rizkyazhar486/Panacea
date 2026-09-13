import { Suspense, lazy, useMemo, useState } from 'react'
import {
  DISCOVERY_CHALLENGES,
  challengeById,
  evidenceReadiness,
  type DiscoveryMode,
} from '../../lib/discoveryWorkbench'

const SynapseMicro3DLab = lazy(() => import('../../pages/discovery/SynapseMicro3DLab'))

const MODE_COPY: Record<DiscoveryMode, { label: string; subtitle: string }> = {
  discovery: { label: 'Discovery', subtitle: 'Competing hypotheses, causal structure, falsification and missing evidence.' },
  innovation: { label: 'Innovation', subtitle: 'Translate surviving ideas into testable solution concepts without calling them treatments.' },
  invention: { label: 'Invention', subtitle: 'Turn candidate concepts into technology architectures while preserving validation gates.' },
}

function CausalMap({ challengeId }: { challengeId: string }) {
  const challenge = challengeById(challengeId)
  const byId = useMemo(() => new Map(challenge.causalNodes.map((node) => [node.id, node])), [challenge])
  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-neutral-950 p-2 dark:border-white/10" role="region" aria-label="Candidate causal graph">
      <svg viewBox="0 0 610 180" className="min-w-[600px] w-full" role="img" aria-label={`Candidate causal graph for ${challenge.label}`}>
        <defs>
          <marker id={`arrow-${challenge.id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
        </defs>
        {challenge.causalEdges.map((edge) => {
          const from = byId.get(edge.from)
          const to = byId.get(edge.to)
          if (!from || !to) return null
          const dash = edge.certainty === 'unknown-direction' ? '5 5' : edge.certainty === 'candidate-link' ? '3 3' : undefined
          return (
            <g key={`${edge.from}-${edge.to}-${edge.relation}`} className="text-neutral-500">
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="currentColor" strokeWidth="1.7" strokeDasharray={dash} markerEnd={`url(#arrow-${challenge.id})`} />
              <title>{edge.relation} · {edge.certainty}</title>
            </g>
          )
        })}
        {challenge.causalNodes.map((node) => (
          <g key={node.id} transform={`translate(${node.x} ${node.y})`}>
            <circle r="25" fill="#101827" stroke="#00bf63" strokeWidth="1.2" />
            <text textAnchor="middle" y="-3" fill="white" fontSize="7.7" fontWeight="700">{node.label.length > 22 ? `${node.label.slice(0, 20)}…` : node.label}</text>
            <text textAnchor="middle" y="9" fill="#94a3b8" fontSize="6.8">{node.scale}</text>
          </g>
        ))}
      </svg>
      <p className="px-2 pb-1 text-[10px] leading-relaxed text-neutral-400">Solid/dashed edges encode candidate relation state, not measured causal strength. Unknown direction remains visually distinct.</p>
    </div>
  )
}

export function DiscoveryWorkbench() {
  const [mode, setMode] = useState<DiscoveryMode>('discovery')
  const [challengeId, setChallengeId] = useState(DISCOVERY_CHALLENGES[0].id)
  const challenge = challengeById(challengeId)
  const [hypothesisId, setHypothesisId] = useState(challenge.hypotheses[0].id)
  const selectedHypothesis = challenge.hypotheses.find((item) => item.id === hypothesisId) ?? challenge.hypotheses[0]

  const gate = evidenceReadiness({
    provenanceCompleteness: 0,
    identifiability: 0,
    transportability: 0,
    confoundingRisk: 1,
    independentSources: 0,
  })

  const chooseChallenge = (id: string) => {
    const next = challengeById(id)
    setChallengeId(id)
    setHypothesisId(next.hypotheses[0].id)
  }

  return (
    <section className="space-y-4 rounded-[30px] border border-neutral-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[.025] sm:p-5" aria-labelledby="discovery-workbench-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-brand">Discovery → Innovation → Invention</div>
          <h2 id="discovery-workbench-title" className="mt-1 text-xl font-black tracking-tight text-ink dark:text-white">Panacea falsification-first research workbench</h2>
          <p className="mt-2 text-xs leading-relaxed text-neutral-500">A living workspace for competing explanations, causal graphs, counterexamples, uncertainty and translation gates. Visual realism and internal scores never count as scientific validation.</p>
        </div>
        <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[10px] font-black text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">Research only · fail closed</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-3" role="tablist" aria-label="Research program mode">
        {(Object.keys(MODE_COPY) as DiscoveryMode[]).map((item) => (
          <button key={item} type="button" role="tab" aria-selected={mode === item} onClick={() => setMode(item)} className={`min-h-11 rounded-2xl border px-3 py-2 text-left transition ${mode === item ? 'border-brand bg-brand/10' : 'border-neutral-200 dark:border-white/10'}`}>
            <div className="text-xs font-black text-ink dark:text-white">{MODE_COPY[item].label}</div>
            <div className="mt-0.5 text-[10px] leading-relaxed text-neutral-500">{MODE_COPY[item].subtitle}</div>
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Discovery challenge selector">
        {DISCOVERY_CHALLENGES.map((item) => (
          <button key={item.id} type="button" onClick={() => chooseChallenge(item.id)} aria-pressed={challenge.id === item.id} className={`min-h-11 shrink-0 rounded-xl px-3 text-xs font-bold ${challenge.id === item.id ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950' : 'border border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'}`}>{item.label}</button>
        ))}
      </div>

      <div className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
        <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Grand challenge</div>
        <h3 className="mt-1 text-base font-black text-ink dark:text-white">{challenge.question}</h3>
        <p className="mt-2 text-xs leading-relaxed text-amber-800 dark:text-amber-200">{challenge.boundary}</p>
      </div>

      {mode === 'discovery' && (
        <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-3">
            <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
              <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Hypothesis tournament</div>
              <div className="mt-2 space-y-2">
                {challenge.hypotheses.map((item) => (
                  <button key={item.id} type="button" onClick={() => setHypothesisId(item.id)} aria-pressed={selectedHypothesis.id === item.id} className={`w-full rounded-xl border p-3 text-left ${selectedHypothesis.id === item.id ? 'border-brand bg-brand/[.06]' : 'border-neutral-200 dark:border-white/10'}`}>
                    <div className="flex items-center justify-between gap-2"><span className="text-xs font-black text-ink dark:text-white">{item.label}</span><span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-bold text-neutral-500 dark:bg-white/10">{item.state}</span></div>
                    <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{item.claim}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
              <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Evidence readiness gate</div>
              <div className="mt-2 flex items-center justify-between gap-3"><code className="text-xs font-black text-brand">{gate.formula}</code><span className="text-xs font-black text-neutral-500">{gate.score === null ? 'Not scoreable' : gate.score}</span></div>
              <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">P=provenance completeness, I=identifiability, T=transportability, C=confounding risk. This is a research-triage gate only; it is not probability of truth, effect size or clinical confidence. Fewer than two independent sources returns null.</p>
            </div>
          </div>

          <div className="space-y-3">
            <CausalMap challengeId={challenge.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
                <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Falsification / counterexamples</div>
                <ul className="mt-2 space-y-1.5">{selectedHypothesis.falsificationCriteria.map((item) => <li key={item} className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">• {item}</li>)}</ul>
              </div>
              <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
                <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Missing experiments / evidence</div>
                <ul className="mt-2 space-y-1.5">{selectedHypothesis.requiredEvidence.map((item) => <li key={item} className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">• {item}</li>)}</ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === 'innovation' && (
        <div className="grid gap-3 md:grid-cols-2">
          {challenge.innovationCandidates.map((item) => <article key={item} className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10"><div className="text-sm font-black text-ink dark:text-white">{item}</div><p className="mt-2 text-xs leading-relaxed text-neutral-500">Candidate concept only. Promotion requires evidence, assumptions, failure modes, safety analysis and a prospective validation plan.</p></article>)}
        </div>
      )}

      {mode === 'invention' && (
        <div className="grid gap-3 md:grid-cols-2">
          {challenge.inventionCandidates.map((item) => <article key={item} className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10"><div className="text-sm font-black text-ink dark:text-white">{item}</div><p className="mt-2 text-xs leading-relaxed text-neutral-500">Architecture candidate only. No autonomous clinical action, unsupported dosing, fabricated wet-lab validation or patient-specific prediction is authorized.</p></article>)}
        </div>
      )}

      {challenge.id === 'cross-scale-neurodegeneration' && (
        <details className="rounded-2xl border border-brand/20 bg-brand/[.03] p-3">
          <summary className="cursor-pointer text-xs font-black text-brand">Open visualization bridge: synapse microenvironment 3D</summary>
          <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">This loads the existing Panacea schematic 3D synapse model only on demand. It remains an educational spatial encoding, not microscopy, connectomics, molecular dynamics or measured patient physiology.</p>
          <div className="mt-3 overflow-hidden rounded-2xl border border-neutral-200 dark:border-white/10">
            <Suspense fallback={<div className="p-4 text-xs text-neutral-500" role="status" aria-live="polite">Loading 3D synapse workbench…</div>}>
              <SynapseMicro3DLab />
            </Suspense>
          </div>
        </details>
      )}
    </section>
  )
}

export default DiscoveryWorkbench
