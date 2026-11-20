// src/lib/discovery/terraRloopTelomericChromatinEngine.ts
// T-CLIN-126: Telomeric RNA (TERRA) R-Loop Dynamics & Chromatin Packaging Engine

export interface TerraRloopInput {
  subtelomericTerraTranscriptionRateRatio: number // normal ~1.0; ALT cancer or stress > 3.0
  rnaseH1H2ResolutionActivityRatio: number // normal 1.0; deficient < 0.20
  shelterinTrf2CappingLevelRatio?: number // normal 1.0; uncapped < 0.35
  telomereReplicationStressInduction?: boolean // e.g. aphidicolin or hydroxyurea exposure
  altPathwayActive?: boolean // Alternative Lengthening of Telomeres
}

export interface TerraRloopEvaluation {
  steadyStateTerraConcentrationArbitraryUnits: number
  telomericRloopAbundanceIndex: number // 0.0 - 1.0 (hybrid persistence)
  replicationForkStallProbabilityPerTelomere: number // 0.0 - 1.0
  telomereFragilityClassification: 'STABLE_CAPPED_PACKAGING' | 'INTERMEDIATE_HYBRID_STRESS' | 'COLLAPSED_REPLICATION_FORK_CRISIS'
  subtelomericH3K9me3DensityFeedbackScore: number // 0.0 - 1.0 (TERRA-mediated heterochromatin)
  homologyDirectedAltRecombinationPropensity: number // 0.0 - 1.0
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Azzalin et al. 2007 Science; Arora et al. 2014 Science; Fernandes et al. 2021 Nat Commun'
  }
}

/**
 * Simulates subtelomeric TERRA lncRNA transcription, RNA:DNA R-loop formation, RNase H resolution, and replication fork collapse.
 */
export function evaluateTerraRloopDynamics(input: TerraRloopInput): TerraRloopEvaluation {
  const txn = Math.min(5.0, Math.max(0.1, input.subtelomericTerraTranscriptionRateRatio))
  const rnaseH = Math.min(2.0, Math.max(0.05, input.rnaseH1H2ResolutionActivityRatio))
  const trf2 = Math.min(1.5, Math.max(0.05, input.shelterinTrf2CappingLevelRatio ?? 1.0))
  const isStress = input.telomereReplicationStressInduction ?? false
  const isAlt = input.altPathwayActive ?? false

  // Steady state TERRA concentration
  const terraConc = Number((txn * 12.5).toFixed(1))

  // R-loop abundance: balance between transcription and RNase H resolution
  const formationRate = txn * (isAlt ? 1.8 : 1.0)
  const resolutionFactor = rnaseH * (trf2 > 0.5 ? 1.0 : 0.65)
  const rawRloop = Math.min(1.0, (formationRate / (formationRate + resolutionFactor * 2.0)))
  const rloopIndex = Number((Math.max(0.02, rawRloop)).toFixed(3))

  // Replication fork stall probability: R-loops pose severe sterical blocks to replisome progression
  const stallProb = Number((Math.min(0.98, Math.max(0.01, rloopIndex * 0.75 + (isStress ? 0.30 : 0.0)))).toFixed(3))

  // Classification
  let fragility: 'STABLE_CAPPED_PACKAGING' | 'INTERMEDIATE_HYBRID_STRESS' | 'COLLAPSED_REPLICATION_FORK_CRISIS' = 'STABLE_CAPPED_PACKAGING'
  if (stallProb > 0.60 || trf2 < 0.25) {
    fragility = 'COLLAPSED_REPLICATION_FORK_CRISIS'
  } else if (stallProb > 0.25) {
    fragility = 'INTERMEDIATE_HYBRID_STRESS'
  } else {
    fragility = 'STABLE_CAPPED_PACKAGING'
  }

  // Subtelomeric H3K9me3 heterochromatin feedback: physiological TERRA recruits SUV39H1 to nucleate heterochromatin
  const h3k9me3Feedback = Number((Math.min(1.0, Math.max(0.1, (terraConc / 25.0) * trf2 * 0.9))).toFixed(3))

  // ALT recombination propensity: high R-loops in ALT cells stimulate homology-directed recombination
  const altPropensity = isAlt
    ? Number((Math.min(1.0, Math.max(0.40, rloopIndex * 0.95))).toFixed(3))
    : Number((Math.min(0.15, rloopIndex * 0.10)).toFixed(3))

  return {
    steadyStateTerraConcentrationArbitraryUnits: terraConc,
    telomericRloopAbundanceIndex: rloopIndex,
    replicationForkStallProbabilityPerTelomere: stallProb,
    telomereFragilityClassification: fragility,
    subtelomericH3K9me3DensityFeedbackScore: h3k9me3Feedback,
    homologyDirectedAltRecombinationPropensity: altPropensity,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Azzalin et al. 2007 Science; Arora et al. 2014 Science; Fernandes et al. 2021 Nat Commun',
    },
  }
}
