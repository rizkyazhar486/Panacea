// src/lib/discovery/telomereMaintenanceShelterinEngine.ts
// T-CLIN-92: Telomere Length Dynamics, Shelterin Capping & ALT Recombination Engine

export type TelomereMaintenancePathway =
  | 'CANONICAL_TELOMERASE_ACTIVE'
  | 'TELOMERASE_SILENCED_CANONICAL_EROSION'
  | 'ALT_HOMOLOGOUS_RECOMBINATION'
  | 'CRITICAL_TELOMERE_UNCAPPED'

export interface TelomereStateInput {
  meanTelomereLengthKb: number // normal newborn ~11 kb, young adult ~8 kb, aged adult ~4-6 kb, critical crisis < 3.2 kb
  shelterinTrf2ExpressionRatio?: number // 0.0 - 1.0 (protects against ATM kinase DSB recognition)
  shelterinPot1ExpressionRatio?: number // 0.0 - 1.0 (protects 3' overhang against ATR kinase)
  hTertExpressionScore?: number // 0.0 - 1.0 (0.0 in somatic cells, 0.7-1.0 in stem/cancer cells)
  atrxDaxxLossPresent?: boolean // loss of ATRX/DAXX enables ALT pathway
  apbFociCountPerNucleus?: number // ALT-associated PML bodies
}

export interface TelomereDynamicsEvaluation {
  meanTelomereLengthKb: number
  activeMaintenancePathway: TelomereMaintenancePathway
  shelterinCappingIntegrityScore: number // 0.0 - 1.0 (1.0 = robust shelterin protection)
  telomereDysfunctionInducedFociCount: number // TIF count (gamma-H2AX / 53BP1 colocalization at telomeres)
  cellularReplicativeCapacity: 'UNLIMITED_IMMORTALIZED' | 'NORMAL_HAYFLICK_PROGRESSION' | 'SENESCENT_CRISIS_ARREST'
  attritionRateBpPerDivision: number // base pairs lost per cell division
  estimatedDoublingsRemaining: number // Hayflick limit estimate
  genomicInstabilityRisk: 'NEGLIGIBLE' | 'LOW' | 'ELEVATED_END_TO_END_FUSION_RISK' | 'EXTREME_DICENTRIC_CRISIS'
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'de Lange 2005 Genes Dev; Cesare & Reddel 2010 Nat Rev Genet'
  }
}

/**
 * Simulates telomere erosion dynamics, shelterin complex protection, telomerase activity, and ALT recombination.
 */
export function evaluateTelomereMaintenanceDynamics(input: TelomereStateInput): TelomereDynamicsEvaluation {
  const lengthKb = Math.max(0.5, Math.min(25.0, input.meanTelomereLengthKb))
  const trf2 = Math.min(1.0, Math.max(0.0, input.shelterinTrf2ExpressionRatio ?? 0.85))
  const pot1 = Math.min(1.0, Math.max(0.0, input.shelterinPot1ExpressionRatio ?? 0.85))
  const htert = Math.min(1.0, Math.max(0.0, input.hTertExpressionScore ?? 0.0))
  const atrxLoss = input.atrxDaxxLossPresent ?? false
  const apbCount = Math.max(0, input.apbFociCountPerNucleus ?? 0)

  // Shelterin capping integrity: weighted combination of TRF2 (T-loop) and POT1 (3' overhang)
  const lengthDiscount = lengthKb < 4.0 ? Math.max(0.1, (lengthKb - 1.5) / 2.5) : 1.0
  const cappingScore = Number((Math.min(1.0, (trf2 * 0.55 + pot1 * 0.45) * lengthDiscount)).toFixed(3))

  // Pathway determination
  let pathway: TelomereMaintenancePathway = 'TELOMERASE_SILENCED_CANONICAL_EROSION'
  if (htert >= 0.35) {
    pathway = 'CANONICAL_TELOMERASE_ACTIVE'
  } else if (atrxLoss && apbCount >= 5) {
    pathway = 'ALT_HOMOLOGOUS_RECOMBINATION'
  } else if (lengthKb < 3.2 || cappingScore < 0.30) {
    pathway = 'CRITICAL_TELOMERE_UNCAPPED'
  } else {
    pathway = 'TELOMERASE_SILENCED_CANONICAL_EROSION'
  }

  // TIFs (Telomere dysfunction-induced foci)
  let tifCount = 0
  if (pathway === 'CRITICAL_TELOMERE_UNCAPPED') {
    tifCount = Math.min(15, Math.round((1.0 - cappingScore) * 12.0 + Math.max(0, 3.5 - lengthKb) * 4))
  } else if (lengthKb < 4.5) {
    tifCount = Math.min(4, Math.round((4.5 - lengthKb) * 2.0))
  }

  // Attrition rate (bp per cell division)
  let attrition = 50.0 // standard end-replication problem
  if (pathway === 'CANONICAL_TELOMERASE_ACTIVE') {
    attrition = Math.max(0.0, 50.0 - htert * 55.0) // telomerase counteracts erosion
  } else if (pathway === 'ALT_HOMOLOGOUS_RECOMBINATION') {
    attrition = 0.0 // stochastic recombination sustains length
  }

  // Estimated replicative doublings remaining
  let doublings = 0
  let replicativeState: 'UNLIMITED_IMMORTALIZED' | 'NORMAL_HAYFLICK_PROGRESSION' | 'SENESCENT_CRISIS_ARREST' = 'NORMAL_HAYFLICK_PROGRESSION'

  if (pathway === 'CANONICAL_TELOMERASE_ACTIVE' || pathway === 'ALT_HOMOLOGOUS_RECOMBINATION') {
    doublings = 999
    replicativeState = 'UNLIMITED_IMMORTALIZED'
  } else if (lengthKb <= 3.2 || tifCount >= 5) {
    doublings = 0
    replicativeState = 'SENESCENT_CRISIS_ARREST'
  } else {
    doublings = Math.max(0, Math.round(((lengthKb - 3.2) * 1000) / (attrition || 50)))
    replicativeState = 'NORMAL_HAYFLICK_PROGRESSION'
  }

  // Genomic instability risk
  let risk: 'NEGLIGIBLE' | 'LOW' | 'ELEVATED_END_TO_END_FUSION_RISK' | 'EXTREME_DICENTRIC_CRISIS' = 'NEGLIGIBLE'
  if (lengthKb < 2.0 && cappingScore < 0.25) {
    risk = 'EXTREME_DICENTRIC_CRISIS'
  } else if (pathway === 'CRITICAL_TELOMERE_UNCAPPED') {
    risk = 'ELEVATED_END_TO_END_FUSION_RISK'
  } else if (lengthKb < 4.5) {
    risk = 'LOW'
  } else {
    risk = 'NEGLIGIBLE'
  }

  return {
    meanTelomereLengthKb: lengthKb,
    activeMaintenancePathway: pathway,
    shelterinCappingIntegrityScore: cappingScore,
    telomereDysfunctionInducedFociCount: tifCount,
    cellularReplicativeCapacity: replicativeState,
    attritionRateBpPerDivision: Number(attrition.toFixed(1)),
    estimatedDoublingsRemaining: doublings,
    genomicInstabilityRisk: risk,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'de Lange 2005 Genes Dev; Cesare & Reddel 2010 Nat Rev Genet',
    },
  }
}
