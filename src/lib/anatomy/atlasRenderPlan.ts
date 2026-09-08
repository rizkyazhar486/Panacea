import type { AnatomySystem, AtlasVec3 } from './atlasTypes.ts'
import type { AtlasSectionPlane } from './atlasCrossSection.ts'
import type { ExplodedLayout } from './atlasExplodedLayout.ts'
import { interpolateExplodedOffset } from './atlasExplodedLayout.ts'
import { PANACEA_ATLAS_NODES } from './atlasRegistry.ts'
import { atlasGeometryEntitlement, type AtlasGeometryEntitlement } from './atlasNavigation.ts'

export type AtlasRenderSafetyMode = 'educational-draft' | 'verified-only'

export interface AtlasRenderRequest {
  visibleSystems: ReadonlySet<AnatomySystem>
  selectedNodeIds: ReadonlySet<string>
  isolateSelection?: boolean
  safetyMode: AtlasRenderSafetyMode
  unselectedOpacity?: number
  explodedLayout?: ExplodedLayout
  explodedProgress?: number
  sectionPlane?: AtlasSectionPlane
}

export interface AtlasRenderNodeCommand {
  nodeId: string
  visible: boolean
  selected: boolean
  opacity: number
  offset: AtlasVec3
  entitlement: AtlasGeometryEntitlement
  sourceBindingFiles: readonly string[]
  reviewRequired: boolean
}

export interface AtlasRenderPlan {
  safetyMode: AtlasRenderSafetyMode
  nodeCommands: readonly AtlasRenderNodeCommand[]
  sectionPlane?: AtlasSectionPlane
  warnings: readonly string[]
}

const ZERO_OFFSET: AtlasVec3 = { x: 0, y: 0, z: 0 }

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

/**
 * Compile semantic atlas state into renderer-neutral commands.
 *
 * `verified-only` is deliberately fail-closed: structural drafts, candidate
 * source bindings and conceptual microanatomy are hidden. `educational-draft`
 * may expose them, but every command carries entitlement/reviewRequired so the
 * renderer can label draft/reference content instead of presenting it as
 * reviewed anatomy.
 */
export function compileAtlasRenderPlan(request: AtlasRenderRequest): AtlasRenderPlan {
  const unselectedOpacity = clamp01(request.unselectedOpacity ?? 0.34)
  const explodedProgress = clamp01(request.explodedProgress ?? 0)
  const explodedByNode = new Map(request.explodedLayout?.transforms.map((transform) => [transform.nodeId, transform] as const) ?? [])
  const warnings = new Set<string>()

  const nodeCommands = PANACEA_ATLAS_NODES.map((node): AtlasRenderNodeCommand => {
    const selected = request.selectedNodeIds.has(node.id)
    const systemVisible = request.visibleSystems.has(node.system)
    const entitlement = atlasGeometryEntitlement(node)
    const hasRenderableBinding = node.sourceBindings.length > 0
    const selectionVisibility = request.isolateSelection ? selected : systemVisible || selected
    const safetyVisibility = request.safetyMode === 'verified-only' ? entitlement === 'verified-anatomy' : true
    const visible = selectionVisibility && safetyVisibility && hasRenderableBinding

    if (selectionVisibility && request.safetyMode === 'verified-only' && entitlement !== 'verified-anatomy') {
      warnings.add('Verified-only mode suppressed one or more atlas nodes that lack complete anatomy review/renderer provenance.')
    }
    if (selectionVisibility && entitlement === 'conceptual-only') {
      warnings.add('Conceptual microanatomy is an educational overlay and must not be represented as verified gross-mesh localization.')
    }

    const exploded = explodedByNode.get(node.id)
    const offset = exploded ? interpolateExplodedOffset(exploded, explodedProgress) : ZERO_OFFSET
    return {
      nodeId: node.id,
      visible,
      selected,
      opacity: selected ? 1 : unselectedOpacity,
      offset,
      entitlement,
      sourceBindingFiles: [...new Set(node.sourceBindings.map((binding) => binding.file))].sort((a, b) => a.localeCompare(b)),
      reviewRequired: entitlement !== 'verified-anatomy',
    }
  }).sort((a, b) => a.nodeId.localeCompare(b.nodeId))

  return {
    safetyMode: request.safetyMode,
    nodeCommands,
    sectionPlane: request.sectionPlane,
    warnings: [...warnings].sort((a, b) => a.localeCompare(b)),
  }
}
