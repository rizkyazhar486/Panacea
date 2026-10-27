// src/lib/discovery/ribosomeBiogenesisNucleolarStressEngine.ts
// T-CLIN-107: Ribosome Biogenesis, Nucleolar Stress & 5S-RNP-MDM2-p53 Surveillance Engine

export interface NucleolarStressInput {
  rnaPolymeraseIActivityRatio: number // normal ~1.0; inhibited < 0.25 (e.g. by CX-5461 or low-dose ActD)
  pre47sRnaSynthesisRateFraction: number // 0.05 to 1.5
  nucleolarMorphologyIntegrityIndex?: number // 0.0 - 1.0 (dense fibrillar / granular compartmentalization)
  rpl5Rpl11FreeNuclearPoolFraction?: number // fraction of 5S RNP released into nucleoplasm (0.0 - 1.0)
  p53Status: 'WILD_TYPE_FUNCTIONAL' | 'P53_MUTANT_INACTIVATED' | 'MDM2_AMPLIFIED'
}

export interface NucleolarStressEvaluation {
  nucleolarFunctionalState: 'HOMEOSTATIC_BIOGENESIS' | 'COMPENSATED_HYPER_TRANSLATION' | 'ACUTE_NUCLEOLAR_DISRUPTION'
  rpl5Rpl11Mdm2BindingIntensity: number // 0.0 - 1.0 (5S RNP inhibition of MDM2)
  p53StabilizationFoldChange: number // fold increase in nuclear p53
  cellCycleOutcome: 'NORMAL_G1_S_PROGRESSION' | 'P21_MEDIATED_CYTOSTATIC_ARREST' | 'PUMA_BAX_APOPTOTIC_COMMITMENT' | 'UNCOUPLED_P53_INDEPENDENT_PROLIFERATION'
  ribosomalBiogenesisRatePercentage: number // relative to homeostatic baseline
  targetedPolIInhibitorTherapeuticWindow: 'POTENT_ONCOLYTIC_RESPONSE' | 'MARGINAL_SELECTIVITY' | 'DRUG_RESISTANT'
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Boulon et al. 2010 Mol Cell; Fumagalli et al. 2012 Nat Cell Biol'
  }
}

/**
 * Simulates RNA Polymerase I transcription, nucleolar compartmental integrity, 5S RNP-MDM2 binding, and p53 stabilization.
 */
export function evaluateNucleolarStressDynamics(input: NucleolarStressInput): NucleolarStressEvaluation {
  const polI = Math.min(2.0, Math.max(0.01, input.rnaPolymeraseIActivityRatio))
  const rna47s = Math.min(2.0, Math.max(0.01, input.pre47sRnaSynthesisRateFraction))
  const morph = Math.min(1.0, Math.max(0.05, input.nucleolarMorphologyIntegrityIndex ?? Math.min(1.0, polI * 0.95)))

  // Biogenesis rate
  const biogenesisRate = Number((Math.min(150.0, (polI * 0.6 + rna47s * 0.4) * 100.0)).toFixed(1))

  // Nucleolar disruption: occurs when Pol I falls below 0.35 or morphology collapses
  const isDisrupted = polI < 0.35 || morph < 0.40

  // 5S RNP (RPL5/RPL11) free nucleoplasmic accumulation
  const free5sRnp = input.rpl5Rpl11FreeNuclearPoolFraction ?? (isDisrupted ? Math.min(1.0, (1.0 - polI) * 0.9) : 0.05)

  // MDM2 binding intensity
  const mdm2Binding = Number((Math.min(1.0, free5sRnp * 1.15)).toFixed(3))

  // p53 stabilization
  let p53Fold = 1.0
  if (input.p53Status === 'WILD_TYPE_FUNCTIONAL') {
    p53Fold = Number((Math.max(1.0, 1.0 + mdm2Binding * 8.5)).toFixed(2))
  } else if (input.p53Status === 'MDM2_AMPLIFIED') {
    p53Fold = Number((Math.max(0.3, 0.4 + mdm2Binding * 2.5)).toFixed(2))
  } else {
    p53Fold = 0.0 // mutant p53 lacks transactivation function
  }

  // State classification
  let state: 'HOMEOSTATIC_BIOGENESIS' | 'COMPENSATED_HYPER_TRANSLATION' | 'ACUTE_NUCLEOLAR_DISRUPTION' = 'HOMEOSTATIC_BIOGENESIS'
  if (isDisrupted) {
    state = 'ACUTE_NUCLEOLAR_DISRUPTION'
  } else if (biogenesisRate > 115.0) {
    state = 'COMPENSATED_HYPER_TRANSLATION'
  } else {
    state = 'HOMEOSTATIC_BIOGENESIS'
  }

  // Outcome
  let outcome: 'NORMAL_G1_S_PROGRESSION' | 'P21_MEDIATED_CYTOSTATIC_ARREST' | 'PUMA_BAX_APOPTOTIC_COMMITMENT' | 'UNCOUPLED_P53_INDEPENDENT_PROLIFERATION' = 'NORMAL_G1_S_PROGRESSION'
  if (input.p53Status === 'P53_MUTANT_INACTIVATED') {
    outcome = 'UNCOUPLED_P53_INDEPENDENT_PROLIFERATION'
  } else if (p53Fold > 5.0) {
    outcome = 'PUMA_BAX_APOPTOTIC_COMMITMENT'
  } else if (p53Fold > 2.2) {
    outcome = 'P21_MEDIATED_CYTOSTATIC_ARREST'
  } else {
    outcome = 'NORMAL_G1_S_PROGRESSION'
  }

  // Pol I inhibitor window
  let windowStatus: 'POTENT_ONCOLYTIC_RESPONSE' | 'MARGINAL_SELECTIVITY' | 'DRUG_RESISTANT' = 'POTENT_ONCOLYTIC_RESPONSE'
  if (input.p53Status === 'P53_MUTANT_INACTIVATED') {
    windowStatus = 'DRUG_RESISTANT'
  } else if (input.p53Status === 'MDM2_AMPLIFIED') {
    windowStatus = 'MARGINAL_SELECTIVITY'
  } else {
    windowStatus = 'POTENT_ONCOLYTIC_RESPONSE'
  }

  return {
    nucleolarFunctionalState: state,
    rpl5Rpl11Mdm2BindingIntensity: mdm2Binding,
    p53StabilizationFoldChange: p53Fold,
    cellCycleOutcome: outcome,
    ribosomalBiogenesisRatePercentage: biogenesisRate,
    targetedPolIInhibitorTherapeuticWindow: windowStatus,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Boulon et al. 2010 Mol Cell; Fumagalli et al. 2012 Nat Cell Biol',
    },
  }
}
