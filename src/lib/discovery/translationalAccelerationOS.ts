/**
 * Panacea Translational Acceleration Operating System
 *
 * Purpose:
 * - federate molecule / protein / natural-product / genomics / literature / trial evidence;
 * - keep Discovery -> Innovation -> Invention -> Translation as one provenance graph;
 * - parallelize independent development work while preserving hard safety / regulatory gates;
 * - project mechanism hypotheses across Body Exposure biological scales;
 * - expose trial trustworthiness as an auditable vector rather than a fake probability;
 * - keep gene-editing, toxin and other dual-use work non-executable in this kernel.
 *
 * This module does not generate nucleotide sequences, peptide synthesis instructions,
 * toxin extraction/optimization recipes, human dosing, or autonomous clinical decisions.
 */

export type ResearchModality =
  | 'small-molecule'
  | 'natural-product'
  | 'peptide'
  | 'protein'
  | 'antibody'
  | 'rna'
  | 'gene-editing'
  | 'cell-therapy'
  | 'combination'
  | 'other'

export type ResearchSourceDomain =
  | 'chemistry'
  | 'bioactivity'
  | 'protein'
  | 'structure'
  | 'genomics'
  | 'natural-product'
  | 'toxin'
  | 'literature'
  | 'clinical-trial'
  | 'regulatory'
  | 'label'

export type EvidenceTier =
  | 'identity'
  | 'in-silico'
  | 'in-vitro'
  | 'in-vivo'
  | 'human-observational'
  | 'phase-1'
  | 'phase-2'
  | 'phase-3'
  | 'systematic-review'
  | 'regulatory'
  | 'post-market'

export type EvidenceStatus =
  | 'verified'
  | 'provisional'
  | 'contradictory'
  | 'retracted'
  | 'unavailable'

export type HazardClass =
  | 'ordinary'
  | 'bioactive-hazard'
  | 'toxin-derived'
  | 'gene-editing'
  | 'pathogen-related'

export type BiologicalScale =
  | 'molecule'
  | 'organelle'
  | 'cell'
  | 'tissue'
  | 'organ'
  | 'system'
  | 'whole-body'

export interface FederatedKnowledgeSource {
  id: string
  name: string
  domain: ResearchSourceDomain
  role: string
  canonicalIdentifiers: readonly string[]
  access: 'public-api' | 'public-download' | 'adapter-required' | 'licensed'
  localMirrorPolicy: 'metadata-only' | 'cache-permitted' | 'source-dependent'
  claimsSupport: readonly EvidenceTier[]
  status: 'catalogued' | 'adapter-required' | 'connected'
  note?: string
}

/**
 * This is a federation map, not a claim that Panacea already mirrors or connects
 * every listed source.
 */
