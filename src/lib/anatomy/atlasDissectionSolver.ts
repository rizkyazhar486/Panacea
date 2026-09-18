import type {
  AtlasManifest,
  AtlasNode,
  AtlasRegionId,
  AtlasSystemId,
} from './atlasKernel'
import { atlasAncestors, atlasNeighborhood, atlasNodeById } from './atlasKernel'
import { atlasSubgraph } from './atlasGraph'

/**
 * Semantic dissection/visibility solver.
 *
 * This module solves educational scene visibility; it does NOT infer true
 * physical depth from anatomy names. Actual geometric occlusion remains the
 * responsibility of the renderer/depth buffer or verified spatial metadata.
 */

export type AtlasDissectionMode =
  | 'isolate-node'
  | 'isolate-system'
  | 'regional-peel'
  | 'transparent-context'
  | 'relationship-exposure'

export type AtlasVisibilityAction = 'show' | 'ghost' | 'hide' | 'metadata-only'

export interface AtlasDissectionIntent {
  mode: AtlasDissectionMode
  selectedNodeId?: string
  systems?: readonly AtlasSystemId[]
  regions?: readonly AtlasRegionId[]
  /** 0 shows the superficial semantic systems; 1 exposes all semantic layers. */
  semanticPeel01?: number
  contextOpacity?: number
  graphDepth?: number
  protectedNodeIds?: readonly string[]
}

export interface AtlasVisibilityDecision {
  nodeId: string
  label: string
  system: AtlasSystemId
  action: AtlasVisibilityAction
  opacity: number
  pickable: boolean
  renderableGeometry: boolean
  protected: boolean
  reasons: readonly string[]
}

export interface AtlasDissectionPlan {
  mode: AtlasDissectionMode
  selectedNodeId?: string
  decisions: readonly AtlasVisibilityDecision[]
  visibleNodeIds: readonly string[]
  ghostNodeIds: readonly string[]
  hiddenNodeIds: readonly string[]
  metadataOnlyNodeIds: readonly string[]
  protectedNodeIds: readonly string[]
  semanticLayerCutoff: number
  warnings: readonly string[]
}

/**
 * Educational ordering only. It is a scene-control convention, not a claim that
 * every member of one system lies physically superficial/deep to another.
 */
export const ATLAS_SEMANTIC_DISSECTION_ORDER: readonly AtlasSystemId[] = [
  'surface',
  'fascial',
  'muscular',
  'articular',
  'skeletal',
  'lymphatic',
  'cardiovascular',
  'nervous',
  'respiratory',
  'digestive',
  'urinary',
  'endocrine',
  'reproductive',
  'sensory',
] as const

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

function renderable(node: AtlasNode) {
  return node.geometryStatus === 'shipped' || node.geometryStatus === 'partial'
}

function inScope(node: AtlasNode, intent: AtlasDissectionIntent) {
  if (intent.regions?.length && !node.regions.some((region) => intent.regions!.includes(region))) return false
  if (intent.systems?.length && !intent.systems.includes(node.system)) return false
  return true
}

function systemRank(system: AtlasSystemId) {
  const rank = ATLAS_SEMANTIC_DISSECTION_ORDER.indexOf(system)
  return rank < 0 ? ATLAS_SEMANTIC_DISSECTION_ORDER.length : rank
}

function semanticCutoff(peel01: number) {
  const max = ATLAS_SEMANTIC_DISSECTION_ORDER.length - 1
  return Math.round(clamp(peel01, 0, 1) * max)
}

function protectedSet(manifest: AtlasManifest, intent: AtlasDissectionIntent) {
  const set = new Set<string>()
  for (const id of intent.protectedNodeIds ?? []) {
    if (atlasNodeById(manifest, id)) set.add(id)
  }
  if (intent.selectedNodeId && atlasNodeById(manifest, intent.selectedNodeId)) set.add(intent.selectedNodeId)
  return set
}

function contextSet(manifest: AtlasManifest, selectedNodeId: string | undefined, depth: number) {
  if (!selectedNodeId) return new Set<string>()
  const ids = new Set<string>([selectedNodeId])
  for (const node of atlasAncestors(manifest, selectedNodeId)) ids.add(node.id)
  for (const node of atlasNeighborhood(manifest, selectedNodeId)) ids.add(node.id)
  for (const id of atlasSubgraph(manifest, selectedNodeId, clamp(Math.floor(depth), 0, 3)).nodeIds) ids.add(id)
  return ids
}

