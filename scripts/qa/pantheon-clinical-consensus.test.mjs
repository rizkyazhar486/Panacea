import assert from 'node:assert/strict'
import test from 'node:test'

import {
  evaluatePantheonClinicalConsensus,
} from '../../src/domains/clinical-operations/model/pantheonClinicalConsensusEngine.ts'

test('T-CLIN-01: Cardio-Sepsis fluid overload conflict resolution (LVEF <= 35%)', () => {
  const result = evaluatePantheonClinicalConsensus({
    patientId: 'PT-TEST-CARDIO-01',
    weightKg: 70,
    meanArterialPressureMmHg: 58,
    systolicBpMmHg: 84,
    heartRateBpm: 115,
    respiratoryRateBpm: 24,
    lactateMmolL: 4.2,
    serumCreatinineMgDl: 1.8,
    eGfrOrCrClMlMin: 40,
    lvefPercentage: 25, // Severe HFrEF
    activeInfectionSource: 'Community-acquired pneumonia',
    prescribedAntimicrobial: 'Cefepime',
    triageTimeZeroIso: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    evaluationTimeIso: new Date().toISOString(),
  })

  assert.strictEqual(result.patientId, 'PT-TEST-CARDIO-01')
  assert.strictEqual(result.overallTriageTier, 'HIGH_RISK_ICU_ALERT')
  assert.strictEqual(result.requiresHumanPhysicianSignoff, true)
  assert.strictEqual(result.clinically_reviewed, false)
  assert.strictEqual(result.truthClass, 'clinical_decision_support_guideline_proxy')
  assert.strictEqual(result.neverManufacturesBiomarkers, true)
  assert.match(result.auditDigestSha256, /^[a-f0-9]{64}$/)

  // Verify Cardio-Sepsis Conflict was flagged and arbitrated
  const cardioConflict = result.detectedGuidelineConflicts.find(
    (c) => c.conflictId === 'cardio-sepsis-fluid-overload'
  )
  assert.ok(cardioConflict, 'Cardio-sepsis fluid conflict must be detected')
  assert.match(cardioConflict.conflictDescription, /HFrEF/i)
  assert.match(cardioConflict.arbiterResolutionStrategy, /titrated.*challenges/i)
  assert.ok(
    cardioConflict.contraindicatedActions.some((act) => act.includes('30 mL/kg')),
    'Contraindicated actions must forbid unmonitored 30 mL/kg bolus'
  )

  // Verify Cardiology and Critical Care agent votes
  const cardVote = result.agentVotes.find((v) => v.specialty === 'CARDIOLOGY')
  const ccVote = result.agentVotes.find((v) => v.specialty === 'CRITICAL_CARE')
  assert.ok(cardVote, 'Cardiology agent vote must exist')
  assert.ok(ccVote, 'Critical care agent vote must exist')
  assert.strictEqual(cardVote.urgencyTier, 'CRITICAL_ACTION_REQUIRED')
  assert.match(cardVote.primaryConcern, /pulmonary edema/i)
})

test('T-CLIN-02: Nephrotoxic antimicrobial synergy hazard (Vanc + Pip-Tazo in renal impairment)', () => {
  const result = evaluatePantheonClinicalConsensus({
    patientId: 'PT-TEST-RENAL-02',
    weightKg: 75,
    meanArterialPressureMmHg: 72,
    systolicBpMmHg: 110,
    heartRateBpm: 88,
    respiratoryRateBpm: 18,
    lactateMmolL: 2.1,
    serumCreatinineMgDl: 2.6,
    eGfrOrCrClMlMin: 26, // Severe renal impairment
    lvefPercentage: 55,
    activeInfectionSource: 'Intra-abdominal abscess',
    prescribedAntimicrobial: 'Vancomycin + Piperacillin-Tazobactam',
    concomitantNephrotoxins: ['Piperacillin-Tazobactam'],
    triageTimeZeroIso: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    evaluationTimeIso: new Date().toISOString(),
  })

  const nephroConflict = result.detectedGuidelineConflicts.find(
    (c) => c.conflictId === 'nephrotoxic-synergy-vanc-zosyn'
  )
  assert.ok(nephroConflict, 'Nephrotoxic synergy conflict must be detected')
  assert.match(nephroConflict.arbiterResolutionStrategy, /Cefepime|Meropenem|Linezolid/i)
  assert.ok(
    nephroConflict.contraindicatedActions.some((act) => act.includes('Vancomycin + Piperacillin-Tazobactam')),
    'Concurrent Vancomycin + Pip-Tazo must be listed in contraindicated actions'
  )

  const nephVote = result.agentVotes.find((v) => v.specialty === 'NEPHROLOGY')
  assert.ok(nephVote, 'Nephrology agent vote must exist')
  assert.strictEqual(nephVote.urgencyTier, 'CRITICAL_ACTION_REQUIRED')
  assert.match(nephVote.primaryConcern, /synergistic nephrotoxicity/i)
})

