import assert from 'node:assert/strict'
import {
  RESPIRATORY_EVIDENCE,
  RESPIRATORY_GAS_EXCHANGE_BOUNDARY,
  RESPIRATORY_GAS_EXCHANGE_DEFAULTS,
  RESPIRATORY_TEACHING_EQUATIONS,
  deriveRespiratoryGasExchange,
  normalizeRespiratoryInputs,
} from '../../src/lib/respiratoryGasExchangeLab.ts'

const baseline = deriveRespiratoryGasExchange(RESPIRATORY_GAS_EXCHANGE_DEFAULTS)

for (const [key, value] of Object.entries(baseline)) {
  if (key === 'dominantConstraint' || key === 'relativeAirwayRadius') continue
  assert.ok(typeof value === 'number' && value >= 0 && value <= 1, `${key} must remain a normalized 0–1 teaching signal`)
}
assert.ok(baseline.relativeAirwayRadius >= 0.65 && baseline.relativeAirwayRadius <= 1.35, 'relative airway radius must remain in bounded teaching range')

const narrowAirway = deriveRespiratoryGasExchange({ ...RESPIRATORY_GAS_EXCHANGE_DEFAULTS, airwayRadius: 0.1 })
const wideAirway = deriveRespiratoryGasExchange({ ...RESPIRATORY_GAS_EXCHANGE_DEFAULTS, airwayRadius: 0.9 })
assert.ok(wideAirway.airwayResistanceSignal < narrowAirway.airwayResistanceSignal, 'wider synthetic airway must lower resistance signal')
assert.ok(wideAirway.alveolarVentilationSignal > narrowAirway.alveolarVentilationSignal, 'wider synthetic airway must improve ventilation signal')
assert.ok(wideAirway.workOfBreathingSignal < narrowAirway.workOfBreathingSignal, 'wider synthetic airway must reduce work-of-breathing signal')

const stiff = deriveRespiratoryGasExchange({ ...RESPIRATORY_GAS_EXCHANGE_DEFAULTS, compliance: 0.1 })
const compliant = deriveRespiratoryGasExchange({ ...RESPIRATORY_GAS_EXCHANGE_DEFAULTS, compliance: 0.9 })
assert.ok(compliant.alveolarVentilationSignal > stiff.alveolarVentilationSignal, 'higher synthetic compliance must improve ventilation signal')
assert.ok(compliant.workOfBreathingSignal < stiff.workOfBreathingSignal, 'higher synthetic compliance must reduce work-of-breathing signal')

const lowDrive = deriveRespiratoryGasExchange({ ...RESPIRATORY_GAS_EXCHANGE_DEFAULTS, ventilationDrive: 0.2 })
const highDrive = deriveRespiratoryGasExchange({ ...RESPIRATORY_GAS_EXCHANGE_DEFAULTS, ventilationDrive: 0.9 })
assert.ok(highDrive.alveolarVentilationSignal > lowDrive.alveolarVentilationSignal, 'higher ventilation drive must increase alveolar ventilation signal')
assert.ok(highDrive.co2ClearanceSignal > lowDrive.co2ClearanceSignal, 'higher ventilation drive must increase CO2-clearance signal')

const poorMatch = deriveRespiratoryGasExchange({ ...RESPIRATORY_GAS_EXCHANGE_DEFAULTS, perfusionMatch: 0.15 })
const goodMatch = deriveRespiratoryGasExchange({ ...RESPIRATORY_GAS_EXCHANGE_DEFAULTS, perfusionMatch: 0.9 })
assert.ok(goodMatch.oxygenTransferSignal > poorMatch.oxygenTransferSignal, 'better synthetic V/Q matching must improve oxygen-transfer signal')
assert.ok(goodMatch.co2ClearanceSignal > poorMatch.co2ClearanceSignal, 'better synthetic V/Q matching must improve CO2-clearance signal')

const lowDiffusion = deriveRespiratoryGasExchange({ ...RESPIRATORY_GAS_EXCHANGE_DEFAULTS, diffusionCapacity: 0.15 })
const highDiffusion = deriveRespiratoryGasExchange({ ...RESPIRATORY_GAS_EXCHANGE_DEFAULTS, diffusionCapacity: 0.9 })
assert.ok(highDiffusion.oxygenTransferSignal > lowDiffusion.oxygenTransferSignal, 'higher synthetic diffusion capacity must improve oxygen-transfer signal')

const lowDemand = deriveRespiratoryGasExchange({ ...RESPIRATORY_GAS_EXCHANGE_DEFAULTS, metabolicDemand: 0.15 })
const highDemand = deriveRespiratoryGasExchange({ ...RESPIRATORY_GAS_EXCHANGE_DEFAULTS, metabolicDemand: 0.9 })
assert.ok(highDemand.gasExchangeReserveSignal < lowDemand.gasExchangeReserveSignal, 'higher metabolic demand must consume synthetic reserve')

const normalized = normalizeRespiratoryInputs({ airwayRadius: 9, compliance: -4, ventilationDrive: Number.NaN })
assert.equal(normalized.airwayRadius, 1)
assert.equal(normalized.compliance, 0)
assert.equal(normalized.ventilationDrive, 0)

for (const token of ['R ∝ 1 / r⁴', 'C = ΔV / ΔP', 'V̇A = (VT − VD) × f', 'V̇A / Q̇']) {
  assert.ok(RESPIRATORY_TEACHING_EQUATIONS.some((item) => item.expression === token), `formula ledger must preserve ${token}`)
}

assert.deepEqual(RESPIRATORY_EVIDENCE.map((item) => item.pmid), ['25063240', '37816345', '31390642'])
for (const source of RESPIRATORY_EVIDENCE) assert.equal(source.url, `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`)
assert.match(RESPIRATORY_GAS_EXCHANGE_BOUNDARY, /synthetic dimensionless signals/i)
assert.match(RESPIRATORY_GAS_EXCHANGE_BOUNDARY, /does not calculate spirometry/i)
assert.match(RESPIRATORY_GAS_EXCHANGE_BOUNDARY, /ventilator settings/i)

console.log('respiratory gas-exchange lab: directional physiology, equations, evidence and safety boundary locked')
