// Siklus jantung PROSEDURAL (ilustratif): volume ventrikel dan atrium sepanjang satu denyut dari model matematis sederhana (siklus Wiggers dengan
// durasi sistol ∝ √RR, Bazett). BUKAN data pasien, BUKAN hasil pencitraan, BUKAN divalidasi secara klinis: nilai bawaan adalah kisaran buku teks dewasa
// untuk ilustrasi (EDV 120 mL, ESV 50 mL, atrium 30–65 mL). Murni & deterministik: waktu disuntikkan pemanggil. Fail closed pada masukan tidak sah.

export const HR_MIN = 30
export const HR_MAX = 220
export const DEFAULT_HR = 70

export interface CardiacParams { hrBpm: number; edvMl: number; esvMl: number; atriumMinMl: number; atriumMaxMl: number }
export const DEFAULT_PARAMS: CardiacParams = { hrBpm: DEFAULT_HR, edvMl: 120, esvMl: 50, atriumMinMl: 30, atriumMaxMl: 65 }

export type CardiacPhase = 'isovolumic_contraction' | 'ejection' | 'isovolumic_relaxation' | 'rapid_filling' | 'diastasis' | 'atrial_systole'
export const PHASE_LABEL: Record<CardiacPhase, string> = {
  isovolumic_contraction: 'Isovolumic contraction', ejection: 'Ejection', isovolumic_relaxation: 'Isovolumic relaxation',
  rapid_filling: 'Rapid filling', diastasis: 'Diastasis', atrial_systole: 'Atrial systole',
}

export interface CardiacState {
  phase: CardiacPhase
  /** posisi dalam siklus [0,1) */
  cycle01: number
  ventricleMl: number
  atriumMl: number
  /** skala isotropik relatif akhir-diastol (ventrikel) dan relatif atrium maksimum, dari akar pangkat tiga volume */
  ventricleScale: number
  atriumScale: number
  /** skala seluruh jantung (empat ruang, volume darah rata-rata ventrikel + atrium) relatif volume maksimum siklus */
  wholeHeartScale: number
  ejectionFraction: number
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const cos01 = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(Math.max(x, 0), 1))   // 0→1 mulus, turunan nol di kedua ujung

export function validateParams(p: CardiacParams): string | null {
  if (!isNum(p.hrBpm) || p.hrBpm < HR_MIN || p.hrBpm > HR_MAX) return `heart rate must be ${HR_MIN}-${HR_MAX} bpm`
  if (![p.edvMl, p.esvMl, p.atriumMinMl, p.atriumMaxMl].every((v) => isNum(v) && v > 0)) return 'volumes must be positive numbers'
  if (p.esvMl >= p.edvMl) return 'end-systolic volume must be below end-diastolic volume'
  if (p.atriumMinMl >= p.atriumMaxMl) return 'minimum atrial volume must be below the maximum'
  return null
}

/** Durasi fase (s) untuk satu siklus; jumlahnya persis RR. */
export function phaseDurations(hrBpm: number): Record<CardiacPhase, number> {
  const rr = 60 / hrBpm
  const ts = Math.min(0.34 * Math.sqrt(rr), 0.6 * rr)     // sistol mekanik (Bazett), tak lebih dari 60 % siklus
  const iso = 0.1 * ts, ir = 0.12 * ts
  const d = rr - ts - ir
  return { isovolumic_contraction: iso, ejection: ts - iso, isovolumic_relaxation: ir, rapid_filling: 0.35 * d, diastasis: 0.45 * d, atrial_systole: 0.2 * d }
}
const ORDER: CardiacPhase[] = ['isovolumic_contraction', 'ejection', 'isovolumic_relaxation', 'rapid_filling', 'diastasis', 'atrial_systole']

export function cardiacStateAt(p: CardiacParams, timeS: number): CardiacState {
  const err = validateParams(p); if (err) throw new RangeError(err)
  if (!isNum(timeS)) throw new RangeError('time must be finite')
  const rr = 60 / p.hrBpm
  const t = ((timeS % rr) + rr) % rr
  const dur = phaseDurations(p.hrBpm)
  let phase: CardiacPhase = 'atrial_systole', local = 0, acc = 0
  for (const k of ORDER) { if (t < acc + dur[k] || k === 'atrial_systole') { phase = k; local = dur[k] > 0 ? (t - acc) / dur[k] : 0; break } acc += dur[k] }
  const sv = p.edvMl - p.esvMl
  // ventrikel: EDV → (isovolumik) → ESV oleh ejeksi → ESV → pengisian cepat 0,7 SV → diastasis 0,9 SV → sistol atrium 1,0 SV
  let v: number
  switch (phase) {
    case 'isovolumic_contraction': v = p.edvMl; break
    case 'ejection': v = p.edvMl - sv * cos01(local); break
    case 'isovolumic_relaxation': v = p.esvMl; break
    case 'rapid_filling': v = p.esvMl + sv * 0.7 * cos01(local); break
    case 'diastasis': v = p.esvMl + sv * (0.7 + 0.2 * cos01(local)); break
    default: v = p.esvMl + sv * (0.9 + 0.1 * cos01(local))
  }
  // atrium (0 = minimum, 1 = maksimum): reservoar saat ejeksi dan relaksasi, pengosongan cepat, diastasis sedikit naik, sistol atrium mengosongkan
  let a: number
  switch (phase) {
    case 'isovolumic_contraction': a = 0; break
    case 'ejection': a = 0.8 * cos01(local); break
    case 'isovolumic_relaxation': a = 0.8 + 0.2 * cos01(local); break
    case 'rapid_filling': a = 1 - 0.5 * cos01(local); break
    case 'diastasis': a = 0.5 + 0.1 * cos01(local); break
    default: a = 0.6 - 0.6 * cos01(local)
  }
  const am = p.atriumMinMl + (p.atriumMaxMl - p.atriumMinMl) * a
  const whole = (v + am) / (p.edvMl + p.atriumMaxMl)
  return {
    phase, cycle01: t / rr, ventricleMl: v, atriumMl: am, ventricleScale: Math.cbrt(v / p.edvMl), atriumScale: Math.cbrt(am / p.atriumMaxMl),
    wholeHeartScale: Math.cbrt(Math.min(whole, 1)), ejectionFraction: sv / p.edvMl,
  }
}
