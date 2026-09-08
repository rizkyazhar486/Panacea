import type { AnatomyRegion, AnatomySystem, AtlasManifest, AtlasNode } from './anatomyAtlasGraph'
import { normalizeAnatomyText } from './anatomyAtlasGraph'

export interface SourceSceneNode {
  name: string
  uuid?: string
  visible?: boolean
  estimatedCostUnits?: number
}

export type AnatomyMatchKind = 'canonical-exact' | 'alias-exact' | 'hint-exact' | 'whole-phrase'

export interface AnatomySceneBinding {
  atlasNodeId: string
  sourceNodeName: string
  sourceNodeUuid?: string
  matchKind: AnatomyMatchKind
  score: number
}

export interface AnatomySceneAmbiguity {
  sourceNodeName: string
  sourceNodeUuid?: string
  atlasNodeIds: string[]
  score: number
}

export interface AnatomyCoverageSlice {
  resolvedWeight: number
  totalWeight: number
  coverage: number
}

export interface AnatomySceneCompileResult {
  bindings: AnatomySceneBinding[]
  unresolvedAtlasNodeIds: string[]
  unclaimedSourceNodes: SourceSceneNode[]
  ambiguities: AnatomySceneAmbiguity[]
  warnings: string[]
  weightedCoverage: number
  coverageBySystem: Partial<Record<AnatomySystem, AnatomyCoverageSlice>>
  coverageByRegion: Partial<Record<AnatomyRegion, AnatomyCoverageSlice>>
}

interface CandidateMatch {
  atlasNodeId: string
  matchKind: AnatomyMatchKind
  score: number
}

const SCORE: Record<AnatomyMatchKind, number> = {
  'canonical-exact': 100,
  'alias-exact': 95,
  'hint-exact': 90,
  'whole-phrase': 70,
}

function containsWholePhrase(value: string, phrase: string): boolean {
  return ` ${value} `.includes(` ${phrase} `)
}

function bestNodeMatch(sourceName: string, node: AtlasNode): CandidateMatch | null {
  const source = normalizeAnatomyText(sourceName)
  if (!source) return null
  const canonical = normalizeAnatomyText(node.canonicalName)
  if (source === canonical) return { atlasNodeId: node.id, matchKind: 'canonical-exact', score: SCORE['canonical-exact'] }

  const aliases = node.aliases.map(normalizeAnatomyText).filter(Boolean)
  if (aliases.includes(source)) return { atlasNodeId: node.id, matchKind: 'alias-exact', score: SCORE['alias-exact'] }

  const hints = node.sourceHints.map(normalizeAnatomyText).filter(Boolean)
  if (hints.includes(source)) return { atlasNodeId: node.id, matchKind: 'hint-exact', score: SCORE['hint-exact'] }

  // Fail-closed direction: the scene label may be more specific than a reviewed atlas term.
  // A generic scene label may never match merely because it is a substring of a longer atlas term.
  const phrases = [canonical, ...aliases, ...hints].filter(Boolean)
  if (phrases.some((phrase) => phrase.length >= 4 && containsWholePhrase(source, phrase))) {
    return { atlasNodeId: node.id, matchKind: 'whole-phrase', score: SCORE['whole-phrase'] }
  }
  return null
}

function sourceIdentity(source: SourceSceneNode): string {
  return `${source.uuid ?? ''}\u0000${normalizeAnatomyText(source.name)}`
}

function sliceCoverage(nodes: AtlasNode[], resolvedIds: Set<string>): AnatomyCoverageSlice {
  const totalWeight = nodes.reduce((sum, node) => sum + node.importanceWeight, 0)
  const resolvedWeight = nodes.reduce((sum, node) => sum + (resolvedIds.has(node.id) ? node.importanceWeight : 0), 0)
  return { resolvedWeight, totalWeight, coverage: totalWeight > 0 ? resolvedWeight / totalWeight : 1 }
}

export function compileAnatomyScene(manifest: AtlasManifest, sourceNodes: readonly SourceSceneNode[]): AnatomySceneCompileResult {
  const orderedSources = [...sourceNodes].sort((a, b) => sourceIdentity(a).localeCompare(sourceIdentity(b)))
  const bindings: AnatomySceneBinding[] = []
  const ambiguities: AnatomySceneAmbiguity[] = []
  const claimedSources = new Set<string>()

  for (const source of orderedSources) {
    const candidates = manifest.nodes
      .map((node) => bestNodeMatch(source.name, node))
      .filter((match): match is CandidateMatch => match !== null)
      .sort((a, b) => b.score - a.score || a.atlasNodeId.localeCompare(b.atlasNodeId))

    if (!candidates.length) continue
    const topScore = candidates[0].score
    const top = candidates.filter((candidate) => candidate.score === topScore)
    const topIds = [...new Set(top.map((candidate) => candidate.atlasNodeId))].sort()

    if (topIds.length !== 1) {
      ambiguities.push({ sourceNodeName: source.name, sourceNodeUuid: source.uuid, atlasNodeIds: topIds, score: topScore })
      continue
    }

    const selected = top[0]
    bindings.push({
      atlasNodeId: selected.atlasNodeId,
      sourceNodeName: source.name,
      sourceNodeUuid: source.uuid,
      matchKind: selected.matchKind,
      score: selected.score,
    })
    claimedSources.add(sourceIdentity(source))
  }

  bindings.sort((a, b) => a.atlasNodeId.localeCompare(b.atlasNodeId) || a.sourceNodeName.localeCompare(b.sourceNodeName) || (a.sourceNodeUuid ?? '').localeCompare(b.sourceNodeUuid ?? ''))
  ambiguities.sort((a, b) => a.sourceNodeName.localeCompare(b.sourceNodeName) || (a.sourceNodeUuid ?? '').localeCompare(b.sourceNodeUuid ?? ''))

  const resolvedIds = new Set(bindings.map((binding) => binding.atlasNodeId))
  const unresolvedAtlasNodeIds = manifest.nodes.map((node) => node.id).filter((id) => !resolvedIds.has(id)).sort()
  const unclaimedSourceNodes = orderedSources.filter((source) => !claimedSources.has(sourceIdentity(source)))
  const overall = sliceCoverage(manifest.nodes, resolvedIds)

  const coverageBySystem: Partial<Record<AnatomySystem, AnatomyCoverageSlice>> = {}
  const systems = new Set(manifest.nodes.flatMap((node) => node.systems))
  for (const system of [...systems].sort()) {
    coverageBySystem[system] = sliceCoverage(manifest.nodes.filter((node) => node.systems.includes(system)), resolvedIds)
  }

  const coverageByRegion: Partial<Record<AnatomyRegion, AnatomyCoverageSlice>> = {}
  const regions = new Set(manifest.nodes.flatMap((node) => node.regions))
  for (const region of [...regions].sort()) {
    coverageByRegion[region] = sliceCoverage(manifest.nodes.filter((node) => node.regions.includes(region)), resolvedIds)
  }

  const warnings: string[] = []
  if (ambiguities.length) warnings.push(`${ambiguities.length} source scene node(s) remained unbound because top-scoring atlas matches were ambiguous.`)
  if (unresolvedAtlasNodeIds.length) warnings.push(`${unresolvedAtlasNodeIds.length} atlas node(s) have no deterministic scene binding.`)

  return {
    bindings,
    unresolvedAtlasNodeIds,
    unclaimedSourceNodes,
    ambiguities,
    warnings,
    weightedCoverage: overall.coverage,
    coverageBySystem,
    coverageByRegion,
  }
}
