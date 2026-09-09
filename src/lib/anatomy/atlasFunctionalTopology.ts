import type { AtlasManifest, AtlasSystemId } from './atlasKernel'
import { atlasNodeById } from './atlasKernel'
import type { BioScaleManifest, BioScaleNode } from './bioScaleAtlas'
import { bioScaleNodeById } from './bioScaleAtlas'

export type FunctionalRefNamespace = 'atlas' | 'bio'
export type FunctionalPathwayKind =
  | 'barrier-homeostasis'
  | 'matrix-homeostasis'
  | 'excitation-contraction'
  | 'perfusion'
  | 'portal-flow'
  | 'lymph-drainage'
  | 'neural-conduction'
  | 'airflow-gas-exchange'
  | 'digestive-transit'
  | 'filtration-urinary-flow'
  | 'endocrine-signaling'
  | 'reproductive-cell-program'
  | 'sensory-transduction'

export type FunctionalProcess =
  | 'transports'
  | 'conducts'
  | 'drains'
  | 'filters'
  | 'exchanges'
  | 'absorbs'
  | 'secretes'
  | 'transduces'
  | 'contracts'
  | 'synthesizes'
  | 'maintains'
  | 'interfaces'

export type FunctionalSignalDomain = 'material-flow' | 'electrical-signal' | 'chemical-signal' | 'mechanical-state' | 'exchange-interface' | 'structural-program'
export type FunctionalReviewStatus = 'engineering-reviewed' | 'academic-review-required' | 'academic-reviewed'
export type FunctionalOverlayIntent = 'directional-flow' | 'pulse' | 'exchange-glow' | 'gradient' | 'structural-highlight'

export interface FunctionalNodeRef {
  namespace: FunctionalRefNamespace
  id: string
}

export interface FunctionalTopologyProvenance {
  sourceId: string
  sourceRevision: string
  sourceLocator: string
  license: string
  reviewStatus: FunctionalReviewStatus
  reviewerScope?: string
}

export interface FunctionalTopologyEdge {
  id: string
  from: FunctionalNodeRef
  to: FunctionalNodeRef
  process: FunctionalProcess
  signalDomain: FunctionalSignalDomain
  overlayIntent: FunctionalOverlayIntent
  /** Descriptive educational annotation only; never a patient measurement. */
  note?: string
}

export interface FunctionalTopologyPathway {
  id: string
  label: string
  kind: FunctionalPathwayKind
  systems: readonly AtlasSystemId[]
  nodes: readonly FunctionalNodeRef[]
  edges: readonly FunctionalTopologyEdge[]
  entryRefs: readonly FunctionalNodeRef[]
  terminalRefs: readonly FunctionalNodeRef[]
  crossSystemAllowed: boolean
  cyclicAllowed: boolean
  qualitativeOnly: true
  patientSpecificAllowed: false
  educationalPurpose: string
  provenance: FunctionalTopologyProvenance
}

export interface FunctionalTopologyManifest {
  id: string
  revision: string
  pathways: readonly FunctionalTopologyPathway[]
}

export interface FunctionalTopologyValidationIssue {
  pathwayId?: string
  edgeId?: string
  code:
    | 'duplicate-pathway-id'
    | 'duplicate-edge-id'
    | 'duplicate-node-ref'
    | 'missing-ref'
    | 'edge-ref-not-declared'
    | 'self-edge'
    | 'system-mismatch'
    | 'undeclared-cross-system'
    | 'invalid-entry'
    | 'invalid-terminal'
    | 'invalid-provenance'
    | 'cycle'
    | 'empty-pathway'
  message: string
}

export interface FunctionalResolvedRef {
  ref: FunctionalNodeRef
  key: string
  label: string
  system: AtlasSystemId
  representationDomain: 'atlas-geometry' | 'atlas-reference' | 'bio-reference'
  anchorAtlasNodeId?: string
}

export interface FunctionalPropagationWave {
  depth: number
  refs: readonly FunctionalResolvedRef[]
  incomingEdges: readonly FunctionalTopologyEdge[]
}

