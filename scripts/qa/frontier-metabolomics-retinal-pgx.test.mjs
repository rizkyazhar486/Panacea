// scripts/qa/frontier-metabolomics-retinal-pgx.test.mjs
// Verification suite for T-CLIN-86 through T-CLIN-90

import test from 'node:test'
import assert from 'node:assert/strict'

import {
  evaluateMetabolomicResilience,
} from '../../src/lib/discovery/metabolomicResilienceClockEngine.ts'

import {
  simulateRetinalRegeneration,
} from '../../src/lib/discovery/retinalPhotoreceptorRegenerationEngine.ts'

import {
  decodeNeuralSpectralDynamics,
} from '../../src/lib/discovery/neuralSpectralEntropyDecoder.ts'

import {
  simulateSenolyticSelectivity,
} from '../../src/lib/discovery/senolyticSelectivityScapEngine.ts'

import {
  evaluateCypPharmacogenomicSafety,
} from '../../src/domains/clinical-operations/model/cypPharmacogenomicSafety.ts'

// ==========================================
// T-CLIN-86: Metabolomic Resilience Clock Engine
// ==========================================
test('T-CLIN-86: Metabolomic resilience clock & biological age deviation', () => {
  // 1. Youthful, high-resilience metabolic profile
  const youthfulResilience = evaluateMetabolomicResilience({
    chronologicalAgeYears: 30,
    nad_nadh_redox_ratio: 8.5,
    glycolyticLactatePyruvateRatio: 11.0,
    bcaaMetaboliteAccumulation: 0.8,
    kynurenine_tryptophan_ratio: 0.03,
    ureaCycleClearanceEfficiency: 0.95,
  })

  assert.equal(youthfulResilience.longevityForecastCategory, 'OPTIMAL_METABOLIC_LONGEVITY')
  assert.ok(youthfulResilience.estimatedMetabolicAgeYears <= 30)
  assert.ok(youthfulResilience.metabolicAgeDeltaYears <= 0)
  assert.ok(youthfulResilience.metabolicResilienceScore > 75)
  assert.equal(youthfulResilience.metadata.truthClass, 'mechanistic_simulation_proxy')
  assert.equal(youthfulResilience.metadata.neverManufacturesBiomarkers, true)

  // 2. Compromised metabolic profile with inflammaging and mitochondrial redox decay
  const agedMetabolicProfile = evaluateMetabolomicResilience({
    chronologicalAgeYears: 55,
    nad_nadh_redox_ratio: 2.5,
    glycolyticLactatePyruvateRatio: 26.0,
    bcaaMetaboliteAccumulation: 2.2,
    kynurenine_tryptophan_ratio: 0.12,
    ureaCycleClearanceEfficiency: 0.60,
  })

  assert.equal(agedMetabolicProfile.longevityForecastCategory, 'ACCELERATED_METABOLIC_AGING')
  assert.ok(agedMetabolicProfile.estimatedMetabolicAgeYears > 55)
  assert.ok(agedMetabolicProfile.metabolicAgeDeltaYears > 5.0)
  assert.ok(agedMetabolicProfile.systemicInflammagingBurden > 0.5)
})

