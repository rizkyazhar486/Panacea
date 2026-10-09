// Preset kamera anatomis + transisi halus berbasis waktu. Murni (tanpa three.js/DOM): vektor sebagai [x, y, z].
// Frame three.js dari GLB (glTF Y-up dari frame kanonik): +X = kiri subjek, +Y = superior, +Z = anterior.

export type Vec3 = [number, number, number]
export type AnatomicalView = 'anterior' | 'posterior' | 'left' | 'right' | 'superior' | 'inferior' | 'three-quarter'

export const ANATOMICAL_VIEWS: AnatomicalView[] = ['anterior', 'posterior', 'left', 'right', 'superior', 'inferior', 'three-quarter']

/** Arah dari target ke kamera (satuan) dan vektor "atas" layar per tampilan. */
const DIRS: Record<AnatomicalView, { dir: Vec3; up: Vec3 }> = {
  anterior: { dir: [0, 0, 1], up: [0, 1, 0] },
  posterior: { dir: [0, 0, -1], up: [0, 1, 0] },
  left: { dir: [1, 0, 0], up: [0, 1, 0] },      // melihat sisi kiri subjek
  right: { dir: [-1, 0, 0], up: [0, 1, 0] },
  superior: { dir: [0, 1, 0], up: [0, 0, -1] },  // dari atas kepala; anterior di bawah layar
  inferior: { dir: [0, -1, 0], up: [0, 0, 1] },
  'three-quarter': { dir: [Math.SQRT1_2 * 0.82, 0.25, Math.SQRT1_2 * 0.82], up: [0, 1, 0] },  // anterolateral kiri, sedikit dari atas
}

export interface CameraPose { position: Vec3; target: Vec3; up: Vec3 }

const finite = (v: readonly number[]) => v.length === 3 && v.every(Number.isFinite)
const norm = (v: Vec3): Vec3 => { const l = Math.hypot(...v); return [v[0] / l, v[1] / l, v[2] / l] }

/**
 * Pose kamera agar kotak (center, size) muat penuh pada FOV vertikal vfovDeg dan aspect, dengan margin.
 * Input tidak valid → null (fail closed).
 */
export function viewPose(view: AnatomicalView, center: Vec3, size: Vec3, vfovDeg: number, aspect: number, margin = 1.15): CameraPose | null {
  if (!DIRS[view] || !finite(center) || !finite(size) || size.some((s) => s < 0) || !(vfovDeg > 0 && vfovDeg < 180) || !(aspect > 0)) return null
  const { dir, up } = DIRS[view]
  const d = norm(dir)
  const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
  const right = norm(cross(up, d)), screenUp = cross(d, right)
  // panjang proyeksi kotak sejajar sumbu pada sumbu a: |a_x|·s_x + |a_y|·s_y + |a_z|·s_z
  const extent = (a: Vec3) => Math.abs(a[0]) * size[0] + Math.abs(a[1]) * size[1] + Math.abs(a[2]) * size[2]
  const vfov = (vfovDeg * Math.PI) / 180, hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect)
  const dist = Math.max(extent(screenUp) / 2 / Math.tan(vfov / 2), extent(right) / 2 / Math.tan(hfov / 2)) * margin + extent(d) / 2
  return { position: [center[0] + d[0] * dist, center[1] + d[1] * dist, center[2] + d[2] * dist], target: [...center] as Vec3, up: [...up] as Vec3 }
}

/** Kurva halus (smootherstep): mulai & berhenti tanpa lompatan kecepatan. */
export function smootherstep(t: number): number {
  const x = Math.min(Math.max(t, 0), 1)
  return x * x * x * (x * (x * 6 - 15) + 10)
}

export interface CameraTween { from: CameraPose; to: CameraPose; elapsedS: number; durationS: number }

/** Majukan transisi dengan dt detik waktu nyata; mengembalikan pose saat ini & apakah selesai. dt tidak valid → ditolak. */
export function stepTween(tw: CameraTween, dtS: number): { ok: true; pose: CameraPose; tween: CameraTween; done: boolean } | { ok: false; error: string } {
  if (!Number.isFinite(dtS) || dtS < 0) return { ok: false, error: 'dt must be a finite, non-negative number' }
  if (!(tw.durationS > 0)) return { ok: false, error: 'duration must be positive' }
  const elapsedS = Math.min(tw.elapsedS + Math.min(dtS, 0.1), tw.durationS)
  const k = smootherstep(elapsedS / tw.durationS)
  const lerp = (a: Vec3, b: Vec3): Vec3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]
  const upRaw = lerp(tw.from.up, tw.to.up)
  const up = Math.hypot(...upRaw) > 1e-6 ? norm(upRaw) : tw.to.up
  return { ok: true, pose: { position: lerp(tw.from.position, tw.to.position), target: lerp(tw.from.target, tw.to.target), up }, tween: { ...tw, elapsedS }, done: elapsedS >= tw.durationS }
}
