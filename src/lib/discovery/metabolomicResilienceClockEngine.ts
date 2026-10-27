// src/lib/discovery/metabolomicResilienceClockEngine.ts
// T-CLIN-86: Metabolomic Multi-Pathway Flux & Biological Resilience Clock Engine

export interface MetabolomicProfileInput {
  chronologicalAgeYears: number // 18 - 95
  glycolyticLactatePyruvateRatio?: number // normal ~10-15; elevated >25 indicates impaired mitochondrial respiration
  nad_nadh_redox_ratio?: number // youth ~8.0 - 10.0; aged often drops to 3.0 - 5.0
  bcaaMetaboliteAccumulation?: number // 0.5 - 2.5 (elevated BCAAs correlate with insulin resistance)
  kynurenine_tryptophan_ratio?: number // normal 0.03 - 0.05; elevated >0.08 indicates IDO1/inflammaging
  ureaCycleClearanceEfficiency?: number // 0.0 - 1.0 (normal >0.85)
  fastingBetaHydroxybutyrateMmol?: number // ketone body utilization capacity (0.1 - 2.5 mM)
}

export interface MetabolomicResilienceEvaluation {
  chronologicalAgeYears: number
  estimatedMetabolicAgeYears: number
  metabolicAgeDeltaYears: number // negative = metabolically younger; positive = accelerated metabolic aging
  metabolicResilienceScore: number // 0.0 - 100.0
  bioenergeticFlexibilityIndex: number // 0.0 - 1.0
  systemicInflammagingBurden: number // 0.0 - 1.0
  pathwayHealthBreakdown: {
    mitochondrialOxphosRedox: number // 0.0 - 1.0
    aminoAcidHomeostasis: number // 0.0 - 1.0
    ammoniaDetoxification: number // 0.0 - 1.0
    kynurenineImmuneAxis: number // 0.0 - 1.0
  }
  longevityForecastCategory: 'OPTIMAL_METABOLIC_LONGEVITY' | 'RESILIENT_BALANCED' | 'COMPENSATED_DECLINE' | 'ACCELERATED_METABOLIC_AGING'
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Bordone et al. 2007 Cell Metab; Robinson et al. 2020 Nat Aging'
  }
}

/**
 * Computes multi-pathway metabolomic flux balance, bioenergetic flexibility, and metabolic biological age.
 */
export function evaluateMetabolomicResilience(input: MetabolomicProfileInput): MetabolomicResilienceEvaluation {
  const chronoAge = Math.min(100, Math.max(18, input.chronologicalAgeYears))
  const lacPyr = Math.max(1.0, input.glycolyticLactatePyruvateRatio ?? 12.0)
  const nadRatio = Math.max(0.5, input.nad_nadh_redox_ratio ?? 7.5)
  const bcaa = Math.max(0.1, input.bcaaMetaboliteAccumulation ?? 1.0)
  const kynTrp = Math.max(0.01, input.kynurenine_tryptophan_ratio ?? 0.04)
  const urea = Math.min(1.0, Math.max(0.05, input.ureaCycleClearanceEfficiency ?? 0.90))

  // 1. Pathway sub-scores (0.0 to 1.0, 1.0 is optimal)
  // OXPHOS / Redox: high NAD+/NADH and normal lactate/pyruvate ratio (~10-14)
  const lacScore = Math.max(0.0, 1.0 - Math.max(0, lacPyr - 14.0) * 0.04)
  const nadScore = Math.min(1.0, nadRatio / 8.5)
  const oxphosRedox = Number(((lacScore * 0.4) + (nadScore * 0.6)).toFixed(3))

  // Amino Acid Homeostasis: BCAA accumulation penalty
  const aaScore = Number(Math.max(0.1, 1.0 - Math.max(0, bcaa - 1.0) * 0.45).toFixed(3))

  // Ammonia Detoxification / Urea Cycle
  const ureaScore = Number(urea.toFixed(3))

  // Kynurenine Immune Axis: high ratio indicates chronic inflammatory IDO1 induction
  const kynScore = Number(Math.max(0.1, 1.0 - Math.max(0, kynTrp - 0.04) * 12.0).toFixed(3))

  // 2. Composite Bioenergetic Flexibility Index
  const bioFlexibility = Number(((oxphosRedox * 0.45) + (aaScore * 0.3) + (ureaScore * 0.25)).toFixed(3))

  // 3. Systemic Inflammaging Burden (inverse of Kynurenine score + redox stress)
  const inflammaging = Number(Math.min(1.0, Math.max(0.0, (1.0 - kynScore) * 0.65 + (1.0 - oxphosRedox) * 0.35)).toFixed(3))

  // 4. Overall Metabolic Resilience Score (0 to 100)
  const rawResilience = (bioFlexibility * 65.0) + (kynScore * 35.0)
  const resilienceScore = Number(Math.min(100.0, Math.max(5.0, rawResilience)).toFixed(1))

  // 5. Metabolic Age Delta Estimation
  // Expected decline per decade: ~2.5% loss of metabolic flexibility baseline
  // Divergence from expected age baseline produces acceleration or rejuvenation
  const baselineFlexibilityAtAge = Math.max(0.3, 1.0 - (chronoAge / 120.0))
  const deltaFlex = bioFlexibility - baselineFlexibilityAtAge
  // 0.1 delta in flexibility corresponds to ~4.5 years biological metabolic age shift
  const ageDelta = Number((-deltaFlex * 45.0 + (inflammaging - 0.25) * 8.0).toFixed(1))
  const estimatedAge = Number(Math.max(16.0, chronoAge + ageDelta).toFixed(1))

  // 6. Longevity Forecast Category
  let category: 'OPTIMAL_METABOLIC_LONGEVITY' | 'RESILIENT_BALANCED' | 'COMPENSATED_DECLINE' | 'ACCELERATED_METABOLIC_AGING' = 'RESILIENT_BALANCED'
  if (resilienceScore >= 85.0 && ageDelta <= -3.0) {
    category = 'OPTIMAL_METABOLIC_LONGEVITY'
  } else if (resilienceScore >= 65.0 && ageDelta <= 3.0) {
    category = 'RESILIENT_BALANCED'
  } else if (resilienceScore >= 45.0) {
    category = 'COMPENSATED_DECLINE'
  } else {
    category = 'ACCELERATED_METABOLIC_AGING'
  }

  return {
    chronologicalAgeYears: chronoAge,
    estimatedMetabolicAgeYears: estimatedAge,
    metabolicAgeDeltaYears: ageDelta,
    metabolicResilienceScore: resilienceScore,
    bioenergeticFlexibilityIndex: bioFlexibility,
    systemicInflammagingBurden: inflammaging,
    pathwayHealthBreakdown: {
      mitochondrialOxphosRedox: oxphosRedox,
      aminoAcidHomeostasis: aaScore,
      ammoniaDetoxification: ureaScore,
      kynurenineImmuneAxis: kynScore,
    },
    longevityForecastCategory: category,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Bordone et al. 2007 Cell Metab; Robinson et al. 2020 Nat Aging',
    },
  }
}
