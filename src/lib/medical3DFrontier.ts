export type Medical3DFrontierId =
  | 'hemodynamics-4d'
  | 'neuro-tract-connectome'
  | 'embryology-morphogenesis'
  | 'tumor-immune-microenvironment'

export interface Medical3DFrontierSpec {
  id: Medical3DFrontierId
  label: string
  shortLabel: string
  mission: string
  visualLayers: string[]
  interactions: string[]
  integrations: string[]
  scientificBoundary: string
  astraTarget: string
}

export const MEDICAL_3D_FRONTIER: Medical3DFrontierSpec[] = [
  {
    id: 'hemodynamics-4d',
    label: '4D Hemodynamics & Congenital Flow Lab',
    shortLabel: 'Hemodynamics',
    mission: 'Teach how pressure gradients, resistance, shunts, valves and great-vessel topology change blood flow through the cardiac cycle.',
    visualLayers: ['heart chambers', 'great vessels', 'flow particles', 'pressure field', 'shunt path', 'valve state', 'cardiac phase'],
    interactions: ['orbit/zoom', 'systole-diastole scrubber', 'pressure gradient slider', 'relative radius slider', 'normal vs VSD/ASD/PDA/TGA/TOF scenario'],
    integrations: ['Cardio Lab', 'Body Explorer', 'Radiology', 'Surgical Lab', 'Knowledge Bridge'],
    scientificBoundary: 'The built-in equations are dimensionless teaching approximations. They are not CFD, catheterization data, Doppler quantification or a patient-specific hemodynamic model.',
    astraTarget: 'Blender-quality beating-heart materials, translucent chambers, phase-locked valve motion, flow streaklines and pressure/velocity overlays without implying patient-specific simulation.',
  },
  {
    id: 'neuro-tract-connectome',
    label: 'Neuro Tract & Connectome Atlas',
    shortLabel: 'Neuro tracts',
    mission: 'Connect named CNS pathways to anatomy, crossings, nuclei, spinal levels and lesion-dependent deficits.',
    visualLayers: ['brain shell', 'brainstem', 'spinal cord', 'corticospinal tract', 'spinothalamic tract', 'dorsal columns', 'visual pathway', 'cranial nerve corridors'],
    interactions: ['orbit/zoom', 'tract isolate', 'lesion level slider', 'laterality toggle', 'origin-to-termination animation', 'deficit overlay'],
    integrations: ['Body Explorer', 'Specialty Lab', 'Radiology', 'Clinical Hub'],
    scientificBoundary: 'Procedural tract curves are schematic educational routes, not diffusion-MRI tractography and not a subject-specific connectome.',
    astraTarget: 'Anatomically anchored fiber bundles with crossings, nuclei and foramina; use imported validated neuroanatomy meshes where available and clearly label schematic fibers.',
  },
  {
    id: 'embryology-morphogenesis',
    label: 'Embryology Morphogenesis Atlas',
    shortLabel: 'Embryology',
    mission: 'Show how body form emerges across fertilization, gastrulation, neurulation, folding, cardiac looping and organogenesis, then link developmental divergence to congenital anomalies.',
    visualLayers: ['blastocyst', 'germ layers', 'neural plate/tube', 'somites', 'gut tube', 'heart tube/looping', 'pharyngeal arches', 'limb buds'],
    interactions: ['week/day timeline', 'explode germ layers', 'normal vs divergence branch', 'lineage highlight', 'organ origin tracing'],
    integrations: ['Body Explorer', 'Cell Lab', 'Cardio Lab', 'Genomics Lab', 'Knowledge Bridge'],
    scientificBoundary: 'Stage geometry is an educational morphogenesis schematic unless derived from a cited embryology atlas; timing varies and should not be interpreted as patient-specific fetal assessment.',
    astraTarget: 'Smooth morph transitions between validated developmental stages, lineage-consistent coloring, cardiac looping animation and congenital-divergence branching.',
  },
  {
    id: 'tumor-immune-microenvironment',
    label: 'Tumor–Immune Microenvironment 3D',
    shortLabel: 'Tumor microenvironment',
    mission: 'Visualize spatial relationships among tumor, immune cells, stroma, vessels, hypoxia and molecular signaling from tissue to cellular scale.',
    visualLayers: ['tumor clones', 'T cells', 'macrophages', 'fibroblasts/stroma', 'microvasculature', 'hypoxia field', 'checkpoint/receptor overlay'],
    interactions: ['orbit/zoom', 'cell-type isolate', 'hypoxia gradient', 'immune infiltration slider', 'clone selection', 'biopsy region selection'],
    integrations: ['Cell Lab', 'Biomedical Engine', 'Genomics Lab', 'Spatial Omics Pathology', 'Radiology'],
    scientificBoundary: 'The default scene is a teaching microenvironment, not histopathology from a real patient. Patient-specific claims require validated WSI/spatial-omics segmentation and provenance.',
    astraTarget: 'Multiscale zoom from organ/tumor margin to cell neighborhoods with volumetric gradients, vessel perfusion, immune-tumor interactions and source-linked spatial-omics overlays.',
  },
]

