// Preset kamera anatomis + transisi halus berbasis waktu. Murni (tanpa three.js/DOM): vektor sebagai [x, y, z].
// Frame three.js dari GLB (glTF Y-up dari frame kanonik): +X = kiri subjek, +Y = superior, +Z = anterior.

export type Vec3 = [number, number, number]
export type AnatomicalView = 'anterior' | 'posterior' | 'left' | 'right' | 'superior' | 'inferior' | 'three-quarter'

export const ANATOMICAL_VIEWS: AnatomicalView[] = ['anterior', 'posterior', 'left', 'right', 'superior', 'inferior', 'three-quarter']

// "Atas" kamera SELALU +Y: OrbitControls mengunci kerangka Y-up saat dibuat, sehingga up lain membuat seretan memutar
// subjek. Superior/inferior diambil 3° dari kutub (bukan tepat di kutub): anterior tetap di bawah layar, tanpa degenerasi.
const POLE = (3 * Math.PI) / 180
const UP: Vec3 = [0, 1, 0]
/** Arah dari target ke kamera (satuan) per tampilan. */
const DIRS: Record<AnatomicalView, { dir: Vec3; up: Vec3 }> = {
  anterior: { dir: [0, 0, 1], up: UP },
  posterior: { dir: [0, 0, -1], up: UP },
  left: { dir: [1, 0, 0], up: UP },      // melihat sisi kiri subjek
  right: { dir: [-1, 0, 0], up: UP },
  superior: { dir: [0, Math.cos(POLE), Math.sin(POLE)], up: UP },   // dari atas kepala, sedikit ke anterior
  inferior: { dir: [0, -Math.cos(POLE), Math.sin(POLE)], up: UP },
  'three-quarter': { dir: [Math.SQRT1_2 * 0.82, 0.25, Math.SQRT1_2 * 0.82], up: UP },  // anterolateral kiri, sedikit dari atas
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

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const crossV = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]

/** Putar v mengelilingi sumbu satuan k sejauh ang (rumus Rodrigues). */
function rotate(v: Vec3, k: Vec3, ang: number): Vec3 {
  const c = Math.cos(ang), s = Math.sin(ang), kv = crossV(k, v), kd = dot(k, v) * (1 - c)
  return [v[0] * c + kv[0] * s + k[0] * kd, v[1] * c + kv[1] * s + k[1] * kd, v[2] * c + kv[2] * s + k[2] * kd]
}

/**
 * Arah antara a dan b (satuan) pada fraksi k, menyusuri busur terpendek. Arah berlawanan (antipodal) diputar
 * mengelilingi sumbu vertikal (orbit horizontal), atau sumbu X bila a hampir vertikal — tidak pernah lewat pusat.
 */
export function slerpDir(a: Vec3, b: Vec3, k: number): Vec3 {
  const an = norm(a), bn = norm(b)
  const ang = Math.acos(Math.min(1, Math.max(-1, dot(an, bn))))
  if (ang < 1e-6) return bn
  let axis = crossV(an, bn)
  if (Math.hypot(...axis) < 1e-6) axis = Math.abs(an[1]) < 0.99 ? [0, 1, 0] : [1, 0, 0]  // antipodal
  return norm(rotate(an, norm(axis), ang * k))
}

/** Majukan transisi dengan dt detik waktu nyata; mengembalikan pose saat ini & apakah selesai. dt tidak valid → ditolak. */
export function stepTween(tw: CameraTween, dtS: number): { ok: true; pose: CameraPose; tween: CameraTween; done: boolean } | { ok: false; error: string } {
  if (!Number.isFinite(dtS) || dtS < 0) return { ok: false, error: 'dt must be a finite, non-negative number' }
  if (!(tw.durationS > 0)) return { ok: false, error: 'duration must be positive' }
  const elapsedS = Math.min(tw.elapsedS + Math.min(dtS, 0.1), tw.durationS)
  const k = smootherstep(elapsedS / tw.durationS)
  const lerp = (a: Vec3, b: Vec3): Vec3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]
  // kamera mengorbit target: arah di busur bola, jari-jari & target diinterpolasi — tidak menembus subjek
  const target = lerp(tw.from.target, tw.to.target)
  const o0 = sub(tw.from.position, tw.from.target), o1 = sub(tw.to.position, tw.to.target)
  const r0 = Math.hypot(...o0), r1 = Math.hypot(...o1)
  const dir = r0 > 1e-9 && r1 > 1e-9 ? slerpDir(o0, o1, k) : norm(o1)
  const r = r0 + (r1 - r0) * k
  const position: Vec3 = [target[0] + dir[0] * r, target[1] + dir[1] * r, target[2] + dir[2] * r]
  return { ok: true, pose: { position, target, up: UP }, tween: { ...tw, elapsedS }, done: elapsedS >= tw.durationS }
}
