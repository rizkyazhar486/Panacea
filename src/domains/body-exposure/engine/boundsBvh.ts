// BVH objek-tingkat untuk kotak batas (AABB) struktur anatomi. Murni dan deterministik:
// tanpa waktu/acak/DOM. Hanya mempercepat PEMILIHAN semantik (struktur mana yang dikenai
// sinar/kotak/titik) pada ribuan simpul atlas; BVH tingkat segitiga tetap urusan renderer.
// Struktur tanpa batas terdaftar tidak diberi batas karangan: pemanggil menyaringnya.

export type BvhVec3 = readonly [number, number, number]

export interface BvhItem {
  id: string
  min: BvhVec3
  max: BvhVec3
}

export interface BvhRayHit<T extends BvhItem> {
  item: T
  /** Jarak (satuan dunia) sinar mulai menembus kotak; 0 bila asal sinar di dalam. */
  distance: number
  exitDistance: number
}

export interface BvhStats {
  items: number
  treeNodes: number
  leafNodes: number
  maxDepth: number
  maxLeafSize: number
}

interface Node<T extends BvhItem> {
  min: BvhVec3
  max: BvhVec3
  depth: number
  left?: Node<T>
  right?: Node<T>
  items?: readonly T[]
}

const AXES = [0, 1, 2] as const
const PARALLEL_EPS = 1e-12

function finite3(v: BvhVec3) {
  return v.length === 3 && v.every((n) => Number.isFinite(n))
}

function assertBox(min: BvhVec3, max: BvhVec3, label: string) {
  if (!finite3(min) || !finite3(max)) throw new RangeError(`${label} must have finite min/max`)
  for (const a of AXES) if (min[a] > max[a]) throw new RangeError(`${label} has min greater than max on axis ${a}`)
}

function union(items: readonly BvhItem[]): { min: BvhVec3; max: BvhVec3 } {
  const min: [number, number, number] = [Infinity, Infinity, Infinity]
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity]
  for (const it of items) {
    for (const a of AXES) {
      if (it.min[a] < min[a]) min[a] = it.min[a]
      if (it.max[a] > max[a]) max[a] = it.max[a]
    }
  }
  return { min, max }
}

function boxesIntersect(aMin: BvhVec3, aMax: BvhVec3, bMin: BvhVec3, bMax: BvhVec3) {
  // Tepi bersentuhan dihitung beririsan (inklusif).
  return AXES.every((a) => aMin[a] <= bMax[a] && aMax[a] >= bMin[a])
}

function distanceToBox(p: BvhVec3, min: BvhVec3, max: BvhVec3) {
  let sq = 0
  for (const a of AXES) {
    const d = p[a] < min[a] ? min[a] - p[a] : p[a] > max[a] ? p[a] - max[a] : 0
    sq += d * d
  }
  return Math.sqrt(sq)
}

/** Interval sinar (arah SUDAH ternormalisasi) terhadap kotak; undefined bila meleset. */
function rayInterval(origin: BvhVec3, dir: BvhVec3, min: BvhVec3, max: BvhVec3, maxDistance: number) {
  let tMin = 0
  let tMax = maxDistance
  for (const a of AXES) {
    if (Math.abs(dir[a]) < PARALLEL_EPS) {
      if (origin[a] < min[a] || origin[a] > max[a]) return undefined
      continue
    }
    const inv = 1 / dir[a]
    let near = (min[a] - origin[a]) * inv
    let far = (max[a] - origin[a]) * inv
    if (near > far) [near, far] = [far, near]
    if (near > tMin) tMin = near
    if (far < tMax) tMax = far
    if (tMin > tMax) return undefined
  }
  return { entry: tMin, exit: tMax }
}

function build<T extends BvhItem>(items: readonly T[], maxLeafSize: number, depth: number): Node<T> {
  const { min, max } = union(items)
  if (items.length <= maxLeafSize) return { min, max, depth, items: [...items] }
  let axis = 0
  for (const a of AXES) if (max[a] - min[a] > max[axis] - min[axis]) axis = a
  const centre = (i: BvhItem) => i.min[axis] + i.max[axis]
  const sorted = [...items].sort((x, y) => centre(x) - centre(y) || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0))
  const mid = Math.floor(sorted.length / 2)
  return { min, max, depth, left: build(sorted.slice(0, mid), maxLeafSize, depth + 1), right: build(sorted.slice(mid), maxLeafSize, depth + 1) }
}

const byId = (a: BvhItem, b: BvhItem) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)