export const TRANSLATIONAL_KNOWLEDGE_FEDERATION: readonly FederatedKnowledgeSource[] = Object.freeze([
  {
    id: 'pubchem',
    name: 'PubChem',
    domain: 'chemistry',
    role: 'Chemical identity, structure identifiers, properties and linked bioassay context.',
    canonicalIdentifiers: ['CID', 'InChIKey', 'SMILES'],
    access: 'public-api',
    localMirrorPolicy: 'source-dependent',
    claimsSupport: ['identity', 'in-silico', 'in-vitro'],
    status: 'adapter-required',
  },
  {
    id: 'chembl',
    name: 'ChEMBL',
    domain: 'bioactivity',
    role: 'Curated compound-target bioactivity and assay evidence.',
    canonicalIdentifiers: ['ChEMBL ID'],
    access: 'public-api',
    localMirrorPolicy: 'source-dependent',
    claimsSupport: ['identity', 'in-vitro', 'in-vivo'],
    status: 'adapter-required',
  },
  {
    id: 'bindingdb',
    name: 'BindingDB',
    domain: 'bioactivity',
    role: 'Measured protein-ligand binding records with publication provenance.',
    canonicalIdentifiers: ['BindingDB monomer ID', 'DOI', 'PMID'],
    access: 'public-download',
    localMirrorPolicy: 'source-dependent',
    claimsSupport: ['in-vitro'],
    status: 'adapter-required',
  },
  {
    id: 'uniprot',
    name: 'UniProt',
    domain: 'protein',
    role: 'Protein identity, function, organism and sequence provenance.',
    canonicalIdentifiers: ['UniProt accession'],
    access: 'public-api',
    localMirrorPolicy: 'source-dependent',
    claimsSupport: ['identity'],
    status: 'adapter-required',
  },
  {
    id: 'toxprot',
    name: 'UniProtKB/Swiss-Prot Tox-Prot',
    domain: 'toxin',
    role: 'Curated toxin protein identity and biological-function annotations.',
    canonicalIdentifiers: ['UniProt accession', 'NCBI Taxonomy ID'],
    access: 'public-api',
    localMirrorPolicy: 'metadata-only',
    claimsSupport: ['identity', 'in-vitro', 'in-vivo'],
    status: 'adapter-required',
    note: 'Cataloguing mechanism evidence is allowed; extraction, synthesis and potency optimization are outside this OS.',
  },
  {
    id: 'rcsb-pdb',
    name: 'RCSB Protein Data Bank',
    domain: 'structure',
    role: 'Experimentally determined macromolecular structures and ligand complexes.',
    canonicalIdentifiers: ['PDB ID'],
    access: 'public-api',
    localMirrorPolicy: 'cache-permitted',
    claimsSupport: ['identity', 'in-vitro'],
    status: 'adapter-required',
  },
  {
    id: 'alphafold-db',
    name: 'AlphaFold Protein Structure Database',
    domain: 'structure',
    role: 'Predicted protein structure context with explicit prediction provenance.',
    canonicalIdentifiers: ['UniProt accession'],
    access: 'public-download',
    localMirrorPolicy: 'cache-permitted',
    claimsSupport: ['in-silico'],
    status: 'adapter-required',
  },
  {
    id: 'open-targets',
    name: 'Open Targets',
    domain: 'bioactivity',
    role: 'Target-disease evidence graph and tractability context.',
    canonicalIdentifiers: ['Ensembl gene ID', 'EFO ID'],
    access: 'public-api',
    localMirrorPolicy: 'source-dependent',
    claimsSupport: ['identity', 'human-observational', 'in-vivo'],
    status: 'adapter-required',
  },
  {
    id: 'clinvar',
    name: 'ClinVar',
    domain: 'genomics',
    role: 'Variant-condition assertions with review status and submission provenance.',
    canonicalIdentifiers: ['Variation ID', 'HGVS'],
    access: 'public-api',
    localMirrorPolicy: 'source-dependent',
    claimsSupport: ['identity', 'human-observational'],
    status: 'adapter-required',
  },
  {
    id: 'ensembl',
    name: 'Ensembl',
    domain: 'genomics',
    role: 'Reference gene, transcript, variant and comparative-genomics identifiers.',
    canonicalIdentifiers: ['Ensembl gene ID', 'Ensembl transcript ID'],
    access: 'public-api',
    localMirrorPolicy: 'source-dependent',
    claimsSupport: ['identity'],
    status: 'adapter-required',
  },
  {
    id: 'gnomad',
    name: 'gnomAD',
    domain: 'genomics',
    role: 'Population variation frequency and constraint context.',
    canonicalIdentifiers: ['variant coordinate', 'gene'],
    access: 'public-download',
    localMirrorPolicy: 'source-dependent',
    claimsSupport: ['human-observational'],
    status: 'adapter-required',
  },
  {
    id: 'lotus',
    name: 'LOTUS',
    domain: 'natural-product',
    role: 'Natural-product occurrence linked to organisms and literature.',
    canonicalIdentifiers: ['structure identifier', 'NCBI Taxonomy ID'],
    access: 'public-download',
    localMirrorPolicy: 'source-dependent',
    claimsSupport: ['identity'],
    status: 'adapter-required',
  },
  {
    id: 'coconut',
    name: 'COCONUT',
    domain: 'natural-product',
    role: 'Open natural-product structure collection for cross-source identity federation.',
    canonicalIdentifiers: ['InChIKey', 'SMILES'],
    access: 'public-download',
    localMirrorPolicy: 'source-dependent',
    claimsSupport: ['identity'],
    status: 'adapter-required',
  },
  {
    id: 'npatlas',
    name: 'Natural Products Atlas',
    domain: 'natural-product',
    role: 'Microbial natural-product identity, taxonomy and literature provenance.',
    canonicalIdentifiers: ['NPA ID', 'InChIKey'],
    access: 'public-download',
    localMirrorPolicy: 'source-dependent',
    claimsSupport: ['identity'],
    status: 'adapter-required',
  },
  {
    id: 'pubmed',
    name: 'PubMed',
    domain: 'literature',
    role: 'Primary biomedical literature discovery and bibliographic provenance.',
    canonicalIdentifiers: ['PMID', 'DOI', 'PMCID'],
    access: 'public-api',
    localMirrorPolicy: 'metadata-only',
    claimsSupport: ['in-vitro', 'in-vivo', 'human-observational', 'phase-1', 'phase-2', 'phase-3', 'systematic-review'],
    status: 'connected',
  },
  {
    id: 'clinicaltrials-gov',
    name: 'ClinicalTrials.gov',
    domain: 'clinical-trial',
    role: 'Registered human-study design, status, outcomes and results context.',
    canonicalIdentifiers: ['NCT ID'],
    access: 'public-api',
    localMirrorPolicy: 'metadata-only',
    claimsSupport: ['phase-1', 'phase-2', 'phase-3'],
    status: 'connected',
  },
  {
    id: 'dailymed',
    name: 'DailyMed',
    domain: 'label',
    role: 'Official U.S. structured product-label evidence and label history.',
    canonicalIdentifiers: ['SPL Set ID', 'NDC', 'RxCUI'],
    access: 'public-api',
    localMirrorPolicy: 'metadata-only',
    claimsSupport: ['regulatory', 'post-market'],
    status: 'connected',
  },
] as const)

