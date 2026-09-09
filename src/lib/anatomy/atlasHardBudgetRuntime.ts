import {
  atlasNodeById,
  chooseAtlasLod,
  type AtlasDeviceBudget,
  type AtlasLodProfile,
  type AtlasManifest,
  type AtlasNode,
  type AtlasRegionId,
  type AtlasRenderRequest,
} from './atlasKernel'
import {
  planHighEndAtlasLods,
  type AtlasFocusContext,
  type AtlasLodOption,
  type AtlasLodPlan,
  type AtlasRenderBudget,
  type AtlasRenderCandidate,
} from './highEndAtlasLodPlanner'

export interface AtlasHardBudgetInput {
  manifest: AtlasManifest
  request: AtlasRenderRequest
  budget: AtlasRenderBudget
  viewportWidth: number
  viewportHeight: number
  requiredNodeIds?: readonly string[]
  /** Engineering estimate only; configurable because actual vertex formats vary. */
  estimatedGeometryBytesPerTriangle?: number
}

export interface AtlasHardBudgetFramePlan extends AtlasLodPlan {
  candidateCount: number
  preflightBlocked: readonly string[]
}

const TIER_PROJECTED_PIXELS: Readonly<Record<AtlasLodProfile['tier'], number>> = {
  macro: 0,
  standard: 80,
  detail: 220,
  micro: 520,
}

const TIER_QUALITY: Readonly<Record<AtlasLodProfile['tier'], number>> = {
  macro: 0.25,
  standard: 0.55,
  detail: 0.8,
  micro: 1,
}

const TIER_LEVEL: Readonly<Record<AtlasLodProfile['tier'], number>> = {
  macro: 3,
  standard: 2,
  detail: 1,
  micro: 0,
}

const unlimitedDeviceBudget: AtlasDeviceBudget = {
  triangleBudget: Number.MAX_SAFE_INTEGER,
  textureBudgetMegabytes: Number.MAX_SAFE_INTEGER,
  nodeBudget: Number.MAX_SAFE_INTEGER,
  devicePixelRatio: 1,
  viewportWidth: 16_384,
  viewportHeight: 16_384,
}

function lodProfilesFor(node: AtlasNode) {
  if (node.lod?.length) return [...node.lod]
  const unique = new Map<string, AtlasLodProfile>()
  for (const pixels of Object.values(TIER_PROJECTED_PIXELS)) {
    const lod = chooseAtlasLod(node, pixels, unlimitedDeviceBudget)
    unique.set(lod.tier, lod)
  }
  return [...unique.values()]
}

function nodeRegion(node: AtlasNode, request: AtlasRenderRequest): AtlasRegionId {
  const explicit = request.regions?.find((region) => node.regions.includes(region))
  return explicit ?? node.regions[0] ?? 'whole-body'
}

function nodeMatchesRequest(node: AtlasNode, request: AtlasRenderRequest) {
  if (!request.includeReferenceOnly && (node.geometryStatus === 'reference-only' || node.geometryStatus === 'planned')) return false
  if (request.systems?.length && !request.systems.includes(node.system)) return false
  if (request.regions?.length && !node.regions.some((region) => request.regions!.includes(region))) return false
  return true
}

function nodeLodOptions(node: AtlasNode, estimatedGeometryBytesPerTriangle: number): AtlasLodOption[] {
  const sourceDrawCalls = Math.max(1, node.source.files?.length ?? 1)
  return lodProfilesFor(node)
    .map((lod) => ({
      level: TIER_LEVEL[lod.tier],
      quality: TIER_QUALITY[lod.tier],
      assetId: `${node.id}:${lod.tier}`,
      triangles: Math.max(1, Math.floor(lod.maxTriangles)),
      drawCalls: sourceDrawCalls,
      gpuBytes: Math.max(1, Math.floor(lod.maxTextureMegabytes * 1024 * 1024 + lod.maxTriangles * estimatedGeometryBytesPerTriangle)),
    }))
    .sort((a, b) => a.level - b.level)
}

export function buildAtlasHardBudgetCandidates(input: AtlasHardBudgetInput): AtlasRenderCandidate[] {
  const required = new Set([input.request.selectedNodeId, ...(input.requiredNodeIds ?? [])].filter((id): id is string => Boolean(id)))
  const maxViewportDimension = Math.max(1, input.viewportWidth, input.viewportHeight)
  const bytesPerTriangle = Math.max(1, input.estimatedGeometryBytesPerTriangle ?? 32)

  return input.manifest.nodes
    .filter((node) => nodeMatchesRequest(node, input.request) || required.has(node.id))
    .filter((node) => node.geometryStatus === 'shipped' || node.geometryStatus === 'partial' || input.request.includeReferenceOnly)
    .map((node) => ({
      structureId: node.id,
      system: node.system,
      region: nodeRegion(node, input.request),
      educationalImportance: node.educationalPriority,
      projectedCoverage: Math.max(0, Math.min(1, (input.request.projectedPixelsByNodeId?.[node.id] ?? 120) / maxViewportDimension)),
      required: required.has(node.id),
      lods: nodeLodOptions(node, bytesPerTriangle),
    }))
    .sort((a, b) => a.structureId.localeCompare(b.structureId))
}

/**
 * Strict whole-body frame planner.
 *
 * Unlike the adaptive streaming layer, this planner has no "pinned may exceed
 * budget" escape hatch. A selected/required structure must fit at least its
 * cheapest canonical LOD or the frame becomes budget-blocked. The caller can
 * then reduce DPR, unload other views, or show an explicit quality limitation.
 */
export function planAtlasHardBudgetFrame(input: AtlasHardBudgetInput): AtlasHardBudgetFramePlan {
  const requiredIds = new Set([input.request.selectedNodeId, ...(input.requiredNodeIds ?? [])].filter((id): id is string => Boolean(id)))
  const candidates = buildAtlasHardBudgetCandidates(input)
  const candidateIds = new Set(candidates.map((candidate) => candidate.structureId))
  const preflightBlocked = [...requiredIds].filter((id) => {
    const node = atlasNodeById(input.manifest, id)
    return !node || !candidateIds.has(id)
  }).sort()

  const selectedNode = input.request.selectedNodeId ? atlasNodeById(input.manifest, input.request.selectedNodeId) : undefined
  const focus: AtlasFocusContext = {
    structureIds: requiredIds,
    systems: new Set([
      ...(input.request.systems ?? []),
      ...(selectedNode ? [selectedNode.system] : []),
    ]),
    regions: new Set([
      ...(input.request.regions ?? []),
      ...(selectedNode?.regions ?? []),
    ]),
  }

  const plan = planHighEndAtlasLods(candidates, input.budget, focus)
  const unresolvedRequired = [...new Set([...preflightBlocked, ...plan.unresolvedRequired])].sort()
  return {
    ...plan,
    status: unresolvedRequired.length ? 'budget-blocked' : plan.status,
    unresolvedRequired,
    candidateCount: candidates.length,
    preflightBlocked,
  }
}