test('T-CLIN-03: Surviving Sepsis 1-Hour bundle tracking and sequence breach detection', () => {
  const timeZero = new Date(Date.now() - 40 * 60 * 1000)
  const result = evaluatePantheonClinicalConsensus({
    patientId: 'PT-TEST-SEPSIS-03',
    weightKg: 65,
    meanArterialPressureMmHg: 54,
    systolicBpMmHg: 80,
    heartRateBpm: 122,
    respiratoryRateBpm: 26,
    lactateMmolL: 4.8,
    serumCreatinineMgDl: 1.1,
    eGfrOrCrClMlMin: 80,
    lvefPercentage: 60,
    activeInfectionSource: 'Urosepsis',
    prescribedAntimicrobial: 'Meropenem',
    triageTimeZeroIso: timeZero.toISOString(),
    evaluationTimeIso: new Date().toISOString(),
    actionRecords: [
      // Antibiotics given at +10 min, blood cultures taken at +20 min (Sequence breach!)
      { element: 'BROAD_SPECTRUM_ANTIBIOTICS', performedAtIso: new Date(timeZero.getTime() + 10 * 60 * 1000).toISOString() },
      { element: 'BLOOD_CULTURES_PRIOR_ANTIBIOTICS', performedAtIso: new Date(timeZero.getTime() + 20 * 60 * 1000).toISOString() },
    ],
  })

  assert.ok(result.sepsisBundleStatus, 'Sepsis bundle status must be evaluated')
  assert.ok(
    result.sepsisBundleStatus.sequenceBreachWarnings.length > 0,
    'Sequence breach must be flagged'
  )
  assert.ok(
    Object.keys(result.sepsisBundleStatus.elementEvaluations).length === 5,
    'All 5 bundle elements must be tracked'
  )
})

test('T-CLIN-04: Acute shock vs. outpatient GDMT medication hold', () => {
  const result = evaluatePantheonClinicalConsensus({
    patientId: 'PT-TEST-SHOCK-GDMT-04',
    weightKg: 70,
    meanArterialPressureMmHg: 52, // Shock
    systolicBpMmHg: 76,
    heartRateBpm: 110,
    respiratoryRateBpm: 22,
    lactateMmolL: 3.9,
    serumCreatinineMgDl: 1.4,
    eGfrOrCrClMlMin: 55,
    lvefPercentage: 30, // HFrEF in acute shock
    activeInfectionSource: 'Bacteremia',
    triageTimeZeroIso: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    evaluationTimeIso: new Date().toISOString(),
  })

  const gdmtHoldConflict = result.detectedGuidelineConflicts.find(
    (c) => c.conflictId === 'acute-shock-vs-outpatient-gdmt'
  )
  assert.ok(gdmtHoldConflict, 'Acute shock vs GDMT conflict must be detected')
  assert.match(gdmtHoldConflict.arbiterResolutionStrategy, /hold/i)
  assert.ok(
    gdmtHoldConflict.contraindicatedActions.some((act) => act.includes('ARNI') || act.includes('Beta-blocker')),
    'Vasodilators/ARNI/Beta-blockers must be contraindicated during acute shock'
  )
})

test('T-CLIN-05: Input validation & fail-closed error boundaries', () => {
  assert.throws(() => {
    // @ts-expect-error test invalid input
    evaluatePantheonClinicalConsensus(null)
  }, TypeError)

  assert.throws(() => {
    evaluatePantheonClinicalConsensus({
      // @ts-expect-error missing patientId
      weightKg: 70,
    })
  }, TypeError)

  assert.throws(() => {
    evaluatePantheonClinicalConsensus({
      patientId: 'PT-FAIL-01',
      weightKg: -5, // Invalid weight
      meanArterialPressureMmHg: 65,
      systolicBpMmHg: 100,
      heartRateBpm: 80,
      respiratoryRateBpm: 18,
      lactateMmolL: 1.0,
      serumCreatinineMgDl: 1.0,
      eGfrOrCrClMlMin: 60,
      triageTimeZeroIso: new Date().toISOString(),
      evaluationTimeIso: new Date().toISOString(),
    })
  }, TypeError)
})
