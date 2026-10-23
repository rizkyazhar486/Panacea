// Longevity: data, skor pilar dan usia biologis sebagai fungsi murni. Angka bawaan hanya menjaga rumus terdefinisi;
// usia, jenis kelamin, tidur, merokok dan alkohol baru dihitung bila pengguna (atau profil/perangkat) benar-benar
// mengisinya, dicatat di `Isi`. Tanpa itu, norma usia dan pilar tidur/gaya hidup tidak ikut menghasilkan skor.

export interface LongevityData {
  age: number; g: 'M' | 'F'
  vo2: number; grip: number; chair30: number; balance: number
  whr: number; rhr: number; sleepH: number
  smoke: 'never' | 'former' | 'current'; alcohol: 0 | 1 | 2 // none/moderate/heavy
  protein: boolean; social: boolean; purpose: boolean
  hba1c: number; ldl: number; crp: number; sbp: number
  tests: Record<string, string> // test id -> last done ISO date
}
export const DEF: LongevityData = {
  age: 30, g: 'M', vo2: 0, grip: 0, chair30: 0, balance: 0,
  whr: 0, rhr: 0, sleepH: 7, smoke: 'never', alcohol: 0,
  protein: false, social: false, purpose: false,
  hba1c: 0, ldl: 0, crp: 0, sbp: 0, tests: {},
}

export type KunciIsi = 'age' | 'g' | 'sleepH' | 'smoke' | 'alcohol'
export type Isi = Partial<Record<KunciIsi, true>>
const KUNCI_ISI: readonly KunciIsi[] = ['age', 'g', 'sleepH', 'smoke', 'alcohol']

