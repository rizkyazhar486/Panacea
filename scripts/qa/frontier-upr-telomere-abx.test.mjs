// scripts/qa/frontier-upr-telomere-abx.test.mjs
// Verification suite for T-CLIN-91 through T-CLIN-95

import test from 'node:test'
import assert from 'node:assert/strict'

import {
  evaluateMitochondrialQualityControl,
} from '../../src/lib/discovery/mitochondrialUprMitophagyEngine.ts'

import {
  evaluateTelomereMaintenanceDynamics,
} from '../../src/lib/discovery/telomereMaintenanceShelterinEngine.ts'

import {
  evaluateTumorImmuneCheckpointKinetics,
} from '../../src/lib/discovery/tumorImmuneCheckpointEngine.ts'

import {
  evaluateEcmMechanotransduction,
} from '../../src/lib/discovery/ecmRemodelingMechanotransductionEngine.ts'

import {
  evaluateAntimicrobialStewardship,
} from '../../src/domains/clinical-operations/model/antimicrobialStewardshipRenalCds.ts'

// ==========================================
// T-CLIN-91: Mitochondrial UPRmt & Mitophagy Engine
// ==========================================
test('T-CLIN-91: Mitochondrial quality control, depolarization & mitophagy flux', () => {
  // 1. Healthy, polarized mitochondrion
  const healthyMito = evaluateMitochondrialQualityControl({
    membranePotentialDeltaPsiMv: -160,
    matrixMisfoldedProteinRatio: 0.05,
    lysosomalAcidityPh: 4.8,
  })

  assert.equal(healthyMito.mitochondrialViabilityStatus, 'HEALTHY_POLARIZED')
  assert.ok(healthyMito.pink1ParkinPrimingScore < 0.2)
  assert.ok(healthyMito.mfn1Mfn2DegradationPercentage < 10)
  assert.equal(healthyMito.uprmtRetrogradeResponse.retrogradeCompensationSufficient, false)
  assert.equal(healthyMito.metadata.truthClass, 'mechanistic_simulation_proxy')
  assert.equal(healthyMito.metadata.neverManufacturesBiomarkers, true)

  // 2. Depolarized mitochondrion committed to mitophagy
  const depolarizedMito = evaluateMitochondrialQualityControl({
    membranePotentialDeltaPsiMv: -60,
    matrixMisfoldedProteinRatio: 0.85,
    lysosomalAcidityPh: 4.8,
  })

  assert.equal(depolarizedMito.mitochondrialViabilityStatus, 'DEPOLARIZED_MITOPHAGY_COMMITTED')
  assert.ok(depolarizedMito.pink1ParkinPrimingScore > 0.8)
  assert.ok(depolarizedMito.mfn1Mfn2DegradationPercentage > 80)
  assert.ok(depolarizedMito.lysosomalClearanceCompletionPercentage > 60)
  assert.ok(depolarizedMito.uprmtRetrogradeResponse.chaperoneUpregulationFold > 2.5)
})

