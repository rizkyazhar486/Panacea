import { INDEKS_TUBUH, pasangan, type StrukturTubuh } from '../bodySearch'
import { KEDALAMAN, type KunciLapisan } from '../dissection'

export interface LayerPrecisionDefinition {
  layer: StrukturTubuh['l']
  label: string
  sourceFile: string
  depthStage: number
}

export interface LayerPrecisionMember {
  exactMeshName: string
  baseName: string
  laterality: StrukturTubuh['s']
  region: string
  normalizedHeight: number
  normalizedRadialDistance: number
  triangles: number
}

export interface LayerPrecisionRecord {
  source: 'whole-body-geometry-index'
  layer: LayerPrecisionDefinition
  exactMeshNames: readonly string[]
  members: readonly LayerPrecisionMember[]
  totalTriangles: number
  coordinateSpace: 'normalized-whole-body-model'
  physicallyCalibrated: false
  physicalUnit: null
  calibrationNote: string
}

const SOURCE_FILE_BY_LAYER: Record<StrukturTubuh['l'], string> = {
  surface: 'surface.glb',
  skeletal: 'skeletal.glb',
  muscular: 'muscular.glb',
  cardiovascular: 'cardiovascular.glb',
  nervous: 'nervous.glb',
  visceral: 'visceral.glb',
  lymphoid: 'lymphoid.glb',
}

const LABEL_BY_LAYER: Record<StrukturTubuh['l'], string> = {
  surface: 'Surface / skin',
  skeletal: 'Skeleton',
  muscular: 'Muscle',
  cardiovascular: 'Cardiovascular',
  nervous: 'Nervous',
  visceral: 'Visceral organs',
  lymphoid: 'Lymphoid / lymphatic',
}

export const LAYER_PRECISION_LAYERS: readonly LayerPrecisionDefinition[] = (
  Object.keys(SOURCE_FILE_BY_LAYER) as StrukturTubuh['l'][]
)
  .map((layer) => ({
    layer,
    label: LABEL_BY_LAYER[layer],
    sourceFile: SOURCE_FILE_BY_LAYER[layer],
    depthStage: KEDALAMAN[layer as KunciLapisan],
  }))
  .sort((a, b) => a.depthStage - b.depthStage)

export function layerPrecisionDefinition(layer: StrukturTubuh['l']): LayerPrecisionDefinition {
  return {
    layer,
    label: LABEL_BY_LAYER[layer],
    sourceFile: SOURCE_FILE_BY_LAYER[layer],
    depthStage: KEDALAMAN[layer as KunciLapisan],
  }
}

function memberFromIndex(structure: StrukturTubuh): LayerPrecisionMember {
  return {
    exactMeshName: structure.n,
    baseName: structure.b,
    laterality: structure.s,
    region: structure.w,
    normalizedHeight: structure.y,
    normalizedRadialDistance: structure.r,
    triangles: structure.t,
  }
}

/**
 * Produces a source-truth inspection record for one indexed whole-body mesh.
 *
 * Precision here means exact source identity and deterministic model-space
 * metadata. The shipped index does not contain a validated patient-scale
 * transform, so this contract deliberately exposes no centimetre, millimetre,
 * inch, or other physical-distance value. A future calibrated asset may add a
 * separate physical transform only after its scale and provenance are verified.
 */
export function layerPrecisionForStructure(structure: StrukturTubuh): LayerPrecisionRecord {
  const exactMeshNames = [...new Set(pasangan(structure))]
  const members = exactMeshNames
    .map((name) => INDEKS_TUBUH.find((candidate) => candidate.n === name && candidate.l === structure.l))
    .filter((candidate): candidate is StrukturTubuh => Boolean(candidate))
    .map(memberFromIndex)

  return {
    source: 'whole-body-geometry-index',
    layer: layerPrecisionDefinition(structure.l),
    exactMeshNames,
    members,
    totalTriangles: members.reduce((sum, member) => sum + member.triangles, 0),
    coordinateSpace: 'normalized-whole-body-model',
    physicallyCalibrated: false,
    physicalUnit: null,
    calibrationNote: 'Coordinates are normalized model-space metadata, not patient distance. No cm/mm/inch conversion is valid without a verified physical scale transform.',
  }
}

export function layerPrecisionByExactName(exactMeshName: string): LayerPrecisionRecord | null {
  const structure = INDEKS_TUBUH.find((candidate) => candidate.n === exactMeshName)
  return structure ? layerPrecisionForStructure(structure) : null
}
