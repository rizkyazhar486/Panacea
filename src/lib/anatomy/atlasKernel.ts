import type { AnatomySourceNodeBundle, AnatomySourceNodeMatch } from '../anatomySourceNodeRegistry'
import { resolveAllAnatomySourceNodes, resolveAnatomySourceNodes } from '../anatomySourceNodeRegistry'
import { validateAtlasAcademicReviewEvidence } from './atlasAcademicReviewGate'

export type AtlasSystemId =
  | 'surface'
  | 'skeletal'
  | 'articular'
  | 'muscular'
  | 'cardiovascular'
  | 'lymphatic'
  | 'nervous'
  | 'respiratory'
  | 'digestive'
  | 'urinary'
  | 'endocrine'
  | 'reproductive'
  | 'sensory'
  | 'fascial'

export type AtlasRegionId =
  | 'whole-body'
  | 'head'
  | 'neck'
  | 'thorax'
  | 'abdomen'
  | 'pelvis'
  | 'back'
  | 'upper-limb'
  | 'hand'
  | 'lower-limb'
  | 'foot'

export type AtlasLaterality = 'midline' | 'left' | 'right' | 'bilateral' | 'paired' | 'not-applicable'
export type AtlasScale = 'organism' | 'region' | 'organ' | 'suborgan' | 'tissue' | 'microstructure'
export type AtlasGeometryStatus = 'shipped' | 'partial' | 'reference-only' | 'planned'
export type AtlasReviewStatus = 'unreviewed' | 'engineering-reviewed' | 'academic-review-required' | 'academic-reviewed'
export type AtlasRelationKind =
  | 'contains'
  | 'part-of'
  | 'adjacent-to'
  | 'continuous-with'
  | 'supplies'
  | 'drains'
  | 'innervates'
  | 'articulates-with'
  | 'passes-through'
  | 'moves-with'
  | 'projects-to'

export type AtlasLodTier = 'macro' | 'standard' | 'detail' | 'micro'

export interface AtlasSourceBinding {
  /** Ordered, curated source-node lookup hints. First entries must be the most specific. */
  nodeHints: readonly string[]
  /** Composite nodes deliberately resolve every component hint. */
  mode: 'specific-fallback' | 'composite'
  /** Optional GLB bundle allow-list. Empty means all published bundles. */
  files?: readonly string[]
}

export interface AtlasProvenance {
  sourceId: string
  sourceRevision: string
  license: string
  sourceLocator: string
  reviewStatus: AtlasReviewStatus
  reviewerScope?: string
}

export interface AtlasSpatialAnchor {
  /** Normalized model coordinates, not patient coordinates. */
  center: readonly [number, number, number]
  radius: number
  /** Camera distance in normalized body units for an educational default view. */
  preferredCameraDistance?: number
}

export interface AtlasLodProfile {
  tier: AtlasLodTier
  maxTriangles: number
  maxTextureMegabytes: number
  maxNodeCount: number
  /** Approximate projected screen diameter at which this tier becomes useful. */
  minProjectedPixels: number
}

export interface AtlasRelation {
  kind: AtlasRelationKind
  targetId: string
  note?: string
}

export interface AtlasNode {
  id: string
  label: string
  system: AtlasSystemId
  regions: readonly AtlasRegionId[]
  laterality: AtlasLaterality
  scale: AtlasScale
  parentId?: string
  children?: readonly string[]
  synonyms?: readonly string[]
  source: AtlasSourceBinding
  provenance: AtlasProvenance
  geometryStatus: AtlasGeometryStatus
  spatial?: AtlasSpatialAnchor
  relations?: readonly AtlasRelation[]
  lod?: readonly AtlasLodProfile[]
  /** 0..1 educational importance, never a diagnostic probability. */
  educationalPriority: number
  /** True only for non-patient educational animation/physiology overlays. */
  physiologyCapable?: boolean
  /** Explicitly declares whether a node may be used as a surgical landmark. */
  surgicalLandmark?: boolean
}

export interface AtlasManifest {
  id: string
  revision: string
  nodes: readonly AtlasNode[]
}

export interface AtlasDeviceBudget {
  triangleBudget: number
  textureBudgetMegabytes: number
  nodeBudget: number
  devicePixelRatio: number
  viewportWidth: number
  viewportHeight: number
}

export interface AtlasRenderRequest {
  selectedNodeId?: string
  systems?: readonly AtlasSystemId[]
  regions?: readonly AtlasRegionId[]
  distanceByNodeId?: Readonly<Record<string, number>>
  projectedPixelsByNodeId?: Readonly<Record<string, number>>
  includeReferenceOnly?: boolean
}

export interface AtlasResolvedNode {
  node: AtlasNode
  sourceMatches: readonly AnatomySourceNodeMatch[]
  lod: AtlasLodProfile
  score: number
  estimatedTriangles: number
  estimatedTextureMegabytes: number
}

export interface AtlasRenderPlan {
  selectedNodeId?: string
  nodes: readonly AtlasResolvedNode[]
  skipped: readonly { nodeId: string; reason: string }[]
  totalEstimatedTriangles: number
  totalEstimatedTextureMegabytes: number
}

