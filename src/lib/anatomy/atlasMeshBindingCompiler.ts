import { anatomySourceNameMatchesHint } from '../anatomySourceNodeRegistry'
import {
  BODY_ATLAS_GRAPH,
  normalizeAtlasTerm,
  type BodyAtlasGraph,
  type BodyAtlasNode,
} from '../bodyAtlasGraph'
import type { AtlasLaterality, AtlasManifest, AtlasNode, AtlasRegionId } from './atlasKernel'

export type AtlasMeshBindingStatus = 'bound' | 'partial' | 'ambiguous' | 'unresolved' | 'metadata-only'

export interface AtlasMeshBindingCandidate {
  meshNodeId: string
  sourceName: string
  sourceFile: string
  sourceRegion: string
  hint: string
  hintIndex: number
  score: number
  reasons: readonly string[]
}

export interface AtlasMeshBindingResult {
  atlasNodeId: string
  status: AtlasMeshBindingStatus
  selectedMeshNodeIds: readonly string[]
  candidates: readonly AtlasMeshBindingCandidate[]
  matchedHints: readonly string[]
  unresolvedHints: readonly string[]
  reasons: readonly string[]
}

export interface AtlasMeshBindingCompilerOptions {
  minScore?: number
  ambiguityMargin?: number
  maxCandidatesPerHint?: number
  maxSelectedMeshes?: number
  /**
   * When true, a reviewed region is treated as a hard candidate boundary.
   * Unknown/whole-body regions stay unscoped rather than being guessed.
   */
  enforceRegionScope?: boolean
}

export interface AtlasMeshBindingReport {
  manifestId: string
  manifestRevision: string
  results: readonly AtlasMeshBindingResult[]
  totalNodeCount: number
  geometryEligibleNodeCount: number
  boundNodeCount: number
  partialNodeCount: number
  ambiguousNodeCount: number
  unresolvedNodeCount: number
  metadataOnlyNodeCount: number
  selectedMeshCount: number
  bindingRate: number
  ambiguityRate: number
  warnings: readonly string[]
}

const SOURCE_REGIONS_BY_ATLAS_REGION: Partial<Record<AtlasRegionId, readonly string[]>> = {
  head: ['kepala'],
  neck: ['leher'],
  thorax: ['toraks'],
  abdomen: ['abdomen'],
  pelvis: ['pelvis'],
  back: ['leher', 'toraks', 'abdomen', 'pelvis'],
  'upper-limb': ['bahu-lengan', 'tangan'],
  hand: ['tangan'],
  'lower-limb': ['paha', 'tungkai'],
  foot: ['tungkai'],
}

const SOURCE_LATERALITY_BY_ATLAS: Partial<Record<AtlasLaterality, BodyAtlasNode['laterality']>> = {
  left: 'kiri',
  right: 'kanan',
  midline: 'tengah',
}

const DEFAULT_OPTIONS: Required<AtlasMeshBindingCompilerOptions> = {
  minScore: 700,
  ambiguityMargin: 90,
  maxCandidatesPerHint: 24,
  maxSelectedMeshes: 32,
  enforceRegionScope: true,
}

function stableUnique<T>(values: readonly T[]) {
  return [...new Set(values)]
}

function optionsWithDefaults(options: AtlasMeshBindingCompilerOptions): Required<AtlasMeshBindingCompilerOptions> {
  return {
    minScore: Math.max(0, options.minScore ?? DEFAULT_OPTIONS.minScore),
    ambiguityMargin: Math.max(0, options.ambiguityMargin ?? DEFAULT_OPTIONS.ambiguityMargin),
    maxCandidatesPerHint: Math.max(1, options.maxCandidatesPerHint ?? DEFAULT_OPTIONS.maxCandidatesPerHint),
    maxSelectedMeshes: Math.max(1, options.maxSelectedMeshes ?? DEFAULT_OPTIONS.maxSelectedMeshes),
    enforceRegionScope: options.enforceRegionScope ?? DEFAULT_OPTIONS.enforceRegionScope,
  }
}

function nodeSearchTerms(node: AtlasNode) {
  return stableUnique([node.label, ...(node.synonyms ?? []), ...node.source.nodeHints])
    .map(normalizeAtlasTerm)
    .filter(Boolean)
}

function allowedSourceRegions(node: AtlasNode) {
  const regions = stableUnique(node.regions.flatMap((region) => SOURCE_REGIONS_BY_ATLAS_REGION[region] ?? []))
  return regions.length ? new Set(regions.map(normalizeAtlasTerm)) : null
}

