import assert from 'node:assert/strict'
import { EYE_DEEPER_WAVES, EYE_VISIBLE_WAVE1, EYE_VISIBLE_WAVE1_REQUIRED_IDS, validateEyeVisibleWave1 } from '../../src/lib/anatomy/eyeVisibleWave1.ts'
import { assessEyeVisibleWave1Readiness } from '../../src/lib/anatomy/eyeVisibleWave1Readiness.ts'

assert.deepEqual(validateEyeVisibleWave1(), [])
assert.ok(EYE_VISIBLE_WAVE1.length >= 110, `gross-visible Wave 1 too shallow: ${EYE_VISIBLE_WAVE1.length}`)
const byId = new Map(EYE_VISIBLE_WAVE1.map((item) => [item.id, item]))
for (const id of EYE_VISIBLE_WAVE1_REQUIRED_IDS) assert.ok(byId.has(id), `missing required eye target: ${id}`)
for (const group of ['orbit','eyelid-adnexa','ocular-surface','globe','anterior-segment','posterior-segment','extraocular','lacrimal','neurovascular','visual-pathway']) {
  assert.ok(EYE_VISIBLE_WAVE1.some((item) => item.group === group), `empty eye group: ${group}`)
}
for (const item of EYE_VISIBLE_WAVE1) {
  assert.equal(item.reviewStatus, 'academic-review-pending')
  assert.ok(item.evidenceAnchor.startsWith('NCBI:') || item.evidenceAnchor.startsWith('NEI:'))
}
for (const id of ['trabecular-meshwork','schlemm-canal','macula','fovea','foveola','optic-disc','central-retinal-artery','central-retinal-vein','ciliary-ganglion','optic-radiations','primary-visual-cortex']) {
  assert.equal(byId.get(id)?.geometryStatus, 'reference-only', `${id} must remain reference-only until exact asset provenance exists`)
}
assert.equal(byId.get('pupil')?.mustBeSelectable, false)
assert.match(byId.get('pupil')?.notes ?? '', /aperture/i)
assert.equal(byId.get('visual-axis')?.mustBeSelectable, false)
assert.match(EYE_DEEPER_WAVES.wave2, /provenance/i)
assert.match(EYE_DEEPER_WAVES.wave3, /shared-renderer/i)

const readiness = assessEyeVisibleWave1Readiness()
assert.equal(readiness.grossLayerComplete, true, JSON.stringify(readiness.contractErrors))
assert.equal(readiness.verified3dReady, false)
assert.equal(readiness.nextAllowedLayer, 'wave2-geometry-provenance-audit')
assert.ok(readiness.academicReviewPendingCount > 0)
assert.ok(readiness.referenceOnlyCount > 0)
assert.ok(readiness.sourceGeometryRequiredCount > 0)
assert.ok(readiness.blockers.some((item) => /review/i.test(item)))
assert.ok(readiness.blockers.some((item) => /provenance/i.test(item)))

const broken = EYE_VISIBLE_WAVE1.map((item) => ({ ...item }))
broken[0] = { ...broken[0], evidenceAnchor: '' }
assert.ok(validateEyeVisibleWave1(broken).includes(`evidence:${broken[0].id}`))
assert.equal(assessEyeVisibleWave1Readiness(broken).grossLayerComplete, false)
console.log(`eye-visible-wave1: ok (${EYE_VISIBLE_WAVE1.length} targets; verified3dReady=${readiness.verified3dReady})`)
