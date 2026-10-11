/** Search existing source labels and identifiers; never infer an ontology mapping. */
export type StructureSearchRow = readonly [id: string, name: string, laterality: string, system: string]
export interface StructureSearchMatch { id: string; name: string; system: string }
export type StructureOntology = Readonly<Record<string, { id: string; label: string }>>

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()

export function searchStructures(
  index: readonly StructureSearchRow[], query: string, ontology: StructureOntology | null = null, limit = 8,
): StructureSearchMatch[] {
  const q = normalize(query)
  if (q.length < 2 || q.length > 256 || !Number.isInteger(limit) || limit < 1 || limit > 50) return []
  const terms = q.split(/\s+/)
  const matches: Array<{ rank: number; order: number; match: StructureSearchMatch }> = []
  index.forEach(([id, name, laterality, system], order) => {
    const entry = ontology?.[id]
    const fields = [id, name, laterality, entry?.id ?? '', entry?.label ?? ''].map(normalize)
    if (!terms.every(term => fields.some(field => field.includes(term)))) return
    const rank = entry && normalize(entry.id) === q ? 0 : fields[0] === q ? 1 : fields[1] === q ? 2 : fields[1].startsWith(q) ? 3 : 4
    matches.push({ rank, order, match: { id, system, name: `${name}${laterality === 'left' ? ' (left)' : laterality === 'right' ? ' (right)' : ''}` } })
  })
  return matches.sort((a, b) => a.rank - b.rank || a.order - b.order).slice(0, limit).map(r => r.match)
}
