import assert from 'node:assert/strict'
import {
  BODY_PROJECTION_TARGETS,
  PROCEDURE_PROJECTION_TARGETS,
  type BodySystemId,
} from '../../src/lib/bodyProjectionContract.ts'

const requiredSystems: BodySystemId[] = [
  'digestive',
  'cardiovascular',
  'pulmonary',
  'brain-neuro',
  'eye',
  'ear',
  'ent',
  'endocrine',
  'female-reproductive',
  'male-reproductive',
  'urinary',
  'integumentary',
  'lymphatic',
  'musculoskeletal',
  'sensory-receptors',
]

const targetIds = BODY_PROJECTION_TARGETS.map((target) => target.id)
assert.equal(new Set(targetIds).size, targetIds.length, 'Body projection target ids must remain unique.')

for (const system of requiredSystems) {
  assert.ok(BODY_PROJECTION_TARGETS.some((target) => target.system === system), `Whole-body roadmap must retain ${system}.`)
}

for (const target of BODY_PROJECTION_TARGETS) {
  assert.ok(target.id.trim().length > 0, 'Projection target id must be non-empty.')
  assert.ok(target.label.trim().length > 0, `${target.id} must retain a display label.`)
  assert.ok(target.kinds.length > 0, `${target.id} must declare at least one supported projection kind.`)
  assert.equal(new Set(target.kinds).size, target.kinds.length, `${target.id} must not duplicate projection kinds.`)
  assert.ok(target.anatomyHints.length > 0, `${target.id} must expose conservative anatomy hints.`)
  assert.ok(target.anatomyHints.every((hint) => hint.trim().length > 0), `${target.id} anatomy hints must be non-empty.`)
  assert.ok(target.preferredSourceIds.length > 0, `${target.id} must retain at least one approved build-time/reference source family.`)
  assert.equal(new Set(target.preferredSourceIds).size, target.preferredSourceIds.length, `${target.id} must not duplicate preferred source ids.`)
  assert.equal(target.patientSpecificAllowed, false, `${target.id} must remain generic-reference only until a separately validated patient-specific contract exists.`)
}

const chemoreceptor = BODY_PROJECTION_TARGETS.find((target) => target.id === 'chemoreceptor-reference')
const thermoreceptor = BODY_PROJECTION_TARGETS.find((target) => target.id === 'thermoreceptor-reference')
assert.ok(chemoreceptor)
assert.ok(thermoreceptor)
for (const target of [chemoreceptor, thermoreceptor]) {
  assert.equal(target.geometryStatus, 'reference-only', `${target.id} must remain reference-only rather than fabricated gross anatomy.`)
  assert.equal(target.patientSpecificAllowed, false)
}

const procedureIds = PROCEDURE_PROJECTION_TARGETS.map((procedure) => procedure.id)
assert.equal(new Set(procedureIds).size, procedureIds.length, 'Procedure projection ids must remain unique.')

const targetById = new Map(BODY_PROJECTION_TARGETS.map((target) => [target.id, target]))
for (const procedure of PROCEDURE_PROJECTION_TARGETS) {
  assert.ok(procedure.id.trim().length > 0, 'Procedure id must be non-empty.')
  assert.ok(procedure.label.trim().length > 0, `${procedure.id} must retain an academic display name.`)
  assert.equal(procedure.reviewRequired, true, `${procedure.id} must remain qualified-review required.`)
  assert.equal(procedure.productionReady, false, `${procedure.id} must not self-declare production readiness.`)
  assert.ok(procedure.anatomyTargetIds.length > 0, `${procedure.id} must map to at least one anatomy target.`)
  assert.equal(new Set(procedure.anatomyTargetIds).size, procedure.anatomyTargetIds.length, `${procedure.id} must not duplicate anatomy targets.`)

  let sameSystemTarget = false
  for (const targetId of procedure.anatomyTargetIds) {
    const target = targetById.get(targetId)
    assert.ok(target, `${procedure.id} references missing anatomy target ${targetId}.`)
    assert.ok(target.kinds.includes('procedure'), `${procedure.id} target ${targetId} must permit procedure projection.`)
    if (target.system === procedure.system) sameSystemTarget = true
  }
  assert.ok(sameSystemTarget, `${procedure.id} must include at least one anatomy target from its own system.`)
}

console.log(`Body projection contract integrity verified across ${BODY_PROJECTION_TARGETS.length} targets, ${requiredSystems.length} systems, and ${PROCEDURE_PROJECTION_TARGETS.length} review-required procedure targets.`)