function scopeMeshNodes(
  node: AtlasNode,
  graph: BodyAtlasGraph,
  options: Required<AtlasMeshBindingCompilerOptions>,
) {
  const allowedFiles = node.source.files?.length ? new Set(node.source.files) : null
  const allowedRegions = options.enforceRegionScope ? allowedSourceRegions(node) : null
  const requiredLaterality = SOURCE_LATERALITY_BY_ATLAS[node.laterality]

  return graph.nodes.filter((mesh) => {
    if (allowedFiles && !allowedFiles.has(mesh.sourceFile)) return false
    if (allowedRegions && !allowedRegions.has(normalizeAtlasTerm(mesh.region))) return false
    if (requiredLaterality && mesh.laterality !== requiredLaterality) return false
    return true
  })
}

function scoreCandidate(
  node: AtlasNode,
  mesh: BodyAtlasNode,
  hint: string,
  hintIndex: number,
): AtlasMeshBindingCandidate | null {
  const normalizedHint = normalizeAtlasTerm(hint)
  if (!normalizedHint) return null

  const sourceMatches = anatomySourceNameMatchesHint(mesh.sourceName, hint)
  const baseMatches = anatomySourceNameMatchesHint(mesh.baseName, hint)
  if (!sourceMatches && !baseMatches) return null

  const reasons: string[] = []
  let score = 0
  const normalizedSource = mesh.normalizedName || normalizeAtlasTerm(mesh.sourceName)
  const normalizedBase = mesh.normalizedBaseName || normalizeAtlasTerm(mesh.baseName)

  if (normalizedSource === normalizedHint) {
    score = 1_200
    reasons.push('exact-source-name')
  } else if (normalizedBase === normalizedHint) {
    score = 1_150
    reasons.push('exact-base-name')
  } else if (sourceMatches) {
    score = 860
    reasons.push('reviewed-contiguous-source-hint')
  } else {
    score = 820
    reasons.push('reviewed-contiguous-base-hint')
  }

  score += Math.max(0, 120 - hintIndex * 20)
  reasons.push(`specificity-rank:${hintIndex}`)

  if (node.source.files?.includes(mesh.sourceFile)) {
    score += 90
    reasons.push('explicit-file-allowlist')
  }

  const requiredLaterality = SOURCE_LATERALITY_BY_ATLAS[node.laterality]
  if (requiredLaterality && mesh.laterality === requiredLaterality) {
    score += 70
    reasons.push('laterality-boundary')
  }

  const regionSet = allowedSourceRegions(node)
  if (regionSet?.has(normalizeAtlasTerm(mesh.region))) {
    score += 45
    reasons.push('region-boundary')
  }

  const canonicalTerms = nodeSearchTerms(node)
  if (canonicalTerms.some((term) => normalizedSource === term || normalizedBase === term)) {
    score += 80
    reasons.push('canonical-term-exact')
  }

  return {
    meshNodeId: mesh.id,
    sourceName: mesh.sourceName,
    sourceFile: mesh.sourceFile,
    sourceRegion: mesh.region,
    hint,
    hintIndex,
    score,
    reasons,
  }
}

function rankCandidates(candidates: readonly AtlasMeshBindingCandidate[]) {
  return [...candidates].sort((a, b) => b.score - a.score
    || a.hintIndex - b.hintIndex
    || a.sourceFile.localeCompare(b.sourceFile)
    || a.sourceName.localeCompare(b.sourceName)
    || a.meshNodeId.localeCompare(b.meshNodeId))
}

function meshById(graph: BodyAtlasGraph) {
  return graph.nodeById.size ? graph.nodeById : new Map(graph.nodes.map((node) => [node.id, node] as const))
}

function sameStructuralIdentity(a: BodyAtlasNode | undefined, b: BodyAtlasNode | undefined) {
  if (!a || !b) return false
  return a.layer === b.layer && a.normalizedBaseName === b.normalizedBaseName
}

function classifyCompetition(
  eligible: readonly AtlasMeshBindingCandidate[],
  graph: BodyAtlasGraph,
  ambiguityMargin: number,
) {
  const lookup = meshById(graph)
  const top = eligible[0]
  const topMesh = top ? lookup.get(top.meshNodeId) : undefined
  const sameIdentity = top
    ? eligible.filter((candidate) => sameStructuralIdentity(topMesh, lookup.get(candidate.meshNodeId)))
    : []
  const competing = top
    ? eligible.find((candidate) => !sameStructuralIdentity(topMesh, lookup.get(candidate.meshNodeId)))
    : undefined
  const ambiguous = Boolean(top && competing && top.score - competing.score < ambiguityMargin)
  return { sameIdentity, competing, ambiguous }
}

