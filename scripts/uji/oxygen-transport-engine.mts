import assert from 'node:assert/strict'
import { createDomainEngineRegistry, runPhysiologicalSimulation } from '../../src/lib/physiology/runtime.ts'
import { cardiovascularIdentityEngine } from '../../src/lib/physiology/cardiovascularIdentityEngine.ts'
import { DEFAULT_OXYGEN_CONTENT_CONVENTION } from '../../src/lib/physiology/oxygenContentConventions.ts'
import { arterialOxygenContentEngine, systemicOxygenDeliveryEngine } from '../../src/lib/physiology/oxygenTransportEngine.ts'

const engines = [systemicOxygenDeliveryEngine(), cardiovascularIdentityEngine(), arterialOxygenContentEngine()]
const registry = createDomainEngineRegistry(engines, [
  { name:'cardio.heart_rate', unit:'bpm' },
  { name:'cardio.lv.edv', unit:'mL' },
  { name:'cardio.lv.esv', unit:'mL' },
  { name:'blood.hemoglobin', unit:'g/dL' },
  { name:'arterial.oxygen_saturation', unit:'1' },
  { name:'arterial.po2', unit:'mmHg' },
])
assert.deepEqual(registry.engines.map((engine) => engine.id), [
  'cardiovascular.identities', 'oxygen.arterial-content', 'oxygen.systemic-delivery',
])
const boundary = (name:string, unit:string, value:number, sigma:number|null) => ({
  name, unit, value, sigma, truthClass:'measured' as const,
  source:{ id:`event:${name}`, sourceId:'fixture', capturedAt:'2026-09-27T00:00:00.000Z', semanticState:'measured' as const },
})
const result = runPhysiologicalSimulation({
  registry,
  boundaryConditions:[
    boundary('cardio.heart_rate','bpm',70,1),
    boundary('cardio.lv.edv','mL',120,2),
    boundary('cardio.lv.esv','mL',50,2),
    boundary('blood.hemoglobin','g/dL',15,0.2),
    boundary('arterial.oxygen_saturation','1',0.98,0.005),
    boundary('arterial.po2','mmHg',100,2),
  ],
  untilSeconds:0,
})

assert.equal(result.latest['cardio.cardiac_output'].value, 4.9)
assert.ok(Math.abs(result.latest['arterial.oxygen_content'].value - 19.998) < 1e-12)
assert.ok(Math.abs(result.latest['systemic.oxygen_delivery'].value - 979.902) < 1e-9)
assert.equal(result.latest['arterial.oxygen_content'].truthClass, 'model-derived')
assert.equal(result.latest['systemic.oxygen_delivery'].truthClass, 'model-derived')
assert.equal(result.latest['arterial.oxygen_content'].provenance.parameterSetId, DEFAULT_OXYGEN_CONTENT_CONVENTION)

const caParents = result.latest['arterial.oxygen_content'].provenance.parents
assert.equal(caParents.length, 3)
assert.ok(!caParents.includes(result.latest['cardio.cardiac_output'].provenance.id))
const do2Parents = result.latest['systemic.oxygen_delivery'].provenance.parents
assert.equal(do2Parents.length, 2)
assert.ok(do2Parents.includes(result.latest['cardio.cardiac_output'].provenance.id))
assert.ok(do2Parents.includes(result.latest['arterial.oxygen_content'].provenance.id))
assert.ok((result.latest['arterial.oxygen_content'].sigma ?? 0) > 0)
assert.ok((result.latest['systemic.oxygen_delivery'].sigma ?? 0) > 0)

console.log('oxygen-transport-engine: cardio→CaO2→DO2 cross-engine chain, convention provenance, uncertainty propagation')
