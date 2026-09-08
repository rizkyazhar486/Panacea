import type { AnatomyRelation, AnatomyRelationType, AnatomyStructure, AtlasValidationIssue, AtlasValidationReport } from './types'

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
