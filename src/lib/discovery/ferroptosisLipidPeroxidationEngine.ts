// src/lib/discovery/ferroptosisLipidPeroxidationEngine.ts
// T-CLIN-104: Ferroptosis GPX4-GSH & FSP1-CoQ10 Parallel Surveillance Engine

export interface FerroptosisMicroenvironmentInput {
  cellularLabileIronPoolMicromolar: number // free Fe2+ (normal 0.5 - 2.5 uM; iron overload > 5.0 uM)
  pufaPhospholipidBurdenIndex?: number // ACSL4/LPCAT3 mediated PUFA-PE incorporation (0.2 - 2.5)
  glutathioneGshLevelMm?: number // normal 2.0 - 8.0 mM; depleted < 1.0 mM
  gpx4EnzymeActivityRatio?: number // 0.0 - 1.0 (normal ~1.0; RSL3 inhibition reduces to < 0.1)
  fsp1CoQ10AxisActivityRatio?: number // parallel FSP1-ubiquinol defense system (0.0 - 1.0)
  ferroptosisInhibitorFerrostatin1ConcentrationUm?: number // radical-trapping antioxidant Fer-1 (0 to 10 uM)
}

export interface FerroptosisEvaluation {
  ferroptoticDeathCommitment: 'PROTECTED_HOMEOSTASIS' | 'COMPENSATED_PEROXIDATION_STRESS' | 'COMMITTED_MEMBRANE_RUPTURE'
  lipidHydroperoxideAccumulationPmolPerMg: number // PL-OOH concentration
  gpx4GshDefenseCapacityPercentage: number
  fsp1UbiquinolParallelDefenseCapacityPercentage: number
  overallAntioxidantRedundancyScore: number // combined survival capacity (0.0 - 1.0)
  membranePoreFormationRuptureRisk: 'LOW' | 'ELEVATED_LIPID_BUBBLE' | 'CRITICAL_OSMOTIC_LYSIS'
  ferrostatinRescuePotential: boolean
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Dixon et al. 2012 Cell; Bersuker et al. 2019 Nature; Doll et al. 2019 Nature'
  }
}

/**
 * Simulates iron-dependent lipid peroxidation, GPX4-GSH detoxification, and FSP1-CoQ10 parallel radical trapping.
 */
export function evaluateFerroptoticPeroxidationDynamics(input: FerroptosisMicroenvironmentInput): FerroptosisEvaluation {
  const fe2 = Math.max(0.1, input.cellularLabileIronPoolMicromolar)
  const pufa = Math.max(0.1, input.pufaPhospholipidBurdenIndex ?? 1.0)
  const gsh = Math.max(0.05, input.glutathioneGshLevelMm ?? 4.5)
  const gpx4 = Math.min(1.0, Math.max(0.01, input.gpx4EnzymeActivityRatio ?? 1.0))
  const fsp1 = Math.min(1.0, Math.max(0.01, input.fsp1CoQ10AxisActivityRatio ?? 0.85))
  const fer1 = Math.max(0.0, input.ferroptosisInhibitorFerrostatin1ConcentrationUm ?? 0.0)

  // Arm 1: GPX4-GSH defense capacity
  const gshFactor = Math.min(1.0, gsh / 3.5)
  const gpx4Capacity = Number((Math.min(100.0, gpx4 * gshFactor * 100.0)).toFixed(1))

  // Arm 2: FSP1-CoQ10 parallel defense capacity (independent of glutathione)
  const fsp1Capacity = Number((Math.min(100.0, fsp1 * 85.0)).toFixed(1))

  // Radical-trapping antioxidant Fer-1 provides direct lipid radical scavenging
  const fer1Scavenging = fer1 > 0.0 ? Math.min(95.0, (fer1 / (fer1 + 0.8)) * 95.0) : 0.0

  // Net peroxidative drive: Fe2+ Fenton reaction * PUFA substrate density
  const peroxidativeDrive = fe2 * pufa * 12.0
  const combinedDefenseMultiplier = (gpx4Capacity / 100.0) * 0.65 + (fsp1Capacity / 100.0) * 0.35 + (fer1Scavenging / 100.0) * 0.90

  // Steady-state lipid hydroperoxide (PL-OOH) accumulation
  const plOoh = Number((Math.max(2.0, (peroxidativeDrive / Math.max(0.05, combinedDefenseMultiplier * 1.5)))).toFixed(1))

  // Redundancy score
  const redundancy = Number((Math.min(1.0, (gpx4Capacity + fsp1Capacity) / 185.0)).toFixed(2))

  // Commitment classification: PL-OOH > 45 pmol/mg induces plasma membrane pore formation
  let status: 'PROTECTED_HOMEOSTASIS' | 'COMPENSATED_PEROXIDATION_STRESS' | 'COMMITTED_MEMBRANE_RUPTURE' = 'PROTECTED_HOMEOSTASIS'
  let ruptureRisk: 'LOW' | 'ELEVATED_LIPID_BUBBLE' | 'CRITICAL_OSMOTIC_LYSIS' = 'LOW'

  if (plOoh > 55.0) {
    status = 'COMMITTED_MEMBRANE_RUPTURE'
    ruptureRisk = 'CRITICAL_OSMOTIC_LYSIS'
  } else if (plOoh > 22.0) {
    status = 'COMPENSATED_PEROXIDATION_STRESS'
    ruptureRisk = 'ELEVATED_LIPID_BUBBLE'
  } else {
    status = 'PROTECTED_HOMEOSTASIS'
    ruptureRisk = 'LOW'
  }

  const ferRescue = status === 'COMMITTED_MEMBRANE_RUPTURE' && fer1 === 0.0

  return {
    ferroptoticDeathCommitment: status,
    lipidHydroperoxideAccumulationPmolPerMg: plOoh,
    gpx4GshDefenseCapacityPercentage: gpx4Capacity,
    fsp1UbiquinolParallelDefenseCapacityPercentage: fsp1Capacity,
    overallAntioxidantRedundancyScore: redundancy,
    membranePoreFormationRuptureRisk: ruptureRisk,
    ferrostatinRescuePotential: ferRescue,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Dixon et al. 2012 Cell; Bersuker et al. 2019 Nature; Doll et al. 2019 Nature',
    },
  }
}
