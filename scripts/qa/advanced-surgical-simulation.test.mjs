import assert from 'node:assert/strict'
import test from 'node:test'

import {
  calculateLaparoscopicErgonomics,
  evaluatePneumoperitoneumHemodynamics,
  evaluateDiathermyEnergyDelivery,
  evaluateStrasbergCriticalViewOfSafety,
  evaluateOsatsCompetency,
} from '../../src/domains/surgical/index.ts'

test('T-SURG-01: Laparoscopic triangulation geometry & fulcrum ratio mechanics', () => {
  // Scenario A: Optimal 60-degree triangulation (Hanna 1997)
  // Target at [0, 0, 0]
  // Camera at [0, -150, 80]
  // Left port at [-60, -100, 50]
  // Right port at [60, -100, 50]
  const optimalRes = calculateLaparoscopicErgonomics({
    targetMm: { x: 0, y: 0, z: 0 },
    cameraPortMm: { x: 0, y: -150, z: 80 },
    leftPortMm: { x: -60, y: -100, z: 50 },
    rightPortMm: { x: 60, y: -100, z: 50 },
  })

  assert.strictEqual(optimalRes.collisionRisk, false)
  assert.strictEqual(optimalRes.ergonomicQuality, 'optimal')
  assert.ok(optimalRes.triangulationAngleDeg >= 45 && optimalRes.triangulationAngleDeg <= 75)
  assert.ok(optimalRes.leftWorkingDistanceMm > 100)
  assert.ok(optimalRes.rightWorkingDistanceMm > 100)

  // Scenario B: Acute angle sword-fighting collision (<30 degrees)
  // Ports placed too close together on the anterior abdominal wall
  const collisionRes = calculateLaparoscopicErgonomics({
    targetMm: { x: 0, y: 0, z: 0 },
    cameraPortMm: { x: 0, y: -150, z: 80 },
    leftPortMm: { x: -10, y: -120, z: 50 },
    rightPortMm: { x: 10, y: -120, z: 50 },
  })

  assert.strictEqual(collisionRes.collisionRisk, true)
  assert.strictEqual(collisionRes.ergonomicQuality, 'hazardous-collision')
  assert.ok(collisionRes.triangulationAngleDeg < 30)
  assert.match(collisionRes.feedback, /sword-fighting/i)
})

test('T-SURG-02: Pneumoperitoneum hemodynamics & CO2 hypercapnia coupling', () => {
  // Safe resting pressure: 12 mmHg, short duration 30 min
  const safePneumo = evaluatePneumoperitoneumHemodynamics({
    intraAbdominalPressureMmHg: 12,
    baselineCardiacOutputLMin: 5.0,
    baselineMeanArterialPressureMmHg: 90,
    durationMinutes: 30,
    patientTrendelenburgAngleDeg: 10,
  })

  assert.strictEqual(safePneumo.effectiveIapMmHg, 12)
  assert.strictEqual(safePneumo.hypercapniaRiskTier, 'minimal')
  assert.ok(safePneumo.adjustedCardiacOutputLMin <= 5.0)
  assert.strictEqual(safePneumo.inferiorVenaCavaCompressionIndex >= 0, true)

  // Critical elevated pressure: 18 mmHg with prolonged 200 min duration
  const severePneumo = evaluatePneumoperitoneumHemodynamics({
    intraAbdominalPressureMmHg: 18,
    baselineCardiacOutputLMin: 5.0,
    baselineMeanArterialPressureMmHg: 90,
    durationMinutes: 200,
    patientTrendelenburgAngleDeg: 20,
  })

  assert.strictEqual(severePneumo.hypercapniaRiskTier, 'critical')
  assert.ok(severePneumo.cardiacOutputDeltaPercent < -15) // >15% drop in cardiac output
  assert.ok(severePneumo.inferiorVenaCavaCompressionIndex > 0.6)
  assert.ok(severePneumo.clinicalWarnings.length >= 2)
  assert.ok(severePneumo.clinicalWarnings.some((w) => w.includes('hypercapnia')))
})

test('T-SURG-03: Diathermy electrosurgical lateral thermal spread physics', () => {
  // Safe bipolar short burst: 25W, 1.5s, distance 8mm to ureter
  const safeDiathermy = evaluateDiathermyEnergyDelivery({
    powerWatts: 25,
    mode: 'bipolar-coag',
    burstDurationSeconds: 1.5,
    distanceToAdjacentVulnerableStructureMm: 8.0,
    structureLabel: 'Right Ureter',
  })

  assert.strictEqual(safeDiathermy.collateralThermalHazard, false)
  assert.strictEqual(safeDiathermy.excessiveDurationWarning, false)
  assert.ok(safeDiathermy.estimatedLateralThermalSpreadMm < 1.0)
  assert.ok(safeDiathermy.safeClearanceMarginMm > 7.0)

  // Dangerous monopolar continuous burst: 40W, 4.2s, distance 1.5mm to Common Bile Duct
  const hazardousDiathermy = evaluateDiathermyEnergyDelivery({
    powerWatts: 40,
    mode: 'monopolar-coag',
    burstDurationSeconds: 4.2,
    distanceToAdjacentVulnerableStructureMm: 1.5,
    structureLabel: 'Common Bile Duct',
  })

  assert.strictEqual(hazardousDiathermy.collateralThermalHazard, true)
  assert.strictEqual(hazardousDiathermy.excessiveDurationWarning, true)
  assert.ok(hazardousDiathermy.estimatedLateralThermalSpreadMm > 2.0)
  assert.ok(hazardousDiathermy.safeClearanceMarginMm < 1.0)
  assert.ok(hazardousDiathermy.safetyRecommendations.some((r) => r.includes('CRITICAL HAZARD')))
})