export function medical3DFrontierSpec(id: Medical3DFrontierId): Medical3DFrontierSpec {
  const found = MEDICAL_3D_FRONTIER.find((x) => x.id === id)
  if (!found) throw new Error(`Unknown 3D frontier id: ${id}`)
  return found
}

export function relativePoiseuilleResistance(radiusRatioRaw: number): number {
  const radiusRatio = Math.max(0.1, Math.min(3, radiusRatioRaw))
  return 1 / Math.pow(radiusRatio, 4)
}

export function relativeFlowIndex(deltaPressureRaw: number, radiusRatioRaw: number): number {
  const deltaPressure = Math.max(0, deltaPressureRaw)
  const resistance = relativePoiseuilleResistance(radiusRatioRaw)
  return resistance > 0 ? deltaPressure / resistance : 0
}

export const MEDICAL_3D_TRUTH_RULES = [
  'Never label schematic geometry as patient-specific anatomy.',
  'Never call particle animation CFD unless it is produced by a validated fluid solver with explicit boundary conditions.',
  'Never call procedural fiber curves tractography unless they come from diffusion-MRI tractography data.',
  'Never imply embryology timing or morphology is a fetal diagnostic assessment.',
  'Never imply synthetic tumor-cell placement is histopathology or spatial omics.',
  'Measured, documented, modeled and educational layers must remain visually distinguishable.',
] as const

export interface CardiacWiggersCycleState {
  readonly phase: 'ISOVOLUMETRIC_CONTRACTION' | 'SYSTOLIC_EJECTION' | 'ISOVOLUMETRIC_RELAXATION' | 'DIASTOLIC_FILLING'
  readonly normalizedPhase: number
  readonly aorticValveOpenFraction: number
  readonly mitralValveOpenFraction: number
  readonly ventricularVolumeFraction: number
  readonly lvPressureMmhg: number
  readonly aorticPressureMmhg: number
}

/**
 * Calculates phase-locked valvular motion and ventricular pressure-volume state
 * aligned with the classical Carl Wiggers cardiac cycle diagram.
 */
