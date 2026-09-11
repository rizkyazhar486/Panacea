export type ResearchFrontierStage =
  | 'cell-state'
  | 'organelle'
  | 'molecular-network'
  | 'rna-dna'
  | 'disease-mechanism'
  | 'compound-space'

export type BodyExposureLifecycle =
  | 'in-progress'
  | 'engineering-complete'
  | 'review-pending'
  | 'reviewed'
  | 'deployed-reviewed'

export interface ResearchFrontierUnlockInput {
  bodyExposureLifecycle: BodyExposureLifecycle
  sourceProvenanceComplete: boolean
  academicReviewComplete: boolean
  safetyBoundaryAccepted: boolean
}

export const RESEARCH_FRONTIER_ORDER: readonly ResearchFrontierStage[] = [
  'cell-state',
  'organelle',
  'molecular-network',
  'rna-dna',
  'disease-mechanism',
  'compound-space',
]

export const RESEARCH_FRONTIER_DATA_SOURCES = [
  {
    id: 'pubchem',
    role: 'chemical identity, properties, annotations and bioactivity evidence',
    authority: 'NCBI PubChem',
    accessMode: 'federated-public-data',
  },
  {
    id: 'open-targets',
    role: 'target-disease evidence and target prioritisation context',
    authority: 'Open Targets Platform',
    accessMode: 'federated-public-data',
  },
  {
    id: 'depmap',
    role: 'cancer dependency and vulnerability evidence',
    authority: 'Broad Institute DepMap',
    accessMode: 'federated-public-data',
  },
  {
    id: 'gdc',
    role: 'cancer genomics cohorts and molecular characterization',
    authority: 'NCI Genomic Data Commons',
    accessMode: 'federated-public-data',
  },
  {
    id: 'cellxgene',
    role: 'single-cell expression and cell-state reference data',
    authority: 'CZ CELLxGENE',
    accessMode: 'federated-public-data',
  },
  {
    id: 'reactome',
    role: 'curated reactions, pathways, proteins and small-molecule context',
    authority: 'Reactome',
    accessMode: 'federated-public-data',
  },
] as const

export const RESEARCH_FRONTIER_QC = [
  'source-and-version-provenance',
  'schema-and-identifier-validation',
  'cross-database-identity-resolution',
  'holdout-and-external-validation',
  'uncertainty-and-calibration-reporting',
  'counterfactual-and-sensitivity-analysis',
  'reproducibility-and-deterministic-replay',
  'qualified-domain-review-before-publication',
] as const

export const RESEARCH_FRONTIER_SAFETY_BOUNDARY = {
  mode: 'in-silico-research-only',
  patientSpecificClinicalInference: false,
  autonomousTreatmentRecommendation: false,
  wetLabProtocolGeneration: false,
  nucleotideSequenceDesign: false,
  geneEditingGuideDesign: false,
  cultureOrTransfectionParameters: false,
  claims: {
    immortality: 'research-hypothesis-only',
    cancerCure: 'research-hypothesis-only',
    rejuvenation: 'research-hypothesis-only',
  },
} as const

export const RESEARCH_FRONTIER_MODULES = [
  {
    id: 'cell-state-simulator',
    stage: 'cell-state',
    purpose: 'visualize evidence-backed cell states, lineage relationships and state transitions',
  },
  {
    id: 'organelle-system-simulator',
    stage: 'organelle',
    purpose: 'link organelles to energy, stress, trafficking and signaling states',
  },
  {
    id: 'molecular-network-simulator',
    stage: 'molecular-network',
    purpose: 'simulate pathway and interaction-network perturbations with uncertainty',
  },
  {
    id: 'rna-dna-state-simulator',
    stage: 'rna-dna',
    purpose: 'visualize non-operational variant, regulation and expression consequences',
  },
  {
    id: 'disease-mechanism-lab',
    stage: 'disease-mechanism',
    purpose: 'compare source-backed disease mechanisms, including cancer dependencies and resistance hypotheses',
  },
  {
    id: 'compound-space-discovery',
    stage: 'compound-space',
    purpose: 'federate public chemical evidence and rank research hypotheses without claiming therapeutic efficacy',
  },
] as const

export function evaluateResearchFrontierUnlock(input: ResearchFrontierUnlockInput) {
  const blockers: string[] = []

  if (input.bodyExposureLifecycle !== 'deployed-reviewed') blockers.push('body-exposure-not-closed')
  if (!input.sourceProvenanceComplete) blockers.push('source-provenance-incomplete')
  if (!input.academicReviewComplete) blockers.push('academic-review-incomplete')
  if (!input.safetyBoundaryAccepted) blockers.push('research-safety-boundary-not-accepted')

  return {
    unlocked: blockers.length === 0,
    blockers,
    mode: RESEARCH_FRONTIER_SAFETY_BOUNDARY.mode,
  } as const
}
