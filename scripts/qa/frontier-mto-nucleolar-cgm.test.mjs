// scripts/qa/frontier-mto-nucleolar-cgm.test.mjs
// Verification suite for T-CLIN-106 through T-CLIN-110

import test from 'node:test'
import assert from 'node:assert/strict'

import {
  evaluateMtDnaHeteroplasmyDynamics,
} from '../../src/lib/discovery/mitochondrialDnaHeteroplasmyEngine.ts'

import {
  evaluateNucleolarStressDynamics,
} from '../../src/lib/discovery/ribosomeBiogenesisNucleolarStressEngine.ts'

import {
  evaluateClonalHematopoiesisDynamics,
} from '../../src/lib/discovery/clonalHematopoiesisChipEngine.ts'

import {
  evaluateGapJunctionSyncytiumCoupling,
} from '../../src/lib/discovery/intercellularGapJunctionCx43Engine.ts'

import {
  evaluateCgmGlycemicSafety,
} from '../../src/domains/clinical-operations/model/glycemicHypoglycemiaCgmCds.ts'

// ==========================================
// T-CLIN-106: Mitochondrial DNA Heteroplasmy & D-Loop Replication Error Kinetics Engine
// ==========================================
test('T-CLIN-106: Mitochondrial DNA heteroplasmy, tissue-specific threshold & OXPHOS failure', () => {
  // 1. Asymptomatic carrier below tissue bioenergetic threshold
  const subthreshold = evaluateMtDnaHeteroplasmyDynamics({
    mutationCategory: 'POINT_MUTATION_MT_TL1_M3243AG_MELAS',
    mutantHeteroplasmyPercentage: 20.0,
    tissueBioenergeticDemand: 'HIGH_NEUROMUSCULAR_CARDIAC',
    mtDnaCopyNumberPerCell: 3000,
  })

  assert.equal(subthreshold.pathologicalThresholdBreached, false)
  assert.equal(subthreshold.biochemicalOxphosThresholdPercentage, 60.0)
  assert.ok(subthreshold.cellularAtpGenerationCapacityPercentage > 70.0)
  assert.equal(subthreshold.lacticAcidosisRiskTier, 'NORMAL_BASAL')
  assert.equal(subthreshold.clinicalPhenotypeManifestationForecast, 'ASYMPTOMATIC_CARRIER')
  assert.equal(subthreshold.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. High heteroplasmy breaching high-demand neuromuscular threshold
  const symptomaticMelas = evaluateMtDnaHeteroplasmyDynamics({
    mutationCategory: 'POINT_MUTATION_MT_TL1_M3243AG_MELAS',
    mutantHeteroplasmyPercentage: 75.0,
    tissueBioenergeticDemand: 'HIGH_NEUROMUSCULAR_CARDIAC',
    mtDnaCopyNumberPerCell: 1200,
  })

  assert.equal(symptomaticMelas.pathologicalThresholdBreached, true)
  assert.ok(symptomaticMelas.cellularAtpGenerationCapacityPercentage < 50.0)
  assert.equal(symptomaticMelas.lacticAcidosisRiskTier, 'ELEVATED_POST_EXERTION')
  assert.equal(symptomaticMelas.clinicalPhenotypeManifestationForecast, 'OVERT_MITOCHONDRIAL_ENCEPHALOMYOPATHY')
  assert.equal(symptomaticMelas.mitochondrialBiogenesisCompensatoryActivation, true)
})

// ==========================================
// T-CLIN-107: Ribosome Biogenesis & Nucleolar Stress Response Engine
// ==========================================
test('T-CLIN-107: Pol I transcription inhibition, 5S RNP release, MDM2 binding & p53 stabilization', () => {
  // 1. Homeostatic ribogenesis in non-stressed wild-type cell
  const homeostatic = evaluateNucleolarStressDynamics({
    rnaPolymeraseIActivityRatio: 1.0,
    pre47sRnaSynthesisRateFraction: 1.0,
    p53Status: 'WILD_TYPE_FUNCTIONAL',
  })

  assert.equal(homeostatic.nucleolarFunctionalState, 'HOMEOSTATIC_BIOGENESIS')
  assert.equal(homeostatic.cellCycleOutcome, 'NORMAL_G1_S_PROGRESSION')
  assert.ok(homeostatic.p53StabilizationFoldChange < 2.0)
  assert.equal(homeostatic.targetedPolIInhibitorTherapeuticWindow, 'POTENT_ONCOLYTIC_RESPONSE')
  assert.equal(homeostatic.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. Acute nucleolar disruption (Pol I inhibitor CX-5461)
  const acuteStress = evaluateNucleolarStressDynamics({
    rnaPolymeraseIActivityRatio: 0.15,
    pre47sRnaSynthesisRateFraction: 0.10,
    p53Status: 'WILD_TYPE_FUNCTIONAL',
  })

  assert.equal(acuteStress.nucleolarFunctionalState, 'ACUTE_NUCLEOLAR_DISRUPTION')
  assert.ok(acuteStress.rpl5Rpl11Mdm2BindingIntensity > 0.6)
  assert.ok(acuteStress.p53StabilizationFoldChange > 4.0)
  assert.ok(acuteStress.cellCycleOutcome === 'P21_MEDIATED_CYTOSTATIC_ARREST' || acuteStress.cellCycleOutcome === 'PUMA_BAX_APOPTOTIC_COMMITMENT')
  assert.equal(acuteStress.targetedPolIInhibitorTherapeuticWindow, 'POTENT_ONCOLYTIC_RESPONSE')

  // 3. Mutated p53 cancer evasion under Pol I inhibition
  const p53Mutant = evaluateNucleolarStressDynamics({
    rnaPolymeraseIActivityRatio: 0.15,
    pre47sRnaSynthesisRateFraction: 0.10,
    p53Status: 'P53_MUTANT_INACTIVATED',
  })

  assert.equal(p53Mutant.cellCycleOutcome, 'UNCOUPLED_P53_INDEPENDENT_PROLIFERATION')
  assert.equal(p53Mutant.targetedPolIInhibitorTherapeuticWindow, 'DRUG_RESISTANT')
})

// ==========================================
// T-CLIN-108: Clonal Hematopoiesis of Indeterminate Potential (CHIP) Engine
// ==========================================
test('T-CLIN-108: Somatic CHIP driver clonal expansion, macrophage NLRP3 inflammasome & CVD hazard', () => {
  // 1. Sub-diagnostic small clone (<2% VAF)
  const subdiagnostic = evaluateClonalHematopoiesisDynamics({
    driverGene: 'DNMT3A_R882',
    variantAlleleFrequencyPercentage: 1.2,
    patientAgeYears: 55,
  })

  assert.equal(subdiagnostic.chipDiagnosticStatus, 'SUB_DIAGNOSTIC_CLONE_BELOW_2_PERCENT')
  assert.ok(subdiagnostic.coronaryHeartDiseaseHazardRatio < 1.3)
  assert.equal(subdiagnostic.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. High-risk TET2 clone with systemic inflammation
  const highRiskTet2 = evaluateClonalHematopoiesisDynamics({
    driverGene: 'TET2_LOSS_OF_FUNCTION',
    variantAlleleFrequencyPercentage: 14.5,
    patientAgeYears: 72,
    circulatingHighSensitivityCrpMgL: 4.8,
  })

  assert.equal(highRiskTet2.chipDiagnosticStatus, 'CONFIRMED_CHIP_CLONAL_EXPANSION')
  assert.ok(highRiskTet2.macrophageNlrp3PrimingIndex > 0.7)
  assert.ok(highRiskTet2.interleukin1BetaSecretionFold > 2.5)
  assert.ok(highRiskTet2.coronaryHeartDiseaseHazardRatio >= 1.8)
  assert.equal(highRiskTet2.targetedInflammationSuppressionBenefit, false)

  // 3. Benefit with NLRP3 inflammasome inhibitor
  const treatedTet2 = evaluateClonalHematopoiesisDynamics({
    driverGene: 'TET2_LOSS_OF_FUNCTION',
    variantAlleleFrequencyPercentage: 14.5,
    patientAgeYears: 72,
    circulatingHighSensitivityCrpMgL: 4.8,
    nlrp3InflammasomeInhibitorPresent: true,
  })

  assert.ok(treatedTet2.coronaryHeartDiseaseHazardRatio < highRiskTet2.coronaryHeartDiseaseHazardRatio)
  assert.ok(treatedTet2.macrophageNlrp3PrimingIndex < highRiskTet2.macrophageNlrp3PrimingIndex)
  assert.equal(treatedTet2.targetedInflammationSuppressionBenefit, true)
})

// ==========================================
// T-CLIN-109: Intercellular Gap Junction Connexin-43 Electrical Coupling Engine
// ==========================================
test('T-CLIN-109: Connexin-43 gap junction conductance, acidosis uncoupling & Danegaptide rescue', () => {
  // 1. Healthy ventricular syncytium
  const healthySyncytium = evaluateGapJunctionSyncytiumCoupling({
    cx43TotalExpressionRatio: 1.0,
    cx43PhosphorylationSer368Ratio: 0.85,
    intercalatedDiscPolarLocalizationFraction: 0.90,
    intracellularPh: 7.25,
  })

  assert.ok(healthySyncytium.junctionalConductanceNanoSiemens > 300.0)
  assert.ok(healthySyncytium.longitudinalConductionVelocityMetersPerSec >= 0.60)
  assert.ok(healthySyncytium.anisotropyRatio < 3.5)
  assert.equal(healthySyncytium.reentrantArrhythmiaVulnerabilityTier, 'LOW_HOMOGENEOUS_CONDUCTION')
  assert.equal(healthySyncytium.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. Ischemic uncoupling (acidosis, dephosphorylation, lateralization)
  const ischemicUncoupled = evaluateGapJunctionSyncytiumCoupling({
    cx43TotalExpressionRatio: 0.50,
    cx43PhosphorylationSer368Ratio: 0.20,
    intercalatedDiscPolarLocalizationFraction: 0.40,
    intracellularPh: 6.45,
  })

  assert.ok(ischemicUncoupled.junctionalConductanceNanoSiemens < 50.0)
  assert.ok(ischemicUncoupled.longitudinalConductionVelocityMetersPerSec < 0.35)
  assert.ok(ischemicUncoupled.anisotropyRatio > 4.0)
  assert.equal(ischemicUncoupled.reentrantArrhythmiaVulnerabilityTier, 'CRITICAL_REENTRANT_SUBSTRATE')

  // 3. Gap junction stabilizer peptide (Danegaptide) rescue
  const rescuedSyncytium = evaluateGapJunctionSyncytiumCoupling({
    cx43TotalExpressionRatio: 0.50,
    cx43PhosphorylationSer368Ratio: 0.20,
    intercalatedDiscPolarLocalizationFraction: 0.40,
    intracellularPh: 6.45,
    gapJunctionStabilizerDanegaptideConcentrationNm: 150.0,
  })

  assert.ok(rescuedSyncytium.junctionalConductanceNanoSiemens > ischemicUncoupled.junctionalConductanceNanoSiemens)
  assert.ok(rescuedSyncytium.danegaptideStabilizationEffectPct > 30.0)
})

// ==========================================
// T-CLIN-110: Clinical CGM Glycemic Hypoglycemia Unawareness & Safety CDS Engine
// ==========================================
test('T-CLIN-110: 14-day CGM consensus targets, Clarke score & basal insulin titration CDS', () => {
  // 1. Patient meeting International Consensus targets (TIR > 70%, TBR < 4%)
  const wellControlled = evaluateCgmGlycemicSafety({
    patientId: 'PT-DM1-001',
    diabetesType: 'TYPE_1_DIABETES',
    timeInRange70To180Percentage: 78.5,
    timeBelowRange54To69Percentage: 2.1,
    timeBelowRangeLessThan54Percentage: 0.4,
    timeAboveRange181To250Percentage: 16.0,
    timeAboveRangeGreaterThan250Percentage: 3.0,
    meanGlucoseMgDl: 142,
    glycemicVariabilityCoefficientOfVariationPct: 31.5,
    clarkeHypoglycemiaUnawarenessScore: 1,
    activeBasalInsulinUnitsPerDay: 24,
  })

  assert.equal(wellControlled.clinicalConsensusTirTargetMet, true)
  assert.equal(wellControlled.hypoglycemiaSafetySafetyTargetMet, true)
  assert.equal(wellControlled.glycemicStabilityStatus, 'STABLE_OPTIMAL_CONTROL')
  assert.equal(wellControlled.impairedAwarenessRiskClassification, 'NORMAL_AUTONOMIC_AWARENESS')
  assert.equal(wellControlled.basalInsulinTitrationRecommendation.action, 'MAINTAIN_CURRENT_BASAL')
  assert.equal(wellControlled.microvascularComplicationRiskProjection, 'LOW_PROGRESSION_RISK')
  assert.equal(wellControlled.requiresUrgentEndocrinologyFollowup, false)
  assert.equal(wellControlled.truthClass, 'clinical_decision_support_guideline_proxy')
  assert.equal(wellControlled.auditDigestSha256.length, 64)

  // 2. High-hazard hypoglycemia unawareness requiring immediate basal reduction
  const severeHypoHazard = evaluateCgmGlycemicSafety({
    patientId: 'PT-DM1-002',
    diabetesType: 'TYPE_1_DIABETES',
    timeInRange70To180Percentage: 54.0,
    timeBelowRange54To69Percentage: 7.2, // > 4% target
    timeBelowRangeLessThan54Percentage: 2.8, // > 1% target
    timeAboveRange181To250Percentage: 25.0,
    timeAboveRangeGreaterThan250Percentage: 11.0,
    meanGlucoseMgDl: 125,
    glycemicVariabilityCoefficientOfVariationPct: 44.2, // > 36%
    clarkeHypoglycemiaUnawarenessScore: 5, // impaired awareness (>=4)
    activeBasalInsulinUnitsPerDay: 30,
  })

  assert.equal(severeHypoHazard.clinicalConsensusTirTargetMet, false)
  assert.equal(severeHypoHazard.hypoglycemiaSafetySafetyTargetMet, false)
  assert.equal(severeHypoHazard.glycemicStabilityStatus, 'CRITICAL_HYPOGLYCEMIA_HAZARD')
  assert.equal(severeHypoHazard.impairedAwarenessRiskClassification, 'IMPAIRED_HYPOGLYCEMIA_UNAWARENESS')
  assert.equal(severeHypoHazard.basalInsulinTitrationRecommendation.action, 'REDUCE_BASAL_DOSE_BY_10_TO_20_PERCENT')
  assert.ok(severeHypoHazard.basalInsulinTitrationRecommendation.titrationUnitsAdjustment < 0)
  assert.equal(severeHypoHazard.requiresUrgentEndocrinologyFollowup, true)
})
