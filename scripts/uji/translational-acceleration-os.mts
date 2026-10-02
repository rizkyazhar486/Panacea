import assert from 'node:assert/strict'
import {
  TRANSLATIONAL_ACCELERATION_PLAYBOOK,
  TRANSLATIONAL_KNOWLEDGE_FEDERATION,
  TRANSLATIONAL_OS_POLICY,
  assessTrialTrustworthiness,
  buildBodyExposureResearchProjection,
  evaluateTranslationGate,
  scheduleTranslationWorkflow,
  type EvidenceArtifact,
  type ResearchEntity,
  type TranslationTask,
  type TrialTrustDimension,
} from '../../src/lib/discovery/translationalAccelerationOS.ts'

const sourceIds = TRANSLATIONAL_KNOWLEDGE_FEDERATION.map((source) => source.id)
assert.equal(new Set(sourceIds).size, sourceIds.length)
assert.ok(TRANSLATIONAL_KNOWLEDGE_FEDERATION.some((source) => source.id === 'pubchem'))
assert.ok(TRANSLATIONAL_KNOWLEDGE_FEDERATION.some((source) => source.id === 'lotus'))
assert.ok(TRANSLATIONAL_KNOWLEDGE_FEDERATION.some((source) => source.id === 'toxprot'))
assert.ok(TRANSLATIONAL_KNOWLEDGE_FEDERATION.some((source) => source.id === 'clinicaltrials-gov'))
assert.ok(TRANSLATIONAL_KNOWLEDGE_FEDERATION.every((source) => source.canonicalIdentifiers.length > 0))

assert.equal(TRANSLATIONAL_OS_POLICY.executableNucleotideSequenceGeneration, false)
assert.equal(TRANSLATIONAL_OS_POLICY.executablePeptideSynthesisInstructionGeneration, false)
assert.equal(TRANSLATIONAL_OS_POLICY.toxinExtractionOrPotencyOptimization, false)
assert.equal(TRANSLATIONAL_OS_POLICY.pathogenEnhancementDesign, false)
assert.equal(TRANSLATIONAL_OS_POLICY.clinicalPhasesMayBeSkipped, false)
assert.ok(TRANSLATIONAL_ACCELERATION_PLAYBOOK.every((item) => item.maySkipClinicalGate === false))

const projection = buildBodyExposureResearchProjection(
  'candidate-001',
  '2026-09-20T06:45:00.000Z',
  [
    {
      id: 'molecule-target',
      scale: 'molecule',
      label: 'Candidate target interaction',
      effect: 'candidate-modulated',
      evidenceIds: ['ev-1'],
    },
    {
      id: 'cell-state',
      scale: 'cell',
      label: 'Candidate cellular consequence',
      effect: 'unknown',
      evidenceIds: ['ev-1', 'ev-2'],
    },
    {
      id: 'organ-effect',
      scale: 'organ',
      label: 'Candidate organ-level effect',
      effect: 'unknown',
      evidenceIds: ['ev-3'],
    },
  ],
)
assert.equal(projection.boundary, 'research-hypothesis-only')
assert.deepEqual(projection.nodes.map((node) => node.scale), ['molecule', 'cell', 'organ'])

const confirmatoryDimensions: TrialTrustDimension[] = [
  { dimension: 'protocol-prespecification', state: 'verified', evidenceIds: ['p'], note: 'verified' },
  { dimension: 'allocation-bias-control', state: 'verified', evidenceIds: ['r'], note: 'verified' },
  { dimension: 'blinding-or-objective-endpoint', state: 'verified', evidenceIds: ['b'], note: 'verified' },
  { dimension: 'comparator-appropriateness', state: 'verified', evidenceIds: ['c'], note: 'verified' },
  { dimension: 'endpoint-validity', state: 'verified', evidenceIds: ['e'], note: 'verified' },
  { dimension: 'sample-size-justification', state: 'verified', evidenceIds: ['s'], note: 'verified' },
  { dimension: 'missing-data-control', state: 'verified', evidenceIds: ['m'], note: 'verified' },
  { dimension: 'result-reporting', state: 'verified', evidenceIds: ['o'], note: 'verified' },
  { dimension: 'replication', state: 'partial', evidenceIds: ['rep'], note: 'one trial only' },
  { dimension: 'population-applicability', state: 'partial', evidenceIds: ['pop'], note: 'limited external validity' },
  { dimension: 'safety-characterization', state: 'verified', evidenceIds: ['safe'], note: 'verified' },
  { dimension: 'provenance', state: 'verified', evidenceIds: ['prov'], note: 'verified' },
]
const trust = assessTrialTrustworthiness('NCT-DEMO', confirmatoryDimensions)
assert.equal(trust.stage, 'confirmatory-candidate')
assert.equal(trust.failedCount, 0)
assert.equal(trust.unresolvedCount, 2)
assert.equal(trust.verifiedCoverage, 0.833)

const replicated = assessTrialTrustworthiness(
  'NCT-DEMO-REPLICATED',
  confirmatoryDimensions.map((item) =>
    item.dimension === 'replication' ? { ...item, state: 'verified' as const } : item,
  ),
)
assert.equal(replicated.stage, 'externally-replicated-evidence')

