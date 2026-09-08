import type { AnatomyRegion, AnatomySystem, AtlasManifest } from './anatomyAtlasGraph'
import { validateAtlasManifest } from './anatomyAtlasGraph'
import type { AnatomySceneCompileResult, SourceSceneNode } from './anatomySceneCompiler'
import { compileAnatomyScene } from './anatomySceneCompiler'
import type { AtlasStreamingPlan } from './anatomyAtlasStreaming'
import { planAnatomyAtlasStreaming } from './anatomyAtlasStreaming'

export interface AnatomyAtlasRuntimePolicy {
  maxAmbiguities?: number
  minWeightedCoverage?: number
  requiredSystems?: readonly AnatomySystem[]
  minSystemCoverage?: Partial<Record<AnatomySystem, number>>
  requiredRegions?: readonly AnatomyRegion[]
  minRegionCoverage?: Partial<Record<AnatomyRegion, number>>
  requireRecordedAcademicReview?: boolean
}

export interface AnatomyAtlasRuntimeRequest {
  sourceNodes: readonly SourceSceneNode[]
  maxBudgetUnits: number
  activeSystems?: readonly AnatomySystem[]
  activeRegions?: readonly AnatomyRegion[]
  focusNodeIds?: readonly string[]
  policy?: AnatomyAtlasRuntimePolicy
}

export interface AnatomyAtlasRuntimeResult {
  readyForRender: boolean
  reasons: string[]
  warnings: string[]
  compile: AnatomySceneCompileResult
  streaming: AtlasStreamingPlan
  pendingAcademicReviewNodeIds: string[]
}

function assertCoverageThreshold(value: number | undefined, label: string): void {
  if (value === undefined) return
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`${label} must be between 0 and 1.`)
}

export function prepareAnatomyAtlasRuntime(
  manifest: AtlasManifest,
  request: AnatomyAtlasRuntimeRequest,
): AnatomyAtlasRuntimeResult {
  const graph = validateAtlasManifest(manifest)
  const policy = request.policy ?? {}
  const maxAmbiguities = policy.maxAmbiguities ?? 0
  if (!Number.isInteger(maxAmbiguities) || maxAmbiguities < 0) throw new Error('maxAmbiguities must be an integer >= 0.')
  assertCoverageThreshold(policy.minWeightedCoverage, 'minWeightedCoverage')
  for (const [system, threshold] of Object.entries(policy.minSystemCoverage ?? {})) assertCoverageThreshold(threshold, `minSystemCoverage.${system}`)
  for (const [region, threshold] of Object.entries(policy.minRegionCoverage ?? {})) assertCoverageThreshold(threshold, `minRegionCoverage.${region}`)

  const compile = compileAnatomyScene(manifest, request.sourceNodes)
  const streaming = planAnatomyAtlasStreaming(manifest, {
    maxBudgetUnits: request.maxBudgetUnits,
    activeSystems: request.activeSystems,
    activeRegions: request.activeRegions,
    focusNodeIds: request.focusNodeIds,
  })
  const reasons = [...graph.errors]
  const warnings = [...graph.warnings, ...compile.warnings]
  const pendingAcademicReviewNodeIds = manifest.nodes
    .filter((node) => node.academicReview.status !== 'recorded')
    .map((node) => node.id)
    .sort()

  if (compile.ambiguities.length > maxAmbiguities) {
    reasons.push(`Scene binding has ${compile.ambiguities.length} ambiguity record(s), exceeding policy maximum ${maxAmbiguities}.`)
  }
  if (streaming.overBudget) {
    reasons.push(`Mandatory focus/ancestor residency requires ${streaming.minimumRequiredBudget} budget units, above maximum ${streaming.maxBudgetUnits}.`)
  }
  if (policy.minWeightedCoverage !== undefined && compile.weightedCoverage < policy.minWeightedCoverage) {
    reasons.push(`Weighted scene coverage ${compile.weightedCoverage.toFixed(6)} is below required ${policy.minWeightedCoverage.toFixed(6)}.`)
  }

  for (const system of policy.requiredSystems ?? []) {
    const coverage = compile.coverageBySystem[system]?.coverage ?? 0
    const threshold = policy.minSystemCoverage?.[system] ?? 0
    if (!(system in compile.coverageBySystem)) reasons.push(`Required anatomy system ${system} is absent from the manifest coverage index.`)
    else if (coverage < threshold) reasons.push(`System ${system} coverage ${coverage.toFixed(6)} is below required ${threshold.toFixed(6)}.`)
  }

  for (const region of policy.requiredRegions ?? []) {
    const coverage = compile.coverageByRegion[region]?.coverage ?? 0
    const threshold = policy.minRegionCoverage?.[region] ?? 0
    if (!(region in compile.coverageByRegion)) reasons.push(`Required anatomy region ${region} is absent from the manifest coverage index.`)
    else if (coverage < threshold) reasons.push(`Region ${region} coverage ${coverage.toFixed(6)} is below required ${threshold.toFixed(6)}.`)
  }

  if (policy.requireRecordedAcademicReview && pendingAcademicReviewNodeIds.length) {
    reasons.push(`${pendingAcademicReviewNodeIds.length} atlas node(s) still have pending academic review.`)
  }

  return {
    readyForRender: reasons.length === 0,
    reasons: [...new Set(reasons)],
    warnings: [...new Set(warnings)],
    compile,
    streaming,
    pendingAcademicReviewNodeIds,
  }
}
