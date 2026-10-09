// Timeline animasi rig (mis. demo ROM AAOS) dan jam animasi berbasis waktu nyata (bukan jumlah frame).
// Murni & deterministik: tanpa DOM, tanpa Date.now(); dt disuntikkan pemanggil.

export interface MotionMovement { name: string; startS: number; endS: number; note: string }
export interface MotionTimeline {
  clip: string
  fps: number
  durationS: number
  source: string
  truthClass: 'simulated'
  label: string
  movements: MotionMovement[]
}
export type ParseResult = { ok: true; timeline: MotionTimeline } | { ok: false; error: string }

export const MOTION_SPEEDS = [0.25, 0.5, 1, 2] as const
export type MotionSpeed = (typeof MOTION_SPEEDS)[number]

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0

/** Validasi timeline dari JSON terbitan pipeline. Fail closed: sumber, label & kelas kebenaran wajib ada. */
export function parseMotionTimeline(raw: unknown): ParseResult {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'timeline must be an object' }
  const r = raw as Record<string, unknown>
  if (!isStr(r.clip)) return { ok: false, error: 'clip name missing' }
  if (!isNum(r.fps) || r.fps <= 0) return { ok: false, error: 'fps must be a positive number' }
  if (!isNum(r.frames) || r.frames < 2) return { ok: false, error: 'frames must be at least 2' }
  if (!isStr(r.source)) return { ok: false, error: 'source missing' }
  if (r.truth_class !== 'simulated') return { ok: false, error: 'truth_class must be "simulated"' }
  if (!isStr(r.label)) return { ok: false, error: 'label missing' }
  if (!Array.isArray(r.movements) || r.movements.length === 0) return { ok: false, error: 'movements missing' }
  const durationS = (r.frames - 1) / r.fps
  const movements: MotionMovement[] = []
  let prevEnd = 0
  const tol = 0.5 / r.fps  // pembulatan waktu sub-frame (setengah frame) diterima, lebih dari itu ditolak
  for (const m of r.movements as unknown[]) {
    const x = (m ?? {}) as Record<string, unknown>
    if (!isStr(x.name) || !isNum(x.start_s) || !isNum(x.end_s)) return { ok: false, error: 'movement needs name, start_s, end_s' }
    if (x.end_s <= x.start_s) return { ok: false, error: `movement "${x.name}" has non-positive duration` }
    if (x.start_s < prevEnd - tol) return { ok: false, error: `movement "${x.name}" overlaps the previous one` }
    if (x.end_s > durationS + tol) return { ok: false, error: `movement "${x.name}" ends after the clip` }
    movements.push({ name: x.name, startS: x.start_s, endS: x.end_s, note: isStr(x.note) ? x.note : '' })
    prevEnd = x.end_s
  }
  return { ok: true, timeline: { clip: r.clip, fps: r.fps, durationS, source: r.source, truthClass: 'simulated', label: r.label, movements } }
}

/** Gerakan yang aktif pada waktu t (detik); null di luar semua gerakan atau bila t tidak valid. */
export function movementAt(tl: MotionTimeline, t: number): MotionMovement | null {
  if (!isNum(t)) return null
  return tl.movements.find((m) => t >= m.startS && t < m.endS) ?? null
}

export interface MotionClock { timeS: number; playing: boolean; speed: MotionSpeed; loop: boolean }

/** Majukan jam dengan dt detik waktu nyata. dt/kecepatan tidak valid → ditolak (jam tidak berubah). */
export function advanceClock(c: MotionClock, dtS: number, durationS: number): { ok: true; clock: MotionClock } | { ok: false; error: string; clock: MotionClock } {
  if (!isNum(dtS) || dtS < 0) return { ok: false, error: 'dt must be a finite, non-negative number', clock: c }
  if (!isNum(durationS) || durationS <= 0) return { ok: false, error: 'duration must be positive', clock: c }
  if (!(MOTION_SPEEDS as readonly number[]).includes(c.speed)) return { ok: false, error: 'unsupported speed', clock: c }
  if (!c.playing) return { ok: true, clock: c }
  // dt dibatasi 0,25 s: tab yang kembali aktif tidak melompat ke tengah gerakan
  let t = c.timeS + Math.min(dtS, 0.25) * c.speed
  let playing: boolean = c.playing
  if (t >= durationS) {
    if (c.loop) t %= durationS
    else { t = durationS; playing = false }
  }
  return { ok: true, clock: { ...c, timeS: t, playing } }
}

/** Posisi scrub (0..1) → waktu; nilai di luar rentang atau tidak valid dijepit / ditolak. */
export function scrubToTime(fraction: number, durationS: number): number | null {
  if (!isNum(fraction) || !isNum(durationS) || durationS <= 0) return null
  return Math.min(Math.max(fraction, 0), 1) * durationS
}
