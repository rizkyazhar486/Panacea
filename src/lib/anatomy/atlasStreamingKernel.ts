import type {
  AtlasDeviceBudget,
  AtlasLodProfile,
  AtlasLodTier,
  AtlasManifest,
  AtlasNode,
  AtlasRenderRequest,
} from './atlasKernel'
import { atlasAncestors, atlasNeighborhood, atlasRenderScore, chooseAtlasLod } from './atlasKernel'

/**
 * Pure scheduling kernel for out-of-core anatomy rendering.
 *
 * It intentionally does not load GLB/texture assets itself. The viewer may bind
 * these deterministic plans to Three.js, WebGPU, a service worker, or another
 * renderer without moving medical/anatomy policy into the transport layer.
 */

export interface AtlasRuntimeTelemetry {
  nowMs: number
  /** Rolling median frame time. Avoid using a single frame spike. */
  medianFrameTimeMs: number
  targetFrameTimeMs?: number
  /** 0 = stationary; 1 = fast camera/selection motion. */
  interactionVelocity: number
  /** Optional estimate only; never trusted as exact GPU memory. */
  estimatedGpuMemoryMegabytes?: number
}

export interface AtlasStreamingBudget extends AtlasDeviceBudget {
  maxConcurrentLoads: number
  cacheTriangleBudget: number
  cacheTextureBudgetMegabytes: number
  minimumResidencyMs: number
}

export interface AtlasResidentAsset {
  key: string
  lodTier: AtlasLodTier
  triangles: number
  textureMegabytes: number
  lastTouchedAtMs: number
  loadedAtMs: number
}

export interface AtlasResidencySnapshot {
  assets: readonly AtlasResidentAsset[]
}

export interface AtlasAssetDemand {
  key: string
  nodeIds: readonly string[]
  lod: AtlasLodProfile
  score: number
  estimatedTriangles: number
  estimatedTextureMegabytes: number
  reason: 'selected' | 'visible' | 'context' | 'prefetch'
  pinned: boolean
}

export interface AtlasStreamingDecision extends AtlasAssetDemand {
  action: 'load' | 'upgrade' | 'keep' | 'prefetch'
}

export interface AtlasStreamingPlan {
  pressureRatio: number
  adaptiveBudget: AtlasStreamingBudget
  decisions: readonly AtlasStreamingDecision[]
  evict: readonly { key: string; reason: string }[]
  deferred: readonly { key: string; reason: string }[]
  totals: {
    activeTriangles: number
    activeTextureMegabytes: number
    activeAssets: number
  }
}

const LOD_ORDER: readonly AtlasLodTier[] = ['macro', 'standard', 'detail', 'micro']

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const stableUnique = <T>(values: readonly T[]) => [...new Set(values)]

function lodRank(tier: AtlasLodTier) {
  return LOD_ORDER.indexOf(tier)
}

function sameOrBetterLod(resident: AtlasLodTier, requested: AtlasLodTier) {
  return lodRank(resident) >= lodRank(requested)
}

/**
 * Adaptive render budget.
 *
 * pressure = medianFrameTime / targetFrameTime
 * quality multiplier is deliberately asymmetric: degradation happens faster
 * than recovery so a dense whole-body scene stabilizes instead of oscillating.
 */
export function deriveAdaptiveAtlasBudget(
  base: AtlasStreamingBudget,
  telemetry: AtlasRuntimeTelemetry,
): { pressureRatio: number; budget: AtlasStreamingBudget } {
  const target = Math.max(8, telemetry.targetFrameTimeMs ?? 16.67)
  const pressureRatio = Math.max(0.1, telemetry.medianFrameTimeMs / target)
  const velocity = clamp(telemetry.interactionVelocity, 0, 1)

  let qualityMultiplier = 1
  if (pressureRatio >= 1.6) qualityMultiplier = 0.42
  else if (pressureRatio >= 1.3) qualityMultiplier = 0.58
  else if (pressureRatio >= 1.1) qualityMultiplier = 0.76
  else if (pressureRatio <= 0.72 && velocity <= 0.2) qualityMultiplier = 1.12
  else if (pressureRatio <= 0.86 && velocity <= 0.45) qualityMultiplier = 1.05

  // Fast interaction biases toward lower detail even when the previous frame
  // was cheap; higher tiers can return after the camera settles.
  const motionMultiplier = 1 - velocity * 0.28
  const multiplier = clamp(qualityMultiplier * motionMultiplier, 0.34, 1.12)

  return {
    pressureRatio,
    budget: {
      ...base,
      triangleBudget: Math.max(12_000, Math.floor(base.triangleBudget * multiplier)),
      textureBudgetMegabytes: Math.max(8, Math.floor(base.textureBudgetMegabytes * multiplier)),
      nodeBudget: Math.max(4, Math.floor(base.nodeBudget * clamp(multiplier + 0.08, 0.45, 1.08))),
      maxConcurrentLoads: Math.max(1, Math.floor(base.maxConcurrentLoads * (pressureRatio > 1.1 ? 0.5 : 1))),
      cacheTriangleBudget: Math.max(base.triangleBudget, Math.floor(base.cacheTriangleBudget * clamp(multiplier + 0.2, 0.6, 1.1))),
      cacheTextureBudgetMegabytes: Math.max(base.textureBudgetMegabytes, Math.floor(base.cacheTextureBudgetMegabytes * clamp(multiplier + 0.2, 0.6, 1.1))),
    },
  }
}

