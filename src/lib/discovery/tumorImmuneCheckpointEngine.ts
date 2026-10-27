// src/lib/discovery/tumorImmuneCheckpointEngine.ts
// T-CLIN-93: Tumor Microenvironment Immune Evasion & Checkpoint Receptor Kinetics Engine (PD-1/PD-L1 & CTLA-4)

export type CheckpointInhibitorAgent =
  | 'ANTI_PD1_PEMBROLIZUMAB'
  | 'ANTI_PDL1_ATEZOLIZUMAB'
  | 'ANTI_CTLA4_IPILIMUMAB'
  | 'COMBINED_PD1_CTLA4_BLOCKADE'
  | 'VEHICLE_CONTROL'

export interface TumorMicroenvironmentInput {
  tumorPdl1TumorProportionScorePercent: number // TPS: 0% to 100% (e.g. <1% negative, 1-49% intermediate, >=50% high)
  cd8TumorInfiltratingLymphocyteDensityPerMm2: number // cold < 100, intermediate 100-500, hot > 500
  cd8ExhaustionMarkerRatio?: number // PD-1+ TIM-3+ CD8 fraction (0.0 - 1.0)
  tumorMutationalBurdenMutsPerMb?: number // TMB: low < 6, intermediate 6-9, high >= 10
  microsatelliteInstabilityStatus?: 'MSI_HIGH' | 'MSS_STABLE'
  therapeuticIntervention: CheckpointInhibitorAgent
}

export interface ImmuneCheckpointEvaluation {
  immunophenotypeClass: 'IMMUNE_DESERT_COLD' | 'IMMUNE_EXCLUDED' | 'IMMUNE_INFLAMED_HOT'
  pdl1ExpressionTier: 'TPS_NEGATIVE_LESS_THAN_1' | 'TPS_INTERMEDIATE_1_TO_49' | 'TPS_HIGH_GREATER_THAN_50'
  shp2DephosphorylationInhibitionPercentage: number // extent of TCR/CD28 pathway restoration
  cytotoxicReactivationIndex: number // 0.0 - 1.0 (Granzyme B / Perforin release potential)
  predictedObjectiveResponseRatePercent: number // 0% - 95%
  immuneRelatedAdverseEventRisk: 'MINIMAL' | 'MODERATE_ENDOCRINE_SKIN' | 'HIGH_AUTOIMMUNE_COLITIS_HEPATITIS'
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Pardoll 2012 Nat Rev Cancer; Ribas & Wolchok 2018 Science'
  }
}

/**
 * Simulates tumor microenvironment immune evasion, SHP-2 TCR attenuation, and checkpoint blockade reactivation.
 */