export interface FunctionalTopologyScenePlan {
  pathwayId: string
  label: string
  kind: FunctionalPathwayKind
  systems: readonly AtlasSystemId[]
  startRefs: readonly FunctionalResolvedRef[]
  waves: readonly FunctionalPropagationWave[]
  atlasPinNodeIds: readonly string[]
  bioReferenceNodeIds: readonly string[]
  overlayEdges: readonly FunctionalTopologyEdge[]
  qualitativeOnly: true
  warnings: readonly string[]
}

const refKey = (ref: FunctionalNodeRef) => `${ref.namespace}:${ref.id}`
const stableRefs = (refs: readonly FunctionalNodeRef[]) => [...new Map(refs.map((ref) => [refKey(ref), ref])).values()]

function pinnedRevision(value: string) {
  const normalized = value.trim().toLowerCase()
  return Boolean(normalized) && !['latest', 'main', 'master', 'head', 'current'].includes(normalized)
}

export function functionalPathwayById(manifest: FunctionalTopologyManifest, pathwayId: string) {
  return manifest.pathways.find((pathway) => pathway.id === pathwayId)
}

export function resolveFunctionalRef(
  atlas: AtlasManifest,
  bio: BioScaleManifest,
  ref: FunctionalNodeRef,
): FunctionalResolvedRef | null {
  if (ref.namespace === 'atlas') {
    const node = atlasNodeById(atlas, ref.id)
    if (!node) return null
    return {
      ref,
      key: refKey(ref),
      label: node.label,
      system: node.system,
      representationDomain: node.geometryStatus === 'shipped' || node.geometryStatus === 'partial' ? 'atlas-geometry' : 'atlas-reference',
    }
  }
  const node = bioScaleNodeById(bio, ref.id)
  if (!node) return null
  return {
    ref,
    key: refKey(ref),
    label: node.label,
    system: node.system,
    representationDomain: 'bio-reference',
    anchorAtlasNodeId: node.anchorAtlasNodeId,
  }
}

function bioAnchorCompatible(atlas: AtlasManifest, bioNode: BioScaleNode, atlasRef: FunctionalNodeRef) {
  if (atlasRef.namespace !== 'atlas') return false
  if (bioNode.anchorAtlasNodeId === atlasRef.id) return true
  let cursor = atlasNodeById(atlas, bioNode.anchorAtlasNodeId)
  const seen = new Set<string>()
  while (cursor?.parentId && !seen.has(cursor.id)) {
    seen.add(cursor.id)
    if (cursor.parentId === atlasRef.id) return true
    cursor = atlasNodeById(atlas, cursor.parentId)
  }
  return false
}

/**
 * Fail-closed validator for authored qualitative physiology topology.
 * A clean result is engineering integrity only, never biomedical approval.
 */
