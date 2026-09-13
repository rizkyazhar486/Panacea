import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  FINANCE_EXTERNAL_REFERENCES,
  FINANCE_RESEARCH_BOUNDARY,
  evaluateFinanceResearchGate,
  type FinanceEvidenceItem,
} from '../../src/lib/finance/financeResearchWorkbench'

const ids = FINANCE_EXTERNAL_REFERENCES.map((item) => item.id)
assert.deepEqual(ids, ['autohedge', 'vibe-trading', 'fincept-terminal', 'librechat', 'open-higgsfield-ai'])
assert.ok(FINANCE_EXTERNAL_REFERENCES.every((item) => item.codeCopied === false), 'reference wave must not claim copied third-party code')
assert.equal(FINANCE_EXTERNAL_REFERENCES.find((item) => item.id === 'fincept-terminal')?.licenseState, 'strong-copyleft-reference-only')
assert.equal(FINANCE_EXTERNAL_REFERENCES.find((item) => item.id === 'open-higgsfield-ai')?.licenseState, 'declared-unverified-reference-only')
assert.match(FINANCE_RESEARCH_BOUNDARY, /does not autonomously place live orders/i)
assert.match(FINANCE_RESEARCH_BOUNDARY, /wallet private keys/i)

const observed = (id: string, source: string): FinanceEvidenceItem => ({
  id,
  source,
  observedAt: '2026-09-14T00:00:00Z',
  provenance: `source://${id}`,
  kind: 'observed',
  completeness: 'complete',
})

const empty = evaluateFinanceResearchGate({
  thesis: '', evidence: [], backtest: 'not-run', contradictionsReviewed: false, riskLimitsDefined: false,
})
assert.equal(empty.stage, 'blocked')
assert.equal(empty.liveExecutionAllowed, false)
assert.ok(empty.blockers.some((item) => /thesis/i.test(item)))
assert.ok(empty.blockers.some((item) => /evidence/i.test(item)))
assert.ok(empty.blockers.some((item) => /risk limits/i.test(item)))

const oneSource = evaluateFinanceResearchGate({
  thesis: 'Test a bounded macro hypothesis',
  evidence: [observed('a', 'source-a')],
  backtest: 'passed',
  contradictionsReviewed: true,
  riskLimitsDefined: true,
})
assert.equal(oneSource.stage, 'research-ready')
assert.equal(oneSource.independentObservedSources, 1)
assert.equal(oneSource.liveExecutionAllowed, false)

const paperReady = evaluateFinanceResearchGate({
  thesis: 'Test a bounded macro hypothesis',
  evidence: [observed('a', 'source-a'), observed('b', 'source-b')],
  backtest: 'passed',
  contradictionsReviewed: true,
  riskLimitsDefined: true,
})
assert.equal(paperReady.stage, 'paper-ready')
assert.equal(paperReady.independentObservedSources, 2)
assert.equal(paperReady.liveExecutionAllowed, false)

const simulatedOnly = evaluateFinanceResearchGate({
  thesis: 'Simulation is not observation',
  evidence: [
    { ...observed('a', 'source-a'), kind: 'simulated' },
    { ...observed('b', 'source-b'), kind: 'simulated' },
  ],
  backtest: 'passed',
  contradictionsReviewed: true,
  riskLimitsDefined: true,
})
assert.equal(simulatedOnly.stage, 'research-ready')
assert.equal(simulatedOnly.independentObservedSources, 0)

const incomplete = evaluateFinanceResearchGate({
  thesis: 'Incomplete source must remain visible',
  evidence: [observed('a', 'source-a'), { ...observed('b', 'source-b'), completeness: 'partial' }],
  backtest: 'passed',
  contradictionsReviewed: true,
  riskLimitsDefined: true,
})
assert.equal(incomplete.stage, 'research-ready')
assert.equal(incomplete.independentObservedSources, 1)
assert.ok(incomplete.warnings.some((item) => /partial|unknown completeness/i.test(item)))

const page = await readFile(new URL('../../src/pages/finance/FinanceResearchLab.tsx', import.meta.url), 'utf8')
const moneyHub = await readFile(new URL('../../src/pages/MoneyHub.tsx', import.meta.url), 'utf8')
assert.match(page, /data-finance-research-lab/)
assert.match(page, /Research \/ paper only/)
assert.match(page, /Live execution allowed: no/)
assert.match(moneyHub, /FinanceResearchLab/)
assert.match(moneyHub, /id: 'riset'/)
assert.match(moneyHub, /tab === 'riset'/)

console.log('finance-research-workbench: ok')
