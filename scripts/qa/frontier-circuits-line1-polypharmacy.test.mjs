// scripts/qa/frontier-circuits-line1-polypharmacy.test.mjs
// Verification suite for T-CLIN-101 through T-CLIN-105

import test from 'node:test'
import assert from 'node:assert/strict'

import {
  evaluateGeneticToggleSwitch,
} from '../../src/lib/discovery/syntheticGeneCircuitToggleEngine.ts'

import {
  evaluateLine1RetrotranspositionDynamics,
} from '../../src/lib/discovery/retrotransposonLine1ActivationEngine.ts'

import {
  evaluateCircadianMolecularDynamics,
} from '../../src/lib/discovery/circadianFeedbackOscillatorEngine.ts'

import {
  evaluateFerroptoticPeroxidationDynamics,
} from '../../src/lib/discovery/ferroptosisLipidPeroxidationEngine.ts'

import {
  evaluateAnticholinergicSedativeBurden,
} from '../../src/domains/clinical-operations/model/anticholinergicSedativeBurdenCds.ts'

// ==========================================
// T-CLIN-101: Synthetic Gene Circuit Toggle Switch Engine
// ==========================================
test('T-CLIN-101: Bistable genetic toggle switch dynamics & suicide kill switch', () => {
  // 1. Initial State 1: High Repressor 1 (LacI), Low Repressor 2 (TetR)
  const state1 = evaluateGeneticToggleSwitch({
    initialRepressor1ConcentrationU: 10.0,
    initialRepressor2ConcentrationV: 0.5,
  })

  assert.equal(state1.circuitState, 'STATE_1_HIGH_REPRESSOR_1')
  assert.ok(state1.steadyStateRepressor1U > 8.0)
  assert.ok(state1.steadyStateRepressor2V < 1.5)
  assert.equal(state1.cellularSafetyAssessment, 'STABLE_THERAPEUTIC_STATE')
  assert.equal(state1.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. IPTG induction flips circuit to State 2 with coupled suicide kill switch
  const flippedKillSwitch = evaluateGeneticToggleSwitch({
    initialRepressor1ConcentrationU: 10.0,
    initialRepressor2ConcentrationV: 0.5,
    iptgInducerConcentrationUm: 200.0, // saturating IPTG inactivates LacI
    suicideSwitchCoupled: true,
  })

  assert.equal(flippedKillSwitch.circuitState, 'STATE_2_HIGH_REPRESSOR_2')
  assert.equal(flippedKillSwitch.switchingSuccessAchieved, true)
  assert.equal(flippedKillSwitch.suicideKillSwitchArmed, true)
  assert.equal(flippedKillSwitch.cellularSafetyAssessment, 'INDUCIBLE_CLEARANCE_TRIGGERED')
})

// ==========================================
// T-CLIN-102: Retrotransposon LINE-1 Activation Engine
// ==========================================
test('T-CLIN-102: Epigenetic LINE-1 derepression, TPRT somatic mosaicism & NRTI suppression', () => {
  // 1. Silenced youthful chromatin
  const youthfulL1 = evaluateLine1RetrotranspositionDynamics({
    cellTypeContext: 'POST_MITOTIC_CORTICAL_NEURON',
    l1Promoter5UtrCpGMethylationFraction: 0.92,
  })

  assert.equal(youthfulL1.somaticInsertionMosaicismRiskTier, 'NEGLIGIBLE_EPIGENETICALLY_SILENCED')
  assert.ok(youthfulL1.l1TranscriptionDerepressionFold < 1.5)
  assert.equal(youthfulL1.remedialNeuroprotectionStatus, 'BASAL_HOMEOSTASIS')
  assert.equal(youthfulL1.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. Senescent/aged neuronal derepression with high cytoplasmic cDNA and cGAS-STING induction
  const agedL1 = evaluateLine1RetrotranspositionDynamics({
    cellTypeContext: 'POST_MITOTIC_CORTICAL_NEURON',
    l1Promoter5UtrCpGMethylationFraction: 0.22,
    cellularSenescenceDurationDays: 45,
  })

  assert.equal(agedL1.somaticInsertionMosaicismRiskTier, 'HIGH_GENOMIC_RETROINSERTION_STORM')
  assert.ok(agedL1.l1TranscriptionDerepressionFold > 5.0)
  assert.ok(agedL1.cgasStingInterferonBetaInductionFold > 8.0)
  assert.equal(agedL1.remedialNeuroprotectionStatus, 'PATHOLOGICAL_INFLAMMAGING_ACTIVE')

  // 3. Pharmacologic suppression with Lamivudine (3TC)
  const treatedL1 = evaluateLine1RetrotranspositionDynamics({
    cellTypeContext: 'POST_MITOTIC_CORTICAL_NEURON',
    l1Promoter5UtrCpGMethylationFraction: 0.22,
    cellularSenescenceDurationDays: 45,
    reverseTranscriptaseInhibitorLamivudineUm: 15.0,
  })

  assert.ok(treatedL1.lamivudineOrf2pInhibitionPercentage > 80.0)
  assert.ok(treatedL1.targetPrimedReverseTranscriptionRate < agedL1.targetPrimedReverseTranscriptionRate)
  assert.equal(treatedL1.remedialNeuroprotectionStatus, 'PARTIALLY_SUPPRESSED_BY_NRTI')
})

// ==========================================
// T-CLIN-103: Circadian Molecular Clock TTFL Engine
// ==========================================
test('T-CLIN-103: Circadian core oscillator dynamics & statin chronopharmacology', () => {
  // 1. Dawn (ZT 0) vs Dusk (ZT 12) molecular phase shift
  const dawnClock = evaluateCircadianMolecularDynamics({
    zeitgeberTimeHours: 1.0,
  })
  const duskClock = evaluateCircadianMolecularDynamics({
    zeitgeberTimeHours: 13.0,
  })

  assert.equal(dawnClock.circadianCyclePhase, 'ZT00_06_EARLY_DAY_WAKEFUL')
  assert.equal(duskClock.circadianCyclePhase, 'ZT12_18_EARLY_NIGHT_RECOVERY')
  assert.ok(dawnClock.molecularAbundances.bmal1ClockHeterodimerActivity > duskClock.molecularAbundances.bmal1ClockHeterodimerActivity)
  assert.ok(duskClock.molecularAbundances.perCryRepressorComplexAbundance > dawnClock.molecularAbundances.perCryRepressorComplexAbundance)
  assert.equal(dawnClock.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. Chronopharmacology: Statin evening administration vs morning administration
  const eveningStatin = evaluateCircadianMolecularDynamics({
    zeitgeberTimeHours: 13.0,
    intendedMedicationAdministrationZtHours: 13.0,
    pharmacologicTargetClass: 'HMG_COA_REDUCTASE_STATIN',
  })
  const morningStatin = evaluateCircadianMolecularDynamics({
    zeitgeberTimeHours: 1.0,
    intendedMedicationAdministrationZtHours: 1.0,
    pharmacologicTargetClass: 'HMG_COA_REDUCTASE_STATIN',
  })

  assert.ok(eveningStatin.chronopharmacologyGuidance.circadianEfficacyMultiplier > 1.4)
  assert.ok(morningStatin.chronopharmacologyGuidance.circadianEfficacyMultiplier < 1.0)
})

// ==========================================
// T-CLIN-104: Ferroptosis Lipid Peroxidation Engine
// ==========================================
test('T-CLIN-104: Iron-dependent lipid peroxidation, GPX4 vs FSP1 parallel defense & Fer-1 rescue', () => {
  // 1. Homeostatic protection
  const homeostatic = evaluateFerroptoticPeroxidationDynamics({
    cellularLabileIronPoolMicromolar: 1.2,
    glutathioneGshLevelMm: 5.0,
    gpx4EnzymeActivityRatio: 1.0,
    fsp1CoQ10AxisActivityRatio: 0.9,
  })

  assert.equal(homeostatic.ferroptoticDeathCommitment, 'PROTECTED_HOMEOSTASIS')
  assert.ok(homeostatic.lipidHydroperoxideAccumulationPmolPerMg < 20.0)
  assert.equal(homeostatic.membranePoreFormationRuptureRisk, 'LOW')
  assert.equal(homeostatic.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. Lethal ferroptosis: High iron + GPX4 depletion
  const lethalFerroptosis = evaluateFerroptoticPeroxidationDynamics({
    cellularLabileIronPoolMicromolar: 6.5,
    pufaPhospholipidBurdenIndex: 2.0,
    glutathioneGshLevelMm: 0.4,
    gpx4EnzymeActivityRatio: 0.05,
    fsp1CoQ10AxisActivityRatio: 0.1,
  })

  assert.equal(lethalFerroptosis.ferroptoticDeathCommitment, 'COMMITTED_MEMBRANE_RUPTURE')
  assert.ok(lethalFerroptosis.lipidHydroperoxideAccumulationPmolPerMg > 55.0)
  assert.equal(lethalFerroptosis.membranePoreFormationRuptureRisk, 'CRITICAL_OSMOTIC_LYSIS')
  assert.equal(lethalFerroptosis.ferrostatinRescuePotential, true)

  // 3. Ferrostatin-1 rescue
  const fer1Rescued = evaluateFerroptoticPeroxidationDynamics({
    cellularLabileIronPoolMicromolar: 6.5,
    pufaPhospholipidBurdenIndex: 2.0,
    glutathioneGshLevelMm: 0.4,
    gpx4EnzymeActivityRatio: 0.05,
    fsp1CoQ10AxisActivityRatio: 0.1,
    ferroptosisInhibitorFerrostatin1ConcentrationUm: 2.0,
  })

  assert.ok(fer1Rescued.lipidHydroperoxideAccumulationPmolPerMg < lethalFerroptosis.lipidHydroperoxideAccumulationPmolPerMg)
})

// ==========================================
// T-CLIN-105: Anticholinergic & Sedative Burden CDS Engine
// ==========================================
test('T-CLIN-105: Anticholinergic cognitive burden (ACB), sedative DBI & deprescribing CDS', () => {
  // 1. High risk polypharmacy regimen in older adult
  const highRiskRegimen = evaluateAnticholinergicSedativeBurden({
    patientId: 'PAT-GER-001',
    ageYears: 78,
    hasBaselineMildCognitiveImpairment: true,
    hasHistoryOfFalls: true,
    activeMedications: [
      {
        medicationName: 'Oxybutynin Chloride',
        dailyDoseMg: 10,
        minimumEffectiveDoseMg: 5,
        isSedative: false,
        anticholinergicScore: 3,
        therapeuticClass: 'UROLOGIC_ANTIMUSCARINIC',
      },
      {
        medicationName: 'Amitriptyline Hydrochloride',
        dailyDoseMg: 25,
        minimumEffectiveDoseMg: 10,
        isSedative: true,
        anticholinergicScore: 3,
        therapeuticClass: 'TRICYCLIC_ANTIDEPRESSANT',
      },
      {
        medicationName: 'Diphenhydramine',
        dailyDoseMg: 50,
        minimumEffectiveDoseMg: 25,
        isSedative: true,
        anticholinergicScore: 3,
        therapeuticClass: 'SEDATING_ANTIHISTAMINE',
      },
    ],
  })

  assert.equal(highRiskRegimen.totalAnticholinergicCognitiveBurdenScore, 9)
  assert.ok(highRiskRegimen.cumulativeDrugBurdenIndexDbi > 1.5)
  assert.equal(highRiskRegimen.cognitiveHazardRiskTier, 'HIGH_DELIRIUM_COGNITIVE_HAZARD')
  assert.ok(highRiskRegimen.deliriumRiskRelativeHazardRatio > 2.0)
  assert.ok(highRiskRegimen.fallsRiskRelativeHazardRatio > 2.0)
  assert.equal(highRiskRegimen.requiresGeriatricPharmacistReview, true)
  assert.equal(highRiskRegimen.highRiskDeprescribingCandidates.length, 3)
  assert.ok(highRiskRegimen.highRiskDeprescribingCandidates[0].suggestedAlternativeNonAnticholinergic.includes('MIRABEGRON'))
  assert.equal(highRiskRegimen.truthClass, 'clinical_decision_support_guideline_proxy')
  assert.equal(highRiskRegimen.auditDigestSha256.length, 64)

  // 2. Low risk regimen
  const lowRiskRegimen = evaluateAnticholinergicSedativeBurden({
    patientId: 'PAT-GER-002',
    ageYears: 70,
    activeMedications: [
      {
        medicationName: 'Metformin',
        dailyDoseMg: 1000,
        minimumEffectiveDoseMg: 500,
        isSedative: false,
        anticholinergicScore: 0,
        therapeuticClass: 'BIGUANIDE',
      },
      {
        medicationName: 'Lisinopril',
        dailyDoseMg: 10,
        minimumEffectiveDoseMg: 5,
        isSedative: false,
        anticholinergicScore: 0,
        therapeuticClass: 'ACE_INHIBITOR',
      },
    ],
  })

  assert.equal(lowRiskRegimen.totalAnticholinergicCognitiveBurdenScore, 0)
  assert.equal(lowRiskRegimen.cognitiveHazardRiskTier, 'LOW_SAFE')
  assert.equal(lowRiskRegimen.requiresGeriatricPharmacistReview, false)
})
