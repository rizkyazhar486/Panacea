export type AnatomyLodLevel = 0 | 1 | 2 | 3 | 4

export interface AnatomyLodProfile {
  level: AnatomyLodLevel
  maxGeometricError: number
  estimatedGpuBytes: number
  estimatedDrawCalls: number
  minProjectedRadiusPx: number
}

export interface AnatomyLodSelectionInput {
  projectedRadiusPx: number
  clinicalWeight: number
  selected: boolean
  interacting: boolean
  currentLevel?: AnatomyLodLevel
  hysteresisRatio?: number
}

export interface AnatomyLodSelection {
  level: AnatomyLodLevel
  screenSpaceScore: number
  reason: 'selected' | 'interaction' | 'screen-space' | 'hysteresis'
}

export const DEFAULT_ANATOMY_LOD_PROFILES: readonly AnatomyLodProfile[] = [
  { level: 0, maxGeometricError: 64, estimatedGpuBytes: 128_000, estimatedDrawCalls: 1, minProjectedRadiusPx: 0 },
  { level: 1, maxGeometricError: 32, estimatedGpuBytes: 512_000, estimatedDrawCalls: 2, minProjectedRadiusPx: 24 },
  { level: 2, maxGeometricError: 12, estimatedGpuBytes: 2_000_000, estimatedDrawCalls: 4, minProjectedRadiusPx: 72 },
  { level: 3, maxGeometricError: 4, estimatedGpuBytes: 8_000_000, estimatedDrawCalls: 8, minProjectedRadiusPx: 160 },
  { level: 4, maxGeometricError: 1, estimatedGpuBytes: 28_000_000, estimatedDrawCalls: 16, minProjectedRadiusPx: 320 },
] as const

function clampFinite(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

export function anatomyScreenSpaceScore(projectedRadiusPx: number, geometricError: number): number {
  const radius = Math.max(0, projectedRadiusPx)
  const error = Math.max(1e-6, geometricError)
  return radius / error
}

export function selectAnatomyLod(
  input: AnatomyLodSelectionInput,
  profiles: readonly AnatomyLodProfile[] = DEFAULT_ANATOMY_LOD_PROFILES,
): AnatomyLodSelection {
  if (!profiles.length) throw new Error('At least one anatomy LOD profile is required.')

  const sorted = [...profiles].sort((a, b) => a.level - b.level)
  const projectedRadiusPx = Math.max(0, input.projectedRadiusPx)
  const clinicalWeight = clampFinite(input.clinicalWeight, 0, 4)
  const hysteresisRatio = clampFinite(input.hysteresisRatio ?? 0.12, 0, 0.45)

  let target = sorted[0]
  for (const profile of sorted) {
    const weightedThreshold = profile.minProjectedRadiusPx / Math.max(0.5, 1 + clinicalWeight * 0.18)
    if (projectedRadiusPx >= weightedThreshold) target = profile
  }

  if (input.selected) {
    const forced = sorted.find((profile) => profile.level >= 3) ?? sorted[sorted.length - 1]
    if (forced.level > target.level) target = forced
  } else if (input.interacting) {
    const forced = sorted.find((profile) => profile.level >= 2) ?? sorted[sorted.length - 1]
    if (forced.level > target.level) target = forced
  }

  if (input.currentLevel !== undefined && input.currentLevel !== target.level) {
    const current = sorted.find((profile) => profile.level === input.currentLevel)
    if (current) {
      if (target.level > current.level) {
        const enterThreshold = target.minProjectedRadiusPx * (1 + hysteresisRatio)
        const weightedEnter = enterThreshold / Math.max(0.5, 1 + clinicalWeight * 0.18)
        if (projectedRadiusPx < weightedEnter && !input.selected && !input.interacting) {
          return {
            level: current.level,
            screenSpaceScore: anatomyScreenSpaceScore(projectedRadiusPx, current.maxGeometricError),
            reason: 'hysteresis',
          }
        }
      } else {
        const exitThreshold = current.minProjectedRadiusPx * (1 - hysteresisRatio)
        const weightedExit = exitThreshold / Math.max(0.5, 1 + clinicalWeight * 0.18)
        if (projectedRadiusPx >= weightedExit) {
          return {
            level: current.level,
            screenSpaceScore: anatomyScreenSpaceScore(projectedRadiusPx, current.maxGeometricError),
            reason: 'hysteresis',
          }
        }
      }
    }
  }

  return {
    level: target.level,
    screenSpaceScore: anatomyScreenSpaceScore(projectedRadiusPx, target.maxGeometricError),
    reason: input.selected ? 'selected' : input.interacting ? 'interaction' : 'screen-space',
  }
}

export function validateAnatomyLodProfiles(profiles: readonly AnatomyLodProfile[]): string[] {
  const errors: string[] = []
  const levels = new Set<number>()
  const sorted = [...profiles].sort((a, b) => a.level - b.level)

  for (const profile of sorted) {
    if (levels.has(profile.level)) errors.push(`Duplicate anatomy LOD level ${profile.level}.`)
    levels.add(profile.level)
    if (profile.maxGeometricError <= 0) errors.push(`LOD ${profile.level} geometric error must be positive.`)
    if (profile.estimatedGpuBytes < 0) errors.push(`LOD ${profile.level} GPU estimate must not be negative.`)
    if (profile.estimatedDrawCalls < 0) errors.push(`LOD ${profile.level} draw-call estimate must not be negative.`)
    if (profile.minProjectedRadiusPx < 0) errors.push(`LOD ${profile.level} projected-radius threshold must not be negative.`)
  }

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1]
    const current = sorted[index]
    if (current.minProjectedRadiusPx < previous.minProjectedRadiusPx) {
      errors.push(`LOD ${current.level} projected-radius threshold must be monotonic.`)
    }
    if (current.maxGeometricError > previous.maxGeometricError) {
      errors.push(`LOD ${current.level} geometric error must not increase with detail.`)
    }
  }

  return [...new Set(errors)].sort()
}
