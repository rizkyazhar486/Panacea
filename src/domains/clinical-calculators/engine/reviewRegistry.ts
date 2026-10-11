// Registri status tinjauan klinis per mesin kalkulator (kriteria Alpha C4).
// Murni: tanpa I/O. Fail closed — status "ditinjau" hanya sah bila identitas
// peninjau, tanggal ISO, dan bukti tercatat; tidak ada peninjau karangan.

export type ReviewStatus = 'PENDING_CLINICAL_REVIEW' | 'CLINICALLY_REVIEWED'

export interface ReviewEntry {
  id: string
  review_status: ReviewStatus
  clinically_reviewed: boolean
  reviewer: string | null
  reviewed_at: string | null
  evidence: string | null
}

export interface ReviewRegistry {
  entries: ReviewEntry[]
  /** Modul pembantu (bukan kalkulator) yang sengaja tidak memerlukan entri. */
  exempt: string[]
}

export interface RegistryCheck {
  ok: boolean
  errors: string[]
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const filled = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0

function validDate(s: string): boolean {
  if (!ISO_DATE.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s)
}

function checkEntry(e: ReviewEntry): string[] {
  const errs: string[] = []
  if (e.review_status === 'CLINICALLY_REVIEWED') {
    if (e.clinically_reviewed !== true) errs.push(`${e.id}: reviewed-status-flag-mismatch`)
    if (!filled(e.reviewer)) errs.push(`${e.id}: reviewer-missing`)
    if (!filled(e.reviewed_at) || !validDate(e.reviewed_at)) errs.push(`${e.id}: reviewed-at-invalid`)
    if (!filled(e.evidence)) errs.push(`${e.id}: evidence-missing`)
  } else if (e.review_status === 'PENDING_CLINICAL_REVIEW') {
    if (e.clinically_reviewed !== false) errs.push(`${e.id}: pending-status-flag-mismatch`)
    if (e.reviewer !== null || e.reviewed_at !== null || e.evidence !== null) {
      errs.push(`${e.id}: pending-must-not-carry-review-fields`)
    }
  } else {
    errs.push(`${e.id}: unknown-status`)
  }
  return errs
}

/** Bandingkan registri dengan daftar mesin nyata (nama berkas tanpa ekstensi). */
export function checkReviewRegistry(reg: ReviewRegistry, engineIds: readonly string[]): RegistryCheck {
  const errors: string[] = []
  const seen = new Set<string>()
  for (const e of reg.entries) {
    if (!filled(e.id)) { errors.push('entry-id-blank'); continue }
    if (seen.has(e.id)) errors.push(`${e.id}: duplicate-entry`)
    seen.add(e.id)
    errors.push(...checkEntry(e))
  }
  const exempt = new Set(reg.exempt)
  for (const id of engineIds) {
    if (!seen.has(id) && !exempt.has(id)) errors.push(`${id}: engine-without-review-entry`)
  }
  const known = new Set(engineIds)
  for (const id of seen) if (!known.has(id)) errors.push(`${id}: entry-without-engine`)
  for (const id of exempt) {
    if (!known.has(id)) errors.push(`${id}: exempt-without-engine`)
    if (seen.has(id)) errors.push(`${id}: exempt-and-registered`)
  }
  return { ok: errors.length === 0, errors }
}

/** Jumlah mesin yang benar-benar ditinjau; selalu dihitung dari entri sah. */
export function reviewedCount(reg: ReviewRegistry): number {
  return reg.entries.filter((e) => checkEntry(e).length === 0 && e.clinically_reviewed).length
}
