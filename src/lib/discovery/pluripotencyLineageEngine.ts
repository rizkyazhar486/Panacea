// src/lib/discovery/pluripotencyLineageEngine.ts
// PanaceaMed T-CLIN-79: Pluripotency Gene Regulatory Network & Directed Lineage Commitment Synthesizer

export type GermLayerTarget = 'ECTODERM_NEURAL' | 'MESODERM_CARDIAC' | 'ENDODERM_HEPATIC' | 'PLURIPOTENT_NAIVE' | 'PLURIPOTENT_PRIMED'

export interface CoreTranscriptionFactorNetwork {
  oct4_level: number // 0.0 - 1.0 (POU5F1 expression)
  sox2_level: number // 0.0 - 1.0
  nanog_level: number // 0.0 - 1.0
  klf4_level: number // 0.0 - 1.0
  myc_level: number // 0.0 - 1.0
}

export interface SignalingEnvironmentInput {
  targetLayer: GermLayerTarget
  dualSmadInhibitionDays?: number // Noggin + SB431542 (Ectoderm induction)
  wntActivationChirDays?: number // CHIR99021 (Mesoderm induction)
  activinAHighNgMl?: number // e.g. 100 ng/mL (Definitive Endoderm induction)
  bFGFConcentrationNgMl?: number // Pluripotency maintenance
  cultureDurationDays?: number
  coreNetwork?: Partial<CoreTranscriptionFactorNetwork>
}

export interface LineageDifferentiationProfile {
  targetLayer: GermLayerTarget
  pluripotencyScore: number // 0.0 - 1.0 (1.0 = fully naive/primed pluripotent)
  lineagePurityPercentage: number // 0.0 - 100.0%
  dominantMarkerExpression: {
    marker: string
    foldInductionVsUndifferentiated: number
  }
  bivalentPromoterPoisingIndex: number // 0.0 - 1.0 (H3K4me3 / H3K27me3 balance)
  residualOct4TeratomaRiskFraction: number // Fraction of residual undifferentiated cells
  teratomaSafetyClearancePassed: boolean // True ONLY if residual OCT4/NANOG < 0.0001
  truthClass: 'mechanistic_simulation_proxy'
  clinically_reviewed: false
  patientTruthUncompromised: true
  neverManufacturesBiomarkers: true
}

/**
 * Calculates core pluripotency network stability based on OCT4, SOX2, and NANOG co-expression.
 */
export function calculatePluripotencyStability(tf: CoreTranscriptionFactorNetwork): number {
  // Oct4 has a narrow stoichiometric window: too low (<0.3) induces trophectoderm; too high (>0.85) induces endoderm/mesoderm
  const oct4Deviation = Math.abs(tf.oct4_level - 0.55)
  const oct4Score = Math.max(0.0, 1.0 - oct4Deviation * 2.0)

  // SOX2 and NANOG synergy: levels at or above ~0.6 reflect robust pluripotent ground state
  const sox2Score = Math.min(1.0, Math.max(0.0, tf.sox2_level / 0.6))
  const nanogScore = Math.min(1.0, Math.max(0.0, tf.nanog_level / 0.6))
  const cooperativeSynergy = (tf.klf4_level ?? 0.5) >= 0.4 && (tf.myc_level ?? 0.4) >= 0.3 ? 0.05 : 0.0

  const composite = (oct4Score * 0.4) + (sox2Score * 0.3) + (nanogScore * 0.3) + cooperativeSynergy
  return Number(Math.min(1.0, Math.max(0.0, composite)).toFixed(3))
}

/**
 * Simulates directed lineage differentiation and evaluates teratoma clearance safety.
 */
