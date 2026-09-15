import assert from 'node:assert/strict'
import { BODY_SYSTEM_SOURCE_WAVE } from '../../src/lib/bodySystemSourceWave.ts'
import {
  BODY_SYSTEM_PHYSIOLOGY_BRIDGE,
  BODY_SYSTEM_PHYSIOLOGY_BRIDGE_BOUNDARY,
  getBodySystemPhysiologyBridge,
} from '../../src/lib/bodySystemPhysiologyBridge.ts'
import { WHOLE_BODY_PHYSIOLOGY_SYSTEMS, getWholeBodySystem } from '../../src/lib/wholeBodyPhysiologyOS.ts'

const atlasIds = new Set(BODY_SYSTEM_SOURCE_WAVE.map((system) => system.id))
const physiologyIds = new Set(WHOLE_BODY_PHYSIOLOGY_SYSTEMS.map((system) => system.id))

assert.equal(BODY_SYSTEM_PHYSIOLOGY_BRIDGE.length, BODY_SYSTEM_SOURCE_WAVE.length, 'every source-atlas system needs a physiology bridge')
assert.equal(new Set(BODY_SYSTEM_PHYSIOLOGY_BRIDGE.map((item) => item.atlasSystemId)).size, BODY_SYSTEM_SOURCE_WAVE.length, 'bridge atlas ids must be unique')
assert.deepEqual(
  [...new Set(BODY_SYSTEM_PHYSIOLOGY_BRIDGE.map((item) => item.fidelity))].sort(),
  ['compound', 'contextual', 'direct'],
  'bridge fidelity vocabulary must remain explicit and bounded',
)

for (const bridge of BODY_SYSTEM_PHYSIOLOGY_BRIDGE) {
  assert.ok(atlasIds.has(bridge.atlasSystemId), `bridge must not invent atlas id ${bridge.atlasSystemId}`)
  assert.ok(bridge.physiologySystemIds.length >= 1, `${bridge.atlasSystemId} needs at least one physiology destination`)
  assert.equal(new Set(bridge.physiologySystemIds).size, bridge.physiologySystemIds.length, `${bridge.atlasSystemId} physiology destinations must be unique`)
  assert.ok(bridge.rationale.length >= 40, `${bridge.atlasSystemId} bridge needs an explicit rationale`)
  assert.ok(['direct', 'compound', 'contextual'].includes(bridge.fidelity), `${bridge.atlasSystemId} uses an unsupported fidelity label`)
  for (const physiologyId of bridge.physiologySystemIds) {
    assert.ok(physiologyIds.has(physiologyId), `${bridge.atlasSystemId} must not invent physiology id ${physiologyId}`)
    getWholeBodySystem(physiologyId)
  }
}

for (const atlasSystem of BODY_SYSTEM_SOURCE_WAVE) getBodySystemPhysiologyBridge(atlasSystem.id)

assert.deepEqual(getBodySystemPhysiologyBridge('urinary').physiologySystemIds, ['renal'])
assert.deepEqual(getBodySystemPhysiologyBridge('lymphatic-immune').physiologySystemIds, ['immune-lymphatic'])
assert.deepEqual(getBodySystemPhysiologyBridge('integumentary-surface').physiologySystemIds, ['integumentary'])
assert.equal(getBodySystemPhysiologyBridge('sensory-ent').fidelity, 'contextual', 'sensory/ENT must not be misrepresented as a direct one-to-one physiology domain')
assert.deepEqual(
  BODY_SYSTEM_PHYSIOLOGY_BRIDGE.filter((item) => item.fidelity === 'contextual').map((item) => item.atlasSystemId),
  ['sensory-ent'],
  'sensory/ENT is the only intentionally contextual mapping in this wave',
)
assert.deepEqual(
  BODY_SYSTEM_PHYSIOLOGY_BRIDGE.filter((item) => item.fidelity === 'compound').map((item) => item.atlasSystemId).sort(),
  ['digestive', 'reproductive'],
  'compound mappings must remain limited to systems that intentionally span two physiology domains',
)
assert.ok(getBodySystemPhysiologyBridge('digestive').physiologySystemIds.includes('hepatic-metabolic'), 'digestive bridge must preserve hepatometabolic coupling')
assert.ok(getBodySystemPhysiologyBridge('reproductive').physiologySystemIds.includes('endocrine'), 'reproductive bridge must preserve endocrine coupling')

assert.match(BODY_SYSTEM_PHYSIOLOGY_BRIDGE_BOUNDARY, /educational navigation relationships/i)
assert.match(BODY_SYSTEM_PHYSIOLOGY_BRIDGE_BOUNDARY, /not claims/i)
assert.match(BODY_SYSTEM_PHYSIOLOGY_BRIDGE_BOUNDARY, /clinical function/i)

console.log('body system physiology bridge: 11/11 source-atlas systems mapped with explicit fidelity, bounded ids and educational boundary')