export interface AtlasValidationIssue {
  nodeId?: string
  code:
    | 'duplicate-id'
    | 'missing-parent'
    | 'missing-child'
    | 'relation-target-missing'
    | 'invalid-priority'
    | 'invalid-provenance'
    | 'invalid-academic-review'
    | 'invalid-lod'
    | 'non-reciprocal-hierarchy'
    | 'cycle'
  message: string
}

const DEFAULT_LOD: readonly AtlasLodProfile[] = [
  { tier: 'macro', maxTriangles: 8_000, maxTextureMegabytes: 2, maxNodeCount: 1, minProjectedPixels: 0 },
  { tier: 'standard', maxTriangles: 35_000, maxTextureMegabytes: 8, maxNodeCount: 8, minProjectedPixels: 80 },
  { tier: 'detail', maxTriangles: 120_000, maxTextureMegabytes: 20, maxNodeCount: 24, minProjectedPixels: 220 },
  { tier: 'micro', maxTriangles: 350_000, maxTextureMegabytes: 48, maxNodeCount: 48, minProjectedPixels: 520 },
]

const stableUnique = <T>(values: readonly T[]) => [...new Set(values)]

function isPinnedRevision(value: string) {
  const normalized = value.trim().toLowerCase()
  return Boolean(normalized) && !['latest', 'main', 'master', 'head', 'current'].includes(normalized)
}

function lodsFor(node: AtlasNode) {
  const raw = node.lod?.length ? [...node.lod] : [...DEFAULT_LOD]
  return raw.sort((a, b) => a.minProjectedPixels - b.minProjectedPixels)
}

export function chooseAtlasLod(node: AtlasNode, projectedPixels: number, budget: AtlasDeviceBudget): AtlasLodProfile {
  const candidates = lodsFor(node).filter((lod) =>
    lod.minProjectedPixels <= projectedPixels
    && lod.maxTriangles <= budget.triangleBudget
    && lod.maxTextureMegabytes <= budget.textureBudgetMegabytes,
  )
  return candidates[candidates.length - 1] ?? lodsFor(node)[0]
}

function resolveNodeSource(node: AtlasNode, bundles: readonly AnatomySourceNodeBundle[]) {
  const scopedBundles = node.source.files?.length
    ? bundles.filter((bundle) => node.source.files!.includes(bundle.file))
    : bundles
  return node.source.mode === 'composite'
    ? resolveAllAnatomySourceNodes(node.source.nodeHints, scopedBundles, 16)
    : resolveAnatomySourceNodes(node.source.nodeHints, scopedBundles, 16)
}

function matchesRequest(node: AtlasNode, request: AtlasRenderRequest) {
  if (!request.includeReferenceOnly && (node.geometryStatus === 'reference-only' || node.geometryStatus === 'planned')) return false
  if (request.systems?.length && !request.systems.includes(node.system)) return false
  if (request.regions?.length && !node.regions.some((region) => request.regions!.includes(region))) return false
  return true
}

/**
 * Educational render score. This is a graphics scheduling heuristic, not a
 * clinical score and must never be interpreted as disease likelihood.
 *
 * score = educationalPriority × selectionBoost × visibilityBoost × proximityBoost
 */
export function atlasRenderScore(node: AtlasNode, request: AtlasRenderRequest) {
  const selectedBoost = request.selectedNodeId === node.id ? 5 : node.parentId === request.selectedNodeId ? 2.2 : 1
  const projected = request.projectedPixelsByNodeId?.[node.id] ?? 120
  const visibilityBoost = 0.55 + Math.min(Math.max(projected, 0), 900) / 900
  const distance = Math.max(request.distanceByNodeId?.[node.id] ?? 3, 0.05)
  const proximityBoost = 1 / Math.sqrt(distance)
  return node.educationalPriority * selectedBoost * visibilityBoost * proximityBoost
}

export function buildAtlasRenderPlan(
  manifest: AtlasManifest,
  bundles: readonly AnatomySourceNodeBundle[],
  request: AtlasRenderRequest,
  budget: AtlasDeviceBudget,
): AtlasRenderPlan {
  const skipped: { nodeId: string; reason: string }[] = []
  const candidates: AtlasResolvedNode[] = []

  for (const node of manifest.nodes) {
    if (!matchesRequest(node, request)) continue

    const sourceMatches = resolveNodeSource(node, bundles)
    if (node.geometryStatus === 'shipped' && sourceMatches.length === 0) {
      skipped.push({ nodeId: node.id, reason: 'No source-node match in the active/indexed anatomy bundles.' })
      continue
    }

    const projected = request.projectedPixelsByNodeId?.[node.id] ?? 120
    const lod = chooseAtlasLod(node, projected, budget)
    candidates.push({
      node,
      sourceMatches,
      lod,
      score: atlasRenderScore(node, request),
      estimatedTriangles: lod.maxTriangles,
      estimatedTextureMegabytes: lod.maxTextureMegabytes,
    })
  }

  candidates.sort((a, b) => b.score - a.score || a.node.id.localeCompare(b.node.id))

  const accepted: AtlasResolvedNode[] = []
  let triangles = 0
  let textures = 0
  for (const candidate of candidates) {
    if (accepted.length >= budget.nodeBudget) {
      skipped.push({ nodeId: candidate.node.id, reason: 'Node budget exhausted.' })
      continue
    }
    if (triangles + candidate.estimatedTriangles > budget.triangleBudget) {
      skipped.push({ nodeId: candidate.node.id, reason: 'Triangle budget exhausted.' })
      continue
    }
    if (textures + candidate.estimatedTextureMegabytes > budget.textureBudgetMegabytes) {
      skipped.push({ nodeId: candidate.node.id, reason: 'Texture budget exhausted.' })
      continue
    }
    accepted.push(candidate)
    triangles += candidate.estimatedTriangles
    textures += candidate.estimatedTextureMegabytes
  }

  return {
    selectedNodeId: request.selectedNodeId,
    nodes: accepted,
    skipped,
    totalEstimatedTriangles: triangles,
    totalEstimatedTextureMegabytes: textures,
  }
}

