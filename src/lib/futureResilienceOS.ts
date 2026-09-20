/**
 * Panacea Future Resilience OS
 *
 * Purpose:
 * Keep Panacea upgradeable as models, standards, devices, renderers, data stores,
 * browsers and deployment platforms change. This module is deliberately vendor-
 * neutral: canonical contracts own product behavior; vendors are replaceable edges.
 *
 * The scores below are internal engineering heuristics, not clinical probabilities.
 * Inputs are normalized to [0, 1].
 */

export type ResilienceSurface =
  | 'ai-runtime'
  | 'evidence-retrieval'
  | 'clinical-data'
  | 'medical-device-ingestion'
  | 'imaging'
  | 'body-rendering'
  | 'identity-auth'
  | 'storage'
  | 'interoperability'
  | 'deployment'
  | 'security-privacy'

export type RadarDisposition = 'evaluate-now' | 'prototype' | 'watch' | 'defer'

export interface FutureResilienceBaseline {
  contractCoverage: number
  automatedTestCoverage: number
  providerAbstraction: number
  dataPortability: number
  observability: number
  rollbackReadiness: number
  evidenceFreshness: number
  teamContinuity: number
}

export interface TechnologyCandidate {
  id: string
  name: string
  surface: ResilienceSurface
  sourceRef: string
  assessedAt: string
  expectedUpside: number
  maturity: number
  compatibility: number
  portability: number
  reversibility: number
  security: number
  clinicalSafety: number
  migrationCost: number
  vendorLockIn: number
  evidenceAgeDays: number
  benchmarkValidated: boolean
  shadowValidated: boolean
  rollbackValidated: boolean
  unknowns?: readonly string[]
}

export interface TechnologyAssessment {
  candidateId: string
  adoptionReadiness: number
  obsolescencePressure: number
  freshnessPressure: number
  researchUrgency: number
  disposition: RadarDisposition
  replacementAllowed: boolean
  blockers: readonly string[]
}

export interface FutureResilienceAssessment {
  resilienceIndex: number
  resilienceGrade: 'fragile' | 'exposed' | 'resilient' | 'anti-fragile'
  technologyRadar: readonly TechnologyAssessment[]
}

export const PANACEA_FUTURE_RESILIENCE_POLICY = Object.freeze({
  canonicalContractsOwnBehavior: true,
  providerAgnosticByDefault: true,
  deviceIndependentByDefault: true,
  exportableDataRequired: true,
  versionedAdaptersRequired: true,
  benchmarkBeforeReplacement: true,
  shadowBeforeCutover: true,
  rollbackBeforeCutover: true,
  preserveClinicalProvenance: true,
  preserveHumanClinicalGate: true,
  preserveExistingCapabilityDuringMigration: true,
  singleVendorMayNotOwnPatientTruth: true,
  weeklyRiskReviewDays: 7,
  deepHorizonReviewDays: 30,
  portabilityDrillDays: 90,
})

export const PANACEA_RESILIENCE_SURFACES: ReadonlyArray<{
  id: ResilienceSurface
  invariant: string
}> = Object.freeze([
  {
    id: 'ai-runtime',
    invariant: 'Model/provider adapters may change without changing canonical patient, tool, evidence, or safety contracts.',
  },
  {
    id: 'evidence-retrieval',
    invariant: 'Source adapters preserve identifiers, provenance, retrieval time, version, contradiction state, and uncertainty.',
  },
  {
    id: 'clinical-data',
    invariant: 'The longitudinal patient state remains vendor-neutral, auditable, exportable, and clinically governed.',
  },
  {
    id: 'medical-device-ingestion',
    invariant: 'Device integrations normalize into shared provenance-preserving contracts instead of vendor-specific patient state.',
  },
  {
    id: 'imaging',
    invariant: 'Imaging remains standards-first with versioned DICOM/DICOMweb adapters and explicit geometry/provenance.',
  },
  {
    id: 'body-rendering',
    invariant: 'The renderer is replaceable; semantic anatomy state, provenance, scale, selection and simulation contracts are not.',
  },
  {
    id: 'identity-auth',
    invariant: 'Authorization policy remains independent from a single identity vendor and fails closed.',
  },
  {
    id: 'storage',
    invariant: 'Critical records have documented schemas, export paths, migrations, backups and restore tests.',
  },
  {
    id: 'interoperability',
    invariant: 'FHIR, DICOM, IHE and IEEE mappings are versioned at the adapter boundary rather than baked into product state.',
  },
  {
    id: 'deployment',
    invariant: 'Runtime and deployment assumptions are documented so another supported platform can be adopted without product rewrite.',
  },
  {
    id: 'security-privacy',
    invariant: 'Secrets, consent, audit, retention and access-control semantics survive infrastructure replacement.',
  },
])

