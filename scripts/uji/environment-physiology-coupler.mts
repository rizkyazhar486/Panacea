import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  computeHeatIndexC,
  computeWetBulbTempC,
  coupleEnvironmentToPhysiology,
  pm25ToUsAqi,
} from '../../src/domains/body-exposure/engine/environmentPhysiologyCoupler.ts'

// 1. Sea level vs high altitude barometric & alveolar O2 cascade + VV-ECMO coupling
const sea = coupleEnvironmentToPhysiology({
  ambientTempC: 24,
  relativeHumidityPct: 50,
  pm25UgM3: 8,
  uvIndex: 4,
  altitudeM: 0,
})
const high = coupleEnvironmentToPhysiology({
  ambientTempC: 10,
  relativeHumidityPct: 40,
  pm25UgM3: 8,
  uvIndex: 8,
  altitudeM: 3800,
})

assert.equal(sea.epistemicClass, 'MECHANISTIC_EDUCATIONAL_SIMULATION')
assert.equal(sea.notClinicalAdvice, true)
assert.ok(sea.modelAssumptions.length >= 3)
assert.ok(Math.abs(sea.atmosphere.barometricMmHg - 760) < 1, `expected sea level ~760 mmHg, got ${sea.atmosphere.barometricMmHg}`)
assert.ok(high.atmosphere.barometricMmHg < 500, `expected 3800m Pb < 500 mmHg, got ${high.atmosphere.barometricMmHg}`)
assert.ok(high.atmosphere.pao2AlveolarMmHg < sea.atmosphere.pao2AlveolarMmHg - 35)
assert.ok(high.atmosphere.sao2EstPct < sea.atmosphere.sao2EstPct)
assert.ok(high.atmosphere.do2MlMin < sea.atmosphere.do2MlMin)
assert.equal(high.atmosphere.hypoxiaTier, 'HIGH_ALTITUDE_HYPOXIA')
assert.equal(sea.ecmoBridge.status, 'tunak')
assert.equal(high.ecmoBridge.status, 'tunak')
assert.ok(sea.ecmoBridge.sao2Pct > 70 && sea.ecmoBridge.do2MlMin > 300)
assert.ok(high.ecmoBridge.barometricMmHg < sea.ecmoBridge.barometricMmHg)

// 2. Tropical heatwave thermoregulation & wet-bulb strain escalation
const heatwave = coupleEnvironmentToPhysiology({
  ambientTempC: 38,
  relativeHumidityPct: 80,
  pm25UgM3: 15,
  uvIndex: 11,
  altitudeM: 10,
  exertionMet: 6,
})
assert.ok(computeWetBulbTempC(38, 80) > 31)
assert.ok(computeHeatIndexC(38, 80) > 50)
assert.equal(heatwave.thermoregulation.heatStrainTier, 'CRITICAL_HYPERTHERMIA')
assert.ok(heatwave.thermoregulation.sweatRateLPerHr > sea.thermoregulation.sweatRateLPerHr)
assert.ok(heatwave.thermoregulation.estimatedHrBpm > sea.thermoregulation.estimatedHrBpm)
assert.equal(heatwave.photobiology.uvRiskTier, 'EXTREME')
assert.equal(heatwave.photobiology.photoprotectionRequired, true)

// 3. Severe PM2.5 airway load & US-AQI mapping
assert.ok(pm25ToUsAqi(8) <= 50)
assert.ok(pm25ToUsAqi(180) > 200)
const smog = coupleEnvironmentToPhysiology({
  ambientTempC: 28,
  relativeHumidityPct: 60,
  pm25UgM3: 185,
  uvIndex: 2,
  altitudeM: 50,
})
assert.equal(smog.airway.airQualityTier, 'HAZARDOUS')
assert.equal(smog.airway.respiratorGuidance, 'INDOOR_HEPA')
assert.ok(smog.airway.airwayResistanceMultiplier > sea.airway.airwayResistanceMultiplier)
assert.ok(smog.airway.outdoorExertionFactor < 0.5)

// 4. NaN / out-of-range fail-closed sanitization
const sanitized = coupleEnvironmentToPhysiology({
  ambientTempC: Number.NaN,
  relativeHumidityPct: 999,
  pm25UgM3: -50,
  uvIndex: Number.POSITIVE_INFINITY,
  altitudeM: 25000,
})
assert.ok(Number.isFinite(sanitized.atmosphere.barometricMmHg))
assert.equal(sanitized.sanitizedInput.altitudeM, 6000)
assert.equal(sanitized.sanitizedInput.relativeHumidityPct, 100)
assert.equal(sanitized.sanitizedInput.pm25UgM3, 0)

// 5. AstralChartMatrix live telemetry + acquisition + environment-ECMO UI contract
const astralSrc = readFileSync(new URL('../../src/components/ui/AstralChartMatrix.tsx', import.meta.url), 'utf8')
assert.ok(astralSrc.includes('useVitals()'), 'AstralChartMatrix must bind live useVitals() telemetry')
assert.ok(astralSrc.includes('coupleEnvironmentToPhysiology('), 'AstralChartMatrix must bind Environment-Physiology-ECMO coupler')
assert.ok(astralSrc.includes('triggerQuickWearableConnect'), 'AstralChartMatrix must provide 1-tap BLE wearable acquisition')
assert.ok(astralSrc.includes('data-astral-provenance'), 'AstralChartMatrix must show explicit observed-vs-simulation provenance')
assert.ok(astralSrc.includes('data-env-ecmo-observatory'), 'AstralChartMatrix must embed Environment x ECMO observatory')

console.log(
  `environment-physiology-coupler: sea Pb=${sea.atmosphere.barometricMmHg}mmHg DO2=${sea.atmosphere.do2MlMin} vs 3800m Pb=${high.atmosphere.barometricMmHg}mmHg DO2=${high.atmosphere.do2MlMin}, heatwave Tw=${heatwave.thermoregulation.wetBulbTempC}C, smog AQI=${smog.airway.estimatedUsAqi}, VV-ECMO SaO2=${sea.ecmoBridge.sao2Pct}% PASS`,
)
