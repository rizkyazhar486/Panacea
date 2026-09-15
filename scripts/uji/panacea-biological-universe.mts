import assert from 'node:assert/strict'
import {
  BIOLOGICAL_FORMULA_LEDGER,
  BIOLOGICAL_SCALE_ORDER,
  biologicalScaleConcept,
  closureFromPinchY,
  deriveBiologicalUniverseTrio,
  deriveBiologicalWorld,
  normalizedGeometry,
} from '../../src/lib/biologicalUniverse'

const near = (a: number, b: number, epsilon = 1e-8) => assert.ok(Math.abs(a - b) <= epsilon, `${a} ≉ ${b}`)

// Pointer geometry stays bounded and fails safe.
near(closureFromPinchY(76, 260), 0)
near(closureFromPinchY(130, 260), 1)
near(closureFromPinchY(Number.NaN, 260), 0)
near(closureFromPinchY(130, 0), 0)

// Direct manipulation is monotonic: more authored closure narrows geometry and reduces transport.
for (const domain of ['coronary', 'airway', 'neural'] as const) {
  const open = deriveBiologicalWorld(domain, { closure: 0, reserve: 0.7, demand: 0.7, time: 100 })
  const middle = deriveBiologicalWorld(domain, { closure: 0.5, reserve: 0.7, demand: 0.7, time: 100 })
  const closed = deriveBiologicalWorld(domain, { closure: 1, reserve: 0.7, demand: 0.7, time: 100 })
  assert.ok(open.geometry > middle.geometry && middle.geometry > closed.geometry)
  assert.ok(open.transport > middle.transport && middle.transport > closed.transport)
  assert.ok(open.stress <= middle.stress && middle.stress <= closed.stress)
  assert.ok(closed.transport >= 0 && closed.transport <= 1)
  assert.ok(closed.stress >= 0 && closed.stress <= 1)
  assert.equal(closed.stages.length, 5)
}

// Coronary/airway geometry follows the authored r_norm map; neural keeps its separate heuristic geometry.
near(normalizedGeometry('coronary', 1), 0.38)
near(normalizedGeometry('airway', 1), 0.38)
near(normalizedGeometry('neural', 1), 0.28)

// Time is animation propagation, not a second severity control.
const early = deriveBiologicalWorld('coronary', { closure: 0.8, reserve: 0.65, demand: 0.75, time: 0 })
const late = deriveBiologicalWorld('coronary', { closure: 0.8, reserve: 0.65, demand: 0.75, time: 100 })
near(early.propagation, 0)
near(late.propagation, 1)
assert.ok(early.transport > late.transport)
assert.ok(early.stages.every((stage) => stage.activation === 0))
assert.ok(late.stages[0].activation > 0.7)
assert.ok(late.stages[4].activation > 0)

// The three-world contract is deterministic and the alternate remains between baseline and primary.
const trio = deriveBiologicalUniverseTrio('airway', { closure: 0.8, reserve: 0.72, demand: 0.7, time: 100 })
assert.equal(trio.baseline.id, 'baseline')
assert.equal(trio.primary.id, 'primary')
assert.equal(trio.alternate.id, 'alternate')
assert.equal(trio.baseline.closure, 0)
assert.ok(trio.alternate.closure < trio.primary.closure)
assert.ok(trio.baseline.transport > trio.alternate.transport)
assert.ok(trio.alternate.transport > trio.primary.transport)

// Every multiscale stop is authored for every supported domain.
assert.deepEqual(BIOLOGICAL_SCALE_ORDER, ['person', 'organ', 'tissue', 'cell', 'molecule'])
for (const domain of ['coronary', 'airway', 'neural'] as const) {
  for (const scale of BIOLOGICAL_SCALE_ORDER) {
    assert.ok(biologicalScaleConcept(domain, scale).length > 40)
  }
}

// Formula boundaries must explicitly prevent interface equations from masquerading as patient biology.
assert.ok(BIOLOGICAL_FORMULA_LEDGER.length >= 5)
assert.ok(BIOLOGICAL_FORMULA_LEDGER.some((item) => item.formula.includes('r_norm⁴')))
assert.ok(BIOLOGICAL_FORMULA_LEDGER.every((item) => item.boundary.length > 35))

console.log('Panacea Biological Universe contracts passed: bounded direct manipulation, monotonic synthetic transport, three-world fork, causal propagation, multiscale coverage, and explicit truth boundaries.')
