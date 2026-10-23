import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fitFootContact } from './foot-contact-math.mjs'

test('full precision residual cannot pass a threshold by display rounding', () => {
  const m = fitFootContact([{ t: [0, 1, 2], x: [0.01502, -0.03004, 0.01502] }])
  assert.ok(m.slide_max_mm > 30)
  assert.equal(m.display.slide_max_mm, 30)
  assert.ok(Math.abs(m.slide_max_mm - 30.04) < 1e-12)
  assert.ok(Math.abs(m.slide_rms_mm - Math.sqrt((15.02 ** 2 * 2 + 30.04 ** 2) / 3)) < 1e-12)
})
test('known motion gives exact finite zero residual; translating origin does not change it', () => {
  for (const origin of [0, 10, -10]) {
    const m = fitFootContact([{ t: [0, 1, 2], x: [origin + 2, origin + 1, origin] }])
    assert.equal(m.common_forward_speed_m_s, 1); assert.equal(m.slide_rms_mm, 0); assert.equal(m.slide_max_mm, 0)
  }
  assert.deepEqual(fitFootContact([]), { stance_phases: 0 })
})
test('malformed samples and numerical overflow fail closed', () => {
  for (const g of [
    { t: [0, 1], x: [1, 2] }, { t: [0, 1, 2], x: [1, 2] },
    { t: [0, 0, 1], x: [1, 2, 3] }, { t: [0, 2, 1], x: [1, 2, 3] },
    { t: [0, 1, Infinity], x: [1, 2, 3] }, { t: [0, 1, 2], x: [1, NaN, 3] },
    { t: [0, 1, 2], x: [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE] },
  ]) assert.throws(() => fitFootContact([g]), /invalid|nonfinite/)
})