export function evaluateTumorImmuneCheckpointKinetics(input: TumorMicroenvironmentInput): ImmuneCheckpointEvaluation {
  const tps = Math.min(100.0, Math.max(0.0, input.tumorPdl1TumorProportionScorePercent))
  const til = Math.max(0.0, input.cd8TumorInfiltratingLymphocyteDensityPerMm2)
  const tmb = Math.max(0.0, input.tumorMutationalBurdenMutsPerMb ?? 7.5)
  const isMsiHigh = input.microsatelliteInstabilityStatus === 'MSI_HIGH'

  // Immunophenotype classification
  let phenotype: 'IMMUNE_DESERT_COLD' | 'IMMUNE_EXCLUDED' | 'IMMUNE_INFLAMED_HOT' = 'IMMUNE_DESERT_COLD'
  if (til >= 500 && (tps >= 1.0 || isMsiHigh)) {
    phenotype = 'IMMUNE_INFLAMED_HOT'
  } else if (til >= 100) {
    phenotype = 'IMMUNE_EXCLUDED'
  } else {
    phenotype = 'IMMUNE_DESERT_COLD'
  }

  // PD-L1 tier
  let pdl1Tier: 'TPS_NEGATIVE_LESS_THAN_1' | 'TPS_INTERMEDIATE_1_TO_49' | 'TPS_HIGH_GREATER_THAN_50' = 'TPS_NEGATIVE_LESS_THAN_1'
  if (tps >= 50.0) {
    pdl1Tier = 'TPS_HIGH_GREATER_THAN_50'
  } else if (tps >= 1.0) {
    pdl1Tier = 'TPS_INTERMEDIATE_1_TO_49'
  } else {
    pdl1Tier = 'TPS_NEGATIVE_LESS_THAN_1'
  }

  // Intervention effects
  let shp2Relief = 0.0
  let baseOrr = 10.0
  let irAeRisk: 'MINIMAL' | 'MODERATE_ENDOCRINE_SKIN' | 'HIGH_AUTOIMMUNE_COLITIS_HEPATITIS' = 'MINIMAL'

  switch (input.therapeuticIntervention) {
    case 'ANTI_PD1_PEMBROLIZUMAB':
      shp2Relief = 78.0
      baseOrr = pdl1Tier === 'TPS_HIGH_GREATER_THAN_50' ? 45.0 : pdl1Tier === 'TPS_INTERMEDIATE_1_TO_49' ? 25.0 : 12.0
      irAeRisk = 'MODERATE_ENDOCRINE_SKIN'
      break

    case 'ANTI_PDL1_ATEZOLIZUMAB':
      shp2Relief = 74.0
      baseOrr = pdl1Tier === 'TPS_HIGH_GREATER_THAN_50' ? 42.0 : pdl1Tier === 'TPS_INTERMEDIATE_1_TO_49' ? 23.0 : 11.0
      irAeRisk = 'MODERATE_ENDOCRINE_SKIN'
      break

    case 'ANTI_CTLA4_IPILIMUMAB':
      // CTLA-4 blockade acts primarily at priming phase in lymph nodes
      shp2Relief = 50.0
      baseOrr = 18.0
      irAeRisk = 'HIGH_AUTOIMMUNE_COLITIS_HEPATITIS'
      break

    case 'COMBINED_PD1_CTLA4_BLOCKADE':
      // Synergistic TCR/CD28 disinhibition
      shp2Relief = 92.0
      baseOrr = pdl1Tier === 'TPS_HIGH_GREATER_THAN_50' ? 58.0 : pdl1Tier === 'TPS_INTERMEDIATE_1_TO_49' ? 42.0 : 25.0
      irAeRisk = 'HIGH_AUTOIMMUNE_COLITIS_HEPATITIS'
      break

    case 'VEHICLE_CONTROL':
    default:
      shp2Relief = 0.0
      baseOrr = 2.0
      irAeRisk = 'MINIMAL'
      break
  }

  // Modifier adjustments for TMB and MSI-H
  if (isMsiHigh && input.therapeuticIntervention !== 'VEHICLE_CONTROL') {
    baseOrr = Math.min(85.0, baseOrr + 25.0)
  } else if (tmb >= 10.0 && input.therapeuticIntervention !== 'VEHICLE_CONTROL') {
    baseOrr = Math.min(75.0, baseOrr + 15.0)
  }

  if (phenotype === 'IMMUNE_DESERT_COLD' && input.therapeuticIntervention !== 'VEHICLE_CONTROL') {
    baseOrr = Math.max(3.0, baseOrr * 0.4)
  }

  const cytotoxicity = Number((Math.min(1.0, (shp2Relief / 100.0) * (til / (til + 200.0)) * 1.2)).toFixed(3))

  return {
    immunophenotypeClass: phenotype,
    pdl1ExpressionTier: pdl1Tier,
    shp2DephosphorylationInhibitionPercentage: Number(shp2Relief.toFixed(1)),
    cytotoxicReactivationIndex: cytotoxicity,
    predictedObjectiveResponseRatePercent: Number(baseOrr.toFixed(1)),
    immuneRelatedAdverseEventRisk: irAeRisk,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Pardoll 2012 Nat Rev Cancer; Ribas & Wolchok 2018 Science',
    },
  }
}
