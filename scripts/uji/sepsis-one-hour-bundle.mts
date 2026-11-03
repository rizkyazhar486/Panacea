// scripts/uji/sepsis-one-hour-bundle.mts
// Tests for Surviving Sepsis Campaign 2021 1-Hour Care Bundle CDS Engine
import assert from 'node:assert/strict'
import {
  evaluateSepsisOneHourBundle,
  type PatientSepsisAssessmentInput,
} from '../../src/domains/clinical-operations/index.ts'

// Case 1: Ideal on-time bundle execution
const idealInput: PatientSepsisAssessmentInput = {
  patientId: 'PT-SEPSIS-001',
  triageTimeZeroIso: '2026-11-02T10:00:00Z',
  evaluationTimeIso: '2026-11-02T10:45:00Z',
  weightKg: 70,
  meanArterialPressure_mmHg: 60,
  systolicBp_mmHg: 85,
  initialLactate_mmolL: 3.5,
  suspectedInfectionSource: 'Community-acquired pneumonia',
  sofaScore: 4,
  qSofaScore: 2,
  hasPersistentHypotensionAfterFluids: false,
  actionRecords: [
    { element: 'LACTATE_MEASUREMENT', performedAtIso: '2026-11-02T10:15:00Z' },
    { element: 'BLOOD_CULTURES_PRIOR_ANTIBIOTICS', performedAtIso: '2026-11-02T10:25:00Z' },
    { element: 'BROAD_SPECTRUM_ANTIBIOTICS', performedAtIso: '2026-11-02T10:35:00Z' },
    { element: 'CRYSTALLOID_FLUID_30ML_KG', performedAtIso: '2026-11-02T10:40:00Z' },
  ],
}

const idealRes = evaluateSepsisOneHourBundle(idealInput)
assert.equal(idealRes.patientId, 'PT-SEPSIS-001')
assert.equal(idealRes.targetCrystalloidVolumeMl, 2100) // 70 kg * 30 mL/kg
assert.equal(idealRes.elementEvaluations.LACTATE_MEASUREMENT.status, 'COMPLETED_ON_TIME')
assert.equal(idealRes.elementEvaluations.BLOOD_CULTURES_PRIOR_ANTIBIOTICS.status, 'COMPLETED_ON_TIME')
assert.equal(idealRes.elementEvaluations.BROAD_SPECTRUM_ANTIBIOTICS.status, 'COMPLETED_ON_TIME')
assert.equal(idealRes.elementEvaluations.CRYSTALLOID_FLUID_30ML_KG.status, 'COMPLETED_ON_TIME')
assert.equal(idealRes.sequenceBreachWarnings.length, 0)
assert.equal(idealRes.truthClass, 'clinical_decision_support_guideline_proxy')
assert.equal(idealRes.clinically_reviewed, false)
assert.equal(idealRes.neverManufacturesBiomarkers, true)

// Case 2: Sequence breach (Antibiotics administered before blood cultures)
const sequenceBreachInput: PatientSepsisAssessmentInput = {
  ...idealInput,
  actionRecords: [
    { element: 'LACTATE_MEASUREMENT', performedAtIso: '2026-11-02T10:10:00Z' },
    { element: 'BROAD_SPECTRUM_ANTIBIOTICS', performedAtIso: '2026-11-02T10:20:00Z' },
    { element: 'BLOOD_CULTURES_PRIOR_ANTIBIOTICS', performedAtIso: '2026-11-02T10:30:00Z' },
  ],
}
const seqRes = evaluateSepsisOneHourBundle(sequenceBreachInput)
assert.ok(seqRes.sequenceBreachWarnings.length > 0)
assert.ok(seqRes.sequenceBreachWarnings[0].includes('prior to obtaining blood cultures'))

// Case 3: Overdue breach (>60 minutes elapsed without completion)
const overdueInput: PatientSepsisAssessmentInput = {
  ...idealInput,
  evaluationTimeIso: '2026-11-02T11:20:00Z', // 80 mins elapsed
  actionRecords: [
    { element: 'LACTATE_MEASUREMENT', performedAtIso: '2026-11-02T11:15:00Z' }, // 75 mins (overdue)
  ],
}
const overdueRes = evaluateSepsisOneHourBundle(overdueInput)
assert.equal(overdueRes.elementEvaluations.LACTATE_MEASUREMENT.status, 'OVERDUE_BREACH')
assert.equal(overdueRes.elementEvaluations.LACTATE_MEASUREMENT.delayMinutes, 15)
assert.equal(overdueRes.elementEvaluations.BROAD_SPECTRUM_ANTIBIOTICS.status, 'OVERDUE_BREACH')
assert.equal(overdueRes.bundleMetOnTime, false)

// Case 4: Septic shock detection and vasopressor indication
const shockInput: PatientSepsisAssessmentInput = {
  ...idealInput,
  meanArterialPressure_mmHg: 58,
  initialLactate_mmolL: 4.2,
  hasPersistentHypotensionAfterFluids: true,
}
const shockRes = evaluateSepsisOneHourBundle(shockInput)
assert.equal(shockRes.isSepticShockPresent, true)
assert.ok(shockRes.clinicalRecommendations.some((r) => r.includes('norepinephrine')))

// Case 5: Negative controls (Input validation & fail-closed behavior)
assert.throws(() => {
  evaluateSepsisOneHourBundle({
    ...idealInput,
    evaluationTimeIso: '2026-11-02T09:30:00Z', // precedes triage time zero
  })
}, /evaluationTimeIso cannot precede triageTimeZeroIso/)

assert.throws(() => {
  evaluateSepsisOneHourBundle({
    ...idealInput,
    weightKg: -5,
  })
}, /Invalid sepsis CDS input: weightKg/)

assert.throws(() => {
  evaluateSepsisOneHourBundle({
    ...idealInput,
    meanArterialPressure_mmHg: 0,
  })
}, /Invalid sepsis CDS input: meanArterialPressure_mmHg/)

console.log('Surviving Sepsis Campaign 1-Hour Care Bundle CDS verified.')
