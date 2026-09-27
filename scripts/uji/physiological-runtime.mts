import assert from 'node:assert/strict'
import {
  createDomainEngineRegistry,
  runPhysiologicalSimulation,
  type DomainEngineContract,
} from '../../src/lib/physiology/runtime.ts'
import { boundaryConditionFromLongitudinalEvent } from '../../src/lib/physiology/longitudinalBoundary.ts'
import { syntheticCoupledEngines } from '../../src/lib/physiology/exampleEngines.ts'

const baseEngine = (overrides: Partial<DomainEngineContract<number>> = {}): DomainEngineContract<number> => ({
  id: 'engine.a',
  modelId: 'synthetic-a',
  modelVersion: '1.0.0',
  parameterSetId: 'fixture-v1',
  validationClass: 'synthetic',
  fidelity: 'infrastructure-fixture',
  dtSeconds: 1,
  consumes: [{ name: 'boundary.input', unit: '1' }],
  produces: [{ name: 'engine.a.output', unit: '1', truthClass: 'simulated' }],
  initialize: () => 0,
  step: ({ inputs }) => ({ state: 1, outputs: [{ name: 'engine.a.output', unit: '1', value: inputs['boundary.input'].value, sigma: null }] }),
  ...overrides,
})

assert.throws(() => createDomainEngineRegistry([baseEngine(), baseEngine()],[{ name: 'boundary.input', unit: '1' }]), /duplicate engine id/)
assert.throws(() => createDomainEngineRegistry([baseEngine({ dtSeconds: 0 })],[{ name: 'boundary.input', unit: '1' }]), /dtSeconds/)
assert.throws(() => createDomainEngineRegistry([baseEngine(), baseEngine({ id:'engine.b', modelId:'synthetic-b' })],[{ name: 'boundary.input', unit: '1' }]), /produced by more than one engine/)
assert.throws(() => createDomainEngineRegistry([baseEngine({ consumes: [{ name: 'boundary.input', unit: 'mmHg' }] })],[{ name: 'boundary.input', unit: '1' }]), /unit mismatch/)
assert.throws(() => createDomainEngineRegistry([baseEngine({ produces: [{ name: 'engine.a.output', unit: '1', truthClass: 'measured' as never }] })],[{ name: 'boundary.input', unit: '1' }]), /truth class/)
assert.throws(() => createDomainEngineRegistry([baseEngine({ consumes: [{ name: 'missing.field', unit: '1' }] })],[{ name: 'boundary.input', unit: '1' }]), /no engine or boundary produces/)
assert.throws(() => createDomainEngineRegistry([baseEngine({ consumes: [{ name: 'engine.a.output', unit: '1' }] })],[{ name: 'boundary.input', unit: '1' }]), /consumes its own field/)

const registry = createDomainEngineRegistry([baseEngine()],[{ name: 'boundary.input', unit: '1' }])
assert.equal(registry.engines.length, 1)
assert.equal(registry.producerByField['engine.a.output'], 'engine.a')

const boundary = {
  name: 'boundary.input', unit: '1', value: 2, sigma: null,
  truthClass: 'measured' as const,
  source: { id:'event-1', sourceId:'fixture', capturedAt:'2026-09-27T00:00:00.000Z', semanticState:'measured' as const },
}
assert.throws(() => runPhysiologicalSimulation({ registry, boundaryConditions:[], untilSeconds:2 }), /missing boundary condition/)
assert.throws(() => runPhysiologicalSimulation({ registry, boundaryConditions:[{ ...boundary, truthClass:'simulated' as never, source:{ ...boundary.source, semanticState:'simulated' as never } }], untilSeconds:0 }), /unsupported boundary truth class/)
assert.throws(() => runPhysiologicalSimulation({ registry, boundaryConditions:[{ ...boundary, source:{ ...boundary.source, semanticState:'imported' } }], untilSeconds:0 }), /does not match source semantic state/)

for (const [engine, pattern] of [
  [baseEngine({ step: () => ({ state:0, outputs:[{ name:'x', unit:'1', value:1, sigma:null }] }) }), /undeclared field/],
  [baseEngine({ step: () => ({ state:0, outputs:[{ name:'engine.a.output', unit:'1', value:Number.NaN, sigma:null }] }) }), /non-finite/],
  [baseEngine({ step: () => ({ state:0, outputs:[{ name:'engine.a.output', unit:'1', value:1, sigma:-1 }] }) }), /sigma/],
] as const) {
  const local = createDomainEngineRegistry([engine],[{ name:'boundary.input', unit:'1' }])
  assert.throws(() => runPhysiologicalSimulation({ registry:local, boundaryConditions:[boundary], untilSeconds:0 }), pattern)
}

const a = runPhysiologicalSimulation({ registry, boundaryConditions:[boundary], untilSeconds:2 })
const b = runPhysiologicalSimulation({ registry, boundaryConditions:[boundary], untilSeconds:2 })
assert.equal(a.stepCounts['engine.a'], 3)
assert.equal(a.latest['engine.a.output'].value, 2)
assert.equal(a.latest['engine.a.output'].truthClass, 'simulated')
assert.equal(a.latest['engine.a.output'].provenance.id, b.latest['engine.a.output'].provenance.id)
assert.equal(a.latest['engine.a.output'].provenance.modelId, 'synthetic-a')
assert.equal(a.latest['engine.a.output'].provenance.modelVersion, '1.0.0')
assert.equal(a.latest['engine.a.output'].provenance.parameterSetId, 'fixture-v1')
assert.equal(a.latest['engine.a.output'].provenance.validationClass, 'synthetic')
assert.equal(a.latest['engine.a.output'].provenance.fidelity, 'infrastructure-fixture')
assert.ok(a.latest['engine.a.output'].provenance.parents.includes(a.boundaries['boundary.input'].provenance.id))
const changedOutputRegistry = createDomainEngineRegistry([baseEngine({ step: ({ inputs }) => ({ state:1, outputs:[{ name:'engine.a.output', unit:'1', value:inputs['boundary.input'].value + 1, sigma:null }] }) })],[{ name:'boundary.input', unit:'1' }])
const changedOutput = runPhysiologicalSimulation({ registry:changedOutputRegistry, boundaryConditions:[boundary], untilSeconds:2 })
assert.notEqual(a.latest['engine.a.output'].provenance.id, changedOutput.latest['engine.a.output'].provenance.id)

