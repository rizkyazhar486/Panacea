// Penata label layar yang deterministik (greedy + hash spasial). Murni: tidak membaca DOM,
// waktu, atau acak. Label terpilih/disematkan diterima lebih dulu dan boleh melampaui batas
// kapasitas/tumpang-tindih; label lain yang terlalu bertumpuk DISEMBUNYIKAN, bukan ditumpuk
// hingga tak terbaca.

export interface ScreenPoint { x: number; y: number }
export interface ScreenRect { x: number; y: number; width: number; height: number }

export interface LabelCandidate {
  id: string
  text: string
  anchor: ScreenPoint
  width: number
  height: number
  priority: number
  selected?: boolean
  pinned?: boolean
}

export interface LabelLayoutOptions {
  viewportWidth: number
  viewportHeight: number
  safeInset: number
  anchorGap: number
  candidateStep: number
  maxRings: number
  maxVisibleLabels: number
  gridCellSize: number
  maxOverlapRatio: number
}

export interface LabelPlacement {
  id: string
  text: string
  anchor: ScreenPoint
  rect: ScreenRect
  leaderEnd: ScreenPoint
  leaderLength: number
  priority: number
  selected: boolean
  pinned: boolean
  visible: boolean
  overlapArea: number
  score: number
}

export interface LabelLayout {
  placements: readonly LabelPlacement[]
  visibleCount: number
  hiddenCount: number
}

export const DEFAULT_LABEL_LAYOUT_OPTIONS: Omit<LabelLayoutOptions, 'viewportWidth' | 'viewportHeight'> = {
  safeInset: 12,
  anchorGap: 10,
  candidateStep: 14,
  maxRings: 5,
  maxVisibleLabels: 120,
  gridCellSize: 64,
  maxOverlapRatio: 0.05,
}

const finitePositive = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0
const finiteNonNegative = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0

function validateOptions(o: LabelLayoutOptions) {
  if (!finitePositive(o.viewportWidth) || !finitePositive(o.viewportHeight)) throw new RangeError('viewport must have finite positive size')
  for (const [name, v] of [['safeInset', o.safeInset], ['anchorGap', o.anchorGap], ['candidateStep', o.candidateStep]] as const) {
    if (!finiteNonNegative(v)) throw new RangeError(`${name} must be a finite non-negative number`)
  }
  if (!(o.viewportWidth > o.safeInset * 2) || !(o.viewportHeight > o.safeInset * 2)) throw new RangeError('viewport must be larger than its safe insets')
  if (!Number.isInteger(o.maxRings) || o.maxRings < 0) throw new RangeError('maxRings must be a non-negative integer')
  if (!Number.isInteger(o.maxVisibleLabels) || o.maxVisibleLabels < 1) throw new RangeError('maxVisibleLabels must be a positive integer')
  if (!finitePositive(o.gridCellSize)) throw new RangeError('gridCellSize must be a finite positive number')
  if (!(typeof o.maxOverlapRatio === 'number' && o.maxOverlapRatio >= 0 && o.maxOverlapRatio <= 1)) throw new RangeError('maxOverlapRatio must be between 0 and 1')
}

function validateCandidate(c: LabelCandidate) {
  if (typeof c.id !== 'string' || !c.id.trim()) throw new RangeError('label candidate has a blank id')
  if (typeof c.text !== 'string' || !c.text.trim()) throw new RangeError(`label ${c.id} has blank text`)
  // Lebar/tinggi tak hingga akan membuat hash spasial berputar tanpa akhir: wajib terhingga.
  if (!finitePositive(c.width) || !finitePositive(c.height)) throw new RangeError(`label ${c.id} must have finite positive dimensions`)
  if (![c.anchor.x, c.anchor.y, c.priority].every(Number.isFinite)) throw new RangeError(`label ${c.id} has a non-finite anchor or priority`)
}

const area = (r: ScreenRect) => r.width * r.height

function overlapArea(a: ScreenRect, b: ScreenRect) {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return w > 0 && h > 0 ? w * h : 0
}

const dist = (a: ScreenPoint, b: ScreenPoint) => Math.hypot(a.x - b.x, a.y - b.y)

function clampToViewport(r: ScreenRect, o: LabelLayoutOptions): ScreenRect {
  const minX = o.safeInset
  const minY = o.safeInset
  const maxX = Math.max(minX, o.viewportWidth - o.safeInset - r.width)
  const maxY = Math.max(minY, o.viewportHeight - o.safeInset - r.height)
  return { ...r, x: Math.min(maxX, Math.max(minX, r.x)), y: Math.min(maxY, Math.max(minY, r.y)) }
}

const leaderEnd = (anchor: ScreenPoint, r: ScreenRect): ScreenPoint => ({
  x: Math.min(r.x + r.width, Math.max(r.x, anchor.x)),
  y: Math.min(r.y + r.height, Math.max(r.y, anchor.y)),
})

function rectAt(c: LabelCandidate, dx: number, dy: number, o: LabelLayoutOptions): ScreenRect {
  const h = dx === 0 ? -c.width / 2 : dx > 0 ? o.anchorGap : -c.width - o.anchorGap
  const v = dy === 0 ? -c.height / 2 : dy > 0 ? o.anchorGap : -c.height - o.anchorGap
  return clampToViewport({ x: c.anchor.x + dx + h, y: c.anchor.y + dy + v, width: c.width, height: c.height }, o)
}

