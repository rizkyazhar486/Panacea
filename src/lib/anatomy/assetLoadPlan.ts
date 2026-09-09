import { evaluateHdAnatomyAsset, type HdAnatomyLod } from './hdAnatomyContract'
import type { AnatomyStreamingPlan, AnatomyStreamingPlanEntry } from '../anatomyStreamingPlanner'
import {
  anatomyAssetCacheKey,
  type AnatomyAssetManifestEntry,
  type AnatomyAssetPublicationTier,
} from './assetManifest'

export interface AnatomyAssetLoadPlanEntry {
  nodeId: string
  assetId?: string
  cacheKey?: string
  lod?: HdAnatomyLod
  action: 'load' | 'preload' | 'keep' | 'replace' | 'unload' | 'blocked'
  estimatedGpuBytes: number
  estimatedDrawCalls: number
  reason: string
}

export interface AnatomyAssetLoadPlan {
  entries: AnatomyAssetLoadPlanEntry[]
  totalGpuBytes: number
  totalDrawCalls: number
  blockedNodeIds: string[]
}

export function numericLodToHdLod(level: number): HdAnatomyLod {
  if (level <= 1) return 'overview'
  if (level <= 3) return 'organ'
  return 'detail'
}

const LOD_RANK: Record<HdAnatomyLod, number> = { overview: 0, organ: 1, detail: 2 }

function eligibleForTier(entry: AnatomyAssetManifestEntry, tier: AnatomyAssetPublicationTier) {
  const gate = evaluateHdAnatomyAsset(entry)
  return tier === 'verified' ? gate.usableForVerifiedRendering : gate.usableForReferenceRendering
}

function selectAsset(
  manifest: readonly AnatomyAssetManifestEntry[],
  nodeId: string,
  requestedLod: HdAnatomyLod,
  tier: AnatomyAssetPublicationTier,
) {
  const requestedRank = LOD_RANK[requestedLod]
  const candidates = manifest
    .filter((entry) => entry.graphNodeId === nodeId && eligibleForTier(entry, tier))
    .sort((a, b) => {
      const aDistance = Math.abs(LOD_RANK[a.lod] - requestedRank)
      const bDistance = Math.abs(LOD_RANK[b.lod] - requestedRank)
      if (aDistance !== bDistance) return aDistance - bDistance
      // Prefer a lower LOD over an unexpectedly more expensive higher LOD when
      // both are equally distant from the requested tier.
      if (LOD_RANK[a.lod] !== LOD_RANK[b.lod]) return LOD_RANK[a.lod] - LOD_RANK[b.lod]
      return a.assetId.localeCompare(b.assetId)
    })
  return candidates[0]
}

function renderAction(streaming: AnatomyStreamingPlanEntry, asset: AnatomyAssetManifestEntry): AnatomyAssetLoadPlanEntry['action'] {
  if (streaming.action === 'preload') return 'preload'
  if (streaming.action === 'keep') return 'keep'
  if (streaming.action === 'upgrade' || streaming.action === 'downgrade') return 'replace'
  return 'load'
}

/**
 * Convert geometry-level streaming intent into immutable asset requests.
 * Assets that fail the requested HD publication tier are never silently used.
 */
export function planAnatomyAssetLoads(
  streamingPlan: AnatomyStreamingPlan,
  manifest: readonly AnatomyAssetManifestEntry[],
  tier: AnatomyAssetPublicationTier,
): AnatomyAssetLoadPlan {
  const entries: AnatomyAssetLoadPlanEntry[] = []
  const blockedNodeIds: string[] = []
  let totalGpuBytes = 0
  let totalDrawCalls = 0

  for (const streaming of [...streamingPlan.entries].sort((a, b) => a.nodeId.localeCompare(b.nodeId))) {
    if (streaming.action === 'unload') {
      entries.push({
        nodeId: streaming.nodeId,
        action: 'unload',
        estimatedGpuBytes: 0,
        estimatedDrawCalls: 0,
        reason: 'Streaming planner released this anatomy node.',
      })
      continue
    }

    const requestedLod = numericLodToHdLod(streaming.targetLevel ?? 0)
    const asset = selectAsset(manifest, streaming.nodeId, requestedLod, tier)
    if (!asset) {
      blockedNodeIds.push(streaming.nodeId)
      entries.push({
        nodeId: streaming.nodeId,
        action: 'blocked',
        estimatedGpuBytes: 0,
        estimatedDrawCalls: 0,
        reason: `No ${tier}-eligible immutable asset is available for requested ${requestedLod} LOD.`,
      })
      continue
    }

    const action = renderAction(streaming, asset)
    totalGpuBytes += asset.estimatedGpuBytes
    totalDrawCalls += asset.estimatedDrawCalls
    entries.push({
      nodeId: streaming.nodeId,
      assetId: asset.assetId,
      cacheKey: anatomyAssetCacheKey(asset),
      lod: asset.lod,
      action,
      estimatedGpuBytes: asset.estimatedGpuBytes,
      estimatedDrawCalls: asset.estimatedDrawCalls,
      reason: `Selected closest ${tier}-eligible immutable HD asset for ${requestedLod} request.`,
    })
  }

  return {
    entries,
    totalGpuBytes,
    totalDrawCalls,
    blockedNodeIds: [...new Set(blockedNodeIds)].sort(),
  }
}
