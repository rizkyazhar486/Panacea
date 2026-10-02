// Tata letak "terurai" (exploded view) netral-renderer dari kotak batas yang SUDAH dipublikasikan.
// Murni dan deterministik. Tidak mengarang koordinat anatomi: yang tak punya batas tidak disertakan
// (pemanggil menyaringnya). Awalnya struktur digeser radial dari pusat gabungan; relaksasi berpasangan
// lalu memisahkan tabrakan AABB yang tersisa. Ini visualisasi pengajaran, bukan model mekanik jaringan.

export type ExplodeVec3 = readonly [number, number, number]

export interface ExplodeItem {
  id: string
  min: ExplodeVec3
  max: ExplodeVec3
  /** Induk hierarkis (opsional). Id induk yang tak dikenal diperlakukan sebagai akar. */
  parentId?: string
}

export interface ExplodeOptions {
  /** Jarak geser dasar (satuan dunia). */
  spacing: number
  /** Tambahan geser per tingkat hierarki: spacing × (1 + kedalaman × bobot). */
  hierarchyWeight: number
  /** Dua kotak dianggap bertabrakan bila jaraknya < 2 × collisionPadding. */
  collisionPadding: number
  maxRelaxationIterations: number
  /** Pasangan leluhur–keturunan tidak dipisahkan (struktur bersarang). Bawaan: true. */
  ignoreAncestorPairs: boolean
}

export interface ExplodeTransform {
  id: string
  offset: ExplodeVec3
  sourceCenter: ExplodeVec3
  hierarchyDepth: number
}

export interface ExplodeLayout {
  transforms: readonly ExplodeTransform[]
  sourceBounds: { min: ExplodeVec3; max: ExplodeVec3 } | null
  iterations: number
  /** Pasangan yang MASIH bertabrakan setelah relaksasi (0 = selesai). Jujur, bukan perkiraan. */
  unresolvedCollisions: number
}

export const DEFAULT_EXPLODE_OPTIONS: ExplodeOptions = {
  spacing: 2.5,
  hierarchyWeight: 0.15,
  collisionPadding: 0.15,
  maxRelaxationIterations: 12,
  ignoreAncestorPairs: true,
}

const AXES = [0, 1, 2] as const
const EPS = 1e-8
const byString = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
const finite3 = (v: ExplodeVec3) => v.length === 3 && v.every((n) => Number.isFinite(n))
const centreOf = (min: ExplodeVec3, max: ExplodeVec3): ExplodeVec3 => [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2]

function directionFromId(id: string): ExplodeVec3 {
  let hash = 2166136261
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  const a = ((hash >>> 0) % 1009) / 1009 * Math.PI * 2
  const b = (((hash >>> 10) % 503) / 503 - 0.5) * Math.PI
  const cb = Math.cos(b)
  const v: ExplodeVec3 = [cb * Math.cos(a), Math.sin(b), cb * Math.sin(a)]
  const len = Math.hypot(v[0], v[1], v[2])
  return len > 0 ? [v[0] / len, v[1] / len, v[2] / len] : [1, 0, 0]
}

function validateOptions(o: ExplodeOptions) {
  for (const [name, v] of [['spacing', o.spacing], ['hierarchyWeight', o.hierarchyWeight], ['collisionPadding', o.collisionPadding]] as const) {
    if (!(typeof v === 'number' && Number.isFinite(v) && v >= 0)) throw new RangeError(`${name} must be a finite non-negative number`)
  }
  if (!Number.isInteger(o.maxRelaxationIterations) || o.maxRelaxationIterations < 0) throw new RangeError('maxRelaxationIterations must be a non-negative integer')
}

