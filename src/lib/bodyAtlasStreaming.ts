import {
  BODY_ATLAS_GRAPH,
  BODY_ATLAS_LAYER_FILES,
  type BodyAtlasGraph,
  type BodyAtlasLayer,
} from './bodyAtlasGraph'

export type BodyAtlasRuntimeProfileId = 'constrained-mobile' | 'balanced' | 'workstation' | '5k-reference-capture'

export interface BodyAtlasAssetRecord {
  layer: BodyAtlasLayer
  file: string
  path: string
  bytes: number
  gitBlobSha: string
}

export interface BodyAtlasRuntimeProfile {
  id: BodyAtlasRuntimeProfileId
  maxResidentBytes: number
  triangleBudget: number
  maxResidentLayers: number
  devicePixelRatioCap: number
  note: string
}

export interface BodyAtlasLayerCost extends BodyAtlasAssetRecord {
  triangles: number
  nodeCount: number
  bytesPerTriangle: number
}

export interface BodyAtlasStreamingRequest {
  profile: BodyAtlasRuntimeProfileId
  focusLayers?: readonly BodyAtlasLayer[]
  visibleLayers?: readonly BodyAtlasLayer[]
  warmLayers?: readonly BodyAtlasLayer[]
}

export interface BodyAtlasStreamingPlan {
  profile: BodyAtlasRuntimeProfile
  resident: readonly BodyAtlasLayerCost[]
  prefetch: readonly BodyAtlasLayerCost[]
  deferred: readonly BodyAtlasLayerCost[]
  residentBytes: number
  residentTriangles: number
  mandatoryBudgetExceeded: boolean
  deterministicKey: string
}

const MiB = 1024 * 1024

/**
 * Exact checked-in GLB byte inventory for the current high-end atlas runtime.
 * Git blob SHAs establish local byte identity only. They do not by themselves
 * establish upstream source identity, asset-level license evidence,
 * transformation lineage, or qualified anatomical review. Those publication
 * requirements are enforced by the dedicated Body provenance/review gates.
 * Mandatory thebuggeddev references remain design references only and are
 * deliberately absent from this runtime manifest.
 */
export const BODY_ATLAS_ASSET_MANIFEST: readonly BodyAtlasAssetRecord[] = [
  { layer: 'surface', file: 'surface.glb', path: 'public/anatomy/surface.glb', bytes: 998_480, gitBlobSha: '07be399e9d1a6aacbe3f07a94159178494a07d4f' },
  { layer: 'skeletal', file: 'skeletal.glb', path: 'public/anatomy/skeletal.glb', bytes: 2_653_500, gitBlobSha: '14d32743b921f90e60370a80f0c7f4763d502171' },
  { layer: 'muscular', file: 'muscular.glb', path: 'public/anatomy/muscular.glb', bytes: 5_636_668, gitBlobSha: '9d554e57f737385d1aee07d6a4f9b37b4d814db6' },
  { layer: 'cardiovascular', file: 'cardiovascular.glb', path: 'public/anatomy/cardiovascular.glb', bytes: 12_344_948, gitBlobSha: '32e9970de3ccac508272664fca1e538d8c3787da' },
  { layer: 'nervous', file: 'nervous.glb', path: 'public/anatomy/nervous.glb', bytes: 7_785_940, gitBlobSha: '488ba60fac491ab9ac9326ccf7ba658ba34b113f' },
  { layer: 'visceral', file: 'visceral.glb', path: 'public/anatomy/visceral.glb', bytes: 3_682_364, gitBlobSha: '268a6f782d571b089263043d79872511ed7c3ce8' },
  { layer: 'lymphoid', file: 'lymphoid.glb', path: 'public/anatomy/lymphoid.glb', bytes: 652_008, gitBlobSha: '3208ac3f121bfdb58932e9722b718e759b7f7180' },
] as const

