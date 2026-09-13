export type FinanceReferenceId =
  | 'autohedge'
  | 'vibe-trading'
  | 'fincept-terminal'
  | 'librechat'
  | 'open-higgsfield-ai'

export type FinanceLicenseState =
  | 'verified-permissive'
  | 'strong-copyleft-reference-only'
  | 'declared-unverified-reference-only'

export interface FinanceExternalReference {
  id: FinanceReferenceId
  repo: string
  role: string
  license: string
  licenseState: FinanceLicenseState
  patterns: string[]
  blockedReuse: string[]
  codeCopied: false
}

/**
 * Architectural references for Panacea Finance.
 *
 * This registry does not vendor or execute third-party trading code. It records
 * the design ideas Panacea may independently implement, plus the license and
 * safety boundaries that prevent an architecture reference from becoming an
 * implicit permission to copy code or route real orders.
 */
export const FINANCE_EXTERNAL_REFERENCES: FinanceExternalReference[] = [
  {
    id: 'autohedge',
    repo: 'The-Swarm-Corporation/AutoHedge',
    role: 'multi-agent thesis -> quant -> risk -> execution architecture',
    license: 'MIT',
    licenseState: 'verified-permissive',
    patterns: ['specialised agent roles', 'risk-before-execution gate', 'structured outputs', 'audit logging'],
    blockedReuse: ['live autonomous order execution', 'wallet private-key ingestion'],
    codeCopied: false,
  },
  {
    id: 'vibe-trading',
    repo: 'HKUDS/Vibe-Trading',
    role: 'evidence-aware research, portfolio adapters, backtests and paper trading',
    license: 'MIT',
    licenseState: 'verified-permissive',
    patterns: ['fail-closed data adapters', 'paper/live separation', 'backtest evidence', 'missingness preservation'],
    blockedReuse: ['automatic promotion from backtest to live trading', 'treating malformed broker replies as empty accounts'],
    codeCopied: false,
  },
  {
    id: 'fincept-terminal',
    repo: 'Fincept-Corporation/FinceptTerminal',
    role: 'financial terminal information architecture, analytics and multi-source data connectivity',
    license: 'AGPL-3.0-or-later',
    licenseState: 'strong-copyleft-reference-only',
    patterns: ['portfolio analytics', 'macro/economic data desks', 'quant research workspace', 'multi-source connector catalogue'],
    blockedReuse: ['copying AGPL source into Panacea without an explicit licensing decision', 'live broker routing'],
    codeCopied: false,
  },
  {
    id: 'librechat',
    repo: 'danny-avila/LibreChat',
    role: 'model-agnostic finance copilot, agent/tool permissions, MCP and resumable research sessions',
    license: 'MIT',
    licenseState: 'verified-permissive',
    patterns: ['provider abstraction', 'agent skills/tools', 'MCP tool boundary', 'approval controls', 'observability'],
    blockedReuse: ['unbounded tool execution', 'silent model/provider switching for a signed research result'],
    codeCopied: false,
  },
  {
    id: 'open-higgsfield-ai',
    repo: 'sunnychase/open-higgsfield-ai',
    role: 'visual research brief and storyboarding interaction reference',
    license: 'README declares MIT; repository license file not verified in this wave',
    licenseState: 'declared-unverified-reference-only',
    patterns: ['model capability registry', 'submit/poll job state', 'generation history', 'responsive visual studio'],
    blockedReuse: ['copying code or assets before exact license provenance is verified', 'treating generated imagery as market evidence'],
    codeCopied: false,
  },
]

export type FinanceEvidenceKind = 'observed' | 'derived' | 'simulated'
export type FinanceCompleteness = 'complete' | 'partial' | 'unknown'

export interface FinanceEvidenceItem {
  id: string
  source: string
  observedAt: string | null
  provenance: string | null
  kind: FinanceEvidenceKind
  completeness: FinanceCompleteness
}

export interface FinanceResearchGateInput {
  thesis: string
  evidence: FinanceEvidenceItem[]
  backtest: 'not-run' | 'failed' | 'passed'
  contradictionsReviewed: boolean
  riskLimitsDefined: boolean
}

export type FinanceResearchStage = 'blocked' | 'research-ready' | 'paper-ready'

export interface FinanceResearchGateResult {
  stage: FinanceResearchStage
  blockers: string[]
  warnings: string[]
  independentObservedSources: number
  liveExecutionAllowed: false
}

function validIsoTimestamp(value: string | null): boolean {
  if (!value) return false
  return Number.isFinite(Date.parse(value))
}

/**
 * Conservative promotion gate for market research.
 *
 * The highest state is paper-ready. This module never authorises a live order,
 * predicts returns, or converts an association/backtest into a recommendation.
 */
export function evaluateFinanceResearchGate(input: FinanceResearchGateInput): FinanceResearchGateResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const thesis = input.thesis.trim()
  if (!thesis) blockers.push('Research thesis is missing.')

  const usableObserved = input.evidence.filter((item) =>
    item.kind === 'observed' &&
    item.completeness === 'complete' &&
    validIsoTimestamp(item.observedAt) &&
    Boolean(item.provenance?.trim()),
  )
  const independentObservedSources = new Set(usableObserved.map((item) => item.source.trim().toLowerCase()).filter(Boolean)).size

  if (input.evidence.length === 0) blockers.push('No evidence has been attached.')
  if (input.evidence.some((item) => item.completeness !== 'complete')) warnings.push('Some evidence is partial or has unknown completeness.')
  if (input.evidence.some((item) => !validIsoTimestamp(item.observedAt))) warnings.push('Some evidence lacks a valid observation timestamp.')
  if (input.evidence.some((item) => !item.provenance?.trim())) warnings.push('Some evidence lacks provenance.')
  if (!input.riskLimitsDefined) blockers.push('Paper simulation requires explicit risk limits.')

  let stage: FinanceResearchStage = blockers.length === 0 ? 'research-ready' : 'blocked'
  if (
    stage === 'research-ready' &&
    independentObservedSources >= 2 &&
    input.backtest === 'passed' &&
    input.contradictionsReviewed
  ) {
    stage = 'paper-ready'
  } else if (stage === 'research-ready') {
    if (independentObservedSources < 2) warnings.push('Paper readiness requires at least two independent complete observed sources.')
    if (input.backtest !== 'passed') warnings.push('Paper readiness requires a passed backtest or equivalent reproducible simulation evidence.')
    if (!input.contradictionsReviewed) warnings.push('Contradictory evidence has not been explicitly reviewed.')
  }

  return { stage, blockers, warnings, independentObservedSources, liveExecutionAllowed: false }
}

export const FINANCE_RESEARCH_BOUNDARY =
  'Panacea Finance supports education, research and paper simulation. It does not autonomously place live orders, accept wallet private keys, promise returns, or issue personalised buy/sell instructions.'
