import {
  anatomySourceNodeOrigin,
  filterAnatomySourceBundlesForAtlasRegion,
  getEffectiveAnatomySourceNodeSnapshot,
  resolveAllAnatomySourceNodes,
  resolveAnatomySourceNodes,
  type AnatomySourceNodeBundle,
  type AnatomySourceNodeMatch,
} from '../anatomySourceNodeRegistry'
import type { HighEndAtlasStructure } from './highEndAtlasOntology'

export type AtlasSourceResolutionMode = 'specific-fallback' | 'composite'
export type AtlasGeometryState = 'runtime-direct' | 'indexed-direct' | 'reference-only' | 'unresolved'

export interface HighEndAtlasGeometryResolution {
  structureId: string
  state: AtlasGeometryState
  matches: readonly AnatomySourceNodeMatch[]
  renderableReference: boolean
  clinicalProjectionAllowed: boolean
  reasons: readonly string[]
}

function scopedBundles(node: HighEndAtlasStructure, bundles: readonly AnatomySourceNodeBundle[]) {
  if (node.region === 'whole-body') return bundles
  return filterAnatomySourceBundlesForAtlasRegion(bundles, node.region)
}

/**
 * Connect the canonical high-end ontology to Panacea's exact GLB source-node
 * catalogue. The function deliberately distinguishes a visible educational
 * reference from a clinically reviewed projection:
 *
 * - exact runtime/indexed source-node matches can support reference rendering;
 * - adjacent geometry never becomes a direct substitute;
 * - `not-represented` remains unresolved even when a broad nearby mesh exists;
 * - clinical projection is blocked until reviewStatus is explicitly recorded.
 */
export function resolveHighEndAtlasGeometry(
  node: HighEndAtlasStructure,
  mode: AtlasSourceResolutionMode = 'specific-fallback',
  sourceBundles: readonly AnatomySourceNodeBundle[] = getEffectiveAnatomySourceNodeSnapshot(),
): HighEndAtlasGeometryResolution {
  const reasons: string[] = []
  if (!node.sourceNodeHints.length) {
    return {
      structureId: node.id,
      state: node.geometryProvenance === 'adjacent-geometry' ? 'reference-only' : 'unresolved',
      matches: [],
      renderableReference: node.geometryProvenance === 'adjacent-geometry',
      clinicalProjectionAllowed: false,
      reasons: ['No exact source-node hints are registered for this atlas structure.'],
    }
  }

  const candidates = scopedBundles(node, sourceBundles)
  const matches = mode === 'composite'
    ? resolveAllAnatomySourceNodes(node.sourceNodeHints, candidates, 16)
    : resolveAnatomySourceNodes(node.sourceNodeHints, candidates, 16)

  if (node.geometryProvenance === 'not-represented') {
    reasons.push('Canonical structure is explicitly marked not-represented; nearby or name-similar geometry cannot be promoted automatically.')
    return {
      structureId: node.id,
      state: 'unresolved',
      matches: [],
      renderableReference: false,
      clinicalProjectionAllowed: false,
      reasons,
    }
  }

  if (node.geometryProvenance === 'adjacent-geometry') {
    reasons.push('Only adjacent/reference geometry is approved; it must not masquerade as direct structure geometry.')
    if (node.reviewStatus !== 'recorded') reasons.push('Academic review is pending; clinical projection remains blocked.')
    return {
      structureId: node.id,
      state: 'reference-only',
      matches,
      renderableReference: true,
      clinicalProjectionAllowed: false,
      reasons,
    }
  }

  if (!matches.length) {
    reasons.push('No exact source node resolved from the reviewed structure hints in the scoped body region.')
    return {
      structureId: node.id,
      state: 'unresolved',
      matches: [],
      renderableReference: false,
      clinicalProjectionAllowed: false,
      reasons,
    }
  }

  const runtime = matches.some((match) => anatomySourceNodeOrigin(match.file) === 'runtime')
  if (node.reviewStatus !== 'recorded') reasons.push('Direct source geometry exists, but academic review is pending; clinical projection remains blocked.')

  return {
    structureId: node.id,
    state: runtime ? 'runtime-direct' : 'indexed-direct',
    matches,
    renderableReference: true,
    clinicalProjectionAllowed: node.reviewStatus === 'recorded',
    reasons,
  }
}
