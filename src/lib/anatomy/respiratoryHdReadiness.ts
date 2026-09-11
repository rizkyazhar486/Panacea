import type { AnatomySourceNodeBundle } from '../anatomySourceNodeRegistry'
import { MANDATORY_ANATOMY_REFERENCES, HD_ANATOMY_RENDER_PROFILES } from './hdAnatomyContract'
import { assessRespiratorySourceCoverage } from './respiratoryAtlasGap'
import {
  buildRespiratoryAcquisitionPlan,
  unresolvedRespiratoryProductionGaps,
} from './respiratoryAcquisitionRegistry'
import {
  DERIVED_FISSURE_CONTRACTS,
  RESPIRATORY_REFERENCE_DATASET,
  RESPIRATORY_SEGMENTATION_TOOL,
} from './respiratoryReferencePipeline'

export type RespiratoryHdNextAction =
  | 'review-existing-source-node'
  | 'acquire-licensed-source'
  | 'derive-reference-from-lobe-masks'
  | 'keep-reference-only'
  | 'source-research-required'

export interface RespiratoryHdReadinessEntry {
  structureId: string
  label: string
  sourceCoverage: 'source-node-present' | 'source-node-missing' | 'reference-only'
  exactSourceNames: string[]
  nextAction: RespiratoryHdNextAction
  candidateIds: string[]
  derivedReferenceAvailable: boolean
  verifiedRenderingReady: false
  reason: string
}

export interface RespiratoryHdReadinessSnapshot {
  mandatoryReferenceUrls: string[]
  requiredStructures: number
  sourceNodePresent: number
  sourceNodeMissing: number
  referenceOnly: number
  licensedAcquisitionCandidateCount: number
  unresolvedDirectProductionSourceIds: string[]
  derivedFissureReferenceIds: string[]
  referenceDataset: typeof RESPIRATORY_REFERENCE_DATASET
  segmentationTool: typeof RESPIRATORY_SEGMENTATION_TOOL
  renderProfileIds: string[]
  entries: RespiratoryHdReadinessEntry[]
}

/**
 * Single machine-readable view of what the Breath Atlas has, what it lacks and
 * what the next legitimate acquisition action is. It intentionally never emits
 * `verifiedRenderingReady: true`; that decision belongs to asset-level
 * provenance + qualified review after geometry actually exists.
 */
export function buildRespiratoryHdReadiness(
  sourceBundles: readonly AnatomySourceNodeBundle[],
): RespiratoryHdReadinessSnapshot {
  const gap = assessRespiratorySourceCoverage(sourceBundles)
  const plan = buildRespiratoryAcquisitionPlan(gap)
  const acquisitionByStructure = new Map(plan.map((entry) => [entry.structureId, entry] as const))
  const derivedFissures = new Set(DERIVED_FISSURE_CONTRACTS.map((contract) => contract.id))

  const entries = gap.entries.map<RespiratoryHdReadinessEntry>((entry) => {
    const acquisition = acquisitionByStructure.get(entry.structureId)
    const derivedReferenceAvailable = derivedFissures.has(entry.structureId as never)
    const candidateIds = acquisition?.candidates.map((candidate) => candidate.id) ?? []

    let nextAction: RespiratoryHdNextAction
    if (entry.coverage === 'source-node-present') {
      nextAction = 'review-existing-source-node'
    } else if (entry.coverage === 'reference-only') {
      nextAction = 'keep-reference-only'
    } else if ((acquisition?.productionCandidateIds.length ?? 0) > 0) {
      nextAction = 'acquire-licensed-source'
    } else if (derivedReferenceAvailable) {
      nextAction = 'derive-reference-from-lobe-masks'
    } else {
      nextAction = 'source-research-required'
    }

    return {
      structureId: entry.structureId,
      label: entry.label,
      sourceCoverage: entry.coverage,
      exactSourceNames: entry.exactSourceNames,
      nextAction,
      candidateIds,
      derivedReferenceAvailable,
      verifiedRenderingReady: false,
      reason: entry.reason,
    }
  })

  return {
    mandatoryReferenceUrls: MANDATORY_ANATOMY_REFERENCES.map((reference) => reference.url),
    requiredStructures: gap.total,
    sourceNodePresent: gap.present,
    sourceNodeMissing: gap.missing,
    referenceOnly: gap.referenceOnly,
    licensedAcquisitionCandidateCount: plan.filter((entry) => entry.productionCandidateIds.length > 0).length,
    unresolvedDirectProductionSourceIds: unresolvedRespiratoryProductionGaps(plan),
    derivedFissureReferenceIds: DERIVED_FISSURE_CONTRACTS.map((contract) => contract.id),
    referenceDataset: RESPIRATORY_REFERENCE_DATASET,
    segmentationTool: RESPIRATORY_SEGMENTATION_TOOL,
    renderProfileIds: HD_ANATOMY_RENDER_PROFILES.map((profile) => profile.id),
    entries,
  }
}
