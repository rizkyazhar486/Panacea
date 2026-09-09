import type {
  AnatomyAssetDescriptor,
  AnatomyAtlasNode,
  AtlasCameraState,
  AtlasLoadPlan,
} from './atlasTypes.ts'
import type { AtlasQueryOptions } from './atlasGraph.ts'
import type { AtlasSectionPlane, AtlasSectionHit } from './atlasCrossSection.ts'
import { queryNodesForSection } from './atlasCrossSection.ts'
import {
  PANACEA_ANATOMY_ATLAS,
  PANACEA_ATLAS_NODES,
  resolveAtlasSourceCoverage,
  type AtlasSourceBindingCoverage,
} from './atlasRegistry.ts'
import { buildAtlasLoadPlan } from './atlasStreaming.ts'

export type AtlasGeometryEntitlement =
  | 'metadata-only'
  | 'conceptual-only'
  | 'source-candidate'
  | 'verified-anatomy'

export interface AtlasNavigationRequest {
  query: string
  queryOptions?: AtlasQueryOptions
  sectionPlane?: AtlasSectionPlane
  assets?: readonly AnatomyAssetDescriptor[]
  camera?: AtlasCameraState
  gpuBudgetBytes?: number
  residentResourceKeys?: ReadonlySet<string>
}

export type AtlasNavigationPlan =
  | { status: 'unresolved'; query: string }
  | { status: 'ambiguous'; query: string; candidateIds: readonly string[] }
  | {
      status: 'resolved'
      node: AnatomyAtlasNode
      lineage: readonly AnatomyAtlasNode[]
      siblingIds: readonly string[]
      childIds: readonly string[]
      sourceCoverage: readonly AtlasSourceBindingCoverage[]
      geometryEntitlement: AtlasGeometryEntitlement
      sectionHits: readonly AtlasSectionHit[]
      loadPlan?: AtlasLoadPlan
    }

/**
 * Rendering is considered verified anatomy only when semantic review, source
 * binding verification, academic review metadata, and model-asset review all
 * agree. A mesh-name hit alone can never grant this entitlement.
 */
export function atlasGeometryEntitlement(node: AnatomyAtlasNode): AtlasGeometryEntitlement {
  const fullyReviewed = node.reviewStatus === 'anatomist-reviewed'
    && node.provenance.some((record) => record.academicReview === 'recorded' && record.modelAssetReview === 'anatomist-reviewed')
    && node.sourceBindings.some((binding) => binding.status === 'renderer-verified' && binding.meshMode === 'native-mesh')
  if (fullyReviewed) return 'verified-anatomy'

  if (node.sourceBindings.some((binding) => binding.meshMode === 'conceptual-overlay')) return 'conceptual-only'
  if (node.scale === 'micro') return 'conceptual-only'
  if (node.sourceBindings.length) return 'source-candidate'
  return 'metadata-only'
}

function navigationLineage(node: AnatomyAtlasNode) {
  return [...PANACEA_ANATOMY_ATLAS.ancestorsOf(node.id)].reverse().concat(node)
}

function boundedSiblingIds(node: AnatomyAtlasNode, max = 12) {
  if (!node.parentId) return []
  return PANACEA_ANATOMY_ATLAS.childrenOf(node.parentId)
    .filter((candidate) => candidate.id !== node.id)
    .slice(0, max)
    .map((candidate) => candidate.id)
}

export function planAtlasNavigation(request: AtlasNavigationRequest): AtlasNavigationPlan {
  const resolution = PANACEA_ANATOMY_ATLAS.resolve(request.query, request.queryOptions)
  if (resolution.status === 'unresolved') return { status: 'unresolved', query: request.query }
  if (resolution.status === 'ambiguous') {
    return {
      status: 'ambiguous',
      query: request.query,
      candidateIds: resolution.candidates.map((node) => node.id),
    }
  }

  const node = resolution.node
  const lineage = navigationLineage(node)
  const childIds = PANACEA_ANATOMY_ATLAS.childrenOf(node.id).slice(0, 24).map((child) => child.id)
  const siblingIds = boundedSiblingIds(node)
  const sourceCoverage = resolveAtlasSourceCoverage(node.id)
  const sectionHits = request.sectionPlane
    ? queryNodesForSection(PANACEA_ATLAS_NODES, request.sectionPlane)
    : []

  let loadPlan: AtlasLoadPlan | undefined
  if (request.assets && request.camera && request.gpuBudgetBytes) {
    const visibleNodeIds = new Set([
      ...lineage.map((entry) => entry.id),
      ...siblingIds,
      ...childIds,
      ...sectionHits.map((hit) => hit.node.id),
    ])
    loadPlan = buildAtlasLoadPlan(request.assets, request.camera, {
      selectedNodeIds: new Set([node.id]),
      visibleNodeIds,
      focusRegions: new Set(node.regions),
      residentResourceKeys: request.residentResourceKeys ?? new Set<string>(),
      gpuBudgetBytes: request.gpuBudgetBytes,
    })
  }

  return {
    status: 'resolved',
    node,
    lineage,
    siblingIds,
    childIds,
    sourceCoverage,
    geometryEntitlement: atlasGeometryEntitlement(node),
    sectionHits,
    loadPlan,
  }
}
