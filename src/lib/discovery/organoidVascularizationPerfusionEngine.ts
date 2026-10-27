// src/lib/discovery/organoidVascularizationPerfusionEngine.ts
// T-CLIN-99: Organoid Vascularization, Angiogenic Sprouting & Microfluidic Perfusion Engine

export interface VascularSproutingInput {
  organoidDiameterMicrons: number // unvascularized organoids > 400 um develop hypoxic cores
  vegfAGradientPicomolar: number // 50 to 500 pM (drives tip-cell filopodial extension)
  endothelialSeedingDensityPerMm3: number // human umbilical vein endothelial cells (HUVECs) or iPSC-ECs
  microfluidicFlowVelocityMicronsPerSec?: number // perfusion flow rate (0 to 1200 um/s)
  pericyteCoCulturePresent?: boolean // pericytes (PDGFR-beta+) stabilize basement membrane and tight junctions
}

export interface OrganoidVascularizationEvaluation {
  organoidDiameterMicrons: number
  hypoxicCoreStatus: 'AVOIDED_FULL_PERFUSION' | 'MARGINAL_OXYGEN_DEFICIT' | 'SEVERE_NECROTIC_CORE_DEVELOPED'
  necroticCoreRadiusMicrons: number
  tipCellSproutingDensityPerMm: number // DLL4-high / VEGFR2-high sprouts
  stalkCellElongationIndex: number // Notch-mediated lumen formation
  wallShearStressDynePerCm2: number // microvascular shear stress (optimal 5-20 dyne/cm2)
  endothelialJunctionMaturityScore: number // CD31 / VE-Cadherin tight barrier integrity (0.0 - 1.0)
  perfusionViabilityPercentage: number // % cells receiving sufficient pO2 (> 20 mmHg)
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Phng & Gerhardt 2009 Dev Cell; Homan et al. 2019 Nat Methods'
  }
}

/**
 * Simulates angiogenic tip/stalk cell DLL4-Notch patterning, vessel lumenization, shear stress, and necrotic core prevention.
 */
export function evaluateOrganoidVascularization(input: VascularSproutingInput): OrganoidVascularizationEvaluation {
  const diam = Math.max(50, input.organoidDiameterMicrons)
  const vegf = Math.max(10, input.vegfAGradientPicomolar)
  const ecDensity = Math.max(100, input.endothelialSeedingDensityPerMm3)
  const flow = Math.max(0.0, input.microfluidicFlowVelocityMicronsPerSec ?? 350.0)
  const hasPericytes = input.pericyteCoCulturePresent ?? true

  // Diffusion limit of oxygen in spheroids without functional perfusion is ~180 um
  const rOrganoid = diam / 2.0
  const oxygenDiffusionLimitUm = flow > 50.0 ? 250.0 + (flow / 800.0) * 150.0 : 180.0

  let coreRadius = 0.0
  let coreStatus: 'AVOIDED_FULL_PERFUSION' | 'MARGINAL_OXYGEN_DEFICIT' | 'SEVERE_NECROTIC_CORE_DEVELOPED' = 'AVOIDED_FULL_PERFUSION'

  if (rOrganoid > oxygenDiffusionLimitUm) {
    coreRadius = Number((rOrganoid - oxygenDiffusionLimitUm).toFixed(1))
    coreStatus = coreRadius > 100.0 ? 'SEVERE_NECROTIC_CORE_DEVELOPED' : 'MARGINAL_OXYGEN_DEFICIT'
  } else {
    coreStatus = 'AVOIDED_FULL_PERFUSION'
  }

  // Angiogenic sprouting: VEGF drives tip cells, constrained by EC seeding pool
  const tipSprouts = Number((Math.min(45.0, (vegf / 150.0) * Math.min(2.5, ecDensity / 2000.0) * 18.0)).toFixed(1))
  const stalkIndex = Number((Math.min(1.0, 0.3 + (tipSprouts / 50.0) * 0.7)).toFixed(2))

  // Wall shear stress tau = 4 * mu * v / R (viscosity mu ~ 0.01 Poise, capillary R ~ 10 um)
  // Approximate shear stress in dyne/cm2:
  const shearStress = flow > 0.0 ? Number((Math.min(28.0, (flow / 1000.0) * 14.0)).toFixed(2)) : 0.0

  // Endothelial barrier maturity (CD31 / VE-Cadherin)
  const shearMaturityBonus = shearStress >= 5.0 && shearStress <= 20.0 ? 0.25 : shearStress > 20.0 ? 0.05 : 0.0
  const pericyteBonus = hasPericytes ? 0.30 : 0.0
  const barrierMaturity = Number((Math.min(1.0, 0.45 + shearMaturityBonus + pericyteBonus)).toFixed(2))

  // Viability percentage based on volume fraction outside necrotic core
  let viability = 100.0
  if (coreRadius > 0.0) {
    const totalVol = Math.pow(rOrganoid, 3)
    const deadVol = Math.pow(coreRadius, 3)
    viability = Number((Math.max(10.0, ((totalVol - deadVol) / totalVol) * 100.0)).toFixed(1))
  }

  return {
    organoidDiameterMicrons: diam,
    hypoxicCoreStatus: coreStatus,
    necroticCoreRadiusMicrons: coreRadius,
    tipCellSproutingDensityPerMm: tipSprouts,
    stalkCellElongationIndex: stalkIndex,
    wallShearStressDynePerCm2: shearStress,
    endothelialJunctionMaturityScore: barrierMaturity,
    perfusionViabilityPercentage: viability,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Phng & Gerhardt 2009 Dev Cell; Homan et al. 2019 Nat Methods',
    },
  }
}