export interface ResearchEntity {
  id: string
  label: string
  modality: ResearchModality
  hazardClass: HazardClass
  identity: readonly {
    namespace: string
    value: string
    sourceId: string
    verifiedAt: string
  }[]
  organismOrigin?: {
    taxonomyId?: string
    scientificName?: string
    sourceClass: 'human' | 'animal' | 'plant' | 'fungus' | 'microbial' | 'environmental' | 'synthetic' | 'unknown'
    biologicalRole?: string
  }
  mechanismHypothesis?: string
}

export interface EvidenceArtifact {
  id: string
  entityId: string
  tier: EvidenceTier
  status: EvidenceStatus
  sourceId: string
  recordId: string
  title: string
  capturedAt: string
  directness: 'direct' | 'supporting' | 'indirect'
  independentReplication: 'none' | 'single' | 'multiple'
  population?: string
  endpoint?: string
  limitations: readonly string[]
  contradictionIds?: readonly string[]
}

export interface NonExecutableDesignIntent {
  id: string
  entityLabel: string
  modality: ResearchModality
  targetId: string
  desiredFunctionalEffect:
    | 'inhibit'
    | 'activate'
    | 'stabilize'
    | 'degrade'
    | 'neutralize'
    | 'replace'
    | 'correct'
    | 'modulate'
    | 'unknown'
  rationale: string
  hazardClass: HazardClass
  /**
   * Deliberately abstract. Exact nucleotide/amino-acid sequence generation,
   * synthesis recipes and delivery recipes are not represented here.
   */
  executableSequenceGeneration: false
  wetLabProtocolGeneration: false
}