const clamp01 = (value: number): number => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))

function weightedMean(entries: ReadonlyArray<readonly [number, number]>): number {
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0)
  if (totalWeight <= 0) return 0
  return clamp01(entries.reduce((sum, [value, weight]) => sum + clamp01(value) * weight, 0) / totalWeight)
}

/**
 * ResilienceIndex = Σ(w_i * dimension_i) / Σ(w_i)
 *
 * It is an engineering readiness index, not a probability that Panacea will
 * survive until a specific year.
 */
export function calculateResilienceIndex(baseline: FutureResilienceBaseline): number {
  return weightedMean([
    [baseline.contractCoverage, 0.16],
    [baseline.automatedTestCoverage, 0.14],
    [baseline.providerAbstraction, 0.15],
    [baseline.dataPortability, 0.15],
    [baseline.observability, 0.10],
    [baseline.rollbackReadiness, 0.12],
    [baseline.evidenceFreshness, 0.10],
    [baseline.teamContinuity, 0.08],
  ])
}

/**
 * AdoptionReadiness =
 *   0.18*maturity +
 *   0.16*compatibility +
 *   0.14*portability +
 *   0.12*reversibility +
 *   0.15*security +
 *   0.15*clinicalSafety +
 *   0.05*(1-migrationCost) +
 *   0.05*(1-vendorLockIn)
 */
export function calculateAdoptionReadiness(candidate: TechnologyCandidate): number {
  return weightedMean([
    [candidate.maturity, 0.18],
    [candidate.compatibility, 0.16],
    [candidate.portability, 0.14],
    [candidate.reversibility, 0.12],
    [candidate.security, 0.15],
    [candidate.clinicalSafety, 0.15],
    [1 - clamp01(candidate.migrationCost), 0.05],
    [1 - clamp01(candidate.vendorLockIn), 0.05],
  ])
}

/**
 * ObsolescencePressure =
 *   0.40*vendorLockIn +
 *   0.30*migrationCost +
 *   0.20*(1-portability) +
 *   0.10*(1-reversibility)
 *
 * High pressure means "research escape routes early", not "replace immediately".
 */
export function calculateObsolescencePressure(candidate: TechnologyCandidate): number {
  return weightedMean([
    [candidate.vendorLockIn, 0.40],
    [candidate.migrationCost, 0.30],
    [1 - clamp01(candidate.portability), 0.20],
    [1 - clamp01(candidate.reversibility), 0.10],
  ])
}

/**
 * FreshnessPressure = min(1, evidenceAgeDays / 180)
 *
 * Six months without reassessment becomes maximum freshness pressure for fast-
 * moving technology domains. The cadence is intentionally much shorter than a
 * product rewrite cycle.
 */
export function calculateFreshnessPressure(candidate: TechnologyCandidate): number {
  return clamp01(Math.max(0, candidate.evidenceAgeDays) / 180)
}

/**
 * ResearchUrgency =
 *   0.50*expectedUpside +
 *   0.30*obsolescencePressure +
 *   0.20*freshnessPressure
 *
 * Research urgency is intentionally distinct from adoption readiness.
 */
export function calculateResearchUrgency(candidate: TechnologyCandidate): number {
  return weightedMean([
    [candidate.expectedUpside, 0.50],
    [calculateObsolescencePressure(candidate), 0.30],
    [calculateFreshnessPressure(candidate), 0.20],
  ])
}