export class BoundsBvh<T extends BvhItem> {
  private readonly root?: Node<T>
  readonly stats: BvhStats

  constructor(items: readonly T[], maxLeafSize = 8) {
    if (!Number.isInteger(maxLeafSize) || maxLeafSize < 1) throw new RangeError('maxLeafSize must be a positive integer')
    const seen = new Set<string>()
    for (const it of items) {
      assertBox(it.min, it.max, `item ${it.id}`)
      if (seen.has(it.id)) throw new RangeError(`duplicate item id ${it.id}`)
      seen.add(it.id)
    }
    const sorted = [...items].sort(byId)
    this.root = sorted.length ? build(sorted, maxLeafSize, 0) : undefined

    let treeNodes = 0
    let leafNodes = 0
    let maxDepth = 0
    const stack = this.root ? [this.root] : []
    while (stack.length) {
      const n = stack.pop()!
      treeNodes += 1
      if (n.depth > maxDepth) maxDepth = n.depth
      if (n.items) leafNodes += 1
      if (n.left) stack.push(n.left)
      if (n.right) stack.push(n.right)
    }
    this.stats = { items: sorted.length, treeNodes, leafNodes, maxDepth, maxLeafSize }
  }

  queryBox(min: BvhVec3, max: BvhVec3): T[] {
    assertBox(min, max, 'query box')
    const hits: T[] = []
    const stack = this.root ? [this.root] : []
    while (stack.length) {
      const n = stack.pop()!
      if (!boxesIntersect(n.min, n.max, min, max)) continue
      if (n.items) for (const it of n.items) { if (boxesIntersect(it.min, it.max, min, max)) hits.push(it) }
      else { if (n.left) stack.push(n.left); if (n.right) stack.push(n.right) }
    }
    return hits.sort(byId)
  }

  /** Urut menurut jarak masuk, seri diputus menurut id. */
  raycast(origin: BvhVec3, direction: BvhVec3, maxDistance = Infinity): BvhRayHit<T>[] {
    if (!finite3(origin)) throw new RangeError('ray origin must be finite')
    if (!finite3(direction)) throw new RangeError('ray direction must be finite')
    if (typeof maxDistance !== 'number' || Number.isNaN(maxDistance) || maxDistance < 0) {
      throw new RangeError('maxDistance must be a non-negative number')
    }
    const len = Math.hypot(direction[0], direction[1], direction[2])
    if (len === 0) throw new RangeError('ray direction must not be zero-length')
    const dir: BvhVec3 = [direction[0] / len, direction[1] / len, direction[2] / len]

    const hits: BvhRayHit<T>[] = []
    const stack = this.root ? [this.root] : []
    while (stack.length) {
      const n = stack.pop()!
      if (!rayInterval(origin, dir, n.min, n.max, maxDistance)) continue
      if (n.items) {
        for (const it of n.items) {
          const iv = rayInterval(origin, dir, it.min, it.max, maxDistance)
          if (iv) hits.push({ item: it, distance: iv.entry, exitDistance: iv.exit })
        }
      } else { if (n.left) stack.push(n.left); if (n.right) stack.push(n.right) }
    }
    return hits.sort((a, b) => a.distance - b.distance || byId(a.item, b.item))
  }

  /** Item terdekat dari titik (jarak 0 bila di dalam kotak); seri diputus menurut id. */
  nearest(point: BvhVec3, maxDistance = Infinity): { item: T; distance: number } | undefined {
    if (!finite3(point)) throw new RangeError('query point must be finite')
    if (typeof maxDistance !== 'number' || Number.isNaN(maxDistance) || maxDistance < 0) {
      throw new RangeError('maxDistance must be a non-negative number')
    }
    let best: { item: T; distance: number } | undefined
    const visit = (n: Node<T>) => {
      const bound = best ? best.distance : maxDistance
      if (distanceToBox(point, n.min, n.max) > bound) return
      if (n.items) {
        for (const it of n.items) {
          const d = distanceToBox(point, it.min, it.max)
          if (d > (best ? best.distance : maxDistance)) continue
          if (!best || d < best.distance || (d === best.distance && it.id < best.item.id)) best = { item: it, distance: d }
        }
        return
      }
      const kids = [n.left!, n.right!].sort((a, b) => distanceToBox(point, a.min, a.max) - distanceToBox(point, b.min, b.max))
      for (const k of kids) visit(k)
    }
    if (this.root) visit(this.root)
    return best
  }
}
