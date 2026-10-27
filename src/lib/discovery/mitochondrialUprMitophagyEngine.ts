// src/lib/discovery/mitochondrialUprMitophagyEngine.ts
// T-CLIN-91: Mitochondrial Unfolded Protein Response (UPRmt) & PINK1-Parkin Mitophagy Clearance Engine

export interface MitochondrialStateInput {
  membranePotentialDeltaPsiMv: number // normal: -180 to -140 mV; depolarized: > -100 mV (e.g. -60 mV)
  matrixMisfoldedProteinRatio: number // 0.0 - 1.0 (relative proteotoxic load)
  pink1AccumulationIndex?: number // 0.0 - 1.0 (outer mitochondrial membrane accumulation)
  parkinActivationScore?: number // 0.0 - 1.0 (p-Ser65 ubiquitin recruitment)
  atf5RetrogradeSignalingActive?: boolean // mitochondrial retrograde stress signaling to nucleus
  lysosomalAcidityPh?: number // normal 4.5 - 5.0; impaired > 5.5
}

export interface MitophagyFluxEvaluation {
  membranePotentialMv: number
  mitochondrialViabilityStatus: 'HEALTHY_POLARIZED' | 'STRESSED_UPRMT_COMPENSATION' | 'DEPOLARIZED_MITOPHAGY_COMMITTED' | 'FRAGMENTED_CYTOTOXIC'
  pink1ParkinPrimingScore: number // 0.0 - 1.0
  ubiquitinPhosphorylationRate: number // 0.0 - 1.0 (p-Ser65-Ub)
  mfn1Mfn2DegradationPercentage: number // fusion block to isolate damaged organelle
  autophagosomalEngulfmentRatio: number // LC3-II / OPTN recruitment (0.0 - 1.0)
  lysosomalClearanceCompletionPercentage: number // acidic digestion completion
  uprmtRetrogradeResponse: {
    chaperoneUpregulationFold: number // Hsp60 / mtHsp70 induction
    proteaseClpPActivity: number // matrix protein quality control
    retrogradeCompensationSufficient: boolean
  }
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Pickrell & Youle 2015 Neuron; Jovaisaite et al. 2014 Cell Metab'
  }
}

/**
 * Simulates mitochondrial proteotoxic stress, UPRmt retrograde compensation, and PINK1-Parkin mitophagy clearance.
 */
export function evaluateMitochondrialQualityControl(input: MitochondrialStateInput): MitophagyFluxEvaluation {
  const dPsi = Math.min(-20, Math.max(-200, input.membranePotentialDeltaPsiMv))
  const misfolded = Math.min(1.0, Math.max(0.0, input.matrixMisfoldedProteinRatio))
  const lysoPh = Math.min(7.4, Math.max(4.0, input.lysosomalAcidityPh ?? 4.8))

  // Depolarization threshold: membrane potential less negative than -100 mV triggers PINK1 stabilization
  const isDepolarized = dPsi > -105.0
  const depolSeverity = Math.min(1.0, Math.max(0.0, (dPsi + 140.0) / 80.0)) // 0.0 at -140 mV, 1.0 at -60 mV

  // PINK1-Parkin priming kinetics
  const pink1Base = input.pink1AccumulationIndex ?? (isDepolarized ? Math.min(1.0, 0.4 + depolSeverity * 0.6) : 0.05)
  const parkinBase = input.parkinActivationScore ?? (pink1Base > 0.3 ? pink1Base * 0.95 : 0.02)
  const pSer65Ub = Number((pink1Base * 0.85 + parkinBase * 0.15).toFixed(3))

  // MFN1/MFN2 degradation (prevents damaged mitochondria from re-fusing into healthy reticulum)
  const mfnDegradation = isDepolarized ? Number(Math.min(98.0, 30.0 + parkinBase * 68.0).toFixed(1)) : 5.0

  // Autophagosomal recruitment (OPTN / NDP52 binding p-Ub and LC3-II)
  const autophagosomeRatio = Number((Math.min(1.0, parkinBase * 0.9 + (isDepolarized ? 0.1 : 0.0))).toFixed(3))

  // Lysosomal clearance efficiency: requires acidic pH (< 5.2)
  const acidMultiplier = lysoPh <= 5.0 ? 1.0 : Math.max(0.1, 1.0 - (lysoPh - 5.0) * 0.7)
  const clearancePct = isDepolarized
    ? Number((autophagosomeRatio * 90.0 * acidMultiplier).toFixed(1))
    : Number((10.0 * acidMultiplier).toFixed(1))

  // UPRmt retrograde signaling (ATF5 / CHOP induction)
  const atf5Active = input.atf5RetrogradeSignalingActive ?? (misfolded > 0.35)
  const chaperoneFold = atf5Active
    ? Number((1.0 + misfolded * 3.5).toFixed(2))
    : Number((1.0 + misfolded * 0.5).toFixed(2))
  const clpP = Number((Math.min(1.0, 0.2 + misfolded * 0.8)).toFixed(2))
  const compSufficient = !isDepolarized && misfolded < 0.65 && atf5Active

  // Viability classification
  let viability: 'HEALTHY_POLARIZED' | 'STRESSED_UPRMT_COMPENSATION' | 'DEPOLARIZED_MITOPHAGY_COMMITTED' | 'FRAGMENTED_CYTOTOXIC' = 'HEALTHY_POLARIZED'
  if (isDepolarized && clearancePct < 30.0 && autophagosomeRatio > 0.5) {
    viability = 'FRAGMENTED_CYTOTOXIC'
  } else if (isDepolarized) {
    viability = 'DEPOLARIZED_MITOPHAGY_COMMITTED'
  } else if (misfolded > 0.3) {
    viability = 'STRESSED_UPRMT_COMPENSATION'
  } else {
    viability = 'HEALTHY_POLARIZED'
  }

  return {
    membranePotentialMv: dPsi,
    mitochondrialViabilityStatus: viability,
    pink1ParkinPrimingScore: Number(pink1Base.toFixed(3)),
    ubiquitinPhosphorylationRate: pSer65Ub,
    mfn1Mfn2DegradationPercentage: mfnDegradation,
    autophagosomalEngulfmentRatio: autophagosomeRatio,
    lysosomalClearanceCompletionPercentage: clearancePct,
    uprmtRetrogradeResponse: {
      chaperoneUpregulationFold: chaperoneFold,
      proteaseClpPActivity: clpP,
      retrogradeCompensationSufficient: compSufficient,
    },
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Pickrell & Youle 2015 Neuron; Jovaisaite et al. 2014 Cell Metab',
    },
  }
}
