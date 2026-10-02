import assert from 'node:assert/strict'
import { createLongitudinalPatientState, ingestLongitudinalEvent, type LongitudinalEvent } from '../../src/lib/panaceaLongitudinalState.ts'
import { createRealityErrorLedger, comparePredictionToObservation } from '../../src/lib/physiology/realityErrorLedger.ts'
import { runCanonicalOxygenDelivery } from '../../src/lib/physiology/canonicalOxygenDelivery.ts'

// Synthetic observations for integration testing, not default patient values.
const at = '2026-09-27T10:00:00.000Z'
const asOf = '2026-09-27T10:00:02.000Z'
const metrics = [
  ['vital.hr', 'bpm', 80], ['cardio.lv.edv', 'mL', 120], ['cardio.lv.esv', 'mL', 50],
  ['blood.hemoglobin', 'g/dL', 15], ['arterial.oxygen_saturation', '1', 0.98], ['arterial.po2', 'mmHg', 100],
] as const
const events: LongitudinalEvent<number>[] = metrics.map(([metric, unit, value], i) => ({
  id: `observed-${i}`, subjectId: 'qa-patient', domain: 'vital', metric, unit, value, recordedAt: at, confidence: 0.9,
  provenance: { sourceKind: 'clinical-system', sourceId: `instrument-${i}`, capturedAt: at, receivedAt: '2026-09-27T10:00:01.000Z', method: 'QA fixture', version: '1' },
  consent: { granted: true, purposes: ['personal-visualization'], grantedAt: at }, review: { state: 'not-required' },
  semanticState: i === 0 ? 'clinician-entered' : i === 3 ? 'imported' : 'measured',
}))
function stateFor(items = events) {
  let state = createLongitudinalPatientState('qa-patient', at)
  for (const event of items) state = ingestLongitudinalEvent(state, event).state
  return state
}
const state = stateFor(), ledger = createRealityErrorLedger(state.subjectId)
const request = { state, ledger, asOf, maxAgeMs: 60_000, maxSkewMs: 5_000, predictionId: 'qa-prediction-1' }
const before = structuredClone(state), beforeLedger = structuredClone(ledger)
const result = runCanonicalOxygenDelivery(request)
assert.equal(result.simulation.latest['cardio.cardiac_output'].value, 5.6)
assert(Math.abs(result.simulation.latest['systemic.oxygen_delivery'].value - 1119.888) < 1e-9)
assert.equal(result.simulation.latest['systemic.oxygen_delivery'].truthClass, 'model-derived')
assert.equal(result.prediction.predictedSigma, null, 'confidence is not invented measurement sigma')
assert.equal(result.ledger.statusByPredictionId['qa-prediction-1'], 'pending')
assert.equal(result.prediction.provenance.engineId, 'oxygen.systemic-delivery')
assert.deepEqual(state, before, 'pipeline must not write model output into patient truth')
assert.deepEqual(ledger, beforeLedger, 'ledger update is immutable')
const ancestors = new Set<string>()
function trace(id: string) {
  if (ancestors.has(id)) return
  ancestors.add(id)
  const node = result.simulation.provenance.find(p => p.id === id)
  assert(node, `missing provenance node ${id}`)
  node.parents.forEach(trace)
}
trace(result.prediction.provenance.provenanceId)
assert.equal(result.lineage.length, 6)
for (const source of result.lineage) {
  assert(ancestors.has(source.boundaryProvenanceId))
  const original = state.eventsById[source.event.id]
  assert.deepEqual(source.event, original, 'unit, timestamps, semantics and full source provenance remain intact')
}
for (const semanticState of ['patient-reported', 'ai-draft', 'simulated', 'derived', undefined] as const) {
  const invalid = stateFor(events.map((e, i) => i === 0 ? { ...e, semanticState } : e))
  assert.throws(() => runCanonicalOxygenDelivery({ ...request, state: invalid }), /missing admissible.*cardio.heart_rate/)
}
assert.throws(() => runCanonicalOxygenDelivery({ ...request, state: stateFor(events.slice(1)) }), /missing admissible/)
assert.throws(() => runCanonicalOxygenDelivery({ ...request, state: stateFor(events.map((e, i) => i === 4 ? { ...e, metric: 'vital.spo2', unit: '%', value: 98 } : e)) }), /missing admissible.*arterial.oxygen_saturation/)
for (const patch of [
  { unit: 'Hz' }, { value: NaN }, { provenance: { ...events[0].provenance, sourceId: '' } },
  { provenance: { ...events[0].provenance, sourceKind: 'derived' as const } },
  { recordedAt: 'invalid' }, { recordedAt: '2026-09-27T10:00:03.000Z' },
  { consent: { ...events[0].consent, granted: false } },
  { consent: { ...events[0].consent, revokedAt: '2026-09-27T10:00:01.000Z' } },
  { subjectId: 'another-patient' },
]) {
  const corrupt = { ...state, eventsById: { ...state.eventsById, [events[0].id]: { ...events[0], ...patch } } }
  assert.throws(() => runCanonicalOxygenDelivery({ ...request, state: corrupt }), /missing admissible/)
}
assert.throws(() => runCanonicalOxygenDelivery({ ...request, maxAgeMs: 1 }), /missing admissible/)
assert.throws(() => runCanonicalOxygenDelivery({ ...request, maxSkewMs: -1 }), /maxSkewMs/)
const skewed = stateFor(events.map((e, i) => i === 0 ? { ...e, recordedAt: '2026-09-27T09:59:50.000Z', provenance: { ...e.provenance, capturedAt: '2026-09-27T09:59:50.000Z' } } : e))
assert.throws(() => runCanonicalOxygenDelivery({ ...request, state: skewed }), /maxSkewMs/)
assert.throws(() => runCanonicalOxygenDelivery({ ...request, state: stateFor([...events, { ...events[0], id: 'conflicting-hr', value: 120 }]) }), /ambiguous/)
assert.throws(() => runCanonicalOxygenDelivery({ ...request, state: stateFor(events.map((e, i) => i === 2 ? { ...e, value: 150 } : e)) }), /outside supported physiological bounds/)
const newer = { ...events[0], id: 'newer-hr', value: 90, recordedAt: '2026-09-27T10:00:01.000Z' }
const newerResult = runCanonicalOxygenDelivery({ ...request, state: stateFor([...events, newer]) })
assert.equal(newerResult.simulation.boundaries['cardio.heart_rate'].value, 90, 'newest admissible reading wins deterministically')
assert.equal(runCanonicalOxygenDelivery({ ...request, ledger: result.ledger }).predictionStatus, 'duplicate', 'replay is idempotent')
assert.throws(() => runCanonicalOxygenDelivery({ ...request, ledger: createRealityErrorLedger('other') }), /subject/)
const observed: LongitudinalEvent<number> = { ...events[0], id: 'later-delivery', metric: result.prediction.field, unit: result.prediction.unit, value: 1100, semanticState: 'measured', recordedAt: asOf, provenance: { ...events[0].provenance, capturedAt: asOf, receivedAt: asOf } }
const compared = comparePredictionToObservation(result.ledger, result.prediction.id, observed, { matchToleranceMs: 0, comparisonCreatedAt: asOf })
assert.equal(compared.ledger.statusByPredictionId[result.prediction.id], 'matched')
assert(Math.abs(compared.comparison.signedError + 19.888) < 1e-9)
assert.deepEqual(state, before, 'reality comparison must not mutate canonical truth')
console.log('canonical -> observed boundaries -> cardio/oxygen -> model-derived ledger: safety, lineage and no writeback passed')
