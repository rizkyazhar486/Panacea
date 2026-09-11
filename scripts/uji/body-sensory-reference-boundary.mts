import assert from 'node:assert/strict'
import { BODY_PROJECTION_TARGETS } from '../../src/lib/bodyProjectionContract.ts'
import { evaluateProjectionReadiness } from '../../src/lib/bodyProjectionReadiness.ts'

const sensoryTargets = BODY_PROJECTION_TARGETS.filter((target) => target.system === 'sensory-receptors')
const sensoryIds = sensoryTargets.map((target) => target.id).sort()

assert.deepEqual(sensoryIds, ['chemoreceptor-reference', 'thermoreceptor-reference'])

for (const target of sensoryTargets) {
  assert.equal(target.geometryStatus, 'reference-only', `${target.id} must remain conceptual/reference-only geometry`)
  assert.equal(target.patientSpecificAllowed, false, `${target.id} must not permit patient-specific geometry`)
  assert.equal(target.academicReview, 'pending', `${target.id} must not claim human review without a recorded reviewer`)
  assert.ok(target.evidenceStatus === 'source-required' || target.evidenceStatus === 'source-checked')
  assert.ok(target.kinds.includes('physiology'), `${target.id} should remain a physiology/concept localization target`)
  assert.equal(target.kinds.includes('procedure'), false, `${target.id} must not become a procedure geometry target`)

  const readiness = evaluateProjectionReadiness(target, {
    targetId: target.id,
    sourceId: target.preferredSourceIds[0],
    assetId: 'synthetic-test-asset',
    sourceRevision: 'synthetic-test-revision',
    license: 'synthetic-test-license',
    attribution: 'synthetic-test-attribution',
    transformationHistory: ['synthetic deterministic test transform'],
    geometryStatus: 'verified-native',
    evidenceStatus: 'source-checked',
    academicReview: 'pending',
  })

  assert.equal(readiness.readiness, 'reference-only')
  assert.equal(readiness.renderAsVerifiedAnatomy, false, `${target.id} must never render as verified gross anatomy`)
}

const chemoreceptor = sensoryTargets.find((target) => target.id === 'chemoreceptor-reference')
const thermoreceptor = sensoryTargets.find((target) => target.id === 'thermoreceptor-reference')
assert.ok(chemoreceptor)
assert.ok(thermoreceptor)
assert.match(chemoreceptor.note ?? '', /distributed|physiologic|fabricated|whole-body mesh/i)
assert.match(thermoreceptor.note ?? '', /distributed|conceptual|tissue overlay|gross-organ mesh/i)

console.log('Body sensory receptor conceptual/reference-only projection boundary verified.')
