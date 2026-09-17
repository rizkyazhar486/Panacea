import {
  BODY_EXPOSURE_CORE_SCALE_PATH,
  auditBodyExposureMaturation,
} from './bodyExposureMaturationAudit.ts'
import type { KnowledgeScale } from './multisystemKnowledgeGraph.ts'

export interface BodyExposureGapTask {
  id: string
  domainId: string
  domainLabel: string
  scale: KnowledgeScale
  scaleOrder: number
  currentDomainCoverage: number
  priorityScore: number
  reason: string
  preserveExistingCapability: true
  requiresSourceProvenance: true
  anatomicalAccuracyClaimAllowedBeforeReview: false
}

const SCALE_WEIGHT: Readonly<Record<KnowledgeScale, number>> = {
  'whole-body': 100,
  system: 95,
  organ: 90,
  tissue: 75,
  cell: 65,
  organelle: 55,
  'molecular-pathway': 45,
  protein: 35,
  rna: 25,
  'dna-epigenome': 20,
  'neural-circuit': 40,
  'endocrine-signal': 40,
  'cognition-behavior': 30,
  'development-regeneration': 25,
  'aging-longevity': 20,
}

/**
 * Engineering backlog priority only:
 * `Priority = ScaleWeight + (1 − currentDomainCoverage) × 20`.
 *
 * ScaleWeight deliberately enforces whole-body-first maturation. The score is
 * not medical importance, disease burden, educational evidence quality, or
 * anatomical accuracy.
 */
export function buildBodyExposureGapBacklog(): BodyExposureGapTask[] {
  const audit = auditBodyExposureMaturation()
  return audit.domains
    .flatMap((domain) => domain.missingScales.map((scale) => {
      const scaleOrder = BODY_EXPOSURE_CORE_SCALE_PATH.indexOf(scale)
      const priorityScore = SCALE_WEIGHT[scale] + (1 - domain.coverageFraction) * 20
      return {
        id: `body-gap:${domain.domainId}:${scale}`,
        domainId: domain.domainId,
        domainLabel: domain.label,
        scale,
        scaleOrder,
        currentDomainCoverage: domain.coverageFraction,
        priorityScore,
        reason: scaleOrder <= 2
          ? 'Whole-body-first macro coverage is incomplete; close this gap before deeper scale polish.'
          : `Canonical ${scale} representation is missing after macro coverage; add it with explicit source/provenance boundaries.`,
        preserveExistingCapability: true as const,
        requiresSourceProvenance: true as const,
        anatomicalAccuracyClaimAllowedBeforeReview: false as const,
      }
    }))
    .sort((left, right) => right.priorityScore - left.priorityScore || left.scaleOrder - right.scaleOrder || left.domainId.localeCompare(right.domainId))
}

export function nextBodyExposureGapTasks(limit = 10) {
  if (!Number.isInteger(limit) || limit < 1) throw new Error('limit must be a positive integer')
  return buildBodyExposureGapBacklog().slice(0, limit)
}
