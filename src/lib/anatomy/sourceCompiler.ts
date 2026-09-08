import { INDEKS_TUBUH, type StrukturTubuh } from '../bodyIndex.gen'
import {
  INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT,
  anatomySourceNodeOrigin,
  resolveAnatomySourceNodes,
  type AnatomySourceNodeBundle,
  type AnatomySourceNodeMatch,
  type AnatomySourceNodeOrigin,
} from '../anatomySourceNodeRegistry'
import type {
  AnatomyAssetRecord,
  AnatomyRegionId,
  AnatomyStructure,
  AtlasLoadContext,
} from './types'

export type SourceCoverageStatus = 'resolved' | 'unresolved' | 'reference-only'

export interface SourceCoverageMismatch {
  code: 'laterality-mismatch' | 'region-mismatch' | 'declared-budget-underflow'
  message: string
}

export interface StructureSourceCoverage {
  structure: AnatomyStructure
  status: SourceCoverageStatus
  matches: readonly AnatomySourceNodeMatch[]
  sourceOrigins: Readonly<Record<string, AnatomySourceNodeOrigin>>
  sourceNodeNames: readonly string[]
  sourceNodeCount: number
  triangles: number
  indexedRegions: readonly string[]
  yMin?: number
  yMax?: number
  radialMax?: number
  indexedLaterality: readonly StrukturTubuh['s'][]
  mismatches: readonly SourceCoverageMismatch[]
}

export interface AssetSourceCoverage {
  asset: AnatomyAssetRecord
  resolvedStructureIds: readonly string[]
  unresolvedStructureIds: readonly string[]
  sourceNodeNames: readonly string[]
  actualTriangles: number
  declaredLod0Triangles: number
  triangleBudgetRatio: number
  mismatches: readonly SourceCoverageMismatch[]
}

export interface AtlasSourceCompilation {
  structures: readonly StructureSourceCoverage[]
  assets: readonly AssetSourceCoverage[]
  totals: {
    structureCount: number
    resolvedStructureCount: number
    unresolvedStructureCount: number
    uniqueSourceNodeCount: number
    uniqueTriangles: number
    resolutionRatio: number
  }
}

export interface MeasuredAtlasLoadPlanItem {
  asset: AnatomyAssetRecord
  score: number
  reasons: readonly string[]
  requestedStructureIds: readonly string[]
  measuredTriangles: number
  estimatedTransferMB: number
}

const BODY_INDEX_BY_NAME = new Map(INDEKS_TUBUH.map((entry) => [entry.n, entry] as const))

const REGION_MAP: Partial<Record<AnatomyRegionId, readonly string[]>> = {
  'head': ['kepala'],
  'neck': ['leher'],
  'thorax': ['toraks', 'bahu-lengan'],
  'abdomen': ['abdomen'],
  'pelvis-perineum': ['pelvis', 'paha'],
  'back-spine': ['leher', 'toraks', 'abdomen', 'pelvis'],
  'upper-limb': ['bahu-lengan', 'tangan'],
  'lower-limb': ['paha', 'tungkai'],
}

function flattenMatches(matches: readonly AnatomySourceNodeMatch[]) {
  return [...new Set(matches.flatMap((match) => match.names))].sort()
}

function indexedEntries(names: readonly string[]) {
  return names.map((name) => BODY_INDEX_BY_NAME.get(name)).filter((entry): entry is StrukturTubuh => Boolean(entry))
}

function sourceHints(structure: AnatomyStructure) {
  const lateralityAliases = structure.laterality === 'left'
    ? structure.synonyms.map((synonym) => `left ${synonym}`)
    : structure.laterality === 'right'
      ? structure.synonyms.map((synonym) => `right ${synonym}`)
      : []
  return [structure.label, ...lateralityAliases, ...structure.synonyms]
}

function lateralityMismatch(structure: AnatomyStructure, entries: readonly StrukturTubuh[]): SourceCoverageMismatch | null {
  if (!entries.length || (structure.laterality !== 'left' && structure.laterality !== 'right')) return null
  const expected = structure.laterality === 'left' ? 'kiri' : 'kanan'
  const hasExpected = entries.some((entry) => entry.s === expected)
  const hasOpposite = entries.some((entry) => entry.s !== expected && entry.s !== 'tengah')
  return !hasExpected && hasOpposite
    ? { code: 'laterality-mismatch', message: `${structure.id} resolved source nodes but none match expected ${structure.laterality} laterality.` }
    : null
}

