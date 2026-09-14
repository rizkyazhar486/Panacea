import { useMemo, useState } from 'react'
import {
  ADJUSTED_SCORE_FORMULA,
  DEMO_CANDIDATES,
  DEMO_EVIDENCE,
  EVIDENCE_SOURCE_BLUEPRINT,
  EVIDENCE_TRUST_FORMULA,
  HERBAL_SCORE_FORMULA,
  PANACEA_SCORE_FORMULA,
  evidenceTrust,
  rankCandidate,
  type CandidateKind,
} from '../../lib/rationalDrugDesign'

const KIND_LABEL: Record<CandidateKind, string> = {
  'small-molecule': 'Small molecule',
  'natural-product': 'Natural product',
  'herbal-mixture': 'Herbal mixture',
  'complex-compound': 'Complex compound',
}

const scoreTone = (value: number) => {
  if (value >= 75) return 'text-emerald-700 dark:text-emerald-300'
  if (value >= 55) return 'text-amber-700 dark:text-amber-300'
  return 'text-rose-700 dark:text-rose-300'
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
        <span>{label}</span><span>{Math.round(value)}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
        <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  )
}

export function RationalDrugDesignWorkbench() {
  const [therapeuticContext, setTherapeuticContext] = useState('Research target: Target-X')
  const [selectedKind, setSelectedKind] = useState<CandidateKind | 'all'>('all')
  const [selectedId, setSelectedId] = useState(DEMO_CANDIDATES[0].id)
  const [showOnlyReleaseEligible, setShowOnlyReleaseEligible] = useState(false)

  const ranked = useMemo(
    () => DEMO_CANDIDATES.map((candidate) => rankCandidate(candidate, DEMO_EVIDENCE)).sort((a, b) => b.adjustedScore - a.adjustedScore),
    [],
  )

  const filtered = ranked.filter((candidate) =>
    (selectedKind === 'all' || candidate.kind === selectedKind) && (!showOnlyReleaseEligible || candidate.releaseEligible),
  )
  const selected = ranked.find((candidate) => candidate.id === selectedId) ?? ranked[0]
  const selectedEvidence = selected.evidenceIds
    .map((id) => DEMO_EVIDENCE.find((record) => record.id === id))
    .filter(Boolean) as typeof DEMO_EVIDENCE

  return (
    <section className="space-y-4 rounded-[30px] border border-neutral-200 bg-gradient-to-br from-white via-white to-brand/[.035] p-4 dark:border-white/10 dark:from-neutral-950 dark:via-neutral-950 dark:to-brand/[.05] sm:p-5" aria-labelledby="rdd-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-4xl">
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-brand">Panacea Drug Discovery OS · Rational Drug Design</div>
          <h2 id="rdd-title" className="mt-1 text-xl font-black tracking-tight text-ink dark:text-white">AI-assisted target → candidate → evidence screening</h2>
          <p className="mt-2 text-xs leading-relaxed text-neutral-500">
            Research decision-support for small molecules, natural products, herbal mixtures and complex compounds. Every rank is decomposed into evidence,
            binding plausibility, ADMET prior, replication, citation quality and uncertainty. A model score is never presented as therapeutic efficacy.
          </p>
        </div>
        <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[10px] font-black text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          In-silico research · not prescribing
        </span>
      </div>

      <div className="grid gap-3 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-3">
          <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[.025]">
            <label htmlFor="rdd-context" className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Therapeutic target / disease context</label>
            <input
              id="rdd-context"
              value={therapeuticContext}
              onChange={(event) => setTherapeuticContext(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-neutral-200 bg-transparent px-3 text-sm font-bold text-ink outline-none focus:border-brand dark:border-white/10 dark:text-white"
              aria-describedby="rdd-context-help"
            />
            <p id="rdd-context-help" className="mt-2 text-[10px] leading-relaxed text-neutral-500">
              Current screen uses synthetic demonstration candidates. Production adapters must resolve stable target IDs, ontology terms, dataset versions and query timestamps.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
            <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Candidate space</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(['all', 'small-molecule', 'natural-product', 'herbal-mixture', 'complex-compound'] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setSelectedKind(kind)}
                  aria-pressed={selectedKind === kind}
                  className={`min-h-10 rounded-xl px-3 text-[11px] font-black transition ${selectedKind === kind ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950' : 'border border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'}`}
                >
                  {kind === 'all' ? 'All candidates' : KIND_LABEL[kind]}
                </button>
              ))}
            </div>
            <label className="mt-3 flex min-h-11 items-center gap-2 rounded-xl bg-neutral-50 px-3 text-[11px] font-bold text-neutral-600 dark:bg-white/5 dark:text-neutral-300">
              <input type="checkbox" checked={showOnlyReleaseEligible} onChange={(event) => setShowOnlyReleaseEligible(event.target.checked)} />
              Show only candidates passing the current research triage gate
            </label>
          </div>

          <div className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
            <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Transparent ranking equations</div>
            <div className="mt-2 space-y-2 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
              <div><code className="font-black text-brand">PanaceaScore = {PANACEA_SCORE_FORMULA}</code><br />T target evidence · B binding plausibility · A ADMET prior · R replication · C citation quality.</div>
              <div><code className="font-black text-brand">Adjusted = {ADJUSTED_SCORE_FORMULA}</code><br />U is an explicit uncertainty/domain-shift penalty capped at 0.35 in this prototype.</div>
              <div><code className="font-black text-brand">HerbalTargetScore = {HERBAL_SCORE_FORMULA}</code><br />wᵢ exposure/abundance prior · p interaction prediction · q evidence quality. Missing exposure makes the mixture score unavailable instead of fabricated.</div>
              <div><code className="font-black text-brand">EvidenceTrust = {EVIDENCE_TRUST_FORMULA}</code><br />D design · X directness · R replication · P provenance · K consistency, followed by a citation-status modifier.</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-white/10">
            <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-black text-ink dark:text-white">Ranked candidate screen</div>
                  <div className="mt-0.5 text-[10px] text-neutral-500">Context: {therapeuticContext || 'No context entered'}</div>
                </div>
                <span className="text-[10px] font-bold text-neutral-500">{filtered.length} visible</span>
              </div>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-white/5">
              {filtered.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => setSelectedId(candidate.id)}
                  className={`w-full p-3 text-left transition ${selected.id === candidate.id ? 'bg-brand/[.055]' : 'bg-white hover:bg-neutral-50 dark:bg-transparent dark:hover:bg-white/[.03]'}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-ink dark:text-white">{candidate.name}</span>
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-bold text-neutral-500 dark:bg-white/10">{KIND_LABEL[candidate.kind]}</span>
                      </div>
                      <div className="mt-1 text-[10px] text-neutral-500">{candidate.origin} · target {candidate.target}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-black ${scoreTone(candidate.adjustedScore)}`}>{candidate.adjustedScore}</div>
                      <div className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">uncertainty-adjusted</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center sm:grid-cols-5">
                    <div><div className="text-xs font-black text-ink dark:text-white">{candidate.panaceaScore}</div><div className="text-[8px] uppercase text-neutral-400">raw score</div></div>
                    <div><div className="text-xs font-black text-ink dark:text-white">{candidate.evidenceTrust}</div><div className="text-[8px] uppercase text-neutral-400">evidence</div></div>
                    <div><div className="text-xs font-black text-ink dark:text-white">{Math.round(candidate.scores.uncertainty * 100)}%</div><div className="text-[8px] uppercase text-neutral-400">uncertainty</div></div>
                    <div><div className="text-xs font-black text-ink dark:text-white">{candidate.herbalTargetScore ?? 'N/A'}</div><div className="text-[8px] uppercase text-neutral-400">mixture score</div></div>
                    <div><div className={`text-xs font-black ${candidate.releaseEligible ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>{candidate.releaseEligible ? 'PASS' : 'HOLD'}</div><div className="text-[8px] uppercase text-neutral-400">triage gate</div></div>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && <div className="p-4 text-xs text-neutral-500">No candidate passes the active filter. This is a fail-closed state, not an error.</div>}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[.025]">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wide text-brand">Candidate audit</div>
                <h3 className="mt-1 text-base font-black text-ink dark:text-white">{selected.name}</h3>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[9px] font-black ${selected.releaseEligible ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200'}`}>
                {selected.releaseEligible ? 'Research gate passed' : 'Validation required'}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-neutral-500">{selected.mechanismHypothesis}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Meter label="Target evidence" value={selected.scores.targetEvidence} />
              <Meter label="Binding plausibility" value={selected.scores.bindingPlausibility} />
              <Meter label="ADMET prior" value={selected.scores.admetPrior} />
              <Meter label="Replication" value={selected.scores.replication} />
              <Meter label="Citation quality" value={selected.scores.citationQuality} />
              <Meter label="Evidence trust" value={selected.evidenceTrust} />
            </div>

            {selected.components?.length ? (
              <div className="mt-4 rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Herbal / mixture decomposition</div>
                <div className="mt-2 space-y-1.5">
                  {selected.components.map((component) => (
                    <div key={component.name} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 text-[10px] text-neutral-600 dark:text-neutral-300">
                      <span className="font-bold">{component.name}</span>
                      <span>w={component.exposureWeight ?? 'missing'}</span><span>p={component.predictedTargetInteraction}</span><span>q={component.evidenceQuality}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
          <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Evidence ledger · selected candidate</div>
          <div className="mt-2 space-y-2">
            {selectedEvidence.map((record) => (
              <article key={record.id} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><div className="text-xs font-black text-ink dark:text-white">{record.title}</div><div className="mt-0.5 text-[9px] font-bold text-brand">{record.source} · {record.locator} · {record.tier}</div></div>
                  <span className={`text-xs font-black ${scoreTone(evidenceTrust(record))}`}>{evidenceTrust(record)}</span>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">{record.note}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
          <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Production evidence adapters</div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {EVIDENCE_SOURCE_BLUEPRINT.map((source) => (
              <div key={source.name} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                <div className="flex items-start justify-between gap-2"><span className="text-xs font-black text-ink dark:text-white">{source.name}</span><span className="text-[8px] font-black uppercase text-amber-600">adapter required</span></div>
                <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">{source.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <div className="text-[10px] font-black uppercase tracking-wide text-emerald-800 dark:text-emerald-200">Validation gate</div>
          <p className="mt-1 text-[11px] leading-relaxed text-emerald-950 dark:text-emerald-100">High-accuracy claims stay locked until external benchmark, calibration and applicability-domain checks pass. Track AUROC, AUPRC, EF1%, Brier/calibration error and prospective hit rate.</p>
        </div>
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3 dark:border-sky-500/20 dark:bg-sky-500/10">
          <div className="text-[10px] font-black uppercase tracking-wide text-sky-800 dark:text-sky-200">Citation integrity</div>
          <p className="mt-1 text-[11px] leading-relaxed text-sky-950 dark:text-sky-100">Every evidence edge needs source, stable locator, dataset/model version, retrieval timestamp and correction/retraction state. Missing provenance reduces trust rather than being silently imputed.</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
          <div className="text-[10px] font-black uppercase tracking-wide text-amber-800 dark:text-amber-200">Safety boundary</div>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-950 dark:text-amber-100">This layer prioritizes computational screening and evidence synthesis. It does not authorize synthesis instructions, dosing, autonomous experimentation or patient-specific treatment decisions.</p>
        </div>
      </div>
    </section>
  )
}

export default RationalDrugDesignWorkbench
