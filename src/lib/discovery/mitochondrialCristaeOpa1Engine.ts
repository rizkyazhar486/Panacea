// src/lib/discovery/mitochondrialCristaeOpa1Engine.ts
// T-CLIN-112: Mitochondrial Cristae Morphodynamics, OPA1 Oligomerization & Cytochrome c Release Engine

export interface MitochondrialCristaeInput {
  longOpa1AbundanceRatio: number // L-OPA1 membrane-anchored form (normal ~0.50 of total OPA1)
  shortOpa1AbundanceRatio: number // S-OPA1 soluble form (normal ~0.50)
  innerMembranePotentialMv: number // Delta-Psi-m (normal -140 to -180 mV; depolarized > -100 mV)
  proApoptoticBidBimActiveConcentrationNm?: number // BH3-only activation (0 to 100 nM)
  cardiolipinPeroxidationPercentage?: number // 0% to 80% peroxidized
  oma1ProteaseInhibitorPresent?: boolean // pharmacological preservation of L-OPA1
}

export interface CristaeMorphologyEvaluation {
  longToShortOpa1Ratio: number // normal ~ 1.0; apoptotic < 0.2
  cristaeJunctionDiameterNm: number // normal 8 - 12 nm; widened apoptotic > 20 nm
  cristaeJunctionTightnessClassification: 'TIGHTLY_SEQUESTERED_HOMEOSTASIS' | 'PARTIALLY_PERMITTIVE_JUNCTIONS' | 'COLLAPSED_WIDE_JUNCTION_HERNIATION'
  cytochromeCSequestrationPercentage: number // % of total Cyt c retained inside cristae lumen
  extracristalCytochromeCLeakageFraction: number // fraction released into intermembrane space/cytosol
  caspaseApoptosomeActivationProbability: number // 0.0 - 1.0
  respiratorySupercomplexStabilityScore: number // 0.0 - 1.0 (dependent on tight cristae)
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Frezza et al. 2006 Cell; Cogliati et al. 2013 Cell'
  }
}

/**
 * Simulates inner mitochondrial membrane cristae junction dynamics, OPA1 oligomeric tightness, and Cytochrome c compartmentalization.
 */
export function evaluateMitochondrialCristaeDynamics(input: MitochondrialCristaeInput): CristaeMorphologyEvaluation {
  const lOpa = Math.max(0.01, input.longOpa1AbundanceRatio)
  const sOpa = Math.max(0.01, input.shortOpa1AbundanceRatio)
  const deltaPsi = Math.min(-50, Math.max(-200, input.innerMembranePotentialMv))
  const bh3 = Math.max(0.0, input.proApoptoticBidBimActiveConcentrationNm ?? 0.0)
  const cardiolipinPerox = Math.min(100.0, Math.max(0.0, input.cardiolipinPeroxidationPercentage ?? 5.0))
  const oma1Blocked = input.oma1ProteaseInhibitorPresent ?? false

  // Depolarization and BH3 proteins activate OMA1 cleavage of L-OPA1
  // Delta-Psi-m: normal -140 to -180 mV; depolarized > -120 mV
  const depolarizationStress = deltaPsi > -120 ? Math.min(1.0, (deltaPsi - (-120)) / 70.0) : 0.0
  const oma1CleavageFactor = oma1Blocked ? 0.15 : (1.0 + (bh3 / 25.0) + depolarizationStress * 3.5)

  // Effective long/short ratio
  const effectiveLOpa = Math.max(0.02, lOpa / oma1CleavageFactor)
  const opa1Ratio = Number((effectiveLOpa / sOpa).toFixed(2))

  // Oligomeric tightness of cristae junctions
  // Normal cristae junctions are 8-12 nm. Complete loss of L-OPA1 widens junctions to 25-40 nm.
  const baseJunctionDiameter = 8.0 // nm
  const wideningDelta = Math.max(0.0, (1.0 - opa1Ratio) * 22.0) + (cardiolipinPerox / 100.0) * 8.0
  const diameter = Number((Math.min(45.0, baseJunctionDiameter + wideningDelta)).toFixed(1))

  // Classification
  let tightness: 'TIGHTLY_SEQUESTERED_HOMEOSTASIS' | 'PARTIALLY_PERMITTIVE_JUNCTIONS' | 'COLLAPSED_WIDE_JUNCTION_HERNIATION' = 'TIGHTLY_SEQUESTERED_HOMEOSTASIS'
  if (diameter > 22.0) {
    tightness = 'COLLAPSED_WIDE_JUNCTION_HERNIATION'
  } else if (diameter > 14.0) {
    tightness = 'PARTIALLY_PERMITTIVE_JUNCTIONS'
  } else {
    tightness = 'TIGHTLY_SEQUESTERED_HOMEOSTASIS'
  }

  // Cytochrome c sequestration % (normally ~85-90% of Cyt c is trapped in cristae)
  let sequestrationPct = 90.0
  if (diameter <= 13.0) {
    sequestrationPct = Math.max(80.0, 92.0 - (diameter - 8.0) * 2.0)
  } else if (diameter <= 22.0) {
    sequestrationPct = Math.max(40.0, 80.0 - (diameter - 13.0) * 4.4)
  } else {
    sequestrationPct = Math.max(5.0, 40.0 - (diameter - 22.0) * 1.5)
  }
  const roundedSequestration = Number(sequestrationPct.toFixed(1))
  const leakageFraction = Number(((100.0 - roundedSequestration) / 100.0).toFixed(3))

  // Apoptosome activation probability
  const apoptosomeProb = Number((Math.min(0.99, Math.max(0.01, leakageFraction * 1.15))).toFixed(3))

  // Respiratory supercomplex stability (tight cristae concentrate protons and stabilize Complex I/III/IV supercomplexes)
  const supercomplexScore = Number((Math.min(1.0, Math.max(0.05, (sequestrationPct / 100.0) * (Math.abs(deltaPsi) / 180.0)))).toFixed(3))

  return {
    longToShortOpa1Ratio: opa1Ratio,
    cristaeJunctionDiameterNm: diameter,
    cristaeJunctionTightnessClassification: tightness,
    cytochromeCSequestrationPercentage: roundedSequestration,
    extracristalCytochromeCLeakageFraction: leakageFraction,
    caspaseApoptosomeActivationProbability: apoptosomeProb,
    respiratorySupercomplexStabilityScore: supercomplexScore,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Frezza et al. 2006 Cell; Cogliati et al. 2013 Cell',
    },
  }
}
