import { installBody3dSourceNodeCapture } from './body3dSourceNodeCapture'

// Guard runtime Body Exposure. Perhitungan kualitas di bawah tetap murni dan
// deterministik; constructor generation token hanya memasang satu hook loader
// untuk mencatat nama node sumber ketika viewer Body3D benar-benar dibuat.

export const BODY3D_DESKTOP_MAX_DPR = 2
export const BODY3D_MOBILE_MAX_DPR = 1.5
// 5.25 MP membuat kanvas desktop umum 1440×900 dapat memakai 2x penuh
// (5.184 MP) tanpa menyentuh cap mobile 1.5x. Viewer tetap demand-rendered,
// jadi tambahan fill-rate hanya dibayar saat frame memang perlu digambar.
export const BODY3D_MAX_RENDER_PIXELS = 5_250_000

export type Body3dRenderMode = 'anatomy' | 'xray' | 'ct' | 'mriT1' | 'mriT2'
export type Body3dSlicePlane = 'none' | 'axial' | 'coronal' | 'sagittal'

/**
 * Mobile tetap memakai cap 1.5x yang sudah terbukti lebih aman terhadap
 * tekanan fill-rate/memori. Desktop/tablet boleh sampai 2x, tetapi pada kanvas
 * besar supersampling diturunkan bertahap. DPR tidak pernah dipaksa di bawah
 * 1 sehingga layar CSS 4K tetap dirender pada resolusi native minimal 4K.
 */
export function body3dPixelRatio(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
  smallViewport: boolean,
): number {
  const width = Number.isFinite(cssWidth) && cssWidth > 0 ? cssWidth : 1
  const height = Number.isFinite(cssHeight) && cssHeight > 0 ? cssHeight : 1
  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1
  const cap = smallViewport ? BODY3D_MOBILE_MAX_DPR : BODY3D_DESKTOP_MAX_DPR
  const pixelBudgetRatio = Math.sqrt(BODY3D_MAX_RENDER_PIXELS / (width * height))
  return Math.min(dpr, cap, Math.max(1, pixelBudgetRatio))
}

/**
 * Nomor generasi mencegah hasil unduhan lama dipasang setelah layer sudah
 * dimatikan atau permintaan yang lebih baru menggantikannya.
 */
export class Body3dLayerLoadGeneration {
  private generations = new Map<string, number>()

  constructor() {
    installBody3dSourceNodeCapture()
  }

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
