import type { AtlasManifest, AtlasNode } from './atlasKernel'
import { ADVANCED_RESPIRATORY_ATLAS_NODES } from './advancedRespiratoryAtlas'
import { CARDIOPULMONARY_BRIDGE_NODES, CARDIOPULMONARY_RELATION_PATCHES } from './cardiopulmonaryBridge'
import { DEEP_CARDIOVASCULAR_ATLAS_NODES } from './deepCardiovascularAtlas'
import { DEEP_NEUROVASCULAR_ATLAS_NODES } from './deepNeurovascularAtlas'
import { applyAtlasRelationPatches, HIGH_END_ATLAS_RELATION_PATCHES } from './highEndTopology'
import { HIGHER_END_WHOLE_BODY_NODES } from './higherEndWholeBodyAtlas'
import { RESPIRATORY_ATLAS_NODES } from './respiratoryAtlas'
import { WHOLE_BODY_ATLAS_BASE_NODES } from './wholeBodyAtlas'
import { INDEKS_TUBUH } from '../bodyIndex.gen'

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
/**
 * Composition integrity, applied before relation patches:
 *
 * 1. First definition of an id wins. Earlier modules (base, curated respiratory,
 *    higher-end) carry geometry bindings verified against the shipped GLB; a
 *    later deep-module node reusing the same id must not create a second,
 *    differently parented copy of the same structure.
 * 2. A source-candidate node whose hints match no structure name in the shipped
 *    index for its file is demoted to 'reference-only' (no files). Claiming
 *    candidate geometry that the shipped bundle does not contain would let a
 *    viewer search for a mesh that does not exist; fail closed instead.
 */
const NAMA_PER_LAPISAN = (() => {
  const peta = new Map<string, string[]>()
  for (const s of INDEKS_TUBUH) {
    const daftar = peta.get(s.l) ?? []
    daftar.push(s.n.toLowerCase())
    peta.set(s.l, daftar)
  }
  return peta
})()

export function hintsResolveInShippedIndex(node: AtlasNode): boolean {
  const files = node.source?.files ?? []
  const hints = node.source?.nodeHints ?? []
  const names = files.flatMap((f) => NAMA_PER_LAPISAN.get(f.replace(/\.glb$/, '')) ?? [])
  if (!names.length) return true // file outside the shipped index: not judged here
  return hints.some((h) => { const q = h.toLowerCase(); return names.some((n) => n.includes(q)) })
}

export function integrateComposedAtlasNodes(nodes: readonly AtlasNode[]): AtlasNode[] {
  const seen = new Set<string>()
  const out: AtlasNode[] = []
  for (const node of nodes) {
    if (seen.has(node.id)) continue
    seen.add(node.id)
    if (node.geometryStatus === 'partial' && node.source?.files?.length && !hintsResolveInShippedIndex(node)) {
      out.push({ ...node, geometryStatus: 'reference-only', source: { ...node.source, files: undefined } })
    } else out.push(node)
  }
  return out
}

const COMPOSED_STRUCTURAL_NODES = applyAtlasRelationPatches(
  integrateComposedAtlasNodes([
    ...WHOLE_BODY_ATLAS_BASE_NODES,
    ...RESPIRATORY_ATLAS_NODES,
    ...HIGHER_END_WHOLE_BODY_NODES,
    ...ADVANCED_RESPIRATORY_ATLAS_NODES,
    ...DEEP_CARDIOVASCULAR_ATLAS_NODES,
    ...DEEP_NEUROVASCULAR_ATLAS_NODES,
    ...CARDIOPULMONARY_BRIDGE_NODES,
  ]),
  [...HIGH_END_ATLAS_RELATION_PATCHES, ...CARDIOPULMONARY_RELATION_PATCHES],
)

export const COMPLETE_WHOLE_BODY_ATLAS: AtlasManifest = {
  id: 'panacea-complete-whole-body-atlas',
  revision: '2026-09-10-r4-higher-end-foundation-structural-foundation',
  nodes: deriveCanonicalAtlasHierarchy(COMPOSED_STRUCTURAL_NODES),
}
