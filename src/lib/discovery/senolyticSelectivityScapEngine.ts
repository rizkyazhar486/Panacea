// src/lib/discovery/senolyticSelectivityScapEngine.ts
// T-CLIN-89: Senescent Cell Antiapoptotic Pathway (SCAP) & Senolytic Selectivity Engine

export type SenolyticDrugClass = 'NAVITOCLAX_ABT263_BCL_XL' | 'DASATINIB_QUERCETIN_COMBO' | 'FOXO4_DRI_PEPTIDE' | 'FISIDIN_FLAVONOID'

export interface SenolyticExposureInput {
  drugClass: SenolyticDrugClass
  doseConcentrationMicromolar: number // 0.05 to 50 uM
  tissueMicroenvironment: 'ENDOTHELIAL' | 'FIBROBLAST' | 'PREADIPOCYTE' | 'CHONDROCYTE'
  baselineSenescentCellFraction: number // 0.01 to 0.40 (1% to 40% senescent cells)
  bclXlPlateletDependencyScore?: number // 0.5 - 1.0 (platelet survival dependence on BCL-xL)
}

export interface SenolyticSelectivityProfile {
  drugClass: SenolyticDrugClass
  doseConcentrationMicromolar: number
  senescentCellClearancePercentage: number // % senescent cells successfully driven to apoptosis
  healthyBystanderSurvivalPercentage: number // % non-senescent healthy cells preserved (>85% desired)
  senolyticSelectivityIndex: number // Clearance / Bystander Toxicity ratio
  saspAttenuationPercentage: number // reduction in IL-6, IL-8, MMP secretome
  onTargetToxicityRisks: {
    thrombocytopeniaRiskCategory: 'LOW' | 'MODERATE_MONITORED' | 'HIGH_DOSE_LIMITING'
    neutropeniaRiskCategory: 'LOW' | 'MODERATE'
  }
  therapeuticWindowAssessment: 'FAVORABLE_SELECTIVE_WINDOW' | 'NARROW_MARGINAL_WINDOW' | 'TOXIC_NON_SELECTIVE'
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Zhu et al. 2015 Aging Cell; Baar et al. 2017 Cell'
  }
}

/**
 * Simulates senolytic apoptotic efficacy, healthy cell bystander preservation, and on-target hematologic risk.
 */
export function simulateSenolyticSelectivity(input: SenolyticExposureInput): SenolyticSelectivityProfile {
  const dose = Math.max(0.01, input.doseConcentrationMicromolar)
  const plateletDep = Math.min(1.0, Math.max(0.2, input.bclXlPlateletDependencyScore ?? 0.85))

  let senClearance = 0.0
  let bystanderKill = 0.0
  let saspReduction = 0.0
  let thromboRisk: 'LOW' | 'MODERATE_MONITORED' | 'HIGH_DOSE_LIMITING' = 'LOW'

  switch (input.drugClass) {
    case 'NAVITOCLAX_ABT263_BCL_XL':
      // Highly potent on BCL-xL dependent senescent cells (HUVECs, fibroblasts), but causes platelet apoptosis
      senClearance = (dose / (dose + 0.8)) * 92.0
      bystanderKill = (dose / (dose + 8.0)) * 25.0
      saspReduction = senClearance * 0.90
      if (dose >= 2.5 * plateletDep) {
        thromboRisk = 'HIGH_DOSE_LIMITING'
      } else if (dose >= 0.8) {
        thromboRisk = 'MODERATE_MONITORED'
      } else {
        thromboRisk = 'LOW'
      }
      break

    case 'DASATINIB_QUERCETIN_COMBO':
      // Broad coverage: Dasatinib eliminates senescent preadipocytes via ephrin/Src; Quercetin hits BCL-2/PI3K
      senClearance = (dose / (dose + 1.2)) * 88.0
      bystanderKill = (dose / (dose + 14.0)) * 16.0
      saspReduction = senClearance * 0.85
      thromboRisk = 'LOW'
      break

    case 'FOXO4_DRI_PEPTIDE':
      // Peptidomimetic: selectively disrupts FOXO4-p53 in senescent cells; minimal bystander killing
      senClearance = (dose / (dose + 2.0)) * 85.0
      bystanderKill = (dose / (dose + 35.0)) * 8.0
      saspReduction = senClearance * 0.92
      thromboRisk = 'LOW'
      break

    case 'FISIDIN_FLAVONOID':
      // Natural flavonoid; milder potency, high bystander safety margin
      senClearance = (dose / (dose + 4.5)) * 74.0
      bystanderKill = (dose / (dose + 50.0)) * 6.0
      saspReduction = senClearance * 0.78
      thromboRisk = 'LOW'
      break
  }

  // Healthy bystander survival
  const healthySurvival = Number(Math.max(50.0, 100.0 - bystanderKill).toFixed(1))
  const clearancePct = Number(Math.min(99.0, senClearance).toFixed(1))
  const saspPct = Number(Math.min(98.0, saspReduction).toFixed(1))

  // Selectivity Index = Clearance / (100 - Survival)
  const toxicity = Math.max(0.5, 100.0 - healthySurvival)
  const selectivityIndex = Number((clearancePct / toxicity).toFixed(2))

  // Therapeutic window
  let windowStatus: 'FAVORABLE_SELECTIVE_WINDOW' | 'NARROW_MARGINAL_WINDOW' | 'TOXIC_NON_SELECTIVE' = 'FAVORABLE_SELECTIVE_WINDOW'
  if (thromboRisk === 'HIGH_DOSE_LIMITING' || healthySurvival < 80.0) {
    windowStatus = 'TOXIC_NON_SELECTIVE'
  } else if (selectivityIndex >= 6.0 && healthySurvival >= 90.0) {
    windowStatus = 'FAVORABLE_SELECTIVE_WINDOW'
  } else {
    windowStatus = 'NARROW_MARGINAL_WINDOW'
  }

  return {
    drugClass: input.drugClass,
    doseConcentrationMicromolar: dose,
    senescentCellClearancePercentage: clearancePct,
    healthyBystanderSurvivalPercentage: healthySurvival,
    senolyticSelectivityIndex: selectivityIndex,
    saspAttenuationPercentage: saspPct,
    onTargetToxicityRisks: {
      thrombocytopeniaRiskCategory: thromboRisk,
      neutropeniaRiskCategory: input.drugClass === 'DASATINIB_QUERCETIN_COMBO' && dose > 5.0 ? 'MODERATE' : 'LOW',
    },
    therapeuticWindowAssessment: windowStatus,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Zhu et al. 2015 Aging Cell; Baar et al. 2017 Cell',
    },
  }
}
