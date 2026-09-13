import { useMemo, useState } from 'react'
import { Badge, Card, Field, inputClass } from '../../components/ui'
import {
  FINANCE_EXTERNAL_REFERENCES,
  FINANCE_RESEARCH_BOUNDARY,
  evaluateFinanceResearchGate,
  type FinanceEvidenceItem,
} from '../../lib/finance/financeResearchWorkbench'

const demoEvidence = (primary: boolean, secondary: boolean): FinanceEvidenceItem[] => {
  const out: FinanceEvidenceItem[] = []
  if (primary) out.push({
    id: 'primary-market-snapshot',
    source: 'Primary source A',
    observedAt: '2026-09-14T00:00:00Z',
    provenance: 'user-confirmed-source-a',
    kind: 'observed',
    completeness: 'complete',
  })
  if (secondary) out.push({
    id: 'secondary-market-snapshot',
    source: 'Independent source B',
    observedAt: '2026-09-14T00:00:00Z',
    provenance: 'user-confirmed-source-b',
    kind: 'observed',
    completeness: 'complete',
  })
  return out
}

export function FinanceResearchLab() {
  const [thesis, setThesis] = useState('')
  const [primary, setPrimary] = useState(false)
  const [secondary, setSecondary] = useState(false)
  const [backtest, setBacktest] = useState(false)
  const [contradictions, setContradictions] = useState(false)
  const [riskLimits, setRiskLimits] = useState(false)

  const result = useMemo(() => evaluateFinanceResearchGate({
    thesis,
    evidence: demoEvidence(primary, secondary),
    backtest: backtest ? 'passed' : 'not-run',
    contradictionsReviewed: contradictions,
    riskLimitsDefined: riskLimits,
  }), [thesis, primary, secondary, backtest, contradictions, riskLimits])

  const tone = result.stage === 'paper-ready' ? 'normal' : result.stage === 'research-ready' ? 'low' : 'high'

  return (
    <div className="space-y-4" data-finance-research-lab>
      <Card className="!p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Economics & Markets Lab</div>
            <h2 className="mt-1 text-base font-black text-ink dark:text-ink">Evidence before conviction</h2>
          </div>
          <Badge tone="low">Research / paper only</Badge>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          Panacea independently adapts useful architecture patterns from five finance/agent/visual repositories.
          No third-party trading engine is vendored here and no live broker or wallet execution is enabled.
        </p>
      </Card>

      <Card className="!p-4">
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Reference architecture</div>
        <div className="mt-2 space-y-2">
          {FINANCE_EXTERNAL_REFERENCES.map((ref) => (
            <div key={ref.id} className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[12px] font-black text-ink dark:text-ink">{ref.repo}</div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">{ref.licenseState}</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{ref.role}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ref.patterns.map((pattern) => (
                  <span key={pattern} className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">{pattern}</span>
                ))}
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">License: {ref.license}. Code copied in this wave: no.</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="!p-4">
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Research readiness gate</div>
        <div className="mt-3">
          <Field label="Research thesis — describe the question, not a buy/sell command">
            <input
              className={inputClass}
              value={thesis}
              onChange={(event) => setThesis(event.target.value)}
              placeholder="Example: what evidence would support or falsify a macro thesis?"
            />
          </Field>
        </div>

        <div className="mt-3 grid gap-2">
          {[
            [primary, setPrimary, 'Primary snapshot has source, timestamp, provenance and complete fields'],
            [secondary, setSecondary, 'Independent second observed source confirms the dataset shape'],
            [backtest, setBacktest, 'Reproducible backtest / simulation evidence has passed'],
            [contradictions, setContradictions, 'Contradictory evidence has been reviewed rather than hidden'],
            [riskLimits, setRiskLimits, 'Paper simulation has explicit risk limits'],
          ].map(([checked, setter, label]) => (
            <label key={String(label)} className="flex min-h-11 items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 dark:bg-white/5">
              <input type="checkbox" checked={checked as boolean} onChange={(event) => (setter as (v: boolean) => void)(event.target.checked)} />
              <span className="text-[11px] font-semibold leading-relaxed text-neutral-700 dark:text-neutral-200">{String(label)}</span>
            </label>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-neutral-100 p-3 dark:border-white/10">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-bold text-neutral-500">Current gate</span>
            <Badge tone={tone}>{result.stage}</Badge>
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Independent complete observed sources: {result.independentObservedSources}</div>
          {result.blockers.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[11px] leading-relaxed text-rose-700 dark:text-rose-300">
              {result.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
            </ul>
          )}
          {result.warnings.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
              {result.warnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          )}
          <p className="mt-2 text-[11px] font-bold text-neutral-600 dark:text-neutral-300">Live execution allowed: no.</p>
        </div>
      </Card>

      <Card className="!p-4">
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Planned finance stack</div>
        <ol className="mt-2 space-y-2 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          <li><b>1 · Research copilot:</b> model/provider abstraction, bounded tools, MCP-style adapters and resumable audit trail.</li>
          <li><b>2 · Economic data federation:</b> source identity, observation timestamp, units, revision/version and missingness preserved end-to-end.</li>
          <li><b>3 · Quant evidence:</b> reproducible factors/backtests, explicit assumptions, train/test separation and contradiction capture.</li>
          <li><b>4 · Risk gate:</b> limits are evaluated before paper execution; a failed or incomplete source cannot silently become a position.</li>
          <li><b>5 · Paper portfolio:</b> simulation is kept structurally separate from any future live brokerage integration.</li>
          <li><b>6 · Visual brief:</b> generated visuals can explain a thesis, but they are never counted as market evidence.</li>
        </ol>
      </Card>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
        {FINANCE_RESEARCH_BOUNDARY}
      </div>
    </div>
  )
}

export default FinanceResearchLab
