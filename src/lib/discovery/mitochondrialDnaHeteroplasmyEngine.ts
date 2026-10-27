// src/lib/discovery/mitochondrialDnaHeteroplasmyEngine.ts
// T-CLIN-106: Mitochondrial DNA (mtDNA) Heteroplasmy & D-Loop Replication Error Kinetics Engine

export type MtDnaMutationCategory =
  | 'POINT_MUTATION_MT_TL1_M3243AG_MELAS'
  | 'POINT_MUTATION_MT_TK_M8344AG_MERRF'
  | 'POINT_MUTATION_MT_ATP6_M8993TG_NARP'
  | 'LARGE_SCALE_SINGLE_DELETION_KSS'
  | 'SOMATIC_D_LOOP_AGING_ACCUMULATION'

export interface MtDnaHeteroplasmyInput {
  mutationCategory: MtDnaMutationCategory
  mutantHeteroplasmyPercentage: number // 0.0% to 100.0%
  tissueBioenergeticDemand: 'HIGH_NEUROMUSCULAR_CARDIAC' | 'MODERATE_RENAL_HEPATIC' | 'LOW_FIBROBLAST_MYELOID'
  polgReplicationErrorRatePerKb?: number // POLG fidelity proxy (0.01 to 0.5 errors/kb)
  mtDnaCopyNumberPerCell?: number // normal 1,000 to 10,000 copies
}

export interface MtDnaHeteroplasmyEvaluation {
  mutationCategory: MtDnaMutationCategory
  mutantHeteroplasmyPercentage: number
  biochemicalOxphosThresholdPercentage: number // threshold beyond which ATP synthesis fails (typically 65-80%)
  pathologicalThresholdBreached: boolean
  cellularAtpGenerationCapacityPercentage: number // % of wild-type ATP output
  lacticAcidosisRiskTier: 'NORMAL_BASAL' | 'ELEVATED_POST_EXERTION' | 'CRITICAL_METABOLIC_ACIDOSIS'
  mitochondrialBiogenesisCompensatoryActivation: boolean // NRF1/TFAM compensatory drive
  clinicalPhenotypeManifestationForecast: 'ASYMPTOMATIC_CARRIER' | 'SUBCLINICAL_TISSUE_SPECIFIC_VULNERABILITY' | 'OVERT_MITOCHONDRIAL_ENCEPHALOMYOPATHY'
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Wallace 2005 Annu Rev Genet; Rossignol et al. 2003 Am J Hum Genet'
  }
}

/**
 * Simulates mitochondrial DNA mutant heteroplasmy, tissue-specific biochemical threshold effects, and OXPHOS failure.
 */
export function evaluateMtDnaHeteroplasmyDynamics(input: MtDnaHeteroplasmyInput): MtDnaHeteroplasmyEvaluation {
  const het = Math.min(100.0, Math.max(0.0, input.mutantHeteroplasmyPercentage))
  const copies = Math.max(100, input.mtDnaCopyNumberPerCell ?? 2500)

  // Tissue-specific threshold and baseline vulnerability
  let thresholdPct = 70.0
  switch (input.tissueBioenergeticDemand) {
    case 'HIGH_NEUROMUSCULAR_CARDIAC':
      thresholdPct = 60.0 // neurons and cardiomyocytes have highest threshold sensitivity
      break
    case 'MODERATE_RENAL_HEPATIC':
      thresholdPct = 75.0
      break
    case 'LOW_FIBROBLAST_MYELOID':
      thresholdPct = 85.0
      break
  }

  const isBreached = het >= thresholdPct

  // ATP generation capacity curve (non-linear threshold drop)
  let atpCapacity = 100.0
  if (het <= thresholdPct * 0.7) {
    atpCapacity = 100.0 - (het / thresholdPct) * 10.0
  } else if (het < thresholdPct) {
    atpCapacity = 90.0 - ((het - thresholdPct * 0.7) / (thresholdPct * 0.3)) * 25.0
  } else {
    // Precipitous loss of respiratory chain function
    const excess = het - thresholdPct
    atpCapacity = Math.max(10.0, 65.0 - (excess / (100.0 - thresholdPct)) * 55.0)
  }

  const roundedAtp = Number(atpCapacity.toFixed(1))

  // Lactic acidosis risk
  let acidosisRisk: 'NORMAL_BASAL' | 'ELEVATED_POST_EXERTION' | 'CRITICAL_METABOLIC_ACIDOSIS' = 'NORMAL_BASAL'
  if (roundedAtp < 30.0) {
    acidosisRisk = 'CRITICAL_METABOLIC_ACIDOSIS'
  } else if (roundedAtp < 65.0 || isBreached) {
    acidosisRisk = 'ELEVATED_POST_EXERTION'
  } else {
    acidosisRisk = 'NORMAL_BASAL'
  }

  // Compensatory NRF1/TFAM activation occurs when bioenergetics begin to falter but before total collapse
  const biogenesisActive = het >= 35.0 && het <= 80.0 && copies < 8000

  // Clinical phenotype forecast
  let phenotype: 'ASYMPTOMATIC_CARRIER' | 'SUBCLINICAL_TISSUE_SPECIFIC_VULNERABILITY' | 'OVERT_MITOCHONDRIAL_ENCEPHALOMYOPATHY' = 'ASYMPTOMATIC_CARRIER'
  if (isBreached && roundedAtp < 50.0) {
    phenotype = 'OVERT_MITOCHONDRIAL_ENCEPHALOMYOPATHY'
  } else if (het >= 35.0) {
    phenotype = 'SUBCLINICAL_TISSUE_SPECIFIC_VULNERABILITY'
  } else {
    phenotype = 'ASYMPTOMATIC_CARRIER'
  }

  return {
    mutationCategory: input.mutationCategory,
    mutantHeteroplasmyPercentage: het,
    biochemicalOxphosThresholdPercentage: thresholdPct,
    pathologicalThresholdBreached: isBreached,
    cellularAtpGenerationCapacityPercentage: roundedAtp,
    lacticAcidosisRiskTier: acidosisRisk,
    mitochondrialBiogenesisCompensatoryActivation: biogenesisActive,
    clinicalPhenotypeManifestationForecast: phenotype,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Wallace 2005 Annu Rev Genet; Rossignol et al. 2003 Am J Hum Genet',
    },
  }
}
