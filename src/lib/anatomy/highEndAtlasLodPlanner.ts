import type { AtlasRegionId, AtlasSystemId } from './atlasKernel'

export interface AtlasLodCost {
  triangles: number
  drawCalls: number
  gpuBytes: number
}

export interface AtlasLodOption extends AtlasLodCost {
  level: number
  quality: number
  assetId: string
}

export interface AtlasRenderCandidate {
  structureId: string
  system: AtlasSystemId
  region: AtlasRegionId
  educationalImportance: number
  projectedCoverage: number
  required: boolean
  lods: readonly AtlasLodOption[]
}

export interface AtlasRenderBudget extends AtlasLodCost {}

export interface AtlasFocusContext {
  structureIds: ReadonlySet<string>
  systems: ReadonlySet<AtlasSystemId>
  regions: ReadonlySet<AtlasRegionId>
}

export interface PlannedAtlasAsset {
  structureId: string
  lod: AtlasLodOption
  priority: number
  required: boolean
}

export interface AtlasLodPlan {
  status: 'ready' | 'budget-blocked'
  selected: readonly PlannedAtlasAsset[]
  unresolvedRequired: readonly string[]
  usage: AtlasRenderBudget
  budget: AtlasRenderBudget
}

const EPSILON = 1e-9

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
}

function normalizedCost(cost: AtlasLodCost) {
  return Math.max(1, cost.triangles / 100_000 + cost.drawCalls * 4 + cost.gpuBytes / 1_000_000)
}

function addCost(a: AtlasLodCost, b: AtlasLodCost): AtlasLodCost {
  return {
    triangles: a.triangles + b.triangles,
    drawCalls: a.drawCalls + b.drawCalls,
    gpuBytes: a.gpuBytes + b.gpuBytes,
  }
}

function subtractCost(a: AtlasLodCost, b: AtlasLodCost): AtlasLodCost {
  return {
    triangles: a.triangles - b.triangles,
    drawCalls: a.drawCalls - b.drawCalls,
    gpuBytes: a.gpuBytes - b.gpuBytes,
  }
}

function fits(usage: AtlasLodCost, extra: AtlasLodCost, budget: AtlasRenderBudget) {
  return usage.triangles + extra.triangles <= budget.triangles
    && usage.drawCalls + extra.drawCalls <= budget.drawCalls
    && usage.gpuBytes + extra.gpuBytes <= budget.gpuBytes
}

function validLods(candidate: AtlasRenderCandidate) {
  return candidate.lods
    .filter((lod) => lod.level >= 0 && lod.quality >= 0 && lod.quality <= 1 && lod.triangles >= 0 && lod.drawCalls >= 0 && lod.gpuBytes >= 0 && lod.assetId.trim())
    .sort((a, b) => a.quality - b.quality || b.level - a.level || a.assetId.localeCompare(b.assetId))
}

/**
 * Educational graphics priority, never a clinical probability:
 *
 * P = (F × R × E × S) / max(K, 1)
 *
 * F = explicit structure/system focus weight
 * R = region focus weight
 * E = bounded educational-importance multiplier
 * S = projected screen contribution multiplier
 * K = normalized cost of the candidate's cheapest valid LOD
 *
 * Required structures are first reserved at their cheapest valid LOD. If their
 * combined minimum cannot fit, planning fails closed with `budget-blocked`
 * instead of silently exceeding device budgets or omitting the selected target.
 */
export function atlasPriorityScore(candidate: AtlasRenderCandidate, focus: AtlasFocusContext) {
  const lods = validLods(candidate)
  if (!lods.length) return 0
  const cheapest = lods.reduce((best, lod) => normalizedCost(lod) < normalizedCost(best) ? lod : best, lods[0])
  const focusWeight = focus.structureIds.has(candidate.structureId)
    ? 4
    : focus.systems.has(candidate.system)
      ? 2.25
      : 1
  const regionWeight = focus.regions.has(candidate.region) ? 1.75 : 1
  const educationalWeight = 1 + clamp01(candidate.educationalImportance)
  const screenWeight = 0.25 + 1.75 * clamp01(candidate.projectedCoverage)
  return (focusWeight * regionWeight * educationalWeight * screenWeight) / normalizedCost(cheapest)
}

