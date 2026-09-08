import type { AnatomyRelation, AnatomyRelationType, AnatomyStructure, AtlasValidationIssue, AtlasValidationReport } from './types'

export type AnatomyGraphEdgeType = AnatomyRelationType | 'parent' | 'child'

export interface AnatomyGraphPathEdge {
  from: string
  to: string
  type: AnatomyGraphEdgeType
  weight: number
  note?: string
}

export interface AnatomyGraphPath {
  nodeIds: readonly string[]
  edges: readonly AnatomyGraphPathEdge[]
  totalWeight: number
}

export interface AnatomyPathOptions {
  allowedTypes?: readonly AnatomyGraphEdgeType[]
  maxWeight?: number
  maxHops?: number
}

const RELATION_WEIGHT: Record<AnatomyRelationType, number> = {
  'part-of': 0.6,
  'contains': 0.6,
  'branches-to': 0.7,
  'drains-to': 0.7,
  'communicates-with': 0.8,
  'courses-through': 0.9,
  'supplies': 1,
  'innervates': 1,
  'articulates-with': 1,
  'attached-to': 1.1,
  'adjacent-to': 1.5,
}

export class AnatomyGraph {
  readonly structures: readonly AnatomyStructure[]
  readonly relations: readonly AnatomyRelation[]
  private readonly byId = new Map<string, AnatomyStructure>()
  private readonly children = new Map<string, string[]>()
  private readonly relationIndex = new Map<string, AnatomyRelation[]>()

  constructor(structures: readonly AnatomyStructure[], relations: readonly AnatomyRelation[] = []) {
    this.structures = structures
    this.relations = relations
    for (const structure of structures) {
      if (!this.byId.has(structure.id)) this.byId.set(structure.id, structure)
      if (structure.parentId) {
        const list = this.children.get(structure.parentId) ?? []
        list.push(structure.id)
        this.children.set(structure.parentId, list)
      }
    }
    for (const relation of relations) {
      this.indexRelation(relation.from, relation)
      if (relation.bidirectional) this.indexRelation(relation.to, { ...relation, from: relation.to, to: relation.from })
    }
    for (const list of this.children.values()) list.sort()
  }

  private indexRelation(id: string, relation: AnatomyRelation) {
    const list = this.relationIndex.get(id) ?? []
    list.push(relation)
    this.relationIndex.set(id, list)
  }

  get(id: string) { return this.byId.get(id) }

  ancestors(id: string): readonly AnatomyStructure[] {
    const result: AnatomyStructure[] = []
    const seen = new Set<string>([id])
    let current = this.get(id)
    while (current?.parentId) {
      if (seen.has(current.parentId)) break
      seen.add(current.parentId)
      const parent = this.get(current.parentId)
      if (!parent) break
      result.push(parent)
      current = parent
    }
    return result
  }

  descendants(id: string): readonly AnatomyStructure[] {
    const result: AnatomyStructure[] = []
    const seen = new Set<string>([id])
    const queue = [...(this.children.get(id) ?? [])]
    while (queue.length) {
      const nextId = queue.shift()!
      if (seen.has(nextId)) continue
      seen.add(nextId)
      const node = this.get(nextId)
      if (!node) continue
      result.push(node)
      queue.push(...(this.children.get(nextId) ?? []))
    }
    return result
  }

  neighbors(id: string, types?: readonly AnatomyRelationType[]): readonly AnatomyStructure[] {
    const allowed = types ? new Set(types) : null
    const ids = new Set<string>()
    const node = this.get(id)
    if ((!allowed || allowed.has('part-of')) && node?.parentId) ids.add(node.parentId)
    if (!allowed || allowed.has('contains')) {
      for (const child of this.children.get(id) ?? []) ids.add(child)
    }
    for (const relation of this.relationIndex.get(id) ?? []) {
      if (!allowed || allowed.has(relation.type)) ids.add(relation.to)
    }
    return [...ids].sort().map((targetId) => this.get(targetId)).filter((value): value is AnatomyStructure => Boolean(value))
  }

  private pathEdgesFrom(id: string): readonly AnatomyGraphPathEdge[] {
    const edges: AnatomyGraphPathEdge[] = []
    const node = this.get(id)
    if (node?.parentId && this.byId.has(node.parentId)) {
      edges.push({ from: id, to: node.parentId, type: 'parent', weight: 0.5 })
    }
    for (const childId of this.children.get(id) ?? []) {
      edges.push({ from: id, to: childId, type: 'child', weight: 0.5 })
    }
    for (const relation of this.relationIndex.get(id) ?? []) {
      edges.push({
        from: relation.from,
        to: relation.to,
        type: relation.type,
        weight: RELATION_WEIGHT[relation.type],
        note: relation.note,
      })
    }
    return edges.sort((a, b) => a.weight - b.weight || a.to.localeCompare(b.to) || a.type.localeCompare(b.type))
  }