export function validateFunctionalTopologyManifest(
  atlas: AtlasManifest,
  bio: BioScaleManifest,
  manifest: FunctionalTopologyManifest,
): FunctionalTopologyValidationIssue[] {
  const issues: FunctionalTopologyValidationIssue[] = []
  const pathwayIds = new Set<string>()

  for (const pathway of manifest.pathways) {
    if (pathwayIds.has(pathway.id)) issues.push({ pathwayId: pathway.id, code: 'duplicate-pathway-id', message: `Duplicate functional pathway id: ${pathway.id}` })
    pathwayIds.add(pathway.id)
    if (!pathway.nodes.length || !pathway.edges.length) issues.push({ pathwayId: pathway.id, code: 'empty-pathway', message: 'Functional pathway requires authored nodes and edges.' })

    const nodeKeys = new Set<string>()
    const resolvedByKey = new Map<string, FunctionalResolvedRef>()
    for (const ref of pathway.nodes) {
      const key = refKey(ref)
      if (nodeKeys.has(key)) issues.push({ pathwayId: pathway.id, code: 'duplicate-node-ref', message: `Duplicate functional node ref: ${key}` })
      nodeKeys.add(key)
      const resolved = resolveFunctionalRef(atlas, bio, ref)
      if (!resolved) issues.push({ pathwayId: pathway.id, code: 'missing-ref', message: `Missing functional topology reference: ${key}` })
      else resolvedByKey.set(key, resolved)
    }

    const resolvedSystems = new Set([...resolvedByKey.values()].map((resolved) => resolved.system))
    for (const system of resolvedSystems) {
      if (!pathway.systems.includes(system)) issues.push({ pathwayId: pathway.id, code: 'system-mismatch', message: `Pathway ${pathway.id} uses undeclared system ${system}.` })
    }
    if (resolvedSystems.size > 1 && !pathway.crossSystemAllowed) {
      issues.push({ pathwayId: pathway.id, code: 'undeclared-cross-system', message: `Pathway ${pathway.id} crosses ${[...resolvedSystems].join(', ')} without crossSystemAllowed.` })
    }

    const edgeIds = new Set<string>()
    const outgoing = new Map<string, string[]>()
    for (const edge of pathway.edges) {
      if (edgeIds.has(edge.id)) issues.push({ pathwayId: pathway.id, edgeId: edge.id, code: 'duplicate-edge-id', message: `Duplicate edge id: ${edge.id}` })
      edgeIds.add(edge.id)
      const fromKey = refKey(edge.from)
      const toKey = refKey(edge.to)
      if (!nodeKeys.has(fromKey) || !nodeKeys.has(toKey)) issues.push({ pathwayId: pathway.id, edgeId: edge.id, code: 'edge-ref-not-declared', message: `Edge ${edge.id} references a node not declared by pathway.` })
      if (fromKey === toKey) issues.push({ pathwayId: pathway.id, edgeId: edge.id, code: 'self-edge', message: `Functional edge cannot self-reference: ${edge.id}` })
      const list = outgoing.get(fromKey) ?? []
      list.push(toKey)
      outgoing.set(fromKey, list)

      // An atlas -> bioscale transition must be explicitly anchored to that atlas
      // node or a descendant of it; this prevents arbitrary organ-to-molecule jumps.
      if (edge.from.namespace === 'atlas' && edge.to.namespace === 'bio') {
        const targetBio = bioScaleNodeById(bio, edge.to.id)
        if (targetBio && !bioAnchorCompatible(atlas, targetBio, edge.from)) {
          issues.push({ pathwayId: pathway.id, edgeId: edge.id, code: 'system-mismatch', message: `Atlas-to-bio edge ${edge.id} is not compatible with bioscale anchor ${targetBio.anchorAtlasNodeId}.` })
        }
      }
    }

    for (const entry of pathway.entryRefs) {
      if (!nodeKeys.has(refKey(entry))) issues.push({ pathwayId: pathway.id, code: 'invalid-entry', message: `Entry ref is not declared in pathway: ${refKey(entry)}` })
    }
    for (const terminal of pathway.terminalRefs) {
      if (!nodeKeys.has(refKey(terminal))) issues.push({ pathwayId: pathway.id, code: 'invalid-terminal', message: `Terminal ref is not declared in pathway: ${refKey(terminal)}` })
    }

    const provenance = pathway.provenance
    if (!provenance.sourceId.trim() || !pinnedRevision(provenance.sourceRevision) || !provenance.sourceLocator.trim() || !provenance.license.trim()) {
      issues.push({ pathwayId: pathway.id, code: 'invalid-provenance', message: 'Functional topology provenance requires source id, immutable revision, source locator, and license.' })
    }
    if (provenance.reviewStatus === 'academic-reviewed' && !provenance.reviewerScope?.trim()) {
      issues.push({ pathwayId: pathway.id, code: 'invalid-provenance', message: 'Academic-reviewed topology requires explicit reviewer scope.' })
    }

    if (!pathway.cyclicAllowed) {
      const visiting = new Set<string>()
      const visited = new Set<string>()
      const visit = (key: string): boolean => {
        if (visiting.has(key)) return true
        if (visited.has(key)) return false
        visiting.add(key)
        for (const next of outgoing.get(key) ?? []) if (visit(next)) return true
        visiting.delete(key)
        visited.add(key)
        return false
      }
      for (const key of nodeKeys) {
        if (visit(key)) {
          issues.push({ pathwayId: pathway.id, code: 'cycle', message: `Functional pathway contains a cycle but cyclicAllowed=false: ${pathway.id}` })
          break
        }
      }
    }
  }

  return issues
}

/**
 * Breadth-first qualitative propagation. Depth is graph hop count, not time.
 * No propagation speed, pressure, concentration, voltage, or patient value is inferred.
 */