function regionMismatch(structure: AnatomyStructure, entries: readonly StrukturTubuh[]): SourceCoverageMismatch | null {
  if (!entries.length || structure.regions.includes('whole-body')) return null
  const allowed = new Set(structure.regions.flatMap((region) => REGION_MAP[region] ?? []))
  if (!allowed.size) return null
  const indexedRegions = new Set(entries.map((entry) => entry.w))
  const overlaps = [...indexedRegions].some((region) => allowed.has(region))
  return overlaps
    ? null
    : { code: 'region-mismatch', message: `${structure.id} resolved only to indexed regions [${[...indexedRegions].sort().join(', ')}], outside declared atlas regions [${structure.regions.join(', ')}].` }
}

export function compileStructureSourceCoverage(
  structures: readonly AnatomyStructure[],
  bundles: readonly AnatomySourceNodeBundle[] = INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT,
): readonly StructureSourceCoverage[] {
  return structures.map((structure) => {
    const matches = resolveAnatomySourceNodes(sourceHints(structure), bundles, 32)
    const sourceNodeNames = flattenMatches(matches)
    const entries = indexedEntries(sourceNodeNames)
    const ys = entries.map((entry) => entry.y)
    const radial = entries.map((entry) => entry.r)
    const mismatches = [lateralityMismatch(structure, entries), regionMismatch(structure, entries)]
      .filter((value): value is SourceCoverageMismatch => Boolean(value))
    const sourceFiles = [...new Set(matches.map((match) => match.file))]

    return {
      structure,
      status: sourceNodeNames.length ? 'resolved' : 'unresolved',
      matches,
      sourceOrigins: Object.fromEntries(sourceFiles.map((file) => [file, anatomySourceNodeOrigin(file)])),
      sourceNodeNames,
      sourceNodeCount: sourceNodeNames.length,
      triangles: entries.reduce((sum, entry) => sum + entry.t, 0),
      indexedRegions: [...new Set(entries.map((entry) => entry.w))].sort(),
      yMin: ys.length ? Math.min(...ys) : undefined,
      yMax: ys.length ? Math.max(...ys) : undefined,
      radialMax: radial.length ? Math.max(...radial) : undefined,
      indexedLaterality: [...new Set(entries.map((entry) => entry.s))].sort(),
      mismatches,
    }
  })
}

export function compileAssetSourceCoverage(
  assets: readonly AnatomyAssetRecord[],
  structureCoverage: readonly StructureSourceCoverage[],
): readonly AssetSourceCoverage[] {
  const byId = new Map(structureCoverage.map((entry) => [entry.structure.id, entry] as const))

  return assets.map((asset) => {
    const entries = asset.structureIds.map((id) => byId.get(id)).filter((entry): entry is StructureSourceCoverage => Boolean(entry))
    const resolved = entries.filter((entry) => entry.status === 'resolved')
    const unresolved = entries.filter((entry) => entry.status !== 'resolved')
    const sourceNodeNames = [...new Set(resolved.flatMap((entry) => entry.sourceNodeNames))].sort()
    const actualTriangles = indexedEntries(sourceNodeNames).reduce((sum, entry) => sum + entry.t, 0)
    const declaredLod0Triangles = asset.lods.find((lod) => lod.level === 0)?.triangleBudget ?? 0
    const triangleBudgetRatio = declaredLod0Triangles > 0 ? actualTriangles / declaredLod0Triangles : Number.POSITIVE_INFINITY
    const mismatches = triangleBudgetRatio > 1.05
      ? [{
          code: 'declared-budget-underflow' as const,
          message: `${asset.id} resolves ${actualTriangles.toLocaleString()} indexed triangles versus declared LOD0 budget ${declaredLod0Triangles.toLocaleString()}.`,
        }]
      : []

    return {
      asset,
      resolvedStructureIds: resolved.map((entry) => entry.structure.id).sort(),
      unresolvedStructureIds: unresolved.map((entry) => entry.structure.id).sort(),
      sourceNodeNames,
      actualTriangles,
      declaredLod0Triangles,
      triangleBudgetRatio,
      mismatches,
    }
  })
}