  /**
   * Dijkstra traversal over explicit atlas hierarchy + typed relations.
   * The graph never invents missing anatomy; if no recorded path exists this
   * returns null rather than falling back to substring or spatial guessing.
   */
  tracePath(fromId: string, toId: string, options: AnatomyPathOptions = {}): AnatomyGraphPath | null {
    if (!this.byId.has(fromId) || !this.byId.has(toId)) return null
    if (fromId === toId) return { nodeIds: [fromId], edges: [], totalWeight: 0 }

    const allowed = options.allowedTypes?.length ? new Set(options.allowedTypes) : null
    const maxWeight = options.maxWeight ?? Number.POSITIVE_INFINITY
    const maxHops = Math.max(1, options.maxHops ?? 128)
    const distances = new Map<string, number>([[fromId, 0]])
    const hops = new Map<string, number>([[fromId, 0]])
    const previous = new Map<string, AnatomyGraphPathEdge>()
    const unvisited = new Set(this.byId.keys())

    while (unvisited.size) {
      let current: string | undefined
      let bestDistance = Number.POSITIVE_INFINITY
      for (const candidate of unvisited) {
        const distance = distances.get(candidate) ?? Number.POSITIVE_INFINITY
        if (distance < bestDistance || (distance === bestDistance && current !== undefined && candidate < current)) {
          current = candidate
          bestDistance = distance
        }
      }
      if (!current || !Number.isFinite(bestDistance) || bestDistance > maxWeight) break
      unvisited.delete(current)
      if (current === toId) break

      const currentHops = hops.get(current) ?? 0
      if (currentHops >= maxHops) continue
      for (const edge of this.pathEdgesFrom(current)) {
        if (allowed && !allowed.has(edge.type)) continue
        if (!unvisited.has(edge.to)) continue
        const nextDistance = bestDistance + edge.weight
        const nextHops = currentHops + 1
        if (nextDistance > maxWeight || nextHops > maxHops) continue
        const existingDistance = distances.get(edge.to) ?? Number.POSITIVE_INFINITY
        const existingHops = hops.get(edge.to) ?? Number.POSITIVE_INFINITY
        if (nextDistance < existingDistance || (nextDistance === existingDistance && nextHops < existingHops)) {
          distances.set(edge.to, nextDistance)
          hops.set(edge.to, nextHops)
          previous.set(edge.to, edge)
        }
      }
    }

    if (!previous.has(toId)) return null
    const reversed: AnatomyGraphPathEdge[] = []
    let cursor = toId
    while (cursor !== fromId) {
      const edge = previous.get(cursor)
      if (!edge) return null
      reversed.push(edge)
      cursor = edge.from
    }
    const edges = reversed.reverse()
    return {
      nodeIds: [fromId, ...edges.map((edge) => edge.to)],
      edges,
      totalWeight: edges.reduce((sum, edge) => sum + edge.weight, 0),
    }
  }

  validate(): AtlasValidationReport {
    const issues: AtlasValidationIssue[] = []
    const ids = new Set<string>()
    for (const structure of this.structures) {
      if (ids.has(structure.id)) issues.push({ code: 'duplicate-structure-id', message: `Duplicate structure id: ${structure.id}`, structureId: structure.id })
      ids.add(structure.id)
      if (structure.parentId && !this.byId.has(structure.parentId)) issues.push({ code: 'missing-parent', message: `Missing parent ${structure.parentId}`, structureId: structure.id })
    }
    for (const relation of this.relations) {
      if (!this.byId.has(relation.from) || !this.byId.has(relation.to)) issues.push({ code: 'broken-relation', message: `Broken relation ${relation.from} -> ${relation.to}` })
    }
    const visiting = new Set<string>()
    const visited = new Set<string>()
    const visit = (id: string) => {
      if (visiting.has(id)) {
        issues.push({ code: 'parent-cycle', message: `Parent cycle detected at ${id}`, structureId: id })
        return
      }
      if (visited.has(id)) return
      visiting.add(id)
      const parent = this.get(id)?.parentId
      if (parent && this.byId.has(parent)) visit(parent)
      visiting.delete(id)
      visited.add(id)
    }
    for (const id of ids) visit(id)
    return { valid: issues.length === 0, issues }
  }
}
