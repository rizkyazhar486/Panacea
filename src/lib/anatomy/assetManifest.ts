import {
  evaluateHdAnatomyAsset,
  type HdAnatomyAssetDescriptor,
  type HdAnatomyLod,
} from './hdAnatomyContract'
import type { AnatomySpatialGraph } from '../anatomySpatialGraph'
import type { AnatomySourceBindingReport } from './sourceBinding'

export type AnatomyAssetFormat = 'glb' | 'gltf'
export type AnatomyGeometryCompression = 'meshopt' | 'draco' | 'none'
export type AnatomyTextureEncoding = 'ktx2' | 'png-jpeg' | 'none'
export type AnatomyAssetPublicationTier = 'reference' | 'verified'

export interface AnatomyAssetManifestEntry extends HdAnatomyAssetDescriptor {
  graphNodeId: string
  file: string
  sourceNodeNames: readonly string[]
  immutableRevision: string
  format: AnatomyAssetFormat
  geometryCompression: AnatomyGeometryCompression
  textureEncoding: AnatomyTextureEncoding
  estimatedGpuBytes: number
  estimatedDrawCalls: number
}

export interface AnatomyAssetManifestValidation {
  valid: boolean
  errors: string[]
  referenceEligibleAssetIds: string[]
  verifiedEligibleAssetIds: string[]
}

const FLOATING_REVISION = /^(?:latest|main|master|head|current|dev|development|production)$/i
const REVISION_SHAPE = /^[a-z0-9][a-z0-9._:+/@-]{6,}$/i

export function isImmutableAnatomyRevision(value: string) {
  const revision = value.trim()
  return Boolean(revision) && !FLOATING_REVISION.test(revision) && REVISION_SHAPE.test(revision)
}

export function anatomyAssetCacheKey(entry: Pick<AnatomyAssetManifestEntry, 'assetId' | 'immutableRevision' | 'lod'>) {
  if (!entry.assetId.trim()) throw new Error('Anatomy asset id must not be blank.')
  if (!isImmutableAnatomyRevision(entry.immutableRevision)) throw new Error(`Anatomy asset ${entry.assetId} revision is not immutable.`)
  return `${entry.assetId}@${entry.immutableRevision}:lod-${entry.lod}`
}

function exactBindingExists(
  report: AnatomySourceBindingReport,
  entry: AnatomyAssetManifestEntry,
  sourceName: string,
) {
  return report.bindings.some((binding) =>
    binding.nodeId === entry.graphNodeId
    && binding.file === entry.file
    && binding.sourceName === sourceName,
  )
}

export function validateAnatomyAssetManifest(
  graph: AnatomySpatialGraph,
  bindings: AnatomySourceBindingReport,
  entries: readonly AnatomyAssetManifestEntry[],
): AnatomyAssetManifestValidation {
  const errors: string[] = []
  const graphNodeIds = new Set(graph.nodes.map((node) => node.id))
  const uniqueAssetIds = new Set<string>()
  const uniqueNodeLods = new Set<string>()
  const referenceEligibleAssetIds: string[] = []
  const verifiedEligibleAssetIds: string[] = []

  if (bindings.ambiguous.length) {
    for (const ambiguous of bindings.ambiguous) {
      errors.push(`Ambiguous source binding ${ambiguous.file}:${ambiguous.sourceName} -> ${ambiguous.claimantNodeIds.join(',')}.`)
    }
  }

  for (const entry of entries) {
    if (!entry.assetId.trim()) errors.push('Asset id must not be blank.')
    if (uniqueAssetIds.has(entry.assetId)) errors.push(`Duplicate anatomy asset id: ${entry.assetId}.`)
    uniqueAssetIds.add(entry.assetId)

    if (!graphNodeIds.has(entry.graphNodeId)) errors.push(`Asset ${entry.assetId} references missing graph node ${entry.graphNodeId}.`)
    if (entry.targetId !== entry.graphNodeId) errors.push(`Asset ${entry.assetId} targetId must equal graphNodeId.`)
    if (!entry.file.trim()) errors.push(`Asset ${entry.assetId} source file must not be blank.`)
    if (!isImmutableAnatomyRevision(entry.immutableRevision)) errors.push(`Asset ${entry.assetId} revision must be explicit and immutable.`)
    if (entry.estimatedGpuBytes < 0 || !Number.isFinite(entry.estimatedGpuBytes)) errors.push(`Asset ${entry.assetId} GPU estimate is invalid.`)
    if (entry.estimatedDrawCalls < 0 || !Number.isFinite(entry.estimatedDrawCalls)) errors.push(`Asset ${entry.assetId} draw-call estimate is invalid.`)
    if (!entry.sourceNodeNames.length || entry.sourceNodeNames.some((name) => !name.trim())) {
      errors.push(`Asset ${entry.assetId} must declare exact source-node names.`)
    }

    const nodeLodKey = `${entry.graphNodeId}\u0000${entry.lod}`
    if (uniqueNodeLods.has(nodeLodKey)) errors.push(`Graph node ${entry.graphNodeId} has more than one manifest asset at LOD ${entry.lod}.`)
    uniqueNodeLods.add(nodeLodKey)

    for (const sourceName of entry.sourceNodeNames) {
      if (!exactBindingExists(bindings, entry, sourceName)) {
        errors.push(`Asset ${entry.assetId} source node ${entry.file}:${sourceName} is not exactly bound to graph node ${entry.graphNodeId}.`)
      }
    }

    const hdGate = evaluateHdAnatomyAsset(entry)
    if (hdGate.usableForReferenceRendering) referenceEligibleAssetIds.push(entry.assetId)
    if (hdGate.usableForVerifiedRendering) verifiedEligibleAssetIds.push(entry.assetId)
  }

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)].sort(),
    referenceEligibleAssetIds: [...new Set(referenceEligibleAssetIds)].sort(),
    verifiedEligibleAssetIds: [...new Set(verifiedEligibleAssetIds)].sort(),
  }
}

export function manifestAssetsForNode(
  entries: readonly AnatomyAssetManifestEntry[],
  graphNodeId: string,
): AnatomyAssetManifestEntry[] {
  const lodOrder: Record<HdAnatomyLod, number> = { overview: 0, organ: 1, detail: 2 }
  return entries
    .filter((entry) => entry.graphNodeId === graphNodeId)
    .sort((a, b) => lodOrder[a.lod] - lodOrder[b.lod] || a.assetId.localeCompare(b.assetId))
}