function selectSpecificFallback(
  node: AtlasNode,
  scopedMeshes: readonly BodyAtlasNode[],
  graph: BodyAtlasGraph,
  options: Required<AtlasMeshBindingCompilerOptions>,
): AtlasMeshBindingResult {
  const rejectedCandidates: AtlasMeshBindingCandidate[] = []

  for (let hintIndex = 0; hintIndex < node.source.nodeHints.length; hintIndex += 1) {
    const hint = node.source.nodeHints[hintIndex]
    const ranked = rankCandidates(scopedMeshes
      .map((mesh) => scoreCandidate(node, mesh, hint, hintIndex))
      .filter((candidate): candidate is AtlasMeshBindingCandidate => Boolean(candidate)))
      .slice(0, options.maxCandidatesPerHint)

    if (!ranked.length) continue

    const eligible = ranked.filter((candidate) => candidate.score >= options.minScore)
    if (!eligible.length) {
      rejectedCandidates.push(...ranked)
      continue
    }

    const { sameIdentity, ambiguous } = classifyCompetition(eligible, graph, options.ambiguityMargin)
    if (ambiguous) {
      return {
        atlasNodeId: node.id,
        status: 'ambiguous',
        selectedMeshNodeIds: [],
        candidates: eligible,
        matchedHints: [hint],
        unresolvedHints: [],
        reasons: [`Competing structural identities are separated by less than ambiguityMargin=${options.ambiguityMargin}.`],
      }
    }

    const selected = sameIdentity.slice(0, options.maxSelectedMeshes)
    const truncated = selected.length < sameIdentity.length
    return {
      atlasNodeId: node.id,
      status: truncated ? 'partial' : 'bound',
      selectedMeshNodeIds: selected.map((candidate) => candidate.meshNodeId),
      candidates: eligible,
      matchedHints: [hint],
      unresolvedHints: [],
      reasons: truncated
        ? [`One structural identity resolved, but selection was bounded to maxSelectedMeshes=${options.maxSelectedMeshes}.`]
        : ['Specific-fallback binding resolved one structural identity without competing ambiguity.'],
    }
  }

  return {
    atlasNodeId: node.id,
    status: 'unresolved',
    selectedMeshNodeIds: [],
    candidates: rankCandidates(rejectedCandidates),
    matchedHints: [],
    unresolvedHints: [...node.source.nodeHints],
    reasons: rejectedCandidates.length
      ? [`No reviewed source hint met minScore=${options.minScore}; later hints were still evaluated before failing closed.`]
      : ['No reviewed source hint resolved inside the explicit file/region/laterality boundaries.'],
  }
}

function selectComposite(
  node: AtlasNode,
  scopedMeshes: readonly BodyAtlasNode[],
  graph: BodyAtlasGraph,
  options: Required<AtlasMeshBindingCompilerOptions>,
): AtlasMeshBindingResult {
  const allCandidates: AtlasMeshBindingCandidate[] = []
  const selectedIds: string[] = []
  const matchedHints: string[] = []
  const unresolvedHints: string[] = []
  const ambiguousHints: string[] = []
  const reasons: string[] = []

  for (let hintIndex = 0; hintIndex < node.source.nodeHints.length; hintIndex += 1) {
    const hint = node.source.nodeHints[hintIndex]

    if (selectedIds.length >= options.maxSelectedMeshes) {
      const remaining = node.source.nodeHints.slice(hintIndex)
      unresolvedHints.push(...remaining)
      reasons.push(`Composite selection reached maxSelectedMeshes=${options.maxSelectedMeshes}; remaining components were not silently promoted.`)
      break
    }

    const ranked = rankCandidates(scopedMeshes
      .map((mesh) => scoreCandidate(node, mesh, hint, hintIndex))
      .filter((candidate): candidate is AtlasMeshBindingCandidate => Boolean(candidate)))
      .slice(0, options.maxCandidatesPerHint)
    allCandidates.push(...ranked)

    const eligible = ranked.filter((candidate) => candidate.score >= options.minScore)
    if (!eligible.length) {
      unresolvedHints.push(hint)
      continue
    }

    const { sameIdentity, ambiguous } = classifyCompetition(eligible, graph, options.ambiguityMargin)
    if (ambiguous) {
      ambiguousHints.push(hint)
      unresolvedHints.push(hint)
      reasons.push(`Composite component "${hint}" remained ambiguous.`)
      continue
    }

    matchedHints.push(hint)
    for (const candidate of sameIdentity) {
      if (!selectedIds.includes(candidate.meshNodeId)) selectedIds.push(candidate.meshNodeId)
      if (selectedIds.length >= options.maxSelectedMeshes) break
    }
  }

  const status: AtlasMeshBindingStatus = selectedIds.length === 0
    ? (ambiguousHints.length ? 'ambiguous' : 'unresolved')
    : unresolvedHints.length
      ? 'partial'
      : 'bound'

  const defaultReason = status === 'bound'
    ? 'Every composite component resolved through explicit reviewed hints.'
    : status === 'ambiguous'
      ? 'No composite component could be selected because at least one reviewed hint had competing structural identities.'
      : status === 'unresolved'
        ? `No composite component met the configured binding threshold minScore=${options.minScore}.`
        : 'Composite binding is partial because one or more reviewed components remained unresolved, ambiguous, or exceeded the selection cap.'

  return {
    atlasNodeId: node.id,
    status,
    selectedMeshNodeIds: selectedIds,
    candidates: rankCandidates(allCandidates),
    matchedHints: stableUnique(matchedHints),
    unresolvedHints: stableUnique(unresolvedHints),
    reasons: reasons.length ? reasons : [defaultReason],
  }
}

