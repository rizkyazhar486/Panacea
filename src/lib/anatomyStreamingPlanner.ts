import type { AnatomyLodLevel, AnatomyLodProfile } from './anatomyLodContract'
import { DEFAULT_ANATOMY_LOD_PROFILES, selectAnatomyLod } from './anatomyLodContract'

export interface AnatomyStreamingCandidate {
  nodeId: string
  projectedRadiusPx: number
  clinicalWeight: number
  visible: boolean
  selected: boolean
  interacting: boolean
  predictedNext: boolean
  residentLevel?: AnatomyLodLevel
}

export interface AnatomyStreamingBudget {
  gpuBytes: number
  maxDrawCalls: number
  maxResidentNodes: number
}

export interface AnatomyStreamingPlanEntry {
  nodeId: string
  action: 'load' | 'upgrade' | 'keep' | 'downgrade' | 'preload' | 'unload'
  targetLevel?: AnatomyLodLevel
  estimatedGpuBytes: number
  estimatedDrawCalls: number
  priorityScore: number
}

export interface AnatomyStreamingPlan {
  entries: AnatomyStreamingPlanEntry[]
  totalGpuBytes: number
  totalDrawCalls: number
  residentNodes: number
  overBudget: boolean
}

const EPSILON = 1e-9

function profileFor(level: AnatomyLodLevel, profiles: readonly AnatomyLodProfile[]) {
  const profile = profiles.find((candidate) => candidate.level === level)
  if (!profile) throw new Error(`Missing anatomy LOD profile ${level}.`)
  return profile
}

export function anatomyStreamingPriority(candidate: AnatomyStreamingCandidate, costBytes: number): number {
  const visibility = candidate.visible ? 1 : 0
  const selected = candidate.selected ? 1 : 0
  const interaction = candidate.interacting ? 1 : 0
  const predicted = candidate.predictedNext ? 1 : 0
  const numerator =
    2.5 * visibility
    + 8 * selected
    + 4 * interaction
    + Math.max(0, candidate.clinicalWeight) * 1.5
    + 1.25 * predicted
  const normalizedCost = Math.max(costBytes / 1_000_000, EPSILON)
  return numerator / normalizedCost
}

