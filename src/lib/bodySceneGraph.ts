export type BodySceneNodeKind =
  | 'environment'
  | 'anatomy'
  | 'tissue'
  | 'cell'
  | 'organelle'
  | 'molecule'
  | 'overlay'
  | 'label'
  | 'interaction'
  | 'camera-target'
  | 'hud'

export interface BodySceneTransform {
  position: readonly [number, number, number]
  rotation: readonly [number, number, number]
  scale: readonly [number, number, number]
}

export interface BodySceneMaterial {
  opacity: number
  emissive: number
  roughness: number
  metalness: number
  wireframe: boolean
  depthWrite: boolean
}

export interface BodySceneNode {
  id: string
  label: string
  kind: BodySceneNodeKind
  parentId?: string
  sourceRef?: string
  tags: readonly string[]
  visible: boolean
  selectable: boolean
  locked: boolean
  transform: BodySceneTransform
  material: BodySceneMaterial
  children: readonly string[]
}

export interface BodySceneGraph {
  rootIds: readonly string[]
  nodes: ReadonlyMap<string, BodySceneNode>
  version: number
}

const identityTransform: BodySceneTransform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
}

const defaultMaterial: BodySceneMaterial = {
  opacity: 1,
  emissive: 0,
  roughness: .72,
  metalness: 0,
  wireframe: false,
  depthWrite: true,
}

export function bodySceneNode(input: Partial<BodySceneNode> & Pick<BodySceneNode, 'id' | 'label' | 'kind'>): BodySceneNode {
  return {
    id: input.id,
    label: input.label,
    kind: input.kind,
    parentId: input.parentId,
    sourceRef: input.sourceRef,
    tags: input.tags ?? [],
    visible: input.visible ?? true,
    selectable: input.selectable ?? true,
    locked: input.locked ?? false,
    transform: input.transform ?? identityTransform,
    material: input.material ?? defaultMaterial,
    children: input.children ?? [],
  }
}

export function createBodySceneGraph(nodes: readonly BodySceneNode[], version = 1): BodySceneGraph {
  const map = new Map<string, BodySceneNode>()
  for (const node of nodes) {
    if (map.has(node.id)) throw new Error(`Duplicate Body Scene node id: ${node.id}`)
    map.set(node.id, node)
  }

  const withChildren = new Map<string, BodySceneNode>()
  for (const node of map.values()) {
    const children = [...map.values()].filter((candidate) => candidate.parentId === node.id).map((candidate) => candidate.id)
    withChildren.set(node.id, { ...node, children })
  }

  const rootIds = [...withChildren.values()].filter((node) => !node.parentId).map((node) => node.id)
  return { rootIds, nodes: withChildren, version }
}

export function sceneNode(graph: BodySceneGraph, id: string) {
  return graph.nodes.get(id)
}

export function sceneChildren(graph: BodySceneGraph, id: string) {
  const node = graph.nodes.get(id)
  if (!node) return []
  return node.children.map((childId) => graph.nodes.get(childId)).filter((value): value is BodySceneNode => Boolean(value))
}

export function sceneAncestors(graph: BodySceneGraph, id: string) {
  const result: BodySceneNode[] = []
  let current = graph.nodes.get(id)
  const guard = new Set<string>()
  while (current?.parentId) {
    if (guard.has(current.parentId)) break
    guard.add(current.parentId)
    const parent = graph.nodes.get(current.parentId)
    if (!parent) break
    result.push(parent)
    current = parent
  }
  return result
}

export function sceneDescendants(graph: BodySceneGraph, id: string) {
  const result: BodySceneNode[] = []
  const queue = [...sceneChildren(graph, id)]
  const visited = new Set<string>()
  while (queue.length) {
    const current = queue.shift()!
    if (visited.has(current.id)) continue
    visited.add(current.id)
    result.push(current)
    queue.push(...sceneChildren(graph, current.id))
  }
  return result
}

export function sceneByTag(graph: BodySceneGraph, tag: string) {
  const normalized = tag.trim().toLowerCase()
  return [...graph.nodes.values()].filter((node) => node.tags.some((candidate) => candidate.toLowerCase() === normalized))
}

export function sceneByKind(graph: BodySceneGraph, kind: BodySceneNodeKind) {
  return [...graph.nodes.values()].filter((node) => node.kind === kind)
}

export function mapBodyScene(
  graph: BodySceneGraph,
  predicate: (node: BodySceneNode) => boolean,
  update: (node: BodySceneNode) => BodySceneNode,
) {
  const next = new Map<string, BodySceneNode>()
  for (const [id, node] of graph.nodes) next.set(id, predicate(node) ? update(node) : node)
  return { ...graph, nodes: next, version: graph.version + 1 }
}

export function setSceneVisibility(graph: BodySceneGraph, ids: readonly string[], visible: boolean) {
  const set = new Set(ids)
  return mapBodyScene(graph, (node) => set.has(node.id), (node) => ({ ...node, visible }))
}

export function isolateSceneNodes(graph: BodySceneGraph, ids: readonly string[], contextOpacity = .12) {
  const selected = new Set(ids)
  return mapBodyScene(
    graph,
    (node) => node.kind !== 'environment' && node.kind !== 'hud',
    (node) => selected.has(node.id)
      ? { ...node, visible: true, material: { ...node.material, opacity: 1, emissive: Math.max(node.material.emissive, .18) } }
      : { ...node, visible: true, material: { ...node.material, opacity: contextOpacity, emissive: 0, depthWrite: false } },
  )
}

export function restoreSceneMaterials(graph: BodySceneGraph) {
  return mapBodyScene(
    graph,
    (node) => node.kind !== 'environment' && node.kind !== 'hud',
    (node) => ({ ...node, material: defaultMaterial }),
  )
}

export function explodeSceneChildren(graph: BodySceneGraph, parentId: string, distance = 1) {
  const children = sceneChildren(graph, parentId)
  const positions = new Map<string, BodySceneTransform>()
  const total = Math.max(children.length, 1)

  children.forEach((child, index) => {
    const angle = (index / total) * Math.PI * 2
    const vertical = (index - (total - 1) / 2) * distance * .16
    positions.set(child.id, {
      ...child.transform,
      position: [Math.cos(angle) * distance, vertical, Math.sin(angle) * distance],
    })
  })

  return mapBodyScene(graph, (node) => positions.has(node.id), (node) => ({ ...node, transform: positions.get(node.id)! }))
}

export function sceneGraphStats(graph: BodySceneGraph) {
  const nodes = [...graph.nodes.values()]
  return {
    version: graph.version,
    nodes: nodes.length,
    roots: graph.rootIds.length,
    visible: nodes.filter((node) => node.visible).length,
    selectable: nodes.filter((node) => node.selectable).length,
    sourceBacked: nodes.filter((node) => Boolean(node.sourceRef)).length,
    byKind: Object.fromEntries([...new Set(nodes.map((node) => node.kind))].map((kind) => [kind, nodes.filter((node) => node.kind === kind).length])),
  }
}

export function validateSceneGraph(graph: BodySceneGraph) {
  const errors: string[] = []
  for (const node of graph.nodes.values()) {
    if (node.parentId && !graph.nodes.has(node.parentId)) errors.push(`${node.id}: missing parent ${node.parentId}`)
    for (const childId of node.children) {
      const child = graph.nodes.get(childId)
      if (!child) errors.push(`${node.id}: missing child ${childId}`)
      else if (child.parentId !== node.id) errors.push(`${node.id}: child ${childId} parent mismatch`)
    }
  }
  return { valid: errors.length === 0, errors }
}
