import type { AtlasManifest, AtlasValidationIssue } from './atlasKernel'
import { atlasAncestors, atlasNodeById, validateAtlasManifest } from './atlasKernel'

export const EYE_BENCHMARK_WEIGHTS = {
  anatomy: 0.35,
  clinicalCorrelation: 0.15,
  interaction: 0.15,
  physiology: 0.10,
  safety: 0.10,
  performance: 0.10,
  evidence: 0.05,
} as const

export type EyeBenchmarkDimension = keyof typeof EYE_BENCHMARK_WEIGHTS
export type EyeBenchmarkEvidenceState = 'verified' | 'partial' | 'missing' | 'blocked'
export type EyeBenchmarkReadinessStatus = 'eligible' | 'partial' | 'blocked' | 'insufficient-evidence'

export interface EyeBenchmarkDimensionEvidence {
  /** 0..100 engineering/educational benchmark value. Never a diagnostic probability. */
  score?: number
  state: EyeBenchmarkEvidenceState
  /** Immutable repository/source locators supporting this dimension. */
  evidenceRefs: readonly string[]
  /** Gold-standard evidence must remain non-patient-specific. */
  patientSpecific?: boolean
  note?: string
}

export type EyeBenchmarkEvidence = Readonly<Record<EyeBenchmarkDimension, EyeBenchmarkDimensionEvidence>>

export interface EyeBenchmarkReadinessInput {
  manifest: AtlasManifest
  eyeNodeId: string
  evidence: EyeBenchmarkEvidence
}

export type EyeBenchmarkBlockerCode =
  | 'missing-eye-node'
  | 'wrong-eye-scale'
  | 'manifest-invalid'
  | 'geometry-not-shipped'
  | 'academic-review-incomplete'
  | 'patient-specific-evidence'

export interface EyeBenchmarkBlocker {
  code: EyeBenchmarkBlockerCode
  message: string
  nodeId?: string
}

export interface EyeBenchmarkEvidenceGap {
  dimension: EyeBenchmarkDimension
  code: 'not-verified' | 'missing-evidence-ref' | 'invalid-score' | 'geometry-partial'
  message: string
}

export interface EyeBenchmarkReadinessReport {
  eyeNodeId: string
  status: EyeBenchmarkReadinessStatus
  /** Weighted score is intentionally withheld until every dimension is verified. */
  score: number | null
  blockers: readonly EyeBenchmarkBlocker[]
  gaps: readonly EyeBenchmarkEvidenceGap[]
  /** Explicitly prevents this organ benchmark from being interpreted as whole-body maturation evidence. */
  mayOverrideGlobalMaturationGate: false
  formula: 'Q_eye = 0.35A + 0.15C + 0.15I + 0.10Phy + 0.10S + 0.10P + 0.05E'
}

const DIMENSIONS = Object.keys(EYE_BENCHMARK_WEIGHTS) as EyeBenchmarkDimension[]
const HARD_MANIFEST_CODES = new Set<AtlasValidationIssue['code']>([
  'duplicate-id',
  'missing-parent',
  'missing-child',
  'invalid-provenance',
  'invalid-academic-review',
  'non-reciprocal-hierarchy',
  'cycle',
])

function affectedHierarchyIds(manifest: AtlasManifest, eyeNodeId: string) {
  return new Set([eyeNodeId, ...atlasAncestors(manifest, eyeNodeId).map((node) => node.id)])
}

function hierarchyIssues(manifest: AtlasManifest, eyeNodeId: string) {
  const hierarchyIds = affectedHierarchyIds(manifest, eyeNodeId)
  return validateAtlasManifest(manifest).filter((issue) =>
    HARD_MANIFEST_CODES.has(issue.code)
    && (!issue.nodeId || hierarchyIds.has(issue.nodeId)),
  )
}

