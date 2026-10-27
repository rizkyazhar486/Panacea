// src/lib/discovery/biomolecularCondensateLlpsEngine.ts
// T-CLIN-96: Biomolecular Condensate Phase Separation (LLPS) & Liquid-to-Solid Aggregation Engine

export type CondensateProteinScaffold = 'FUS_RNA_BINDING' | 'TDP43_HNRNP' | 'G3BP1_STRESS_GRANULE' | 'MED1_SUPEREnhancer'

export interface CondensateMicroenvironmentInput {
  scaffoldProtein: CondensateProteinScaffold
  proteinConcentrationMicromolar: number // concentration in cytoplasm/nucleoplasm
  rnaCoFactorConcentrationNgUl?: number // stoichiometric RNA buffer (modulates LLPS window)
  atpHydrotropeConcentrationMm?: number // normal cellular ATP 2.0 - 8.0 mM acts as biological hydrotrope
  hasPathologicalPrionDomainMutation?: boolean // e.g. FUS G156E or TDP-43 ALS-associated variants
  hexanediolDisruptionAssayApplied?: boolean // 1,6-hexanediol sensitivity test (dissolves purely liquid condensates)
}

export interface CondensateDynamicsEvaluation {
  scaffoldProtein: CondensateProteinScaffold
  phaseSeparationState: 'HOMOGENEOUS_SOLUBLE' | 'DYNAMIC_LIQUID_CONDENSATE' | 'VISCOELASTIC_GEL' | 'SOLID_AMYLOID_AGGREGATE'
  saturationConcentrationCsatMicromolar: number
  densePhaseFractionPercentage: number
  dropletFusionRelaxationTimeSeconds: number // tau = (eta * R) / gamma
  apparentViscosityPascalSeconds: number
  hydrotropeSolubilizationFactor: number // ATP hydrotropic dispersion capacity
  hexanediolSensitivityResult: 'FULLY_DISSOLVED' | 'RESISTANT_GEL_AGGREGATE' | 'NOT_TESTED'
  neurodegenerativeRiskAssessment: 'PHYSIOLOGIC_REVERSIBLE' | 'INTERMEDIATE_PERSISTENT_STRESS' | 'PATHOLOGICAL_INCLUSION_COMMITTED'
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Patel et al. 2015 Cell; Shin & Brangwynne 2017 Science'
  }
}

/**
 * Simulates liquid-liquid phase separation (LLPS), saturation concentration C_sat, droplet coalescence, and liquid-to-solid transitions.
 */
export function evaluateBiomolecularCondensateDynamics(input: CondensateMicroenvironmentInput): CondensateDynamicsEvaluation {
  const conc = Math.max(0.1, input.proteinConcentrationMicromolar)
  const rna = Math.max(0.0, input.rnaCoFactorConcentrationNgUl ?? 25.0)
  const atp = Math.max(0.1, input.atpHydrotropeConcentrationMm ?? 4.0)
  const isMutant = input.hasPathologicalPrionDomainMutation ?? false
  const hexanediol = input.hexanediolDisruptionAssayApplied ?? false

  // Baseline C_sat by scaffold protein
  const baseCsatMap: Record<CondensateProteinScaffold, number> = {
    FUS_RNA_BINDING: 3.5,
    TDP43_HNRNP: 2.8,
    G3BP1_STRESS_GRANULE: 5.0,
    MED1_SUPEREnhancer: 1.5,
  }

  // Hydrotropic ATP increases C_sat (keeps proteins soluble); RNA in sweet spot lowers C_sat, but excess RNA re-solubilizes
  const atpSolubilization = Math.min(2.5, Math.max(0.5, atp / 3.5))
  const rnaBiphasic = rna > 0.0 && rna < 150.0 ? 0.8 : rna >= 150.0 ? 1.4 : 1.0
  const mutationFactor = isMutant ? 0.45 : 1.0 // mutations significantly accelerate phase transition

  const effectiveCsat = Number((baseCsatMap[input.scaffoldProtein] * atpSolubilization * rnaBiphasic * mutationFactor).toFixed(2))

  // Dense phase fraction
  let denseFraction = 0.0
  if (conc > effectiveCsat) {
    denseFraction = Number((Math.min(95.0, ((conc - effectiveCsat) / conc) * 85.0)).toFixed(1))
  }

  // Apparent viscosity and fusion relaxation time
  let viscosity = 0.5 // Pa.s (liquid state ~100x water)
  let tauSeconds = 0.4 // sub-second droplet coalescence
  if (isMutant) {
    viscosity = atp < 2.0 ? 180.0 : 45.0 // high viscosity gel
    tauSeconds = atp < 2.0 ? 45.0 : 12.0
  } else if (conc > effectiveCsat * 3.0) {
    viscosity = 4.5
    tauSeconds = 2.2
  }

  // Phase separation state determination
  let phaseState: 'HOMOGENEOUS_SOLUBLE' | 'DYNAMIC_LIQUID_CONDENSATE' | 'VISCOELASTIC_GEL' | 'SOLID_AMYLOID_AGGREGATE' = 'HOMOGENEOUS_SOLUBLE'
  if (conc <= effectiveCsat) {
    phaseState = 'HOMOGENEOUS_SOLUBLE'
  } else if (isMutant && atp < 2.0) {
    phaseState = 'SOLID_AMYLOID_AGGREGATE'
  } else if (isMutant || viscosity > 20.0) {
    phaseState = 'VISCOELASTIC_GEL'
  } else {
    phaseState = 'DYNAMIC_LIQUID_CONDENSATE'
  }

  // Hexanediol assay response
  let hexResult: 'FULLY_DISSOLVED' | 'RESISTANT_GEL_AGGREGATE' | 'NOT_TESTED' = 'NOT_TESTED'
  if (hexanediol) {
    if (phaseState === 'DYNAMIC_LIQUID_CONDENSATE') {
      hexResult = 'FULLY_DISSOLVED'
    } else {
      hexResult = 'RESISTANT_GEL_AGGREGATE'
    }
  }

  // Neurodegenerative risk
  let risk: 'PHYSIOLOGIC_REVERSIBLE' | 'INTERMEDIATE_PERSISTENT_STRESS' | 'PATHOLOGICAL_INCLUSION_COMMITTED' = 'PHYSIOLOGIC_REVERSIBLE'
  if (phaseState === 'SOLID_AMYLOID_AGGREGATE') {
    risk = 'PATHOLOGICAL_INCLUSION_COMMITTED'
  } else if (phaseState === 'VISCOELASTIC_GEL') {
    risk = 'INTERMEDIATE_PERSISTENT_STRESS'
  } else {
    risk = 'PHYSIOLOGIC_REVERSIBLE'
  }

  return {
    scaffoldProtein: input.scaffoldProtein,
    phaseSeparationState: phaseState,
    saturationConcentrationCsatMicromolar: effectiveCsat,
    densePhaseFractionPercentage: denseFraction,
    dropletFusionRelaxationTimeSeconds: Number(tauSeconds.toFixed(2)),
    apparentViscosityPascalSeconds: Number(viscosity.toFixed(2)),
    hydrotropeSolubilizationFactor: Number(atpSolubilization.toFixed(2)),
    hexanediolSensitivityResult: hexResult,
    neurodegenerativeRiskAssessment: risk,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Patel et al. 2015 Cell; Shin & Brangwynne 2017 Science',
    },
  }
}
