import assert from 'node:assert/strict'
import {
  applyAnatomySimilarityTransform,
  registerAnatomyLandmarks,
} from '../../src/domains/body-exposure/engine/sourceRegistrationEngine.ts'
import type { AnatomyRegistrationLandmark } from '../../src/domains/body-exposure/model/sourceRegistration.ts'

const close = (actual: number, expected: number, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`)

const identity: AnatomyRegistrationLandmark[] = [
  { id: 'a', source: [0, 0, 0], target: [0, 0, 0] },
  { id: 'b', source: [1, 0, 0], target: [1, 0, 0] },
  { id: 'c', source: [0, 1, 0], target: [0, 1, 0] },
  { id: 'd', source: [0, 0, 1], target: [0, 0, 1] },
]
const identityResult = registerAnatomyLandmarks(identity)
assert.equal(identityResult.status, 'accepted')
if (identityResult.status === 'accepted') {
  close(identityResult.transform.scale, 1)
  close(identityResult.metrics.rmsError, 0)
  assert.equal(identityResult.semantics, 'candidate-similarity-registration-not-qualified-anatomical-validation')
}

const knownTransform = {
  scale: 2,
  rotation: [
    0, -1, 0,
    1, 0, 0,
    0, 0, 1,
  ] as const,
  translation: [10, -4, 3] as const,
}
const source = [
  [0, 0, 0],
  [2, 0, 0],
  [0, 3, 0],
  [0, 0, 4],
  [1, 2, 3],
] as const
const transformed: AnatomyRegistrationLandmark[] = source.map((point, index) => ({
  id: `landmark-${index}`,
  source: point,
  target: applyAnatomySimilarityTransform(knownTransform, point),
}))
const recovered = registerAnatomyLandmarks(transformed, { maxNormalizedRmsError: 1e-10 })
assert.equal(recovered.status, 'accepted')
if (recovered.status === 'accepted') {
  close(recovered.transform.scale, 2, 1e-10)
  close(recovered.metrics.rmsError, 0, 1e-9)
  for (let i = 0; i < knownTransform.rotation.length; i += 1) {
    close(recovered.transform.rotation[i], knownTransform.rotation[i], 1e-10)
  }
  for (let i = 0; i < 3; i += 1) close(recovered.transform.translation[i], knownTransform.translation[i], 1e-10)
}

const insufficient = registerAnatomyLandmarks(identity.slice(0, 2))
assert.equal(insufficient.status, 'rejected')
assert.ok(insufficient.reasons.some((reason) => reason.includes('three landmark')))

const collinear = registerAnatomyLandmarks([
  { id: 'a', source: [0, 0, 0], target: [0, 0, 0] },
  { id: 'b', source: [1, 0, 0], target: [2, 0, 0] },
  { id: 'c', source: [2, 0, 0], target: [4, 0, 0] },
])
assert.equal(collinear.status, 'rejected')
assert.ok(collinear.reasons.some((reason) => /degenerate|collinear/.test(reason)))

const duplicateId = registerAnatomyLandmarks([
  identity[0],
  { ...identity[1], id: 'a' },
  identity[2],
])
assert.equal(duplicateId.status, 'rejected')
assert.ok(duplicateId.reasons.some((reason) => reason.includes('unique')))

const nonFinite = registerAnatomyLandmarks([
  identity[0],
  identity[1],
  { id: 'bad', source: [0, 1, Number.NaN], target: [0, 1, 0] },
])
assert.equal(nonFinite.status, 'rejected')
assert.ok(nonFinite.reasons.some((reason) => reason.includes('finite')))

const noisy = transformed.map((landmark) => ({ ...landmark }))
noisy[4] = {
  ...noisy[4],
  target: [noisy[4].target[0] + 5, noisy[4].target[1], noisy[4].target[2]],
}
const residualRejected = registerAnatomyLandmarks(noisy, { maxNormalizedRmsError: 0.02 })
assert.equal(residualRejected.status, 'rejected')
assert.ok(residualRejected.metrics)
assert.ok(residualRejected.reasons.some((reason) => reason.includes('Normalized RMS residual')))

const absoluteRejected = registerAnatomyLandmarks(noisy, {
  maxNormalizedRmsError: 10,
  maxError: 0.1,
})
assert.equal(absoluteRejected.status, 'rejected')
assert.ok(absoluteRejected.reasons.some((reason) => reason.includes('Maximum landmark residual')))

console.log(JSON.stringify({
  identityRms: identityResult.metrics?.rmsError,
  recoveredRms: recovered.metrics?.rmsError,
  noisyNormalizedRms: residualRejected.metrics?.normalizedRmsError,
  semantics: recovered.semantics,
}, null, 2))