function depths(items: readonly ExplodeItem[]) {
  const byId = new Map(items.map((i) => [i.id, i] as const))
  const memo = new Map<string, number>()
  const result = new Map<string, number>()
  for (const item of items) {
    let depth = 0
    let cursor: ExplodeItem | undefined = item
    const seen = new Set<string>()
    while (cursor?.parentId !== undefined && !seen.has(cursor.id)) {
      seen.add(cursor.id)
      const parent = byId.get(cursor.parentId)
      if (!parent) break
      const known = memo.get(parent.id)
      if (known !== undefined) { depth += known + 1; break }
      depth += 1
      cursor = parent
    }
    memo.set(item.id, depth)
    result.set(item.id, depth)
  }
  return { byId, depth: result }
}

function ancestorsOf(id: string, byId: ReadonlyMap<string, ExplodeItem>) {
  const out = new Set<string>()
  let cursor = byId.get(id)
  while (cursor?.parentId !== undefined && !out.has(cursor.parentId)) {
    out.add(cursor.parentId)
    cursor = byId.get(cursor.parentId)
  }
  return out
}

/** Selisih tumpang-tindih per sumbu setelah padding; undefined bila ada sumbu yang terpisah. */
function paddedOverlap(aMin: ExplodeVec3, aMax: ExplodeVec3, bMin: ExplodeVec3, bMax: ExplodeVec3, p: number): ExplodeVec3 | undefined {
  const o: number[] = []
  for (const a of AXES) {
    const v = Math.min(aMax[a], bMax[a]) + p - (Math.max(aMin[a], bMin[a]) - p)
    if (v <= 0) return undefined
    o.push(v)
  }
  return [o[0], o[1], o[2]]
}