export function planAnatomyStreaming(
  candidates: readonly AnatomyStreamingCandidate[],
  budget: AnatomyStreamingBudget,
  profiles: readonly AnatomyLodProfile[] = DEFAULT_ANATOMY_LOD_PROFILES,
): AnatomyStreamingPlan {
  if (budget.gpuBytes < 0 || budget.maxDrawCalls < 0 || budget.maxResidentNodes < 0) {
    throw new Error('Anatomy streaming budgets must not be negative.')
  }

  const uniqueCandidates = new Map<string, AnatomyStreamingCandidate>()
  for (const candidate of candidates) {
    if (!candidate.nodeId.trim()) throw new Error('Anatomy streaming candidate node id must not be blank.')
    if (uniqueCandidates.has(candidate.nodeId)) throw new Error(`Duplicate anatomy streaming candidate: ${candidate.nodeId}.`)
    uniqueCandidates.set(candidate.nodeId, candidate)
  }

  const ranked = [...uniqueCandidates.values()].map((candidate) => {
    const selection = selectAnatomyLod({
      projectedRadiusPx: candidate.projectedRadiusPx,
      clinicalWeight: candidate.clinicalWeight,
      selected: candidate.selected,
      interacting: candidate.interacting,
      currentLevel: candidate.residentLevel,
    }, profiles)
    const requestedProfile = profileFor(selection.level, profiles)
    return {
      candidate,
      targetLevel: selection.level,
      requestedProfile,
      priorityScore: anatomyStreamingPriority(candidate, requestedProfile.estimatedGpuBytes),
    }
  }).sort((a, b) => {
    if (a.candidate.selected !== b.candidate.selected) return a.candidate.selected ? -1 : 1
    if (a.candidate.interacting !== b.candidate.interacting) return a.candidate.interacting ? -1 : 1
    if (a.candidate.visible !== b.candidate.visible) return a.candidate.visible ? -1 : 1
    if (a.priorityScore !== b.priorityScore) return b.priorityScore - a.priorityScore
    return a.candidate.nodeId.localeCompare(b.candidate.nodeId)
  })

  const entries: AnatomyStreamingPlanEntry[] = []
  let totalGpuBytes = 0
  let totalDrawCalls = 0
  let residentNodes = 0

  for (const item of ranked) {
    const { candidate, targetLevel, requestedProfile, priorityScore } = item
    const shouldRetain = candidate.visible || candidate.selected || candidate.interacting || candidate.predictedNext

    if (!shouldRetain) {
      entries.push({
        nodeId: candidate.nodeId,
        action: candidate.residentLevel === undefined ? 'unload' : 'unload',
        estimatedGpuBytes: 0,
        estimatedDrawCalls: 0,
        priorityScore,
      })
      continue
    }

    const fits =
      residentNodes + 1 <= budget.maxResidentNodes
      && totalGpuBytes + requestedProfile.estimatedGpuBytes <= budget.gpuBytes
      && totalDrawCalls + requestedProfile.estimatedDrawCalls <= budget.maxDrawCalls

    if (fits) {
      totalGpuBytes += requestedProfile.estimatedGpuBytes
      totalDrawCalls += requestedProfile.estimatedDrawCalls
      residentNodes += 1
      const action: AnatomyStreamingPlanEntry['action'] = candidate.residentLevel === undefined
        ? (candidate.predictedNext && !candidate.visible && !candidate.selected && !candidate.interacting ? 'preload' : 'load')
        : candidate.residentLevel < targetLevel
          ? 'upgrade'
          : candidate.residentLevel > targetLevel
            ? 'downgrade'
            : 'keep'
      entries.push({
        nodeId: candidate.nodeId,
        action,
        targetLevel,
        estimatedGpuBytes: requestedProfile.estimatedGpuBytes,
        estimatedDrawCalls: requestedProfile.estimatedDrawCalls,
        priorityScore,
      })
      continue
    }

    let fallback: AnatomyLodProfile | undefined
    for (const profile of [...profiles].sort((a, b) => b.level - a.level)) {
      if (profile.level >= targetLevel) continue
      const fallbackFits =
        residentNodes + 1 <= budget.maxResidentNodes
        && totalGpuBytes + profile.estimatedGpuBytes <= budget.gpuBytes
        && totalDrawCalls + profile.estimatedDrawCalls <= budget.maxDrawCalls
      if (fallbackFits) {
        fallback = profile
        break
      }
    }

    if (fallback) {
      totalGpuBytes += fallback.estimatedGpuBytes
      totalDrawCalls += fallback.estimatedDrawCalls
      residentNodes += 1
      entries.push({
        nodeId: candidate.nodeId,
        action: candidate.residentLevel === undefined ? 'load' : candidate.residentLevel === fallback.level ? 'keep' : 'downgrade',
        targetLevel: fallback.level,
        estimatedGpuBytes: fallback.estimatedGpuBytes,
        estimatedDrawCalls: fallback.estimatedDrawCalls,
        priorityScore,
      })
    } else {
      entries.push({
        nodeId: candidate.nodeId,
        action: 'unload',
        estimatedGpuBytes: 0,
        estimatedDrawCalls: 0,
        priorityScore,
      })
    }
  }

  entries.sort((a, b) => a.nodeId.localeCompare(b.nodeId))
  return {
    entries,
    totalGpuBytes,
    totalDrawCalls,
    residentNodes,
    overBudget:
      totalGpuBytes > budget.gpuBytes
      || totalDrawCalls > budget.maxDrawCalls
      || residentNodes > budget.maxResidentNodes,
  }
}