test('T-SURG-04: Strasberg Critical View of Safety (CVS, 1995) state machine', () => {
  // Incomplete CVS: triangle cleared, but cystic plate not exposed and 2 structures not isolated
  const incompleteCvs = evaluateStrasbergCriticalViewOfSafety({
    hepatocysticTriangleCleared: true,
    cysticPlateExposed: false,
    twoAndOnlyTwoStructuresVisible: false,
    infundibularTractionApplied: true,
    commonBileDuctIdentified: true,
  })

  assert.strictEqual(incompleteCvs.cvsAchieved, false)
  assert.strictEqual(incompleteCvs.readyForClippingAndDivision, false)
  assert.strictEqual(incompleteCvs.criteriaMetCount, 1)
  assert.strictEqual(incompleteCvs.vasculobiliaryInjuryRiskTier, 'intermediate')

  // Full CVS established: all 3 criteria satisfied
  const completeCvs = evaluateStrasbergCriticalViewOfSafety({
    hepatocysticTriangleCleared: true,
    cysticPlateExposed: true,
    twoAndOnlyTwoStructuresVisible: true,
    infundibularTractionApplied: true,
    commonBileDuctIdentified: true,
  })

  assert.strictEqual(completeCvs.cvsAchieved, true)
  assert.strictEqual(completeCvs.readyForClippingAndDivision, true)
  assert.strictEqual(completeCvs.criteriaMetCount, 3)
  assert.strictEqual(completeCvs.vasculobiliaryInjuryRiskTier, 'low-safe')
  assert.strictEqual(completeCvs.auditChecklist.filter((c) => c.criticality === 'mandatory').every((c) => c.satisfied), true)
})

test('T-SURG-05: OSATS competency evaluation & weakest-link identification', () => {
  const osatsResult = evaluateOsatsCompetency({
    candidateId: 'surgeon-fellow-04',
    procedureId: 'laparoscopic-cholecystectomy',
    scores: [
      { dimension: 'respect-for-tissue', score: 4, evidenceNotes: 'Gentle grasping' },
      { dimension: 'time-and-motion', score: 2, evidenceNotes: 'Repetitive searching movements' },
      { dimension: 'instrument-handling', score: 3, evidenceNotes: 'Adequate bimanual handling' },
      { dimension: 'knowledge-of-instruments', score: 4, evidenceNotes: 'Appropriate clip applier selection' },
      { dimension: 'flow-of-operation', score: 3, evidenceNotes: 'Occasional hesitation at Calot dissection' },
      { dimension: 'use-of-assistants', score: 4, evidenceNotes: 'Clear instructions for fundus retraction' },
      { dimension: 'knowledge-of-procedure', score: 4, evidenceNotes: 'Strasberg landmarks verbalized' },
    ],
  })

  assert.strictEqual(osatsResult.totalScore, 24)
  assert.strictEqual(osatsResult.maxPossibleScore, 35)
  assert.strictEqual(osatsResult.percentageScore, Math.round((24 / 35) * 100))
  assert.strictEqual(osatsResult.competencyTier, 'proficient')
  assert.strictEqual(osatsResult.weakestDimension, 'time-and-motion')
  assert.strictEqual(osatsResult.educationalTruthClass, 'reference')
})

test('T-SURG-06: Determinism & mathematical boundary robustness', () => {
  const run1 = calculateLaparoscopicErgonomics({
    targetMm: { x: 10, y: -20, z: 5 },
    cameraPortMm: { x: 0, y: -160, z: 90 },
    leftPortMm: { x: -80, y: -90, z: 40 },
    rightPortMm: { x: 80, y: -90, z: 40 },
  })
  const run2 = calculateLaparoscopicErgonomics({
    targetMm: { x: 10, y: -20, z: 5 },
    cameraPortMm: { x: 0, y: -160, z: 90 },
    leftPortMm: { x: -80, y: -90, z: 40 },
    rightPortMm: { x: 80, y: -90, z: 40 },
  })

  assert.deepStrictEqual(run1, run2)

  // Zero / negative input safety for hemodynamics
  const clampedHemo = evaluatePneumoperitoneumHemodynamics({
    intraAbdominalPressureMmHg: -5,
    baselineCardiacOutputLMin: -2,
    baselineMeanArterialPressureMmHg: 10,
    durationMinutes: -10,
  })
  assert.strictEqual(clampedHemo.effectiveIapMmHg, 0)
  assert.ok(clampedHemo.adjustedCardiacOutputLMin > 0)
})
