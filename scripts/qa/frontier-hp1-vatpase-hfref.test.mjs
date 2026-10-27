// scripts/qa/frontier-hp1-vatpase-hfref.test.mjs
// Verification suite for T-CLIN-116 through T-CLIN-120

import test from 'node:test'
import assert from 'node:assert/strict'

import {
  evaluateHeterochromatinCondensationDynamics,
} from '../../src/lib/discovery/heterochromatinHp1PhaseSeparationEngine.ts'

import {
  evaluateLysosomalVAtpaseDynamics,
} from '../../src/lib/discovery/lysosomalVAtpaseNutrientSensingEngine.ts'

import {
  evaluateCtDnaMrdDynamics,
} from '../../src/lib/discovery/ctDnaLiquidBiopsyMrdEngine.ts'

import {
  evaluatePodocyteGlomerularDynamics,
} from '../../src/lib/discovery/podocyteSlitDiaphragmPermeabilityEngine.ts'

import {
  evaluateHeartFailureGdmtOptimization,
} from '../../src/domains/clinical-operations/model/heartFailureGdmtQuadrupleCds.ts'

// ==========================================
// T-CLIN-116: Heterochromatin HP1-H3K9me3 Phase Separation Engine
// ==========================================
test('T-CLIN-116: HP1alpha phase separation, satellite repeat silencing & progerin-driven erosion', () => {
  // 1. Youthful, robustly condensed constitutive heterochromatin
  const youthfulHeterochromatin = evaluateHeterochromatinCondensationDynamics({
    h3k9me3HistoneMarkDensityRatio: 1.0,
    hp1AlphaCbx5AbundanceRatio: 1.0,
    suv39h1MethyltransferaseActivityRatio: 1.0,
  })

  assert.ok(youthfulHeterochromatin.hp1PhaseSeparationPropensityScore >= 0.8)
  assert.equal(youthfulHeterochromatin.pericentromericSilencingClassification, 'ROBUST_CONSTITUTIVE_SILENCING')
  assert.ok(youthfulHeterochromatin.satelliteRepeatDerepressionFold <= 1.20)
  assert.ok(youthfulHeterochromatin.cgasStingInflammatoryAxisPrimingIndex < 0.25)
  assert.equal(youthfulHeterochromatin.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. Progerin accumulation and age-eroded heterochromatin
  const progerinEroded = evaluateHeterochromatinCondensationDynamics({
    h3k9me3HistoneMarkDensityRatio: 0.30,
    hp1AlphaCbx5AbundanceRatio: 0.25,
    nuclearProgerinAccumulationIndex: 0.85,
    suv39h1MethyltransferaseActivityRatio: 0.30,
  })

  assert.ok(progerinEroded.hp1PhaseSeparationPropensityScore < 0.25)
  assert.equal(progerinEroded.pericentromericSilencingClassification, 'COLLAPSED_HETEROCHROMATIN_ANARCHY')
  assert.ok(progerinEroded.satelliteRepeatDerepressionFold > 10.0)
  assert.ok(progerinEroded.cgasStingInflammatoryAxisPrimingIndex > 0.8)
})

// ==========================================
// T-CLIN-117: Lysosomal Vacuolar H+-ATPase (v-ATPase) & Nutrient Sensing Engine
// ==========================================
test('T-CLIN-117: v-ATPase luminal acidification, Cathepsin efficiency & Bafilomycin A1 collapse', () => {
  // 1. Fully acidified nutrient-replete lysosome
  const homeostaticLysosome = evaluateLysosomalVAtpaseDynamics({
    vAtpasePumpActivityRatio: 1.0,
    luminalAminoAcidAbundance: 'NORMAL_PHYSIOLOGICAL',
  })

  assert.ok(homeostaticLysosome.steadyStateLysosomalLuminalPh <= 5.0)
  assert.ok(homeostaticLysosome.acidHydrolaseEnzymaticEfficiencyPercentage >= 85.0)
  assert.ok(homeostaticLysosome.mTorc1LysosomalTranslocationScore >= 0.45)
  assert.equal(homeostaticLysosome.lysosomalStoragePathologyVulnerability, 'HEALTHY_PROTEOLYTIC_CLEARANCE')
  assert.equal(homeostaticLysosome.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. Bafilomycin A1 v-ATPase inhibition collapsing pH gradient
  const bafilomycinTreated = evaluateLysosomalVAtpaseDynamics({
    vAtpasePumpActivityRatio: 1.0,
    luminalAminoAcidAbundance: 'NORMAL_PHYSIOLOGICAL',
    bafilomycinInhibitorConcentrationNm: 25.0, // 10x IC50
  })

  assert.ok(bafilomycinTreated.steadyStateLysosomalLuminalPh > 6.0)
  assert.ok(bafilomycinTreated.acidHydrolaseEnzymaticEfficiencyPercentage < 25.0)
  assert.equal(bafilomycinTreated.tfebNuclearTranslocationStatus, 'TFEB_DEPHOSPHORYLATED_NUCLEAR_AUTOPHAGY_DRIVE')
  assert.equal(bafilomycinTreated.lysosomalStoragePathologyVulnerability, 'CRITICAL_LYSOSOMAL_STORAGE_HAZARD')
})

// ==========================================
// T-CLIN-118: Circulating Tumor DNA (ctDNA) Liquid Biopsy MRD Detection Engine
// ==========================================
test('T-CLIN-118: Landmark post-op ctDNA MRD detection, PBMC CHIP filtering & recurrence lead time', () => {
  // 1. Undetectable ctDNA post-resection (curative clearance)
  const mrdNegative = evaluateCtDnaMrdDynamics({
    patientPrimaryTumorTissueAvailable: true,
    totalCellFreeDnaConcentrationNgPerMl: 12,
    detectedMutantAlleleFrequencyPercentage: 0.0,
    sequencingDepthX: 40000,
    matchedPbmcSequencingPerformed: true,
    knownDriverGenesTrackedCount: 8,
    postOperativeBloodDrawWeek: 4,
  })

  assert.equal(mrdNegative.ctDnaDetectionStatus, 'MRD_NEGATIVE_UNDETECTABLE')
  assert.equal(mrdNegative.estimatedTumorFractionPartsPerMillion, 0)
  assert.equal(mrdNegative.adjuvantChemotherapyStratification, 'CLEARANCE_SURVEILLANCE_APPROPRIATE')
  assert.ok(mrdNegative.prospectiveRecurrenceHazardRatio < 0.5)
  assert.equal(mrdNegative.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. Positive clonal shed ctDNA predicting microscopic recurrence
  const mrdPositive = evaluateCtDnaMrdDynamics({
    patientPrimaryTumorTissueAvailable: true,
    totalCellFreeDnaConcentrationNgPerMl: 18,
    detectedMutantAlleleFrequencyPercentage: 0.15, // 0.15% = 1500 PPM
    sequencingDepthX: 50000,
    matchedPbmcSequencingPerformed: true,
    knownDriverGenesTrackedCount: 6,
    postOperativeBloodDrawWeek: 4,
  })

  assert.equal(mrdPositive.ctDnaDetectionStatus, 'MRD_POSITIVE_CLONAL_SHED')
  assert.equal(mrdPositive.estimatedTumorFractionPartsPerMillion, 1500)
  assert.equal(mrdPositive.chipVariantFilteringConcordance, 'CHIP_FILTERED_CONFIRMED_TUMOR')
  assert.ok(mrdPositive.radiologicalRecurrenceLeadTimeMonthsEstimate >= 5.0)
  assert.ok(mrdPositive.prospectiveRecurrenceHazardRatio >= 6.0)
  assert.equal(mrdPositive.adjuvantChemotherapyStratification, 'DEFINITIVE_ADJUVANT_ESCALATION_CANDIDATE')
})

// ==========================================
// T-CLIN-119: Podocyte Slit Diaphragm Filtration Barrier & Albuminuria Engine
// ==========================================
test('T-CLIN-119: Podocyte intraglomerular hypertension, foot process effacement & SGLT2i protection', () => {
  // 1. Healthy permselective glomerular barrier
  const healthyGlomerulus = evaluatePodocyteGlomerularDynamics({
    intraglomerularCapillaryPressureMmHg: 48,
    nephrinPodocinComplexDensityRatio: 1.0,
  })

  assert.ok(healthyGlomerulus.slitDiaphragmPoreRadiusAngstroms <= 50.0)
  assert.equal(healthyGlomerulus.filtrationBarrierSelectivityClassification, 'PERMSELECTIVE_HEALTHY_BARRIER')
  assert.ok(healthyGlomerulus.urinaryAlbuminToCreatinineRatioProxyMgG < 30)
  assert.ok(healthyGlomerulus.podocyteDetachmentRatePer1000GlomeruliPerDay < 0.5)
  assert.equal(healthyGlomerulus.metadata.truthClass, 'mechanistic_simulation_proxy')

  // 2. Diabetic glomerular hypertension causing foot process effacement and overt proteinuria
  const diabeticNephropathy = evaluatePodocyteGlomerularDynamics({
    intraglomerularCapillaryPressureMmHg: 68,
    nephrinPodocinComplexDensityRatio: 0.35,
    reactiveOxygenSpeciesStressIndex: 0.70,
  })

  assert.ok(diabeticNephropathy.slitDiaphragmPoreRadiusAngstroms > 70.0)
  assert.ok(diabeticNephropathy.footProcessEffacementPercentage > 65.0)
  assert.equal(diabeticNephropathy.filtrationBarrierSelectivityClassification, 'OVERT_NEPHROTIC_MACROPROTEINURIA')
  assert.ok(diabeticNephropathy.urinaryAlbuminToCreatinineRatioProxyMgG > 300)

  // 3. Benefit with SGLT2 inhibitor / RAS blocker hemodynamic pressure reduction
  const treatedDiabeticNephropathy = evaluatePodocyteGlomerularDynamics({
    intraglomerularCapillaryPressureMmHg: 68,
    nephrinPodocinComplexDensityRatio: 0.35,
    reactiveOxygenSpeciesStressIndex: 0.70,
    sglt2InhibitorRasBlockerPresent: true,
  })

  assert.ok(treatedDiabeticNephropathy.effectiveIntraglomerularPressureMmHg < diabeticNephropathy.effectiveIntraglomerularPressureMmHg)
  assert.ok(treatedDiabeticNephropathy.podocyteDetachmentRatePer1000GlomeruliPerDay < diabeticNephropathy.podocyteDetachmentRatePer1000GlomeruliPerDay)
  assert.equal(treatedDiabeticNephropathy.hemodynamicProtectionBenefitObserved, true)
})

// ==========================================
// T-CLIN-120: Clinical Heart Failure GDMT Quadruple Optimization CDS Engine
// ==========================================
test('T-CLIN-120: HFrEF quadruple GDMT optimization, titration guidance & hyperkalemia safety gating', () => {
  // 1. Patient fully optimized on all 4 GDMT pillars
  const fullyOptimizedHf = evaluateHeartFailureGdmtOptimization({
    patientId: 'PT-HF-001',
    leftVentricularEjectionFractionPercentage: 28.0,
    systolicBloodPressureMmHg: 112,
    heartRateBeatsPerMinute: 62,
    serumPotassiumMeqL: 4.4,
    estimatedGlomerularFiltrationRateMlMin: 58,
    activePillars: {
      arniOrAceiOrArb: 'SACUBITRIL_VALSARTAN_TARGET_97_103',
      evidenceBetaBlocker: 'TARGET_DOSE',
      mineralocorticoidAntagonist: 'TARGET_DOSE_SPIRONOLACTONE_25_50',
      sglt2Inhibitor: 'DAPAGLIFLOZIN_10MG_OR_EMPAGLIFLOZIN_10MG',
    },
  })

  assert.equal(fullyOptimizedHf.hfRefDiagnosisConfirmed, true)
  assert.equal(fullyOptimizedHf.totalPillarsActiveCount, 4)
  assert.equal(fullyOptimizedHf.gdmtPillarsCompletenessScorePct, 100.0)
  assert.equal(fullyOptimizedHf.quadruplePillarsOptimizedFlag, true)
  assert.ok(fullyOptimizedHf.relativeMortalityRiskReductionEstimatePct >= 70.0)
  assert.equal(fullyOptimizedHf.urgentSafetyBoundaryAlerts.length, 0)
  assert.equal(fullyOptimizedHf.truthClass, 'clinical_decision_support_guideline_proxy')
  assert.equal(fullyOptimizedHf.auditDigestSha256.length, 64)

  // 2. Newly diagnosed HFrEF on only starting beta-blocker, with hyperkalemia safety gate
  const suboptimizedHf = evaluateHeartFailureGdmtOptimization({
    patientId: 'PT-HF-002',
    leftVentricularEjectionFractionPercentage: 32.0,
    systolicBloodPressureMmHg: 104,
    heartRateBeatsPerMinute: 78,
    serumPotassiumMeqL: 5.3, // hyperkalemia > 5.0
    estimatedGlomerularFiltrationRateMlMin: 45,
    activePillars: {
      arniOrAceiOrArb: 'NONE',
      evidenceBetaBlocker: 'STARTING_DOSE',
      mineralocorticoidAntagonist: 'NONE',
      sglt2Inhibitor: 'NONE',
    },
  })

  assert.equal(suboptimizedHf.totalPillarsActiveCount, 1)
  assert.equal(suboptimizedHf.quadruplePillarsOptimizedFlag, false)
  assert.ok(suboptimizedHf.urgentSafetyBoundaryAlerts.some((a) => a.includes('Hyperkalemia alert')))
  const mraGuidance = suboptimizedHf.pillarTitrationGuidance.find((g) => g.pillarName === 'MRA')
  assert.equal(mraGuidance?.actionRecommendation, 'HOLD_OR_REDUCE_SAFETY_GATE')
  const sglt2Guidance = suboptimizedHf.pillarTitrationGuidance.find((g) => g.pillarName === 'SGLT2_INHIBITOR')
  assert.equal(sglt2Guidance?.actionRecommendation, 'INITIATE_THERAPY_IMMEDIATELY')
})