export const BODY_ATLAS_RUNTIME_PROFILES: Readonly<Record<BodyAtlasRuntimeProfileId, BodyAtlasRuntimeProfile>> = {
  'constrained-mobile': {
    id: 'constrained-mobile',
    maxResidentBytes: 18 * MiB,
    triangleBudget: 2_500_000,
    maxResidentLayers: 3,
    devicePixelRatioCap: 1.25,
    note: 'Prefer focused anatomy and fast interaction on thermally or memory-constrained mobile GPUs.',
  },
  balanced: {
    id: 'balanced',
    maxResidentBytes: 36 * MiB,
    triangleBudget: 6_000_000,
    maxResidentLayers: 5,
    devicePixelRatioCap: 1.75,
    note: 'Default whole-body exploration profile for modern phones and laptops.',
  },
  workstation: {
    id: 'workstation',
    maxResidentBytes: 72 * MiB,
    triangleBudget: 16_000_000,
    maxResidentLayers: 7,
    devicePixelRatioCap: 2,
    note: 'Allows every shipped atlas layer to stay warm when the GPU budget permits.',
  },
  '5k-reference-capture': {
    id: '5k-reference-capture',
    maxResidentBytes: 96 * MiB,
    triangleBudget: 24_000_000,
    maxResidentLayers: 7,
    devicePixelRatioCap: 2,
    note: 'Offline/high-fidelity QA capture budget. 5K refers to output capture, not mandatory runtime framebuffer size.',
  },
} as const

const LAYER_ORDER: readonly BodyAtlasLayer[] = [
  'surface',
  'skeletal',
  'muscular',
  'cardiovascular',
  'nervous',
  'visceral',
  'lymphoid',
]

function stableUnique<T>(values: readonly T[]) {
  const seen = new Set<T>()
  const result: T[] = []
  for (const value of values) {
    if (seen.has(value)) continue
    seen.add(value)
    result.push(value)
  }
  return result
}

export function buildBodyAtlasLayerCosts(graph: BodyAtlasGraph = BODY_ATLAS_GRAPH): readonly BodyAtlasLayerCost[] {
  const assetByLayer = new Map(BODY_ATLAS_ASSET_MANIFEST.map((asset) => [asset.layer, asset] as const))
  return LAYER_ORDER.map((layer) => {
    const asset = assetByLayer.get(layer)
    if (!asset) throw new Error(`Missing Body atlas asset manifest entry for ${layer}.`)
    const triangles = graph.stats.trianglesByLayer[layer]
    const nodeCount = graph.stats.nodesByLayer[layer]
    return {
      ...asset,
      triangles,
      nodeCount,
      bytesPerTriangle: triangles > 0 ? asset.bytes / triangles : Number.POSITIVE_INFINITY,
    }
  })
}

export const BODY_ATLAS_LAYER_COSTS = buildBodyAtlasLayerCosts()

function planKey(profile: BodyAtlasRuntimeProfile, layers: readonly BodyAtlasLayerCost[]) {
  return `${profile.id}:${layers.map((layer) => layer.layer).join(',')}`
}

/**
 * Layer-level streaming planner.
 *
 * Mandatory focus layers are admitted first even if they exceed the selected
 * profile. Optional visible/warm layers are then ranked by a deterministic
 * relevance-to-cost ratio:
 *
 *   utility = priority / (MiB + triangles / 1e6)
 *
 * This is an engineering scheduler only. It never assigns clinical importance
 * to a structure and never imports third-party reference assets.
 */