// ==========================================
// T-CLIN-92: Telomere Maintenance & Shelterin Engine
// ==========================================
test('T-CLIN-92: Telomere length attrition, shelterin capping & replicative senescence', () => {
  // 1. Normal somatic progression with active end-replication attrition
  const somaticTelomeres = evaluateTelomereMaintenanceDynamics({
    meanTelomereLengthKb: 6.5,
    shelterinTrf2ExpressionRatio: 0.9,
    shelterinPot1ExpressionRatio: 0.9,
    hTertExpressionScore: 0.0,
  })

  assert.equal(somaticTelomeres.activeMaintenancePathway, 'TELOMERASE_SILENCED_CANONICAL_EROSION')
  assert.equal(somaticTelomeres.cellularReplicativeCapacity, 'NORMAL_HAYFLICK_PROGRESSION')
  assert.ok(somaticTelomeres.estimatedDoublingsRemaining > 40)
  assert.equal(somaticTelomeres.genomicInstabilityRisk, 'NEGLIGIBLE')
  assert.equal(somaticTelomeres.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. Critical crisis: uncapped short telomeres with elevated TIFs
  const crisisTelomeres = evaluateTelomereMaintenanceDynamics({
    meanTelomereLengthKb: 2.4,
    shelterinTrf2ExpressionRatio: 0.2,
    shelterinPot1ExpressionRatio: 0.2,
    hTertExpressionScore: 0.0,
  })

  assert.equal(crisisTelomeres.activeMaintenancePathway, 'CRITICAL_TELOMERE_UNCAPPED')
  assert.equal(crisisTelomeres.cellularReplicativeCapacity, 'SENESCENT_CRISIS_ARREST')
  assert.equal(crisisTelomeres.estimatedDoublingsRemaining, 0)
  assert.ok(crisisTelomeres.telomereDysfunctionInducedFociCount >= 5)
  assert.ok(crisisTelomeres.genomicInstabilityRisk.includes('ELEVATED'))
})

// ==========================================
// T-CLIN-93: Tumor Microenvironment Immune Checkpoint Engine
// ==========================================
test('T-CLIN-93: Tumor microenvironment PD-1/PD-L1 kinetics & checkpoint blockade', () => {
  // 1. Hot, inflamed tumor with high PD-L1 TPS treated with Pembrolizumab
  const pembroResponse = evaluateTumorImmuneCheckpointKinetics({
    tumorPdl1TumorProportionScorePercent: 75.0,
    cd8TumorInfiltratingLymphocyteDensityPerMm2: 650,
    tumorMutationalBurdenMutsPerMb: 14.0,
    therapeuticIntervention: 'ANTI_PD1_PEMBROLIZUMAB',
  })

  assert.equal(pembroResponse.immunophenotypeClass, 'IMMUNE_INFLAMED_HOT')
  assert.equal(pembroResponse.pdl1ExpressionTier, 'TPS_HIGH_GREATER_THAN_50')
  assert.ok(pembroResponse.shp2DephosphorylationInhibitionPercentage > 70)
  assert.ok(pembroResponse.cytotoxicReactivationIndex > 0.5)
  assert.ok(pembroResponse.predictedObjectiveResponseRatePercent > 40)
  assert.equal(pembroResponse.immuneRelatedAdverseEventRisk, 'MODERATE_ENDOCRINE_SKIN')
  assert.equal(pembroResponse.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. Cold desert tumor with vehicle control
  const coldDesert = evaluateTumorImmuneCheckpointKinetics({
    tumorPdl1TumorProportionScorePercent: 0.0,
    cd8TumorInfiltratingLymphocyteDensityPerMm2: 30,
    therapeuticIntervention: 'VEHICLE_CONTROL',
  })

  assert.equal(coldDesert.immunophenotypeClass, 'IMMUNE_DESERT_COLD')
  assert.equal(coldDesert.cytotoxicReactivationIndex, 0.0)
  assert.ok(coldDesert.predictedObjectiveResponseRatePercent < 5.0)
})

// ==========================================
// T-CLIN-94: ECM Remodeling & Mechanotransduction Engine
// ==========================================
test('T-CLIN-94: ECM collagen crosslinking by LOX, tissue stiffness & YAP/TAZ mechanosignaling', () => {
  // 1. Normal soft hepatic stroma
  const normalLiverEcm = evaluateEcmMechanotransduction({
    tissueType: 'HEPATIC_STROMA',
    lysylOxidaseLoxActivityRatio: 0.8,
    collagenTypeIDepositionRate: 0.6,
  })

  assert.equal(normalLiverEcm.fibroticStromaClassification, 'NORMAL_PHYSIOLOGIC_SOFT')
  assert.ok(normalLiverEcm.matrixStiffnessYoungsModulusKpa < 4.0)
  assert.ok(normalLiverEcm.yapTazNuclearLocalizationRatio < 1.0)
  assert.equal(normalLiverEcm.profibroticGeneInductionState, 'QUIESCENT')
  assert.equal(normalLiverEcm.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. Severe desmoplastic fibrosis with elevated LOX
  const desmoplasiaEcm = evaluateEcmMechanotransduction({
    tissueType: 'HEPATIC_STROMA',
    lysylOxidaseLoxActivityRatio: 2.8,
    collagenTypeIDepositionRate: 3.5,
  })

  assert.equal(desmoplasiaEcm.fibroticStromaClassification, 'SEVERE_DESMOPLASTIC_FIBROSIS')
  assert.ok(desmoplasiaEcm.matrixStiffnessYoungsModulusKpa > 12.0)
  assert.ok(desmoplasiaEcm.yapTazNuclearLocalizationRatio > 2.0)
  assert.equal(desmoplasiaEcm.profibroticGeneInductionState, 'DRIVEN_AUTO_AMPLIFYING')

  // 3. Pharmacologic LOX inhibition with BAPN
  const bapnInhibition = evaluateEcmMechanotransduction({
    tissueType: 'HEPATIC_STROMA',
    lysylOxidaseLoxActivityRatio: 2.8,
    collagenTypeIDepositionRate: 3.5,
    loxInhibitorBapnConcentrationUm: 20.0,
  })

  assert.ok(bapnInhibition.loxInhibitionPercentage > 70)
  assert.ok(bapnInhibition.matrixStiffnessYoungsModulusKpa < desmoplasiaEcm.matrixStiffnessYoungsModulusKpa)
})

// ==========================================
// T-CLIN-95: Clinical Antimicrobial Stewardship & Renal CDS Engine
// ==========================================
test('T-CLIN-95: Cockcroft-Gault creatinine clearance, pathogen coverage & nephrotoxicity CDS', () => {
  // 1. Moderate/severe renal impairment requiring Meropenem dose reduction
  const meropenemRenalEval = evaluateAntimicrobialStewardship(
    {
      patientId: 'PAT-ABX-001',
      ageYears: 72,
      isHemodialysisDependent: false,
      sex: 'MALE',
      weightKg: 68,
      serumCreatinineMgDl: 2.4, // CrCl ~ 28 mL/min
    },
    {
      orderId: 'ORD-ABX-501',
      antibioticName: 'MEROPENEM',
      requestedDoseMg: 1000,
      requestedDoseIntervalHours: 8,
      infectionSyndrome: 'INTRA_ABDOMINAL_SEPSIS',
      suspectedOrCulturedPathogen: 'ESBL_PRODUCING_ENTEROBACTERALES',
    }, '2026-10-27T10:00:00.000Z'
  )

  assert.equal(meropenemRenalEval.renalFunctionCategory, 'SEVERE_IMPAIRMENT')
  assert.ok(meropenemRenalEval.calculatedCreatinineClearanceMlMin < 35.0)
  assert.equal(meropenemRenalEval.coverageConcordance, 'OPTIMAL_TARGETED')
  assert.equal(meropenemRenalEval.dosingSafetyAlert, 'INTERVAL_EXTENSION_REQUIRED')
  assert.equal(meropenemRenalEval.recommendedDoseMg, 1000)
  assert.equal(meropenemRenalEval.recommendedIntervalHours, 12)
  assert.equal(meropenemRenalEval.requiresClinicianAcknowledgment, true)
  assert.equal(meropenemRenalEval.truthClass, 'clinical_decision_support_guideline_proxy')
  assert.equal(meropenemRenalEval.auditDigestSha256, null)
  assert.equal(meropenemRenalEval.auditIntegrity, 'NOT_ATTESTED')

  // 2. Vancomycin + Piperacillin-Tazobactam nephrotoxic synergy warning
  const vancZosynSynergy = evaluateAntimicrobialStewardship(
    {
      patientId: 'PAT-ABX-002',
      ageYears: 55,
      isHemodialysisDependent: false,
      sex: 'FEMALE',
      weightKg: 70,
      serumCreatinineMgDl: 1.0,
    },
    {
      orderId: 'ORD-ABX-502',
      antibioticName: 'VANCOMYCIN',
      requestedDoseMg: 1000,
      requestedDoseIntervalHours: 12,
      infectionSyndrome: 'HOSPITAL_ACQUIRED_PNEUMONIA',
      suspectedOrCulturedPathogen: 'METHICILLIN_RESISTANT_S_AUREUS_MRSA',
      concomitantNephrotoxins: ['PIPERACILLIN_TAZOBACTAM'],
    }, '2026-10-27T10:00:00.000Z'
  )

  assert.equal(vancZosynSynergy.dosingSafetyAlert, 'NEPHROTOXIC_SYNERGY_AVOID')
  assert.ok(vancZosynSynergy.nephrotoxicityWarningSummary?.includes('AKI'))
  assert.equal(vancZosynSynergy.therapeuticDrugMonitoringRequired, true)
  assert.equal(vancZosynSynergy.requiresClinicianAcknowledgment, true)

  // 3. Normal renal function with standard dosing
  const normalRenal = evaluateAntimicrobialStewardship(
    {
      patientId: 'PAT-ABX-003',
      ageYears: 35,
      isHemodialysisDependent: false,
      sex: 'MALE',
      weightKg: 75,
      serumCreatinineMgDl: 0.9,
    },
    {
      orderId: 'ORD-ABX-503',
      antibioticName: 'CIPROFLOXACIN',
      requestedDoseMg: 400,
      requestedDoseIntervalHours: 12,
      infectionSyndrome: 'COMPLICATED_URINARY_TRACT_INFECTION',
      suspectedOrCulturedPathogen: 'EMPIRIC_COVERAGE_NO_ISOLATE_YET',
    }, '2026-10-27T10:00:00.000Z'
  )

  assert.equal(normalRenal.renalFunctionCategory, 'NORMAL_FUNCTION')
  assert.equal(normalRenal.dosingSafetyAlert, 'SAFE_STANDARD_DOSING')
  assert.equal(normalRenal.requiresClinicianAcknowledgment, true, 'Unreviewed dosing proxies always require clinician acknowledgement')
})

const antimicrobialAt = '2026-10-27T10:00:00.000Z'
const renalPatient = {
  patientId: 'synthetic-renal-patient', ageYears: 35, sex: 'MALE', weightKg: 75, serumCreatinineMgDl: 0.9,
  isHemodialysisDependent: false,
}
const antimicrobialOrder = {
  orderId: 'synthetic-antimicrobial-order', antibioticName: 'CIPROFLOXACIN', requestedDoseMg: 400,
  requestedDoseIntervalHours: 12, infectionSyndrome: 'COMPLICATED_URINARY_TRACT_INFECTION',
  suspectedOrCulturedPathogen: 'EMPIRIC_COVERAGE_NO_ISOLATE_YET',
}

function rejectsAntimicrobial(patient, order, field, at = antimicrobialAt) {
  const before = structuredClone({ patient, order })
  assert.throws(() => evaluateAntimicrobialStewardship(patient, order, at), {
    name: 'TypeError', message: `Invalid antimicrobial CDS input: ${field}`,
  })
  assert.deepEqual({ patient, order }, before, 'rejection must not rewrite patient inputs or the prescription')
}

test('T-CLIN-95: malformed renal measurements cannot fall through to standard-safe dosing', () => {
  for (const field of ['ageYears', 'weightKg', 'serumCreatinineMgDl']) {
    for (const value of [undefined, null, '', '1', NaN, Infinity, -Infinity, 0, -1]) {
      rejectsAntimicrobial({ ...renalPatient, [field]: value }, antimicrobialOrder, field)
    }
  }
})

test('T-CLIN-95: unsupported input ranges are rejected instead of silently clamped', () => {
  for (const [field, value] of [['ageYears', 17.999], ['ageYears', 105.001],
    ['weightKg', 29.999], ['weightKg', 220.001], ['serumCreatinineMgDl', 0.299]]) {
    rejectsAntimicrobial({ ...renalPatient, [field]: value }, antimicrobialOrder, field)
  }
  // These are the existing implementation envelope, not validated clinical ranges.
  for (const [field, value] of [['ageYears', 18], ['ageYears', 105], ['weightKg', 30],
    ['weightKg', 220], ['serumCreatinineMgDl', 0.3]]) {
    const result = evaluateAntimicrobialStewardship({ ...renalPatient, [field]: value }, antimicrobialOrder, antimicrobialAt)
    const patient = { ...renalPatient, [field]: value }
    const expected = Number((((140 - patient.ageYears) * patient.weightKg) / (72 * patient.serumCreatinineMgDl)).toFixed(1))
    assert.equal(result.calculatedCreatinineClearanceMlMin, expected)
    assert.equal(result.clinically_reviewed, false)
  }
})

test('T-CLIN-95: missing sex is never guessed as male', () => {
  for (const sex of [undefined, null, 0, '', 'female', 'UNKNOWN']) {
    rejectsAntimicrobial({ ...renalPatient, sex }, antimicrobialOrder, 'sex')
  }
  // Cockcroft & Gault, Nephron 1976;16:31-41, DOI:10.1159/000180580.
  // CrCl=((140-ageYears)*weightKg)/(72*ScrMgDl), multiplied by 0.85 for FEMALE.
  assert.equal(evaluateAntimicrobialStewardship(renalPatient, antimicrobialOrder, antimicrobialAt).calculatedCreatinineClearanceMlMin, 121.5)
  assert.equal(evaluateAntimicrobialStewardship({ ...renalPatient, sex: 'FEMALE' }, antimicrobialOrder, antimicrobialAt).calculatedCreatinineClearanceMlMin, 103.3)
})

test('T-CLIN-95: absent patient/order objects or identities cannot produce recommendations', () => {
  for (const value of [undefined, null, [], 'invalid']) {
    rejectsAntimicrobial(value, antimicrobialOrder, 'patient')
    rejectsAntimicrobial(renalPatient, value, 'order')
  }
  for (const value of [undefined, null, 0, {}, '', ' ']) {
    rejectsAntimicrobial({ ...renalPatient, patientId: value }, antimicrobialOrder, 'patientId')
    rejectsAntimicrobial(renalPatient, { ...antimicrobialOrder, orderId: value }, 'orderId')
  }
})

test('T-CLIN-95: invalid or unimplemented antimicrobial regimens fail closed', () => {
  for (const antibioticName of [undefined, null, '', 'ciprofloxacin', 'UNKNOWN', 'COLISTIN', 'constructor']) {
    rejectsAntimicrobial(renalPatient, { ...antimicrobialOrder, antibioticName }, 'antibioticName')
  }
  for (const field of ['infectionSyndrome', 'suspectedOrCulturedPathogen']) {
    for (const value of [undefined, null, '', {}, 1, 'UNKNOWN']) {
      rejectsAntimicrobial(renalPatient, { ...antimicrobialOrder, [field]: value }, field)
    }
  }
})

test('T-CLIN-95: dialysis cannot inherit a non-dialysis dosing proxy', () => {
  for (const isHemodialysisDependent of [undefined, true, null, 'false', 0, 1]) {
    rejectsAntimicrobial({ ...renalPatient, isHemodialysisDependent }, antimicrobialOrder, 'isHemodialysisDependent')
  }
  assert.deepEqual(
    evaluateAntimicrobialStewardship({ ...renalPatient, isHemodialysisDependent: false }, antimicrobialOrder, antimicrobialAt),
    evaluateAntimicrobialStewardship(renalPatient, antimicrobialOrder, antimicrobialAt),
  )
})

test('T-CLIN-95: dose and interval must be finite positive numbers', () => {
  for (const field of ['requestedDoseMg', 'requestedDoseIntervalHours']) {
    for (const value of [undefined, null, '', '12', NaN, Infinity, -Infinity, 0, -1]) {
      rejectsAntimicrobial(renalPatient, { ...antimicrobialOrder, [field]: value }, field)
    }
  }
})

test('T-CLIN-95: malformed nephrotoxin lists cannot bypass interaction review', () => {
  for (const concomitantNephrotoxins of [null, 'PIPERACILLIN_TAZOBACTAM', {}, [undefined], [null], [0], [''], [' '], Array(1)]) {
    rejectsAntimicrobial(renalPatient, { ...antimicrobialOrder, concomitantNephrotoxins }, 'concomitantNephrotoxins')
  }
  assert.equal(evaluateAntimicrobialStewardship(renalPatient, { ...antimicrobialOrder, concomitantNephrotoxins: [] }, antimicrobialAt).requiresClinicianAcknowledgment, true)
})

test('T-CLIN-95: evaluation time is explicit, timezone-qualified and calendar-valid', () => {
  for (const at of [undefined, null, 0, '', 'invalid', '2026-10-27', '2026-10-27T10:00:00', '2026-02-30T10:00:00Z']) {
    assert.throws(() => evaluateAntimicrobialStewardship(renalPatient, antimicrobialOrder, at), {
      name: 'TypeError', message: 'Invalid antimicrobial CDS input: evaluationIsoTimestamp',
    })
  }
})

test('T-CLIN-95: every supported unreviewed regimen stays review-bound and deterministic', () => {
  for (const antibioticName of ['VANCOMYCIN', 'MEROPENEM', 'CEFEPIME', 'PIPERACILLIN_TAZOBACTAM', 'CIPROFLOXACIN']) {
    const patient = Object.freeze({ ...renalPatient })
    const order = Object.freeze({ ...antimicrobialOrder, antibioticName })
    const result = evaluateAntimicrobialStewardship(patient, order, antimicrobialAt)
    assert.equal(result.requiresClinicianAcknowledgment, true)
    assert.equal(result.clinically_reviewed, false)
    assert.equal(result.neverManufacturesBiomarkers, true)
    assert.equal(result.truthClass, 'clinical_decision_support_guideline_proxy')
    assert.equal(result.evaluatedAtIso, antimicrobialAt)
    assert.deepEqual(evaluateAntimicrobialStewardship(patient, order, antimicrobialAt), result)
    assert.deepEqual(patient, renalPatient)
    assert.deepEqual(order, { ...antimicrobialOrder, antibioticName })
  }
})


test('T-CLIN-95: a synchronous proxy never manufactures cryptographic attestation', () => {
  for (const antibioticName of ['VANCOMYCIN', 'MEROPENEM', 'CEFEPIME', 'PIPERACILLIN_TAZOBACTAM', 'CIPROFLOXACIN']) {
    const result = evaluateAntimicrobialStewardship(renalPatient, { ...antimicrobialOrder, antibioticName }, antimicrobialAt)
    assert.equal(result.auditDigestSha256, null, 'a 64-character fingerprint is not evidence of SHA-256')
    assert.equal(result.auditIntegrity, 'NOT_ATTESTED')
    const transported = JSON.parse(JSON.stringify(result))
    assert.equal(transported.auditDigestSha256, null)
    assert.equal(transported.auditIntegrity, 'NOT_ATTESTED')
    assert.equal(result.requiresClinicianAcknowledgment, true)
    assert.equal(result.clinically_reviewed, false)
  }
})
