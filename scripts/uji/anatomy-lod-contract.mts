import assert from 'node:assert/strict'
import {
  DEFAULT_ANATOMY_LOD_PROFILES,
  anatomyScreenSpaceScore,
  selectAnatomyLod,
  validateAnatomyLodProfiles,
} from '../../src/lib/anatomyLodContract.ts'

assert.deepEqual(validateAnatomyLodProfiles(DEFAULT_ANATOMY_LOD_PROFILES), [])

const radii = [0, 16, 48, 96, 180, 360, 720]
const levels = radii.map((projectedRadiusPx) => selectAnatomyLod({
  projectedRadiusPx,
  clinicalWeight: 1,
  selected: false,
  interacting: false,
}).level)
for (let index = 1; index < levels.length; index += 1) {
  assert.ok(levels[index] >= levels[index - 1], 'LOD must not decrease when projected anatomy size increases.')
}

const selected = selectAnatomyLod({
  projectedRadiusPx: 8,
  clinicalWeight: 1,
  selected: true,
  interacting: false,
})
assert.ok(selected.level >= 3)
assert.equal(selected.reason, 'selected')

const interacting = selectAnatomyLod({
  projectedRadiusPx: 8,
  clinicalWeight: 1,
  selected: false,
  interacting: true,
})
assert.ok(interacting.level >= 2)
assert.equal(interacting.reason, 'interaction')

const nearBoundary = selectAnatomyLod({
  projectedRadiusPx: 71,
  clinicalWeight: 0,
  selected: false,
  interacting: false,
  currentLevel: 2,
  hysteresisRatio: 0.12,
})
assert.equal(nearBoundary.level, 2)
assert.equal(nearBoundary.reason, 'hysteresis')

const deterministicA = selectAnatomyLod({ projectedRadiusPx: 240, clinicalWeight: 2, selected: false, interacting: false })
const deterministicB = selectAnatomyLod({ projectedRadiusPx: 240, clinicalWeight: 2, selected: false, interacting: false })
assert.deepEqual(deterministicA, deterministicB)

assert.ok(anatomyScreenSpaceScore(200, 4) > anatomyScreenSpaceScore(100, 4))
assert.ok(anatomyScreenSpaceScore(200, 2) > anatomyScreenSpaceScore(200, 8))

const invalidProfiles = DEFAULT_ANATOMY_LOD_PROFILES.map((profile) => ({ ...profile }))
invalidProfiles[2].minProjectedRadiusPx = 1
assert.ok(validateAnatomyLodProfiles(invalidProfiles).some((error) => error.includes('monotonic')))

console.log('Anatomy LOD contract verified: monotonic detail, selected/interacting priority, deterministic hysteresis, and screen-space scoring.')
