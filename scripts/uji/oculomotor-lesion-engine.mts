import assert from 'node:assert/strict'
import {
  prismDioptersFromDegrees,
  simulateOculomotor,
} from '../../src/domains/body-exposure/index.ts'

const normal = simulateOculomotor({
  pattern: { scope: 'lesion', key: 'normal' },
  side: 'R',
  severity: 100,
  gaze: 'right',
})
assert.equal(normal.right.gazeFunction, 1)
assert.equal(normal.left.gazeFunction, 1)
assert.equal(normal.right.pupilMm, 3.5)
assert.equal(normal.right.lidOpenFraction, 1)

const zeroSeverity = simulateOculomotor({
  pattern: { scope: 'lesion', key: 'VI' },
  side: 'R',
  severity: 0,
  gaze: 'right',
})
assert.equal(zeroSeverity.right.function.LR, 1)
assert.equal(zeroSeverity.right.gazeFunction, 1)

const third = simulateOculomotor({
  pattern: { scope: 'lesion', key: 'III' },
  side: 'R',
  severity: 100,
  gaze: 'primary',
})
assert.equal(third.right.function.MR, 0)
assert.equal(third.right.function.LR, 1)
assert.equal(third.right.pupilMm, 6.5)
assert.ok(third.right.primaryHorizontal > 0)
assert.ok(third.right.primaryVertical < 0)

const thirdPupilSparing = simulateOculomotor({
  pattern: { scope: 'lesion', key: 'III-pupil-sparing' },
  side: 'R',
  severity: 100,
  gaze: 'primary',
})
assert.equal(thirdPupilSparing.right.function.parasympathetic, 1)
assert.equal(thirdPupilSparing.right.pupilMm, 3.5)

const sixth = simulateOculomotor({
  pattern: { scope: 'lesion', key: 'VI' },
  side: 'R',
  severity: 100,
  gaze: 'right',
})
assert.equal(sixth.right.function.LR, 0)
assert.equal(sixth.right.gazeFunction, 0)
assert.ok(sixth.right.primaryHorizontal < 0)

const ino = simulateOculomotor({
  pattern: { scope: 'lesion', key: 'INO' },
  side: 'R',
  severity: 100,
  gaze: 'left',
})
assert.equal(ino.right.function.MR, 1)
assert.equal(ino.right.function.MLF, 0)
assert.equal(ino.right.gazeFunction, 0)
assert.equal(ino.right.convergenceFunction, 1)

const cavernous = simulateOculomotor({
  pattern: { scope: 'syndrome', key: 'cavernous-sinus' },
  side: 'R',
  severity: 100,
  gaze: 'primary',
})
for (const effector of ['MR', 'LR', 'SR', 'IR', 'SO', 'IO', 'LPS', 'parasympathetic', 'sympathetic'] as const) {
  assert.equal(cavernous.right.function[effector], 0, `${effector} should be impaired in the ipsilateral cavernous-sinus teaching pattern`)
}
assert.equal(cavernous.left.function.LR, 1)

assert.ok(Math.abs(prismDioptersFromDegrees(1) - 1.7455064928) < 1e-9)
assert.equal(prismDioptersFromDegrees(0), 0)
assert.throws(() => simulateOculomotor({
  pattern: { scope: 'lesion', key: 'VI' },
  side: 'R',
  severity: -1,
  gaze: 'primary',
}), /severity/)
assert.throws(() => simulateOculomotor({
  pattern: { scope: 'lesion', key: 'VI' },
  side: 'R',
  severity: Number.NaN,
  gaze: 'primary',
}), /severity/)
assert.throws(() => simulateOculomotor({
  pattern: { scope: 'lesion', key: 'VI' },
  side: 'R',
  severity: 101,
  gaze: 'primary',
}), /severity/)
assert.throws(() => prismDioptersFromDegrees(Number.POSITIVE_INFINITY), /finite/)

console.log('oculomotor-lesion-engine: ok')
