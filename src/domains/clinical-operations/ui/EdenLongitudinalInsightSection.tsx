import { useMemo } from 'react'
import type { EdenCareCompanionSummary, EdenDisclosureDepth } from '../../../lib/types.ts'
import {
  deriveEdenLongitudinalInsight,
  formatEdenInsightDelta,
  formatEdenInsightValue,
  type EdenLongitudinalChange,
  type EdenLongitudinalInsightSource,
} from '../model/edenLongitudinalInsight.ts'

function TrendLabel({ change }: { change: EdenLongitudinalChange }) {
  if (!change.trend) {
    return <span className="text-xs font-semibold text-neutral-500 dark:text-white/55">Change over time unknown</span>
  }
  const direction = change.trend.direction === 'stable' ? 'broadly stable' : change.trend.direction
  return (
    <span
      className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800 dark:bg-sky-400/10 dark:text-sky-200"
      data-eden-inferred-pattern="v1"
    >
      Inferred pattern · {direction}
    </span>
  )
}

function ChangeHeadline({ change }: { change: EdenLongitudinalChange }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <strong className="text-xs text-neutral-900 dark:text-white">{change.label}</strong>
        <span className="text-xs font-semibold text-neutral-500 dark:text-white/55" data-truth-state={change.semanticState ?? 'undeclared'}>
          {change.observationLabel}
        </span>
        <TrendLabel change={change} />
      </div>
      <p className="mt-1 text-sm font-semibold tabular-nums text-neutral-900 dark:text-white">
        {formatEdenInsightValue(change.latestValue, change.unit)}
        <span className="ml-2 text-xs font-normal text-neutral-500 dark:text-white/55">{change.recordedAt.slice(0, 10)}</span>
      </p>
      {change.trend && (
        <p className="mt-0.5 text-xs tabular-nums text-neutral-600 dark:text-white/65">
          {formatEdenInsightDelta(change.trend)} · {change.trend.sampleCount} observations
        </p>
      )}
    </div>
  )
}

