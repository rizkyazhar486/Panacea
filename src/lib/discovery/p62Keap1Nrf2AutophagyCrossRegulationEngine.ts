// src/lib/discovery/p62Keap1Nrf2AutophagyCrossRegulationEngine.ts
// T-CLIN-128: Autophagy Receptor p62/SQSTM1-KEAP1-NRF2 Antioxidant Cross-Regulation Engine

export interface P62Keap1Nrf2Input {
  p62Sqstm1TotalAbundanceRatio: number // normal ~1.0; accumulates > 2.5 during autophagy block
  p62Ser351PhosphorylationRatio: number // 0.0 to 1.0 (TBK1/mTORC1 phosphorylation)
  autophagicFluxClearanceCapacityRatio?: number // normal 1.0; impaired < 0.35
  electrophilicOxidativeStressConcentrationUm?: number // e.g. sulforaphane or H2O2 (0 to 50 uM)
  keap1Cul3UbiquitinLigaseIntegrityRatio?: number // normal 1.0
}

export interface P62Keap1Nrf2Evaluation {
  p62Keap1CompetitiveBindingIntensity: number // 0.0 - 1.0 (KEAP1 sequestration score)
  nrf2NuclearTranslocationFold: number // fold increase above basal uninduced state
  antioxidantResponseElementInductionScore: number // 0.0 - 1.0 (ARE transcriptional output)
  targetGeneInductionProfiles: {
    nqo1EnzymeInductionFold: number
    hmox1HemeOxygenase1InductionFold: number
    gclcGlutathioneBiosynthesisInductionFold: number
  }
  cellularRedoxAdaptationClassification: 'BASAL_UNSTRESSED_HOMEOSTASIS' | 'ADAPTIVE_ANTIOXIDANT_SHIELDING' | 'MALADAPTIVE_AUTOPHAGIC_STALL_HYPERACTIVATION'
  glutathioneRedoxBufferingCapacityPercentage: number // % of maximum redox buffering
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Komatsu et al. 2010 Cell; Lau et al. 2010 Mol Cell Biol; Ichimura et al. 2013 Mol Cell'
  }
}

/**
 * Simulates p62/SQSTM1 phosphorylation, non-canonical KEAP1 sequestration, NRF2 stabilization, and ARE antioxidant gene induction.
 */
export function evaluateP62Keap1Nrf2Dynamics(input: P62Keap1Nrf2Input): P62Keap1Nrf2Evaluation {
  const p62 = Math.min(4.0, Math.max(0.1, input.p62Sqstm1TotalAbundanceRatio))
  const pSer351 = Math.min(1.0, Math.max(0.01, input.p62Ser351PhosphorylationRatio))
  const flux = Math.min(1.5, Math.max(0.05, input.autophagicFluxClearanceCapacityRatio ?? 1.0))
  const oxidant = Math.max(0.0, input.electrophilicOxidativeStressConcentrationUm ?? 0.0)
  const cul3 = Math.min(1.5, Math.max(0.1, input.keap1Cul3UbiquitinLigaseIntegrityRatio ?? 1.0))

  // Canonical oxidative stress directly modifies KEAP1 sensor cysteines (C151, C273, C288)
  const oxidantModificationFactor = oxidant > 0.0 ? oxidant / (oxidant + 15.0) : 0.0

  // Non-canonical p62 binding: phosphorylation of p62 at Ser351 increases affinity for KEAP1 > 50-fold (Ichimura et al. 2013)
  // Autophagy block causes p62 accumulation, further driving KEAP1 sequestration
  const nonCanonicalDrive = (p62 / 1.5) * pSer351 * (flux < 0.5 ? 1.5 : 1.0)
  const keap1BindingIntensity = Number((Math.min(1.0, Math.max(0.02, nonCanonicalDrive * 0.85 + oxidantModificationFactor * 0.55))).toFixed(3))

  // NRF2 stabilization and nuclear translocation fold
  // Basal state = 1.0. High KEAP1 sequestration prevents Cul3 ubiquitination, stabilizing NRF2 up to 8-12 fold
  const nrf2Fold = Number((Math.max(1.0, 1.0 + (keap1BindingIntensity / cul3) * 8.5)).toFixed(2))

  // ARE transcriptional induction score (0.0 - 1.0)
  const areScore = Number((Math.min(1.0, Math.max(0.05, (nrf2Fold - 1.0) / 8.5))).toFixed(3))

  // Target gene fold induction
  const nqo1 = Number((Math.max(1.0, 1.0 + areScore * 6.5)).toFixed(2))
  const hmox1 = Number((Math.max(1.0, 1.0 + areScore * 9.2)).toFixed(2))
  const gclc = Number((Math.max(1.0, 1.0 + areScore * 4.8)).toFixed(2))

  // Redox classification
  let classification: 'BASAL_UNSTRESSED_HOMEOSTASIS' | 'ADAPTIVE_ANTIOXIDANT_SHIELDING' | 'MALADAPTIVE_AUTOPHAGIC_STALL_HYPERACTIVATION' = 'BASAL_UNSTRESSED_HOMEOSTASIS'
  if (flux < 0.40 && p62 > 2.0 && nrf2Fold > 5.0) {
    classification = 'MALADAPTIVE_AUTOPHAGIC_STALL_HYPERACTIVATION' // classic p62-body oncogenic niche
  } else if (nrf2Fold >= 2.5 || oxidant > 5.0) {
    classification = 'ADAPTIVE_ANTIOXIDANT_SHIELDING'
  } else {
    classification = 'BASAL_UNSTRESSED_HOMEOSTASIS'
  }

  // Glutathione redox buffering capacity %
  const gshBufferingPct = Number((Math.min(100.0, Math.max(15.0, 40.0 + areScore * 58.0))).toFixed(1))

  return {
    p62Keap1CompetitiveBindingIntensity: keap1BindingIntensity,
    nrf2NuclearTranslocationFold: nrf2Fold,
    antioxidantResponseElementInductionScore: areScore,
    targetGeneInductionProfiles: {
      nqo1EnzymeInductionFold: nqo1,
      hmox1HemeOxygenase1InductionFold: hmox1,
      gclcGlutathioneBiosynthesisInductionFold: gclc,
    },
    cellularRedoxAdaptationClassification: classification,
    glutathioneRedoxBufferingCapacityPercentage: gshBufferingPct,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Komatsu et al. 2010 Cell; Lau et al. 2010 Mol Cell Biol; Ichimura et al. 2013 Mol Cell',
    },
  }
}