// ==========================================
// T-CLIN-87: Retinal Photoreceptor Regeneration Engine
// ==========================================
test('T-CLIN-87: Retinal organoid photoreceptor specification & ribbon synaptogenesis', () => {
  // 1. Early stage organoid (Day 35) - optic cup specification without mature opsins
  const earlyOrganoid = simulateRetinalRegeneration({
    differentiationDays: 35,
    crx_progenitor_level: 0.35,
    nrl_rod_driver_level: 0.1,
    targetLineage: 'ROD_PHOTORECEPTOR',
  })

  assert.equal(earlyOrganoid.organoidMaturityStage, 'EARLY_OPTIC_VESICLE')
  assert.ok(earlyOrganoid.markerExpression.rhodopsinRodSignal < 0.05)
  assert.equal(earlyOrganoid.synapticIntegrationReadiness.structuralIntegrationPassed, false)
  assert.equal(earlyOrganoid.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. Fully matured organoid (Day 185) with rod/cone specification and active ribbon synapses
  const matureOrganoid = simulateRetinalRegeneration({
    differentiationDays: 185,
    crx_progenitor_level: 0.92,
    nrl_rod_driver_level: 0.88,
    targetLineage: 'ROD_PHOTORECEPTOR',
    outerSegmentMaturationSupport: true,
  })

  assert.equal(matureOrganoid.organoidMaturityStage, 'FUNCTIONAL_SYNAPTIC_COMPETENCE')
  assert.ok(matureOrganoid.markerExpression.rhodopsinRodSignal > 0.7)
  assert.ok(matureOrganoid.synapticIntegrationReadiness.ribbonSynapseDensityPer100um2 > 15)
  assert.equal(matureOrganoid.synapticIntegrationReadiness.structuralIntegrationPassed, true)
  assert.equal(matureOrganoid.safetyClearance.teratomaRiskCleared, true)
})

// ==========================================
// T-CLIN-88: Neural Spectral Entropy Decoder
// ==========================================
test('T-CLIN-88: Neural spectral entropy & phase-amplitude coupling decoding', () => {
  // 1. Alert cognitive / active motor execution
  const activeDecoding = decodeNeuralSpectralDynamics({
    recordingModality: 'EPIDURAL_ELECTRODE_ARRAY',
    channelPowers: [
      {
        channelId: 'CH_01_M1',
        thetaBandPower_4_8Hz: 12.0,
        alphaBandPower_8_12Hz: 10.0,
        betaBandPower_13_30Hz: 15.0,
        highGammaBandPower_70_150Hz: 65.0,
      },
      {
        channelId: 'CH_02_SMA',
        thetaBandPower_4_8Hz: 14.0,
        alphaBandPower_8_12Hz: 8.0,
        betaBandPower_13_30Hz: 12.0,
        highGammaBandPower_70_150Hz: 70.0,
      },
    ],
  })

  assert.equal(activeDecoding.motorIntentionState, 'ACTIVE_MOTOR_EXECUTION')
  assert.ok(activeDecoding.meanSpectralEntropy > 0.6)
  assert.ok(activeDecoding.highGammaMeanPower > 50.0)
  assert.equal(activeDecoding.neuroethicalSafety.physicalActuationEnabled, false)
  assert.equal(activeDecoding.neuroethicalSafety.rawPotentialRedacted, true)
  assert.equal(activeDecoding.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. Quiescent baseline
  const quiescentDecoding = decodeNeuralSpectralDynamics({
    recordingModality: 'SURFACE_EEG',
    channelPowers: [
      {
        channelId: 'CH_01_OCCIPITAL',
        thetaBandPower_4_8Hz: 5.0,
        alphaBandPower_8_12Hz: 45.0,
        betaBandPower_13_30Hz: 10.0,
        highGammaBandPower_70_150Hz: 4.0,
      },
    ],
  })

  assert.equal(quiescentDecoding.motorIntentionState, 'QUIESCENT_BASELINE')
  assert.ok(quiescentDecoding.highGammaMeanPower < 10.0)
})

// ==========================================
// T-CLIN-89: Senolytic Selectivity SCAP Engine
// ==========================================
test('T-CLIN-89: Senolytic target selectivity, SASP suppression & safety gating', () => {
  // 1. Navitoclax (ABT-263): High BCL-2/BCL-xL selectivity with thrombocytopenia risk warning
  const navitoclaxResult = simulateSenolyticSelectivity({
    drugClass: 'NAVITOCLAX_ABT263_BCL_XL',
    doseConcentrationMicromolar: 2.5,
    tissueMicroenvironment: 'FIBROBLAST',
    baselineSenescentCellFraction: 0.18,
    bclXlPlateletDependencyScore: 0.90,
  })

  assert.ok(navitoclaxResult.senescentCellClearancePercentage > 65)
  assert.ok(navitoclaxResult.saspAttenuationPercentage > 50)
  assert.equal(navitoclaxResult.onTargetToxicityRisks.thrombocytopeniaRiskCategory, 'HIGH_DOSE_LIMITING')
  assert.equal(navitoclaxResult.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. Dasatinib + Quercetin: Multi-target SCAP inhibition with favorable selective window
  const dqResult = simulateSenolyticSelectivity({
    drugClass: 'DASATINIB_QUERCETIN_COMBO',
    doseConcentrationMicromolar: 2.0,
    tissueMicroenvironment: 'PREADIPOCYTE',
    baselineSenescentCellFraction: 0.15,
  })

  assert.ok(dqResult.senescentCellClearancePercentage > 50)
  assert.ok(dqResult.healthyBystanderSurvivalPercentage > 85)
  assert.equal(dqResult.onTargetToxicityRisks.thrombocytopeniaRiskCategory, 'LOW')
  assert.equal(dqResult.therapeuticWindowAssessment, 'FAVORABLE_SELECTIVE_WINDOW')
})

// ==========================================
// T-CLIN-90: CYP Pharmacogenomic Safety CDS Engine
// ==========================================
test('T-CLIN-90: Cytochrome P450 drug-gene safety evaluation (CPIC aligned)', () => {
  // 1. Clopidogrel with CYP2C19 Poor Metabolizer: Contraindicated prodrug activation defect
  const clopidogrelPm = evaluateCypPharmacogenomicSafety(
    {
      patientId: 'PAT-PGX-001',
      gene: 'CYP2C19',
      diplotype: '*2/*2',
      phenotype: 'POOR_METABOLIZER',
      testMethod: 'NGS_TARGETED',
      laboratoryAccreditation: 'CAP_CLIA_CERTIFIED',
      reportedAtIso: '2026-10-27T10:00:00Z',
    },
    {
      orderId: 'ORD-MED-101',
      medicationName: 'Clopidogrel',
      dailyDoseMg: 75,
      intendedIndication: 'POST_PCI_STENT_THROMBOSIS_PREVENTION',
      isProdrug: true,
      primaryClearanceGene: 'CYP2C19',
    }
  )

  assert.equal(clopidogrelPm.severity, 'CONTRAINDICATED')
  assert.equal(clopidogrelPm.mechanism, 'PRODRUG_ACTIVATION_DEFICIT')
  assert.ok(clopidogrelPm.suggestedAlternatives.includes('TICAGRELOR'))
  assert.equal(clopidogrelPm.requiresClinicianOverride, true)
  assert.equal(clopidogrelPm.truthClass, 'clinical_pharmacogenomics_guideline_proxy')
  assert.equal(clopidogrelPm.neverManufacturesGenotypes, true)
  assert.equal(clopidogrelPm.auditDigestSha256.length, 64)

  // 2. Codeine with CYP2D6 Ultra-rapid Metabolizer: Fatal overdose risk
  const codeineUm = evaluateCypPharmacogenomicSafety(
    {
      patientId: 'PAT-PGX-002',
      gene: 'CYP2D6',
      diplotype: '*1/*1xN',
      phenotype: 'ULTRA_RAPID_METABOLIZER',
      testMethod: 'TAQMAN_ALLELIC_DISCRIMINATION',
      laboratoryAccreditation: 'CAP_CLIA_CERTIFIED',
      reportedAtIso: '2026-10-27T10:00:00Z',
    },
    {
      orderId: 'ORD-MED-102',
      medicationName: 'Codeine Sulfate',
      dailyDoseMg: 30,
      intendedIndication: 'POST_OPERATIVE_ANALGESIA',
      isProdrug: true,
      primaryClearanceGene: 'CYP2D6',
    }
  )

  assert.equal(codeineUm.severity, 'CONTRAINDICATED')
  assert.equal(codeineUm.mechanism, 'ULTRA_RAPID_OVERCONVERSION')
  assert.equal(codeineUm.requiresClinicianOverride, true)

  // 3. Warfarin with CYP2C9 Poor Metabolizer: Major dose reduction required
  const warfarinPm = evaluateCypPharmacogenomicSafety(
    {
      patientId: 'PAT-PGX-003',
      gene: 'CYP2C9',
      diplotype: '*3/*3',
      phenotype: 'POOR_METABOLIZER',
      testMethod: 'NGS_TARGETED',
      laboratoryAccreditation: 'CAP_CLIA_CERTIFIED',
      reportedAtIso: '2026-10-27T10:00:00Z',
    },
    {
      orderId: 'ORD-MED-103',
      medicationName: 'Warfarin Sodium',
      dailyDoseMg: 5,
      intendedIndication: 'ATRIAL_FIBRILLATION_STROKE_PROPHYLAXIS',
      isProdrug: false,
      primaryClearanceGene: 'CYP2C9',
    }
  )

  assert.equal(warfarinPm.severity, 'HIGH_RISK_ACTION_REQUIRED')
  assert.equal(warfarinPm.mechanism, 'ACTIVE_DRUG_ACCUMULATION_TOXICITY')
  assert.equal(warfarinPm.doseAdjustmentPercentage, -60)
  assert.equal(warfarinPm.requiresClinicianOverride, true)

  // 4. Normal metabolizer: Standard dosing
  const normalMetabolizer = evaluateCypPharmacogenomicSafety(
    {
      patientId: 'PAT-PGX-004',
      gene: 'CYP2C19',
      diplotype: '*1/*1',
      phenotype: 'NORMAL_METABOLIZER',
      testMethod: 'NGS_TARGETED',
      laboratoryAccreditation: 'CAP_CLIA_CERTIFIED',
      reportedAtIso: '2026-10-27T10:00:00Z',
    },
    {
      orderId: 'ORD-MED-104',
      medicationName: 'Clopidogrel',
      dailyDoseMg: 75,
      intendedIndication: 'SECONDARY_STROKE_PREVENTION',
      isProdrug: true,
      primaryClearanceGene: 'CYP2C19',
    }
  )

  assert.equal(normalMetabolizer.severity, 'STANDARD_DOSING')
  assert.equal(normalMetabolizer.mechanism, 'NORMAL_CLEARANCE')
  assert.equal(normalMetabolizer.requiresClinicianOverride, false)
})
