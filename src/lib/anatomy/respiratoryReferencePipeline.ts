export interface RespiratoryReferenceDataset {
  id: 'tcia-ct-vs-pet-ventilation-imaging'
  label: string
  sourceUrl: string
  doi: string
  license: 'CC BY 4.0'
  attributionRequired: true
  sourcePolicyReviewRequired: true
  subjectCount: 20
  hasInhaleExhaleBreathHoldCt: true
  hasFourDimensionalCt: true
  patientSpecificProductUseAllowed: false
  intendedPanaceaUse: 'generic-reference-reconstruction-candidate'
}

/**
 * Permissively licensed respiratory motion source candidate.
 *
 * The dataset is a source candidate, not bundled data. Panacea must preserve the
 * TCIA collection/series identity, required attribution and data-usage policy in
 * any derived generic teaching asset. Patient-specific clinical inference is out
 * of scope for this pipeline.
 */
export const RESPIRATORY_REFERENCE_DATASET: RespiratoryReferenceDataset = {
  id: 'tcia-ct-vs-pet-ventilation-imaging',
  label: 'TCIA CT-vs-PET-Ventilation-Imaging',
  sourceUrl: 'https://www.cancerimagingarchive.net/collection/ct-vs-pet-ventilation-imaging/',
  doi: '10.7937/3ppx-7s22',
  license: 'CC BY 4.0',
  attributionRequired: true,
  sourcePolicyReviewRequired: true,
  subjectCount: 20,
  hasInhaleExhaleBreathHoldCt: true,
  hasFourDimensionalCt: true,
  patientSpecificProductUseAllowed: false,
  intendedPanaceaUse: 'generic-reference-reconstruction-candidate',
}

export interface RespiratorySegmentationToolContract {
  id: 'totalsegmentator-total'
  sourceUrl: string
  task: 'total'
  license: 'Apache-2.0'
  requiredLobeLabels: readonly [
    'lung_upper_lobe_left',
    'lung_lower_lobe_left',
    'lung_upper_lobe_right',
    'lung_middle_lobe_right',
    'lung_lower_lobe_right',
  ]
  automaticClinicalUseAllowed: false
}

export const RESPIRATORY_SEGMENTATION_TOOL: RespiratorySegmentationToolContract = {
  id: 'totalsegmentator-total',
  sourceUrl: 'https://github.com/wasserth/TotalSegmentator',
  task: 'total',
  license: 'Apache-2.0',
  requiredLobeLabels: [
    'lung_upper_lobe_left',
    'lung_lower_lobe_left',
    'lung_upper_lobe_right',
    'lung_middle_lobe_right',
    'lung_lower_lobe_right',
  ],
  automaticClinicalUseAllowed: false,
}

export interface DerivedFissureContract {
  id: 'left-oblique-fissure' | 'right-oblique-fissure' | 'right-horizontal-fissure'
  method: 'adjacent-lobe-mask-interface'
  positiveLobeMasks: readonly string[]
  opposingLobeMasks: readonly string[]
  outputStatus: 'derived-reference'
  verifiedAnatomyAllowed: false
  patientSpecificAllowed: false
  sourceVoxelTransformRequired: true
  topologyAuditRequired: true
  qualifiedHumanReviewRequired: true
}

/**
 * A fissure reference surface may be derived from the shared interface between
 * independently sourced lobe masks. This is not the same as directly segmenting
 * visible fissure tissue on CT, so the output is permanently `derived-reference`
 * until a qualified reviewer and separate source evidence establish otherwise.
 */