export interface MechanismProjectionNode {
  id: string
  scale: BiologicalScale
  label: string
  sourceStructureId?: string
  effect: 'candidate-up' | 'candidate-down' | 'candidate-modulated' | 'unknown'
  evidenceIds: readonly string[]
}

export interface BodyExposureResearchProjection {
  entityId: string
  generatedAt: string
  nodes: readonly MechanismProjectionNode[]
  boundary: 'research-hypothesis-only'
}

export function buildBodyExposureResearchProjection(
  entityId: string,
  generatedAt: string,
  nodes: readonly MechanismProjectionNode[],
): BodyExposureResearchProjection {
  if (!entityId.trim()) throw new Error('entityId must not be blank')
  if (!Number.isFinite(Date.parse(generatedAt))) throw new Error('generatedAt must be ISO date-time')
  const ids = new Set<string>()
  for (const node of nodes) {
    if (!node.id.trim() || !node.label.trim()) throw new Error('projection nodes require id and label')
    if (ids.has(node.id)) throw new Error(`duplicate projection node: ${node.id}`)
    ids.add(node.id)
  }
  return {
    entityId,
    generatedAt,
    nodes: nodes.map((node) => ({ ...node, evidenceIds: [...node.evidenceIds] })),
    boundary: 'research-hypothesis-only',
  }
}

export type TrialEvidenceDimension =
  | 'protocol-prespecification'
  | 'allocation-bias-control'
  | 'blinding-or-objective-endpoint'
  | 'comparator-appropriateness'
  | 'endpoint-validity'
  | 'sample-size-justification'
  | 'missing-data-control'
  | 'result-reporting'
  | 'replication'
  | 'population-applicability'
  | 'safety-characterization'
  | 'provenance'

export type DimensionState = 'verified' | 'partial' | 'failed' | 'unknown' | 'not-applicable'

export interface TrialTrustDimension {
  dimension: TrialEvidenceDimension
  state: DimensionState
  evidenceIds: readonly string[]
  note: string
}

export interface TrialTrustworthinessProfile {
  trialId: string
  dimensions: readonly TrialTrustDimension[]
  verifiedCoverage: number
  unresolvedCount: number
  failedCount: number
  stage:
    | 'insufficient-for-interpretation'
    | 'exploratory-evidence'
    | 'confirmatory-candidate'
    | 'externally-replicated-evidence'
  /**
   * Coverage is not probability of efficacy.
   */
  formula: 'verifiedCoverage = verifiedApplicableDimensions / applicableDimensions'
}

const REQUIRED_CONFIRMATORY_DIMENSIONS = new Set<TrialEvidenceDimension>([
  'protocol-prespecification',
  'allocation-bias-control',
  'comparator-appropriateness',
  'endpoint-validity',
  'sample-size-justification',
  'missing-data-control',
  'result-reporting',
  'safety-characterization',
  'provenance',
])

export function assessTrialTrustworthiness(
  trialId: string,
  dimensions: readonly TrialTrustDimension[],
): TrialTrustworthinessProfile {
  if (!trialId.trim()) throw new Error('trialId must not be blank')
  const byDimension = new Map<TrialEvidenceDimension, TrialTrustDimension>()
  for (const item of dimensions) {
    if (byDimension.has(item.dimension)) throw new Error(`duplicate trial evidence dimension: ${item.dimension}`)
    byDimension.set(item.dimension, item)
  }

  const applicable = dimensions.filter((item) => item.state !== 'not-applicable')
  const verified = applicable.filter((item) => item.state === 'verified')
  const failed = applicable.filter((item) => item.state === 'failed')
  const unresolved = applicable.filter((item) => item.state === 'unknown' || item.state === 'partial')
  const verifiedCoverage = applicable.length ? verified.length / applicable.length : 0

  const confirmatoryCoreVerified = [...REQUIRED_CONFIRMATORY_DIMENSIONS]
    .every((dimension) => byDimension.get(dimension)?.state === 'verified')
  const replicated = byDimension.get('replication')?.state === 'verified'

  let stage: TrialTrustworthinessProfile['stage'] = 'insufficient-for-interpretation'
  if (applicable.length >= 4 && failed.length === 0) stage = 'exploratory-evidence'
  if (confirmatoryCoreVerified && failed.length === 0) stage = 'confirmatory-candidate'
  if (confirmatoryCoreVerified && replicated && failed.length === 0) stage = 'externally-replicated-evidence'

  return {
    trialId,
    dimensions: dimensions.map((item) => ({ ...item, evidenceIds: [...item.evidenceIds] })),
    verifiedCoverage: Number(verifiedCoverage.toFixed(3)),
    unresolvedCount: unresolved.length,
    failedCount: failed.length,
    stage,
    formula: 'verifiedCoverage = verifiedApplicableDimensions / applicableDimensions',
  }
}

