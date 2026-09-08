import type { AnatomyRegion, AnatomySystem, AtlasManifest, AtlasNode } from './anatomyAtlasGraph'
import { getAncestorIds, indexAtlasNodes } from './anatomyAtlasGraph'

export interface AtlasStreamingRequest {
  maxBudgetUnits: number
  activeRegions?: readonly AnatomyRegion[]
  activeSystems?: readonly AnatomySystem[]
  focusNodeIds?: readonly string[]
}

export interface AtlasResidencyDiagnostic {
  nodeId: string
  priority: number
  reason: 'mandatory-focus' | 'mandatory-ancestor' | 'ranked-selection' | 'deferred-budget'
}

export interface AtlasStreamingPlan {
  residentNodeIds: string[]
  deferredNodeIds: string[]
  usedBudgetUnits: number
  maxBudgetUnits: number
  overBudget: boolean
  minimumRequiredBudget?: number
  diagnostics: AtlasResidencyDiagnostic[]
}

function factors(
  node: AtlasNode,
  activeRegions: Set<AnatomyRegion>,
  activeSystems: Set<AnatomySystem>,
  focus: Set<string>,
): { region: number; system: number; focus: number } {
  return {
    region: activeRegions.size === 0 || node.regions.some((region) => activeRegions.has(region)) ? 2 : 1,
    system: activeSystems.size === 0 || node.systems.some((system) => activeSystems.has(system)) ? 2 : 1,
    focus: focus.has(node.id) ? 8 : 1,
  }
}

export function anatomyResidencyPriority(
  node: AtlasNode,
  activeRegions: ReadonlySet<AnatomyRegion>,
  activeSystems: ReadonlySet<AnatomySystem>,
  focus: ReadonlySet<string>,
): number {
  const f = factors(node, new Set(activeRegions), new Set(activeSystems), new Set(focus))
  return (node.importanceWeight * f.region * f.system * f.focus) / Math.max(node.estimatedCostUnits, Number.EPSILON)
}

export function planAnatomyAtlasStreaming(manifest: AtlasManifest, request: AtlasStreamingRequest): AtlasStreamingPlan {
  if (!Number.isFinite(request.maxBudgetUnits) || request.maxBudgetUnits < 0) {
    throw new Error('maxBudgetUnits must be finite and >= 0.')
  }

  const index = indexAtlasNodes(manifest)
  const activeRegions = new Set(request.activeRegions ?? [])
  const activeSystems = new Set(request.activeSystems ?? [])
  const focus = new Set(request.focusNodeIds ?? [])

  for (const focusId of focus) {
    if (!index.has(focusId)) throw new Error(`Unknown focus atlas node: ${focusId}`)
  }

  const mandatory = new Set<string>()
  for (const focusId of [...focus].sort()) {
    mandatory.add(focusId)
    for (const ancestorId of getAncestorIds(manifest, focusId)) mandatory.add(ancestorId)
  }

  const costOf = (id: string) => index.get(id)?.estimatedCostUnits ?? 0
  const minimumRequiredBudget = [...mandatory].reduce((sum, id) => sum + costOf(id), 0)
  const mandatoryOverBudget = minimumRequiredBudget > request.maxBudgetUnits

  const ranked = manifest.nodes
    .filter((node) => !mandatory.has(node.id))
    .map((node) => ({ node, priority: anatomyResidencyPriority(node, activeRegions, activeSystems, focus) }))
    .sort((a, b) => b.priority - a.priority || a.node.id.localeCompare(b.node.id))

  const resident = new Set([...mandatory].sort())
  let usedBudgetUnits = minimumRequiredBudget
  const diagnostics: AtlasResidencyDiagnostic[] = []

  for (const id of [...mandatory].sort()) {
    diagnostics.push({
      nodeId: id,
      priority: anatomyResidencyPriority(index.get(id)!, activeRegions, activeSystems, focus),
      reason: focus.has(id) ? 'mandatory-focus' : 'mandatory-ancestor',
    })
  }

  if (!mandatoryOverBudget) {
    for (const item of ranked) {
      const nextCost = usedBudgetUnits + item.node.estimatedCostUnits
      if (nextCost <= request.maxBudgetUnits) {
        resident.add(item.node.id)
        usedBudgetUnits = nextCost
        diagnostics.push({ nodeId: item.node.id, priority: item.priority, reason: 'ranked-selection' })
      } else {
        diagnostics.push({ nodeId: item.node.id, priority: item.priority, reason: 'deferred-budget' })
      }
    }
  } else {
    for (const item of ranked) diagnostics.push({ nodeId: item.node.id, priority: item.priority, reason: 'deferred-budget' })
  }

  const residentNodeIds = [...resident].sort()
  const deferredNodeIds = manifest.nodes.map((node) => node.id).filter((id) => !resident.has(id)).sort()
  diagnostics.sort((a, b) => a.nodeId.localeCompare(b.nodeId))

  return {
    residentNodeIds,
    deferredNodeIds,
    usedBudgetUnits,
    maxBudgetUnits: request.maxBudgetUnits,
    overBudget: mandatoryOverBudget,
    minimumRequiredBudget: mandatoryOverBudget ? minimumRequiredBudget : undefined,
    diagnostics,
  }
}