export function compileAtlasSources(
  structures: readonly AnatomyStructure[],
  assets: readonly AnatomyAssetRecord[],
  bundles: readonly AnatomySourceNodeBundle[] = INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT,
): AtlasSourceCompilation {
  const structureCoverage = compileStructureSourceCoverage(structures, bundles)
  const assetCoverage = compileAssetSourceCoverage(assets, structureCoverage)
  const resolved = structureCoverage.filter((entry) => entry.status === 'resolved')
  const unresolved = structureCoverage.filter((entry) => entry.status === 'unresolved')
  const uniqueNames = new Set(resolved.flatMap((entry) => entry.sourceNodeNames))
  let uniqueTriangles = 0
  for (const name of uniqueNames) uniqueTriangles += BODY_INDEX_BY_NAME.get(name)?.t ?? 0

  return {
    structures: structureCoverage,
    assets: assetCoverage,
    totals: {
      structureCount: structureCoverage.length,
      resolvedStructureCount: resolved.length,
      unresolvedStructureCount: unresolved.length,
      uniqueSourceNodeCount: uniqueNames.size,
      uniqueTriangles,
      resolutionRatio: structureCoverage.length ? resolved.length / structureCoverage.length : 1,
    },
  }
}

/**
 * Runtime planning that uses measured/indexed geometry cost where available.
 * This is a graphics/resource heuristic only; clinicalFocus changes priority,
 * never anatomy identity or a medical probability.
 *
 * score = importance / max(1, estimatedTransferMB + measuredTriangles / 100000)
 */
export function buildMeasuredAtlasLoadPlan(
  compilation: AtlasSourceCompilation,
  context: AtlasLoadContext,
): readonly MeasuredAtlasLoadPlanItem[] {
  const visible = new Set(context.visibleStructureIds)
  const clinical = new Set(context.clinicalFocusStructureIds ?? [])
  const interaction = new Set(context.interactionStructureIds ?? [])
  const pinned = new Set(context.pinnedStructureIds ?? [])
  const transferBudgetMB = context.transferBudgetMB ?? Number.POSITIVE_INFINITY

  const candidates = compilation.assets.map((entry): MeasuredAtlasLoadPlanItem | null => {
    const requested = entry.asset.structureIds.filter((id) => visible.has(id) || clinical.has(id) || interaction.has(id) || pinned.has(id))
    if (!requested.length) return null

    let importance = entry.asset.loadClass === 'critical' ? 3 : entry.asset.loadClass === 'interactive' ? 2 : 1
    const reasons: string[] = [`load-class:${entry.asset.loadClass}`]
    for (const id of requested) {
      if (visible.has(id)) { importance += 3; reasons.push(`visible:${id}`) }
      if (clinical.has(id)) { importance += 4; reasons.push(`clinical-focus:${id}`) }
      if (interaction.has(id)) { importance += 2; reasons.push(`interaction:${id}`) }
      if (pinned.has(id)) { importance += 5; reasons.push(`pinned:${id}`) }
    }

    const lod2 = entry.asset.lods.find((lod) => lod.level === 2) ?? entry.asset.lods.at(-1) ?? entry.asset.lods[0]
    const estimatedTransferMB = lod2?.textureBudgetMB ?? 0
    const measuredTriangles = entry.actualTriangles || lod2?.triangleBudget || 0
    const cost = Math.max(1, estimatedTransferMB + measuredTriangles / 100_000)
    return {
      asset: entry.asset,
      score: importance / cost,
      reasons,
      requestedStructureIds: requested,
      measuredTriangles,
      estimatedTransferMB,
    }
  }).filter((entry): entry is MeasuredAtlasLoadPlanItem => Boolean(entry))
    .sort((a, b) => b.score - a.score || a.asset.id.localeCompare(b.asset.id))

  if (!Number.isFinite(transferBudgetMB)) return candidates
  const selected: MeasuredAtlasLoadPlanItem[] = []
  let used = 0
  for (const entry of candidates) {
    if (selected.length && used + entry.estimatedTransferMB > transferBudgetMB) continue
    selected.push(entry)
    used += entry.estimatedTransferMB
  }
  return selected
}