export type TranslationStage =
  | 'discovery'
  | 'candidate-selection'
  | 'nonclinical'
  | 'regulatory-entry'
  | 'phase-1'
  | 'phase-2'
  | 'confirmatory'
  | 'submission'
  | 'post-market'

export type Workstream =
  | 'evidence'
  | 'target-mechanism'
  | 'biomarker'
  | 'safety'
  | 'adme-pk'
  | 'manufacturing-cmc'
  | 'regulatory'
  | 'trial-design'
  | 'sites-recruitment'
  | 'data-standards'
  | 'model-informed-development'
  | 'publication'

export interface TranslationTask {
  id: string
  label: string
  stage: TranslationStage
  workstream: Workstream
  durationDays: number
  dependencies: readonly string[]
  hardGate: boolean
  requiredEvidenceIds: readonly string[]
  status: 'planned' | 'ready' | 'in-progress' | 'blocked' | 'complete'
}

export interface ScheduledTranslationTask extends TranslationTask {
  earliestStartDay: number
  earliestFinishDay: number
  criticalPredecessor?: string
}

export interface TranslationSchedule {
  tasks: readonly ScheduledTranslationTask[]
  sequentialDays: number
  criticalPathDays: number
  parallelizationGain: number
  speedupFactor: number
  criticalPathTaskIds: readonly string[]
  formulas: readonly [
    'SequentialTime = Σ durationᵢ',
    'CriticalPathTime = max(path Σ durationᵢ)',
    'ParallelizationGain = 1 − CriticalPathTime / SequentialTime',
    'SpeedupFactor = SequentialTime / CriticalPathTime',
  ]
}

