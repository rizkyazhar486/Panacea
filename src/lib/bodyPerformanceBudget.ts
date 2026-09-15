export type BodyDeviceTier = 'low' | 'mid' | 'high' | 'ultra'
export type BodyQualityMode = 'battery' | 'balanced' | 'quality' | 'cinematic'

export interface BodyDeviceProfile {
  width: number
  height: number
  devicePixelRatio: number
  hardwareConcurrency?: number
  deviceMemoryGb?: number
  mobile: boolean
  reducedMotion: boolean
  saveData?: boolean
}

export interface BodyRenderBudget {
  tier: BodyDeviceTier
  mode: BodyQualityMode
  targetFps: number
  maxDpr: number
  maxTriangles: number
  maxDrawCalls: number
  maxTextureEdge: number
  maxParticles: number
  maxLabels: number
  maxPostFxPasses: number
  shadowMapSize: number
  allowRealtimeShadows: boolean
  allowBloom: boolean
  allowDepthOfField: boolean
  allowChromaticFx: boolean
  allowAmbientParticles: boolean
  suspendWhenHidden: true
  dynamicQuality: true
}

function estimatedPixels(profile: BodyDeviceProfile) {
  return profile.width * profile.height * Math.max(1, profile.devicePixelRatio ** 2)
}

export function classifyBodyDevice(profile: BodyDeviceProfile): BodyDeviceTier {
  const cores = profile.hardwareConcurrency ?? 4
  const memory = profile.deviceMemoryGb ?? 4
  const pixels = estimatedPixels(profile)

  let score = 0
  if (cores >= 12) score += 3
  else if (cores >= 8) score += 2
  else if (cores >= 6) score += 1

  if (memory >= 12) score += 3
  else if (memory >= 8) score += 2
  else if (memory >= 6) score += 1

  if (pixels <= 4_000_000) score += 2
  else if (pixels <= 8_000_000) score += 1
  else if (pixels > 16_000_000) score -= 1

  if (profile.mobile) score -= 1
  if (profile.reducedMotion) score -= 1
  if (profile.saveData) score -= 2

  if (score >= 6) return 'ultra'
  if (score >= 4) return 'high'
  if (score >= 2) return 'mid'
  return 'low'
}

const BASE_BUDGETS: Record<BodyDeviceTier, Omit<BodyRenderBudget, 'mode'>> = {
  low: {
    tier: 'low', targetFps: 40, maxDpr: 1.15, maxTriangles: 350_000, maxDrawCalls: 110,
    maxTextureEdge: 1024, maxParticles: 160, maxLabels: 10, maxPostFxPasses: 0,
    shadowMapSize: 0, allowRealtimeShadows: false, allowBloom: false, allowDepthOfField: false,
    allowChromaticFx: false, allowAmbientParticles: false, suspendWhenHidden: true, dynamicQuality: true,
  },
  mid: {
    tier: 'mid', targetFps: 50, maxDpr: 1.35, maxTriangles: 850_000, maxDrawCalls: 180,
    maxTextureEdge: 2048, maxParticles: 700, maxLabels: 18, maxPostFxPasses: 1,
    shadowMapSize: 1024, allowRealtimeShadows: false, allowBloom: true, allowDepthOfField: false,
    allowChromaticFx: false, allowAmbientParticles: true, suspendWhenHidden: true, dynamicQuality: true,
  },
  high: {
    tier: 'high', targetFps: 60, maxDpr: 1.75, maxTriangles: 2_000_000, maxDrawCalls: 300,
    maxTextureEdge: 4096, maxParticles: 2600, maxLabels: 32, maxPostFxPasses: 2,
    shadowMapSize: 2048, allowRealtimeShadows: true, allowBloom: true, allowDepthOfField: false,
    allowChromaticFx: true, allowAmbientParticles: true, suspendWhenHidden: true, dynamicQuality: true,
  },
  ultra: {
    tier: 'ultra', targetFps: 60, maxDpr: 2.25, maxTriangles: 5_000_000, maxDrawCalls: 480,
    maxTextureEdge: 8192, maxParticles: 8000, maxLabels: 56, maxPostFxPasses: 4,
    shadowMapSize: 4096, allowRealtimeShadows: true, allowBloom: true, allowDepthOfField: true,
    allowChromaticFx: true, allowAmbientParticles: true, suspendWhenHidden: true, dynamicQuality: true,
  },
}

