import assert from 'node:assert/strict'
import { eyeScreenshotOptions } from '../qa/eye-screenshot-options.mjs'

const tall = eyeScreenshotOptions({ x: 17, y: 72, width: 356, height: 1032 }, { x: 0, y: 1500 })
assert.equal(tall.fullPage, true, 'Tall lessons must not be clipped to viewport height')
assert.deepEqual(tall.clip, { x: 17, y: 1572, width: 356, height: 1032 })
assert.deepEqual(eyeScreenshotOptions({ x: -10, y: -50, width: 356, height: 1032 }, { x: 20, y: 100 }).clip,
  { x: 10, y: 50, width: 356, height: 1032 })
for (const box of [null, { x: NaN, y: 0, width: 10, height: 10 }, { x: 0, y: 0, width: 0, height: 10 }, { x: 0, y: 0, width: 10, height: -1 }]) {
  assert.throws(() => eyeScreenshotOptions(box, { x: 0, y: 0 }))
}
assert.throws(() => eyeScreenshotOptions({ x: 0, y: -20, width: 10, height: 10 }, { x: 0, y: 0 }))
console.log('eye-screenshot-options: tall lessons, scroll offsets and invalid bounds passed')
