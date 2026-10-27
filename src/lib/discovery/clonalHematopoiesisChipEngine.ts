// src/lib/discovery/clonalHematopoiesisChipEngine.ts
// T-CLIN-108: Clonal Hematopoiesis of Indeterminate Potential (CHIP) & Macrophage Inflammasome Engine

export type ChipDriverGene = 'DNMT3A_R882' | 'TET2_LOSS_OF_FUNCTION' | 'ASXL1_TRUNCATING' | 'JAK2_V617F' | 'PPM1D_EXON6'

export interface ChipCloneProfileInput {
  driverGene: ChipDriverGene
  variantAlleleFrequencyPercentage: number // VAF: diagnostic threshold >= 2.0% (e.g. 2% to 35%)
  patientAgeYears: number // CHIP prevalence increases with age (>10% over age 70)
  circulatingHighSensitivityCrpMgL?: number // hs-CRP systemic inflammation marker (normal < 2.0 mg/L)
  nlrp3InflammasomeInhibitorPresent?: boolean // e.g. MCC950 or Canakinumab anti-IL-1beta proxy
}

export interface ChipCardiovascularEvaluation {
  driverGene: ChipDriverGene
  variantAlleleFrequencyPercentage: number
  chipDiagnosticStatus: 'SUB_DIAGNOSTIC_CLONE_BELOW_2_PERCENT' | 'CONFIRMED_CHIP_CLONAL_EXPANSION' | 'HIGH_VAF_PRE_LEUKEMIC_MONITORING'
  macrophageNlrp3PrimingIndex: number // 0.0 - 1.0 (NLRP3 / caspase-1 activity)
  interleukin1BetaSecretionFold: number // fold elevation in macrophage IL-1b secretion
  coronaryHeartDiseaseHazardRatio: number // relative risk of myocardial infarction
  ischemicStrokeHazardRatio: number
  hematologicMalignancyProgressionRiskPerYearPercentage: number // ~0.5% - 1.0% per year baseline
  targetedInflammationSuppressionBenefit: boolean
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Jaiswal et al. 2017 NEJM; Fuster et al. 2017 Science'
  }
}

/**
 * Simulates clonal expansion of somatic CHIP mutations, macrophage NLRP3 inflammasome activation, and cardiovascular risk.
 */
export function evaluateClonalHematopoiesisDynamics(input: ChipCloneProfileInput): ChipCardiovascularEvaluation {
  const vaf = Math.min(50.0, Math.max(0.1, input.variantAlleleFrequencyPercentage))
  const age = Math.min(105, Math.max(18, input.patientAgeYears))
  const crp = Math.max(0.1, input.circulatingHighSensitivityCrpMgL ?? 1.5)
  const hasInhibitor = input.nlrp3InflammasomeInhibitorPresent ?? false

  // Status classification
  let status: 'SUB_DIAGNOSTIC_CLONE_BELOW_2_PERCENT' | 'CONFIRMED_CHIP_CLONAL_EXPANSION' | 'HIGH_VAF_PRE_LEUKEMIC_MONITORING' = 'CONFIRMED_CHIP_CLONAL_EXPANSION'
  if (vaf < 2.0) {
    status = 'SUB_DIAGNOSTIC_CLONE_BELOW_2_PERCENT'
  } else if (vaf >= 20.0) {
    status = 'HIGH_VAF_PRE_LEUKEMIC_MONITORING'
  } else {
    status = 'CONFIRMED_CHIP_CLONAL_EXPANSION'
  }

  // Gene-specific inflammasome priming
  let basePriming = 0.5
  let cvSensitivity = 1.0
  switch (input.driverGene) {
    case 'TET2_LOSS_OF_FUNCTION':
      basePriming = 0.90 // TET2 knockout directly derepresses IL-1b transcription
      cvSensitivity = 1.35
      break
    case 'DNMT3A_R882':
      basePriming = 0.85
      cvSensitivity = 1.25
      break
    case 'JAK2_V617F':
      basePriming = 0.80
      cvSensitivity = 1.50 // JAK2 carries heightened thrombosis risk
      break
    case 'ASXL1_TRUNCATING':
      basePriming = 0.70
      cvSensitivity = 1.20
      break
    case 'PPM1D_EXON6':
      basePriming = 0.60
      cvSensitivity = 1.10
      break
  }

  // Inhibition dampens priming
  const effectivePriming = hasInhibitor ? basePriming * 0.25 : basePriming
  const il1bFold = Number((Math.max(1.0, 1.0 + (vaf / 10.0) * effectivePriming * 3.2 * (crp / 2.0))).toFixed(2))

  // Cardiovascular Hazard Ratios: Jaiswal et al. 2017 (HR ~ 1.9 to 2.4 for VAF >= 10%)
  const vafFactor = status === 'SUB_DIAGNOSTIC_CLONE_BELOW_2_PERCENT' ? 0.2 : Math.min(2.5, vaf / 10.0)
  const chdHr = Number((Math.max(1.0, 1.0 + vafFactor * cvSensitivity * (hasInhibitor ? 0.35 : 1.15))).toFixed(2))
  const strokeHr = Number((Math.max(1.0, 1.0 + vafFactor * (cvSensitivity * 0.85) * (hasInhibitor ? 0.35 : 1.05))).toFixed(2))

  // Hematologic progression rate (~0.5% to 1.0% per year for typical CHIP, higher if VAF >= 20%)
  const maligRate = status === 'HIGH_VAF_PRE_LEUKEMIC_MONITORING'
    ? Number((1.5 + (vaf - 20.0) * 0.1).toFixed(2))
    : Number((0.4 + (vaf / 20.0) * 0.6).toFixed(2))

  return {
    driverGene: input.driverGene,
    variantAlleleFrequencyPercentage: vaf,
    chipDiagnosticStatus: status,
    macrophageNlrp3PrimingIndex: Number(effectivePriming.toFixed(3)),
    interleukin1BetaSecretionFold: il1bFold,
    coronaryHeartDiseaseHazardRatio: chdHr,
    ischemicStrokeHazardRatio: strokeHr,
    hematologicMalignancyProgressionRiskPerYearPercentage: maligRate,
    targetedInflammationSuppressionBenefit: hasInhibitor,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Jaiswal et al. 2017 NEJM; Fuster et al. 2017 Science',
    },
  }
}
