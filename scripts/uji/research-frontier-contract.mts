import assert from 'node:assert/strict'
import {
  AGING_HALLMARKS_2023,
  RESEARCH_FRONTIER_DATA_SOURCES,
  RESEARCH_FRONTIER_EVIDENCE_TIERS,
  RESEARCH_FRONTIER_MODEL_CLASSES,
  RESEARCH_FRONTIER_MODEL_POLICY,
  RESEARCH_FRONTIER_MODULES,
  RESEARCH_FRONTIER_ORDER,
  RESEARCH_FRONTIER_QC,
  RESEARCH_FRONTIER_REPROGRAMMING_RISKS,
  RESEARCH_FRONTIER_SAFETY_BOUNDARY,
  RESEARCH_FRONTIER_STRUCTURE_POLICY,
  RESEARCH_FRONTIER_VALIDATION_AXES,
  evaluateResearchFrontierUnlock,
} from '../../src/lib/researchFrontierContract.ts'

assert.deepEqual(RESEARCH_FRONTIER_ORDER, [
  'cell-state',
  'organelle',
  'molecular-network',
  'rna-dna',
  'disease-mechanism',
  'compound-space',
])

assert.deepEqual(RESEARCH_FRONTIER_MODEL_CLASSES, [
  'mechanistic',
  'statistical-baseline',
  'learned',
  'hybrid',
])
assert.equal(RESEARCH_FRONTIER_EVIDENCE_TIERS.at(-1), 'computational-hypothesis')
assert.equal(RESEARCH_FRONTIER_MODULES.length, RESEARCH_FRONTIER_ORDER.length)
assert.deepEqual(
  RESEARCH_FRONTIER_MODULES.map((module) => module.stage),
  RESEARCH_FRONTIER_ORDER,
)

const locked = evaluateResearchFrontierUnlock({
  bodyExposureLifecycle: 'reviewed',
  sourceProvenanceComplete: true,
  academicReviewComplete: true,
  safetyBoundaryAccepted: true,
})
assert.equal(locked.unlocked, false)
assert.ok(locked.blockers.includes('body-exposure-not-closed'))

const incompleteEvidence = evaluateResearchFrontierUnlock({
  bodyExposureLifecycle: 'deployed-reviewed',
  sourceProvenanceComplete: false,
  academicReviewComplete: false,
  safetyBoundaryAccepted: true,
})
assert.equal(incompleteEvidence.unlocked, false)
assert.ok(incompleteEvidence.blockers.includes('source-provenance-incomplete'))
assert.ok(incompleteEvidence.blockers.includes('academic-review-incomplete'))

const unlocked = evaluateResearchFrontierUnlock({
  bodyExposureLifecycle: 'deployed-reviewed',
  sourceProvenanceComplete: true,
  academicReviewComplete: true,
  safetyBoundaryAccepted: true,
})
assert.equal(unlocked.unlocked, true)
assert.deepEqual(unlocked.blockers, [])
assert.equal(unlocked.mode, 'in-silico-research-only')

assert.equal(RESEARCH_FRONTIER_SAFETY_BOUNDARY.patientSpecificClinicalInference, false)
assert.equal(RESEARCH_FRONTIER_SAFETY_BOUNDARY.autonomousTreatmentRecommendation, false)
assert.equal(RESEARCH_FRONTIER_SAFETY_BOUNDARY.wetLabProtocolGeneration, false)
assert.equal(RESEARCH_FRONTIER_SAFETY_BOUNDARY.nucleotideSequenceDesign, false)
assert.equal(RESEARCH_FRONTIER_SAFETY_BOUNDARY.geneEditingGuideDesign, false)
assert.equal(RESEARCH_FRONTIER_SAFETY_BOUNDARY.cultureOrTransfectionParameters, false)
assert.equal(RESEARCH_FRONTIER_SAFETY_BOUNDARY.operationalDeliveryDesign, false)
assert.equal(RESEARCH_FRONTIER_SAFETY_BOUNDARY.claims.immortality, 'research-hypothesis-only')
assert.equal(RESEARCH_FRONTIER_SAFETY_BOUNDARY.claims.cancerCure, 'research-hypothesis-only')

