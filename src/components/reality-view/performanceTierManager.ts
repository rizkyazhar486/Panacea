import type { AnatomicalSystemId, RealityViewMode } from '../../types/realityView.ts'

export type PerformanceTierId = 'webgpu_high' | 'mobile_lod' | 'fallback_25d'
export type LodLevelId = 'lod0_shell' | 'lod1_organs_mobile' | 'lod2_clinical_detail'

/** Strict Quiet Mode initial 3D shell transfer cap: 1.8 MiB (1,887,436 bytes). */
export const QUIET_MODE_MAX_BYTES = Math.round(1.8 * 1024 * 1024)
export const FALLBACK_25D_MAX_RAM_MB = 150
export const MOBILE_LOD_MAX_RAM_MB = 240
export const DESKTOP_WEBGPU_MAX_RAM_MB = 600
export const LOW_FPS_THRESHOLD = 25
export const LOW_FPS_CONSECUTIVE_SECONDS = 3

export interface HardwareCapabilityProbe {
  readonly hasWebGPU: boolean
  readonly hasWebGL2: boolean
  readonly isMobile: boolean
  readonly deviceMemoryGb?: number
  readonly rendererString?: string
  readonly consecutiveLowFpsSeconds?: number
}

export interface TierBudgetSpec {
  readonly tier: PerformanceTierId
  readonly rendererBackend: 'webgpu' | 'webgl2' | 'svg_25d'
  readonly targetFpsQuietSplit: number
  readonly targetFpsFullscreen: number
  readonly maxFirstFrameMs: number
  readonly maxRamMb: number
  readonly defaultLod: LodLevelId
  readonly allowInternalOrganPreloadInQuietMode: false
  readonly frostedGlassCompositing: boolean
}

export const TIER_BUDGETS: Readonly<Record<PerformanceTierId, TierBudgetSpec>> = {
  webgpu_high: {
    tier: 'webgpu_high',
    rendererBackend: 'webgpu',
    targetFpsQuietSplit: 60,
    targetFpsFullscreen: 60,
    maxFirstFrameMs: 1200,
    maxRamMb: DESKTOP_WEBGPU_MAX_RAM_MB,
    defaultLod: 'lod2_clinical_detail',
    allowInternalOrganPreloadInQuietMode: false,
    frostedGlassCompositing: true,
  },
  mobile_lod: {
    tier: 'mobile_lod',
    rendererBackend: 'webgl2',
    targetFpsQuietSplit: 60,
    targetFpsFullscreen: 45,
    maxFirstFrameMs: 1500,
    maxRamMb: MOBILE_LOD_MAX_RAM_MB,
    defaultLod: 'lod1_organs_mobile',
    allowInternalOrganPreloadInQuietMode: false,
    frostedGlassCompositing: true,
  },
  fallback_25d: {
    tier: 'fallback_25d',
    rendererBackend: 'svg_25d',
    targetFpsQuietSplit: 30,
    targetFpsFullscreen: 30,
    maxFirstFrameMs: 450,
    maxRamMb: FALLBACK_25D_MAX_RAM_MB,
    defaultLod: 'lod0_shell',
    allowInternalOrganPreloadInQuietMode: false,
    frostedGlassCompositing: true,
  },
}

const SOFTWARE_GPU_PATTERN = /swiftshader|llvmpipe|software|microsoft basic render|mesa offscreen|angle.*warp/i

/**
 * Deterministic 3-tier hardware classifier.
 * Automatically activates `fallback_25d` when deviceMemory <= 2 GB, software
 * WebGL is detected, or GPU FPS stays below 25 fps for >= 3 consecutive seconds.
 */
export function detectPerformanceTier(probe: HardwareCapabilityProbe): TierBudgetSpec {
  const lowMem = typeof probe.deviceMemoryGb === 'number' && Number.isFinite(probe.deviceMemoryGb) && probe.deviceMemoryGb <= 2
  const softwareGpu = typeof probe.rendererString === 'string' && SOFTWARE_GPU_PATTERN.test(probe.rendererString)
  const sustainedLowFps = (probe.consecutiveLowFpsSeconds ?? 0) >= LOW_FPS_CONSECUTIVE_SECONDS
  if (lowMem || softwareGpu || sustainedLowFps || (!probe.hasWebGPU && !probe.hasWebGL2)) {
    return TIER_BUDGETS.fallback_25d
  }
  if (!probe.isMobile && probe.hasWebGPU) {
    return TIER_BUDGETS.webgpu_high
  }
  return {
    ...TIER_BUDGETS.mobile_lod,
    rendererBackend: probe.hasWebGPU ? 'webgpu' : 'webgl2',
  }
}

export interface QuietModeShellAsset {
  readonly cohortKey: string
  readonly publicPath: string
  readonly lod: LodLevelId
}

/**
 * Shipped outer-body shell assets eligible for Quiet Mode initial boot.
 * Every entry is verified by scripts/uji/verify-reality-view-budgets.mjs to stay <= 1.8 MB.
 */
