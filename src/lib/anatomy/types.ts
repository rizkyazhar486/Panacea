export const ANATOMY_SYSTEMS = [
  'regional', 'skeletal', 'articular', 'muscular', 'fascial', 'cardiovascular',
  'arterial', 'venous', 'lymphatic', 'respiratory', 'nervous-cns', 'nervous-pns',
  'digestive', 'hepatobiliary', 'urinary', 'endocrine', 'reproductive',
  'integumentary', 'sensory',
] as const

export type AnatomySystemId = typeof ANATOMY_SYSTEMS[number]

export const ANATOMY_REGIONS = [
  'whole-body', 'head', 'neck', 'thorax', 'abdomen', 'pelvis-perineum', 'back-spine',
  'upper-limb', 'lower-limb',
] as const

export type AnatomyRegionId = typeof ANATOMY_REGIONS[number]
export type AnatomyLaterality = 'midline' | 'left' | 'right' | 'bilateral' | 'none'
export type AnatomyReviewStatus = 'reference' | 'provisional'

export type AnatomyRelationType =
  | 'part-of'
  | 'contains'
  | 'adjacent-to'
  | 'supplies'
  | 'drains-to'
  | 'innervates'
  | 'articulates-with'
  | 'courses-through'
  | 'branches-to'
  | 'communicates-with'
  | 'attached-to'

export interface AnatomyTerminologySlot {
  system: string
  code: string
  version?: string
  source?: string
}

export interface AnatomyStructure {
  id: string
  label: string
  synonyms: readonly string[]
  system: AnatomySystemId
  regions: readonly AnatomyRegionId[]
  laterality: AnatomyLaterality
  parentId?: string
  tags: readonly string[]
  assetGroupId?: string
  terminology?: readonly AnatomyTerminologySlot[]
  reviewStatus: AnatomyReviewStatus
}

export interface AnatomyRelation {
  from: string
  to: string
  type: AnatomyRelationType
  bidirectional?: boolean
  note?: string
}

export type AtlasCompression = 'none' | 'draco' | 'meshopt'
export type AtlasProvenanceStatus = 'unresolved' | 'recorded'

export interface AtlasAssetProvenance {
  status: AtlasProvenanceStatus
  sourceName?: string
  sourceUrl?: string
  license?: string
  licenseUrl?: string
  revision?: string
  attribution?: string
}

export interface AtlasCoordinateFrame {
  handedness: 'right-handed' | 'left-handed'
  upAxis: 'x' | 'y' | 'z'
  unit: 'meter' | 'centimeter' | 'millimeter'
  anatomicalAxes: {
    leftRight: string
    inferiorSuperior: string
    posteriorAnterior: string
  }
}

export interface AtlasLod {
  level: 0 | 1 | 2 | 3
  triangleBudget: number
  textureBudgetMB: number
  maxScreenErrorPx: number
}

export interface AnatomyAssetRecord {
  id: string
  structureIds: readonly string[]
  logicalUri: `atlas://${string}`
  format: 'glb' | 'gltf'
  compression: AtlasCompression
  coordinateFrame: AtlasCoordinateFrame
  lods: readonly AtlasLod[]
  provenance: AtlasAssetProvenance
  loadClass: 'critical' | 'interactive' | 'deferred'
}

export type AnatomyResolutionStatus = 'resolved' | 'ambiguous' | 'not-found'
export type AnatomyResolutionMode = 'single' | 'composite'

export interface AnatomyResolveContext {
  system?: AnatomySystemId
  region?: AnatomyRegionId
  laterality?: Exclude<AnatomyLaterality, 'none' | 'bilateral'>
  mode?: AnatomyResolutionMode
  limit?: number
}

export interface AnatomyResolvedCandidate {
  structure: AnatomyStructure
  score: number
  reason: 'canonical-id' | 'exact-label' | 'exact-synonym' | 'contextual-alias'
}

export interface AnatomyResolution {
  query: string
  normalizedQuery: string
  status: AnatomyResolutionStatus
  candidates: readonly AnatomyResolvedCandidate[]
  reason: string
}

export interface AtlasLoadContext {
  visibleStructureIds: readonly string[]
  clinicalFocusStructureIds?: readonly string[]
  interactionStructureIds?: readonly string[]
  pinnedStructureIds?: readonly string[]
  transferBudgetMB?: number
}

export interface AtlasLoadPlanItem {
  asset: AnatomyAssetRecord
  score: number
  reasons: readonly string[]
  requestedStructureIds: readonly string[]
}

export interface AtlasValidationIssue {
  code: string
  message: string
  structureId?: string
  assetId?: string
}

export interface AtlasValidationReport {
  valid: boolean
  issues: readonly AtlasValidationIssue[]
}
