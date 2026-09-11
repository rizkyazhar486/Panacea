import assert from 'node:assert/strict'
import {
  DERIVED_FISSURE_CONTRACTS,
  RESPIRATORY_REFERENCE_DATASET,
  RESPIRATORY_REFERENCE_RECONSTRUCTION_PIPELINE,
  RESPIRATORY_SEGMENTATION_TOOL,
} from '../../src/lib/anatomy/respiratoryReferencePipeline.ts'

assert.equal(RESPIRATORY_REFERENCE_DATASET.license, 'CC BY 4.0')
assert.equal(RESPIRATORY_REFERENCE_DATASET.doi, '10.7937/3ppx-7s22')
assert.equal(RESPIRATORY_REFERENCE_DATASET.subjectCount, 20)
assert.equal(RESPIRATORY_REFERENCE_DATASET.hasInhaleExhaleBreathHoldCt, true)
assert.equal(RESPIRATORY_REFERENCE_DATASET.hasFourDimensionalCt, true)
assert.equal(RESPIRATORY_REFERENCE_DATASET.patientSpecificProductUseAllowed, false)
assert.equal(RESPIRATORY_REFERENCE_DATASET.attributionRequired, true)
assert.equal(RESPIRATORY_REFERENCE_DATASET.sourcePolicyReviewRequired, true)

assert.equal(RESPIRATORY_SEGMENTATION_TOOL.task, 'total')
assert.equal(RESPIRATORY_SEGMENTATION_TOOL.license, 'Apache-2.0')
assert.equal(RESPIRATORY_SEGMENTATION_TOOL.automaticClinicalUseAllowed, false)
assert.deepEqual(RESPIRATORY_SEGMENTATION_TOOL.requiredLobeLabels, [
  'lung_upper_lobe_left',
  'lung_lower_lobe_left',
  'lung_upper_lobe_right',
  'lung_middle_lobe_right',
  'lung_lower_lobe_right',
])

assert.deepEqual(
  DERIVED_FISSURE_CONTRACTS.map((contract) => contract.id).sort(),
  ['left-oblique-fissure', 'right-horizontal-fissure', 'right-oblique-fissure'].sort(),
)
for (const fissure of DERIVED_FISSURE_CONTRACTS) {
  assert.equal(fissure.method, 'adjacent-lobe-mask-interface')
  assert.equal(fissure.outputStatus, 'derived-reference')
  assert.equal(fissure.verifiedAnatomyAllowed, false)
  assert.equal(fissure.patientSpecificAllowed, false)
  assert.equal(fissure.sourceVoxelTransformRequired, true)
  assert.equal(fissure.topologyAuditRequired, true)
  assert.equal(fissure.qualifiedHumanReviewRequired, true)
  assert.ok(fissure.positiveLobeMasks.length > 0)
  assert.ok(fissure.opposingLobeMasks.length > 0)
}

const rightHorizontal = DERIVED_FISSURE_CONTRACTS.find((contract) => contract.id === 'right-horizontal-fissure')
assert.ok(rightHorizontal)
assert.deepEqual(rightHorizontal.positiveLobeMasks, ['lung_upper_lobe_right'])
assert.deepEqual(rightHorizontal.opposingLobeMasks, ['lung_middle_lobe_right'])

const rightOblique = DERIVED_FISSURE_CONTRACTS.find((contract) => contract.id === 'right-oblique-fissure')
assert.ok(rightOblique)
assert.deepEqual(rightOblique.positiveLobeMasks, ['lung_lower_lobe_right'])
assert.deepEqual(rightOblique.opposingLobeMasks, ['lung_upper_lobe_right', 'lung_middle_lobe_right'])

assert.deepEqual(
  RESPIRATORY_REFERENCE_RECONSTRUCTION_PIPELINE.map((step) => step.stage),
  [
    'source-intake',
    'lobe-segmentation',
    'fissure-interface-derivation',
    'surface-reconstruction',
    'respiratory-registration',
    'lod-generation',
    'quality-review',
  ],
)

const combinedRequirements = RESPIRATORY_REFERENCE_RECONSTRUCTION_PIPELINE
  .flatMap((step) => step.requirements)
  .join('\n')
assert.match(combinedRequirements, /checksum/i)
assert.match(combinedRequirements, /left\/right identity/i)
assert.match(combinedRequirements, /non-manifold/i)
assert.match(combinedRequirements, /paired inhale\/exhale/i)
assert.match(combinedRequirements, /topology inversion/i)
assert.match(combinedRequirements, /geometric error/i)
assert.match(combinedRequirements, /qualified reviewer identity/i)
assert.match(combinedRequirements, /academicReview pending/i)
assert.match(combinedRequirements, /publish only the evidence status actually earned/i)

for (const step of RESPIRATORY_REFERENCE_RECONSTRUCTION_PIPELINE) {
  assert.ok(step.requirements.length >= 4, `${step.stage} must retain explicit provenance/quality requirements.`)
}

console.log('Licensed TCIA + TotalSegmentator respiratory reference reconstruction pipeline and derived-fissure fail-closed boundaries verified.')
