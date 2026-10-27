// src/lib/discovery/retrotransposonLine1ActivationEngine.ts
// T-CLIN-102: Retrotransposon LINE-1 (L1) Activation, Target-Primed Reverse Transcription & Somatic Mosaicism Engine

export interface Line1ActivationInput {
  cellTypeContext: 'POST_MITOTIC_CORTICAL_NEURON' | 'SENESCENT_ASTROCYTE' | 'PERIPHERAL_FIBROBLAST' | 'HEMATOPOIETIC_STEM_CELL'
  l1Promoter5UtrCpGMethylationFraction: number // youth > 0.85; senescent/aged drops < 0.40
  orf1pCytoplasmicAbundanceIndex?: number // 0.0 - 1.0 (L1 RNP formation)
  cellularSenescenceDurationDays?: number // days post senescence entry
  reverseTranscriptaseInhibitorLamivudineUm?: number // 3TC NRTI concentration (0.0 to 50.0 uM)
}

export interface Line1RetrotranspositionEvaluation {
  cellTypeContext: 'POST_MITOTIC_CORTICAL_NEURON' | 'SENESCENT_ASTROCYTE' | 'PERIPHERAL_FIBROBLAST' | 'HEMATOPOIETIC_STEM_CELL'
  l1TranscriptionDerepressionFold: number // fold elevation above basal silenced state
  targetPrimedReverseTranscriptionRate: number // TPRT events proxy per 1000 cells/day
  cytoplasmicCdnaBurdenArbitraryUnits: number // dsDNA/ssDNA fragments triggering cGAS
  cgasStingInterferonBetaInductionFold: number // IFN-I inflammaging activation
  somaticInsertionMosaicismRiskTier: 'NEGLIGIBLE_EPIGENETICALLY_SILENCED' | 'MODERATE_NEURODEGENERATIVE_DRIFT' | 'HIGH_GENOMIC_RETROINSERTION_STORM'
  lamivudineOrf2pInhibitionPercentage: number
  remedialNeuroprotectionStatus: 'BASAL_HOMEOSTASIS' | 'PARTIALLY_SUPPRESSED_BY_NRTI' | 'PATHOLOGICAL_INFLAMMAGING_ACTIVE'
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'De Cecco et al. 2019 Nature; Muotri et al. 2005 Nature'
  }
}

/**
 * Simulates epigenetic derepression of LINE-1 retrotransposons, ORF1p/ORF2p reverse transcription, and cGAS-STING neuroinflammation.
 */
export function evaluateLine1RetrotranspositionDynamics(input: Line1ActivationInput): Line1RetrotranspositionEvaluation {
  const meth = Math.min(1.0, Math.max(0.05, input.l1Promoter5UtrCpGMethylationFraction))
  const orf1Base = input.orf1pCytoplasmicAbundanceIndex ?? Math.max(0.02, (1.0 - meth) * 0.95)
  const senDays = Math.max(0, input.cellularSenescenceDurationDays ?? 0)
  const lamivudine = Math.max(0.0, input.reverseTranscriptaseInhibitorLamivudineUm ?? 0.0)

  // Derepression scales non-linearly when methylation drops below critical 0.50 threshold
  const derepressionFold = meth >= 0.70
    ? 1.0 + (1.0 - meth) * 2.0
    : Number((1.6 + Math.pow((0.70 - meth) * 3.5, 2.2) * (1.0 + senDays * 0.08)).toFixed(1))

  // Lamivudine (3TC) inhibits ORF2p reverse transcriptase: IC50 ~ 2.5 uM
  const nrtiInhibition = lamivudine > 0.0
    ? Number(((lamivudine / (lamivudine + 2.5)) * 94.0).toFixed(1))
    : 0.0

  const effectiveRtActivity = (1.0 - nrtiInhibition / 100.0)

  // Target-primed reverse transcription (TPRT) rate
  const tprtRate = Number((Math.max(0.01, derepressionFold * orf1Base * 4.5 * effectiveRtActivity)).toFixed(2))

  // Cytoplasmic cDNA accumulation and cGAS-STING response
  const cdnaBurden = Number((Math.max(0.1, (derepressionFold - 1.0 + (1.0 - meth)) * 7.5 * effectiveRtActivity)).toFixed(1))
  const cgasFold = Number((Math.min(35.0, 1.0 + (cdnaBurden / 4.0) * 2.8)).toFixed(1))

  // Risk categorization
  let riskTier: 'NEGLIGIBLE_EPIGENETICALLY_SILENCED' | 'MODERATE_NEURODEGENERATIVE_DRIFT' | 'HIGH_GENOMIC_RETROINSERTION_STORM' = 'NEGLIGIBLE_EPIGENETICALLY_SILENCED'
  if (tprtRate > 8.0 || cdnaBurden > 25.0) {
    riskTier = 'HIGH_GENOMIC_RETROINSERTION_STORM'
  } else if (tprtRate > 1.5 || cdnaBurden > 5.0) {
    riskTier = 'MODERATE_NEURODEGENERATIVE_DRIFT'
  } else {
    riskTier = 'NEGLIGIBLE_EPIGENETICALLY_SILENCED'
  }

  let neuroprotection: 'BASAL_HOMEOSTASIS' | 'PARTIALLY_SUPPRESSED_BY_NRTI' | 'PATHOLOGICAL_INFLAMMAGING_ACTIVE' = 'BASAL_HOMEOSTASIS'
  if (nrtiInhibition > 50.0) {
    neuroprotection = 'PARTIALLY_SUPPRESSED_BY_NRTI'
  } else if (riskTier !== 'NEGLIGIBLE_EPIGENETICALLY_SILENCED') {
    neuroprotection = 'PATHOLOGICAL_INFLAMMAGING_ACTIVE'
  } else {
    neuroprotection = 'BASAL_HOMEOSTASIS'
  }

  return {
    cellTypeContext: input.cellTypeContext,
    l1TranscriptionDerepressionFold: derepressionFold,
    targetPrimedReverseTranscriptionRate: tprtRate,
    cytoplasmicCdnaBurdenArbitraryUnits: cdnaBurden,
    cgasStingInterferonBetaInductionFold: cgasFold,
    somaticInsertionMosaicismRiskTier: riskTier,
    lamivudineOrf2pInhibitionPercentage: nrtiInhibition,
    remedialNeuroprotectionStatus: neuroprotection,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'De Cecco et al. 2019 Nature; Muotri et al. 2005 Nature',
    },
  }
}