export function buildExplodedLayout(items: readonly ExplodeItem[], partial: Partial<ExplodeOptions> = {}): ExplodeLayout {
  const options: ExplodeOptions = { ...DEFAULT_EXPLODE_OPTIONS, ...partial }
  validateOptions(options)

  const seen = new Set<string>()
  for (const it of items) {
    if (typeof it.id !== 'string' || !it.id.trim()) throw new RangeError('item has a blank id')
    if (!finite3(it.min) || !finite3(it.max)) throw new RangeError(`item ${it.id} must have finite bounds`)
    for (const a of AXES) if (it.min[a] > it.max[a]) throw new RangeError(`item ${it.id} has min greater than max on axis ${a}`)
    if (seen.has(it.id)) throw new RangeError(`duplicate item id ${it.id}`)
    seen.add(it.id)
  }
  if (!items.length) return { transforms: [], sourceBounds: null, iterations: 0, unresolvedCollisions: 0 }

  const sorted = [...items].sort((a, b) => byString(a.id, b.id))
  const lo: [number, number, number] = [Infinity, Infinity, Infinity]
  const hi: [number, number, number] = [-Infinity, -Infinity, -Infinity]
  for (const it of sorted) for (const a of AXES) { lo[a] = Math.min(lo[a], it.min[a]); hi[a] = Math.max(hi[a], it.max[a]) }
  const globalCentre = centreOf(lo, hi)
  const { byId, depth } = depths(sorted)

  const offsets: [number, number, number][] = sorted.map((it) => {
    const c = centreOf(it.min, it.max)
    const radial: ExplodeVec3 = [c[0] - globalCentre[0], c[1] - globalCentre[1], c[2] - globalCentre[2]]
    const len = Math.hypot(radial[0], radial[1], radial[2])
    const dir: ExplodeVec3 = len > EPS ? [radial[0] / len, radial[1] / len, radial[2] / len] : directionFromId(it.id)
    const mag = options.spacing * (1 + depth.get(it.id)! * options.hierarchyWeight)
    return [dir[0] * mag, dir[1] * mag, dir[2] * mag]
  })

  const exempt = new Set<string>()
  if (options.ignoreAncestorPairs) {
    const indexOf = new Map(sorted.map((it, i) => [it.id, i] as const))
    sorted.forEach((it, i) => {
      for (const anc of ancestorsOf(it.id, byId)) {
        const j = indexOf.get(anc)
        if (j !== undefined) exempt.add(i < j ? `${i}|${j}` : `${j}|${i}`)
      }
    })
  }

  const box = (i: number) => {
    const it = sorted[i]
    const o = offsets[i]
    return { min: [it.min[0] + o[0], it.min[1] + o[1], it.min[2] + o[2]] as ExplodeVec3, max: [it.max[0] + o[0], it.max[1] + o[1], it.max[2] + o[2]] as ExplodeVec3 }
  }
  const pairKey = (i: number, j: number) => (i < j ? `${i}|${j}` : `${j}|${i}`)

  /** Pasangan kandidat lewat sapuan sumbu-x; hasil terurut menurut indeks (deterministik). */
  const candidatePairs = () => {
    const pad2 = 2 * options.collisionPadding
    const boxes = sorted.map((_, i) => box(i))
    const order = sorted.map((_, i) => i).sort((a, b) => boxes[a].min[0] - boxes[b].min[0] || a - b)
    const pairs: [number, number][] = []
    for (let x = 0; x < order.length; x += 1) {
      const a = order[x]
      for (let y = x + 1; y < order.length; y += 1) {
        const b = order[y]
        if (boxes[b].min[0] >= boxes[a].max[0] + pad2) break
        pairs.push(a < b ? [a, b] : [b, a])
      }
    }
    return pairs.sort((p, q) => p[0] - q[0] || p[1] - q[1])
  }

  let iterations = 0
  for (; iterations < options.maxRelaxationIterations; iterations += 1) {
    let moved = false
    for (const [i, j] of candidatePairs()) {
      if (exempt.has(pairKey(i, j))) continue
      const a = box(i)
      const b = box(j)
      const overlap = paddedOverlap(a.min, a.max, b.min, b.max, options.collisionPadding)
      if (!overlap) continue
      // Dorong sepanjang sumbu tumpang-tindih terkecil; seri sumbu menurut x<y<z.
      let axis = 0
      for (const k of AXES) if (overlap[k] < overlap[axis]) axis = k
      const delta = (b.min[axis] + b.max[axis]) / 2 - (a.min[axis] + a.max[axis]) / 2
      // i < j mengikuti urutan id, jadi pusat yang persis sama selalu mendorong j ke arah + (deterministik).
      const sign = delta === 0 ? 1 : Math.sign(delta)
      const push = sign * (overlap[axis] / 2 + 1e-4)
      offsets[i][axis] -= push
      offsets[j][axis] += push
      moved = true
    }
    if (!moved) break
  }

  let unresolvedCollisions = 0
  for (const [i, j] of candidatePairs()) {
    if (exempt.has(pairKey(i, j))) continue
    const a = box(i)
    const b = box(j)
    if (paddedOverlap(a.min, a.max, b.min, b.max, options.collisionPadding)) unresolvedCollisions += 1
  }

  return {
    sourceBounds: { min: lo, max: hi },
    iterations,
    unresolvedCollisions,
    transforms: sorted.map((it, i) => ({
      id: it.id,
      // + 0 menormalkan -0 menjadi 0 agar keluaran stabil untuk perbandingan/serialisasi.
      offset: [offsets[i][0] + 0, offsets[i][1] + 0, offsets[i][2] + 0] as ExplodeVec3,
      sourceCenter: centreOf(it.min, it.max),
      hierarchyDepth: depth.get(it.id)!,
    })),
  }
}

/** Offset pada kemajuan animasi 0..1 (di luar rentang dijepit). Nilai non-finit ditolak, bukan ditebak. */
export function interpolateExplodedOffset(transform: ExplodeTransform, progress: number): ExplodeVec3 {
  if (typeof progress !== 'number' || !Number.isFinite(progress)) throw new RangeError('progress must be a finite number')
  const t = Math.min(1, Math.max(0, progress))
  return [transform.offset[0] * t + 0, transform.offset[1] * t + 0, transform.offset[2] * t + 0]
}