assert.ok(RESEARCH_FRONTIER_DATA_SOURCES.length >= 12)
assert.equal(new Set(RESEARCH_FRONTIER_DATA_SOURCES.map((source) => source.id)).size, RESEARCH_FRONTIER_DATA_SOURCES.length)
assert.ok(RESEARCH_FRONTIER_DATA_SOURCES.some((source) => source.accessMode === 'mixed-open-controlled-data'))
assert.ok(RESEARCH_FRONTIER_DATA_SOURCES.some((source) => source.evidenceClass === 'experimental-structure'))
assert.ok(RESEARCH_FRONTIER_DATA_SOURCES.some((source) => source.evidenceClass === 'computed-structure-prediction'))

assert.equal(RESEARCH_FRONTIER_MODEL_POLICY.simpleBaselineRequired, true)
assert.equal(RESEARCH_FRONTIER_MODEL_POLICY.learnedModelMustBeatBaseline, true)
assert.equal(RESEARCH_FRONTIER_MODEL_POLICY.benchmarkOnUnseenContexts, true)
assert.equal(RESEARCH_FRONTIER_MODEL_POLICY.causalPerturbationTransferRequired, true)
assert.equal(RESEARCH_FRONTIER_MODEL_POLICY.cellularAbundanceCannotBeReducedToExpressionOnly, true)
assert.equal(RESEARCH_FRONTIER_MODEL_POLICY.attentionOrEmbeddingIsNotCausalEvidence, true)
assert.equal(RESEARCH_FRONTIER_MODEL_POLICY.complexityIsNotEvidence, true)

assert.equal(RESEARCH_FRONTIER_STRUCTURE_POLICY.experimentalAndPredictedStructuresAreNotEquivalent, true)
assert.equal(RESEARCH_FRONTIER_STRUCTURE_POLICY.predictedStructureMustExposeConfidence, true)
assert.equal(RESEARCH_FRONTIER_STRUCTURE_POLICY.predictedStructureCannotSelfPromoteToExperimentalEvidence, true)

for (const required of [
  'expression-level-agreement',
  'delta-change-recovery',
  'differential-expression-recovery',
  'cellular-abundance-response',
  'cross-cell-type-transfer',
  'cross-dataset-external-validation',
]) {
  assert.ok(RESEARCH_FRONTIER_VALIDATION_AXES.includes(required as (typeof RESEARCH_FRONTIER_VALIDATION_AXES)[number]))
}

for (const required of [
  'source-and-version-provenance',
  'simple-baseline-comparison',
  'holdout-and-external-validation',
  'out-of-distribution-context-validation',
  'causal-perturbation-transfer-validation',
  'expression-and-cellular-abundance-validation',
  'uncertainty-and-calibration-reporting',
  'batch-effect-and-dataset-shift-audit',
  'reproducibility-and-deterministic-replay',
  'mechanistic-consistency-checks',
  'qualified-domain-review-before-publication',
]) {
  assert.ok(RESEARCH_FRONTIER_QC.includes(required as (typeof RESEARCH_FRONTIER_QC)[number]))
}

assert.ok(RESEARCH_FRONTIER_REPROGRAMMING_RISKS.includes('genomic-instability'))
assert.ok(RESEARCH_FRONTIER_REPROGRAMMING_RISKS.includes('tumorigenicity'))
assert.ok(RESEARCH_FRONTIER_REPROGRAMMING_RISKS.includes('loss-of-cell-identity'))
assert.equal(AGING_HALLMARKS_2023.length, 12)
assert.ok(AGING_HALLMARKS_2023.includes('cellular-senescence'))
assert.ok(AGING_HALLMARKS_2023.includes('chronic-inflammation'))