export function atlasNodeById(manifest: AtlasManifest, nodeId: string) {
  return manifest.nodes.find((node) => node.id === nodeId)
}

export function atlasAncestors(manifest: AtlasManifest, nodeId: string) {
  const byId = new Map(manifest.nodes.map((node) => [node.id, node]))
  const result: AtlasNode[] = []
  const seen = new Set<string>()
  let current = byId.get(nodeId)
  while (current?.parentId) {
    if (seen.has(current.parentId)) break
    seen.add(current.parentId)
    const parent = byId.get(current.parentId)
    if (!parent) break
    result.push(parent)
    current = parent
  }
  return result
}

export function atlasNeighborhood(manifest: AtlasManifest, nodeId: string, relationKinds?: readonly AtlasRelationKind[]) {
  const node = atlasNodeById(manifest, nodeId)
  if (!node) return []
  const targetIds = stableUnique([
    ...(node.children ?? []),
    ...(node.parentId ? [node.parentId] : []),
    ...(node.relations ?? [])
      .filter((relation) => !relationKinds?.length || relationKinds.includes(relation.kind))
      .map((relation) => relation.targetId),
  ])
  return targetIds.map((id) => atlasNodeById(manifest, id)).filter((value): value is AtlasNode => Boolean(value))
}

export function validateAtlasManifest(manifest: AtlasManifest): AtlasValidationIssue[] {
  const issues: AtlasValidationIssue[] = []
  const byId = new Map<string, AtlasNode>()

  for (const node of manifest.nodes) {
    if (byId.has(node.id)) issues.push({ nodeId: node.id, code: 'duplicate-id', message: `Duplicate atlas node id: ${node.id}` })
    byId.set(node.id, node)
    if (!(node.educationalPriority >= 0 && node.educationalPriority <= 1)) {
      issues.push({ nodeId: node.id, code: 'invalid-priority', message: 'educationalPriority must be between 0 and 1.' })
    }
    if (!node.provenance.sourceId.trim() || !isPinnedRevision(node.provenance.sourceRevision) || !node.provenance.license.trim() || !node.provenance.sourceLocator.trim()) {
      issues.push({ nodeId: node.id, code: 'invalid-provenance', message: 'Atlas provenance requires source id, immutable revision, license, and source locator.' })
    }
    const academicReview = validateAtlasAcademicReviewEvidence(node.provenance)
    for (const reason of academicReview.reasons) {
      issues.push({ nodeId: node.id, code: 'invalid-academic-review', message: reason })
    }
    for (const lod of lodsFor(node)) {
      if (lod.maxTriangles <= 0 || lod.maxTextureMegabytes <= 0 || lod.maxNodeCount <= 0 || lod.minProjectedPixels < 0) {
        issues.push({ nodeId: node.id, code: 'invalid-lod', message: `Invalid LOD profile on ${node.id}/${lod.tier}.` })
      }
    }
  }

  for (const node of manifest.nodes) {
    if (node.parentId && !byId.has(node.parentId)) {
      issues.push({ nodeId: node.id, code: 'missing-parent', message: `Missing parent ${node.parentId}.` })
    }
    for (const childId of node.children ?? []) {
      const child = byId.get(childId)
      if (!child) issues.push({ nodeId: node.id, code: 'missing-child', message: `Missing child ${childId}.` })
      else if (child.parentId !== node.id) issues.push({ nodeId: node.id, code: 'non-reciprocal-hierarchy', message: `${childId} does not point back to parent ${node.id}.` })
    }
    for (const relation of node.relations ?? []) {
      if (!byId.has(relation.targetId)) issues.push({ nodeId: node.id, code: 'relation-target-missing', message: `Missing relation target ${relation.targetId}.` })
    }
  }

  for (const node of manifest.nodes) {
    const seen = new Set<string>([node.id])
    let current = node
    while (current.parentId) {
      if (seen.has(current.parentId)) {
        issues.push({ nodeId: node.id, code: 'cycle', message: `Hierarchy cycle detected at ${current.parentId}.` })
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
