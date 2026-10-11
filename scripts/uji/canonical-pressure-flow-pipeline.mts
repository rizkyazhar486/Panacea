import assert from 'node:assert/strict'
import { createLongitudinalPatientState, ingestLongitudinalEvent, type LongitudinalEvent } from '../../src/lib/panaceaLongitudinalState.ts'
import { createRealityErrorLedger } from '../../src/lib/physiology/realityErrorLedger.ts'
import { runCanonicalCerebralPerfusionPressure, runCanonicalMeanArterialPressure } from '../../src/lib/physiology/canonicalPressureFlow.ts'
import { SVR_UNIT } from '../../src/lib/physiology/pressureFlowCoupling.ts'

// Synthetic observations for integration testing, not default patient values.
const at = '2026-10-12T10:00:00.000Z'
const asOf = '2026-10-12T10:00:02.000Z'
const metrics = [
  ['vital.hr', 'bpm', 80], ['cardio.lv.edv', 'mL', 120], ['cardio.lv.esv', 'mL', 50],
  ['systemic.vascular_resistance', SVR_UNIT, 1200], ['venous.central_pressure', 'mmHg', 6], ['intracranial.pressure', 'mmHg', 10],
] as const
const events: LongitudinalEvent<number>[] = metrics.map(([metric, unit, value], i) => ({
  id: `observed-${i}`, subjectId: 'qa-patient', domain: 'vital', metric, unit, value, recordedAt: at, confidence: 0.9,
  provenance: { sourceKind: 'clinical-system', sourceId: `instrument-${i}`, capturedAt: at, receivedAt: '2026-10-12T10:00:01.000Z', method: 'QA fixture', version: '1' },
  consent: { granted: true, purposes: ['personal-visualization'], grantedAt: at }, review: { state: 'not-required' },
  semanticState: i === 0 ? 'clinician-entered' : i === 3 ? 'imported' : 'measured',
}))
function stateFor(items = events) {
  let state = createLongitudinalPatientState('qa-patient', at)
  for (const event of items) state = ingestLongitudinalEvent(state, event).state
  return state
}
const state = stateFor(), ledger = createRealityErrorLedger(state.subjectId)
const request = { state, ledger, asOf, maxAgeMs: 60_000, maxSkewMs: 5_000, predictionId: 'qa-pressure-1' }
const before = structuredClone(state), beforeLedger = structuredClone(ledger)

// 1. MAP: ICP is not needed, so it is not required either.
const mapResult = runCanonicalMeanArterialPressure({ ...request, state: stateFor(events.slice(0, 5)) })
assert.ok(Math.abs(mapResult.simulation.latest['arterial.mean_pressure'].value - 90) < 1e-12)
assert.equal(mapResult.prediction.field, 'arterial.mean_pressure')
assert.equal(mapResult.prediction.provenance.engineId, 'hemodynamics.mean-arterial-pressure')
assert.equal(mapResult.prediction.predictedSigma, null, 'confidence is not invented measurement sigma')
assert.equal(mapResult.lineage.length, 5)

// 2. CPP uses all six roots and writes nothing back to patient truth or the input ledger.
const cpp = runCanonicalCerebralPerfusionPressure(request)
assert.ok(Math.abs(cpp.simulation.latest['cerebral.perfusion_pressure'].value - 80) < 1e-12)
assert.equal(cpp.prediction.provenance.engineId, 'hemodynamics.cerebral-perfusion-pressure')
assert.equal(cpp.ledger.statusByPredictionId['qa-pressure-1'], 'pending')
assert.equal(cpp.lineage.length, 6)
assert.deepEqual(state, before, 'pipeline must not write model output into patient truth')
assert.deepEqual(ledger, beforeLedger, 'ledger update is immutable')
for (const source of cpp.lineage) assert.deepEqual(source.event, state.eventsById[source.event.id], 'source event kept intact')

// 3. Un-measured boundaries fail closed instead of receiving defaults.
for (const missing of ['systemic.vascular_resistance', 'venous.central_pressure']) {
  assert.throws(() => runCanonicalMeanArterialPressure({ ...request, state: stateFor(events.filter(e => e.metric !== missing)) }), new RegExp(`missing admissible observed input: ${missing.replace('.', '\\.')}`))
}
assert.throws(() => runCanonicalCerebralPerfusionPressure({ ...request, state: stateFor(events.slice(0, 5)) }), /missing admissible.*intracranial\.pressure/)
for (const semanticState of ['patient-reported', 'ai-draft', 'simulated', 'derived', undefined] as const) {
  const invalid = stateFor(events.map(e => e.metric === 'systemic.vascular_resistance' ? { ...e, semanticState } : e))
  assert.throws(() => runCanonicalMeanArterialPressure({ ...request, state: invalid }), /missing admissible.*systemic\.vascular_resistance/, String(semanticState))
}
// A value this system derived itself can never re-enter as an observed boundary.
assert.throws(() => runCanonicalMeanArterialPressure({ ...request, state: stateFor(events.map(e => e.metric === 'venous.central_pressure' ? { ...e, provenance: { ...e.provenance, sourceKind: 'derived' as const } } : e)) }), /missing admissible.*venous\.central_pressure/)
// A wrong unit is a different quantity: mmHg·min/L is not dyn·s/cm^5.
assert.throws(() => runCanonicalMeanArterialPressure({ ...request, state: stateFor(events.map(e => e.metric === 'systemic.vascular_resistance' ? { ...e, unit: 'mmHg*min/L', value: 15 } : e)) }), /missing admissible.*systemic\.vascular_resistance/)
// Stale observation and skew are caller policy, enforced.
assert.throws(() => runCanonicalCerebralPerfusionPressure({ ...request, maxAgeMs: 1000 }), /missing admissible/)
assert.throws(() => runCanonicalCerebralPerfusionPressure({ ...request, state: stateFor(events.map(e => e.metric === 'intracranial.pressure' ? { ...e, recordedAt: '2026-10-12T10:00:00.500Z', provenance: { ...e.provenance, capturedAt: '2026-10-12T09:59:55.000Z' } } : e)), maxSkewMs: 1000 }), /maxSkewMs/)
// Revoked consent removes the boundary.
assert.throws(() => runCanonicalCerebralPerfusionPressure({ ...request, state: stateFor(events.map(e => e.metric === 'intracranial.pressure' ? { ...e, consent: { granted: false, purposes: [] as never[], grantedAt: at } } : e)) }), /missing admissible.*intracranial\.pressure/)
assert.throws(() => runCanonicalCerebralPerfusionPressure({ ...request, ledger: createRealityErrorLedger('someone-else') }), /subject must match/)

console.log('canonical pressure-flow pipeline: observed boundaries -> MAP/CPP prediction with lineage, no defaults, no writeback, fail-closed inputs')
