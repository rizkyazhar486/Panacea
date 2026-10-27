// src/lib/discovery/podocyteSlitDiaphragmPermeabilityEngine.ts
// T-CLIN-119: Podocyte Slit Diaphragm Filtration Barrier, Nephrin/Podocin & Glomerular Permeability Engine

export interface PodocyteGlomerularInput {
  intraglomerularCapillaryPressureMmHg: number // P_gc: normal 45 - 50 mmHg; hypertensive/diabetic > 60 mmHg
  nephrinPodocinComplexDensityRatio: number // normal 1.0; mutated or shed < 0.40
  synaptopodinActinAnchoringScore?: number // 0.0 - 1.0 (cytoskeletal stability)
  reactiveOxygenSpeciesStressIndex?: number // 0.0 - 1.0 (podocyte oxidative injury)
  sglt2InhibitorRasBlockerPresent?: boolean // hemodynamically lowers P_gc by 5 - 10 mmHg
}

export interface PodocytePermeabilityEvaluation {
  effectiveIntraglomerularPressureMmHg: number
  slitDiaphragmPoreRadiusAngstroms: number // normal ~40 Angstroms; effaced > 80 Angstroms
  footProcessEffacementPercentage: number // 0% to 100%
  filtrationBarrierSelectivityClassification: 'PERMSELECTIVE_HEALTHY_BARRIER' | 'MICROALBUMINURIC_LEAKAGE' | 'OVERT_NEPHROTIC_MACROPROTEINURIA'
  urinaryAlbuminToCreatinineRatioProxyMgG: number // uACR (normal < 30; micro 30-300; macro > 300 mg/g)
  podocyteDetachmentRatePer1000GlomeruliPerDay: number // critical irreversible nephron loss rate
  hemodynamicProtectionBenefitObserved: boolean
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Kriz et al. 2013 JASN; Grahammer et al. 2013 J Clin Invest'
  }
}

/**
 * Simulates glomerular podocyte mechanical strain, slit diaphragm permselectivity, foot process effacement, and albuminuria.
 */
export function evaluatePodocyteGlomerularDynamics(input: PodocyteGlomerularInput): PodocytePermeabilityEvaluation {
  const nephrin = Math.min(1.5, Math.max(0.05, input.nephrinPodocinComplexDensityRatio))
  const synap = Math.min(1.0, Math.max(0.1, input.synaptopodinActinAnchoringScore ?? 1.0))
  const ros = Math.min(1.0, Math.max(0.0, input.reactiveOxygenSpeciesStressIndex ?? 0.05))
  const hasProtectiveDrug = input.sglt2InhibitorRasBlockerPresent ?? false

  // Hemodynamic lowering of intraglomerular pressure with SGLT2i/RASi
  const rawPgc = Math.min(85, Math.max(35, input.intraglomerularCapillaryPressureMmHg))
  const pressureReduction = hasProtectiveDrug ? 7.5 : 0.0
  const effectivePgc = Number((Math.max(42.0, rawPgc - pressureReduction)).toFixed(1))

  // Wall tension / mechanical strain on podocyte foot processes
  // Normal P_gc ~ 48 mmHg. Pressure > 55 mmHg stretches filtration slits
  const pressureStrainFactor = Math.max(0.0, (effectivePgc - 48.0) / 25.0)

  // Slit diaphragm integrity: dependent on Nephrin/Podocin and synaptopodin anchoring
  const sdIntegrity = Math.max(0.05, nephrin * synap * (1.0 - ros * 0.45) * (1.0 - pressureStrainFactor * 0.50))

  // Foot process effacement %
  const effacementPct = Number((Math.min(99.0, Math.max(2.0, (1.0 - sdIntegrity) * 95.0 + pressureStrainFactor * 25.0))).toFixed(1))

  // Slit diaphragm effective pore radius (normal ~ 40 Angstroms, filters out albumin radius 36 Angstroms)
  const poreRadius = Number((Math.min(120.0, 38.0 + (effacementPct / 100.0) * 65.0)).toFixed(1))

  // Filtration barrier classification and albuminuria estimation
  let classification: 'PERMSELECTIVE_HEALTHY_BARRIER' | 'MICROALBUMINURIC_LEAKAGE' | 'OVERT_NEPHROTIC_MACROPROTEINURIA' = 'PERMSELECTIVE_HEALTHY_BARRIER'
  let uacr = 12.0 // mg/g baseline

  if (effacementPct > 65.0 || poreRadius > 70.0) {
    classification = 'OVERT_NEPHROTIC_MACROPROTEINURIA'
    uacr = Number((Math.min(4500.0, 350.0 + Math.pow(effacementPct - 60.0, 2) * 2.5)).toFixed(0))
  } else if (effacementPct > 25.0 || poreRadius > 46.0) {
    classification = 'MICROALBUMINURIC_LEAKAGE'
    uacr = Number((Math.min(290.0, 35.0 + (effacementPct - 25.0) * 6.2)).toFixed(0))
  } else {
    classification = 'PERMSELECTIVE_HEALTHY_BARRIER'
    uacr = Number((Math.max(5.0, 10.0 + effacementPct * 0.4)).toFixed(0))
  }

  // Podocyte detachment rate: podocytes are post-mitotic; detachment leads to glomerulosclerosis
  const detachmentRate = Number((Math.max(0.02, Math.pow(effacementPct / 40.0, 2.5) * (effectivePgc / 50.0))).toFixed(2))

  return {
    effectiveIntraglomerularPressureMmHg: effectivePgc,
    slitDiaphragmPoreRadiusAngstroms: poreRadius,
    footProcessEffacementPercentage: effacementPct,
    filtrationBarrierSelectivityClassification: classification,
    urinaryAlbuminToCreatinineRatioProxyMgG: uacr,
    podocyteDetachmentRatePer1000GlomeruliPerDay: detachmentRate,
    hemodynamicProtectionBenefitObserved: hasProtectiveDrug,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Kriz et al. 2013 JASN; Grahammer et al. 2013 J Clin Invest',
    },
  }
}