const engineB: DomainEngineContract<number> = {
  id:'engine.b', modelId:'synthetic-b', modelVersion:'1.0.0', parameterSetId:'fixture-v1',
  validationClass:'synthetic', fidelity:'infrastructure-fixture', dtSeconds:2,
  consumes:[{ name:'engine.a.output', unit:'1' }],
  produces:[{ name:'engine.b.output', unit:'1', truthClass:'model-derived' }],
  initialize:()=>0,
  step:({ inputs })=>({ state:1, outputs:[{ name:'engine.b.output', unit:'1', value:inputs['engine.a.output'].value + 1, sigma:null }] }),
}
const coupledRegistry = createDomainEngineRegistry([baseEngine(), engineB],[{ name:'boundary.input', unit:'1' }])
const coupled = runPhysiologicalSimulation({ registry:coupledRegistry, boundaryConditions:[boundary], untilSeconds:2 })
assert.deepEqual(coupled.stepCounts, { 'engine.a':3, 'engine.b':2 })
assert.equal(coupled.latest['engine.b.output'].value, 3)
assert.ok(coupled.latest['engine.b.output'].provenance.parents.includes(coupled.latest['engine.a.output'].provenance.id))

const sourceEvent = {
  id:'evt-map', subjectId:'subject-1', domain:'vital', metric:'fixture-input', value:4, unit:'1',
  recordedAt:'2026-09-27T00:00:00.000Z', confidence:0.9,
  provenance:{ sourceKind:'device', sourceId:'device:fixture', capturedAt:'2026-09-27T00:00:00.000Z', receivedAt:'2026-09-27T00:00:01.000Z' },
  consent:{ granted:true, purposes:['personal-visualization'], grantedAt:'2026-09-27T00:00:00.000Z' },
  review:{ state:'not-required' }, semanticState:'measured',
} as const
const sourceBefore = JSON.stringify(sourceEvent)
const mapped = boundaryConditionFromLongitudinalEvent(sourceEvent as never, { name:'boundary.input' })
assert.equal(mapped.value, 4)
assert.equal(mapped.sigma, null)
assert.equal(mapped.truthClass, 'measured')
assert.equal(mapped.source.id, 'evt-map')
assert.equal(mapped.source.sourceId, 'device:fixture')
assert.equal(JSON.stringify(sourceEvent), sourceBefore)
for (const semanticState of ['simulated','ai-draft','unavailable','derived','rule-output'] as const) {
  assert.throws(() => boundaryConditionFromLongitudinalEvent({ ...sourceEvent, semanticState } as never, { name:'boundary.input' }), /not admissible/)
}
assert.throws(() => boundaryConditionFromLongitudinalEvent({ ...sourceEvent, value:'4' } as never, { name:'boundary.input' }), /numeric/)
assert.throws(() => boundaryConditionFromLongitudinalEvent({ ...sourceEvent, unit:undefined } as never, { name:'boundary.input' }), /unit/)

const fixtureRegistry = createDomainEngineRegistry(syntheticCoupledEngines(), [{ name:'boundary.input', unit:'1' }])
const fixture = runPhysiologicalSimulation({ registry:fixtureRegistry, boundaryConditions:[mapped], untilSeconds:4 })
assert.equal(fixture.stepCounts['synthetic.drive'], 5)
assert.equal(fixture.stepCounts['synthetic.response'], 3)
assert.equal(fixture.latest['synthetic.response.value'].truthClass, 'simulated')
assert.ok(Number.isFinite(fixture.latest['synthetic.response.value'].value))

// Registry declaration order must not control same-time dependency execution.
const reversedFixtureRegistry = createDomainEngineRegistry([...syntheticCoupledEngines()].reverse(), [{ name:'boundary.input', unit:'1' }])
const reversedFixture = runPhysiologicalSimulation({ registry:reversedFixtureRegistry, boundaryConditions:[mapped], untilSeconds:0 })
assert.equal(reversedFixture.latest['synthetic.response.value'].value, fixture.latest['synthetic.response.value'].value)
assert.deepEqual(reversedFixtureRegistry.engines.map((engine) => engine.id), ['synthetic.drive', 'synthetic.response'])

const cycleA = baseEngine({
  id:'cycle.a', modelId:'cycle-a', consumes:[{ name:'cycle.b.out', unit:'1' }],
  produces:[{ name:'cycle.a.out', unit:'1', truthClass:'simulated' }],
})
const cycleB = baseEngine({
  id:'cycle.b', modelId:'cycle-b', consumes:[{ name:'cycle.a.out', unit:'1' }],
  produces:[{ name:'cycle.b.out', unit:'1', truthClass:'simulated' }],
})
assert.throws(() => createDomainEngineRegistry([cycleA, cycleB]), /cyclic engine dependency/)

console.log('physiological-runtime: fail-closed registry, dependency-sorted deterministic multi-rate coupling, longitudinal boundary, synthetic fixture')
