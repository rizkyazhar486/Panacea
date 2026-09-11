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

export type ResearchModelClass =
  | 'mechanistic'
  | 'statistical-baseline'
  | 'learned'
  | 'hybrid'

export type ResearchEvidenceTier =
  | 'established-human'
  | 'clinical-translational'
  | 'preclinical'
  | 'mechanistic'
  | 'computational-hypothesis'

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

export const RESEARCH_FRONTIER_MODEL_CLASSES: readonly ResearchModelClass[] = [
  'mechanistic',
  'statistical-baseline',
  'learned',
  'hybrid',
]

export const RESEARCH_FRONTIER_EVIDENCE_TIERS: readonly ResearchEvidenceTier[] = [
  'established-human',
  'clinical-translational',
  'preclinical',
  'mechanistic',
  'computational-hypothesis',
]

export const RESEARCH_FRONTIER_DATA_SOURCES = [
  {
    id: 'pubchem',
    role: 'chemical identity, properties, annotations, bioassays and bioactivity evidence',
    authority: 'NCBI PubChem',
    accessMode: 'federated-public-data',
    evidenceClass: 'experimental-and-curated',
  },
  {
    id: 'chembl',
    role: 'curated bioactive molecules, targets, assays and drug-discovery measurements',
    authority: 'EMBL-EBI ChEMBL',
    accessMode: 'federated-public-data',
    evidenceClass: 'experimental-and-curated',
  },
  {
    id: 'bindingdb',
    role: 'measured protein-small-molecule binding affinities and target relationships',
    authority: 'BindingDB',
    accessMode: 'federated-public-data',
    evidenceClass: 'experimental-and-curated',
  },
  {
    id: 'open-targets',
    role: 'target-disease evidence, genetics, tractability and drug context',
    authority: 'Open Targets Platform',
    accessMode: 'federated-public-data',
    evidenceClass: 'integrated-evidence',
  },
  {
    id: 'depmap',
    role: 'cancer dependency, vulnerability, multi-omics and model-context evidence',
    authority: 'Broad Institute DepMap',
    accessMode: 'federated-public-data',
    evidenceClass: 'experimental-and-derived',
  },
  {
    id: 'gdc',
    role: 'cancer genomics cohorts, molecular characterization and clinical metadata',
    authority: 'NCI Genomic Data Commons',
    accessMode: 'mixed-open-controlled-data',
    evidenceClass: 'human-cohort-data',
  },
  {
    id: 'cellxgene',
    role: 'single-cell expression, cell-state and tissue reference data',
    authority: 'CZ CELLxGENE',
    accessMode: 'federated-public-data',
    evidenceClass: 'single-cell-observational',
  },
  {
    id: 'gtex',
    role: 'human tissue expression, eQTL and baseline regulatory context',
    authority: 'NIH GTEx',
    accessMode: 'mixed-open-controlled-data',
    evidenceClass: 'human-reference-cohort',
  },
  {
    id: 'reactome',
    role: 'expert-curated reactions, pathways, proteins and small-molecule context',
    authority: 'Reactome',
    accessMode: 'federated-public-data',
    evidenceClass: 'expert-curated-knowledge',
  },
  {
    id: 'uniprot',
    role: 'protein identity, sequence, function and annotation',
    authority: 'UniProt',
    accessMode: 'federated-public-data',
    evidenceClass: 'curated-and-computational-annotation',
  },
  {
    id: 'rcsb-pdb',
    role: 'experimentally determined macromolecular structures and associated annotations',
    authority: 'RCSB Protein Data Bank',
    accessMode: 'federated-public-data',
    evidenceClass: 'experimental-structure',
  },
  {
    id: 'alphafold-db',
    role: 'computed protein structure predictions with model confidence',
    authority: 'AlphaFold Protein Structure Database',
    accessMode: 'federated-public-data',
    evidenceClass: 'computed-structure-prediction',
  },
] as const

export const CHEMICAL_SPACE_POLICY = {
  completenessClaimAllowed: false,
  federationRequired: true,
  distinguishMeasuredFromPredicted: true,
  distinguishEnumeratedFromGenerative: true,
  preserveInactiveAndNegativeEvidence: true,
  preserveAssayAndSourceContext: true,
  preserveProtonationAndIonizationContextWhereRelevant: true,
  diversityMustBeMeasuredAcrossMultipleRepresentations: true,
  underrepresentedClassesMustRemainVisible: true,
  underrepresentedExamples: [
    'metal-containing-compounds',
    'macrocycles',
    'natural-products',
    'mid-sized-peptides',
    'protein-protein-interaction-modulators',
    'beyond-rule-of-five-entities',
  ],
  coverageStates: [
    'experimentally-observed',
    'curated-database-record',
    'enumerated-make-on-demand',
    'computed-or-generated-hypothesis',
    'unmapped-or-unknown',
  ],
} as const

