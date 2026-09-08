import type {
  AnatomyAtlasNode,
  AnatomyLaterality,
  AnatomyRegion,
  AnatomySystem,
  AtlasQueryResult,
} from './atlasTypes.ts'

export interface AtlasQueryOptions {
  system?: AnatomySystem
  region?: AnatomyRegion
  laterality?: AnatomyLaterality
}

export interface AtlasGraphValidation {
  valid: boolean
  errors: readonly string[]
}

export function normalizeAtlasTerm(value: string) {
  return value
    .normalize('NFKD')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function nonBlank(value: string) {
  return Boolean(value.trim())
}

function matchesOptions(node: AnatomyAtlasNode, options: AtlasQueryOptions) {
  if (options.system && node.system !== options.system) return false
  if (options.region && !node.regions.includes(options.region)) return false
  if (options.laterality && node.laterality !== options.laterality) return false
  return true
}

export function validateAtlasNodes(nodes: readonly AnatomyAtlasNode[]): AtlasGraphValidation {
  const errors: string[] = []
  const byId = new Map<string, AnatomyAtlasNode>()

  for (const node of nodes) {
    if (!nonBlank(node.id)) errors.push('Atlas node has a blank id.')
    if (!nonBlank(node.canonicalName)) errors.push(`Atlas node ${node.id || '<blank>'} has a blank canonical name.`)
    if (byId.has(node.id)) errors.push(`Duplicate atlas node id: ${node.id}.`)
    byId.set(node.id, node)

    if (!node.regions.length) errors.push(`Atlas node ${node.id} has no region.`)
    if (!node.provenance.length) errors.push(`Atlas node ${node.id} has no provenance record.`)
    if (node.educationalOnly !== true) errors.push(`Atlas node ${node.id} must remain educational-only.`)
    if (node.parentId === node.id) errors.push(`Atlas node ${node.id} cannot parent itself.`)

    const normalizedNames = [node.canonicalName, ...node.synonyms].map(normalizeAtlasTerm).filter(Boolean)
    if (new Set(normalizedNames).size !== normalizedNames.length) {
      errors.push(`Atlas node ${node.id} repeats a canonical name/synonym after normalization.`)
    }

    for (const binding of node.sourceBindings) {
      if (!nonBlank(binding.file)) errors.push(`Atlas node ${node.id} has a source binding without a file.`)
      if (!binding.sourceNodeHints.length || binding.sourceNodeHints.some((hint) => !nonBlank(hint))) {
        errors.push(`Atlas node ${node.id} has an empty source-node hint.`)
      }
    }

    for (const provenance of node.provenance) {
      if (!nonBlank(provenance.sourceId) || !nonBlank(provenance.sourceVersion) || !nonBlank(provenance.sourceLocator)) {
        errors.push(`Atlas node ${node.id} has incomplete provenance.`)
      }
      if (provenance.academicReview === 'recorded' && node.reviewStatus !== 'anatomist-reviewed') {
        errors.push(`Atlas node ${node.id} records academic review without anatomist-reviewed node status.`)
      }
    }
  }

  for (const node of nodes) {
    if (node.parentId && !byId.has(node.parentId)) errors.push(`Atlas node ${node.id} references missing parent ${node.parentId}.`)
    for (const relation of node.relations ?? []) {
      if (!byId.has(relation.targetId)) errors.push(`Atlas node ${node.id} references missing relation target ${relation.targetId}.`)
    }
  }

  const state = new Map<string, 0 | 1 | 2>()
  const visit = (id: string, trail: string[]) => {
    const current = state.get(id) ?? 0
    if (current === 2) return
    if (current === 1) {
      errors.push(`Atlas parent cycle detected: ${[...trail, id].join(' -> ')}.`)
      return
    }
    state.set(id, 1)
    const parentId = byId.get(id)?.parentId
    if (parentId && byId.has(parentId)) visit(parentId, [...trail, id])
    state.set(id, 2)
  }
  for (const node of nodes) visit(node.id, [])

  return { valid: errors.length === 0, errors: [...new Set(errors)] }
}

export class AtlasGraph {
  private readonly byId: ReadonlyMap<string, AnatomyAtlasNode>
  private readonly childrenByParent: ReadonlyMap<string, readonly AnatomyAtlasNode[]>
  private readonly termIndex: ReadonlyMap<string, readonly AnatomyAtlasNode[]>

  constructor(readonly nodes: readonly AnatomyAtlasNode[]) {
    const validation = validateAtlasNodes(nodes)
    if (!validation.valid) throw new Error(`Invalid anatomy atlas graph:\n${validation.errors.join('\n')}`)

    const byId = new Map(nodes.map((node) => [node.id, node] as const))
    const children = new Map<string, AnatomyAtlasNode[]>()
    const terms = new Map<string, AnatomyAtlasNode[]>()

    const addTerm = (term: string, node: AnatomyAtlasNode) => {
      const key = normalizeAtlasTerm(term)
      if (!key) return
      const bucket = terms.get(key) ?? []
      if (!bucket.some((candidate) => candidate.id === node.id)) bucket.push(node)
      terms.set(key, bucket)
    }

    for (const node of nodes) {
      if (node.parentId) {
        const bucket = children.get(node.parentId) ?? []
        bucket.push(node)
        children.set(node.parentId, bucket)
      }
      addTerm(node.canonicalName, node)
      for (const synonym of node.synonyms) addTerm(synonym, node)
    }

    for (const bucket of children.values()) bucket.sort((a, b) => a.id.localeCompare(b.id))
    for (const bucket of terms.values()) bucket.sort((a, b) => a.id.localeCompare(b.id))
    this.byId = byId
    this.childrenByParent = children
    this.termIndex = terms
  }

  get(id: string) {
    return this.byId.get(id)
  }

  childrenOf(id: string) {
    return this.childrenByParent.get(id) ?? []
  }

  ancestorsOf(id: string) {
    const ancestors: AnatomyAtlasNode[] = []
    let current = this.byId.get(id)
    while (current?.parentId) {
      const parent = this.byId.get(current.parentId)
      if (!parent) break
      ancestors.push(parent)
      current = parent
    }
    return ancestors
  }

  descendantsOf(id: string) {
    const descendants: AnatomyAtlasNode[] = []
    const queue = [...this.childrenOf(id)]
    while (queue.length) {
      const node = queue.shift()!
      descendants.push(node)
      queue.push(...this.childrenOf(node.id))
    }
    return descendants
  }

  nodesForSystem(system: AnatomySystem) {
    return this.nodes.filter((node) => node.system === system)
  }

  nodesForRegion(region: AnatomyRegion) {
    return this.nodes.filter((node) => node.regions.includes(region))
  }

  resolve(rawQuery: string, options: AtlasQueryOptions = {}): AtlasQueryResult {
    const query = rawQuery.trim()
    if (!query) return { status: 'unresolved' }

    const exactId = this.byId.get(query)
    if (exactId && matchesOptions(exactId, options)) return { status: 'resolved', node: exactId, matchedBy: 'id' }

    const normalized = normalizeAtlasTerm(query)
    const candidates = (this.termIndex.get(normalized) ?? []).filter((node) => matchesOptions(node, options))
    if (!candidates.length) return { status: 'unresolved' }
    if (candidates.length > 1) return { status: 'ambiguous', candidates }

    const node = candidates[0]
    const matchedBy = normalizeAtlasTerm(node.canonicalName) === normalized ? 'canonical' : 'synonym'
    return { status: 'resolved', node, matchedBy }
  }
}
