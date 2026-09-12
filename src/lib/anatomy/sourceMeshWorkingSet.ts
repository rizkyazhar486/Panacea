import type { AtlasRegionId, AtlasSystemId } from './atlasKernel'
import {
  SHIPPED_SOURCE_TOPOLOGY,
  querySourceTopology,
  type SourceLaterality,
  type SourceTopologyIndex,
  type SourceTopologyLeaf,
} from './sourceTopologyCompiler'

export interface SourceMeshViewport {
  /** Normalized body-index vertical focus 0..1. */
  centerY: number
  /** Coarse radial focus from body axis. Not a full 3D distance. */
  centerRadius: number
  verticalWindow: number
  radialWindow: number
}

export interface SourceMeshWorkingSetRequest {
  text?: string
  systems?: readonly AtlasSystemId[]
  regions?: readonly AtlasRegionId[]
  laterality?: readonly SourceLaterality[]
  viewport?: SourceMeshViewport
  selectedLeafIds?: readonly string[]
  triangleBudget: number
  maxMeshes: number
  /** Keep a small context envelope around selected/focused structures. */
  contextMultiplier?: number
}

export interface SourceMeshWorkingSetEntry {
  leaf: SourceTopologyLeaf
  score: number
  selected: boolean
  coarseViewportDistance?: number
}

