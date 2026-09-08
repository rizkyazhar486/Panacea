import type {
  AnatomyAssetDescriptor,
  AnatomyAssetLod,
  AtlasCameraState,
  AtlasDemandState,
  AtlasLoadDecision,
  AtlasLoadPlan,
} from './atlasTypes.ts'

export interface AtlasPriorityWeights {
  selected: number
  visible: number
  focusRegion: number
  projectedPixels: number
  memoryPenalty: number
}

export const DEFAULT_ATLAS_PRIORITY_WEIGHTS: AtlasPriorityWeights = {
  selected: 4,
  visible: 2.5,
  focusRegion: 1.5,
  projectedPixels: 1,
  memoryPenalty: 1,
}

export function projectedPixelDiameter(diameterWorldUnits: number, camera: AtlasCameraState) {
  if (!(diameterWorldUnits > 0)) return 0
  if (!(camera.distanceToTarget > 0) || !(camera.viewportHeightPx > 0)) return 0
  if (!(camera.verticalFovRadians > 0) || camera.verticalFovRadians >= Math.PI) return 0
  const denominator = 2 * camera.distanceToTarget * Math.tan(camera.verticalFovRadians / 2)
  return (diameterWorldUnits * camera.viewportHeightPx) / denominator
}

export function validateAssetDescriptor(asset: AnatomyAssetDescriptor) {
  const errors: string[] = []
  if (!asset.id.trim()) errors.push('Asset id is blank.')
  if (!asset.nodeId.trim()) errors.push(`Asset ${asset.id} has a blank node id.`)
  if (!(asset.diameterWorldUnits > 0)) errors.push(`Asset ${asset.id} must have a positive diameter.`)
  if (!asset.lods.length) errors.push(`Asset ${asset.id} has no LODs.`)

  const levels = new Set<number>()
  const resourceKeys = new Set<string>()
  let previousThreshold = -1
  for (const lod of [...asset.lods].sort((a, b) => a.level - b.level)) {
    if (levels.has(lod.level)) errors.push(`Asset ${asset.id} repeats LOD level ${lod.level}.`)
    levels.add(lod.level)
    if (!lod.resourceKey.trim()) errors.push(`Asset ${asset.id} LOD ${lod.level} has a blank resource key.`)
    if (resourceKeys.has(lod.resourceKey)) errors.push(`Asset ${asset.id} repeats resource key ${lod.resourceKey}.`)
    resourceKeys.add(lod.resourceKey)
    if (lod.minProjectedPixels < 0) errors.push(`Asset ${asset.id} LOD ${lod.level} has a negative pixel threshold.`)
    if (lod.minProjectedPixels < previousThreshold) errors.push(`Asset ${asset.id} LOD thresholds must increase with detail.`)
    previousThreshold = lod.minProjectedPixels
    if (!(lod.estimatedGpuBytes > 0)) errors.push(`Asset ${asset.id} LOD ${lod.level} must declare positive GPU bytes.`)
  }
  return errors
}

export function chooseAtlasLod(asset: AnatomyAssetDescriptor, projectedPixels: number): AnatomyAssetLod {
  const errors = validateAssetDescriptor(asset)
  if (errors.length) throw new Error(errors.join('\n'))

  const ordered = [...asset.lods].sort((a, b) => a.minProjectedPixels - b.minProjectedPixels || a.level - b.level)
  let chosen = ordered[0]
  for (const lod of ordered) {
    if (projectedPixels >= lod.minProjectedPixels) chosen = lod
    else break
  }
  return chosen
}

function demandPriority(
  asset: AnatomyAssetDescriptor,
  lod: AnatomyAssetLod,
  projectedPixels: number,
  demand: AtlasDemandState,
  weights: AtlasPriorityWeights,
) {
  const selected = demand.selectedNodeIds.has(asset.nodeId) ? 1 : 0
  const visible = demand.visibleNodeIds.has(asset.nodeId) ? 1 : 0
  const focusRegion = asset.regions.some((region) => demand.focusRegions.has(region)) ? 1 : 0
  const pixelSignal = Math.min(2, Math.max(0, projectedPixels / 400))
  const memoryFraction = demand.gpuBudgetBytes > 0 ? lod.estimatedGpuBytes / demand.gpuBudgetBytes : 1
  return selected * weights.selected
    + visible * weights.visible
    + focusRegion * weights.focusRegion
    + pixelSignal * weights.projectedPixels
    - memoryFraction * weights.memoryPenalty
}

/**
 * Pure deterministic atlas scheduler.
 *
 * Priority = selected + visible + regional focus + projected screen size -
 * normalized GPU cost. The planner never exceeds the declared GPU budget and
 * never silently swaps to a higher LOD than the camera-derived threshold.
 */
export function buildAtlasLoadPlan(
  assets: readonly AnatomyAssetDescriptor[],
  camera: AtlasCameraState,
  demand: AtlasDemandState,
  weights: AtlasPriorityWeights = DEFAULT_ATLAS_PRIORITY_WEIGHTS,
): AtlasLoadPlan {
  if (!(demand.gpuBudgetBytes > 0)) throw new Error('Atlas GPU budget must be positive.')

  const decisions: AtlasLoadDecision[] = []
  const knownResourceKeys = new Set<string>()

  for (const asset of assets) {
    for (const lod of asset.lods) knownResourceKeys.add(lod.resourceKey)
    const requested = demand.selectedNodeIds.has(asset.nodeId)
      || demand.visibleNodeIds.has(asset.nodeId)
      || asset.regions.some((region) => demand.focusRegions.has(region))
    if (!requested) continue

    const projectedPixels = projectedPixelDiameter(asset.diameterWorldUnits, camera)
    const lod = chooseAtlasLod(asset, projectedPixels)
    decisions.push({
      assetId: asset.id,
      nodeId: asset.nodeId,
      resourceKey: lod.resourceKey,
      lodLevel: lod.level,
      estimatedGpuBytes: lod.estimatedGpuBytes,
      projectedPixels,
      priority: demandPriority(asset, lod, projectedPixels, demand, weights),
      action: demand.residentResourceKeys.has(lod.resourceKey) ? 'retain' : 'load',
    })
  }

  decisions.sort((a, b) => b.priority - a.priority || a.resourceKey.localeCompare(b.resourceKey))

  const accepted: AtlasLoadDecision[] = []
  let usedBytes = 0
  for (const decision of decisions) {
    if (usedBytes + decision.estimatedGpuBytes > demand.gpuBudgetBytes) continue
    accepted.push(decision)
    usedBytes += decision.estimatedGpuBytes
  }

  const retainedKeys = new Set(accepted.map((decision) => decision.resourceKey))
  const evict = [...demand.residentResourceKeys]
    .filter((key) => knownResourceKeys.has(key) && !retainedKeys.has(key))
    .sort((a, b) => a.localeCompare(b))

  return {
    load: accepted.filter((decision) => decision.action === 'load'),
    retain: accepted.filter((decision) => decision.action === 'retain'),
    evict,
    estimatedResidentBytes: usedBytes,
    budgetBytes: demand.gpuBudgetBytes,
  }
}
