import type { AtlasManifest, AtlasNode } from './atlasKernel'
import { ADVANCED_RESPIRATORY_ATLAS_NODES } from './advancedRespiratoryAtlas'
import { CARDIOPULMONARY_BRIDGE_NODES, CARDIOPULMONARY_RELATION_PATCHES } from './cardiopulmonaryBridge'
import { DEEP_CARDIOVASCULAR_ATLAS_NODES } from './deepCardiovascularAtlas'
import { DEEP_NEUROVASCULAR_ATLAS_NODES } from './deepNeurovascularAtlas'
import { applyAtlasRelationPatches, HIGH_END_ATLAS_RELATION_PATCHES } from './highEndTopology'
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
 * Canonical high-end whole-body atlas manifest.
 *
 * Composition is intentionally explicit. Cross-module topology is patched only
 * after every module is present, and `applyAtlasRelationPatches` throws on any
 * missing relation endpoint. That fail-closed rule prevents a typo or stale id
 * from silently producing a plausible-looking but anatomically disconnected
 * atlas.
 *
 * `partial` means source-node candidate geometry still requires runtime/source
 * verification. `reference-only` remains non-renderable gross geometry until a
 * separately reviewed and licensed source exists.
 */
const COMPOSED_HIGH_END_NODES = applyAtlasRelationPatches(
  [
    ...WHOLE_BODY_ATLAS_BASE_NODES,
    ...RESPIRATORY_ATLAS_NODES,
    ...ADVANCED_RESPIRATORY_ATLAS_NODES,
    ...DEEP_CARDIOVASCULAR_ATLAS_NODES,
    ...DEEP_NEUROVASCULAR_ATLAS_NODES,
    ...CARDIOPULMONARY_BRIDGE_NODES,
  ],
  [...HIGH_END_ATLAS_RELATION_PATCHES, ...CARDIOPULMONARY_RELATION_PATCHES],
)

export const COMPLETE_WHOLE_BODY_ATLAS: AtlasManifest = {
  id: 'panacea-complete-whole-body-atlas',
  revision: '2026-09-09-r3-high-end',
  nodes: deriveCanonicalAtlasHierarchy(COMPOSED_HIGH_END_NODES),
}