export interface SourceMeshWorkingSetPlan {
  entries: readonly SourceMeshWorkingSetEntry[]
  deferred: readonly { leafId: string; reason: string }[]
  totalTriangles: number
  selectedTriangles: number
  budgetOverrunForPinnedSelection: number
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

/**
 * Coarse source-index proximity only.
 *
 * d = sqrt((Δy / Wy)^2 + (Δr / Wr)^2)
 *
 * `r` has no azimuth, therefore this must never be interpreted as anatomical
 * Euclidean distance or used to infer adjacency. It is only a streaming hint.
 */
export function coarseSourceViewportDistance(leaf: SourceTopologyLeaf, viewport: SourceMeshViewport) {
  const wy = Math.max(0.01, viewport.verticalWindow)
  const wr = Math.max(0.01, viewport.radialWindow)
  const dy = (leaf.verticalPosition - clamp(viewport.centerY, 0, 1)) / wy
  const dr = (leaf.radialDistance - Math.max(0, viewport.centerRadius)) / wr
  return Math.hypot(dy, dr)
}

function viewportScore(distance: number) {
  return 1 / (1 + distance * distance)
}

function complexityScore(triangles: number) {
  // Prefer significant structures, but logarithmically so giant meshes do not
  // starve small nerves/vessels solely because they have fewer triangles.
  return 1 + Math.log10(Math.max(1, triangles)) / 8
}

function candidateScore(
  leaf: SourceTopologyLeaf,
  selected: boolean,
  viewport?: SourceMeshViewport,
  textMatched = false,
) {
  const distance = viewport ? coarseSourceViewportDistance(leaf, viewport) : undefined
  const selectionBoost = selected ? 1_000 : 1
  const searchBoost = textMatched ? 8 : 1
  const spatial = distance === undefined ? 1 : viewportScore(distance)
  return {
    score: selectionBoost * searchBoost * spatial * complexityScore(leaf.triangles),
    distance,
  }
}

/**
 * Schedules exact shipped mesh leaves under a triangle budget. Selected leaves
 * are pinned even if they alone exceed the budget; the overrun is explicitly
 * reported rather than silently hiding the selection.
 */
export function planSourceMeshWorkingSet(
  request: SourceMeshWorkingSetRequest,
  index: SourceTopologyIndex = SHIPPED_SOURCE_TOPOLOGY,
): SourceMeshWorkingSetPlan {
  const selectedIds = new Set(request.selectedLeafIds ?? [])
  const text = request.text?.trim()
  const contextMultiplier = Math.max(0.25, request.contextMultiplier ?? 1.75)

  const base = querySourceTopology(index, {
    text,
    systems: request.systems,
    atlasRegions: request.regions,
    laterality: request.laterality,
    maxResults: Math.max(index.leaves.length, request.maxMeshes * 8),
  })

  // Selected structures remain candidates even when a text/region/system filter
  // changes. Selection is an explicit user action and is never discarded by a
  // transient filter.
  const candidates = new Map(base.map((leaf) => [leaf.id, leaf]))
  for (const selectedId of selectedIds) {
    const leaf = index.byId.get(selectedId)
    if (leaf) candidates.set(selectedId, leaf)
  }

  const scored = [...candidates.values()].map((leaf) => {
    const selected = selectedIds.has(leaf.id)
    const scoredLeaf = candidateScore(leaf, selected, request.viewport, Boolean(text))
    return {
      leaf,
      selected,
      score: scoredLeaf.score,
      coarseViewportDistance: scoredLeaf.distance,
    }
  }).filter((entry) => {
    if (entry.selected || !request.viewport) return true
    return (entry.coarseViewportDistance ?? Number.POSITIVE_INFINITY) <= contextMultiplier
  }).sort((a, b) =>
    Number(b.selected) - Number(a.selected)
    || b.score - a.score
    || b.leaf.triangles - a.leaf.triangles
    || a.leaf.id.localeCompare(b.leaf.id),
  )

  const entries: SourceMeshWorkingSetEntry[] = []
  const deferred: { leafId: string; reason: string }[] = []
  let triangles = 0
  let selectedTriangles = 0

  for (const entry of scored) {
    const nextTriangles = triangles + entry.leaf.triangles
    const meshLimitExceeded = entries.length >= Math.max(1, request.maxMeshes)
    const triangleLimitExceeded = nextTriangles > Math.max(0, request.triangleBudget)

    if (!entry.selected && (meshLimitExceeded || triangleLimitExceeded)) {
      deferred.push({
        leafId: entry.leaf.id,
        reason: meshLimitExceeded ? 'Exact-mesh count budget exhausted.' : 'Exact-mesh triangle budget exhausted.',
      })
      continue
    }

    entries.push(entry)
    triangles = nextTriangles
    if (entry.selected) selectedTriangles += entry.leaf.triangles
  }

  return {
    entries,
    deferred,
    totalTriangles: triangles,
    selectedTriangles,
    budgetOverrunForPinnedSelection: Math.max(0, triangles - Math.max(0, request.triangleBudget)),
  }
}

export function sourceMeshPlanByBundle(plan: SourceMeshWorkingSetPlan) {
  const grouped = new Map<string, SourceMeshWorkingSetEntry[]>()
  for (const entry of plan.entries) {
    const rows = grouped.get(entry.leaf.file) ?? []
    rows.push(entry)
    grouped.set(entry.leaf.file, rows)
  }
  return [...grouped.entries()].map(([file, entries]) => ({
    file,
    entries: entries.sort((a, b) => Number(b.selected) - Number(a.selected) || b.score - a.score),
    triangleCount: entries.reduce((sum, entry) => sum + entry.leaf.triangles, 0),
  })).sort((a, b) => b.triangleCount - a.triangleCount || a.file.localeCompare(b.file))
}

export function validateSourceMeshWorkingSet(plan: SourceMeshWorkingSetPlan): string[] {
  const issues: string[] = []
  const ids = new Set<string>()
  for (const entry of plan.entries) {
    if (ids.has(entry.leaf.id)) issues.push(`Duplicate exact mesh in working set: ${entry.leaf.id}`)
    ids.add(entry.leaf.id)
    if (entry.leaf.triangles < 0) issues.push(`Negative exact mesh triangle count: ${entry.leaf.id}`)
  }
  const calculatedTriangles = plan.entries.reduce((sum, entry) => sum + entry.leaf.triangles, 0)
  if (calculatedTriangles !== plan.totalTriangles) issues.push('Exact mesh total triangle accounting mismatch.')
  const calculatedSelected = plan.entries.filter((entry) => entry.selected).reduce((sum, entry) => sum + entry.leaf.triangles, 0)
  if (calculatedSelected !== plan.selectedTriangles) issues.push('Selected exact mesh triangle accounting mismatch.')
  return issues
}