const DIRECTIONS = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1],
] as const

function candidateOffsets(o: LabelLayoutOptions): ScreenPoint[] {
  const out: ScreenPoint[] = []
  for (let ring = 0; ring <= o.maxRings; ring += 1) {
    const m = ring * o.candidateStep
    for (const [x, y] of DIRECTIONS) out.push({ x: x * m, y: y * m })
  }
  return out
}

class RectGrid {
  private readonly buckets = new Map<string, Set<LabelPlacement>>()
  constructor(private readonly cell: number) {}

  private keys(r: ScreenRect) {
    const x0 = Math.floor(r.x / this.cell)
    const y0 = Math.floor(r.y / this.cell)
    const x1 = Math.floor((r.x + r.width) / this.cell)
    const y1 = Math.floor((r.y + r.height) / this.cell)
    // Pelindung berlapis: ukuran tak wajar (mis. tak hingga) tidak boleh membuat loop tak berujung.
    const count = (x1 - x0 + 1) * (y1 - y0 + 1)
    if (!(count <= 250_000)) throw new RangeError('label spans too many grid cells')
    const keys: string[] = []
    for (let y = y0; y <= y1; y += 1) for (let x = x0; x <= x1; x += 1) keys.push(`${x}:${y}`)
    return keys
  }

  nearby(r: ScreenRect) {
    const found = new Set<LabelPlacement>()
    for (const k of this.keys(r)) for (const p of this.buckets.get(k) ?? []) found.add(p)
    return [...found]
  }

  insert(p: LabelPlacement) {
    for (const k of this.keys(p.rect)) {
      const bucket = this.buckets.get(k) ?? new Set<LabelPlacement>()
      bucket.add(p)
      this.buckets.set(k, bucket)
    }
  }
}

function scoreOf(c: LabelCandidate, r: ScreenRect, near: readonly LabelPlacement[]) {
  const overlap = near.reduce((sum, p) => sum + overlapArea(r, p.rect), 0)
  const leaderLength = dist(c.anchor, leaderEnd(c.anchor, r))
  const centreDistance = dist(c.anchor, { x: r.x + r.width / 2, y: r.y + r.height / 2 })
  // Tumpang-tindih mendominasi; panjang garis penunjuk kedua; jarak pusat memutus seri.
  return { overlap, leaderLength, score: overlap * 1_000_000 + leaderLength * 10 + centreDistance }
}

/**
 * Setiap label menguji himpunan kandidat radial terbatas terhadap persegi yang sudah diterima.
 * Kandidat pertama tanpa tumpang-tindih langsung dipakai (cincin terdekat lebih dulu).
 */
export function layoutLabels(
  candidates: readonly LabelCandidate[],
  input: Pick<LabelLayoutOptions, 'viewportWidth' | 'viewportHeight'> & Partial<LabelLayoutOptions>,
): LabelLayout {
  const options: LabelLayoutOptions = { ...DEFAULT_LABEL_LAYOUT_OPTIONS, ...input }
  validateOptions(options)

  const ids = new Set<string>()
  for (const c of candidates) {
    validateCandidate(c)
    if (ids.has(c.id)) throw new RangeError(`duplicate label id ${c.id}`)
    ids.add(c.id)
  }

  const ordered = [...candidates].sort((a, b) =>
    Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))
    || Number(Boolean(b.selected)) - Number(Boolean(a.selected))
    || b.priority - a.priority
    || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

  const offsets = candidateOffsets(options)
  const grid = new RectGrid(options.gridCellSize)
  const accepted: LabelPlacement[] = []
  const hidden: LabelPlacement[] = []

  for (const c of ordered) {
    let best: LabelPlacement | undefined
    for (const off of offsets) {
      const rect = rectAt(c, off.x, off.y, options)
      const m = scoreOf(c, rect, grid.nearby(rect))
      const p: LabelPlacement = {
        id: c.id, text: c.text, anchor: c.anchor, rect, leaderEnd: leaderEnd(c.anchor, rect),
        leaderLength: m.leaderLength, priority: c.priority, selected: Boolean(c.selected), pinned: Boolean(c.pinned),
        visible: true, overlapArea: m.overlap, score: m.score,
      }
      const better = !best || p.score < best.score
        || (p.score === best.score && (p.rect.x < best.rect.x || (p.rect.x === best.rect.x && p.rect.y < best.rect.y)))
      if (better) best = p
      if (m.overlap === 0) break
    }
    // offsets selalu berisi minimal delapan kandidat (cincin 0), jadi best terdefinisi.
    const chosen = best!
    const overBudget = accepted.length >= options.maxVisibleLabels || chosen.overlapArea / area(chosen.rect) > options.maxOverlapRatio
    if (overBudget && !(chosen.selected || chosen.pinned)) {
      hidden.push({ ...chosen, visible: false })
      continue
    }
    accepted.push(chosen)
    grid.insert(chosen)
  }

  return {
    placements: [...accepted, ...hidden].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
    visibleCount: accepted.length,
    hiddenCount: hidden.length,
  }
}
