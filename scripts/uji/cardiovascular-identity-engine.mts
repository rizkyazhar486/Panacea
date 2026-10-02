import assert from 'node:assert/strict'
import { createDomainEngineRegistry, runPhysiologicalSimulation } from '../../src/lib/physiology/runtime.ts'
import { cardiovascularIdentityEngine } from '../../src/lib/physiology/cardiovascularIdentityEngine.ts'

const engine = cardiovascularIdentityEngine()
const registry = createDomainEngineRegistry([engine], [
  { name: 'cardio.heart_rate', unit: 'bpm' },
  { name: 'cardio.lv.edv', unit: 'mL' },
  { name: 'cardio.lv.esv', unit: 'mL' },
])
const boundary = (name: string, unit: string, value: number, sigma: number | null) => ({
  name, unit, value, sigma, truthClass: 'measured' as const,
  source: { id: `event:${name}`, sourceId: 'fixture', capturedAt: '2026-09-27T00:00:00.000Z', semanticState: 'measured' as const },
})

const result = runPhysiologicalSimulation({
  registry,
  boundaryConditions: [
    boundary('cardio.heart_rate', 'bpm', 70, 1),
    boundary('cardio.lv.edv', 'mL', 120, 2),
    boundary('cardio.lv.esv', 'mL', 50, 2),
  ],
  untilSeconds: 0,
})

assert.equal(result.latest['cardio.lv.stroke_volume'].value, 70)
assert.equal(result.latest['cardio.cardiac_output'].value, 4.9)
assert.ok(Math.abs(result.latest['cardio.lv.ejection_fraction'].value - (70 / 120)) < 1e-12)
assert.equal(result.latest['cardio.lv.stroke_volume'].truthClass, 'model-derived')
assert.equal(result.latest['cardio.cardiac_output'].truthClass, 'model-derived')
assert.equal(result.latest['cardio.lv.ejection_fraction'].truthClass, 'model-derived')
assert.equal(result.latest['cardio.cardiac_output'].provenance.modelId, 'cardiovascular-algebraic-identities')
assert.equal(result.latest['cardio.cardiac_output'].provenance.validationClass, 'published-model-reproduction')
assert.equal(result.latest['cardio.cardiac_output'].provenance.parents.length, 3)

const svSigma = Math.hypot(2, 2)
const coSigma = Math.hypot((70 / 1000) * svSigma, (70 / 1000) * 1)
const efSigma = Math.hypot((50 / (120 * 120)) * 2, (1 / 120) * 2)
assert.ok(Math.abs((result.latest['cardio.lv.stroke_volume'].sigma ?? NaN) - svSigma) < 1e-12)
assert.ok(Math.abs((result.latest['cardio.cardiac_output'].sigma ?? NaN) - coSigma) < 1e-12)
assert.ok(Math.abs((result.latest['cardio.lv.ejection_fraction'].sigma ?? NaN) - efSigma) < 1e-12)

const noSigma = runPhysiologicalSimulation({
  registry,
  boundaryConditions: [
    boundary('cardio.heart_rate', 'bpm', 70, null),
    boundary('cardio.lv.edv', 'mL', 120, null),
    boundary('cardio.lv.esv', 'mL', 50, null),
  ],
  untilSeconds: 0,
})
assert.equal(noSigma.latest['cardio.lv.stroke_volume'].sigma, null)
assert.equal(noSigma.latest['cardio.cardiac_output'].sigma, null)
assert.equal(noSigma.latest['cardio.lv.ejection_fraction'].sigma, null)

for (const bad of [
  [0, 120, 50],
  [70, 0, 0],
  [70, 120, -1],
  [70, 120, 121],
] as const) {
  assert.throws(() => runPhysiologicalSimulation({
    registry,
    boundaryConditions: [
      boundary('cardio.heart_rate', 'bpm', bad[0], null),
      boundary('cardio.lv.edv', 'mL', bad[1], null),
      boundary('cardio.lv.esv', 'mL', bad[2], null),
    ],
    untilSeconds: 0,
  }), /cardiovascular identity input/)
}

console.log('cardiovascular-identity-engine: SV/CO/EF identities, uncertainty propagation, fail-closed physiological bounds')