export const RESEARCH_FRONTIER_VALIDATION_AXES = [
  'expression-level-agreement',
  'delta-change-recovery',
  'differential-expression-recovery',
  'distributional-similarity',
  'cellular-abundance-response',
  'unseen-perturbation-generalization',
  'combinatorial-perturbation-generalization',
  'cross-cell-type-transfer',
  'cross-dataset-external-validation',
] as const

export const RESEARCH_FRONTIER_QC = [
  'source-and-version-provenance',
  'license-and-access-policy-recording',
  'schema-and-identifier-validation',
  'cross-database-identity-resolution',
  'ambiguity-quarantine',
  'simple-baseline-comparison',
  'holdout-and-external-validation',
  'out-of-distribution-context-validation',
  'causal-perturbation-transfer-validation',
  'expression-and-cellular-abundance-validation',
  'uncertainty-and-calibration-reporting',
  'counterfactual-and-sensitivity-analysis',
  'negative-and-null-control-checks',
  'batch-effect-and-dataset-shift-audit',
  'reproducibility-and-deterministic-replay',
  'mechanistic-consistency-checks',
  'qualified-domain-review-before-publication',
] as const

export const RESEARCH_FRONTIER_MODEL_POLICY = {
  preferredArchitecture: 'mechanistic-plus-learned-hybrid',
  simpleBaselineRequired: true,
  learnedModelMustBeatBaseline: true,
  benchmarkOnUnseenContexts: true,
  crossCellTypeTransferRequired: true,
  causalPerturbationTransferRequired: true,
  cellularAbundanceCannotBeReducedToExpressionOnly: true,
  attentionOrEmbeddingIsNotCausalEvidence: true,
  complexityIsNotEvidence: true,
} as const

export const RESEARCH_FRONTIER_STRUCTURE_POLICY = {
  experimentalAndPredictedStructuresAreNotEquivalent: true,
  experimentalStructurePreferredWhenAvailable: true,
  predictedStructureMustExposeConfidence: true,
  predictedStructureCannotSelfPromoteToExperimentalEvidence: true,
} as const

export const RESEARCH_FRONTIER_REPROGRAMMING_RISKS = [
  'genomic-instability',
  'tumorigenicity',
  'loss-of-cell-identity',
  'incomplete-or-heterogeneous-reprogramming',
  'tissue-specific-response',
  'delivery-and-temporal-control',
  'unknown-long-term-safety',
] as const

/**
 * Dated registry snapshot, not a permanent efficacy statement.
 * Refresh before presenting current translational status.
 */
export const REPROGRAMMING_TRANSLATIONAL_SNAPSHOT = {
  asOf: '2026-09-11',
  source: 'ClinicalTrials.gov',
  nctId: 'NCT07290244',
  intervention: 'ER-100 OSK epigenetic therapy',
  indicationScope: 'open-angle glaucoma and non-arteritic anterior ischemic optic neuropathy',
  phase: 'Phase 1',
  status: 'recruiting',
  estimatedEnrollment: 18,
  firstInHuman: true,
  primaryPurpose: 'safety-and-tolerability',
  postedResults: false,
  efficacyEstablished: false,
  systemicRejuvenationEstablished: false,
  lifespanExtensionEstablished: false,
  evidenceTier: 'clinical-translational' satisfies ResearchEvidenceTier,
} as const

export const AGING_HALLMARKS_2023 = [
  'genomic-instability',
  'telomere-attrition',
  'epigenetic-alterations',
  'loss-of-proteostasis',
  'disabled-macroautophagy',
  'deregulated-nutrient-sensing',
  'mitochondrial-dysfunction',
  'cellular-senescence',
  'stem-cell-exhaustion',
  'altered-intercellular-communication',
  'chronic-inflammation',
  'dysbiosis',
] as const

export const RESEARCH_FRONTIER_SAFETY_BOUNDARY = {
  mode: 'in-silico-research-only',
  patientSpecificClinicalInference: false,
  autonomousTreatmentRecommendation: false,
  wetLabProtocolGeneration: false,
  nucleotideSequenceDesign: false,
  geneEditingGuideDesign: false,
  cultureOrTransfectionParameters: false,
  operationalDeliveryDesign: false,
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
    purpose: 'visualize evidence-backed cell states, lineage relationships, abundance and state transitions',
  },
  {
    id: 'organelle-system-simulator',
    stage: 'organelle',
    purpose: 'link organelles to energy, stress, trafficking, proteostasis and signaling states',
  },
  {
    id: 'molecular-network-simulator',
    stage: 'molecular-network',
    purpose: 'combine mechanistic and learned pathway-network perturbation models with explicit uncertainty',
  },
  {
    id: 'rna-dna-state-simulator',
    stage: 'rna-dna',
    purpose: 'visualize non-operational variant, regulation, expression and epigenetic-state consequences',
  },
  {
    id: 'disease-mechanism-lab',
    stage: 'disease-mechanism',
    purpose: 'compare source-backed disease mechanisms, cancer dependencies, microenvironment and resistance hypotheses',
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
