import assert from 'node:assert/strict'
import {
  CAUSAL_DOMAINS,
  SCALE_ORDER,
  causalTimeline,
  deriveCausalWorld,
  deriveCounterfactualPair,
  scaleConcept,
} from '../../src/lib/causalTimeMachine.ts'

const base = { perturbation: 0.72, reserve: 0.62, demand: 0.74, time: 100 }

for (const domain of CAUSAL_DOMAINS.map((item) => item.id)) {
  const state = deriveCausalWorld(domain, base)
  for (const value of [state.effectivePerturbation, state.transport, state.stress, state.reserveSignal]) {
    assert.ok(value >= 0 && value <= 1, `${domain} normalized signal must stay bounded`)
  }
  assert.ok(Number.isFinite(state.resistance) && state.resistance > 0, `${domain} resistance must stay finite and positive`)

  const before = deriveCausalWorld(domain, { ...base, time: 0 })
  assert.equal(before.effectivePerturbation, 0, `${domain} time zero must be pre-perturbation`)
  assert.ok(before.transport >= state.transport, `${domain} authored perturbation should not increase transport`)

  const pair = deriveCounterfactualPair(domain, base)
  assert.ok(pair.relief.transport >= pair.primary.transport, `${domain} reduced-perturbation branch should not lower transport`)
  assert.ok(pair.relief.stress <= pair.primary.stress, `${domain} reduced-perturbation branch should not raise mismatch stress`)

  const line = causalTimeline(domain, { perturbation: base.perturbation, reserve: base.reserve, demand: base.demand })
  assert.deepEqual(line.map((point) => point.time), [0, 20, 40, 60, 80, 100])
  assert.ok(line.at(-1)!.primary.transport <= line[0].primary.transport, `${domain} worldline should propagate the authored perturbation`)

  for (const scale of SCALE_ORDER) {
    assert.ok(scaleConcept(domain, scale).length > 8, `${domain}/${scale} must have an authored scale concept`)
  }
}

const coronaryLow = deriveCausalWorld('coronary', { ...base, perturbation: 0.2 })
const coronaryHigh = deriveCausalWorld('coronary', { ...base, perturbation: 0.85 })
assert.ok(coronaryHigh.resistance > coronaryLow.resistance, 'greater authored coronary calibre loss must raise the idealized resistance index')
assert.ok(coronaryHigh.transport < coronaryLow.transport, 'greater authored coronary calibre loss must lower relative transport')

const airwayLow = deriveCausalWorld('airway', { ...base, perturbation: 0.2 })
const airwayHigh = deriveCausalWorld('airway', { ...base, perturbation: 0.85 })
assert.ok(airwayHigh.resistance > airwayLow.resistance, 'greater authored airway narrowing must raise the idealized resistance index')
assert.ok(airwayHigh.transport < airwayLow.transport, 'greater authored airway narrowing must lower relative transport')

const neuralLow = deriveCausalWorld('neural', { ...base, perturbation: 0.2 })
const neuralHigh = deriveCausalWorld('neural', { ...base, perturbation: 0.85 })
assert.ok(neuralHigh.transport < neuralLow.transport, 'greater authored neural compression must lower the synthetic conduction transport index')

const invalid = deriveCausalWorld('coronary', { perturbation: Number.NaN, reserve: 3, demand: -2, time: 999 })
assert.ok(invalid.transport >= 0 && invalid.transport <= 1)
assert.ok(invalid.stress >= 0 && invalid.stress <= 1)

console.log('Panacea Causal Time Machine deterministic contracts passed')
