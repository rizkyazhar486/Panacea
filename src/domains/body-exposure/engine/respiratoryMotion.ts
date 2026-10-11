// Model gerak napas dari CT 4D nyata pasien LAIN (TCIA 4D-Lung), dipindahkan sebagai skala dan pergeseran paru. Murni & deterministik:
// tanpa DOM, tanpa Date.now(); waktu disuntikkan pemanggil. Fail closed: sumber, lisensi, kelas kebenaran, 10 fase dan angka wajar wajib ada,
// bila tidak model ditolak (tidak ada nilai tebakan). Ini BUKAN gerak napas tubuh yang ditampilkan.

export type RespiratoryTruthClass = 'measured-transferred'
export interface RespiratoryPhase {
  phaseIndex: number
  volumeMl: number
  /** skala paru relatif akhir ekspirasi pada sumbu kanonik: [kiri-kanan (+X kiri), anterior-posterior (Y), superior-inferior (+Z superior)] */
  scale: [number, number, number]
  /** pergeseran pusat paru (mm) pada sumbu yang sama, relatif akhir ekspirasi */
  centroidShiftMm: [number, number, number]
}
export interface RespiratoryModel {
  truthClass: RespiratoryTruthClass
  label: string
  source: string
  licence: string
  citation: string
  limitations: string
  cases: number
  phases: RespiratoryPhase[]
}
export type ParseRespiratory = { ok: true; model: RespiratoryModel } | { ok: false; error: string }

export const PHASE_COUNT = 10
export const SCALE_MIN = 0.85
export const SCALE_MAX = 1.25
export const SHIFT_MAX_MM = 60
/** periode napas bawaan hanya pengaturan pemutaran; CT 4D berfase tidak memuatnya */
export const DEFAULT_BREATH_PERIOD_S = 4

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const triple = (v: unknown): v is [number, number, number] => Array.isArray(v) && v.length === 3 && v.every(isNum)

export function parseRespiratoryModel(raw: unknown): ParseRespiratory {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'model must be an object' }
  const r = raw as Record<string, unknown>
  if (r.schema !== 1 || r.kind !== 'respiratory_motion_model') return { ok: false, error: 'unsupported schema or kind' }
  if (r.truth_class !== 'measured-transferred') return { ok: false, error: 'truth_class must be "measured-transferred"' }
  for (const k of ['label', 'source', 'licence', 'citation', 'limitations'] as const) if (!isStr(r[k])) return { ok: false, error: `${k} missing` }
  if (!Array.isArray(r.cases) || r.cases.length < 1) return { ok: false, error: 'at least one case is required' }
  if (!Array.isArray(r.phases) || r.phases.length !== PHASE_COUNT) return { ok: false, error: `exactly ${PHASE_COUNT} phases are required` }
  const phases: RespiratoryPhase[] = []
  for (let i = 0; i < PHASE_COUNT; i++) {
    const p = r.phases[i] as Record<string, unknown>
    if (!p || typeof p !== 'object') return { ok: false, error: `phase ${i} is not an object` }
    if (p.phase_index !== i) return { ok: false, error: `phase ${i} is out of order` }
    if (!isNum(p.volume_ml) || p.volume_ml <= 0) return { ok: false, error: `phase ${i}: volume must be positive` }
    const [lr, ap, si] = (triple(p.scale_lr_ap_si) ? p.scale_lr_ap_si : [NaN, NaN, NaN]) as [number, number, number]
    for (const s of [lr, ap, si]) if (!isNum(s) || s < SCALE_MIN || s > SCALE_MAX) return { ok: false, error: `phase ${i}: scale outside ${SCALE_MIN}-${SCALE_MAX}` }
    if (!triple(p.centroid_shift_mm_lr_ap_si) || p.centroid_shift_mm_lr_ap_si.some((x) => Math.abs(x) > SHIFT_MAX_MM)) return { ok: false, error: `phase ${i}: centroid shift missing or beyond ${SHIFT_MAX_MM} mm` }
    // sumber: (lr, ap, si) citra → kanonik (+X kiri, Y, +Z superior): lr dan si searah sumbu kanonik, ap dipakai pada sumbu Y apa adanya
    phases.push({ phaseIndex: i, volumeMl: p.volume_ml, scale: [lr, ap, si], centroidShiftMm: p.centroid_shift_mm_lr_ap_si as [number, number, number] })
  }
  return { ok: true, model: { truthClass: 'measured-transferred', label: r.label as string, source: r.source as string, licence: r.licence as string, citation: r.citation as string, limitations: r.limitations as string, cases: r.cases.length, phases } }
}

export interface RespirationSample { scale: [number, number, number]; centroidShiftMm: [number, number, number]; volumeMl: number }

/** Hermite kubik periodik (Catmull-Rom) antar 10 fase, dijepit ke [min, maks] kedua fase tetangga agar tidak melampaui data. cycle01 dibungkus ke [0, 1). */
export function sampleRespiration(model: RespiratoryModel, cycle01: number): RespirationSample {
  if (!isNum(cycle01)) throw new RangeError('cycle must be a finite number')
  const n = PHASE_COUNT
  const t = (((cycle01 % 1) + 1) % 1) * n
  const i1 = Math.floor(t) % n, f = t - Math.floor(t)
  const i0 = (i1 + n - 1) % n, i2 = (i1 + 1) % n, i3 = (i1 + 2) % n
  const ph = model.phases
  const cr = (a: number, b: number, c: number, d: number) => {
    const v = 0.5 * ((2 * b) + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f)
    return Math.min(Math.max(v, Math.min(b, c)), Math.max(b, c))
  }
  const axis = (pick: (p: RespiratoryPhase) => number) => cr(pick(ph[i0]), pick(ph[i1]), pick(ph[i2]), pick(ph[i3]))
  return {
    scale: [axis((p) => p.scale[0]), axis((p) => p.scale[1]), axis((p) => p.scale[2])],
    centroidShiftMm: [axis((p) => p.centroidShiftMm[0]), axis((p) => p.centroidShiftMm[1]), axis((p) => p.centroidShiftMm[2])],
    volumeMl: axis((p) => p.volumeMl),
  }
}

/** Ciclus [0,1) dari waktu pemutaran (s). dt dan periode disuntikkan; periode harus positif. */
export function cycleAt(timeS: number, periodS: number = DEFAULT_BREATH_PERIOD_S): number {
  if (!isNum(timeS) || !isNum(periodS) || periodS <= 0) throw new RangeError('time must be finite and period positive')
  return (((timeS / periodS) % 1) + 1) % 1
}
