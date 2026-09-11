import type { RespiratorySourceGapReport } from './respiratoryAtlasGap'

export type AcquisitionLicenseStatus = 'verified-open' | 'verified-noncommercial' | 'unverified'
export type AcquisitionProductionUse = 'candidate' | 'research-only' | 'blocked'

export interface RespiratoryAcquisitionCandidate {
  id: string
  label: string
  sourceUrl: string
  upstreamProject: string
  targetStructureIds: readonly string[]
  candidateKind: 'segmentation-tool' | 'research-dataset' | 'research-code'
  licenseStatus: AcquisitionLicenseStatus
  license: string | null
  productionUse: AcquisitionProductionUse
  automaticImportAllowed: false
  requiresInputDataRightsCheck: boolean
  requiresAssetLevelProvenance: true
  requiresQualifiedHumanReview: true
  notes: readonly string[]
}

/**
 * Acquisition candidates are leads, not imported anatomy.
 *
 * Entries here must never be interpreted as permission to ship third-party
 * geometry. A production asset still needs source-revision identity, input-data
 * rights, attribution/transformation history, geometry validation and qualified
 * academic review through Panacea's existing fail-closed provenance gates.
 */
export const RESPIRATORY_ACQUISITION_CANDIDATES: readonly RespiratoryAcquisitionCandidate[] = [
  {
    id: 'totalsegmentator-total-lung-lobes',
    label: 'TotalSegmentator default CT lung-lobe labels',
    sourceUrl: 'https://github.com/wasserth/TotalSegmentator',
    upstreamProject: 'wasserth/TotalSegmentator',
    targetStructureIds: [
      'right-upper-lobe',
      'right-middle-lobe',
      'right-lower-lobe',
      'left-upper-lobe',
      'left-lower-lobe',
    ],
    candidateKind: 'segmentation-tool',
    licenseStatus: 'verified-open',
    license: 'Apache-2.0 for the openly available total task, per upstream repository documentation',
    productionUse: 'candidate',
    automaticImportAllowed: false,
    requiresInputDataRightsCheck: true,
    requiresAssetLevelProvenance: true,
    requiresQualifiedHumanReview: true,
    notes: [
      'Upstream default CT task explicitly lists five lung-lobe labels.',
      'Open tool/model licensing does not grant rights to arbitrary CT inputs; every generated Panacea asset still needs an independently lawful source dataset.',
      'Generated segmentation must be reviewed for topology, left/right identity, lobe boundaries, transformation history and close-zoom suitability before any verified rendering claim.',
    ],
  },
  {
    id: 'med-rad-lung-fissure-research',
    label: 'UNC Med-RAD lung fissure and respiratory-deformation environments',
    sourceUrl: 'https://github.com/UNC-Robotics/Med-RAD',
    upstreamProject: 'UNC-Robotics/Med-RAD',
    targetStructureIds: [
      'right-horizontal-fissure',
      'right-oblique-fissure',
      'left-oblique-fissure',
      'right-upper-lobe',
      'right-middle-lobe',
      'right-lower-lobe',
      'left-upper-lobe',
      'left-lower-lobe',
    ],
    candidateKind: 'research-dataset',
    licenseStatus: 'verified-noncommercial',
    license: 'CC BY-NC-SA 4.0; underlying TCIA/source terms also apply',
    productionUse: 'research-only',
    automaticImportAllowed: false,
    requiresInputDataRightsCheck: true,
    requiresAssetLevelProvenance: true,
    requiresQualifiedHumanReview: true,
    notes: [
      'Useful as a research benchmark because the project documents manually segmented lung fissures and respiratory-deformation examples.',
      'Non-commercial ShareAlike terms make this unsuitable for automatic production ingestion into a commercial product without separate permission/legal clearance.',
      'Keep it as evidence/research reference unless licensing is separately expanded and all underlying source conditions are satisfied.',
    ],
  },
  {
    id: 'fissureseg-stanford-research-lead',
    label: 'fissureSeg lobar/fissure segmentation research lead',
    sourceUrl: 'https://github.com/Devanish31/fissureSeg',
    upstreamProject: 'Devanish31/fissureSeg',
    targetStructureIds: [
      'right-horizontal-fissure',
      'right-oblique-fissure',
      'left-oblique-fissure',
    ],
    candidateKind: 'research-code',
    licenseStatus: 'unverified',
    license: null,
    productionUse: 'blocked',
    automaticImportAllowed: false,
    requiresInputDataRightsCheck: true,
    requiresAssetLevelProvenance: true,
    requiresQualifiedHumanReview: true,
    notes: [
      'Repository describes lobar/fissure segmentation and public model checkpoints, but no repository-level LICENSE was found during review.',
      'Do not copy code, checkpoints or derived geometry until license and data terms are independently verified.',
    ],
  },
] as const

export interface RespiratoryAcquisitionPlanEntry {
  structureId: string
  candidates: RespiratoryAcquisitionCandidate[]
  productionCandidateIds: string[]
  researchOnlyCandidateIds: string[]
  blockedCandidateIds: string[]
  unresolvedForProduction: boolean
}

export function buildRespiratoryAcquisitionPlan(
  gapReport: RespiratorySourceGapReport,
): RespiratoryAcquisitionPlanEntry[] {
  return gapReport.entries
    .filter((entry) => entry.coverage === 'source-node-missing')
    .map((entry) => {
      const candidates = RESPIRATORY_ACQUISITION_CANDIDATES.filter((candidate) =>
        candidate.targetStructureIds.includes(entry.structureId),
      )
      const productionCandidateIds = candidates.filter((candidate) => candidate.productionUse === 'candidate').map((candidate) => candidate.id)
      const researchOnlyCandidateIds = candidates.filter((candidate) => candidate.productionUse === 'research-only').map((candidate) => candidate.id)
      const blockedCandidateIds = candidates.filter((candidate) => candidate.productionUse === 'blocked').map((candidate) => candidate.id)
      return {
        structureId: entry.structureId,
        candidates,
        productionCandidateIds,
        researchOnlyCandidateIds,
        blockedCandidateIds,
        unresolvedForProduction: productionCandidateIds.length === 0,
      }
    })
}

export function unresolvedRespiratoryProductionGaps(plan: readonly RespiratoryAcquisitionPlanEntry[]) {
  return plan.filter((entry) => entry.unresolvedForProduction).map((entry) => entry.structureId)
}
