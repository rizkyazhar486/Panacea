// src/lib/discovery/ribosomalFrameshiftingTranslationEngine.ts
// T-CLIN-97: Programmed -1 Ribosomal Frameshifting (-1 PRF) & uORF Translation Stress Engine

export interface RibosomalTranslationInput {
  slipperySequenceMotif: string // 7-nt motif: e.g. "UUUAAAC", "GGGAAAC", "AAAUUUU"
  spacerLengthNt: number // optimal spacer 5-9 nucleotides between slippery site and pseudoknot
  downstreamStructureType: 'H_TYPE_PSEUDOKNOT' | 'STABLE_STEM_LOOP' | 'UNSTRUCTURED_SINGLE_STRAND'
  pseudoknotStabilityDeltaGKcalMol?: number // thermodynamic stability (-12.0 to -35.0 kcal/mol)
  eif2AlphaPhosphorylationRatio?: number // Integrated Stress Response marker (0.05 to 0.95)
  upstreamUorfCount?: number // inhibitory uORFs in 5' UTR (0 to 4)
}

export interface FrameshiftingDynamicsEvaluation {
  slipperySiteConcordance: boolean
  frameshiftingEfficiencyPercentage: number // 0.0% to 45.0%
  ribosomalDwellTimeMs: number // pause duration at pseudoknot junction
  readingFrameBranching: {
    frameZeroCanonicalRatio: number // 0.0 - 1.0
    frameMinusOneShiftedRatio: number // 0.0 - 1.0
  }
  integratedStressResponseState: {
    eif2AlphaPhosphorylationRatio: number
    atf4TranslationalInductionFold: number
    globalProteinSynthesisAttenuationPercentage: number
  }
  biologicalFunctionContext: 'RETROVIRAL_GAG_POL_EQUILIBRIUM' | 'CELLULAR_PEG10_AUTOREGULATION' | 'ISR_SURVIVAL_TRANSLATION' | 'BASAL_CANONICAL'
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Brierley et al. 1989 Cell; Hinnebusch 2014 Mol Cell'
  }
}

/**
 * Validates canonical X_XXY_YYZ slippery heptanucleotide motif.
 */
function isValidSlipperyMotif(motif: string): boolean {
  if (motif.length !== 7) return false
  const [x1, x2, x3, y1, y2, y3] = motif.toUpperCase().split('')
  // X_XXY_YYZ rule: positions 1-3 must match X, positions 4-6 must match Y
  return x1 === x2 && x2 === x3 && y1 === y2 && y2 === y3
}

/**
 * Simulates programmed -1 ribosomal frameshifting (-1 PRF) kinetics and stress-induced uORF bypass translation.
 */
export function evaluateRibosomalFrameshiftingDynamics(input: RibosomalTranslationInput): FrameshiftingDynamicsEvaluation {
  const motif = input.slipperySequenceMotif.trim().toUpperCase()
  const isSlippery = isValidSlipperyMotif(motif)
  const spacer = Math.max(1, input.spacerLengthNt)
  const deltaG = Math.min(-2.0, Math.max(-45.0, input.pseudoknotStabilityDeltaGKcalMol ?? -18.0))
  const eif2p = Math.min(1.0, Math.max(0.01, input.eif2AlphaPhosphorylationRatio ?? 0.08))
  const uorfCount = Math.max(0, input.upstreamUorfCount ?? 1)

  // Ribosomal dwell time is proportional to thermodynamic stability of the downstream RNA barrier
  let dwellTime = 25.0 // baseline ms per elongation step
  if (input.downstreamStructureType === 'H_TYPE_PSEUDOKNOT') {
    dwellTime = Math.min(850.0, 50.0 + Math.abs(deltaG) * 18.0)
  } else if (input.downstreamStructureType === 'STABLE_STEM_LOOP') {
    dwellTime = Math.min(300.0, 30.0 + Math.abs(deltaG) * 8.0)
  }

  // Frameshifting efficiency: requires valid slippery motif, optimal 5-9 nt spacer, and stable pseudoknot
  let prfEfficiency = 0.0
  if (isSlippery && input.downstreamStructureType === 'H_TYPE_PSEUDOKNOT') {
    const spacerOptimalFactor = spacer >= 5 && spacer <= 9 ? 1.0 : Math.max(0.1, 1.0 - Math.abs(spacer - 7) * 0.2)
    const stabilityFactor = Math.min(1.0, Math.abs(deltaG) / 22.0)
    prfEfficiency = Number((Math.min(42.0, 28.0 * spacerOptimalFactor * stabilityFactor)).toFixed(1))
  } else if (isSlippery && input.downstreamStructureType === 'STABLE_STEM_LOOP') {
    prfEfficiency = Number((Math.min(12.0, 8.0 * (spacer >= 5 && spacer <= 9 ? 1.0 : 0.4))).toFixed(1))
  }

  const shiftedRatio = Number((prfEfficiency / 100.0).toFixed(3))
  const zeroRatio = Number((1.0 - shiftedRatio).toFixed(3))

  // Integrated Stress Response (ISR) uORF bypass kinetics
  // High eIF2a-P slows reinitiation, enabling scanning ribosomes to skip uORFs and translate ATF4
  const atf4Induction = eif2p > 0.35 && uorfCount > 0
    ? Number((1.0 + (eif2p - 0.35) * 6.5 * Math.min(2.0, uorfCount * 0.7)).toFixed(2))
    : 1.0
  const globalAttenuation = Number((Math.min(85.0, eif2p * 80.0)).toFixed(1))

  // Biological context
  let context: 'RETROVIRAL_GAG_POL_EQUILIBRIUM' | 'CELLULAR_PEG10_AUTOREGULATION' | 'ISR_SURVIVAL_TRANSLATION' | 'BASAL_CANONICAL' = 'BASAL_CANONICAL'
  if (atf4Induction > 2.0) {
    context = 'ISR_SURVIVAL_TRANSLATION'
  } else if (prfEfficiency >= 15.0) {
    context = 'RETROVIRAL_GAG_POL_EQUILIBRIUM'
  } else if (prfEfficiency > 2.0) {
    context = 'CELLULAR_PEG10_AUTOREGULATION'
  } else {
    context = 'BASAL_CANONICAL'
  }

  return {
    slipperySiteConcordance: isSlippery,
    frameshiftingEfficiencyPercentage: prfEfficiency,
    ribosomalDwellTimeMs: Number(dwellTime.toFixed(1)),
    readingFrameBranching: {
      frameZeroCanonicalRatio: zeroRatio,
      frameMinusOneShiftedRatio: shiftedRatio,
    },
    integratedStressResponseState: {
      eif2AlphaPhosphorylationRatio: Number(eif2p.toFixed(3)),
      atf4TranslationalInductionFold: atf4Induction,
      globalProteinSynthesisAttenuationPercentage: globalAttenuation,
    },
    biologicalFunctionContext: context,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Brierley et al. 1989 Cell; Hinnebusch 2014 Mol Cell',
    },
  }
}
