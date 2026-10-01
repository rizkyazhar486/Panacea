import assert from 'node:assert/strict'
import {
  FICK_OXYGEN_EXTRACTION_BOUNDARY,
  FICK_OXYGEN_EXTRACTION_EVIDENCE,
  deriveFickOxygenExtraction,
} from '../../src/lib/physiology/fickOxygenExtraction.ts'
import { DEFAULT_OXYGEN_CONTENT_CONVENTION } from '../../src/lib/physiology/oxygenContentConventions.ts'

const baseline = deriveFickOxygenExtraction({
  cardiacOutputLMin: 5,
  hemoglobinGdl: 15,
  arterialSaturationFraction: 0.98,
  arterialPo2MmHg: 100,
  venousSaturationFraction: 0.75,
  venousPo2MmHg: 40,
  venousSamplingSite: 'mixed-venous-pulmonary-artery',
})

assert.equal(baseline.conventionId, DEFAULT_OXYGEN_CONTENT_CONVENTION)
assert.equal(baseline.truthClass, 'model-derived')
assert.ok(Math.abs(baseline.arterialOxygenContentMlDl - 19.998) < 1e-12)
assert.ok(Math.abs(baseline.mixedVenousOxygenContentMlDl - 15.195) < 1e-12)
assert.ok(Math.abs(baseline.arteriovenousDifferenceMlDl - 4.803) < 1e-12)
assert.ok(Math.abs(baseline.systemicOxygenConsumptionMlMin - 240.15) < 1e-9)
assert.ok(Math.abs(baseline.oxygenExtractionRatio - (4.803 / 19.998)) < 1e-12)

const greaterExtraction = deriveFickOxygenExtraction({
  cardiacOutputLMin: 5,
  hemoglobinGdl: 15,
  arterialSaturationFraction: 0.98,
  arterialPo2MmHg: 100,
  venousSaturationFraction: 0.60,
  venousPo2MmHg: 30,
  venousSamplingSite: 'mixed-venous-pulmonary-artery',
})
assert.ok(greaterExtraction.oxygenExtractionRatio > baseline.oxygenExtractionRatio)
assert.ok(greaterExtraction.systemicOxygenConsumptionMlMin > baseline.systemicOxygenConsumptionMlMin)

const doubledFlow = deriveFickOxygenExtraction({
  cardiacOutputLMin: 10,
  hemoglobinGdl: 15,
  arterialSaturationFraction: 0.98,
  arterialPo2MmHg: 100,
  venousSaturationFraction: 0.75,
  venousPo2MmHg: 40,
  venousSamplingSite: 'mixed-venous-pulmonary-artery',
})
assert.ok(Math.abs(doubledFlow.systemicOxygenConsumptionMlMin - 2 * baseline.systemicOxygenConsumptionMlMin) < 1e-9)

const zeroExtraction = deriveFickOxygenExtraction({
  cardiacOutputLMin: 5,
  hemoglobinGdl: 15,
  arterialSaturationFraction: 0.90,
  arterialPo2MmHg: 60,
  venousSaturationFraction: 0.90,
  venousPo2MmHg: 60,
  venousSamplingSite: 'mixed-venous-pulmonary-artery',
})
assert.equal(zeroExtraction.arteriovenousDifferenceMlDl, 0)
assert.equal(zeroExtraction.systemicOxygenConsumptionMlMin, 0)
assert.equal(zeroExtraction.oxygenExtractionRatio, 0)

// Sabotage/edge guards: a central line is not mixed venous blood, and a reversed
// oxygen-content gradient is outside the supported steady-state systemic model.
assert.throws(
  () => deriveFickOxygenExtraction({
    cardiacOutputLMin: 5,
    hemoglobinGdl: 15,
    arterialSaturationFraction: 0.98,
    arterialPo2MmHg: 100,
    venousSaturationFraction: 0.75,
    venousPo2MmHg: 40,
    venousSamplingSite: 'central-venous',
  }),
  /mixed venous pulmonary-artery sampling/i,
)
assert.throws(
  () => deriveFickOxygenExtraction({
    cardiacOutputLMin: 5,
    hemoglobinGdl: 15,
    arterialSaturationFraction: 0.70,
    arterialPo2MmHg: 40,
    venousSaturationFraction: 0.90,
    venousPo2MmHg: 80,
    venousSamplingSite: 'mixed-venous-pulmonary-artery',
  }),
  /venous oxygen content exceeds arterial oxygen content/i,
)
assert.throws(
  () => deriveFickOxygenExtraction({
    cardiacOutputLMin: 0,
    hemoglobinGdl: 15,
    arterialSaturationFraction: 0.98,
    arterialPo2MmHg: 100,
    venousSaturationFraction: 0.75,
    venousPo2MmHg: 40,
    venousSamplingSite: 'mixed-venous-pulmonary-artery',
  }),
  /cardiac output must be a positive finite number/i,
)
assert.throws(
  () => deriveFickOxygenExtraction({
    cardiacOutputLMin: 5,
    hemoglobinGdl: 15,
    arterialSaturationFraction: 1.2,
    arterialPo2MmHg: 100,
    venousSaturationFraction: 0.75,
    venousPo2MmHg: 40,
    venousSamplingSite: 'mixed-venous-pulmonary-artery',
  }),
  /saturation must be a finite fraction/i,
)

assert.ok(FICK_OXYGEN_EXTRACTION_EVIDENCE.some((item) => item.reference === 'NCBI Bookshelf NBK606091'))
assert.ok(FICK_OXYGEN_EXTRACTION_EVIDENCE.some((item) => item.reference === 'NCBI Bookshelf NBK493219'))
assert.match(FICK_OXYGEN_EXTRACTION_BOUNDARY, /steady-state/i)
assert.match(FICK_OXYGEN_EXTRACTION_BOUNDARY, /mixed venous/i)
assert.match(FICK_OXYGEN_EXTRACTION_BOUNDARY, /not silently substituted/i)
assert.match(FICK_OXYGEN_EXTRACTION_BOUNDARY, /not patient diagnosis/i)

console.log('fick oxygen extraction: CaO2/CvO2 -> VO2/OER mass balance, mixed-venous boundary, sabotage guards locked')