export function planBodyAtlasStreaming(
  request: BodyAtlasStreamingRequest,
  graph: BodyAtlasGraph = BODY_ATLAS_GRAPH,
): BodyAtlasStreamingPlan {
  const profile = BODY_ATLAS_RUNTIME_PROFILES[request.profile]
  const costs = buildBodyAtlasLayerCosts(graph)
  const byLayer = new Map(costs.map((cost) => [cost.layer, cost] as const))
  const focus = stableUnique(request.focusLayers ?? []).filter((layer) => byLayer.has(layer))
  const visible = stableUnique(request.visibleLayers ?? []).filter((layer) => byLayer.has(layer))
  const warm = stableUnique(request.warmLayers ?? []).filter((layer) => byLayer.has(layer))

  const resident = new Map<BodyAtlasLayer, BodyAtlasLayerCost>()
  for (const layer of focus) resident.set(layer, byLayer.get(layer)!)

  let residentBytes = [...resident.values()].reduce((sum, cost) => sum + cost.bytes, 0)
  let residentTriangles = [...resident.values()].reduce((sum, cost) => sum + cost.triangles, 0)
  const mandatoryBudgetExceeded = residentBytes > profile.maxResidentBytes
    || residentTriangles > profile.triangleBudget
    || resident.size > profile.maxResidentLayers

  const visibleSet = new Set(visible)
  const warmSet = new Set(warm)
  const candidates = costs
    .filter((cost) => !resident.has(cost.layer))
    .map((cost) => {
      let priority = 10
      if (visibleSet.has(cost.layer)) priority += 1_000
      if (warmSet.has(cost.layer)) priority += 250
      if (cost.layer === 'visceral' && focus.includes('cardiovascular')) priority += 40
      if (cost.layer === 'cardiovascular' && focus.includes('visceral')) priority += 40
      if (cost.layer === 'skeletal' && focus.includes('muscular')) priority += 35
      if (cost.layer === 'muscular' && focus.includes('skeletal')) priority += 35
      const costUnits = cost.bytes / MiB + cost.triangles / 1_000_000
      const utility = priority / Math.max(costUnits, 0.001)
      return { cost, priority, utility }
    })
    .sort((a, b) => b.utility - a.utility
      || b.priority - a.priority
      || a.cost.bytes - b.cost.bytes
      || LAYER_ORDER.indexOf(a.cost.layer) - LAYER_ORDER.indexOf(b.cost.layer))

  for (const candidate of candidates) {
    if (resident.size >= profile.maxResidentLayers) break
    if (residentBytes + candidate.cost.bytes > profile.maxResidentBytes) continue
    if (residentTriangles + candidate.cost.triangles > profile.triangleBudget) continue
    resident.set(candidate.cost.layer, candidate.cost)
    residentBytes += candidate.cost.bytes
    residentTriangles += candidate.cost.triangles
  }

  const residentLayers = [...resident.values()].sort((a, b) => LAYER_ORDER.indexOf(a.layer) - LAYER_ORDER.indexOf(b.layer))
  const remaining = candidates.map((candidate) => candidate.cost).filter((cost) => !resident.has(cost.layer))
  const prefetch = remaining.filter((cost) => visibleSet.has(cost.layer) || warmSet.has(cost.layer))
  const deferred = remaining.filter((cost) => !prefetch.includes(cost))

  return {
    profile,
    resident: residentLayers,
    prefetch,
    deferred,
    residentBytes,
    residentTriangles,
    mandatoryBudgetExceeded,
    deterministicKey: planKey(profile, residentLayers),
  }
}

export function validateBodyAtlasAssetManifest(graph: BodyAtlasGraph = BODY_ATLAS_GRAPH) {
  const reasons: string[] = []
  const expectedLayers = new Set<BodyAtlasLayer>(LAYER_ORDER)
  const seenPaths = new Set<string>()

  for (const asset of BODY_ATLAS_ASSET_MANIFEST) {
    expectedLayers.delete(asset.layer)
    if (seenPaths.has(asset.path)) reasons.push(`Duplicate atlas asset path: ${asset.path}`)
    seenPaths.add(asset.path)
    if (asset.file !== BODY_ATLAS_LAYER_FILES[asset.layer]) reasons.push(`${asset.layer}: manifest file disagrees with atlas graph.`)
    if (!asset.path.endsWith(`/${asset.file}`)) reasons.push(`${asset.layer}: path/file mismatch.`)
    if (!Number.isInteger(asset.bytes) || asset.bytes <= 0) reasons.push(`${asset.layer}: invalid byte size.`)
    if (!/^[a-f0-9]{40}$/.test(asset.gitBlobSha)) reasons.push(`${asset.layer}: invalid Git blob SHA.`)
    if (graph.stats.nodesByLayer[asset.layer] <= 0) reasons.push(`${asset.layer}: no indexed source nodes.`)
  }

  if (expectedLayers.size) reasons.push(`Missing atlas asset layers: ${[...expectedLayers].join(', ')}.`)
  return { valid: reasons.length === 0, reasons: [...new Set(reasons)] }
}