export const QUIET_MODE_SHELL_MANIFEST: readonly QuietModeShellAsset[] = [
  { cohortKey: 'default_surface', publicPath: 'public/anatomy/surface.glb', lod: 'lod0_shell' },
  { cohortKey: 'adult_male', publicPath: 'public/bodyexposure/adult_male.surface.LOD3.glb', lod: 'lod0_shell' },
  { cohortKey: 'adult_female', publicPath: 'public/bodyexposure/adult_female.surface.LOD3.glb', lod: 'lod0_shell' },
  { cohortKey: 'icrp_adult_male', publicPath: 'public/bodyexposure/icrp_adult_male.surface.LOD3.glb', lod: 'lod0_shell' },
  { cohortKey: 'icrp_adult_female', publicPath: 'public/bodyexposure/icrp_adult_female.surface.LOD3.glb', lod: 'lod0_shell' },
  { cohortKey: 'pediatric_neonate_male', publicPath: 'public/bodyexposure/pediatric_neonate_male.surface.LOD3.glb', lod: 'lod0_shell' },
  { cohortKey: 'pediatric_neonate_female', publicPath: 'public/bodyexposure/pediatric_neonate_female.surface.LOD3.glb', lod: 'lod0_shell' },
  { cohortKey: 'pediatric_infant_male', publicPath: 'public/bodyexposure/pediatric_infant_male.surface.LOD3.glb', lod: 'lod0_shell' },
  { cohortKey: 'pediatric_infant_female', publicPath: 'public/bodyexposure/pediatric_infant_female.surface.LOD3.glb', lod: 'lod0_shell' },
  { cohortKey: 'pediatric_child_5y_male', publicPath: 'public/bodyexposure/pediatric_child_5y_male.surface.LOD3.glb', lod: 'lod0_shell' },
  { cohortKey: 'pediatric_child_5y_female', publicPath: 'public/bodyexposure/pediatric_child_5y_female.surface.LOD3.glb', lod: 'lod0_shell' },
  { cohortKey: 'pediatric_child_10y_male', publicPath: 'public/bodyexposure/pediatric_child_10y_male.surface.LOD3.glb', lod: 'lod0_shell' },
  { cohortKey: 'pediatric_child_10y_female', publicPath: 'public/bodyexposure/pediatric_child_10y_female.surface.LOD3.glb', lod: 'lod0_shell' },
  { cohortKey: 'pediatric_adolescent_male', publicPath: 'public/bodyexposure/pediatric_adolescent_male.surface.LOD3.glb', lod: 'lod0_shell' },
  { cohortKey: 'pediatric_adolescent_female', publicPath: 'public/bodyexposure/pediatric_adolescent_female.surface.LOD3.glb', lod: 'lod0_shell' },
]

/**
 * Resolves which asset layers are permitted to load for a given mode & tier.
 * Quiet Mode strictly streams ONLY the outer shell (`lod0_shell`) — zero internal organ preload.
 */
export function resolveActiveLodBundlePlan(params: {
  readonly tier: PerformanceTierId
  readonly mode: RealityViewMode
  readonly requestedSystems: readonly AnatomicalSystemId[]
}): {
  readonly loadOuterShell: boolean
  readonly lodLevel: LodLevelId
  readonly streamableSystems: readonly AnatomicalSystemId[]
} {
  if (params.tier === 'fallback_25d') {
    return { loadOuterShell: false, lodLevel: 'lod0_shell', streamableSystems: [] }
  }
  if (params.mode === 'quiet') {
    return { loadOuterShell: true, lodLevel: 'lod0_shell', streamableSystems: [] }
  }
  const lodLevel: LodLevelId = params.mode === 'fullscreen' && params.tier === 'webgpu_high'
    ? 'lod2_clinical_detail'
    : 'lod1_organs_mobile'
  return {
    loadOuterShell: true,
    lodLevel,
    streamableSystems: [...params.requestedSystems],
  }
}

/** Rolling 3-second FPS watchdog triggering automatic `fallback_25d` downgrade. */
export class FpsTierWatchdog {
  #consecutiveLowSeconds = 0

  recordOneSecondSample(fps: number): { readonly shouldDowngradeTo25D: boolean; readonly consecutiveLowSeconds: number } {
    if (!Number.isFinite(fps) || fps < LOW_FPS_THRESHOLD) {
      this.#consecutiveLowSeconds += 1
    } else {
      this.#consecutiveLowSeconds = 0
    }
    return {
      shouldDowngradeTo25D: this.#consecutiveLowSeconds >= LOW_FPS_CONSECUTIVE_SECONDS,
      consecutiveLowSeconds: this.#consecutiveLowSeconds,
    }
  }

  reset(): void {
    this.#consecutiveLowSeconds = 0
  }
}

export interface DisposableGpuResource {
  readonly id: string
  readonly lod: LodLevelId
  readonly estimatedBytes: number
  dispose(): void
}

/**
 * Explicit GPU geometry/texture/shader buffer lifecycle pool preventing iOS
 * Safari tab crashes when leaving fullscreen or switching cohorts.
 */
export class RealityViewLodResourcePool {
  readonly #entries = new Map<string, DisposableGpuResource>()
  #disposedCount = 0

  register(resource: DisposableGpuResource): void {
    const existing = this.#entries.get(resource.id)
    if (existing) {
      existing.dispose()
      this.#disposedCount += 1
    }
    this.#entries.set(resource.id, resource)
  }

  evictFullscreenResources(): number {
    let evicted = 0
    for (const [id, res] of [...this.#entries.entries()]) {
      if (res.lod === 'lod2_clinical_detail' || res.lod === 'lod1_organs_mobile') {
        res.dispose()
        this.#entries.delete(id)
        this.#disposedCount += 1
        evicted += 1
      }
    }
    return evicted
  }

  disposeAll(): number {
    let evicted = 0
    for (const [id, res] of [...this.#entries.entries()]) {
      res.dispose()
      this.#entries.delete(id)
      this.#disposedCount += 1
      evicted += 1
    }
    return evicted
  }

  get activeBytes(): number {
    let sum = 0
    for (const res of this.#entries.values()) sum += res.estimatedBytes
    return sum
  }

  get activeCount(): number {
    return this.#entries.size
  }

  get disposedCount(): number {
    return this.#disposedCount
  }
}