function dimensionGaps(evidence: EyeBenchmarkEvidence): EyeBenchmarkEvidenceGap[] {
  const gaps: EyeBenchmarkEvidenceGap[] = []
  for (const dimension of DIMENSIONS) {
    const item = evidence[dimension]
    if (item.state !== 'verified') {
      gaps.push({ dimension, code: 'not-verified', message: `${dimension} evidence is ${item.state}; verified evidence is required.` })
    }
    if (!item.evidenceRefs.some((ref) => ref.trim().length > 0)) {
      gaps.push({ dimension, code: 'missing-evidence-ref', message: `${dimension} has no immutable evidence reference.` })
    }
    if (typeof item.score !== 'number' || !Number.isFinite(item.score) || item.score < 0 || item.score > 100) {
      gaps.push({ dimension, code: 'invalid-score', message: `${dimension} score must be a finite value from 0 to 100.` })
    }
  }
  return gaps
}

function weightedScore(evidence: EyeBenchmarkEvidence) {
  const raw = DIMENSIONS.reduce((sum, dimension) =>
    sum + (evidence[dimension].score as number) * EYE_BENCHMARK_WEIGHTS[dimension], 0)
  return Math.round(raw * 100) / 100
}

/**
 * Evaluates whether the canonical Eye organ is ready to expose a benchmark score.
 *
 * This contract is deliberately stricter than a presentation/readiness badge:
 * - it reuses canonical manifest validation instead of inventing parallel provenance rules;
 * - reference-only/planned geometry can never pass as shipped Gold Standard geometry;
 * - partial geometry keeps the benchmark partial and withholds Q_eye;
 * - academic review cannot be replaced by engineering review;
 * - any patient-specific evidence blocks the benchmark;
 * - it never unlocks or overrides buildBodyMaturationReport().
 */
export function evaluateEyeBenchmarkReadiness(input: EyeBenchmarkReadinessInput): EyeBenchmarkReadinessReport {
  const { manifest, eyeNodeId, evidence } = input
  const blockers: EyeBenchmarkBlocker[] = []
  const gaps = dimensionGaps(evidence)
  const eye = atlasNodeById(manifest, eyeNodeId)

  if (!eye) {
    blockers.push({ code: 'missing-eye-node', nodeId: eyeNodeId, message: `Canonical Eye node ${eyeNodeId} does not exist.` })
  } else {
    if (eye.scale !== 'organ') {
      blockers.push({ code: 'wrong-eye-scale', nodeId: eye.id, message: `Eye benchmark root must be organ scale; received ${eye.scale}.` })
    }

    for (const issue of hierarchyIssues(manifest, eyeNodeId)) {
      blockers.push({ code: 'manifest-invalid', nodeId: issue.nodeId, message: `${issue.code}: ${issue.message}` })
    }

    if (eye.geometryStatus === 'reference-only' || eye.geometryStatus === 'planned') {
      blockers.push({
        code: 'geometry-not-shipped',
        nodeId: eye.id,
        message: `Eye geometry is ${eye.geometryStatus}; it must not be represented as shipped Gold Standard geometry.`,
      })
    } else if (eye.geometryStatus === 'partial') {
      gaps.push({
        dimension: 'anatomy',
        code: 'geometry-partial',
        message: 'Eye geometry is partial; Q_eye remains withheld until canonical geometry is shipped.',
      })
    }

    if (eye.provenance.reviewStatus !== 'academic-reviewed') {
      blockers.push({
        code: 'academic-review-incomplete',
        nodeId: eye.id,
        message: `Eye academic review is incomplete (${eye.provenance.reviewStatus}); engineering review cannot promote it.`,
      })
    }
  }

  for (const dimension of DIMENSIONS) {
    if (evidence[dimension].patientSpecific) {
      blockers.push({
        code: 'patient-specific-evidence',
        message: `${dimension} contains patient-specific evidence; Gold Standard benchmark evidence must be educational/non-patient-specific.`,
      })
    }
  }

  const verifiedDimensions = DIMENSIONS.filter((dimension) => evidence[dimension].state === 'verified').length
  const status: EyeBenchmarkReadinessStatus = blockers.length
    ? 'blocked'
    : gaps.length
      ? verifiedDimensions === 0 ? 'insufficient-evidence' : 'partial'
      : 'eligible'

  return {
    eyeNodeId,
    status,
    score: status === 'eligible' ? weightedScore(evidence) : null,
    blockers,
    gaps,
    mayOverrideGlobalMaturationGate: false,
    formula: 'Q_eye = 0.35A + 0.15C + 0.15I + 0.10Phy + 0.10S + 0.10P + 0.05E',
  }
}
