import assert from 'node:assert/strict'
import {
  PRECISION_CARE_DEMO_SERVICES,
  PRECISION_CARE_STAGES,
  informationValue,
  precisionCareGate,
  rankPrecisionCareServices,
  serviceEconomics,
} from '../../src/lib/precisionCareOrchestration.ts'

assert.equal(PRECISION_CARE_STAGES.length, 8)
assert.ok(PRECISION_CARE_DEMO_SERVICES.length >= 6)
assert.equal(new Set(PRECISION_CARE_DEMO_SERVICES.map((service) => service.id)).size, PRECISION_CARE_DEMO_SERVICES.length)

for (const service of PRECISION_CARE_DEMO_SERVICES) {
  const value = informationValue(service)
  assert.ok(value.gross >= 0 && value.gross <= 100)
  assert.ok(value.penalty >= 0 && value.penalty <= 25)
  assert.ok(value.net >= 0 && value.net <= 100)
  assert.ok(service.purpose.length > 20)
}

const strong = informationValue({
  evidenceTier: 'A',
  expectedInformation: 100,
  actionability: 100,
  dataGapFit: 100,
  costTransparency: 100,
  burden: 0,
  redundancy: 0,
})
assert.equal(strong.net, 100)

const weak = informationValue({
  evidenceTier: 'X',
  expectedInformation: 0,
  actionability: 0,
  dataGapFit: 0,
  costTransparency: 0,
  burden: 100,
  redundancy: 100,
})
assert.equal(weak.net, 0)

const clinicianService = PRECISION_CARE_DEMO_SERVICES.find((service) => service.requiresClinician)
assert.ok(clinicianService)
assert.equal(precisionCareGate(clinicianService!, { patientSpecific: true, clinicianReviewed: false }), 'clinician-review-required')
assert.equal(precisionCareGate(clinicianService!, { patientSpecific: true, clinicianReviewed: true }), 'planning-eligible')
assert.equal(precisionCareGate({ evidenceTier: 'D', requiresClinician: false }), 'research-only')
assert.equal(precisionCareGate({ evidenceTier: 'X', requiresClinician: false }), 'blocked')

const ranked = rankPrecisionCareServices()
for (let index = 1; index < ranked.length; index += 1) {
  assert.ok(ranked[index - 1].value.net >= ranked[index].value.net)
}

const economics = serviceEconomics(1_000_000, 0.1)
assert.deepEqual(economics, { listPriceIdr: 1_000_000, platformGrossIdr: 100_000, providerPayoutIdr: 900_000 })
assert.equal(serviceEconomics(1_000_000, 0.31), undefined)
assert.equal(serviceEconomics(-1, 0.1), undefined)

console.log('Precision Care orchestration: information-value scoring, gates, journey and economics validated')