export function calculateCardiacWiggersCycle(tSeconds: number, heartRateBpm = 75): CardiacWiggersCycleState {
  const bpm = Math.max(30, Math.min(220, heartRateBpm))
  const cycleDuration = 60 / bpm
  const normalizedPhase = ((tSeconds % cycleDuration) + cycleDuration) % cycleDuration / cycleDuration

  if (normalizedPhase < 0.05) {
    // Isovolumetric Contraction (all valves closed, LV pressure rises 10 -> 80 mmHg)
    const subPhase = normalizedPhase / 0.05
    return {
      phase: 'ISOVOLUMETRIC_CONTRACTION',
      normalizedPhase,
      aorticValveOpenFraction: 0,
      mitralValveOpenFraction: 0,
      ventricularVolumeFraction: 1.0,
      lvPressureMmhg: 10 + 70 * subPhase,
      aorticPressureMmhg: 80,
    }
  } else if (normalizedPhase < 0.35) {
    // Systolic Ejection (Aortic valve opens, ejection fraction 60%, LV volume 1.0 -> 0.4)
    const subPhase = (normalizedPhase - 0.05) / 0.30
    const ejectionCurve = Math.sin(subPhase * Math.PI)
    return {
      phase: 'SYSTOLIC_EJECTION',
      normalizedPhase,
      aorticValveOpenFraction: Math.min(1.0, Math.sin(subPhase * Math.PI) * 1.25),
      mitralValveOpenFraction: 0,
      ventricularVolumeFraction: 1.0 - 0.60 * Math.sin(subPhase * (Math.PI / 2)),
      lvPressureMmhg: 80 + 40 * ejectionCurve,
      aorticPressureMmhg: 80 + 40 * ejectionCurve,
    }
  } else if (normalizedPhase < 0.40) {
    // Isovolumetric Relaxation (Aortic valve snaps closed, pressure drops 80 -> 10 mmHg)
    const subPhase = (normalizedPhase - 0.35) / 0.05
    return {
      phase: 'ISOVOLUMETRIC_RELAXATION',
      normalizedPhase,
      aorticValveOpenFraction: 0,
      mitralValveOpenFraction: 0,
      ventricularVolumeFraction: 0.40,
      lvPressureMmhg: 80 - 70 * subPhase,
      aorticPressureMmhg: 85 - 5 * subPhase, // dicrotic notch
    }
  } else {
    // Diastolic Filling (Mitral valve opens, LV volume fills 0.4 -> 1.0)
    const subPhase = (normalizedPhase - 0.40) / 0.60
    return {
      phase: 'DIASTOLIC_FILLING',
      normalizedPhase,
      aorticValveOpenFraction: 0,
      mitralValveOpenFraction: Math.min(1.0, Math.sin(subPhase * Math.PI) * 1.15),
      ventricularVolumeFraction: 0.40 + 0.60 * Math.sin(subPhase * (Math.PI / 2)),
      lvPressureMmhg: 8 + 4 * Math.sin(subPhase * Math.PI),
      aorticPressureMmhg: 80 - 10 * subPhase,
    }
  }
}

/**
 * Calculates saltatory conduction wave position and Ranvier depolarization along a myelinated axon.
 */
export function calculateSaltatoryNerveImpulse(
  tSeconds: number,
  conductionVelocityMps = 60,
  tractLengthMeters = 0.8
): { readonly wavePositionMeters: number; readonly isRanvierNodeActive: boolean; readonly actionPotentialMv: number } {
  const v = Math.max(1, conductionVelocityMps)
  const len = Math.max(0.1, tractLengthMeters)
  const wavePositionMeters = ((tSeconds * v) % len + len) % len
  const nodeSpacing = 0.0015 // ~1.5mm distance between nodes of Ranvier
  const distanceToNearestNode = Math.abs((wavePositionMeters % nodeSpacing) - nodeSpacing / 2)
  const isRanvierNodeActive = distanceToNearestNode < 0.0002
  const actionPotentialMv = isRanvierNodeActive ? 30 : -70

  return { wavePositionMeters, isRanvierNodeActive, actionPotentialMv }
}

/**
 * Krogh Cylinder Model: Calculates the effective oxygen diffusion radius
 * from microvessels before tissue hypoxia occurs (pO2 < 10 mmHg).
 */
export function calculateKroghOxygenDiffusionRadiusMicrons(
  arteriolarPo2Mmhg = 95,
  metabolicConsumptionRate = 1.0
): { readonly diffusionRadiusMicrons: number; readonly isHypoxicBeyondLimit: boolean } {
  const po2 = Math.max(10, arteriolarPo2Mmhg)
  const consumption = Math.max(0.2, metabolicConsumptionRate)
  // Baseline Krogh radius ~ 140 microns at normal consumption and 95 mmHg
  const diffusionRadiusMicrons = Math.min(250, Math.max(50, 140 * Math.sqrt(po2 / 95) / Math.sqrt(consumption)))
  return { diffusionRadiusMicrons, isHypoxicBeyondLimit: true }
}

