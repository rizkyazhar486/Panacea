import assert from 'node:assert/strict'
import { RESPIRATORY_GAS_EXCHANGE_BOUNDARY, RESPIRATORY_GAS_EXCHANGE_DEFAULTS, RESPIRATORY_TEACHING_EQUATIONS, deriveRespiratoryGasExchange, normalizeRespiratoryInputs } from '../../src/lib/respiratoryGasExchangeLab.ts'
const baseline = deriveRespiratoryGasExchange(RESPIRATORY_GAS_EXCHANGE_DEFAULTS)
for (const [key,value] of Object.entries(baseline)) if (key !== 'dominantConstraint' && key !== 'relativeAirwayRadius') assert.ok(typeof value === 'number' && value >= 0 && value <= 1)
const narrow = deriveRespiratoryGasExchange({...RESPIRATORY_GAS_EXCHANGE_DEFAULTS, airwayRadius:.1}); const wide = deriveRespiratoryGasExchange({...RESPIRATORY_GAS_EXCHANGE_DEFAULTS, airwayRadius:.9})
assert.ok(wide.airwayResistanceSignal < narrow.airwayResistanceSignal); assert.ok(wide.alveolarVentilationSignal > narrow.alveolarVentilationSignal)
const poor = deriveRespiratoryGasExchange({...RESPIRATORY_GAS_EXCHANGE_DEFAULTS, perfusionMatch:.15}); const good = deriveRespiratoryGasExchange({...RESPIRATORY_GAS_EXCHANGE_DEFAULTS, perfusionMatch:.9}); assert.ok(good.oxygenTransferSignal > poor.oxygenTransferSignal)
const lowD = deriveRespiratoryGasExchange({...RESPIRATORY_GAS_EXCHANGE_DEFAULTS, diffusionCapacity:.15}); const highD = deriveRespiratoryGasExchange({...RESPIRATORY_GAS_EXCHANGE_DEFAULTS, diffusionCapacity:.9}); assert.ok(highD.oxygenTransferSignal > lowD.oxygenTransferSignal)
const lowM = deriveRespiratoryGasExchange({...RESPIRATORY_GAS_EXCHANGE_DEFAULTS, metabolicDemand:.15}); const highM = deriveRespiratoryGasExchange({...RESPIRATORY_GAS_EXCHANGE_DEFAULTS, metabolicDemand:.9}); assert.ok(highM.gasExchangeReserveSignal < lowM.gasExchangeReserveSignal)
const normalized=normalizeRespiratoryInputs({airwayRadius:9,compliance:-4,ventilationDrive:Number.NaN}); assert.equal(normalized.airwayRadius,1); assert.equal(normalized.compliance,0); assert.equal(normalized.ventilationDrive,0)
for(const token of ['R ∝ 1 / r⁴','C = ΔV / ΔP','V̇A = (VT − VD) × f','V̇A / Q̇']) assert.ok(RESPIRATORY_TEACHING_EQUATIONS.some(item=>item.expression===token))
assert.match(RESPIRATORY_GAS_EXCHANGE_BOUNDARY,/synthetic dimensionless signals/i); assert.match(RESPIRATORY_GAS_EXCHANGE_BOUNDARY,/ventilator settings/i)
console.log('respiratory gas-exchange lab: directional physiology, equations and safety boundary locked')
