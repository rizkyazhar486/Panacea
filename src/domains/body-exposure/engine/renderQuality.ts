// Preset kualitas render + pemilihan otomatis dari frame time terukur. Murni & deterministik (tanpa DOM/Date.now()).
// Anggaran frame: 60 FPS ≈ 16,67 ms, 30 FPS ≈ 33,33 ms.

export type QualityPreset = 'ultra' | 'balanced' | 'performance'
export type QualityChoice = QualityPreset | 'auto'

export interface QualitySettings {
  /** batas atas devicePixelRatio yang dipakai renderer */
  maxPixelRatio: number
  /** pencahayaan lingkungan (IBL) studio netral */
  environment: boolean
  /** antialiasing MSAA (ditentukan saat renderer dibuat) */
  antialias: boolean
}

export const QUALITY_PRESETS: Record<QualityPreset, QualitySettings> = {
  ultra: { maxPixelRatio: 2, environment: true, antialias: true },
  balanced: { maxPixelRatio: 1.5, environment: true, antialias: true },
  performance: { maxPixelRatio: 1, environment: false, antialias: true },
}

export const FRAME_BUDGET_MS = { fps60: 1000 / 60, fps30: 1000 / 30 } as const

export interface FrameStats { count: number; meanMs: number; p95Ms: number; p99Ms: number; fpsMean: number; fps1Low: number }

/** Statistik frame time (ms). Sampel tidak valid (≤0, NaN, >1000 ms = tab tersembunyi) dibuang; <10 sampel → null. */
export function frameStats(samplesMs: readonly number[]): FrameStats | null {
  const v = samplesMs.filter((x) => Number.isFinite(x) && x > 0 && x <= 1000).slice().sort((a, b) => a - b)
  if (v.length < 10) return null
  const q = (p: number) => v[Math.min(v.length - 1, Math.ceil(p * v.length) - 1)]
  const mean = v.reduce((a, b) => a + b, 0) / v.length
  return { count: v.length, meanMs: mean, p95Ms: q(0.95), p99Ms: q(0.99), fpsMean: 1000 / mean, fps1Low: 1000 / q(0.99) }
}

/**
 * Preset otomatis dari statistik frame terukur pada preset yang sedang aktif.
 * Turun satu tingkat bila p95 > anggaran 30 FPS; naik satu tingkat hanya bila p95 jauh di bawah anggaran 60 FPS
 * (≤ 60 %) agar tidak berosilasi. Tanpa statistik → tetap.
 */
export function nextAutoPreset(current: QualityPreset, stats: FrameStats | null): QualityPreset {
  if (!stats) return current
  const order: QualityPreset[] = ['performance', 'balanced', 'ultra']
  const i = order.indexOf(current)
  if (stats.p95Ms > FRAME_BUDGET_MS.fps30 && i > 0) return order[i - 1]
  if (stats.p95Ms <= FRAME_BUDGET_MS.fps60 * 0.6 && i < order.length - 1) return order[i + 1]
  return current
}

/** Preset awal sebelum ada pengukuran: layar sempit / DPR tinggi mulai dari balanced. Input tidak valid → performance. */
export function initialPreset(viewportWidth: number, devicePixelRatio: number): QualityPreset {
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0 || !Number.isFinite(devicePixelRatio) || devicePixelRatio <= 0) return 'performance'
  return viewportWidth < 768 ? 'balanced' : 'ultra'
}

/** Pixel ratio efektif: min(DPR perangkat, batas preset); DPR tidak valid → 1. */
export function effectivePixelRatio(devicePixelRatio: number, preset: QualityPreset): number {
  const d = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1
  return Math.min(d, QUALITY_PRESETS[preset].maxPixelRatio)
}
