import {
  buildHighEndAtlasOntology,
  indexHighEndAtlasOntology,
  type HighEndAtlasStructure,
  type HighEndAtlasSystemKey,
} from './highEndAtlasOntology'
import { HIGH_END_RESPIRATORY_ATLAS_NODES } from './highEndRespiratoryAtlas'
import type { AtlasRegionKey } from '../wholeBodyAtlasBlueprint'

export const HIGH_END_ATLAS_ONTOLOGY: readonly HighEndAtlasStructure[] = buildHighEndAtlasOntology(HIGH_END_RESPIRATORY_ATLAS_NODES)
export const HIGH_END_ATLAS_INDEX = indexHighEndAtlasOntology(HIGH_END_ATLAS_ONTOLOGY)

function normalizeQuery(value: string) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

export function highEndAtlasPathToRoot(structureId: string) {
  const path: HighEndAtlasStructure[] = []
  const seen = new Set<string>()
  let current = HIGH_END_ATLAS_INDEX.get(structureId)
  while (current) {
    if (seen.has(current.id)) break
    seen.add(current.id)
    path.push(current)
    current = current.parentId ? HIGH_END_ATLAS_INDEX.get(current.parentId) : undefined
  }
  return path
}

export function searchHighEndAtlas(query: string, limit = 24) {
  const needle = normalizeQuery(query)
  if (!needle) return []
  const tokens = needle.split(' ').filter(Boolean)

  return HIGH_END_ATLAS_ONTOLOGY
    .map((node) => {
      const label = normalizeQuery(node.label)
      const aliases = node.aliases.map(normalizeQuery)
      const hints = node.sourceNodeHints.map(normalizeQuery)
      const haystack = [label, ...aliases, ...hints, normalizeQuery(node.id), ...node.tags.map(normalizeQuery)]
      const exact = haystack.some((value) => value === needle)
      const starts = haystack.some((value) => value.startsWith(needle))
      const tokenHits = tokens.filter((token) => haystack.some((value) => value.split(' ').includes(token))).length
      const contained = haystack.some((value) => value.includes(needle))
      const score = exact ? 100 : starts ? 70 : contained ? 50 : tokenHits * 12
      return { node, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score
      || b.node.clinicalImportance - a.node.clinicalImportance
      || a.node.label.localeCompare(b.node.label))
    .slice(0, Math.max(0, Math.floor(limit)))
    .map((entry) => entry.node)
}

export function highEndAtlasBySystem(system: HighEndAtlasSystemKey) {
  return HIGH_END_ATLAS_ONTOLOGY.filter((node) => node.system === system)
}

export function highEndAtlasByRegion(region: AtlasRegionKey) {
  return HIGH_END_ATLAS_ONTOLOGY.filter((node) => node.region === region)
}

export function highEndAtlasCoverage() {
  const systems = new Set(HIGH_END_ATLAS_ONTOLOGY.map((node) => node.system))
  const regions = new Set(HIGH_END_ATLAS_ONTOLOGY.map((node) => node.region).filter((region) => region !== 'whole-body'))
  const geometry = { native: 0, adjacent: 0, missing: 0 }
  let academicallyReviewed = 0

  for (const node of HIGH_END_ATLAS_ONTOLOGY) {
    if (node.geometryProvenance === 'native-geometry') geometry.native += 1
    else if (node.geometryProvenance === 'adjacent-geometry') geometry.adjacent += 1
    else geometry.missing += 1
    if (node.reviewStatus === 'recorded') academicallyReviewed += 1
  }

  return {
    structures: HIGH_END_ATLAS_ONTOLOGY.length,
    systems: systems.size,
    regions: regions.size,
    respiratoryStructures: highEndAtlasBySystem('respiratory').length,
    geometry,
    academicallyReviewed,
    reviewPending: HIGH_END_ATLAS_ONTOLOGY.length - academicallyReviewed,
  }
}
