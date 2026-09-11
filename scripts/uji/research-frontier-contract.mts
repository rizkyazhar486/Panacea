import assert from 'node:assert/strict'
import {
  RESEARCH_FRONTIER_DATA_SOURCES,
  RESEARCH_FRONTIER_MODULES,
  RESEARCH_FRONTIER_ORDER,
  RESEARCH_FRONTIER_QC,
  RESEARCH_FRONTIER_SAFETY_BOUNDARY,
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
assert.equal(RESEARCH_FRONTIER_SAFETY_BOUNDARY.claims.immortality, 'research-hypothesis-only')
assert.equal(RESEARCH_FRONTIER_SAFETY_BOUNDARY.claims.cancerCure, 'research-hypothesis-only')

assert.ok(RESEARCH_FRONTIER_DATA_SOURCES.length >= 6)
assert.equal(new Set(RESEARCH_FRONTIER_DATA_SOURCES.map((source) => source.id)).size, RESEARCH_FRONTIER_DATA_SOURCES.length)
assert.ok(RESEARCH_FRONTIER_DATA_SOURCES.every((source) => source.accessMode === 'federated-public-data'))

for (const required of [
  'source-and-version-provenance',
  'holdout-and-external-validation',
  'uncertainty-and-calibration-reporting',
  'reproducibility-and-deterministic-replay',
  'qualified-domain-review-before-publication',
]) {
  assert.ok(RESEARCH_FRONTIER_QC.includes(required as (typeof RESEARCH_FRONTIER_QC)[number]))
}