function decideAction(
  node: AtlasNode,
  intent: AtlasDissectionIntent,
  selected: AtlasNode | undefined,
  context: Set<string>,
  protectedNodes: Set<string>,
  cutoff: number,
): { action: AtlasVisibilityAction; reason: string } {
  if (!renderable(node)) return { action: 'metadata-only', reason: 'Node has no shipped/partial source geometry and cannot be rendered.' }
  if (protectedNodes.has(node.id)) return { action: 'show', reason: 'Explicitly protected/selected anatomy remains visible.' }

  switch (intent.mode) {
    case 'isolate-node':
      if (!selected) return { action: 'hide', reason: 'No selected node exists for node isolation.' }
      if (context.has(node.id)) return { action: 'ghost', reason: 'Canonical hierarchy/relation context for isolated anatomy.' }
      return { action: 'hide', reason: 'Outside isolated anatomy context.' }

    case 'isolate-system': {
      const systems = intent.systems?.length ? intent.systems : selected ? [selected.system] : []
      return systems.includes(node.system)
        ? { action: 'show', reason: 'Node belongs to isolated system.' }
        : { action: 'hide', reason: 'Node belongs to a non-isolated system.' }
    }

    case 'transparent-context':
      if (selected && node.id === selected.id) return { action: 'show', reason: 'Selected anatomy target.' }
      if (context.has(node.id)) return { action: 'ghost', reason: 'Transparent explicit graph/hierarchy context.' }
      return { action: 'hide', reason: 'Outside bounded transparent context.' }

    case 'relationship-exposure':
      if (context.has(node.id)) return { action: node.id === selected?.id ? 'show' : 'ghost', reason: 'Explicit bounded anatomy graph relationship context.' }
      return { action: 'hide', reason: 'Outside explicit relationship subgraph.' }

    case 'regional-peel':
      if (!inScope(node, { ...intent, systems: undefined })) return { action: 'hide', reason: 'Outside requested regional dissection scope.' }
      if (systemRank(node.system) <= cutoff) return { action: 'ghost', reason: 'Semantic layer is at/before peel cutoff and is ghosted rather than treated as true geometric depth.' }
      return { action: 'show', reason: 'Semantic layer is beyond current peel cutoff.' }
  }
}

export function solveAtlasDissection(
  manifest: AtlasManifest,
  intent: AtlasDissectionIntent,
): AtlasDissectionPlan {
  const selected = intent.selectedNodeId ? atlasNodeById(manifest, intent.selectedNodeId) : undefined
  const cutoff = semanticCutoff(intent.semanticPeel01 ?? 0)
  const ghostOpacity = clamp(intent.contextOpacity ?? 0.18, 0.04, 0.75)
  const protectedNodes = protectedSet(manifest, intent)
  const context = contextSet(manifest, intent.selectedNodeId, intent.graphDepth ?? 1)
  const decisions: AtlasVisibilityDecision[] = []

  for (const node of manifest.nodes) {
    if (intent.mode !== 'regional-peel' && intent.mode !== 'isolate-system' && !inScope(node, intent)) continue
    const result = decideAction(node, intent, selected, context, protectedNodes, cutoff)
    decisions.push({
      nodeId: node.id,
      label: node.label,
      system: node.system,
      action: result.action,
      opacity: result.action === 'show' ? 1 : result.action === 'ghost' ? ghostOpacity : 0,
      pickable: result.action === 'show' || result.action === 'ghost',
      renderableGeometry: renderable(node),
      protected: protectedNodes.has(node.id),
      reasons: [result.reason],
    })
  }

  const warnings: string[] = [
    'Semantic peel order is an educational visibility convention, not a substitute for verified mesh depth/occlusion.',
    'Reference-only/planned anatomy remains metadata-only and is never promoted by the dissection solver.',
  ]
  if (intent.selectedNodeId && !selected) warnings.push(`Selected dissection node is absent from manifest: ${intent.selectedNodeId}`)
  if (intent.mode === 'regional-peel' && !intent.regions?.length) warnings.push('Regional peel was requested without a region; the plan may span the entire body.')

  decisions.sort((a, b) => {
    const actionRank: Record<AtlasVisibilityAction, number> = { show: 0, ghost: 1, 'metadata-only': 2, hide: 3 }
    return actionRank[a.action] - actionRank[b.action] || systemRank(a.system) - systemRank(b.system) || a.nodeId.localeCompare(b.nodeId)
  })

  const ids = (action: AtlasVisibilityAction) => decisions.filter((decision) => decision.action === action).map((decision) => decision.nodeId)
  return {
    mode: intent.mode,
    selectedNodeId: selected?.id,
    decisions,
    visibleNodeIds: ids('show'),
    ghostNodeIds: ids('ghost'),
    hiddenNodeIds: ids('hide'),
    metadataOnlyNodeIds: ids('metadata-only'),
    protectedNodeIds: [...protectedNodes].sort(),
    semanticLayerCutoff: cutoff,
    warnings,
  }
}

export function validateAtlasDissectionPlan(plan: AtlasDissectionPlan): string[] {
  const issues: string[] = []
  const seen = new Set<string>()
  for (const decision of plan.decisions) {
    if (seen.has(decision.nodeId)) issues.push(`Duplicate dissection decision: ${decision.nodeId}`)
    seen.add(decision.nodeId)
    if (decision.action === 'metadata-only' && decision.renderableGeometry) issues.push(`Renderable node incorrectly downgraded to metadata-only: ${decision.nodeId}`)
    if (decision.action !== 'metadata-only' && !decision.renderableGeometry && decision.action !== 'hide') issues.push(`Unrenderable node leaked into visible dissection state: ${decision.nodeId}`)
    if (decision.action === 'show' && decision.opacity !== 1) issues.push(`Visible dissection node must be opaque: ${decision.nodeId}`)
    if (decision.action === 'ghost' && !(decision.opacity > 0 && decision.opacity < 1)) issues.push(`Ghost dissection opacity is invalid: ${decision.nodeId}`)
    if ((decision.action === 'hide' || decision.action === 'metadata-only') && decision.opacity !== 0) issues.push(`Hidden/metadata dissection node must have zero render opacity: ${decision.nodeId}`)
    if (decision.protected && decision.renderableGeometry && decision.action !== 'show') issues.push(`Protected renderable node was not kept visible: ${decision.nodeId}`)
  }
  return [...new Set(issues)]
}