function nodeAssetKeys(node: AtlasNode) {
  return node.source.files?.length
    ? node.source.files.map((file) => `bundle:${file}`)
    : [`node:${node.id}`]
}

function requestMatches(node: AtlasNode, request: AtlasRenderRequest) {
  if (!request.includeReferenceOnly && (node.geometryStatus === 'reference-only' || node.geometryStatus === 'planned')) return false
  if (request.systems?.length && !request.systems.includes(node.system)) return false
  if (request.regions?.length && !node.regions.some((region) => request.regions!.includes(region))) return false
  return true
}

function contextIds(manifest: AtlasManifest, selectedNodeId?: string) {
  if (!selectedNodeId) return new Set<string>()
  const ancestors = atlasAncestors(manifest, selectedNodeId).map((node) => node.id)
  const neighborhood = atlasNeighborhood(manifest, selectedNodeId).map((node) => node.id)
  return new Set([selectedNodeId, ...ancestors, ...neighborhood])
}

function predictedIds(manifest: AtlasManifest, selectedNodeId?: string) {
  if (!selectedNodeId) return new Set<string>()
  const first = atlasNeighborhood(manifest, selectedNodeId)
  const second = first.flatMap((node) => atlasNeighborhood(manifest, node.id))
  return new Set(stableUnique([...first, ...second].map((node) => node.id)).filter((id) => id !== selectedNodeId))
}

function mergeDemand(existing: AtlasAssetDemand | undefined, next: AtlasAssetDemand): AtlasAssetDemand {
  if (!existing) return next
  const higherLod = lodRank(next.lod.tier) > lodRank(existing.lod.tier) ? next.lod : existing.lod
  const reasonOrder: Record<AtlasAssetDemand['reason'], number> = { selected: 4, visible: 3, context: 2, prefetch: 1 }
  return {
    key: next.key,
    nodeIds: stableUnique([...existing.nodeIds, ...next.nodeIds]).sort(),
    lod: higherLod,
    score: Math.max(existing.score, next.score),
    estimatedTriangles: Math.max(existing.estimatedTriangles, next.estimatedTriangles),
    estimatedTextureMegabytes: Math.max(existing.estimatedTextureMegabytes, next.estimatedTextureMegabytes),
    reason: reasonOrder[next.reason] > reasonOrder[existing.reason] ? next.reason : existing.reason,
    pinned: existing.pinned || next.pinned,
  }
}

export function buildAtlasAssetDemand(
  manifest: AtlasManifest,
  request: AtlasRenderRequest,
  budget: AtlasStreamingBudget,
  allowPrefetch = true,
): AtlasAssetDemand[] {
  const selectedId = request.selectedNodeId
  const context = contextIds(manifest, selectedId)
  const predicted = allowPrefetch ? predictedIds(manifest, selectedId) : new Set<string>()
  const demands = new Map<string, AtlasAssetDemand>()

  for (const node of manifest.nodes) {
    const explicit = requestMatches(node, request)
    const contextual = context.has(node.id)
    const prefetch = predicted.has(node.id)
    if (!explicit && !contextual && !prefetch) continue
    if (!request.includeReferenceOnly && (node.geometryStatus === 'reference-only' || node.geometryStatus === 'planned')) continue

    const projected = request.projectedPixelsByNodeId?.[node.id] ?? (node.id === selectedId ? 520 : contextual ? 220 : 80)
    const lod = chooseAtlasLod(node, projected, budget)
    const reason: AtlasAssetDemand['reason'] = node.id === selectedId
      ? 'selected'
      : explicit
        ? 'visible'
        : contextual
          ? 'context'
          : 'prefetch'
    const scoreMultiplier = reason === 'selected' ? 8 : reason === 'visible' ? 3 : reason === 'context' ? 1.8 : 0.55
    const score = atlasRenderScore(node, request) * scoreMultiplier

    for (const key of nodeAssetKeys(node)) {
      const next: AtlasAssetDemand = {
        key,
        nodeIds: [node.id],
        lod,
        score,
        estimatedTriangles: lod.maxTriangles,
        estimatedTextureMegabytes: lod.maxTextureMegabytes,
        reason,
        pinned: reason === 'selected',
      }
      demands.set(key, mergeDemand(demands.get(key), next))
    }
  }

  return [...demands.values()].sort((a, b) =>
    Number(b.pinned) - Number(a.pinned)
    || b.score - a.score
    || a.key.localeCompare(b.key),
  )
}

function residentByKey(snapshot: AtlasResidencySnapshot) {
  return new Map(snapshot.assets.map((asset) => [asset.key, asset]))
}