function cheapestLod(candidate: AtlasRenderCandidate) {
  return validLods(candidate).reduce<AtlasLodOption | null>((best, lod) => {
    if (!best) return lod
    const cost = normalizedCost(lod)
    const bestCost = normalizedCost(best)
    if (cost < bestCost - EPSILON) return lod
    if (Math.abs(cost - bestCost) <= EPSILON && lod.quality < best.quality) return lod
    return best
  }, null)
}

function nextUpgrade(candidate: AtlasRenderCandidate, current: AtlasLodOption) {
  return validLods(candidate)
    .filter((lod) => lod.quality > current.quality + EPSILON)
    .sort((a, b) => a.quality - b.quality || b.level - a.level)[0] ?? null
}

function zeroUsage(): AtlasRenderBudget {
  return { triangles: 0, drawCalls: 0, gpuBytes: 0 }
}

export function planHighEndAtlasLods(
  candidates: readonly AtlasRenderCandidate[],
  budget: AtlasRenderBudget,
  focus: AtlasFocusContext,
): AtlasLodPlan {
  const positiveBudget: AtlasRenderBudget = {
    triangles: Math.max(0, Math.floor(budget.triangles)),
    drawCalls: Math.max(0, Math.floor(budget.drawCalls)),
    gpuBytes: Math.max(0, Math.floor(budget.gpuBytes)),
  }
  const ordered = [...candidates]
    .map((candidate) => ({ candidate, priority: atlasPriorityScore(candidate, focus) }))
    .sort((a, b) => Number(b.candidate.required) - Number(a.candidate.required)
      || b.priority - a.priority
      || a.candidate.structureId.localeCompare(b.candidate.structureId))

  const selected = new Map<string, PlannedAtlasAsset>()
  let usage = zeroUsage()
  const unresolvedRequired: string[] = []

  for (const { candidate, priority } of ordered.filter(({ candidate }) => candidate.required)) {
    const lod = cheapestLod(candidate)
    if (!lod || !fits(usage, lod, positiveBudget)) {
      unresolvedRequired.push(candidate.structureId)
      continue
    }
    selected.set(candidate.structureId, { structureId: candidate.structureId, lod, priority, required: true })
    usage = addCost(usage, lod)
  }

  if (unresolvedRequired.length) {
    return {
      status: 'budget-blocked',
      selected: [...selected.values()].sort((a, b) => b.priority - a.priority || a.structureId.localeCompare(b.structureId)),
      unresolvedRequired: [...new Set(unresolvedRequired)].sort(),
      usage,
      budget: positiveBudget,
    }
  }

  for (const { candidate, priority } of ordered.filter(({ candidate }) => !candidate.required)) {
    const lod = cheapestLod(candidate)
    if (!lod || !fits(usage, lod, positiveBudget)) continue
    selected.set(candidate.structureId, { structureId: candidate.structureId, lod, priority, required: false })
    usage = addCost(usage, lod)
  }

  while (true) {
    const upgradeCandidates = [...selected.values()]
      .map((planned) => {
        const candidate = candidates.find((entry) => entry.structureId === planned.structureId)
        if (!candidate) return null
        const upgrade = nextUpgrade(candidate, planned.lod)
        if (!upgrade) return null
        const delta = subtractCost(upgrade, planned.lod)
        if (delta.triangles < 0 || delta.drawCalls < 0 || delta.gpuBytes < 0) return null
        if (!fits(usage, delta, positiveBudget)) return null
        const qualityGain = upgrade.quality - planned.lod.quality
        const marginalValue = (qualityGain * Math.max(planned.priority, EPSILON)) / normalizedCost(delta)
        return { planned, upgrade, delta, marginalValue }
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      .sort((a, b) => b.marginalValue - a.marginalValue
        || a.planned.structureId.localeCompare(b.planned.structureId)
        || a.upgrade.level - b.upgrade.level)

    const best = upgradeCandidates[0]
    if (!best) break
    selected.set(best.planned.structureId, { ...best.planned, lod: best.upgrade })
    usage = addCost(usage, best.delta)
  }

  return {
    status: 'ready',
    selected: [...selected.values()].sort((a, b) => b.priority - a.priority || a.structureId.localeCompare(b.structureId)),
    unresolvedRequired: [],
    usage,
    budget: positiveBudget,
  }
}