export function compileAtlasNodeMeshBinding(
  node: AtlasNode,
  graph: BodyAtlasGraph = BODY_ATLAS_GRAPH,
  options: AtlasMeshBindingCompilerOptions = {},
): AtlasMeshBindingResult {
  if (node.geometryStatus === 'reference-only' || node.geometryStatus === 'planned') {
    return {
      atlasNodeId: node.id,
      status: 'metadata-only',
      selectedMeshNodeIds: [],
      candidates: [],
      matchedHints: [],
      unresolvedHints: [],
      reasons: [`${node.geometryStatus} anatomy is not eligible for source-mesh publication.`],
    }
  }

  const resolvedOptions = optionsWithDefaults(options)
  const scopedMeshes = scopeMeshNodes(node, graph, resolvedOptions)
  if (!scopedMeshes.length) {
    return {
      atlasNodeId: node.id,
      status: 'unresolved',
      selectedMeshNodeIds: [],
      candidates: [],
      matchedHints: [],
      unresolvedHints: [...node.source.nodeHints],
      reasons: ['No source meshes remain after explicit file/region/laterality scoping.'],
    }
  }

  return node.source.mode === 'composite'
    ? selectComposite(node, scopedMeshes, graph, resolvedOptions)
    : selectSpecificFallback(node, scopedMeshes, graph, resolvedOptions)
}

export function compileAtlasMeshBindingReport(
  manifest: AtlasManifest,
  graph: BodyAtlasGraph = BODY_ATLAS_GRAPH,
  options: AtlasMeshBindingCompilerOptions = {},
): AtlasMeshBindingReport {
  const results = manifest.nodes.map((node) => compileAtlasNodeMeshBinding(node, graph, options))
  const geometryEligibleNodeCount = results.filter((result) => result.status !== 'metadata-only').length
  const boundNodeCount = results.filter((result) => result.status === 'bound').length
  const partialNodeCount = results.filter((result) => result.status === 'partial').length
  const ambiguousNodeCount = results.filter((result) => result.status === 'ambiguous').length
  const unresolvedNodeCount = results.filter((result) => result.status === 'unresolved').length
  const metadataOnlyNodeCount = results.filter((result) => result.status === 'metadata-only').length
  const selectedMeshCount = new Set(results.flatMap((result) => result.selectedMeshNodeIds)).size

  return {
    manifestId: manifest.id,
    manifestRevision: manifest.revision,
    results,
    totalNodeCount: results.length,
    geometryEligibleNodeCount,
    boundNodeCount,
    partialNodeCount,
    ambiguousNodeCount,
    unresolvedNodeCount,
    metadataOnlyNodeCount,
    selectedMeshCount,
    bindingRate: geometryEligibleNodeCount ? (boundNodeCount + partialNodeCount) / geometryEligibleNodeCount : 0,
    ambiguityRate: geometryEligibleNodeCount ? ambiguousNodeCount / geometryEligibleNodeCount : 0,
    warnings: [
      'Binding scores are deterministic engineering confidence, not anatomical or diagnostic probabilities.',
      'Ambiguous/unresolved bindings are intentionally fail-closed and must not be rendered as verified labeled anatomy.',
      'Reference-only/planned atlas nodes remain metadata-only even when similarly named source meshes exist.',
      'A successful mesh-name binding does not replace provenance, licensing, geometry QA, or qualified academic review.',
    ],
  }
}

export function auditAtlasMeshBindingCollisions(report: AtlasMeshBindingReport) {
  const atlasNodesByMesh = new Map<string, string[]>()
  for (const result of report.results) {
    if (result.status !== 'bound' && result.status !== 'partial') continue
    for (const meshNodeId of result.selectedMeshNodeIds) {
      const owners = atlasNodesByMesh.get(meshNodeId) ?? []
      owners.push(result.atlasNodeId)
      atlasNodesByMesh.set(meshNodeId, owners)
    }
  }

  return [...atlasNodesByMesh.entries()]
    .filter(([, atlasNodeIds]) => new Set(atlasNodeIds).size > 1)
    .map(([meshNodeId, atlasNodeIds]) => ({ meshNodeId, atlasNodeIds: stableUnique(atlasNodeIds).sort() }))
    .sort((a, b) => b.atlasNodeIds.length - a.atlasNodeIds.length || a.meshNodeId.localeCompare(b.meshNodeId))
}