export function simulateDirectedDifferentiation(input: SignalingEnvironmentInput): LineageDifferentiationProfile {
  const days = Math.max(1, input.cultureDurationDays ?? 7)
  const dualSmad = Math.max(0, input.dualSmadInhibitionDays ?? 0)
  const chir = Math.max(0, input.wntActivationChirDays ?? 0)
  const activin = Math.max(0, input.activinAHighNgMl ?? 0)

  const tf: CoreTranscriptionFactorNetwork = {
    oct4_level: input.coreNetwork?.oct4_level ?? 0.55,
    sox2_level: input.coreNetwork?.sox2_level ?? 0.6,
    nanog_level: input.coreNetwork?.nanog_level ?? 0.5,
    klf4_level: input.coreNetwork?.klf4_level ?? 0.5,
    myc_level: input.coreNetwork?.myc_level ?? 0.4,
  }

  let pluripotency = calculatePluripotencyStability(tf)
  let purity = 0.0
  let primaryMarker = 'OCT4'
  let foldInduction = 1.0
  let bivalentPoising = 0.85

  switch (input.targetLayer) {
    case 'PLURIPOTENT_NAIVE':
    case 'PLURIPOTENT_PRIMED':
      purity = 98.5
      primaryMarker = 'NANOG'
      foldInduction = 1.0
      bivalentPoising = 0.92
      break

    case 'ECTODERM_NEURAL':
      // Dual-SMAD inhibition over 5-8 days extinguishes pluripotency and drives PAX6/SOX1
      const smadEffect = Math.min(1.0, dualSmad / 6.0)
      pluripotency = Number((pluripotency * Math.exp(-0.8 * dualSmad)).toFixed(5))
      purity = Number((smadEffect * 94.0).toFixed(1))
      primaryMarker = 'PAX6'
      foldInduction = Number((1.0 + smadEffect * 48.0).toFixed(1))
      bivalentPoising = Number((0.2 + (1.0 - smadEffect) * 0.6).toFixed(3))
      break

    case 'MESODERM_CARDIAC':
      // CHIR pulse drives BRACHYURY (T) followed by Wnt inhibition
      const chirEffect = Math.min(1.0, chir / 2.0)
      pluripotency = Number((pluripotency * Math.exp(-0.9 * chir)).toFixed(5))
      purity = Number((chirEffect * 88.5).toFixed(1))
      primaryMarker = 'BRACHYURY_T'
      foldInduction = Number((1.0 + chirEffect * 75.0).toFixed(1))
      bivalentPoising = Number((0.15 + (1.0 - chirEffect) * 0.6).toFixed(3))
      break

    case 'ENDODERM_HEPATIC':
      // High Activin A (>80 ng/mL) drives SOX17/FOXA2
      const activinEffect = Math.min(1.0, activin / 100.0) * Math.min(1.0, days / 4.0)
      pluripotency = Number((pluripotency * Math.exp(-0.75 * (activin / 50.0))).toFixed(5))
      purity = Number((activinEffect * 91.0).toFixed(1))
      primaryMarker = 'SOX17'
      foldInduction = Number((1.0 + activinEffect * 62.0).toFixed(1))
      bivalentPoising = Number((0.18 + (1.0 - activinEffect) * 0.6).toFixed(3))
      break
  }

  // Teratoma Safety Invariant: Residual pluripotent fraction must be < 1 in 10,000 (<0.0001)
  const residualPluripotent = input.targetLayer.startsWith('PLURIPOTENT')
    ? 1.0
    : Number((pluripotency * Math.pow(0.5, days)).toFixed(6))
  const clearancePassed = input.targetLayer.startsWith('PLURIPOTENT') ? false : residualPluripotent < 0.0001

  return {
    targetLayer: input.targetLayer,
    pluripotencyScore: pluripotency,
    lineagePurityPercentage: purity,
    dominantMarkerExpression: {
      marker: primaryMarker,
      foldInductionVsUndifferentiated: foldInduction,
    },
    bivalentPromoterPoisingIndex: bivalentPoising,
    residualOct4TeratomaRiskFraction: residualPluripotent,
    teratomaSafetyClearancePassed: clearancePassed,
    truthClass: 'mechanistic_simulation_proxy',
    clinically_reviewed: false,
    patientTruthUncompromised: true,
    neverManufacturesBiomarkers: true,
  }
}
