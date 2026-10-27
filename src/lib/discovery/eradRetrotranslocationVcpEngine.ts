// src/lib/discovery/eradRetrotranslocationVcpEngine.ts
// T-CLIN-121: Endoplasmic Reticulum-Associated Degradation (ERAD) & Retrotranslocation Engine

export interface EradSubstrateInput {
  misfoldedGlycoproteinBurdenRatio: number // normal ~1.0; severe proteotoxic stress > 3.0
  hrd1Sel1lDisloconIntegrityRatio?: number // normal 1.0; deficient < 0.35
  p97VcpAaaAtpaseActivityRatio?: number // normal 1.0; inhibited < 0.20 (e.g. by CB-5083)
  edemMannosidaseTrimmingEfficiency?: number // 0.0 - 1.0 (glycan recognition tag)
  proteasome26sClearanceCapacityRatio?: number // normal 1.0
  vcpInhibitorConcentrationNm?: number // CB-5083 (0 to 1000 nM)
}

export interface EradRetrotranslocationEvaluation {
  mannoseTrimmingTargetingScore: number // 0.0 - 1.0 (EDEM tagging efficiency)
  disloconRetrotranslocationFluxRate: number // substrates retrotranslocated per minute
  p97VcpExtractionEfficiencyPercentage: number // % of targeted substrates successfully extracted into cytosol
  polyubiquitinChaperoneCouplingScore: number // 0.0 - 1.0
  erLumenalProteotoxicStressAccumulation: 'RESOLVED_HOMEOSTATIC_CLEARANCE' | 'COMPENSATED_PROTEOTOXIC_BURDEN' | 'TERMINAL_ERAD_COLLAPSE_CHOP_DRIVE'
  terminalChopApoptoticSwitchProbability: number // 0.0 - 1.0
  targetedVcpInhibitionOncolyticIndex: number // 0.0 - 1.0 (therapeutic window in multiple myeloma)
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Carvalho et al. 2010 Cell; Meyer et al. 2012 Nat Cell Biol; Christianson & Ye 2014 Nat Rev Mol Cell Biol'
  }
}

/**
 * Simulates ERAD glycoprotein mannose trimming, Hrd1-SEL1L dislocon retrotranslocation, p97/VCP extraction, and proteotoxic collapse.
 */
export function evaluateEradRetrotranslocationDynamics(input: EradSubstrateInput): EradRetrotranslocationEvaluation {
  const burden = Math.max(0.1, input.misfoldedGlycoproteinBurdenRatio)
  const hrd1 = Math.min(1.5, Math.max(0.05, input.hrd1Sel1lDisloconIntegrityRatio ?? 1.0))
  const trimming = Math.min(1.0, Math.max(0.1, input.edemMannosidaseTrimmingEfficiency ?? 0.85))
  const proteasome = Math.min(1.5, Math.max(0.1, input.proteasome26sClearanceCapacityRatio ?? 1.0))
  const cb5083 = Math.max(0.0, input.vcpInhibitorConcentrationNm ?? 0.0)

  // p97/VCP ATPase inhibition kinetics (IC50 ~ 35 nM for CB-5083)
  const baseVcp = Math.min(1.5, Math.max(0.05, input.p97VcpAaaAtpaseActivityRatio ?? 1.0))
  const vcpInhibitionFactor = cb5083 > 0.0 ? 1.0 / (1.0 + cb5083 / 35.0) : 1.0
  const effectiveVcp = baseVcp * vcpInhibitionFactor

  // Targeting score: EDEM1-3 trimming of mannose residues creates Man8GlcNAc2 degradation signal
  const targetingScore = Number((Math.min(1.0, trimming * 0.95)).toFixed(3))

  // p97/VCP extraction efficiency: power stroke pulls ubiquitinated polypeptide out of Hrd1 channel
  const extractionEff = Number((Math.min(99.0, Math.max(2.0, effectiveVcp * hrd1 * 92.0))).toFixed(1))

  // Dislocon retrotranslocation flux: substrates cleared per minute
  const baseFlux = 24.0 // molecules/min at baseline
  const flux = Number((Math.max(0.5, baseFlux * targetingScore * (extractionEff / 100.0) * proteasome)).toFixed(1))

  // Proteotoxic stress clearance ratio: flux vs burden
  const clearanceRatio = flux / (burden * 20.0)

  // Classification of ER lumenal proteotoxic state
  let stressState: 'RESOLVED_HOMEOSTATIC_CLEARANCE' | 'COMPENSATED_PROTEOTOXIC_BURDEN' | 'TERMINAL_ERAD_COLLAPSE_CHOP_DRIVE' = 'RESOLVED_HOMEOSTATIC_CLEARANCE'
  if (clearanceRatio < 0.35 || extractionEff < 20.0) {
    stressState = 'TERMINAL_ERAD_COLLAPSE_CHOP_DRIVE'
  } else if (clearanceRatio < 0.85 || burden > 2.0) {
    stressState = 'COMPENSATED_PROTEOTOXIC_BURDEN'
  } else {
    stressState = 'RESOLVED_HOMEOSTATIC_CLEARANCE'
  }

  // Terminal CHOP apoptotic switch probability
  const chopProb = stressState === 'TERMINAL_ERAD_COLLAPSE_CHOP_DRIVE'
    ? Number((Math.min(0.98, Math.max(0.60, 1.0 - clearanceRatio))).toFixed(3))
    : Number((Math.min(0.30, Math.max(0.01, (1.0 - clearanceRatio) * 0.35))).toFixed(3))

  // Oncolytic index with VCP inhibitors (myeloma cells produce huge immunoglobulin volumes, making them hyper-dependent on ERAD)
  const oncolyticIdx = Number((Math.min(1.0, Math.max(0.05, (burden / 2.5) * (1.0 - effectiveVcp)))).toFixed(3))

  return {
    mannoseTrimmingTargetingScore: targetingScore,
    disloconRetrotranslocationFluxRate: flux,
    p97VcpExtractionEfficiencyPercentage: extractionEff,
    polyubiquitinChaperoneCouplingScore: Number((Math.min(1.0, effectiveVcp * proteasome)).toFixed(3)),
    erLumenalProteotoxicStressAccumulation: stressState,
    terminalChopApoptoticSwitchProbability: chopProb,
    targetedVcpInhibitionOncolyticIndex: oncolyticIdx,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Carvalho et al. 2010 Cell; Meyer et al. 2012 Nat Cell Biol; Christianson & Ye 2014 Nat Rev Mol Cell Biol',
    },
  }
}
