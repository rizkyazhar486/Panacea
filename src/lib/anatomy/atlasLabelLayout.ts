export interface ScreenPoint {
  x: number
  y: number
}

export interface ScreenRect {
  x: number
  y: number
  width: number
  height: number
}

export interface AtlasLabelCandidate {
  nodeId: string
  text: string
  anchor: ScreenPoint
  width: number
  height: number
  priority: number
  selected?: boolean
  pinned?: boolean
}

export interface AtlasLabelLayoutOptions {
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

export interface AtlasLabelPlacement {
  nodeId: string
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

export interface AtlasLabelLayout {
  placements: readonly AtlasLabelPlacement[]
  visibleCount: number
  hiddenCount: number
}

export const DEFAULT_ATLAS_LABEL_LAYOUT_OPTIONS: Omit<AtlasLabelLayoutOptions, 'viewportWidth' | 'viewportHeight'> = {
  safeInset: 12,
  anchorGap: 10,
  candidateStep: 14,
  maxRings: 5,
  maxVisibleLabels: 120,
  gridCellSize: 64,
  maxOverlapRatio: 0.05,
}

function validateCandidate(candidate: AtlasLabelCandidate) {
  if (!candidate.nodeId.trim()) throw new Error('Atlas label candidate has a blank node id.')
  if (!candidate.text.trim()) throw new Error(`Atlas label ${candidate.nodeId} has blank text.`)
  if (!(candidate.width > 0) || !(candidate.height > 0)) throw new Error(`Atlas label ${candidate.nodeId} must have positive dimensions.`)
  if (![candidate.anchor.x, candidate.anchor.y, candidate.priority].every(Number.isFinite)) {
    throw new Error(`Atlas label ${candidate.nodeId} contains a non-finite anchor or priority.`)
  }
}

function area(rect: ScreenRect) {
  return rect.width * rect.height
}

function overlapArea(a: ScreenRect, b: ScreenRect) {
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return width > 0 && height > 0 ? width * height : 0
}

function rectCenter(rect: ScreenRect): ScreenPoint {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
}

function distance(a: ScreenPoint, b: ScreenPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function clampRectToViewport(rect: ScreenRect, options: AtlasLabelLayoutOptions): ScreenRect {
  const minX = options.safeInset
  const minY = options.safeInset
  const maxX = Math.max(minX, options.viewportWidth - options.safeInset - rect.width)
  const maxY = Math.max(minY, options.viewportHeight - options.safeInset - rect.height)
  return {
    ...rect,
    x: Math.min(maxX, Math.max(minX, rect.x)),
    y: Math.min(maxY, Math.max(minY, rect.y)),
  }
}

function leaderEndpoint(anchor: ScreenPoint, rect: ScreenRect): ScreenPoint {
  return {
    x: Math.min(rect.x + rect.width, Math.max(rect.x, anchor.x)),
    y: Math.min(rect.y + rect.height, Math.max(rect.y, anchor.y)),
  }
}

function initialRect(candidate: AtlasLabelCandidate, dx: number, dy: number, options: AtlasLabelLayoutOptions): ScreenRect {
  const horizontal = dx === 0 ? -candidate.width / 2 : dx > 0 ? options.anchorGap : -candidate.width - options.anchorGap
  const vertical = dy === 0 ? -candidate.height / 2 : dy > 0 ? options.anchorGap : -candidate.height - options.anchorGap
  return clampRectToViewport({
    x: candidate.anchor.x + dx + horizontal,
    y: candidate.anchor.y + dy + vertical,
    width: candidate.width,
    height: candidate.height,
  }, options)
}

function candidateOffsets(options: AtlasLabelLayoutOptions): readonly ScreenPoint[] {
  const offsets: ScreenPoint[] = []
  const directions = [
    { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
    { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 },
  ]
  for (let ring = 0; ring <= options.maxRings; ring += 1) {
    const magnitude = ring * options.candidateStep
    for (const direction of directions) offsets.push({ x: direction.x * magnitude, y: direction.y * magnitude })
  }
  return offsets
}

class ScreenRectGrid {
  private readonly buckets = new Map<string, Set<AtlasLabelPlacement>>()
  constructor(private readonly cellSize: number) {
    if (!(cellSize > 0)) throw new Error('Atlas label grid cell size must be positive.')
  }

  private keys(rect: ScreenRect) {
    const minX = Math.floor(rect.x / this.cellSize)
    const minY = Math.floor(rect.y / this.cellSize)
    const maxX = Math.floor((rect.x + rect.width) / this.cellSize)
    const maxY = Math.floor((rect.y + rect.height) / this.cellSize)
    const keys: string[] = []
    for (let y = minY; y <= maxY; y += 1) for (let x = minX; x <= maxX; x += 1) keys.push(`${x}:${y}`)
    return keys
  }

  nearby(rect: ScreenRect) {
    const placements = new Set<AtlasLabelPlacement>()
    for (const key of this.keys(rect)) for (const placement of this.buckets.get(key) ?? []) placements.add(placement)
    return [...placements]
  }

  insert(placement: AtlasLabelPlacement) {
    for (const key of this.keys(placement.rect)) {
      const bucket = this.buckets.get(key) ?? new Set<AtlasLabelPlacement>()
      bucket.add(placement)
      this.buckets.set(key, bucket)
    }
  }
}

function placementScore(
  candidate: AtlasLabelCandidate,
  rect: ScreenRect,
  neighbours: readonly AtlasLabelPlacement[],
) {
  const overlap = neighbours.reduce((sum, placement) => sum + overlapArea(rect, placement.rect), 0)
  const endpoint = leaderEndpoint(candidate.anchor, rect)
  const leaderLength = distance(candidate.anchor, endpoint)
  const centerDistance = distance(candidate.anchor, rectCenter(rect))
  // Overlap dominates. Leader distance is secondary, and center displacement
  // breaks ties in favour of labels visually close to the structure anchor.
  return { overlap, leaderLength, score: overlap * 1_000_000 + leaderLength * 10 + centerDistance }
}

/**
 * Deterministic greedy screen-space label solver with spatial hashing.
 *
 * Selected and pinned structures are admitted first. Each label evaluates a
 * bounded radial candidate set against nearby accepted rectangles. Excessive
 * overlap hides low-priority labels instead of stacking unreadable text.
 */
export function layoutAtlasLabels(
  candidates: readonly AtlasLabelCandidate[],
  inputOptions: Pick<AtlasLabelLayoutOptions, 'viewportWidth' | 'viewportHeight'> & Partial<Omit<AtlasLabelLayoutOptions, 'viewportWidth' | 'viewportHeight'>>,
): AtlasLabelLayout {
  const options: AtlasLabelLayoutOptions = { ...DEFAULT_ATLAS_LABEL_LAYOUT_OPTIONS, ...inputOptions }
  if (!(options.viewportWidth > options.safeInset * 2) || !(options.viewportHeight > options.safeInset * 2)) {
    throw new Error('Atlas label viewport must be larger than its safe insets.')
  }
  if (!Number.isInteger(options.maxRings) || options.maxRings < 0) throw new Error('Atlas label maxRings must be a non-negative integer.')
  if (!Number.isInteger(options.maxVisibleLabels) || options.maxVisibleLabels < 1) throw new Error('Atlas label maxVisibleLabels must be positive.')
  if (!(options.maxOverlapRatio >= 0 && options.maxOverlapRatio <= 1)) throw new Error('Atlas label maxOverlapRatio must be between 0 and 1.')

  const ids = new Set<string>()
  for (const candidate of candidates) {
    validateCandidate(candidate)
    if (ids.has(candidate.nodeId)) throw new Error(`Duplicate atlas label node id: ${candidate.nodeId}.`)
    ids.add(candidate.nodeId)
  }

  const ordered = [...candidates].sort((a, b) =>
    Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))
    || Number(Boolean(b.selected)) - Number(Boolean(a.selected))
    || b.priority - a.priority
    || a.nodeId.localeCompare(b.nodeId),
  )
  const offsets = candidateOffsets(options)
  const grid = new ScreenRectGrid(options.gridCellSize)
  const accepted: AtlasLabelPlacement[] = []
  const hidden: AtlasLabelPlacement[] = []

  for (const candidate of ordered) {
    let best: AtlasLabelPlacement | undefined
    for (const offset of offsets) {
      const rect = initialRect(candidate, offset.x, offset.y, options)
      const nearby = grid.nearby(rect)
      const metrics = placementScore(candidate, rect, nearby)
      const endpoint = leaderEndpoint(candidate.anchor, rect)
      const placement: AtlasLabelPlacement = {
        nodeId: candidate.nodeId,
        text: candidate.text,
        anchor: candidate.anchor,
        rect,
        leaderEnd: endpoint,
        leaderLength: metrics.leaderLength,
        priority: candidate.priority,
        selected: Boolean(candidate.selected),
        pinned: Boolean(candidate.pinned),
        visible: true,
        overlapArea: metrics.overlap,
        score: metrics.score,
      }
      if (!best || placement.score < best.score || (placement.score === best.score && `${rect.x}:${rect.y}` < `${best.rect.x}:${best.rect.y}`)) best = placement
      if (metrics.overlap === 0) break
    }

    if (!best) continue
    const overlapRatio = best.overlapArea / area(best.rect)
    const capacityReached = accepted.length >= options.maxVisibleLabels
    const mayForce = best.selected || best.pinned
    if ((capacityReached || overlapRatio > options.maxOverlapRatio) && !mayForce) {
      hidden.push({ ...best, visible: false })
      continue
    }
    accepted.push(best)
    grid.insert(best)
  }

  return {
    placements: [...accepted, ...hidden].sort((a, b) => a.nodeId.localeCompare(b.nodeId)),
    visibleCount: accepted.length,
    hiddenCount: hidden.length,
  }
}
