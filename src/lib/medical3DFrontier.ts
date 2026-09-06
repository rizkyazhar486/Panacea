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
