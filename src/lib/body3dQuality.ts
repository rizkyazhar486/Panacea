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

/**
 * Penghalusan bertahap: tajam saat diam, aman saat digerakkan.
 *
 * Cap 1.5x di atas ada karena alasan yang benar -- tekanan fill-rate saat
 * pengguna memutar tubuh. Tetapi cap itu ikut berlaku pada frame yang DIAM,
 * dan di sanalah gambar sebenarnya dilihat dan dibaca. Pada telepon ber-DPR 3,
 * 1.5x berarti setengah resolusi linear: tepi tulang dan garis label tampak
 * lunak walaupun layarnya sanggup menampilkan dua kali lipat.
 *
 * Viewer ini demand-rendered -- ia tidak menggambar frame identik berulang
 * kali. Jadi satu frame tambahan beresolusi penuh setelah kamera berhenti
 * hampir tidak berbiaya: ia digambar sekali, lalu diam.
 *
 * Anggaran piksel untuk frame diam dibuat lebih longgar daripada frame
 * interaktif, tetapi TIDAK tak terbatas: kanvas desktop besar tetap dibatasi
 * supaya buffer gambar tidak meledak.
 */
export const BODY3D_REFINE_MAX_RENDER_PIXELS = 9_000_000

/** Jeda diam sebelum frame halus digambar. */
export const BODY3D_REFINE_DELAY_MS = 180

/**
 * Kenaikan langit-langit pada percobaan PERTAMA.
 *
 * Versi pertama langsung melompat ke DPR perangkat. Terukur: smoke Body3D
 * berhenti di klik "Vessels" karena satu frame 3x pada scene penuh menahan
 * utas utama cukup lama sampai antarmukanya tidak menanggapi -- dan itu
 * terjadi SEBELUM ada satu pun pengukuran yang membenarkan lompatan itu.
 * Perangkat lemah tidak boleh membayar satu frame mahal hanya untuk
 * membuktikan bahwa ia lemah.
 *
 * Jadi langkah pertama kecil, dan ketajaman penuh dicapai dalam beberapa
 * langkah yang masing-masing sudah dibuktikan murah.
 */
export const BODY3D_REFINE_FIRST_STEP = 0.5

/**
 * Bila satu frame halus memakan lebih lama dari ini, perangkatnya tidak
 * sanggup dan langit-langitnya diturunkan. Diukur, bukan ditebak dari nama
 * perangkat atau jumlah inti.
 */
export const BODY3D_REFINE_FRAME_BUDGET_MS = 320

/**
 * Rasio piksel untuk frame diam. Tidak pernah lebih rendah daripada rasio
 * interaktif: menghaluskan tidak boleh malah memperburuk gambar.
 */
export function body3dRefinePixelRatio(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
  interactivePixelRatio: number,
  ceiling: number,
): number {
  const width = Number.isFinite(cssWidth) && cssWidth > 0 ? cssWidth : 1
  const height = Number.isFinite(cssHeight) && cssHeight > 0 ? cssHeight : 1
  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1
  const dasar = Number.isFinite(interactivePixelRatio) && interactivePixelRatio > 0 ? interactivePixelRatio : 1
  const atap = Number.isFinite(ceiling) && ceiling > 0 ? ceiling : dpr
  const anggaran = Math.sqrt(BODY3D_REFINE_MAX_RENDER_PIXELS / (width * height))
  return Math.max(dasar, Math.min(dpr, atap, Math.max(dasar, anggaran)))
}

/**
 * Langit-langit berikutnya setelah satu frame halus terukur.
 *
 * Turun cepat, naik pelan: perangkat yang tersengal harus segera berhenti
 * tersengal, sedangkan perangkat yang lapang tidak perlu buru-buru dinaikkan.
 * Tidak pernah turun di bawah rasio interaktif, karena di bawah itu
 * penghalusan tidak lagi punya arti.
 */
export function body3dNextRefineCeiling(
  ceiling: number,
  lastFrameMs: number,
  interactivePixelRatio: number,
  devicePixelRatio: number,
): number {
  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1
  const dasar = Number.isFinite(interactivePixelRatio) && interactivePixelRatio > 0 ? interactivePixelRatio : 1
  const kini = Number.isFinite(ceiling) && ceiling > 0 ? ceiling : dpr
  if (!Number.isFinite(lastFrameMs) || lastFrameMs < 0) return kini
  if (lastFrameMs > BODY3D_REFINE_FRAME_BUDGET_MS) return Math.max(dasar, kini - 0.5)
  if (lastFrameMs < BODY3D_REFINE_FRAME_BUDGET_MS / 2) return Math.min(dpr, kini + 0.5)
  return kini
}

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