export function planFunctionalPropagation(
  atlas: AtlasManifest,
  bio: BioScaleManifest,
  pathway: FunctionalTopologyPathway,
  startRefs: readonly FunctionalNodeRef[] = pathway.entryRefs,
  maxHops = 32,
): FunctionalPropagationWave[] {
  const nodeKeys = new Set(pathway.nodes.map(refKey))
  const outgoing = new Map<string, FunctionalTopologyEdge[]>()
  for (const edge of pathway.edges) {
    const list = outgoing.get(refKey(edge.from)) ?? []
    list.push(edge)
    outgoing.set(refKey(edge.from), list)
  }
  for (const edges of outgoing.values()) edges.sort((a, b) => a.id.localeCompare(b.id))

  const visited = new Set<string>()
  let frontier = stableRefs(startRefs).filter((ref) => nodeKeys.has(refKey(ref)))
  const waves: FunctionalPropagationWave[] = []
  for (let depth = 0; frontier.length && depth <= Math.max(0, maxHops); depth += 1) {
    const fresh = frontier.filter((ref) => !visited.has(refKey(ref)))
    if (!fresh.length) break
    for (const ref of fresh) visited.add(refKey(ref))
    const resolved = fresh
      .map((ref) => resolveFunctionalRef(atlas, bio, ref))
      .filter((value): value is FunctionalResolvedRef => Boolean(value))
      .sort((a, b) => a.key.localeCompare(b.key))
    const incomingEdges = depth === 0
      ? []
      : pathway.edges.filter((edge) => resolved.some((node) => node.key === refKey(edge.to))).sort((a, b) => a.id.localeCompare(b.id))
    waves.push({ depth, refs: resolved, incomingEdges })

    const next: FunctionalNodeRef[] = []
    for (const ref of fresh) {
      for (const edge of outgoing.get(refKey(ref)) ?? []) {
        if (!visited.has(refKey(edge.to))) next.push(edge.to)
      }
    }
    frontier = stableRefs(next)
  }
  return waves
}

export function compileFunctionalTopologyScene(
  atlas: AtlasManifest,
  bio: BioScaleManifest,
  pathway: FunctionalTopologyPathway,
  options: { startRefs?: readonly FunctionalNodeRef[]; maxHops?: number } = {},
): FunctionalTopologyScenePlan {
  const startRefs = options.startRefs?.length ? options.startRefs : pathway.entryRefs
  const waves = planFunctionalPropagation(atlas, bio, pathway, startRefs, options.maxHops ?? 32)
  const visitedKeys = new Set(waves.flatMap((wave) => wave.refs.map((ref) => ref.key)))
  const atlasPinNodeIds = new Set<string>()
  const bioReferenceNodeIds = new Set<string>()
  for (const wave of waves) {
    for (const resolved of wave.refs) {
      if (resolved.ref.namespace === 'atlas') atlasPinNodeIds.add(resolved.ref.id)
      else {
        bioReferenceNodeIds.add(resolved.ref.id)
        if (resolved.anchorAtlasNodeId) atlasPinNodeIds.add(resolved.anchorAtlasNodeId)
      }
    }
  }
  const overlayEdges = pathway.edges.filter((edge) => visitedKeys.has(refKey(edge.from)) && visitedKeys.has(refKey(edge.to)))
  return {
    pathwayId: pathway.id,
    label: pathway.label,
    kind: pathway.kind,
    systems: pathway.systems,
    startRefs: stableRefs(startRefs).map((ref) => resolveFunctionalRef(atlas, bio, ref)).filter((value): value is FunctionalResolvedRef => Boolean(value)),
    waves,
    atlasPinNodeIds: [...atlasPinNodeIds],
    bioReferenceNodeIds: [...bioReferenceNodeIds],
    overlayEdges,
    qualitativeOnly: true,
    warnings: [
      'Functional propagation depth is graph topology only; it is not time, velocity, pressure, concentration, voltage, probability, or patient measurement.',
      'All overlays are educational qualitative representations and require source-specific academic review before authoritative biomedical publication.',
      'Bioscale references are conceptual/reference domains and must never be rendered as literal patient-specific microscopic or molecular geometry.',
    ],
  }
}

export function functionalTopologySystemCoverage(manifest: FunctionalTopologyManifest) {
  const systems = new Set<AtlasSystemId>()
  for (const pathway of manifest.pathways) for (const system of pathway.systems) systems.add(system)
  return [...systems].sort()
}