export function bodyRenderBudget(profile: BodyDeviceProfile, mode: BodyQualityMode = 'balanced'): BodyRenderBudget {
  const tier = classifyBodyDevice(profile)
  const base = BASE_BUDGETS[tier]
  const qualityMultiplier = mode === 'battery' ? .58 : mode === 'balanced' ? .82 : mode === 'quality' ? 1 : 1.22
  const dprMultiplier = mode === 'battery' ? .8 : mode === 'cinematic' ? 1.08 : 1
  const effectAllowance = mode !== 'battery' && !profile.reducedMotion

  return {
    ...base,
    mode,
    targetFps: mode === 'cinematic' ? Math.min(base.targetFps, 60) : base.targetFps,
    maxDpr: Math.max(1, Math.min(2.5, base.maxDpr * dprMultiplier)),
    maxTriangles: Math.round(base.maxTriangles * qualityMultiplier),
    maxDrawCalls: Math.round(base.maxDrawCalls * qualityMultiplier),
    maxParticles: Math.round(base.maxParticles * qualityMultiplier),
    maxLabels: Math.max(8, Math.round(base.maxLabels * qualityMultiplier)),
    maxPostFxPasses: effectAllowance ? Math.max(0, Math.round(base.maxPostFxPasses * qualityMultiplier)) : 0,
    allowRealtimeShadows: effectAllowance && base.allowRealtimeShadows,
    allowBloom: effectAllowance && base.allowBloom,
    allowDepthOfField: effectAllowance && base.allowDepthOfField && mode === 'cinematic',
    allowChromaticFx: effectAllowance && base.allowChromaticFx,
    allowAmbientParticles: effectAllowance && base.allowAmbientParticles,
  }
}

export interface BodyFrameSample {
  fps: number
  frameMs: number
  drawCalls?: number
  triangles?: number
}

export interface BodyAdaptiveQualityState {
  level: number
  slowFrames: number
  fastFrames: number
  reason: string
}

export const BODY_ADAPTIVE_QUALITY_INITIAL: BodyAdaptiveQualityState = {
  level: 1,
  slowFrames: 0,
  fastFrames: 0,
  reason: 'initial',
}

export function adaptBodyQuality(
  state: BodyAdaptiveQualityState,
  sample: BodyFrameSample,
  targetFps = 60,
): BodyAdaptiveQualityState {
  const slow = sample.fps < targetFps * .72 || sample.frameMs > 1000 / Math.max(1, targetFps) * 1.45
  const fast = sample.fps > targetFps * .94 && sample.frameMs < 1000 / Math.max(1, targetFps) * 1.08
  const slowFrames = slow ? state.slowFrames + 1 : Math.max(0, state.slowFrames - 2)
  const fastFrames = fast ? state.fastFrames + 1 : Math.max(0, state.fastFrames - 1)

  if (slowFrames >= 24 && state.level > .35) {
    return { level: Math.max(.35, state.level - .1), slowFrames: 0, fastFrames: 0, reason: 'frame-pressure-downshift' }
  }
  if (fastFrames >= 180 && state.level < 1) {
    return { level: Math.min(1, state.level + .05), slowFrames: 0, fastFrames: 0, reason: 'sustained-headroom-upshift' }
  }
  return { ...state, slowFrames, fastFrames, reason: slow ? 'observing-slow' : fast ? 'observing-headroom' : 'stable' }
}

export function scaledBodyBudget(budget: BodyRenderBudget, adaptive: BodyAdaptiveQualityState): BodyRenderBudget {
  const q = Math.max(.35, Math.min(1, adaptive.level))
  return {
    ...budget,
    maxDpr: Math.max(1, budget.maxDpr * (.72 + q * .28)),
    maxTriangles: Math.round(budget.maxTriangles * q),
    maxDrawCalls: Math.round(budget.maxDrawCalls * (.65 + q * .35)),
    maxParticles: Math.round(budget.maxParticles * q),
    maxLabels: Math.max(8, Math.round(budget.maxLabels * (.7 + q * .3))),
    maxPostFxPasses: q < .62 ? 0 : q < .82 ? Math.min(1, budget.maxPostFxPasses) : budget.maxPostFxPasses,
    allowDepthOfField: budget.allowDepthOfField && q > .9,
    allowChromaticFx: budget.allowChromaticFx && q > .74,
    allowAmbientParticles: budget.allowAmbientParticles && q > .62,
  }
}

export function browserBodyDeviceProfile(): BodyDeviceProfile {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemoryGb: nav.deviceMemory,
    mobile: window.matchMedia('(max-width: 760px)').matches || navigator.maxTouchPoints > 1,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: nav.connection?.saveData,
  }
}