/**
 * Produces a deterministic out-of-core working set.
 *
 * Cache hysteresis rule:
 *   evict only when an asset is outside the active set AND either memory is
 *   under pressure or minimum residency has elapsed. This avoids thrashing when
 *   users alternate between adjacent organs/systems.
 */
export function planAtlasStreaming(
  manifest: AtlasManifest,
  request: AtlasRenderRequest,
  baseBudget: AtlasStreamingBudget,
  telemetry: AtlasRuntimeTelemetry,
  residency: AtlasResidencySnapshot,
): AtlasStreamingPlan {
  const adaptive = deriveAdaptiveAtlasBudget(baseBudget, telemetry)
  const allowPrefetch = adaptive.pressureRatio <= 1.05 && telemetry.interactionVelocity <= 0.65
  const demand = buildAtlasAssetDemand(manifest, request, adaptive.budget, allowPrefetch)
  const resident = residentByKey(residency)
  const decisions: AtlasStreamingDecision[] = []
  const deferred: { key: string; reason: string }[] = []

  let triangles = 0
  let textures = 0
  let activeAssets = 0
  let newLoads = 0

  for (const asset of demand) {
    const current = resident.get(asset.key)
    const wouldExceed =
      activeAssets >= adaptive.budget.nodeBudget
      || triangles + asset.estimatedTriangles > adaptive.budget.triangleBudget
      || textures + asset.estimatedTextureMegabytes > adaptive.budget.textureBudgetMegabytes

    if (wouldExceed && !asset.pinned) {
      deferred.push({ key: asset.key, reason: 'Adaptive active working-set budget exhausted.' })
      continue
    }

    let action: AtlasStreamingDecision['action']
    if (current && sameOrBetterLod(current.lodTier, asset.lod.tier)) action = 'keep'
    else if (current) action = 'upgrade'
    else if (asset.reason === 'prefetch') action = 'prefetch'
    else action = 'load'

    if ((action === 'load' || action === 'upgrade' || action === 'prefetch') && newLoads >= adaptive.budget.maxConcurrentLoads && !asset.pinned) {
      deferred.push({ key: asset.key, reason: 'Concurrent load budget exhausted.' })
      continue
    }

    if (action === 'load' || action === 'upgrade' || action === 'prefetch') newLoads += 1
    decisions.push({ ...asset, action })
    triangles += asset.estimatedTriangles
    textures += asset.estimatedTextureMegabytes
    activeAssets += 1
  }

  const activeKeys = new Set(decisions.map((decision) => decision.key))
  const evict: { key: string; reason: string }[] = []
  const cacheTriangles = residency.assets.reduce((sum, asset) => sum + asset.triangles, 0)
  const cacheTextures = residency.assets.reduce((sum, asset) => sum + asset.textureMegabytes, 0)
  const cachePressure = cacheTriangles > adaptive.budget.cacheTriangleBudget || cacheTextures > adaptive.budget.cacheTextureBudgetMegabytes

  for (const asset of residency.assets) {
    if (activeKeys.has(asset.key)) continue
    const age = Math.max(0, telemetry.nowMs - Math.max(asset.lastTouchedAtMs, asset.loadedAtMs))
    if (cachePressure) evict.push({ key: asset.key, reason: 'Cache budget pressure.' })
    else if (age >= adaptive.budget.minimumResidencyMs) evict.push({ key: asset.key, reason: 'Outside working set after minimum residency window.' })
  }

  evict.sort((a, b) => {
    const aa = resident.get(a.key)
    const bb = resident.get(b.key)
    return (aa?.lastTouchedAtMs ?? 0) - (bb?.lastTouchedAtMs ?? 0) || a.key.localeCompare(b.key)
  })

  return {
    pressureRatio: adaptive.pressureRatio,
    adaptiveBudget: adaptive.budget,
    decisions,
    evict,
    deferred,
    totals: {
      activeTriangles: triangles,
      activeTextureMegabytes: textures,
      activeAssets,
    },
  }
}

export function validateAtlasStreamingPlan(plan: AtlasStreamingPlan): string[] {
  const issues: string[] = []
  const keys = new Set<string>()
  for (const decision of plan.decisions) {
    if (keys.has(decision.key)) issues.push(`Duplicate active asset decision: ${decision.key}`)
    keys.add(decision.key)
    if (decision.estimatedTriangles <= 0) issues.push(`Non-positive triangle estimate: ${decision.key}`)
    if (decision.estimatedTextureMegabytes <= 0) issues.push(`Non-positive texture estimate: ${decision.key}`)
  }
  if (plan.totals.activeAssets !== plan.decisions.length) issues.push('Active asset total does not match decision count.')
  if (plan.totals.activeTriangles > plan.adaptiveBudget.triangleBudget && !plan.decisions.some((decision) => decision.pinned)) {
    issues.push('Active triangle budget exceeded without a selected/pinned asset exception.')
  }
  if (plan.totals.activeTextureMegabytes > plan.adaptiveBudget.textureBudgetMegabytes && !plan.decisions.some((decision) => decision.pinned)) {
    issues.push('Active texture budget exceeded without a selected/pinned asset exception.')
  }
  return issues
}
