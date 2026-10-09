/**
 * Reference Change Value (RCV): ambang perubahan antara dua hasil serial satu analit yang melebihi variasi analitik
 * + variasi biologis within-subject. Rumus: Fraser CG, "Biological Variation: From Principles to Practice" (AACC, 2001):
 * RCV = √2 · Z · √(CVa² + CVi²). Varian log-normal asimetris: Fokkema et al., Clin Chem 2009 (RCV log-normal) (σ² = ln(1+CVa²)+ln(1+CVi²)).
 * CVa/CVi TIDAK ditanam di sini: keduanya harus diberikan pemanggil dari sumber terverifikasi (mis. EFLM Biological
 * Variation Database) dan alatnya sendiri — nilai per-analit karangan dilarang (CLAUDE.md §8). Alat bantu interpretasi,
 * bukan diagnosis: perubahan melewati RCV berarti "melebihi variasi yang diharapkan", bukan "sakit".
 */
import { inRange, isFiniteNumber } from './inputs'

/** Z dua-sisi 95% dan satu-sisi 95% (Fraser). */
export const RCV_Z = { bidirectional95: 1.96, unidirectional95: 1.65 } as const
export const CV_PERCENT_RANGE = { min: 0, max: 100 } as const

export type RcvInput = Readonly<{ cvaPercent: number; cviPercent: number; z?: number }>
export type RcvResult =
  | { ok: true; data: { rcvPercent: number; lognormalUpPercent: number; lognormalDownPercent: number } }
  | { ok: false; reason: string }

export function referenceChangeValue(input: RcvInput): RcvResult {
  const { cvaPercent, cviPercent, z = RCV_Z.bidirectional95 } = input
  if (!inRange(cvaPercent, CV_PERCENT_RANGE.min, CV_PERCENT_RANGE.max)) return { ok: false, reason: 'Analytical CV must be 0–100 %' }
  if (!inRange(cviPercent, CV_PERCENT_RANGE.min, CV_PERCENT_RANGE.max)) return { ok: false, reason: 'Within-subject CV must be 0–100 %' }
  if (!isFiniteNumber(z) || z <= 0) return { ok: false, reason: 'Z must be a positive finite number' }
  if (cvaPercent === 0 && cviPercent === 0) return { ok: false, reason: 'At least one CV must be above 0 %' }
  const cva = cvaPercent / 100
  const cvi = cviPercent / 100
  const rcvPercent = Math.SQRT2 * z * Math.sqrt(cvaPercent ** 2 + cviPercent ** 2)
  const sigma = Math.sqrt(Math.log1p(cva ** 2) + Math.log1p(cvi ** 2))
  const k = Math.SQRT2 * z * sigma
  return { ok: true, data: { rcvPercent, lognormalUpPercent: (Math.exp(k) - 1) * 100, lognormalDownPercent: (Math.exp(-k) - 1) * 100 } }
}

export type RcvVerdict =
  | { ok: true; data: { changePercent: number; exceedsRcv: boolean; direction: 'up' | 'down' | 'none' } }
  | { ok: false; reason: string }

/** Bandingkan dua hasil serial (satuan sama, ditegakkan pemanggil) dengan RCV log-normal asimetris. */
export function judgeSerialChange(previous: number, current: number, input: RcvInput): RcvVerdict {
  if (!isFiniteNumber(previous) || previous <= 0) return { ok: false, reason: 'Previous result must be a positive finite number' }
  if (!isFiniteNumber(current) || current <= 0) return { ok: false, reason: 'Current result must be a positive finite number' }
  const r = referenceChangeValue(input)
  if (!r.ok) return r
  const changePercent = ((current - previous) / previous) * 100
  const { lognormalUpPercent, lognormalDownPercent } = r.data
  const up = changePercent > lognormalUpPercent
  const down = changePercent < lognormalDownPercent
  return { ok: true, data: { changePercent, exceedsRcv: up || down, direction: up ? 'up' : down ? 'down' : 'none' } }
}
