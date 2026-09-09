import type { AtlasManifest, AtlasNode } from './atlasKernel'
import { HIGHER_END_WHOLE_BODY_NODES } from './higherEndWholeBodyAtlas'
import { RESPIRATORY_ATLAS_NODES } from './respiratoryAtlas'
import { WHOLE_BODY_ATLAS_BASE_NODES } from './wholeBodyAtlas'

/**
 * Build hierarchy solely from parentId. Raw `children` arrays are deliberately
 * treated as non-canonical authoring hints because multi-module atlas sources
 * can otherwise create impossible dual parents (for example lung-lobe organ
 * containment versus airway continuity). Airway/vessel/nerve continuity must
 * be represented with explicit relation edges instead.
 */
export function deriveCanonicalAtlasHierarchy(nodes: readonly AtlasNode[]): readonly AtlasNode[] {
  const childrenByParent = new Map<string, string[]>()
  for (const node of nodes) {
    if (!node.parentId) continue
    const children = childrenByParent.get(node.parentId) ?? []
    children.push(node.id)
    childrenByParent.set(node.parentId, children)
  }

  return nodes.map((node) => ({
    ...node,
    children: [...new Set(childrenByParent.get(node.id) ?? [])].sort(),
  }))
}

/**
 * Canonical high-complexity atlas manifest used by advanced viewers.
 *
 * The base whole-body scaffold, respiratory deep-dive and fail-closed higher-end
 * reference identities are composed only here so each source stays independently
 * reviewable. Higher-end nodes are navigation metadata, never verified geometry.
 * Hierarchy children are rebuilt after composition, making cross-module parents
 * deterministic and preventing stale authoring hints from changing runtime topology.
 */
export const COMPLETE_WHOLE_BODY_ATLAS: AtlasManifest = {
  id: 'panacea-complete-whole-body-atlas',
  revision: '2026-09-09-r3-higher-end-foundation',
  nodes: deriveCanonicalAtlasHierarchy([
    ...WHOLE_BODY_ATLAS_BASE_NODES,
    ...RESPIRATORY_ATLAS_NODES,
    ...HIGHER_END_WHOLE_BODY_NODES,
  ]),
}
