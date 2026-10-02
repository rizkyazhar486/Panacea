import assert from 'node:assert/strict'
import {
  NEUROVASCULAR_EVIDENCE,
  NEUROVASCULAR_NETWORK,
  NEUROVASCULAR_PERFUSION_BOUNDARY,
  NEUROVASCULAR_RELATIONSHIPS,
  buildAutoregulationTeachingCurve,
  simulateSyntheticNeurovascularState,
} from '../../src/lib/neurovascularPerfusionLab.ts'

assert.equal(NEUROVASCULAR_NETWORK.length, 6, 'neurovascular chain must expose six linked systems nodes')
assert.deepEqual(NEUROVASCULAR_NETWORK.map((node) => node.layer), ['systemic', 'intracranial', 'vascular', 'delivery', 'delivery', 'metabolic'])
assert.equal(new Set(NEUROVASCULAR_NETWORK.map((node) => node.id)).size, NEUROVASCULAR_NETWORK.length, 'network node ids must be unique')

assert.ok(NEUROVASCULAR_RELATIONSHIPS.some((item) => item.expression === 'CPP = MAP − ICP'))
assert.ok(NEUROVASCULAR_RELATIONSHIPS.some((item) => item.expression === 'CBF ∝ CPP / CVR'))
assert.ok(NEUROVASCULAR_RELATIONSHIPS.some((item) => /O₂ delivery/.test(item.expression)))
assert.ok(NEUROVASCULAR_RELATIONSHIPS.some((item) => /brain tissue \+ blood \+ CSF/.test(item.expression)))
for (const relationship of NEUROVASCULAR_RELATIONSHIPS) {
  assert.ok(relationship.meaning.length >= 90, `${relationship.id} needs a meaningful physiology explanation`)
  assert.match(relationship.boundary, /educational|conceptual|physiology|normalized/i, `${relationship.id} needs an educational boundary`)
  assert.match(relationship.boundary, /not|does not|no patient/i, `${relationship.id} must reject patient-specific interpretation`)
}

const baselineInput = {
  systemicPressureDrive: 0.55,
  intracranialVolumeLoad: 0.2,
  baselineVascularResistance: 0.5,
  arterialOxygenContent: 0.65,
  metabolicDemand: 0.55,
  autoregulatoryReserve: 0.7,
}
const baseline = simulateSyntheticNeurovascularState(baselineInput)
for (const [key, value] of Object.entries(baseline)) assert.ok(value >= 0 && value <= 1, `${key} must stay normalized`)

const lowPressure = simulateSyntheticNeurovascularState({ ...baselineInput, systemicPressureDrive: 0.15 })
const highPressure = simulateSyntheticNeurovascularState({ ...baselineInput, systemicPressureDrive: 0.9 })
assert.ok(highPressure.cerebralPerfusionPressureSignal > lowPressure.cerebralPerfusionPressureSignal, 'systemic pressure drive must directionally increase CPP signal')

const lowIcpLoad = simulateSyntheticNeurovascularState({ ...baselineInput, intracranialVolumeLoad: 0.05 })
const highIcpLoad = simulateSyntheticNeurovascularState({ ...baselineInput, intracranialVolumeLoad: 0.9 })
assert.ok(highIcpLoad.cerebralPerfusionPressureSignal < lowIcpLoad.cerebralPerfusionPressureSignal, 'intracranial volume load must directionally reduce CPP signal')
assert.ok(highIcpLoad.intracranialComplianceStress > lowIcpLoad.intracranialComplianceStress, 'intracranial volume load must increase compliance-stress signal')

const lowResistance = simulateSyntheticNeurovascularState({ ...baselineInput, baselineVascularResistance: 0.1 })
const highResistance = simulateSyntheticNeurovascularState({ ...baselineInput, baselineVascularResistance: 0.9 })
assert.ok(highResistance.cerebralBloodFlowSignal < lowResistance.cerebralBloodFlowSignal, 'vascular resistance must directionally reduce synthetic CBF')

const lowOxygen = simulateSyntheticNeurovascularState({ ...baselineInput, arterialOxygenContent: 0.1 })
const highOxygen = simulateSyntheticNeurovascularState({ ...baselineInput, arterialOxygenContent: 0.9 })
assert.ok(highOxygen.oxygenDeliverySignal > lowOxygen.oxygenDeliverySignal, 'arterial oxygen content must directionally increase delivery signal')
assert.ok(highOxygen.metabolicMismatchSignal < lowOxygen.metabolicMismatchSignal, 'higher oxygen delivery should reduce synthetic mismatch at constant demand')

const lowDemand = simulateSyntheticNeurovascularState({ ...baselineInput, metabolicDemand: 0.1 })
const highDemand = simulateSyntheticNeurovascularState({ ...baselineInput, metabolicDemand: 0.9 })
assert.ok(highDemand.metabolicMismatchSignal > lowDemand.metabolicMismatchSignal, 'metabolic demand must directionally increase mismatch signal')

const lowReserveCurve = buildAutoregulationTeachingCurve(0.5, 0.2, 0.1)
const highReserveCurve = buildAutoregulationTeachingCurve(0.5, 0.2, 0.95)
assert.equal(lowReserveCurve.length, 11)
assert.equal(highReserveCurve.length, 11)
assert.equal(lowReserveCurve[0].pressureDrive, 0)
assert.equal(lowReserveCurve.at(-1)?.pressureDrive, 1)
const lowReserveFlowRange = Math.max(...lowReserveCurve.map((point) => point.flowSignal)) - Math.min(...lowReserveCurve.map((point) => point.flowSignal))
const highReserveFlowRange = Math.max(...highReserveCurve.map((point) => point.flowSignal)) - Math.min(...highReserveCurve.map((point) => point.flowSignal))
assert.ok(highReserveFlowRange < lowReserveFlowRange, 'greater synthetic autoregulatory reserve should buffer flow changes across pressure drive')

assert.deepEqual(NEUROVASCULAR_EVIDENCE.map((source) => source.pmid), ['38471987', '40474297', '36762674'])
for (const source of NEUROVASCULAR_EVIDENCE) {
  assert.equal(source.url, `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`)
  assert.ok(source.role.length >= 90, `${source.pmid} needs an explicit evidence role`)
}

assert.match(NEUROVASCULAR_PERFUSION_BOUNDARY, /educational neurovascular physiology sandbox/i)
assert.match(NEUROVASCULAR_PERFUSION_BOUNDARY, /normalized synthetic signals/i)
assert.match(NEUROVASCULAR_PERFUSION_BOUNDARY, /not mmHg/i)
assert.match(NEUROVASCULAR_PERFUSION_BOUNDARY, /does not diagnose/i)
assert.match(NEUROVASCULAR_PERFUSION_BOUNDARY, /treatment eligibility/i)

console.log('neurovascular perfusion lab: CPP/CBF/CVR, oxygen delivery, intracranial dynamics, autoregulation buffering and evidence boundaries validated')
