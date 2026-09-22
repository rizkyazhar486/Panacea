import assert from 'node:assert/strict'
import {
  RENAL_TUBULAR_TRANSPORT_BOUNDARY,
  RENAL_TUBULAR_TRANSPORT_DEFAULTS,
  RENAL_TUBULAR_TRANSPORT_PROVENANCE,
  deriveRenalTubularTransport,
  normalizeRenalTubularTransportInputs,
} from '../../src/lib/renalTubularTransport.ts'

const defaults = deriveRenalTubularTransport(RENAL_TUBULAR_TRANSPORT_DEFAULTS)
for (const value of Object.values(defaults)) {
  assert.ok(Number.isFinite(value))
  assert.ok(value >= 0 && value <= 1)
}

const clamped = normalizeRenalTubularTransportInputs({
  filteredSodiumDelivery: 2,
  proximalTransportCapacity: -1,
  distalSaltTransportCapacity: Number.NaN,
  collectingDuctWaterPermeability: 0.5,
})
assert.equal(clamped.filteredSodiumDelivery, 1)
assert.equal(clamped.proximalTransportCapacity, 0)
assert.equal(clamped.distalSaltTransportCapacity, 0)
assert.equal(clamped.collectingDuctWaterPermeability, 0.5)

const lowProximal = deriveRenalTubularTransport({ ...RENAL_TUBULAR_TRANSPORT_DEFAULTS, proximalTransportCapacity: 0.2 })
const highProximal = deriveRenalTubularTransport({ ...RENAL_TUBULAR_TRANSPORT_DEFAULTS, proximalTransportCapacity: 0.8 })
assert.ok(highProximal.proximalReabsorptionSignal > lowProximal.proximalReabsorptionSignal)
assert.ok(highProximal.distalDeliverySignal < lowProximal.distalDeliverySignal)

const lowDistal = deriveRenalTubularTransport({ ...RENAL_TUBULAR_TRANSPORT_DEFAULTS, distalSaltTransportCapacity: 0.2 })
const highDistal = deriveRenalTubularTransport({ ...RENAL_TUBULAR_TRANSPORT_DEFAULTS, distalSaltTransportCapacity: 0.8 })
assert.ok(highDistal.distalReabsorptionSignal > lowDistal.distalReabsorptionSignal)
assert.ok(highDistal.collectingDuctDeliverySignal < lowDistal.collectingDuctDeliverySignal)

const dry = deriveRenalTubularTransport({ ...RENAL_TUBULAR_TRANSPORT_DEFAULTS, collectingDuctWaterPermeability: 0 })
const permeable = deriveRenalTubularTransport({ ...RENAL_TUBULAR_TRANSPORT_DEFAULTS, collectingDuctWaterPermeability: 1 })
assert.equal(dry.relativeWaterRetentionSignal, 0)
assert.ok(permeable.relativeWaterRetentionSignal > dry.relativeWaterRetentionSignal)

assert.deepEqual(RENAL_TUBULAR_TRANSPORT_PROVENANCE.map(source => source.pmid), ['23908456', '25589264', '32152499'])
assert.ok(RENAL_TUBULAR_TRANSPORT_PROVENANCE.every(source => source.reviewState.includes('not Panaceamed clinical validation or human review')))
assert.match(RENAL_TUBULAR_TRANSPORT_BOUNDARY, /synthetic dimensionless/i)
assert.match(RENAL_TUBULAR_TRANSPORT_BOUNDARY, /does not calculate/i)
assert.match(RENAL_TUBULAR_TRANSPORT_BOUNDARY, /patient-specific/i)

console.log('renal-tubular-transport: ok')
