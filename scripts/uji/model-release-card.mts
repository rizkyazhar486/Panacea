import assert from 'node:assert/strict'
import {
  MODEL_RELEASE_BOUNDARY,
  MODEL_RELEASE_FORMULAS,
  modelReleaseGatePass,
  modelReleaseMetadataCompleteness,
  validateModelReleaseCard,
  type ModelReleaseCard,
} from '../../src/lib/governance/modelReleaseCard'

const researchCard: ModelReleaseCard = {
  releaseId: 'copilot-r1',
  provider: 'configured-provider',
  modelId: 'clinical-copilot',
  modelVersion: 'v1.0.0',
  promptVersion: 'prompt-v1.0.0',
  intendedUse: 'Internal research evaluation of clinician-supporting draft outputs.',
  forbiddenUses: ['autonomous diagnosis', 'autonomous prescribing'],
  knownLimitations: ['may produce unsupported or incomplete outputs'],
  safetyControls: ['clinician review required', 'evidence-linked output boundary'],
  evaluationDatasetRef: null,
  metricsSnapshotRef: null,
  sourceRegistryRef: null,
  humanReviewState: 'pending',
  humanReviewerIds: [],
  changeSummary: 'Initial governed research release.',
  targetStage: 'research',
}

assert.equal(modelReleaseGatePass(researchCard), true)
assert.equal(modelReleaseMetadataCompleteness(researchCard), 1)

const blockedPilot: ModelReleaseCard = {
  ...researchCard,
  releaseId: 'copilot-pilot-r1',
  targetStage: 'clinician-supervised-pilot',
}
assert.equal(modelReleaseGatePass(blockedPilot), false)
const blockedChecks = validateModelReleaseCard(blockedPilot)
assert.ok(blockedChecks.some((check) => check.key === 'evaluation-reference' && !check.pass))
assert.ok(blockedChecks.some((check) => check.key === 'metrics-reference' && !check.pass))
assert.ok(blockedChecks.some((check) => check.key === 'human-review' && !check.pass))
assert.ok(blockedChecks.some((check) => check.key === 'human-reviewers' && !check.pass))

const pilot: ModelReleaseCard = {
  ...blockedPilot,
  evaluationDatasetRef: 'panacea-eval-001:v1.0.0',
  metricsSnapshotRef: 'metrics-001:v1.0.0',
  sourceRegistryRef: 'source-registry:v1',
  humanReviewState: 'accepted-with-limitations',
  humanReviewerIds: ['reviewer-01'],
}
assert.equal(modelReleaseGatePass(pilot), true)

const rejectedProduction: ModelReleaseCard = {
  ...pilot,
  releaseId: 'copilot-prod-r1',
  targetStage: 'production-assistive',
  humanReviewState: 'rejected',
}
assert.equal(modelReleaseGatePass(rejectedProduction), false)
assert.ok(validateModelReleaseCard(rejectedProduction).some((check) => check.key === 'no-rejected-production' && !check.pass))

assert.ok(MODEL_RELEASE_FORMULAS.metadataCompleteness.includes('passed release-card checks'))
assert.ok(MODEL_RELEASE_FORMULAS.releaseGate.includes('all stage-applicable'))
assert.ok(MODEL_RELEASE_BOUNDARY.includes('does not establish clinical validity'))
assert.ok(MODEL_RELEASE_BOUNDARY.includes('clinician-supporting software'))

console.log('model-release-card: ok')
