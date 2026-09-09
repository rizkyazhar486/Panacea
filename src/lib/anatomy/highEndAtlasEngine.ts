import type { AnatomySpatialGraph } from '../anatomySpatialGraph'
import {
  planAnatomyStreaming,
  type AnatomyStreamingBudget,
  type AnatomyStreamingCandidate,
  type AnatomyStreamingPlan,
} from '../anatomyStreamingPlanner'
import type { AnatomySourceNodeBundle } from '../anatomySourceNodeRegistry'
import { bindAnatomyNodesToSourceSnapshot, type AnatomySourceBindingReport } from './sourceBinding'
import {
  validateAnatomyAssetManifest,
  type AnatomyAssetManifestEntry,
  type AnatomyAssetManifestValidation,
  type AnatomyAssetPublicationTier,
} from './assetManifest'
import { planAnatomyAssetLoads, type AnatomyAssetLoadPlan } from './assetLoadPlan'

export interface HighEndAtlasRenderRequest {
  graph: AnatomySpatialGraph
  sourceBundles: readonly AnatomySourceNodeBundle[]
  manifest: readonly AnatomyAssetManifestEntry[]
  candidates: readonly AnatomyStreamingCandidate[]
  budget: AnatomyStreamingBudget
  publicationTier: AnatomyAssetPublicationTier
}

export interface HighEndAtlasRenderTransaction {
  ready: boolean
  blockers: string[]
  bindings: AnatomySourceBindingReport
  manifestValidation: AnatomyAssetManifestValidation
  streamingPlan: AnatomyStreamingPlan
  assetLoadPlan: AnatomyAssetLoadPlan
  criticalBlockedNodeIds: string[]
}

function graphErrors(graph: AnatomySpatialGraph) {
  const errors: string[] = []
  const ids = new Set<string>()
  for (const node of graph.nodes) {
    if (!node.id.trim()) errors.push('graph:blank-node-id')
    if (ids.has(node.id)) errors.push(`graph:duplicate-node:${node.id}`)
    ids.add(node.id)
    if (node.parentId && node.parentId === node.id) errors.push(`graph:self-parent:${node.id}`)
  }
  for (const node of graph.nodes) {
    if (node.parentId && !ids.has(node.parentId)) errors.push(`graph:missing-parent:${node.id}:${node.parentId}`)
  }
  for (const edge of graph.edges) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) errors.push(`graph:broken-edge:${edge.from}:${edge.to}`)
  }
  return [...new Set(errors)].sort()
}

/**
 * Produce an atomic, deterministic render transaction for the high-end atlas.
 * A critical selected/interacting structure is never silently substituted with
 * an unlicensed, ambiguous, floating-revision, or ineligible asset.
 */
export function buildHighEndAtlasRenderTransaction(
  request: HighEndAtlasRenderRequest,
): HighEndAtlasRenderTransaction {
  const blockers = graphErrors(request.graph)
  const graphNodeIds = new Set(request.graph.nodes.map((node) => node.id))

  for (const candidate of request.candidates) {
    if (!graphNodeIds.has(candidate.nodeId)) blockers.push(`candidate:unknown-graph-node:${candidate.nodeId}`)
  }

  const bindings = bindAnatomyNodesToSourceSnapshot(request.graph.nodes, request.sourceBundles)
  if (bindings.ambiguous.length) blockers.push('source-binding:ambiguous')

  const manifestValidation = validateAnatomyAssetManifest(request.graph, bindings, request.manifest)
  if (!manifestValidation.valid) blockers.push('asset-manifest:invalid')

  const streamingPlan = planAnatomyStreaming(request.candidates, request.budget)
  if (streamingPlan.overBudget) blockers.push('streaming:over-budget')

  const assetLoadPlan = planAnatomyAssetLoads(streamingPlan, request.manifest, request.publicationTier)
  const criticalNodeIds = new Set(
    request.candidates
      .filter((candidate) => candidate.selected || candidate.interacting)
      .map((candidate) => candidate.nodeId),
  )
  const criticalBlockedNodeIds = assetLoadPlan.blockedNodeIds
    .filter((nodeId) => criticalNodeIds.has(nodeId))
    .sort()
  if (criticalBlockedNodeIds.length) blockers.push('asset-load:critical-node-blocked')

  const normalizedBlockers = [...new Set(blockers)].sort()
  return {
    ready: normalizedBlockers.length === 0,
    blockers: normalizedBlockers,
    bindings,
    manifestValidation,
    streamingPlan,
    assetLoadPlan,
    criticalBlockedNodeIds,
  }
}