const tasks: TranslationTask[] = [
  {
    id: 'evidence-map',
    label: 'Federate target and mechanism evidence',
    stage: 'discovery',
    workstream: 'evidence',
    durationDays: 10,
    dependencies: [],
    hardGate: false,
    requiredEvidenceIds: [],
    status: 'planned',
  },
  {
    id: 'cmc-feasibility',
    label: 'Early manufacturability feasibility',
    stage: 'candidate-selection',
    workstream: 'manufacturing-cmc',
    durationDays: 12,
    dependencies: [],
    hardGate: false,
    requiredEvidenceIds: [],
    status: 'planned',
  },
  {
    id: 'biomarker-plan',
    label: 'Biomarker and target-engagement plan',
    stage: 'candidate-selection',
    workstream: 'biomarker',
    durationDays: 8,
    dependencies: ['evidence-map'],
    hardGate: false,
    requiredEvidenceIds: ['target-evidence'],
    status: 'planned',
  },
  {
    id: 'nonclinical-safety',
    label: 'Nonclinical safety package',
    stage: 'nonclinical',
    workstream: 'safety',
    durationDays: 20,
    dependencies: ['evidence-map'],
    hardGate: true,
    requiredEvidenceIds: ['safety-evidence'],
    status: 'planned',
  },
  {
    id: 'regulatory-entry',
    label: 'Regulatory entry package',
    stage: 'regulatory-entry',
    workstream: 'regulatory',
    durationDays: 7,
    dependencies: ['cmc-feasibility', 'biomarker-plan', 'nonclinical-safety'],
    hardGate: true,
    requiredEvidenceIds: ['safety-evidence', 'cmc-evidence'],
    status: 'planned',
  },
]

const schedule = scheduleTranslationWorkflow(tasks)
assert.equal(schedule.sequentialDays, 57)
assert.equal(schedule.criticalPathDays, 37)
assert.equal(schedule.parallelizationGain, 0.351)
assert.equal(schedule.speedupFactor, 1.541)
assert.deepEqual(schedule.criticalPathTaskIds, ['evidence-map', 'nonclinical-safety', 'regulatory-entry'])
assert.equal(schedule.tasks.find((task) => task.id === 'cmc-feasibility')?.earliestStartDay, 0)
assert.equal(schedule.tasks.find((task) => task.id === 'nonclinical-safety')?.earliestStartDay, 10)
assert.equal(schedule.tasks.find((task) => task.id === 'regulatory-entry')?.earliestStartDay, 30)

assert.throws(
  () => scheduleTranslationWorkflow([
    { ...tasks[0], id: 'a', dependencies: ['b'] },
    { ...tasks[1], id: 'b', dependencies: ['a'] },
  ]),
  /dependency cycle/,
)

const ordinaryEntity: ResearchEntity = {
  id: 'entity-001',
  label: 'Non-executable research candidate',
  modality: 'small-molecule',
  hazardClass: 'ordinary',
  identity: [{
    namespace: 'PubChem CID',
    value: 'demo',
    sourceId: 'pubchem',
    verifiedAt: '2026-09-20T06:45:00.000Z',
  }],
}

const artifacts: EvidenceArtifact[] = [
  {
    id: 'ev-1',
    entityId: ordinaryEntity.id,
    tier: 'in-vitro',
    status: 'verified',
    sourceId: 'pubmed',
    recordId: 'PMID-DEMO-1',
    title: 'Demo mechanistic evidence',
    capturedAt: '2026-09-20T06:45:00.000Z',
    directness: 'direct',
    independentReplication: 'single',
    limitations: [],
  },
  {
    id: 'ev-2',
    entityId: ordinaryEntity.id,
    tier: 'in-vivo',
    status: 'verified',
    sourceId: 'pubmed',
    recordId: 'PMID-DEMO-2',
    title: 'Demo nonclinical evidence',
    capturedAt: '2026-09-20T06:45:00.000Z',
    directness: 'supporting',
    independentReplication: 'multiple',
    limitations: [],
  },
]

const gate = evaluateTranslationGate(
  ordinaryEntity,
  artifacts,
  [
    { id: 'mechanism', label: 'Mechanism', evidenceTiers: ['in-vitro'], minimumVerifiedArtifacts: 1 },
    { id: 'nonclinical', label: 'Nonclinical', evidenceTiers: ['in-vivo'], minimumVerifiedArtifacts: 1 },
  ],
)
assert.equal(gate.passed, true)
assert.deepEqual(gate.missingRequirementIds, [])

const pathogenGate = evaluateTranslationGate(
  { ...ordinaryEntity, id: 'entity-pathogen', hazardClass: 'pathogen-related' },
  artifacts.map((artifact) => ({ ...artifact, entityId: 'entity-pathogen' })),
  [
    { id: 'mechanism', label: 'Mechanism', evidenceTiers: ['in-vitro'], minimumVerifiedArtifacts: 1 },
  ],
)
assert.equal(pathogenGate.passed, false)
assert.match(pathogenGate.blockedHazardReason ?? '', /separately governed biosafety pathway/)

console.log('Translational Acceleration OS verified: federated evidence registry, Body Exposure multiscale projection, auditable trial trust vector, critical-path parallelization, hard evidence gates, and non-executable biosecurity boundaries.')
