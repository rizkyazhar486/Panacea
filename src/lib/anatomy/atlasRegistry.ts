import {
  anatomySourceNameMatchesHint,
  getEffectiveAnatomySourceNodeSnapshot,
  resolveAllAnatomySourceNodes,
  type AnatomySourceNodeBundle,
} from '../anatomySourceNodeRegistry.ts'
import { ANATOMY_SYSTEMS, type AnatomyAtlasNode } from './atlasTypes.ts'
import { AtlasGraph } from './atlasGraph.ts'
import { RESPIRATORY_ATLAS_NODES } from './respiratoryAtlas.ts'
import { WHOLE_BODY_ATLAS_NODES } from './wholeBodyAtlas.ts'

export const PANACEA_ATLAS_NODES: readonly AnatomyAtlasNode[] = [
  ...WHOLE_BODY_ATLAS_NODES,
  ...RESPIRATORY_ATLAS_NODES,
]

export const PANACEA_ANATOMY_ATLAS = new AtlasGraph(PANACEA_ATLAS_NODES)

export interface AtlasSourceBindingCoverage {
  file: string
  bindingStatus: AnatomyAtlasNode['sourceBindings'][number]['status']
  meshMode: AnatomyAtlasNode['sourceBindings'][number]['meshMode']
  requestedHints: readonly string[]
  matchedNames: readonly string[]
  unresolvedHints: readonly string[]
  coverageRatio: number
}

export function resolveAtlasSourceCoverage(
  nodeId: string,
  sourceBundles: readonly AnatomySourceNodeBundle[] = getEffectiveAnatomySourceNodeSnapshot(),
): readonly AtlasSourceBindingCoverage[] {
  const node = PANACEA_ANATOMY_ATLAS.get(nodeId)
  if (!node) return []

  return node.sourceBindings.map((binding) => {
    const bundlesForFile = sourceBundles.filter((bundle) => bundle.file === binding.file)
    const matches = resolveAllAnatomySourceNodes(binding.sourceNodeHints, bundlesForFile, 64)
    const matchedNames = [...new Set(matches.flatMap((match) => match.names))].sort((a, b) => a.localeCompare(b))
    const unresolvedHints = binding.sourceNodeHints.filter((hint) => !bundlesForFile.some((bundle) =>
      bundle.names.some((name) => anatomySourceNameMatchesHint(name, hint)),
    ))
    const coverageRatio = binding.sourceNodeHints.length
      ? (binding.sourceNodeHints.length - unresolvedHints.length) / binding.sourceNodeHints.length
      : 0

    return {
      file: binding.file,
      bindingStatus: binding.status,
      meshMode: binding.meshMode,
      requestedHints: binding.sourceNodeHints,
      matchedNames,
      unresolvedHints,
      coverageRatio,
    }
  })
}

export interface AtlasCoverageSummary {
  totalNodes: number
  structuralDraftNodes: number
  sourceCheckedNodes: number
  anatomistReviewedNodes: number
  systemsRepresented: number
  regionCount: number
  scaleCounts: Readonly<Record<AnatomyAtlasNode['scale'], number>>
}

export function summarizeAtlasCoverage(): AtlasCoverageSummary {
  const regions = new Set(PANACEA_ATLAS_NODES.flatMap((node) => node.regions))
  const systems = new Set(PANACEA_ATLAS_NODES.map((node) => node.system))
  const scaleCounts: Record<AnatomyAtlasNode['scale'], number> = {
    'whole-body': 0,
    regional: 0,
    organ: 0,
    substructure: 0,
    micro: 0,
  }
  for (const node of PANACEA_ATLAS_NODES) scaleCounts[node.scale] += 1

  return {
    totalNodes: PANACEA_ATLAS_NODES.length,
    structuralDraftNodes: PANACEA_ATLAS_NODES.filter((node) => node.reviewStatus === 'structural-draft').length,
    sourceCheckedNodes: PANACEA_ATLAS_NODES.filter((node) => node.reviewStatus === 'source-checked').length,
    anatomistReviewedNodes: PANACEA_ATLAS_NODES.filter((node) => node.reviewStatus === 'anatomist-reviewed').length,
    systemsRepresented: systems.size,
    regionCount: regions.size,
    scaleCounts,
  }
}

export function missingAtlasSystems() {
  const represented = new Set(PANACEA_ATLAS_NODES.map((node) => node.system))
  return ANATOMY_SYSTEMS.filter((system) => !represented.has(system))
}
