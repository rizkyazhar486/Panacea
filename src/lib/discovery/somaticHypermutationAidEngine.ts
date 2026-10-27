// src/lib/discovery/somaticHypermutationAidEngine.ts
// T-CLIN-124: Somatic Hypermutation, Class Switch Recombination & AID Deaminase Engine

export type TargetImmunoglobulinIsotype = 'IGG1_NEUTRALIZING' | 'IGG4_ANTI_INFLAMMATORY' | 'IGA_MUCOSAL' | 'IGE_ALLERGIC'

export interface SomaticHypermutationInput {
  aidDeaminaseExpressionRatio: number // AICDA: normal 1.0 in germinal centers; deficient < 0.10
  ungUracilGlycosylaseActivityRatio?: number // normal 1.0 (creates abasic sites)
  msh2Msh6MismatchRepairActivityRatio?: number // normal 1.0 (error-prone A:T mutation generator)
  germinalCenterTranscriptionRateFraction?: number // RNA Pol II pausing creates ssDNA substrate
  targetIsotypeSwitch: TargetImmunoglobulinIsotype
  offTargetOncogeneHotspotScanning?: boolean // evaluates off-target BCL6/MYC deamination
}

export interface SomaticHypermutationEvaluation {
  wrcyMotifDeaminationRatePerKilobase: number // mutations per 1,000 bp per division (normal ~ 10^-3)
  transitionToTransversionRatio: number // TS/TV ratio (typically ~ 1.5 to 2.2 in SHM)
  classSwitchRecombinationEfficiencyPercentage: number // CSR efficiency %
  hyperIgMSyndromeRiskFlag: boolean // failure of CSR / AID deficiency
  antibodyAffinityMaturationVelocityScore: number // 0.0 - 1.0 (rate of high-affinity clone selection)
  offTargetLymphomagenicTranslocationRiskTier: 'LOW_STRINGENT_TARGETING' | 'INTERMEDIATE_SURVEILLANCE' | 'HIGH_ONCOGENIC_TRANSLOCATION_HAZARD'
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Muramatsu et al. 2000 Cell; Di Noia & Neuberger 2007 Annu Rev Biochem; Honjo et al. 2002 Annu Rev Immunol'
  }
}

/**
 * Simulates AID cytidine deamination at WRCY motifs, error-prone repair branching (UNG/MSH2-Pol eta), CSR efficiency, and oncogenic translocations.
 */
export function evaluateSomaticHypermutationDynamics(
  input: SomaticHypermutationInput
): SomaticHypermutationEvaluation {
  const aid = Math.min(2.0, Math.max(0.01, input.aidDeaminaseExpressionRatio))
  const ung = Math.min(1.5, Math.max(0.05, input.ungUracilGlycosylaseActivityRatio ?? 1.0))
  const mmr = Math.min(1.5, Math.max(0.05, input.msh2Msh6MismatchRepairActivityRatio ?? 1.0))
  const txn = Math.min(1.5, Math.max(0.1, input.germinalCenterTranscriptionRateFraction ?? 1.0))

  // AID deamination rate at WRCY motifs (mutations per kb in V region)
  // Physiological SHM is ~ 1 mutation per 1,000 bp per B-cell division (10^6-fold higher than genomic baseline)
  const baseDeaminationRate = 1.25 // mutations / kb
  const deaminationRate = Number((baseDeaminationRate * aid * txn).toFixed(2))

  // Transition vs transversion ratio
  // If UNG is deficient, U:G replicative bypass produces almost exclusively C->T transitions (TS/TV > 6.0)
  // With intact UNG and Pol eta, transversions are abundant (TS/TV ~ 1.6 - 2.0)
  let tsTv = 1.8
  if (ung < 0.25) {
    tsTv = 7.5 // classic UNG-deficiency hyper-transition phenotype
  } else if (mmr < 0.25) {
    tsTv = 2.8
  } else {
    tsTv = Number((1.75 + (1.0 - ung) * 0.5).toFixed(2))
  }

  // Class Switch Recombination (CSR) efficiency %
  // Requires both AID deamination in S-regions and UNG-mediated abasic site generation for DSB formation
  const csr = Number((Math.min(98.0, Math.max(1.0, aid * ung * 85.0))).toFixed(1))

  // Hyper-IgM Syndrome Flag: occurs when AID is deficient (<0.15) or UNG is absent, preventing CSR
  const isHyperIgm = aid < 0.15 || csr < 15.0

  // Antibody affinity maturation velocity (requires balanced SHM without excessive deleterious stop codons)
  const velocityScore = Number((Math.min(1.0, Math.max(0.05, aid * 0.4 + ung * 0.3 + mmr * 0.3) * (isHyperIgm ? 0.2 : 1.0))).toFixed(3))

  // Off-target lymphomagenic translocation risk tier (BCL6/MYC breaks)
  let oncoTier: 'LOW_STRINGENT_TARGETING' | 'INTERMEDIATE_SURVEILLANCE' | 'HIGH_ONCOGENIC_TRANSLOCATION_HAZARD' = 'LOW_STRINGENT_TARGETING'
  if (aid > 1.6 && mmr < 0.40) {
    oncoTier = 'HIGH_ONCOGENIC_TRANSLOCATION_HAZARD'
  } else if (aid > 1.3 || (input.offTargetOncogeneHotspotScanning ?? false)) {
    oncoTier = 'INTERMEDIATE_SURVEILLANCE'
  } else {
    oncoTier = 'LOW_STRINGENT_TARGETING'
  }

  return {
    wrcyMotifDeaminationRatePerKilobase: deaminationRate,
    transitionToTransversionRatio: tsTv,
    classSwitchRecombinationEfficiencyPercentage: csr,
    hyperIgMSyndromeRiskFlag: isHyperIgm,
    antibodyAffinityMaturationVelocityScore: velocityScore,
    offTargetLymphomagenicTranslocationRiskTier: oncoTier,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Muramatsu et al. 2000 Cell; Di Noia & Neuberger 2007 Annu Rev Biochem; Honjo et al. 2002 Annu Rev Immunol',
    },
  }
}
