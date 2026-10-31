// src/lib/discovery/primaryCiliumHedgehogIftEngine.ts
// T-CLIN-122: Primary Cilium Hedgehog Signaling & Intraflagellar Transport (IFT) Engine

export interface PrimaryCiliumInput {
  ciliumLengthMicrons?: number // normal 2.0 to 6.0 um; shortened < 1.5 um
  iftBComplexAnterogradeActivityRatio: number // IFT88/kinesin-2: normal 1.0; mutated < 0.30
  iftAComplexRetrogradeActivityRatio?: number // IFT140/dynein-2: normal 1.0
  sonicHedgehogLigandPresent: boolean // Shh ligand presence
  ptch1ReceptorFunctionalStatus: 'WILD_TYPE_INHIBITORY' | 'PTCH1_LOSS_OF_FUNCTION_MUTANT'
  smoothenedAntagonistVismodegibNm?: number // Smo inhibitor (0 to 500 nM)
}

export interface PrimaryCiliumEvaluation {
  ciliumStructuralIntegrityScore: number // 0.0 - 1.0 (axoneme maintenance)
  ciliarySmoothenedAccumulationIndex: number // 0.0 - 1.0 (Smo localization to ciliary membrane)
  gliTranscriptionFactorActivationRatio: number // GliA / GliR ratio (normal repressed < 0.25; activated > 2.0)
  hedgehogTargetGeneInductionTier: 'PATHWAY_REPRESSED_BASAL' | 'PHYSIOLOGICAL_DEVELOPMENTAL_SIGNAL' | 'CONSTITUTIVE_ONCOGENIC_DRIVE'
  ciliopathyPhenotypeVulnerabilityTier: 'NORMAL_SENSORY_ANTENNA' | 'MILD_IFT_DEFECT' | 'SEVERE_CYSTIC_CILIOPATHY_RISK'
  vismodegibPathwaySuppressionPercentage: number
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Goetz & Anderson 2010 Nat Rev Genet; Rohatgi et al. 2007 Science'
  }
}

/**
 * Simulates primary ciliary intraflagellar transport (IFT88/IFT140), Smoothened ciliary trafficking, and Gli transcriptional activation.
 */
export function evaluatePrimaryCiliumHedgehogDynamics(input: PrimaryCiliumInput): PrimaryCiliumEvaluation {
  const lengthUm = Math.min(10.0, Math.max(0.5, input.ciliumLengthMicrons ?? 3.5))
  const iftB = Math.min(1.5, Math.max(0.05, input.iftBComplexAnterogradeActivityRatio))
  const iftA = Math.min(1.5, Math.max(0.05, input.iftAComplexRetrogradeActivityRatio ?? 1.0))
  const vismodegib = Math.max(0.0, input.smoothenedAntagonistVismodegibNm ?? 0.0)

  // Ciliary structural integrity: dependent on balanced anterograde (IFT-B) and retrograde (IFT-A) transport
  const lengthFactor = Math.min(1.0, lengthUm / 3.0)
  const integrity = Number((Math.min(1.0, Math.max(0.05, (iftB * 0.55 + iftA * 0.45) * lengthFactor))).toFixed(3))

  // Smoothened inhibition by Vismodegib (IC50 ~ 15 nM)
  const vismoFactor = vismodegib > 0.0 ? 1.0 / (1.0 + vismodegib / 15.0) : 1.0
  const vismoSuppressionPct = Number(((1.0 - vismoFactor) * 100.0).toFixed(1))

  // Smoothened translocation into cilium: occurs when Shh is present or when Ptch1 is lost
  const ptch1Lost = input.ptch1ReceptorFunctionalStatus === 'PTCH1_LOSS_OF_FUNCTION_MUTANT'
  const isPathwayTriggered = input.sonicHedgehogLigandPresent || ptch1Lost

  let smoIndex = 0.05 // basal cytosolic/extraciliary Smo
  if (isPathwayTriggered && integrity > 0.3) {
    smoIndex = Math.min(1.0, 0.92 * integrity * vismoFactor)
  }
  const roundedSmo = Number(smoIndex.toFixed(3))

  // GliA / GliR transcription factor ratio
  // In absence of Smo, Gli3 is phosphorylated by PKA and cleaved to Gli3R (repressor, ratio ~ 0.15)
  // When Smo is active at ciliary tip, it inhibits SuFu and prevents cleavage, yielding GliA (activator, ratio > 3.0)
  const baseGliRatio = 0.15
  const gliRatio = Number((baseGliRatio + roundedSmo * 3.8).toFixed(2))

  // Induction tier
  let tier: 'PATHWAY_REPRESSED_BASAL' | 'PHYSIOLOGICAL_DEVELOPMENTAL_SIGNAL' | 'CONSTITUTIVE_ONCOGENIC_DRIVE' = 'PATHWAY_REPRESSED_BASAL'
  if (ptch1Lost && roundedSmo > 0.6) {
    tier = 'CONSTITUTIVE_ONCOGENIC_DRIVE' // classic basal cell carcinoma / medulloblastoma mechanism
  } else if (gliRatio >= 1.5) {
    tier = 'PHYSIOLOGICAL_DEVELOPMENTAL_SIGNAL'
  } else {
    tier = 'PATHWAY_REPRESSED_BASAL'
  }

  // Ciliopathy risk
  let ciliopathyTier: 'NORMAL_SENSORY_ANTENNA' | 'MILD_IFT_DEFECT' | 'SEVERE_CYSTIC_CILIOPATHY_RISK' = 'NORMAL_SENSORY_ANTENNA'
  if (integrity < 0.35 || iftB < 0.25) {
    ciliopathyTier = 'SEVERE_CYSTIC_CILIOPATHY_RISK'
  } else if (integrity < 0.70) {
    ciliopathyTier = 'MILD_IFT_DEFECT'
  } else {
    ciliopathyTier = 'NORMAL_SENSORY_ANTENNA'
  }

  return {
    ciliumStructuralIntegrityScore: integrity,
    ciliarySmoothenedAccumulationIndex: roundedSmo,
    gliTranscriptionFactorActivationRatio: gliRatio,
    hedgehogTargetGeneInductionTier: tier,
    ciliopathyPhenotypeVulnerabilityTier: ciliopathyTier,
    vismodegibPathwaySuppressionPercentage: vismoSuppressionPct,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Goetz & Anderson 2010 Nat Rev Genet; Rohatgi et al. 2007 Science',
    },
  }
}
