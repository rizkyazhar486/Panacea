export const ANATOMY_SYSTEMS = [
  'skeletal',
  'muscular',
  'arterial',
  'venous',
  'lymphatic',
  'nervous',
  'respiratory',
  'cardiovascular',
  'gastrointestinal',
  'hepatobiliary',
  'urinary',
  'female-reproductive',
  'male-reproductive',
  'endocrine',
  'integumentary',
  'fascia-connective',
] as const

export type AnatomySystem = (typeof ANATOMY_SYSTEMS)[number]

export const ANATOMY_REGIONS = [
  'whole-body',
  'head-neck',
  'thorax',
  'abdomen',
  'pelvis',
  'back-spine',
  'upper-limb',
  'lower-limb',
] as const

export type AnatomyRegion = (typeof ANATOMY_REGIONS)[number]
export type AnatomyLaterality = 'midline' | 'left' | 'right' | 'bilateral' | 'not-applicable'
export type AnatomyScale = 'whole-body' | 'regional' | 'organ' | 'substructure' | 'micro'
export type AnatomyReviewStatus = 'structural-draft' | 'source-checked' | 'anatomist-reviewed'
export type AnatomyBindingStatus = 'candidate' | 'source-node-verified' | 'renderer-verified'
export type AnatomyMeshMode = 'native-mesh' | 'derived-highlight' | 'conceptual-overlay' | 'metadata-only'
export type AnatomyCompression = 'none' | 'draco' | 'meshopt'
export type AnatomyRelationKind = 'contains' | 'adjacent-to' | 'continuous-with' | 'cross-scale-reference'

export interface AtlasVec3 {
  x: number
  y: number
  z: number
}

export interface AtlasAabb {
  min: AtlasVec3
  max: AtlasVec3
}

export interface AnatomyProvenance {
  sourceId: string
  sourceVersion: string
  sourceLocator: string
  evidenceKind: 'authoritative-atlas' | 'peer-reviewed' | 'standard' | 'internal-structural'
  academicReview: 'pending' | 'recorded'
  modelAssetReview: 'pending' | 'visual-qa' | 'anatomist-reviewed'
  licenseId?: string
  note?: string
}

export interface AnatomySourceBinding {
  file: string
  sourceNodeHints: readonly string[]
  status: AnatomyBindingStatus
  meshMode: AnatomyMeshMode
}

export interface AnatomyRelation {
  kind: AnatomyRelationKind
  targetId: string
  reviewStatus: AnatomyReviewStatus
}

export interface AnatomyAtlasNode {
  id: string
  canonicalName: string
  synonyms: readonly string[]
  system: AnatomySystem
  regions: readonly AnatomyRegion[]
  laterality: AnatomyLaterality
  scale: AnatomyScale
  parentId?: string
  relations?: readonly AnatomyRelation[]
  spatialBounds?: AtlasAabb
  sourceBindings: readonly AnatomySourceBinding[]
  provenance: readonly AnatomyProvenance[]
  reviewStatus: AnatomyReviewStatus
  educationalOnly: true
  notes?: readonly string[]
}

export interface AnatomyAssetLod {
  level: 0 | 1 | 2 | 3 | 4
  resourceKey: string
  minProjectedPixels: number
  estimatedGpuBytes: number
  triangleEstimate?: number
}

export interface AnatomyAssetDescriptor {
  id: string
  nodeId: string
  system: AnatomySystem
  regions: readonly AnatomyRegion[]
  diameterWorldUnits: number
  compression: AnatomyCompression
  lods: readonly AnatomyAssetLod[]
  provenance: AnatomyProvenance
}

export interface AtlasCameraState {
  distanceToTarget: number
  verticalFovRadians: number
  viewportHeightPx: number
}

export interface AtlasDemandState {
  selectedNodeIds: ReadonlySet<string>
  visibleNodeIds: ReadonlySet<string>
  focusRegions: ReadonlySet<AnatomyRegion>
  residentResourceKeys: ReadonlySet<string>
  gpuBudgetBytes: number
}

export interface AtlasLoadDecision {
  assetId: string
  nodeId: string
  resourceKey: string
  lodLevel: AnatomyAssetLod['level']
  estimatedGpuBytes: number
  projectedPixels: number
  priority: number
  action: 'load' | 'retain'
}

export interface AtlasLoadPlan {
  load: readonly AtlasLoadDecision[]
  retain: readonly AtlasLoadDecision[]
  evict: readonly string[]
  estimatedResidentBytes: number
  budgetBytes: number
}

export type AtlasQueryResult =
  | { status: 'resolved'; node: AnatomyAtlasNode; matchedBy: 'id' | 'canonical' | 'synonym' }
  | { status: 'ambiguous'; candidates: readonly AnatomyAtlasNode[] }
  | { status: 'unresolved' }
