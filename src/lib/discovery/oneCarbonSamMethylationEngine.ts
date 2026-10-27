// src/lib/discovery/oneCarbonSamMethylationEngine.ts
// T-CLIN-113: S-Adenosylmethionine (SAM) Methyl Donor Flux, One-Carbon Metabolism & Epigenetic Drift Engine

export interface OneCarbonMetabolismInput {
  plasmaMethionineUmolL?: number // normal 20 - 40 umol/L
  serumFolateNmolL: number // normal 10 - 45 nmol/L; deficient < 7 nmol/L
  serumVitaminB12PmolL: number // normal 200 - 900 pmol/L; deficient < 150 pmol/L
  mthfrGenotype: 'CC_WILD_TYPE' | 'CT_HETEROZYGOUS' | 'TT_HOMOZYGOUS_REDUCED_ACTIVITY'
  plasmaTotalHomocysteineUmolL?: number // normal 5 - 12 umol/L; hyperhomocysteinemia > 15 umol/L
  betaineCholineIntakeScore?: number // 1 - 5 (BHMT alternative methylation pathway)
}

export interface OneCarbonMethylationEvaluation {
  sAdenosylmethionineConcentrationUmolL: number // SAM (normal 80 - 130 nmol/L or umol/L proxy)
  sAdenosylhomocysteineConcentrationUmolL: number // SAH (normal 15 - 30 nmol/L)
  samToSahMethylationRatio: number // critical methylation index (normal > 4.0; deficient < 2.5)
  transmethylationPotentialStatus: 'ROBUST_TRANSCRIPTIONAL_SILENCING' | 'INTERMEDIATE_METHYLATION_COMPENSATED' | 'SEVERE_GLOBAL_HYPOMETHYLATION'
  totalHomocysteineEstimateUmolL: number
  hyperhomocysteinemiaRiskTier: 'NORMAL_CARDIOVASCULAR' | 'MODERATE_ENDOTHELIAL_VULNERABILITY' | 'CRITICAL_VASCULAR_THROMBOTIC_HAZARD'
  epigeneticDriftAccelerationRatePct: number // % acceleration above age-expected epigenetic baseline
  recommendedTargetedNutritionalCofactors: string[]
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Finkelstein 1990 J Nutr Biochem; Selhub 2002 Food Nutr Bull'
  }
}

/**
 * Simulates one-carbon folate-methionine flux, SAM/SAH transmethylation index, homocysteine accumulation, and epigenetic drift.
 */
