import type { AtlasManifest, AtlasSystemId } from './atlasKernel'
import { atlasNodeById } from './atlasKernel'

/**
 * Below-microstructure knowledge scale.
 *
 * This layer is deliberately separate from AtlasScale: AtlasNode represents
 * renderable/reference anatomy geometry, while BioScaleNode represents
 * educational biological structure that may not have 3D geometry at all.
 * Keeping them separate prevents a conceptual molecule/cell diagram from being
 * mistaken for verified anatomy mesh or patient-specific imaging.
 */
export type BioScale = 'cellular' | 'subcellular' | 'molecular'
export type BioStructureKind = 'cell' | 'organelle' | 'specialized-compartment' | 'molecular-complex'
export type BioRepresentation = 'conceptual' | 'reference-microscopy' | 'reference-molecular'
export type BioReviewStatus = 'engineering-reviewed' | 'academic-review-required' | 'academic-reviewed'
export type BioRelationKind =
  | 'contains'
  | 'part-of'
  | 'interfaces-with'
  | 'signals-via'
  | 'transports'
  | 'synthesizes'
  | 'expresses'

export interface BioScaleProvenance {
  sourceId: string
  sourceRevision: string
  license: string
  sourceLocator: string
  reviewStatus: BioReviewStatus
  reviewerScope?: string
}

export interface BioScaleRelation {
  kind: BioRelationKind
  targetId: string
  note?: string
}

export interface BioScaleNode {
  id: string
  label: string
  system: AtlasSystemId
  scale: BioScale
  kind: BioStructureKind
  /**
   * Existing AtlasNode that places this biological concept in whole-body context.
   * This is a semantic anchor, never a claim that the mesh resolves the cell/molecule.
   */
  anchorAtlasNodeId: string
  parentId?: string
  children?: readonly string[]
  synonyms?: readonly string[]
  relations?: readonly BioScaleRelation[]
  representation: BioRepresentation
  provenance: BioScaleProvenance
  educationalPriority: number
  physiologyCapable?: boolean
  /** Must remain false until a separately governed patient-specific pipeline exists. */
  patientSpecificAllowed: false
}

export interface BioScaleManifest {
  id: string
  revision: string
  nodes: readonly BioScaleNode[]
}

export interface BioScaleValidationIssue {
  nodeId?: string
  code:
    | 'duplicate-id'
    | 'missing-anchor'
    | 'anchor-system-mismatch'
    | 'missing-parent'
    | 'missing-child'
    | 'non-reciprocal-hierarchy'
    | 'relation-target-missing'
    | 'invalid-priority'
    | 'invalid-provenance'
    | 'invalid-scale-transition'
    | 'cycle'
  message: string
}

export const BIO_SCALE_ORDER: readonly BioScale[] = ['cellular', 'subcellular', 'molecular']

const pinnedRevision = (value: string) => {
  const normalized = value.trim().toLowerCase()
  return Boolean(normalized) && !['latest', 'main', 'master', 'head', 'current'].includes(normalized)
}

export function bioScaleRank(scale: BioScale) {
  return BIO_SCALE_ORDER.indexOf(scale)
}

export function bioScaleNodeById(manifest: BioScaleManifest, nodeId: string) {
  return manifest.nodes.find((node) => node.id === nodeId)
}

