// scripts/qa/frontier-condensate-horvath-century.test.mjs
// Verification suite for T-CLIN-96 through T-CLIN-100 (CENTURY MILESTONE)

import test from 'node:test'
import assert from 'node:assert/strict'

import {
  evaluateBiomolecularCondensateDynamics,
} from '../../src/lib/discovery/biomolecularCondensateLlpsEngine.ts'

import {
  evaluateRibosomalFrameshiftingDynamics,
} from '../../src/lib/discovery/ribosomalFrameshiftingTranslationEngine.ts'

import {
  evaluateEpigeneticAgingClocks,
} from '../../src/lib/discovery/epigeneticHorvathGrimAgeClockEngine.ts'

import {
  evaluateOrganoidVascularization,
} from '../../src/lib/discovery/organoidVascularizationPerfusionEngine.ts'

import {
  verifyOneOsCenturyMilestone,
} from '../../src/domains/clinical-operations/model/oneOsCenturyMilestoneVerification.ts'

// ==========================================
// T-CLIN-96: Biomolecular Condensate Phase Separation (LLPS) Engine
// ==========================================
test('T-CLIN-96: Condensate phase separation, C_sat threshold & 1,6-hexanediol sensitivity', () => {
  // 1. Dynamic reversible liquid condensate above C_sat
  const liquidCondensate = evaluateBiomolecularCondensateDynamics({
    scaffoldProtein: 'FUS_RNA_BINDING',
    proteinConcentrationMicromolar: 12.0, // well above C_sat ~ 3.5 uM
    atpHydrotropeConcentrationMm: 5.0,
    hexanediolDisruptionAssayApplied: true,
  })

  assert.equal(liquidCondensate.phaseSeparationState, 'DYNAMIC_LIQUID_CONDENSATE')
  assert.ok(liquidCondensate.densePhaseFractionPercentage > 50)
  assert.equal(liquidCondensate.hexanediolSensitivityResult, 'FULLY_DISSOLVED')
  assert.equal(liquidCondensate.neurodegenerativeRiskAssessment, 'PHYSIOLOGIC_REVERSIBLE')
  assert.equal(liquidCondensate.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. Pathological mutant with depleted ATP transitioning to solid aggregate
  const solidAggregate = evaluateBiomolecularCondensateDynamics({
    scaffoldProtein: 'TDP43_HNRNP',
    proteinConcentrationMicromolar: 8.0,
    atpHydrotropeConcentrationMm: 0.8, // ATP depletion impairs hydrotropic dispersal
    hasPathologicalPrionDomainMutation: true,
    hexanediolDisruptionAssayApplied: true,
  })

  assert.equal(solidAggregate.phaseSeparationState, 'SOLID_AMYLOID_AGGREGATE')
  assert.equal(solidAggregate.hexanediolSensitivityResult, 'RESISTANT_GEL_AGGREGATE')
  assert.equal(solidAggregate.neurodegenerativeRiskAssessment, 'PATHOLOGICAL_INCLUSION_COMMITTED')
})

// ==========================================
// T-CLIN-97: Ribosomal Frameshifting & ISR Translation Engine
// ==========================================
test('T-CLIN-97: Programmed -1 ribosomal frameshifting & stress uORF bypass translation', () => {
  // 1. Canonical -1 PRF with valid UUUAAAC slippery motif and H-type pseudoknot
  const prfKinetics = evaluateRibosomalFrameshiftingDynamics({
    slipperySequenceMotif: 'UUUAAAC',
    spacerLengthNt: 7,
    downstreamStructureType: 'H_TYPE_PSEUDOKNOT',
    pseudoknotStabilityDeltaGKcalMol: -24.0,
  })

  assert.equal(prfKinetics.slipperySiteConcordance, true)
  assert.ok(prfKinetics.frameshiftingEfficiencyPercentage > 20.0)
  assert.ok(prfKinetics.ribosomalDwellTimeMs > 200.0)
  assert.ok(prfKinetics.readingFrameBranching.frameMinusOneShiftedRatio > 0.2)
  assert.equal(prfKinetics.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. Integrated Stress Response with high eIF2a phosphorylation and ATF4 bypass
  const isrStress = evaluateRibosomalFrameshiftingDynamics({
    slipperySequenceMotif: 'ACGUACG', // invalid slippery site
    spacerLengthNt: 4,
    downstreamStructureType: 'UNSTRUCTURED_SINGLE_STRAND',
    eif2AlphaPhosphorylationRatio: 0.75,
    upstreamUorfCount: 2,
  })

  assert.equal(isrStress.slipperySiteConcordance, false)
  assert.equal(isrStress.frameshiftingEfficiencyPercentage, 0.0)
  assert.ok(isrStress.integratedStressResponseState.atf4TranslationalInductionFold > 2.5)
  assert.equal(isrStress.biologicalFunctionContext, 'ISR_SURVIVAL_TRANSLATION')
})

// ==========================================
// T-CLIN-98: Epigenetic Horvath & GrimAge Clock Engine
// ==========================================
test('T-CLIN-98: Epigenetic DNA methylation age acceleration & mortality hazard ratio', () => {
  // 1. Slow, protective pace of aging
  const youngProfile = evaluateEpigeneticAgingClocks({
    chronologicalAgeYears: 45,
    horvathCpGMethylationMeanBeta: 0.41,
    surrogateBiomarkers: {
      dnamGdf15PgMl: 420,
      dnamPai1NgMl: 14,
      dnamCystatinCMgL: 0.70,
      dnamSmokingPackYearsSurrogate: 0,
    },
  })

  assert.equal(youngProfile.epigeneticPaceOfAgingCategory, 'SLOW_PROTECTIVE_AGING')
  assert.ok(youngProfile.grimAgeAccelerationYears < 0)
  assert.ok(youngProfile.predictedAllCauseMortalityHazardRatio < 1.0)
  assert.equal(youngProfile.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. Accelerated epigenetic aging with elevated GDF-15, PAI-1 and smoking history
  const agedProfile = evaluateEpigeneticAgingClocks({
    chronologicalAgeYears: 52,
    horvathCpGMethylationMeanBeta: 0.52,
    surrogateBiomarkers: {
      dnamGdf15PgMl: 1450,
      dnamPai1NgMl: 48,
      dnamCystatinCMgL: 1.45,
      dnamSmokingPackYearsSurrogate: 25,
    },
  })

  assert.equal(agedProfile.epigeneticPaceOfAgingCategory, 'ACCELERATED_EPIGENETIC_AGING')
  assert.ok(agedProfile.grimAgeAccelerationYears > 5.0)
  assert.ok(agedProfile.predictedAllCauseMortalityHazardRatio > 1.4)
})

// ==========================================
// T-CLIN-99: Organoid Vascularization & Perfusion Engine
// ==========================================
test('T-CLIN-99: Organoid microvascular sprouting, shear stress & necrotic core prevention', () => {
  // 1. Functional microfluidic perfusion of large organoid (700 um)
  const perfusedOrganoid = evaluateOrganoidVascularization({
    organoidDiameterMicrons: 700,
    vegfAGradientPicomolar: 220,
    endothelialSeedingDensityPerMm3: 3500,
    microfluidicFlowVelocityMicronsPerSec: 650,
    pericyteCoCulturePresent: true,
  })

  assert.equal(perfusedOrganoid.hypoxicCoreStatus, 'AVOIDED_FULL_PERFUSION')
  assert.equal(perfusedOrganoid.necroticCoreRadiusMicrons, 0)
  assert.ok(perfusedOrganoid.tipCellSproutingDensityPerMm > 15)
  assert.ok(perfusedOrganoid.wallShearStressDynePerCm2 >= 5.0 && perfusedOrganoid.wallShearStressDynePerCm2 <= 20.0)
  assert.ok(perfusedOrganoid.endothelialJunctionMaturityScore > 0.8)
  assert.equal(perfusedOrganoid.perfusionViabilityPercentage, 100.0)
  assert.equal(perfusedOrganoid.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. Static unperfused organoid with deep hypoxic necrotic core
  const unperfusedOrganoid = evaluateOrganoidVascularization({
    organoidDiameterMicrons: 900,
    vegfAGradientPicomolar: 50,
    endothelialSeedingDensityPerMm3: 400,
    microfluidicFlowVelocityMicronsPerSec: 0,
    pericyteCoCulturePresent: false,
  })

  assert.equal(unperfusedOrganoid.hypoxicCoreStatus, 'SEVERE_NECROTIC_CORE_DEVELOPED')
  assert.ok(unperfusedOrganoid.necroticCoreRadiusMicrons > 200)
  assert.ok(unperfusedOrganoid.perfusionViabilityPercentage < 85)
})

// ==========================================
// T-CLIN-100: CENTURY MILESTONE: One OS Verification Gateway
// ==========================================
test('T-CLIN-100: CENTURY MILESTONE: One OS multiscale synthesis & clinician signature enforcement', () => {
  // 1. Comprehensive, signed clinical encounter with full multiscale integration
  const verifiedCentury = verifyOneOsCenturyMilestone({
    patientId: 'PAT-CENTURY-001',
    encounterId: 'ENC-2026-100',
    chronologicalAgeYears: 64,
    primaryDiagnosisIcd10: 'I25.10',
    activeMolecularAndMetabolicSimulations: {
      hasDnaRepairEvaluation: true,
      hasEpigeneticClockEvaluation: true,
      hasMetabolomicResilienceEvaluation: true,
      hasMitochondrialQualityEvaluation: true,
      hasTelomereMaintenanceEvaluation: true,
    },
    activeClinicalCdsEvaluations: {
      hasPharmacogenomicSafetyChecked: true,
      hasAntimicrobialRenalDosed: true,
      hasClosedLoopAlertRoutingActive: true,
      hasReferralReconciliationActive: true,
    },
    clinicianAttendingId: 'DR-CARDIOLOGY-77',
    clinicianDigitalSignaturePresent: true,
  })

  assert.equal(verifiedCentury.centuryMilestoneVersion, 'T-CLIN-100-OMEGA-V1')
  assert.equal(verifiedCentury.multiscaleIntegrationCompletenessScore, 100.0)
  assert.equal(verifiedCentury.longitudinalCareContinuityVerdict, 'VERIFIED_COHERENT_ONE_OS')
  assert.equal(verifiedCentury.clinicalSafetyInvariantsEnforced.zeroManufacturedBiomarkersVerified, true)
  assert.equal(verifiedCentury.clinicalSafetyInvariantsEnforced.mandatoryHumanClinicianSignOffEnforced, true)
  assert.equal(verifiedCentury.centuryVerificationAuditSealSha256.length, 64)

  // 2. Complete data but unsigned: Provisional pending clinician sign-off
  const provisionalCentury = verifyOneOsCenturyMilestone({
    patientId: 'PAT-CENTURY-002',
    encounterId: 'ENC-2026-101',
    chronologicalAgeYears: 50,
    primaryDiagnosisIcd10: 'E11.9',
    activeMolecularAndMetabolicSimulations: {
      hasDnaRepairEvaluation: true,
      hasEpigeneticClockEvaluation: true,
      hasMetabolomicResilienceEvaluation: true,
      hasMitochondrialQualityEvaluation: true,
      hasTelomereMaintenanceEvaluation: true,
    },
    activeClinicalCdsEvaluations: {
      hasPharmacogenomicSafetyChecked: true,
      hasAntimicrobialRenalDosed: true,
      hasClosedLoopAlertRoutingActive: true,
      hasReferralReconciliationActive: true,
    },
    clinicianAttendingId: 'DR-ENDOCRINOLOGY-12',
    clinicianDigitalSignaturePresent: false,
  })

  assert.equal(provisionalCentury.longitudinalCareContinuityVerdict, 'PROVISIONAL_PENDING_CLINICAL_SIGNATURE')
  assert.equal(provisionalCentury.clinicalSafetyInvariantsEnforced.mandatoryHumanClinicianSignOffEnforced, false)
})
