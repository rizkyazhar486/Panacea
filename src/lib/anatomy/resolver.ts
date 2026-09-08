import type { AnatomyResolveContext, AnatomyResolution, AnatomyResolvedCandidate, AnatomyStructure } from './types'

export const normalizeAnatomyText = (value: string) => value
  .normalize('NFKD')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .replace(/\s+/g, ' ')

const uniqueById = (values: readonly AnatomyResolvedCandidate[]) => {
  const map = new Map<string, AnatomyResolvedCandidate>()
  for (const value of values) {
    const current = map.get(value.structure.id)
    if (!current || value.score > current.score) map.set(value.structure.id, value)
  }
  return [...map.values()]
}

export class AnatomyResolver {
  private readonly structures: readonly AnatomyStructure[]
  constructor(structures: readonly AnatomyStructure[]) { this.structures = structures }

  resolve(query: string, context: AnatomyResolveContext = {}): AnatomyResolution {
    const normalizedQuery = normalizeAnatomyText(query)
    if (!normalizedQuery) return { query, normalizedQuery, status: 'not-found', candidates: [], reason: 'Empty anatomy query.' }
    const candidates: AnatomyResolvedCandidate[] = []
    for (const structure of this.structures) {
      let candidate: AnatomyResolvedCandidate | null = null
      if (normalizeAnatomyText(structure.id) === normalizedQuery) candidate = { structure, score: 1, reason: 'canonical-id' }
      else if (normalizeAnatomyText(structure.label) === normalizedQuery) candidate = { structure, score: 0.99, reason: 'exact-label' }
      else if (structure.synonyms.some((synonym) => normalizeAnatomyText(synonym) === normalizedQuery)) candidate = { structure, score: 0.96, reason: 'exact-synonym' }
      if (!candidate) continue
      let score = candidate.score
      if (context.system) score += structure.system === context.system ? 0.03 : -0.15
      if (context.region) score += structure.regions.includes(context.region) ? 0.02 : -0.1
      if (context.laterality) score += structure.laterality === context.laterality ? 0.04 : structure.laterality === 'midline' || structure.laterality === 'none' ? -0.04 : -0.2
      if (score <= 0) continue
      candidates.push({ ...candidate, score: Math.min(1, score) })
    }
    const ranked = uniqueById(candidates)
      .sort((a, b) => b.score - a.score || a.structure.id.localeCompare(b.structure.id))
      .slice(0, Math.max(1, context.limit ?? 24))
    if (!ranked.length) return { query, normalizedQuery, status: 'not-found', candidates: [], reason: 'No exact canonical label or reviewed alias matched.' }
    if ((context.mode ?? 'single') === 'composite') return { query, normalizedQuery, status: 'resolved', candidates: ranked, reason: `Composite resolution returned ${ranked.length} deterministic match(es).` }
    const best = ranked[0]
    const tied = ranked.filter((candidate) => Math.abs(candidate.score - best.score) < 0.000001)
    if (tied.length > 1) return { query, normalizedQuery, status: 'ambiguous', candidates: tied, reason: 'Multiple equally specific anatomy structures matched; single resolution failed closed.' }
    return { query, normalizedQuery, status: 'resolved', candidates: [best], reason: `Resolved by ${best.reason}.` }
  }

  resolveMany(queries: readonly string[], context: AnatomyResolveContext = {}) {
    return queries.map((query) => this.resolve(query, context))
  }
}