export function assessTechnology(candidate: TechnologyCandidate): TechnologyAssessment {
  const adoptionReadiness = calculateAdoptionReadiness(candidate)
  const obsolescencePressure = calculateObsolescencePressure(candidate)
  const freshnessPressure = calculateFreshnessPressure(candidate)
  const researchUrgency = calculateResearchUrgency(candidate)
  const blockers: string[] = []

  // TypeScript types do not validate persisted JSON or adapter input at runtime.
  // Clamping keeps display scores bounded; it must never authorize a cutover.
  const normalizedEvidenceFields = [
    'expectedUpside', 'maturity', 'compatibility', 'portability', 'reversibility',
    'security', 'clinicalSafety', 'migrationCost', 'vendorLockIn',
  ] as const
  for (const field of normalizedEvidenceFields) {
    const value = candidate[field]
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      blockers.push(`invalid-evidence:${field}`)
    }
  }
  if (!Number.isFinite(candidate.evidenceAgeDays) || candidate.evidenceAgeDays < 0) {
    blockers.push('invalid-evidence:evidenceAgeDays')
  }

  if (candidate.security < 0.7) blockers.push('security-below-cutover-threshold')
  if (candidate.clinicalSafety < 0.7) blockers.push('clinical-safety-below-cutover-threshold')
  if (candidate.benchmarkValidated !== true) blockers.push('benchmark-not-validated')
  if (candidate.shadowValidated !== true) blockers.push('shadow-mode-not-validated')
  if (candidate.rollbackValidated !== true) blockers.push('rollback-not-validated')
  if (candidate.compatibility < 0.6) blockers.push('canonical-contract-compatibility-too-low')
  if (candidate.portability < 0.5) blockers.push('portability-too-low')

  const replacementAllowed = adoptionReadiness >= 0.8 && blockers.length === 0

  let disposition: RadarDisposition
  if (replacementAllowed && researchUrgency >= 0.65) disposition = 'evaluate-now'
  else if (researchUrgency >= 0.55) disposition = 'prototype'
  else if (researchUrgency >= 0.3) disposition = 'watch'
  else disposition = 'defer'

  return Object.freeze({
    candidateId: candidate.id,
    adoptionReadiness,
    obsolescencePressure,
    freshnessPressure,
    researchUrgency,
    disposition,
    replacementAllowed,
    blockers: Object.freeze(blockers),
  })
}

export function buildFutureResilienceAssessment(
  baseline: FutureResilienceBaseline,
  candidates: readonly TechnologyCandidate[],
): FutureResilienceAssessment {
  const resilienceIndex = calculateResilienceIndex(baseline)
  const resilienceGrade =
    resilienceIndex >= 0.85
      ? 'anti-fragile'
      : resilienceIndex >= 0.7
        ? 'resilient'
        : resilienceIndex >= 0.5
          ? 'exposed'
          : 'fragile'

  const technologyRadar = candidates
    .map(assessTechnology)
    .sort((a, b) => b.researchUrgency - a.researchUrgency)

  return Object.freeze({
    resilienceIndex,
    resilienceGrade,
    technologyRadar: Object.freeze(technologyRadar),
  })
}

export function listResiliencePolicyViolations(): string[] {
  const policy = PANACEA_FUTURE_RESILIENCE_POLICY
  const requiredBooleanKeys: ReadonlyArray<keyof typeof policy> = [
    'canonicalContractsOwnBehavior',
    'providerAgnosticByDefault',
    'deviceIndependentByDefault',
    'exportableDataRequired',
    'versionedAdaptersRequired',
    'benchmarkBeforeReplacement',
    'shadowBeforeCutover',
    'rollbackBeforeCutover',
    'preserveClinicalProvenance',
    'preserveHumanClinicalGate',
    'preserveExistingCapabilityDuringMigration',
    'singleVendorMayNotOwnPatientTruth',
  ]

  return requiredBooleanKeys.filter((key) => policy[key] !== true).map(String)
}
