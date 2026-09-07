// Guard runtime Body Exposure yang sengaja murni/deterministik supaya perilaku
// kritis dapat diuji tanpa membutuhkan WebGL atau peramban.

export const BODY3D_MAX_DPR = 2
export const BODY3D_MAX_RENDER_PIXELS = 4_500_000

export interface Body3dMotionState {
  heartRate: number
  respRate: number
  contractionRate: number
  peristalsisRate?: number
}

export type Body3dRenderMode = 'anatomy' | 'xray' | 'ct' | 'mriT1' | 'mriT2'
export type Body3dSlicePlane = 'none' | 'axial' | 'coronal' | 'sagittal'

/**
 * Menjaga layar kecil tetap tajam sampai DPR 2, lalu menurunkan supersampling
 * secara bertahap pada kanvas besar. DPR tidak pernah dipaksa di bawah 1:
 * kanvas CSS 4K tetap dirender minimal pada native 4K.
 */
export function body3dPixelRatio(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
): number {
  const width = Number.isFinite(cssWidth) && cssWidth > 0 ? cssWidth : 1
  const height = Number.isFinite(cssHeight) && cssHeight > 0 ? cssHeight : 1
  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1
  const pixelBudgetRatio = Math.sqrt(BODY3D_MAX_RENDER_PIXELS / (width * height))
  return Math.min(dpr, BODY3D_MAX_DPR, Math.max(1, pixelBudgetRatio))
}

export function body3dHasActiveMotion(motion: Body3dMotionState): boolean {
  return motion.heartRate > 0
    || motion.respRate > 0
    || motion.contractionRate > 0
    || (motion.peristalsisRate ?? 0) > 0
}

/**
 * Nomor generasi mencegah hasil unduhan lama dipasang setelah layer sudah
 * dimatikan atau permintaan yang lebih baru menggantikannya.
 */
export class Body3dLayerLoadGeneration {
  private generations = new Map<string, number>()

  begin(key: string): number {
    const next = (this.generations.get(key) ?? 0) + 1
    this.generations.set(key, next)
    return next
  }

  invalidate(key: string): void {
    this.begin(key)
  }

  isCurrent(key: string, generation: number): boolean {
    return this.generations.get(key) === generation
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
}

/**
 * Dissection mengalikan opacity dasar material, bukan menggantikannya. Ini
 * penting untuk X-ray: sifat additive/transparan dan depthWrite=false harus
 * tetap benar walaupun kedalaman diseksi berubah.
 */
export function body3dDissectionMaterialState(
  mode: Body3dRenderMode,
  baseOpacity: number,
  depthOpacity: number,
): { opacity: number; transparent: boolean; depthWrite: boolean } {
  const opacity = clamp01(baseOpacity) * clamp01(depthOpacity)
  if (mode === 'xray') return { opacity, transparent: true, depthWrite: false }
  const transparent = opacity < 0.999
  return { opacity, transparent, depthWrite: !transparent }
}

export interface Body3dBounds {
  min: { x: number; y: number; z: number }
  max: { x: number; y: number; z: number }
}

/** Posisi irisan dihitung ulang dari slider terkini dan batas tubuh nyata. */
export function body3dSliceCoordinate(
  bounds: Body3dBounds,
  plane: Exclude<Body3dSlicePlane, 'none'>,
  slicePos: number,
): number {
  const p = clamp01(slicePos)
  const lo = plane === 'axial' ? bounds.min.y : plane === 'coronal' ? bounds.min.z : bounds.min.x
  const hi = plane === 'axial' ? bounds.max.y : plane === 'coronal' ? bounds.max.z : bounds.max.x
  return lo + (hi - lo) * p
}