const sahIsi: Record<KunciIsi, (v: unknown) => boolean> = {
  age: (v) => typeof v === 'number' && Number.isFinite(v) && v > 0,
  g: (v) => v === 'M' || v === 'F',
  sleepH: (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0,
  smoke: (v) => v === 'never' || v === 'former' || v === 'current',
  alcohol: (v) => v === 0 || v === 1 || v === 2,
}

/**
 * Baca penanda "diisi" dari simpanan. Format baru menyimpan `isi`. Format lama tidak punya penanda dan
 * menyimpan angka bawaan; di sana hanya nilai yang berbeda dari angka bawaan dipercaya sebagai isian.
 */
export function bacaIsi(mentah: unknown): Isi {
  const isi: Isi = {}
  if (!mentah || typeof mentah !== 'object' || Array.isArray(mentah)) return isi
  // Hanya properti milik sendiri yang dibaca: properti warisan tidak pernah dipercaya.
  const milik = (o: object, k: string): unknown => (Object.prototype.hasOwnProperty.call(o, k) ? (o as Record<string, unknown>)[k] : undefined)
  const tersimpan = milik(mentah, 'isi')
  if (tersimpan && typeof tersimpan === 'object' && !Array.isArray(tersimpan)) {
    for (const k of KUNCI_ISI) if (milik(tersimpan, k) === true && sahIsi[k](milik(mentah, k))) isi[k] = true
    return isi
  }
  for (const k of KUNCI_ISI) { const v = milik(mentah, k); if (sahIsi[k](v) && v !== DEF[k]) isi[k] = true }
  return isi
}

/** Tandai (atau cabut) penanda sesuai perubahan: nilai sah = diisi; kosong/tak sah = belum diisi. */
export function tandai(cur: Isi, patch: Partial<Record<KunciIsi, unknown>>): Isi {
  const isi: Isi = { ...cur }
  for (const k of KUNCI_ISI) {
    if (!Object.prototype.hasOwnProperty.call(patch, k)) continue
    if (sahIsi[k](patch[k])) isi[k] = true
    else delete isi[k]
  }
  return isi
}

/** Skor komposit butuh minimal 4 pilar terisi DAN usia serta jenis kelamin yang nyata. */
export function hitungSkor(d: LongevityData, isi: Isi): { score: number | null; bAge: number | null; kurang: string[] } {
  const kurang: string[] = []
  if (!isi.age) kurang.push('age')
  if (!isi.g) kurang.push('sex')
  const terisi = pillarsOf(d, isi).filter((p) => p.score > 0)
  const score = terisi.length >= 4 && kurang.length === 0
    ? Math.round(terisi.reduce((s, p) => s + p.score * p.weight, 0) / terisi.reduce((s, p) => s + p.weight, 0))
    : null
  return { score, bAge: score != null ? bioAge(d, score) : null, kurang }
}

// ── Pillar scoring (0-100 each). Age-adjusted where the evidence says so. ────
export interface Pillar {
  id: string; emoji: string; name: string; why: string
  value: number; unit: string; score: number
  target: string; weight: number
}
export function pillarsOf(d: LongevityData, isi: Isi): Pillar[] {
  // Norma usia dan jenis kelamin hanya berlaku bila keduanya benar-benar diisi, bukan angka bawaan.
  const norma = !!(isi.age && isi.g)
  const M = d.g === 'M'
  // VO2max: strongest single predictor (Mandsager 2018). Age-adjusted "good".
  const vo2Good = (M ? 46 : 40) - Math.max(0, d.age - 25) * 0.35
  const vo2Score = norma && d.vo2 > 0 ? Math.min(100, (d.vo2 / vo2Good) * 75) : 0
  // Grip: PURE study. Norm ≈ 46kg M / 29kg F young adult.
  const gripNorm = (M ? 46 : 29) - Math.max(0, d.age - 30) * 0.25
  const gripScore = norma && d.grip > 0 ? Math.min(100, (d.grip / gripNorm) * 80) : 0
  // Chair stand 30s (Rikli & Jones): ~25 young, decreasing.
  const chairNorm = 25 - Math.max(0, d.age - 25) * 0.22
  const chairScore = norma && d.chair30 > 0 ? Math.min(100, (d.chair30 / chairNorm) * 80) : 0
  // One-leg balance: 30s+ full marks; <10s red flag (BMJ 2022 flamingo study).
  const balScore = d.balance > 0 ? Math.min(100, (d.balance / 30) * 100) : 0
  // WHR: cardiometabolic shape.
  const whrScore = norma && d.whr > 0 ? Math.max(0, Math.min(100, 100 - Math.max(0, d.whr - (M ? 0.85 : 0.75)) * 400)) : 0
  // RHR: 50-60 optimal.
  const rhrScore = d.rhr > 0 ? Math.max(0, Math.min(100, 100 - Math.max(0, d.rhr - 58) * 3.2 - Math.max(0, 42 - d.rhr) * 3)) : 0
  // Sleep: 7-8.5h sweet spot.
  const sleepScore = isi.sleepH && d.sleepH > 0 ? Math.max(0, 100 - Math.abs(d.sleepH - 7.75) * 28) : 0
  // Lifestyle bundle.
  let life = 40
  if (d.smoke === 'never') life += 30; else if (d.smoke === 'former') life += 15
  if (d.alcohol === 0) life += 10; else if (d.alcohol === 2) life -= 20
  if (d.protein) life += 7
  if (d.social) life += 7
  if (d.purpose) life += 6
  // Tanpa jawaban merokok dan alkohol, "gaya hidup" tidak dinilai (nilai awal bukan jawaban).
  const lifeScore = isi.smoke && isi.alcohol ? Math.max(0, Math.min(100, life)) : 0
  return [
    { id: 'vo2', emoji: '🫀', name: 'VO₂max', why: '#1 mortality predictor — elite vs low ≈ 5x risk difference', value: d.vo2, unit: 'ml/kg/min', score: vo2Score, target: norma ? `≥${vo2Good.toFixed(0)} for your age` : 'needs your age and sex', weight: 0.22 },
    { id: 'grip', emoji: '✊', name: 'Grip Strength', why: 'Every −5kg ≈ +16% mortality risk (PURE)', value: d.grip, unit: 'kg', score: gripScore, target: norma ? `≥${gripNorm.toFixed(0)} kg` : 'needs your age and sex', weight: 0.13 },
    { id: 'chair', emoji: '🦵', name: 'Leg Strength (Chair Stand 30s)', why: 'Predictor of mobility & independence in old age', value: d.chair30, unit: 'x', score: chairScore, target: norma ? `≥${chairNorm.toFixed(0)}x` : 'needs your age and sex', weight: 0.13 },
    { id: 'bal', emoji: '🦩', name: 'One-Leg Balance', why: '<10s at age 50+ ≈ 2x 7-yr mortality risk (BMJ)', value: d.balance, unit: 'sec', score: balScore, target: '≥30 sec', weight: 0.1 },
    { id: 'whr', emoji: '📏', name: 'Waist-Hip Ratio', why: 'Visceral fat > BMI for cardiometabolic risk', value: d.whr, unit: '', score: whrScore, target: norma ? (M ? '≤0.90' : '≤0.85') : 'needs your sex', weight: 0.1 },
    { id: 'rhr', emoji: '❤️', name: 'Resting HR', why: 'Heart efficiency; lowers with Zone 2 training', value: d.rhr, unit: 'bpm', score: rhrScore, target: '50-60 bpm', weight: 0.1 },
    { id: 'sleep', emoji: '😴', name: 'Sleep', why: 'Foundation of cellular & hormonal repair', value: d.sleepH, unit: 'hrs', score: sleepScore, target: '7-8.5 hrs', weight: 0.11 },
    { id: 'life', emoji: '🌱', name: 'Lifestyle & Social', why: 'Smoking, alcohol, protein, social connection, sense of purpose', value: lifeScore, unit: '/100', score: lifeScore, target: 'smoke-free + socially active', weight: 0.11 },
  ]
}

export function bioAge(d: LongevityData, score: number): number {
  // Heuristic: composite score 75 ≈ chronological. Each ±10 pts ≈ ∓2.5 yrs.
  let b = d.age - (score - 72) * 0.25
  // Lab sharpening (optional): each marker off-target adds years.
  if (d.hba1c > 0) b += Math.max(0, d.hba1c - 5.4) * 3
  if (d.ldl > 0) b += Math.max(0, d.ldl - 115) * 0.03
  if (d.crp > 0) b += Math.max(0, d.crp - 1) * 1.2
  if (d.sbp > 0) b += Math.max(0, d.sbp - 118) * 0.1
  return Math.max(15, Math.round(b * 10) / 10)
}