/** Canonical hierarchy is derived solely from parentId. */
export function deriveCanonicalBioScaleHierarchy(nodes: readonly BioScaleNode[]): readonly BioScaleNode[] {
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
 * Fail-closed engineering validator for the below-microstructure layer.
 * A clean result does not constitute anatomical or academic approval.
 */
export function validateBioScaleManifest(
  atlasManifest: AtlasManifest,
  bioManifest: BioScaleManifest,
): BioScaleValidationIssue[] {
  const issues: BioScaleValidationIssue[] = []
  const byId = new Map<string, BioScaleNode>()

  for (const node of bioManifest.nodes) {
    if (byId.has(node.id)) issues.push({ nodeId: node.id, code: 'duplicate-id', message: `Duplicate bioscale node id: ${node.id}` })
    byId.set(node.id, node)

    const anchor = atlasNodeById(atlasManifest, node.anchorAtlasNodeId)
    if (!anchor) {
      issues.push({ nodeId: node.id, code: 'missing-anchor', message: `Missing whole-body atlas anchor: ${node.anchorAtlasNodeId}` })
    } else if (anchor.system !== node.system) {
      issues.push({ nodeId: node.id, code: 'anchor-system-mismatch', message: `Bioscale node ${node.id} is ${node.system} but anchor ${anchor.id} is ${anchor.system}.` })
    }

    if (!(node.educationalPriority >= 0 && node.educationalPriority <= 1)) {
      issues.push({ nodeId: node.id, code: 'invalid-priority', message: 'educationalPriority must be between 0 and 1.' })
    }

    const provenance = node.provenance
    if (!provenance.sourceId.trim() || !pinnedRevision(provenance.sourceRevision) || !provenance.license.trim() || !provenance.sourceLocator.trim()) {
      issues.push({ nodeId: node.id, code: 'invalid-provenance', message: 'Bioscale provenance requires source id, immutable revision, license, and source locator.' })
    }
    if (provenance.reviewStatus === 'academic-reviewed' && !provenance.reviewerScope?.trim()) {
      issues.push({ nodeId: node.id, code: 'invalid-provenance', message: 'Academic-reviewed bioscale content requires explicit reviewer scope.' })
    }
  }

  for (const node of bioManifest.nodes) {
    if (node.parentId) {
      const parent = byId.get(node.parentId)
      if (!parent) {
        issues.push({ nodeId: node.id, code: 'missing-parent', message: `Missing bioscale parent ${node.parentId}.` })
      } else {
        if (parent.system !== node.system) {
          issues.push({ nodeId: node.id, code: 'invalid-scale-transition', message: `Bioscale hierarchy must remain within one system: ${parent.id} -> ${node.id}.` })
        }
        if (bioScaleRank(node.scale) < bioScaleRank(parent.scale)) {
          issues.push({ nodeId: node.id, code: 'invalid-scale-transition', message: `Bioscale child cannot become broader than parent: ${parent.scale} -> ${node.scale}.` })
        }
      }
    }

    for (const childId of node.children ?? []) {
      const child = byId.get(childId)
      if (!child) issues.push({ nodeId: node.id, code: 'missing-child', message: `Missing bioscale child ${childId}.` })
      else if (child.parentId !== node.id) issues.push({ nodeId: node.id, code: 'non-reciprocal-hierarchy', message: `${childId} does not point back to parent ${node.id}.` })
    }

    for (const relation of node.relations ?? []) {
      if (!byId.has(relation.targetId)) issues.push({ nodeId: node.id, code: 'relation-target-missing', message: `Missing bioscale relation target ${relation.targetId}.` })
    }
  }

  for (const node of bioManifest.nodes) {
    const seen = new Set<string>([node.id])
    let current = node
    while (current.parentId) {
      if (seen.has(current.parentId)) {
        issues.push({ nodeId: node.id, code: 'cycle', message: `Bioscale hierarchy cycle detected at ${current.parentId}.` })
        break
      }
      seen.add(current.parentId)
      const parent = byId.get(current.parentId)
      if (!parent) break
      current = parent
    }
  }

  return issues
}

export function bioScaleCoverage(manifest: BioScaleManifest) {
  const systems = Object.create(null) as Record<AtlasSystemId, number>
  const scales = Object.create(null) as Record<BioScale, number>
  for (const scale of BIO_SCALE_ORDER) scales[scale] = 0
  for (const node of manifest.nodes) {
    systems[node.system] = (systems[node.system] ?? 0) + 1
    scales[node.scale] += 1
  }
  return { systems, scales }
}
