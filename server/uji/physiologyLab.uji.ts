import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PHYSIOLOGY_TOPICS, cardiovascular, spirometry } from '../../src/lib/physiologyLab'

test('all requested mechanism families have distinct topics, references and explicit boundaries', () => {
  const ids = ['vision', 'hearing', 'nose', 'voice', 'motor', 'synapse', 'bbb', 'cardiac', 'breathing', 'spirometry', 'shock', 'adh', 'hormonal', 'renal', 'electrolytes', 'insulin', 'digestion', 'carbohydrate', 'protein', 'hemostasis', 'temperature', 'immune', 'allergy']
  assert.equal(PHYSIOLOGY_TOPICS.length, ids.length)
  assert.equal(new Set(PHYSIOLOGY_TOPICS.map(topic => topic.id)).size, ids.length)
  for (const id of ids) {
    const topic = PHYSIOLOGY_TOPICS.find(value => value.id === id)!
    assert(topic && topic.steps.length === 4 && topic.boundary.length > 30 && topic.answer.length > 20)
    assert.equal(new URL(topic.source).hostname, 'openstax.org')
    assert(topic.terms.length > 0)
  }
})
test('cardiovascular relationships preserve units and distinguish EF from ejection flow', () => {
  const result = cardiovascular(70, 120, 50, 18, 5, .3)
  assert.equal(result.sv, 70)
  assert.equal(result.co, 4.9)
  assert(Math.abs(result.map - 93.2) < 1e-10)
  assert(Math.abs(result.ef - 58.3333333333) < 1e-8)
  assert(Math.abs(result.meanEjectionFlow - 233.3333333333) < 1e-8)
  assert.equal(cardiovascular(0, 120, 50, 18, 5, .3).co, 0)
  assert.equal(cardiovascular(70, 120, 120, 18, 5, .3).ef, 0)
  for (const value of [NaN, Infinity, -1]) assert.throws(() => cardiovascular(value, 120, 50, 18, 5, .3))
  assert.throws(() => cardiovascular(70, 120, 130, 18, 5, .3))
  assert.throws(() => cardiovascular(70, 120, 50, 18, 5, 0))
})
test('synthetic spirometry is monotone and flow equals the volume derivative', () => {
  assert.equal(spirometry(4, .6, 0).volume, 0)
  let last = 0
  for (let t = 0; t <= 6; t += .05) {
    const result = spirometry(4, .6, t)
    assert(result.volume >= last && result.volume <= 4 && result.flow >= 0)
    const derivative = (spirometry(4, .6, t + 1e-6).volume - result.volume) / 1e-6
    assert(Math.abs(derivative - result.flow) < 1e-4)
    last = result.volume
  }
  assert.equal(spirometry(4, .6, 1).volume, spirometry(4, .6, 0).fev1)
  assert(spirometry(4, 2, 1).fev1 < spirometry(4, .6, 1).fev1)
  assert.throws(() => spirometry(0, 1, 1))
  assert.throws(() => spirometry(4, 0, 1))
  assert.throws(() => spirometry(4, 1, -1))
  assert.throws(() => spirometry(4, Infinity, 1))
})
