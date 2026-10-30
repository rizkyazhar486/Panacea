import test from 'node:test'
import assert from 'node:assert/strict'
import { localizeSpinalLesion } from '../../src/domains/body-exposure/engine/lesionLocalizerEngine.ts'

test('BX-1 Golden Case: C5 weakness and biceps reflex loss localizes to C5', () => {
  const res = localizeSpinalLesion('C5 weakness', 'biceps reflex loss')
  assert.equal(res.localizedLevel, 'C5')
  assert.equal(res.ambiguous, false)
  assert.equal(res.truthClass, 'reference')
})

test('BX-1 Negative/Ambiguous Case: Contradictory patterns return ambiguous with candidates', () => {
  const res = localizeSpinalLesion('C7 weakness', 'biceps reflex loss')
  assert.equal(res.localizedLevel, 'ambiguous')
  assert.equal(res.ambiguous, true)
  assert.ok(Array.isArray(res.candidates))
})
