// scripts/qa/frontier-nhej-opa1-afib.test.mjs
// Verification suite for T-CLIN-111 through T-CLIN-115

import test from 'node:test'
import assert from 'node:assert/strict'

import {
  evaluateNhejSynapsisDynamics,
} from '../../src/lib/discovery/nhejKuDnaPkcsSynapsisEngine.ts'

import {
  evaluateMitochondrialCristaeDynamics,
} from '../../src/lib/discovery/mitochondrialCristaeOpa1Engine.ts'

import {
  evaluateOneCarbonMethylationDynamics,
} from '../../src/lib/discovery/oneCarbonSamMethylationEngine.ts'

import {
  evaluateAxonalTransportDynamics,
} from '../../src/lib/discovery/retrogradeAxonalTransportDyneinEngine.ts'

import {
  evaluateAnticoagulationAfibSafety,
} from '../../src/domains/clinical-operations/model/anticoagulationAfibRiskCds.ts'

// ==========================================
// T-CLIN-111: Non-Homologous End Joining (NHEJ) Ku70/80 - DNA-PKcs Synapsis Engine
// ==========================================
test('T-CLIN-111: Ku ring capping, DNA-PKcs Ser2056 phosphorylation & Peposertib radiosensitization', () => {
  // 1. Efficient blunt-end repair in G0/G1 phase
  const g1Proficient = evaluateNhejSynapsisDynamics({
    initialDoubleStrandBreaksPerNucleus: 40,
    ku70Ku80HeterodimerAbundanceRatio: 1.0,
    dnaPkcsKinaseActivityRatio: 1.0,
    artemisEndonucleasePresent: true,
    xlfXrcc4LigaseIvAbundanceRatio: 1.0,
    cellCyclePhase: 'G0_G1_PHASE',
  })

  assert.equal(g1Proficient.initialDsbCount, 40)
  assert.ok(g1Proficient.kuRingEndCappingEfficiencyPct >= 90.0)
  assert.ok(g1Proficient.dnaPkcsSer2056AutophosphorylationIndex > 0.8)
  assert.ok(g1Proficient.synapticComplexStabilityScore > 0.8)
  assert.ok(g1Proficient.residualUnrepairedDsbsAt24Hr < 8.0)
  assert.equal(g1Proficient.nhejFidelityClassification, 'HIGH_FIDELITY_BLUNT_LIGATION')
  assert.equal(g1Proficient.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. DNA-PK inhibitor Peposertib (M3814) radiosensitization
  const peposertibTreated = evaluateNhejSynapsisDynamics({
    initialDoubleStrandBreaksPerNucleus: 40,
    ku70Ku80HeterodimerAbundanceRatio: 1.0,
    dnaPkInhibitorConcentrationNm: 250.0, // 10x IC50
    cellCyclePhase: 'G0_G1_PHASE',
  })

  assert.ok(peposertibTreated.dnaPkcsSer2056AutophosphorylationIndex < 0.2)
  assert.ok(peposertibTreated.residualUnrepairedDsbsAt24Hr > g1Proficient.residualUnrepairedDsbsAt24Hr)
  assert.ok(peposertibTreated.radiosensitizationEnhancementRatio > 2.0)
  assert.equal(peposertibTreated.nhejFidelityClassification, 'ABERRANT_TRANSLOCATION_HAZARD')
})

// ==========================================
// T-CLIN-112: Mitochondrial Cristae Morphodynamics & OPA1 Oligomerization Engine
// ==========================================
test('T-CLIN-112: Cristae junction diameter, L-OPA1/S-OPA1 balance & Cytochrome c sequestration', () => {
  // 1. Tightly sequestered homeostatic cristae
  const homeostaticCristae = evaluateMitochondrialCristaeDynamics({
    longOpa1AbundanceRatio: 0.50,
    shortOpa1AbundanceRatio: 0.50,
    innerMembranePotentialMv: -160,
  })

  assert.ok(homeostaticCristae.longToShortOpa1Ratio >= 0.8)
  assert.ok(homeostaticCristae.cristaeJunctionDiameterNm <= 13.0)
  assert.equal(homeostaticCristae.cristaeJunctionTightnessClassification, 'TIGHTLY_SEQUESTERED_HOMEOSTASIS')
  assert.ok(homeostaticCristae.cytochromeCSequestrationPercentage >= 80.0)
  assert.ok(homeostaticCristae.caspaseApoptosomeActivationProbability < 0.25)
  assert.equal(homeostaticCristae.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. Pro-apoptotic BH3 activation (tBid) widening junctions and releasing Cytochrome c
  const apoptoticCristae = evaluateMitochondrialCristaeDynamics({
    longOpa1AbundanceRatio: 0.50,
    shortOpa1AbundanceRatio: 0.50,
    innerMembranePotentialMv: -80, // depolarized
    proApoptoticBidBimActiveConcentrationNm: 60.0,
    cardiolipinPeroxidationPercentage: 45.0,
  })

  assert.ok(apoptoticCristae.longToShortOpa1Ratio < 0.3)
  assert.ok(apoptoticCristae.cristaeJunctionDiameterNm > 22.0)
  assert.equal(apoptoticCristae.cristaeJunctionTightnessClassification, 'COLLAPSED_WIDE_JUNCTION_HERNIATION')
  assert.ok(apoptoticCristae.cytochromeCSequestrationPercentage < 45.0)
  assert.ok(apoptoticCristae.caspaseApoptosomeActivationProbability > 0.6)
})

// ==========================================
// T-CLIN-113: S-Adenosylmethionine (SAM) Methyl Donor Flux & Epigenetic Drift Engine
// ==========================================
test('T-CLIN-113: One-carbon SAM/SAH methylation ratio, MTHFR TT genotype & hyperhomocysteinemia', () => {
  // 1. Optimal methylation capacity in wild-type folate-replete individual
  const optimalMethylation = evaluateOneCarbonMethylationDynamics({
    serumFolateNmolL: 28.0,
    serumVitaminB12PmolL: 550.0,
    mthfrGenotype: 'CC_WILD_TYPE',
  })

  assert.ok(optimalMethylation.samToSahMethylationRatio >= 4.0)
  assert.equal(optimalMethylation.transmethylationPotentialStatus, 'ROBUST_TRANSCRIPTIONAL_SILENCING')
  assert.ok(optimalMethylation.totalHomocysteineEstimateUmolL < 14.0)
  assert.equal(optimalMethylation.hyperhomocysteinemiaRiskTier, 'NORMAL_CARDIOVASCULAR')
  assert.equal(optimalMethylation.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. Severe hypomethylation and vascular risk with homozygous MTHFR TT + folate deficiency
  const deficientMethylation = evaluateOneCarbonMethylationDynamics({
    serumFolateNmolL: 4.5,
    serumVitaminB12PmolL: 140.0,
    mthfrGenotype: 'TT_HOMOZYGOUS_REDUCED_ACTIVITY',
  })

  assert.ok(deficientMethylation.samToSahMethylationRatio < 2.5)
  assert.equal(deficientMethylation.transmethylationPotentialStatus, 'SEVERE_GLOBAL_HYPOMETHYLATION')
  assert.ok(deficientMethylation.totalHomocysteineEstimateUmolL >= 15.0)
  assert.ok(deficientMethylation.epigeneticDriftAccelerationRatePct > 15.0)
  assert.ok(deficientMethylation.recommendedTargetedNutritionalCofactors.length >= 2)
})

// ==========================================
// T-CLIN-114: Retrograde Axonal Transport & Dynein-Dynactin Cargo Motors Engine
// ==========================================
test('T-CLIN-114: Retrograde dynein velocity, transit times in long motor axons & NfL leakage proxy', () => {
  // 1. Healthy cranial nerve motor neuron (short axon, unimpaired motors)
  const shortAxon = evaluateAxonalTransportDynamics({
    axonLengthMeters: 0.08,
    cytoplasmicDyneinProcessivityRatio: 1.0,
    dynactinP150GluedAbundanceRatio: 1.0,
    mitochondrialAtpSupplyInAxonRatio: 1.0,
  })

  assert.ok(shortAxon.retrogradeVelocityMicronsPerSec >= 1.2)
  assert.ok(shortAxon.estimatedEndosomeTransitTimeHours < 25.0)
  assert.ok(shortAxon.axonalSpheroidStallRiskScore < 0.25)
  assert.equal(shortAxon.distalAxonopathyVulnerabilityTier, 'LOW_RESILIENT_AXON')
  assert.equal(shortAxon.circulatingNeurofilamentLightChainProxyTier, 'NORMAL_PHYSIOLOGICAL_TURNOVER')
  assert.equal(shortAxon.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. 1-meter lumbar motor axon with impaired dynein and tau hyperphosphorylation
  const impairedLongAxon = evaluateAxonalTransportDynamics({
    axonLengthMeters: 1.0,
    cytoplasmicDyneinProcessivityRatio: 0.25,
    dynactinP150GluedAbundanceRatio: 0.40,
    microtubuleTauHyperphosphorylationIndex: 0.75,
    mitochondrialAtpSupplyInAxonRatio: 0.50,
  })

  assert.ok(impairedLongAxon.retrogradeVelocityMicronsPerSec < 0.6)
  assert.ok(impairedLongAxon.estimatedEndosomeTransitTimeHours > 500.0)
  assert.ok(impairedLongAxon.axonalSpheroidStallRiskScore > 0.6)
  assert.equal(impairedLongAxon.distalAxonopathyVulnerabilityTier, 'CRITICAL_MOTOR_NEURONOPATHY')
  assert.equal(impairedLongAxon.circulatingNeurofilamentLightChainProxyTier, 'SEVERE_ACTIVE_DEGENERATION')
})

// ==========================================
// T-CLIN-115: Clinical Anticoagulation HAS-BLED vs CHA2DS2-VASc CDS Engine
// ==========================================
test('T-CLIN-115: CHA2DS2-VASc stroke risk, HAS-BLED score, Apixaban ABC dose reduction & mechanical valve contraindication', () => {
  // 1. Non-valvular AF patient with standard DOAC indication
  const standardAfib = evaluateAnticoagulationAfibSafety({
    patientId: 'PT-AF-001',
    ageYears: 72,
    biologicalSex: 'MALE',
    bodyWeightKg: 78,
    serumCreatinineMgDl: 1.1,
    hasCongestiveHeartFailure: true,
    hasHypertension: true,
    hasDiabetesMellitus: false,
    hasPriorStrokeTiaThromboembolism: false,
    hasVascularDisease: true,
    hasAbnormalRenalFunction: false,
    hasAbnormalLiverFunction: false,
    hasPriorMajorBleed: false,
    concomitantAntiplateletOrNsaidUse: false,
    alcoholAbuseHistory: false,
    hasMechanicalProstheticHeartValve: false,
    hasModerateToSevereMitralStenosis: false,
  })

  assert.equal(standardAfib.cha2ds2VascScore, 4) // CHF (1) + HTN (1) + Age 65-74 (1) + Vasc (1) = 4
  assert.equal(standardAfib.anticoagulationRecommendation.indicationStatus, 'STRONGLY_RECOMMENDED_CLASS_I')
  assert.equal(standardAfib.anticoagulationRecommendation.preferredAnticoagulantAgent, 'DIRECT_ORAL_ANTICOAGULANT_DOAC')
  assert.equal(standardAfib.anticoagulationRecommendation.recommendedDoacDosingGuidance.standardDose, '5 mg twice daily')
  assert.equal(standardAfib.truthClass, 'clinical_decision_support_guideline_proxy')
  assert.equal(standardAfib.auditDigestSha256.length, 64)

  // 2. Geriatric AF patient meeting Apixaban ABC dose-reduction criteria (Age >= 80, Weight <= 60 kg)
  const doseReducedPatient = evaluateAnticoagulationAfibSafety({
    patientId: 'PT-AF-002',
    ageYears: 83,
    biologicalSex: 'FEMALE',
    bodyWeightKg: 52,
    serumCreatinineMgDl: 1.2,
    hasCongestiveHeartFailure: false,
    hasHypertension: true,
    hasDiabetesMellitus: true,
    hasPriorStrokeTiaThromboembolism: false,
    hasVascularDisease: false,
    hasAbnormalRenalFunction: false,
    hasAbnormalLiverFunction: false,
    hasPriorMajorBleed: false,
    concomitantAntiplateletOrNsaidUse: false,
    alcoholAbuseHistory: false,
    hasMechanicalProstheticHeartValve: false,
    hasModerateToSevereMitralStenosis: false,
  })

  assert.equal(doseReducedPatient.anticoagulationRecommendation.indicationStatus, 'STRONGLY_RECOMMENDED_CLASS_I')
  assert.equal(doseReducedPatient.anticoagulationRecommendation.recommendedDoacDosingGuidance.standardDose, '2.5 mg twice daily')
  assert.ok(doseReducedPatient.anticoagulationRecommendation.recommendedDoacDosingGuidance.adjustedDoseReasoning?.includes('2 of 3 criteria'))

  // 3. Mechanical valve patient: DOAC strictly contraindicated, Warfarin mandatory
  const mechanicalValvePatient = evaluateAnticoagulationAfibSafety({
    patientId: 'PT-AF-003',
    ageYears: 62,
    biologicalSex: 'MALE',
    bodyWeightKg: 75,
    serumCreatinineMgDl: 0.9,
    hasCongestiveHeartFailure: false,
    hasHypertension: false,
    hasDiabetesMellitus: false,
    hasPriorStrokeTiaThromboembolism: false,
    hasVascularDisease: false,
    hasAbnormalRenalFunction: false,
    hasAbnormalLiverFunction: false,
    hasPriorMajorBleed: false,
    concomitantAntiplateletOrNsaidUse: false,
    alcoholAbuseHistory: false,
    hasMechanicalProstheticHeartValve: true,
    hasModerateToSevereMitralStenosis: false,
  })

  assert.equal(mechanicalValvePatient.anticoagulationRecommendation.indicationStatus, 'STRONGLY_RECOMMENDED_CLASS_I')
  assert.equal(mechanicalValvePatient.anticoagulationRecommendation.preferredAnticoagulantAgent, 'VITAMIN_K_ANTAGONIST_WARFARIN_ONLY')
  assert.ok(mechanicalValvePatient.clinicalSafetyBoundaryAlerts.some((a) => a.includes('DOACs are STRICTLY CONTRAINDICATED')))
  assert.equal(mechanicalValvePatient.requiresUrgentCardiologyReview, true)
})