export function scheduleTranslationWorkflow(tasks: readonly TranslationTask[]): TranslationSchedule {
  if (!tasks.length) {
    return {
      tasks: [],
      sequentialDays: 0,
      criticalPathDays: 0,
      parallelizationGain: 0,
      speedupFactor: 1,
      criticalPathTaskIds: [],
      formulas: [
        'SequentialTime = Σ durationᵢ',
        'CriticalPathTime = max(path Σ durationᵢ)',
        'ParallelizationGain = 1 − CriticalPathTime / SequentialTime',
        'SpeedupFactor = SequentialTime / CriticalPathTime',
      ],
    }
  }

  const byId = new Map<string, TranslationTask>()
  for (const task of tasks) {
    if (!task.id.trim() || !task.label.trim()) throw new Error('translation task requires id and label')
    if (byId.has(task.id)) throw new Error(`duplicate translation task: ${task.id}`)
    if (!Number.isFinite(task.durationDays) || task.durationDays < 0) throw new Error('durationDays must be finite and non-negative')
    byId.set(task.id, task)
  }
  for (const task of tasks) {
    for (const dependency of task.dependencies) {
      if (!byId.has(dependency)) throw new Error(`unknown dependency ${dependency} for task ${task.id}`)
    }
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()
  const ordered: string[] = []
  const visit = (id: string) => {
    if (visited.has(id)) return
    if (visiting.has(id)) throw new Error('translation workflow contains a dependency cycle')
    visiting.add(id)
    for (const dependency of byId.get(id)!.dependencies) visit(dependency)
    visiting.delete(id)
    visited.add(id)
    ordered.push(id)
  }
  for (const task of tasks) visit(task.id)

  const scheduled = new Map<string, ScheduledTranslationTask>()
  for (const id of ordered) {
    const task = byId.get(id)!
    let earliestStartDay = 0
    let criticalPredecessor: string | undefined
    for (const dependency of task.dependencies) {
      const dep = scheduled.get(dependency)!
      if (dep.earliestFinishDay > earliestStartDay) {
        earliestStartDay = dep.earliestFinishDay
        criticalPredecessor = dependency
      }
    }
    scheduled.set(id, {
      ...task,
      dependencies: [...task.dependencies],
      requiredEvidenceIds: [...task.requiredEvidenceIds],
      earliestStartDay,
      earliestFinishDay: earliestStartDay + task.durationDays,
      criticalPredecessor,
    })
  }

  const scheduledTasks = tasks.map((task) => scheduled.get(task.id)!)
  const sequentialDays = tasks.reduce((sum, task) => sum + task.durationDays, 0)
  const terminal = scheduledTasks.reduce((best, task) =>
    task.earliestFinishDay > best.earliestFinishDay ? task : best,
  scheduledTasks[0])
  const criticalPathDays = terminal.earliestFinishDay
  const path: string[] = []
  let cursor: ScheduledTranslationTask | undefined = terminal
  while (cursor) {
    path.push(cursor.id)
    cursor = cursor.criticalPredecessor ? scheduled.get(cursor.criticalPredecessor) : undefined
  }
  path.reverse()

  return {
    tasks: scheduledTasks,
    sequentialDays,
    criticalPathDays,
    parallelizationGain: sequentialDays > 0
      ? Number((1 - criticalPathDays / sequentialDays).toFixed(3))
      : 0,
    speedupFactor: criticalPathDays > 0
      ? Number((sequentialDays / criticalPathDays).toFixed(3))
      : 1,
    criticalPathTaskIds: path,
    formulas: [
      'SequentialTime = Σ durationᵢ',
      'CriticalPathTime = max(path Σ durationᵢ)',
      'ParallelizationGain = 1 − CriticalPathTime / SequentialTime',
      'SpeedupFactor = SequentialTime / CriticalPathTime',
    ],
  }
}

export interface TranslationGateRequirement {
  id: string
  label: string
  evidenceTiers: readonly EvidenceTier[]
  minimumVerifiedArtifacts: number
}

export interface TranslationGateResult {
  passed: boolean
  satisfiedRequirementIds: readonly string[]
  missingRequirementIds: readonly string[]
  blockedHazardReason?: string
}

export function evaluateTranslationGate(
  entity: ResearchEntity,
  artifacts: readonly EvidenceArtifact[],
  requirements: readonly TranslationGateRequirement[],
): TranslationGateResult {
  const verified = artifacts.filter((artifact) => artifact.entityId === entity.id && artifact.status === 'verified')
  const satisfiedRequirementIds: string[] = []
  const missingRequirementIds: string[] = []

  for (const requirement of requirements) {
    const count = verified.filter((artifact) => requirement.evidenceTiers.includes(artifact.tier)).length
    if (count >= requirement.minimumVerifiedArtifacts) satisfiedRequirementIds.push(requirement.id)
    else missingRequirementIds.push(requirement.id)
  }

  const blockedHazardReason = entity.hazardClass === 'pathogen-related'
    ? 'Pathogen-related translation requires a separately governed biosafety pathway; executable design is not available in this OS.'
    : undefined

  return {
    passed: missingRequirementIds.length === 0 && !blockedHazardReason,
    satisfiedRequirementIds,
    missingRequirementIds,
    blockedHazardReason,
  }
}

export interface AccelerationOpportunity {
  id: string
  kind:
    | 'parallelize-independent-work'
    | 'reuse-master-protocol-infrastructure'
    | 'adaptive-design-candidate'
    | 'model-informed-development'
    | 'biomarker-enrichment'
    | 'remote-or-digital-measurement'
    | 'registry-or-rwe-context'
    | 'early-regulatory-engagement'
  rationale: string
  preconditions: readonly string[]
  maySkipClinicalGate: false
}

export const TRANSLATIONAL_ACCELERATION_PLAYBOOK: readonly AccelerationOpportunity[] = Object.freeze([
  {
    id: 'parallelize',
    kind: 'parallelize-independent-work',
    rationale: 'Run independent evidence, CMC, biomarker, data-standard, site and regulatory-preparation workstreams concurrently when governance permits.',
    preconditions: ['dependency graph is explicit', 'hard safety gates remain blocking', 'versioned shared evidence graph'],
    maySkipClinicalGate: false,
  },
  {
    id: 'master-protocol',
    kind: 'reuse-master-protocol-infrastructure',
    rationale: 'Reuse common infrastructure and control strategies when a scientifically and regulatorily appropriate master protocol can answer multiple related questions.',
    preconditions: ['shared disease or biomarker framework', 'prespecified statistical analysis plan', 'regulatory and ethics review'],
    maySkipClinicalGate: false,
  },
  {
    id: 'adaptive-design',
    kind: 'adaptive-design-candidate',
    rationale: 'Evaluate prespecified adaptive designs when simulation can demonstrate valid operating characteristics and the design matches the development question.',
    preconditions: ['adaptation rules prespecified', 'simulation plan', 'type-I error / bias / interpretability addressed', 'regulatory engagement'],
    maySkipClinicalGate: false,
  },
  {
    id: 'midd',
    kind: 'model-informed-development',
    rationale: 'Use exposure-response, disease-progression, PBPK or trial simulation models when they are fit for the stated context of use and model risk is explicit.',
    preconditions: ['question of interest', 'context of use', 'model evaluation plan', 'consequence of wrong decision assessed'],
    maySkipClinicalGate: false,
  },
  {
    id: 'biomarker',
    kind: 'biomarker-enrichment',
    rationale: 'Use validated or appropriately qualified biomarkers to enrich, stratify or measure target engagement when evidence supports the context of use.',
    preconditions: ['analytical validity', 'clinical or mechanistic relevance', 'prespecified use'],
    maySkipClinicalGate: false,
  },
  {
    id: 'early-regulatory',
    kind: 'early-regulatory-engagement',
    rationale: 'Surface regulatory questions early enough that feedback can change the development program before expensive dependent work starts.',
    preconditions: ['clear question', 'evidence package', 'decision impact documented'],
    maySkipClinicalGate: false,
  },
])

export const TRANSLATIONAL_OS_POLICY = Object.freeze({
  executableNucleotideSequenceGeneration: false as const,
  executablePeptideSynthesisInstructionGeneration: false as const,
  toxinExtractionOrPotencyOptimization: false as const,
  pathogenEnhancementDesign: false as const,
  autonomousHumanDosing: false as const,
  autonomousClinicalTrialEnrollmentDecision: false as const,
  autonomousDiagnosisOrTreatment: false as const,
  clinicalPhasesMayBeSkipped: false as const,
  humanScientificReviewRequired: true as const,
  regulatoryReviewRequired: true as const,
})

export const TRANSLATIONAL_OS_BOUNDARY =
  'Panacea may federate evidence, rank research questions, generate non-executable modality hypotheses, simulate development workflows, project mechanisms across biological scales, and identify evidence or trial-design bottlenecks. It does not generate executable gene-editing sequences, peptide synthesis recipes, toxin optimization, pathogen enhancement, human dosing, or a shortcut around required clinical and regulatory review.'