export function evaluateOneCarbonMethylationDynamics(input: OneCarbonMetabolismInput): OneCarbonMethylationEvaluation {
  const met = Math.min(80, Math.max(5, input.plasmaMethionineUmolL ?? 28))
  const fol = Math.min(60, Math.max(2, input.serumFolateNmolL))
  const b12 = Math.min(1200, Math.max(50, input.serumVitaminB12PmolL))
  const betaine = Math.min(5, Math.max(1, input.betaineCholineIntakeScore ?? 3))

  // MTHFR activity factor
  let mthfrFactor = 1.0
  if (input.mthfrGenotype === 'CT_HETEROZYGOUS') mthfrFactor = 0.70
  if (input.mthfrGenotype === 'TT_HOMOZYGOUS_REDUCED_ACTIVITY') mthfrFactor = 0.35

  // Remethylation efficiency (MTR requires both 5-MTHF from Folate/MTHFR and methyl-B12)
  const folateSupply = (fol / 20.0) * mthfrFactor
  const b12Supply = b12 / 400.0
  const remethylationEfficiency = Math.min(1.5, Math.max(0.15, (folateSupply * 0.55 + b12Supply * 0.45)))

  // Alternative remethylation via Betaine-Homocysteine Methyltransferase (BHMT)
  const bhmtContribution = (betaine / 3.0) * 0.25

  // Homocysteine calculation
  let hcy = input.plasmaTotalHomocysteineUmolL
  if (hcy === undefined) {
    const baseHcy = 9.0 // umol/L baseline
    const elevation = Math.max(0.0, (1.0 - remethylationEfficiency - bhmtContribution) * 18.0)
    hcy = baseHcy + elevation
  }
  const roundedHcy = Number(hcy.toFixed(1))

  // SAM and SAH steady-state concentrations
  // MAT synthesis of SAM depends on methionine and ATP
  const sam = Number((Math.max(20.0, met * 3.2 * Math.min(1.2, remethylationEfficiency + 0.3))).toFixed(1))
  // SAH accumulation increases with high homocysteine (AHCY reaction is reversible)
  const sah = Number((Math.max(8.0, 14.0 + (roundedHcy / 12.0) * 12.0)).toFixed(1))

  // SAM / SAH methylation index ratio
  const ratio = Number((sam / sah).toFixed(2))

  // Transmethylation status
  let transStatus: 'ROBUST_TRANSCRIPTIONAL_SILENCING' | 'INTERMEDIATE_METHYLATION_COMPENSATED' | 'SEVERE_GLOBAL_HYPOMETHYLATION' = 'ROBUST_TRANSCRIPTIONAL_SILENCING'
  if (ratio < 2.5) {
    transStatus = 'SEVERE_GLOBAL_HYPOMETHYLATION'
  } else if (ratio < 3.8) {
    transStatus = 'INTERMEDIATE_METHYLATION_COMPENSATED'
  } else {
    transStatus = 'ROBUST_TRANSCRIPTIONAL_SILENCING'
  }

  // Homocysteine risk tier
  let hcyTier: 'NORMAL_CARDIOVASCULAR' | 'MODERATE_ENDOTHELIAL_VULNERABILITY' | 'CRITICAL_VASCULAR_THROMBOTIC_HAZARD' = 'NORMAL_CARDIOVASCULAR'
  if (roundedHcy >= 30.0) {
    hcyTier = 'CRITICAL_VASCULAR_THROMBOTIC_HAZARD'
  } else if (roundedHcy >= 15.0) {
    hcyTier = 'MODERATE_ENDOTHELIAL_VULNERABILITY'
  } else {
    hcyTier = 'NORMAL_CARDIOVASCULAR'
  }

  // Epigenetic drift acceleration rate %: hypomethylation accelerates Horvath clock drift
  const driftRate = Number((Math.max(0.0, (3.8 - Math.min(3.8, ratio)) * 14.5)).toFixed(1))

  // Recommended targeted nutritional cofactors
  const cofactors: string[] = []
  if (input.mthfrGenotype !== 'CC_WILD_TYPE' || fol < 12.0) {
    cofactors.push('L-5-Methyltetrahydrofolate (5-MTHF / Levomefolate)')
  }
  if (b12 < 300.0) {
    cofactors.push('Methylcobalamin (Bioactive Vitamin B12)')
  }
  if (roundedHcy > 14.0) {
    cofactors.push('Pyridoxal-5-Phosphate (Vitamin B6 for Cystathionine Beta-Synthase Transsulfuration)')
    cofactors.push('Trimethylglycine (Betaine)')
  }
  if (cofactors.length === 0) {
    cofactors.push('Maintain balanced dietary folate and methionine intake')
  }

  return {
    sAdenosylmethionineConcentrationUmolL: sam,
    sAdenosylhomocysteineConcentrationUmolL: sah,
    samToSahMethylationRatio: ratio,
    transmethylationPotentialStatus: transStatus,
    totalHomocysteineEstimateUmolL: roundedHcy,
    hyperhomocysteinemiaRiskTier: hcyTier,
    epigeneticDriftAccelerationRatePct: driftRate,
    recommendedTargetedNutritionalCofactors: cofactors,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Finkelstein 1990 J Nutr Biochem; Selhub 2002 Food Nutr Bull',
    },
  }
}