function EvidenceDetail({ change }: { change: EdenLongitudinalChange }) {
  return (
    <div className="mt-3 border-t border-neutral-200/80 pt-3 dark:border-white/10" data-eden-evidence-detail={change.metric}>
      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-white/50">Observation provenance</p>
      <dl className="mt-2 grid gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
        <div><dt className="inline text-neutral-500 dark:text-white/50">Source: </dt><dd className="inline text-neutral-800 dark:text-white/80">{change.sourceLabel}</dd></div>
        <div><dt className="inline text-neutral-500 dark:text-white/50">Method: </dt><dd className="inline break-words text-neutral-800 dark:text-white/80">{change.provenance.method ?? 'Not declared'}</dd></div>
        <div className="sm:col-span-2"><dt className="inline text-neutral-500 dark:text-white/50">Source ID: </dt><dd className="inline break-all font-mono text-neutral-800 dark:text-white/80">{change.provenance.sourceId}</dd></div>
        <div><dt className="inline text-neutral-500 dark:text-white/50">Captured: </dt><dd className="inline text-neutral-800 dark:text-white/80">{change.provenance.capturedAt}</dd></div>
        <div><dt className="inline text-neutral-500 dark:text-white/50">Received: </dt><dd className="inline text-neutral-800 dark:text-white/80">{change.provenance.receivedAt}</dd></div>
        <div><dt className="inline text-neutral-500 dark:text-white/50">Record confidence: </dt><dd className="inline text-neutral-800 dark:text-white/80">{change.confidence.toFixed(2)} · ingestion metadata, not diagnostic certainty</dd></div>
        <div><dt className="inline text-neutral-500 dark:text-white/50">Review: </dt><dd className="inline text-neutral-800 dark:text-white/80">{change.review.state}{change.review.reviewerId ? ` · ${change.review.reviewerId}` : ''}{change.review.reviewedAt ? ` · ${change.review.reviewedAt}` : ''}</dd></div>
      </dl>
      {change.reference && (
        <a
          href={change.reference.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex min-h-[44px] items-center rounded-lg px-2 text-xs font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4 hover:bg-emerald-100/70 dark:text-emerald-300 dark:hover:bg-white/5"
        >
          {change.reference.title} · {change.reference.publisher} ↗
        </a>
      )}
    </div>
  )
}

function ExplorableChange({ change, depth }: { change: EdenLongitudinalChange; depth: EdenDisclosureDepth }) {
  return (
    <details className="group border-t border-emerald-100 first:border-t-0 dark:border-white/10" data-eden-change-disclosure={change.metric}>
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40">
        <ChangeHeadline change={change} />
        <span aria-hidden="true" className="shrink-0 text-neutral-400 transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="pb-3 pl-0 text-xs leading-relaxed text-neutral-700 dark:text-white/75">
        <p><strong className="text-neutral-900 dark:text-white">Why it matters: </strong>{change.whyItMatters}</p>
        <ul className="mt-2 space-y-1">
          {change.limitations.map((limitation) => <li key={limitation}>· {limitation}</li>)}
        </ul>
        <p className="mt-2 text-xs text-neutral-500 dark:text-white/55">
          Reference status: {change.reference ? 'general education; not a patient-specific conclusion' : 'no curated physiological reference; interpretation remains unknown'}.
        </p>
        {depth === 'deep' && <EvidenceDetail change={change} />}
      </div>
    </details>
  )
}

export function EdenLongitudinalInsightSection({
  source,
  depth,
  companion,
  at,
}: {
  source: EdenLongitudinalInsightSource
  depth: EdenDisclosureDepth
  companion: EdenCareCompanionSummary
  /** Optional deterministic clock for fixtures. Production callers use the render time. */
  at?: string
}) {
  const insight = useMemo(
    () => deriveEdenLongitudinalInsight({ source, depth, at: at ?? new Date().toISOString() }),
    [source, depth, at],
  )
  const visibleChanges = depth === 'simple' ? insight.changes.slice(0, 1) : insight.changes
  const references = [...new Map(insight.changes.flatMap((change) => change.reference ? [[change.reference.id, change.reference]] : [])).values()]
  const simpleUnknown = visibleChanges[0]?.limitations.slice(1)[0]

  return (
    <>
      <section
        aria-label="What Changed"
        className="rounded-lg border border-emerald-100 bg-white/80 p-2.5 dark:border-white/5 dark:bg-white/[0.03]"
        data-eden-longitudinal-insight="v1"
        data-access={insight.access}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-white/50">01 · What Changed</span>
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Canonical · read-only</span>
        </div>
        <p className="mt-1 text-xs text-neutral-600 dark:text-white/65">{companion.whatIsHappening}</p>
        <div className="mt-2 border-t border-emerald-100 pt-2 dark:border-white/10">
          <p className="text-xs font-medium text-neutral-800 dark:text-white/85">{insight.headline}</p>
          {insight.access !== 'ready' && <p className="mt-1 text-xs text-neutral-500 dark:text-white/60">{insight.accessMessage}</p>}
          {depth === 'simple' && visibleChanges[0] && <div className="mt-2"><ChangeHeadline change={visibleChanges[0]} /></div>}
          {depth !== 'simple' && visibleChanges.length > 0 && (
            <div className="mt-2" data-eden-interactive-exploration="v1">
              {visibleChanges.map((change) => <ExplorableChange key={change.metric} change={change} depth={depth} />)}
            </div>
          )}
        </div>
      </section>

      <section
        aria-label="Why It Matters"
        className="rounded-lg border border-emerald-100 bg-white/80 p-2.5 dark:border-white/5 dark:bg-white/[0.03]"
        data-eden-longitudinal-why="v1"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-white/50">02 · Why It Matters</span>
        <p className="mt-1 text-xs text-neutral-800 dark:text-white/85">{companion.whyItMatters}</p>
        <p className="mt-2 border-t border-emerald-100 pt-2 text-xs leading-relaxed text-neutral-700 dark:text-white/75">{insight.whyItMatters}</p>
        <p className="mt-2 text-xs text-neutral-500 dark:text-white/55">
          Observed records and inferred patterns are labelled separately. Simulations are not evidence of change; clinician-reviewed records remain explicitly identified.
        </p>

        {depth === 'simple' && simpleUnknown && (
          <p className="mt-2 text-xs text-neutral-500 dark:text-white/55">Unknown: {simpleUnknown}</p>
        )}
        {depth !== 'simple' && insight.access === 'ready' && (
          <details className="mt-2 border-t border-emerald-100 pt-1 dark:border-white/10" data-eden-truth-boundaries="v1">
            <summary className="flex min-h-[44px] cursor-pointer items-center text-xs font-bold text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:text-white/75">
              {depth === 'deep' ? 'Evidence boundaries, unknowns & truth classes' : 'Unknowns & separated truth classes'}
            </summary>
            <div className="pb-2">
              {insight.unknowns.length > 0 ? (
                <ul className="space-y-1 text-xs leading-relaxed text-neutral-600 dark:text-white/65">
                  {insight.unknowns.map((unknown) => <li key={unknown}>· {unknown}</li>)}
                </ul>
              ) : <p className="text-xs text-neutral-500">No additional data-quality limitation was identified by this projection.</p>}
              <div className="mt-2 flex flex-wrap gap-1.5" data-eden-separated-truth-classes="v1">
                {insight.separated.map((item) => (
                  <span key={item.semanticState} className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-600 dark:bg-white/5 dark:text-white/65" data-separated-state={item.semanticState}>
                    {item.semanticState}: {item.eventCount} visible record{item.eventCount === 1 ? '' : 's'}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-neutral-500 dark:text-white/55">
                Scope: authorized personal body view only; other domains are not inspected or disclosed here. Non-observation or clinician-rejected records in the trend-eligible lane: {insight.governance.nonObservationTrendInputs}. Clinician-reviewed records in this view: {insight.clinicianReviewedRecordCount}. Undeclared legacy values are never relabelled as measured.
              </p>
              {depth === 'deep' && (
                <p className="mt-2 font-mono text-xs text-neutral-500 dark:text-white/50">
                  Consent blocks: {insight.governance.blockedByConsent} · governance blocks: {insight.governance.blockedByTruthClass} · pending review: {insight.governance.pendingClinicalReview} · autonomous clinical commits: forbidden
                </p>
              )}
            </div>
          </details>
        )}

        {depth === 'deep' && references.length > 0 && (
          <div className="mt-2 border-t border-emerald-100 pt-2 dark:border-white/10" data-eden-reference-library="v1">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-white/50">Scientific evidence · reviewed 2026-10-27</p>
            {references.map((reference) => (
              <div key={reference.id} className="mt-2 text-xs leading-relaxed">
                <a href={reference.url} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center rounded-lg pr-2 font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4 dark:text-emerald-300">
                  {reference.title} ↗
                </a>
                <p className="text-neutral-500 dark:text-white/55">{reference.publisher} · general physiology, not personal diagnostic evidence.</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
