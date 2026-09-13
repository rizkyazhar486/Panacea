import type { AtlasManifest, AtlasNode } from './atlasKernel'
import { ADVANCED_RESPIRATORY_ATLAS_NODES } from './advancedRespiratoryAtlas'
import { CARDIOPULMONARY_BRIDGE_NODES, CARDIOPULMONARY_RELATION_PATCHES } from './cardiopulmonaryBridge'
import { DEEP_CARDIOVASCULAR_ATLAS_NODES } from './deepCardiovascularAtlas'
import { DEEP_NEUROVASCULAR_ATLAS_NODES } from './deepNeurovascularAtlas'
import { applyAtlasRelationPatches, HIGH_END_ATLAS_RELATION_PATCHES } from './highEndTopology'
import { HIGHER_END_WHOLE_BODY_NODES } from './higherEndWholeBodyAtlas'
import { RESPIRATORY_ATLAS_NODES } from './respiratoryAtlas'
import { WHOLE_BODY_ATLAS_BASE_NODES } from './wholeBodyAtlas'

/**
 * Build hierarchy solely from parentId. Raw `children` arrays are deliberately
 * treated as non-canonical authoring hints because multi-module atlas sources
 * can otherwise create impossible dual parents. Airway/vessel/nerve continuity
 * belongs in explicit relation edges instead.
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
 * Canonical structural whole-body atlas foundation.
 *
 * This composition intentionally restores the large-system topology before any
 * further organ-, histology-, cellular- or molecular-scale expansion. Existing
 * higher-end reference identities remain included, while deep respiratory,
 * cardiovascular, neurovascular and cardiopulmonary structural modules are
 * composed behind fail-closed relation patches.
 *
 * Safety boundary: engineering composition is not academic review. `partial`
 * remains candidate source geometry and `reference-only` remains non-renderable
 * until independently verified. No patient-specific anatomy, diagnosis,
 * treatment or surgical inference is introduced here.
 */
const COMPOSED_STRUCTURAL_NODES = applyAtlasRelationPatches(
  [
    ...WHOLE_BODY_ATLAS_BASE_NODES,
    ...RESPIRATORY_ATLAS_NODES,
    ...HIGHER_END_WHOLE_BODY_NODES,
    ...ADVANCED_RESPIRATORY_ATLAS_NODES,
    ...DEEP_CARDIOVASCULAR_ATLAS_NODES,
    ...DEEP_NEUROVASCULAR_ATLAS_NODES,
    ...CARDIOPULMONARY_BRIDGE_NODES,
  ],
  [...HIGH_END_ATLAS_RELATION_PATCHES, ...CARDIOPULMONARY_RELATION_PATCHES],
)

export const COMPLETE_WHOLE_BODY_ATLAS: AtlasManifest = {
  id: 'panacea-complete-whole-body-atlas',
  revision: '2026-09-10-r4-higher-end-foundation-structural-foundation',
  nodes: deriveCanonicalAtlasHierarchy(COMPOSED_STRUCTURAL_NODES),
}