export const DERIVED_FISSURE_CONTRACTS: readonly DerivedFissureContract[] = [
  {
    id: 'left-oblique-fissure',
    method: 'adjacent-lobe-mask-interface',
    positiveLobeMasks: ['lung_upper_lobe_left'],
    opposingLobeMasks: ['lung_lower_lobe_left'],
    outputStatus: 'derived-reference',
    verifiedAnatomyAllowed: false,
    patientSpecificAllowed: false,
    sourceVoxelTransformRequired: true,
    topologyAuditRequired: true,
    qualifiedHumanReviewRequired: true,
  },
  {
    id: 'right-horizontal-fissure',
    method: 'adjacent-lobe-mask-interface',
    positiveLobeMasks: ['lung_upper_lobe_right'],
    opposingLobeMasks: ['lung_middle_lobe_right'],
    outputStatus: 'derived-reference',
    verifiedAnatomyAllowed: false,
    patientSpecificAllowed: false,
    sourceVoxelTransformRequired: true,
    topologyAuditRequired: true,
    qualifiedHumanReviewRequired: true,
  },
  {
    id: 'right-oblique-fissure',
    method: 'adjacent-lobe-mask-interface',
    positiveLobeMasks: ['lung_lower_lobe_right'],
    opposingLobeMasks: ['lung_upper_lobe_right', 'lung_middle_lobe_right'],
    outputStatus: 'derived-reference',
    verifiedAnatomyAllowed: false,
    patientSpecificAllowed: false,
    sourceVoxelTransformRequired: true,
    topologyAuditRequired: true,
    qualifiedHumanReviewRequired: true,
  },
] as const

export type RespiratoryReconstructionStage =
  | 'source-intake'
  | 'lobe-segmentation'
  | 'fissure-interface-derivation'
  | 'surface-reconstruction'
  | 'respiratory-registration'
  | 'lod-generation'
  | 'quality-review'

export interface RespiratoryReconstructionStep {
  stage: RespiratoryReconstructionStage
  outputStatus: 'source-bound' | 'derived-reference' | 'review-required'
  requirements: readonly string[]
}

/**
 * Deterministic acquisition/reconstruction recipe for a future offline build
 * worker. The web client should only consume reviewed, provenance-pinned outputs;
 * it should never run patient CT segmentation in-browser.
 */
export const RESPIRATORY_REFERENCE_RECONSTRUCTION_PIPELINE: readonly RespiratoryReconstructionStep[] = [
  {
    stage: 'source-intake',
    outputStatus: 'source-bound',
    requirements: [
      'pin TCIA collection DOI plus subject/study/series identifiers',
      'preserve DICOM orientation and affine transforms',
      'record CC BY 4.0 attribution and TCIA data-usage-policy acknowledgement',
      'exclude any source series that fails de-identification or rights checks',
    ],
  },
  {
    stage: 'lobe-segmentation',
    outputStatus: 'derived-reference',
    requirements: [
      'run a pinned TotalSegmentator version with task=total',
      'retain all five lobe masks separately',
      'record model/tool version, command, input checksum and output checksum',
      'never treat segmentation output as qualified human review',
    ],
  },
  {
    stage: 'fissure-interface-derivation',
    outputStatus: 'derived-reference',
    requirements: [
      'derive only interfaces defined by DERIVED_FISSURE_CONTRACTS',
      'never hallucinate a fissure where lobe masks are non-adjacent',
      'retain source voxel coordinates before any smoothing',
      'mark resulting surfaces derived-reference',
    ],
  },
  {
    stage: 'surface-reconstruction',
    outputStatus: 'derived-reference',
    requirements: [
      'extract watertight candidate surfaces from labeled volumes with a deterministic algorithm',
      'preserve left/right identity and anatomical axes',
      'record smoothing, repair, decimation and normal-generation history',
      'reject self-intersections, non-manifold defects or clinically misleading topology',
    ],
  },
  {
    stage: 'respiratory-registration',
    outputStatus: 'derived-reference',
    requirements: [
      'derive reference deformation only from paired inhale/exhale source series',
      'preserve the registration algorithm/version/parameters and deformation checksum',
      'do not convert reference deformation into patient-specific ventilation claims',
      'reject implausible folding or topology inversion before visualization',
    ],
  },
  {
    stage: 'lod-generation',
    outputStatus: 'derived-reference',
    requirements: [
      'generate overview, organ and detail LODs from the same source-bound geometry',
      'preserve named-structure boundaries at every LOD',
      'measure geometric error introduced by simplification',
      'keep mobile render budgets bounded independently from source fidelity',
    ],
  },
  {
    stage: 'quality-review',
    outputStatus: 'review-required',
    requirements: [
      'compare source CT, segmentation masks and reconstructed surfaces side by side',
      'record qualified reviewer identity, credentials, date and scope',
      'keep academicReview pending until review metadata is present',
      'publish only the evidence status actually earned by the asset',
    ],
  },
] as const
