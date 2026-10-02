import assert from 'node:assert/strict'
import { cardiovascularVerticalGraph } from '../../src/lib/biology/cardiovascularVerticalLineage.ts'
import {
  CARDIOVASCULAR_PHYSIOLOGY_BINDINGS,
  projectPhysiologicalStateToVerticalGraph,
  validateVerticalPhysiologyBindings,
  type VerticalPhysiologyBinding,
} from '../../src/lib/biology/physiologyVerticalProjection.ts'
import { cardiovascularIdentityEngine } from '../../src/lib/physiology/cardiovascularIdentityEngine.ts'
import { arterialOxygenContentEngine, systemicOxygenDeliveryEngine } from '../../src/lib/physiology/oxygenTransportEngine.ts'
import { createDomainEngineRegistry, runPhysiologicalSimulation } from '../../src/lib/physiology/runtime.ts'

const graph = cardiovascularVerticalGraph()
assert.deepEqual(validateVerticalPhysiologyBindings(graph, CARDIOVASCULAR_PHYSIOLOGY_BINDINGS), [])

const registry = createDomainEngineRegistry(
  [systemicOxygenDeliveryEngine(), cardiovascularIdentityEngine(), arterialOxygenContentEngine()],
  [
    { name: 'cardio.heart_rate', unit: 'bpm' },
    { name: 'cardio.lv.edv', unit: 'mL' },
    { name: 'cardio.lv.esv', unit: 'mL' },
    { name: 'blood.hemoglobin', unit: 'g/dL' },
    { name: 'arterial.oxygen_saturation', unit: '1' },
    { name: 'arterial.po2', unit: 'mmHg' },
  ],
)

const boundary = (name: string, unit: string, value: number, sigma: number | null) => ({
  name,
  unit,
  value,
  sigma,
  truthClass: 'measured' as const,
  source: {
    id: `event:${name}`,
    sourceId: 'fixture',
    capturedAt: '2026-09-27T00:00:00.000Z',
    semanticState: 'measured' as const,
  },
})

const result = runPhysiologicalSimulation({
  registry,
  boundaryConditions: [
    boundary('cardio.heart_rate', 'bpm', 70, 1),
    boundary('cardio.lv.edv', 'mL', 120, 2),
    boundary('cardio.lv.esv', 'mL', 50, 2),
    boundary('blood.hemoglobin', 'g/dL', 15, 0.2),
    boundary('arterial.oxygen_saturation', '1', 0.98, 0.005),
    boundary('arterial.po2', 'mmHg', 100, 2),
  ],
  untilSeconds: 0,
})

const projected = projectPhysiologicalStateToVerticalGraph(graph, result, CARDIOVASCULAR_PHYSIOLOGY_BINDINGS)
assert.deepEqual(projected.map((entry) => entry.field).sort(), [
  'arterial.oxygen_content',
  'cardio.cardiac_output',
  'cardio.lv.ejection_fraction',
  'cardio.lv.stroke_volume',
  'systemic.oxygen_delivery',
].sort())

for (const entry of projected) {
  const source = result.latest[entry.field]
  assert.ok(source)
  assert.equal(entry.value.value, source.value)
  assert.equal(entry.value.sigma, source.sigma)
  assert.equal(entry.value.truthClass, source.truthClass)
  assert.equal(entry.value.provenance.id, source.provenance.id)
  assert.equal(entry.projectionKind, 'state-overlay')
}

const sv = projected.find((entry) => entry.field === 'cardio.lv.stroke_volume')
const ef = projected.find((entry) => entry.field === 'cardio.lv.ejection_fraction')
const co = projected.find((entry) => entry.field === 'cardio.cardiac_output')
const caO2 = projected.find((entry) => entry.field === 'arterial.oxygen_content')
const do2 = projected.find((entry) => entry.field === 'systemic.oxygen_delivery')
assert.equal(sv?.nodeId, 'left-ventricle')
assert.equal(ef?.nodeId, 'left-ventricle')
assert.equal(co?.nodeId, 'heart')
assert.equal(caO2?.nodeId, 'cardiovascular-system')
assert.equal(do2?.nodeId, 'human')

const wrongNode: readonly VerticalPhysiologyBinding[] = [
  { ...CARDIOVASCULAR_PHYSIOLOGY_BINDINGS[0], nodeId: 'missing-node' },
]
assert.ok(validateVerticalPhysiologyBindings(graph, wrongNode).some((error) => error.includes('missing node missing-node')))

const wrongScale: readonly VerticalPhysiologyBinding[] = [
  { ...CARDIOVASCULAR_PHYSIOLOGY_BINDINGS[0], expectedScales: ['organ'] },
]
assert.ok(validateVerticalPhysiologyBindings(graph, wrongScale).some((error) => error.includes('scale mismatch')))

const wrongDomain: readonly VerticalPhysiologyBinding[] = [
  { ...CARDIOVASCULAR_PHYSIOLOGY_BINDINGS[0], expectedDomain: 'respiratory' },
]
assert.ok(validateVerticalPhysiologyBindings(graph, wrongDomain).some((error) => error.includes('domain mismatch')))

const unknownField: readonly VerticalPhysiologyBinding[] = [
  ...CARDIOVASCULAR_PHYSIOLOGY_BINDINGS,
  {
    field: 'cardio.unmodeled.hidden_state',
    nodeId: 'heart',
    expectedScales: ['organ'],
    expectedDomain: 'cardiovascular',
    projectionPolicy: 'model-overlay-only',
  },
]
assert.throws(
  () => projectPhysiologicalStateToVerticalGraph(graph, result, unknownField),
  /no physiological value for bound field cardio\.unmodeled\.hidden_state/,
)

const measuredAsModel = {
  ...result,
  latest: {
    ...result.latest,
    'cardio.cardiac_output': {
      ...result.latest['cardio.cardiac_output'],
      truthClass: 'measured' as const,
      provenance: {
        ...result.latest['cardio.cardiac_output'].provenance,
        kind: 'boundary' as const,
      },
    },
  },
}
assert.throws(
  () => projectPhysiologicalStateToVerticalGraph(graph, measuredAsModel, CARDIOVASCULAR_PHYSIOLOGY_BINDINGS),
  /model-overlay-only binding cardio\.cardiac_output rejected truth class measured/,
)

console.log('physiology-vertical-projection: runtime state maps read-only onto vertical biology with unchanged provenance, uncertainty and truth class')
