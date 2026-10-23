// Metrik kaki untuk klip WALK/RUN (blocker D7): asimetri kiri-kanan dan penilaian selip kaki terhadap kriteria eksplisit.
// Murni & deterministik. Tidak ada ambang klinis di sini: kriteria selalu diberikan pemanggil, dan satu-satunya bawaan
// (RESEARCH_FOOT_SLIDE_CRITERIA) adalah penanda teknik untuk penelitian, BUKAN nilai dari literatur dan BUKAN tervalidasi klinis.

export type AsymmetryResult =
  | { ok: true; absoluteDifference: number; relativeDifferencePercent: number | null; meanMagnitude: number }
  | { ok: false; reason: 'missing' | 'not_finite' | 'unit_mismatch' | 'frame_mismatch' }

export interface SidedValue {
  value: number | null | undefined
  unit: string
  /** Kerangka koordinat/pengukuran (mis. "pelvis-relative"); kiri dan kanan harus sama. */
  frame: string
}

/**
 * absolute_difference = |kiri − kanan|
 * relative_difference_percent = 100 · |kiri − kanan| / mean(|kiri|, |kanan|)
 * Penyebut nol (kedua sisi 0) → relatif `null` (tidak terdefinisi), bukan 0 tebakan. Data hilang, NaN/Infinity,
 * unit atau kerangka koordinat berbeda → ditolak.
 */
export function footAsymmetry(left: SidedValue | null | undefined, right: SidedValue | null | undefined): AsymmetryResult {
  if (!left || !right || left.value == null || right.value == null) return { ok: false, reason: 'missing' }
  if (typeof left.value !== 'number' || typeof right.value !== 'number' || !Number.isFinite(left.value) || !Number.isFinite(right.value)) {
    return { ok: false, reason: 'not_finite' }
  }
  if (left.unit !== right.unit) return { ok: false, reason: 'unit_mismatch' }
  if (left.frame !== right.frame) return { ok: false, reason: 'frame_mismatch' }
  const absoluteDifference = Math.abs(left.value - right.value)
  const meanMagnitude = (Math.abs(left.value) + Math.abs(right.value)) / 2
  return { ok: true, absoluteDifference, meanMagnitude, relativeDifferencePercent: meanMagnitude === 0 ? null : (100 * absoluteDifference) / meanMagnitude }
}

export interface FootSlideCriteria {
  maxRmsMm: number
  maxPeakMm: number
  minStancePhases: number
  /** Asal kriteria; wajib agar angka tidak tampak seperti standar klinis. */
  provenance: string
}

/** Penanda penelitian yang bisa diatur; dipilih agen sebagai batas kerja teknik, tidak bersumber literatur. */
export const RESEARCH_FOOT_SLIDE_CRITERIA: FootSlideCriteria = {
  maxRmsMm: 15,
  maxPeakMm: 30,
  // Satu siklus WALK/RUN tertutup memuat tepat satu fase tumpu per kaki (fase yang melintasi jahitan loop dihitung SATU kali), jadi 2 adalah
  // jumlah terbanyak yang mungkin dari satu siklus; 3 tidak pernah tercapai. Nilai 2 = kedua kaki terwakili.
  minStancePhases: 2,
  provenance: 'engineering research placeholder; not from literature; not clinically validated',
}

export interface FootSlideMeasure {
  stance_phases?: number
  stance_frames?: number
  slide_rms_mm?: number
  slide_max_mm?: number
}

export type FootSlideVerdict =
  | { status: 'within'; criteria: FootSlideCriteria }
  | { status: 'exceeds'; criteria: FootSlideCriteria; failed: Array<'rms' | 'peak'> }
  | { status: 'unmeasurable'; criteria: FootSlideCriteria; reason: 'invalid_criteria' | 'no_stance' | 'too_few_phases' | 'insufficient_frames' | 'missing_values' }

const nonNeg = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0

/** Menilai satu ukuran selip. Statistik tipis atau data hilang = "unmeasurable", tidak pernah lulus/gagal tebakan. */
export function evaluateFootSlide(m: FootSlideMeasure | null | undefined, criteria: FootSlideCriteria): FootSlideVerdict {
  if (!nonNeg(criteria?.maxRmsMm) || !nonNeg(criteria.maxPeakMm) || !Number.isInteger(criteria.minStancePhases) || criteria.minStancePhases < 1 || typeof criteria.provenance !== 'string' || !criteria.provenance.trim()) {
    return { status: 'unmeasurable', criteria, reason: 'invalid_criteria' }
  }
  const phases = m?.stance_phases
  if (!nonNeg(phases) || phases === 0) return { status: 'unmeasurable', criteria, reason: 'no_stance' }
  if (!Number.isInteger(phases)) return { status: 'unmeasurable', criteria, reason: 'too_few_phases' }
  if (phases < criteria.minStancePhases) return { status: 'unmeasurable', criteria, reason: 'too_few_phases' }
  // Preserve the established error classification when slide values themselves are invalid.
  if (!nonNeg(m?.slide_rms_mm) || !nonNeg(m?.slide_max_mm)) return { status: 'unmeasurable', criteria, reason: 'missing_values' }
  // Only award an assessment when sample counts are sufficient; never invent a stance.
  if (!Number.isInteger(m?.stance_frames) || (m?.stance_frames ?? 0) < 3 * phases) {
    return { status: 'unmeasurable', criteria, reason: 'insufficient_frames' }
  }
  const failed: Array<'rms' | 'peak'> = []
  if (m.slide_rms_mm > criteria.maxRmsMm) failed.push('rms')
  if (m.slide_max_mm > criteria.maxPeakMm) failed.push('peak')
  return failed.length ? { status: 'exceeds', criteria, failed } : { status: 'within', criteria }
}
