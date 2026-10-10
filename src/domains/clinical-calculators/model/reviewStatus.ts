// Status review klinis per mesin kalkulator (Alpha C4). Murni: tanpa I/O, tanpa jam.
// Fail closed: "ditinjau" hanya sah bila ada peninjau teridentifikasi, tanggal, dan bukti; selain itu
// mesin tetap PENDING_CLINICAL_REVIEW dengan clinicallyReviewed=false. Rentang masukan adalah batas
// kewajaran, bukan ambang klinis, dan tidak ikut dinyatakan "ditinjau" di sini.

export type ReviewState = 'PENDING_CLINICAL_REVIEW' | 'CLINICALLY_REVIEWED'

export type ReviewRecord = { reviewer: string; reviewedOn: string; evidenceIds: readonly string[] }

export type CalculatorReviewEntry = {
  /** Nama berkas di engine/ tanpa ekstensi. */
  engine: string
  state: ReviewState
  clinicallyReviewed: boolean
  review?: ReviewRecord
}

export type ReviewRegistryAudit = { ok: boolean; problems: string[] }

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function validReviewRecord(r: ReviewRecord | undefined): boolean {
  if (!r) return false
  if (typeof r.reviewer !== 'string' || r.reviewer.trim() === '') return false
  if (typeof r.reviewedOn !== 'string' || !ISO_DATE.test(r.reviewedOn)) return false
  if (!Array.isArray(r.evidenceIds) || r.evidenceIds.length === 0) return false
  return r.evidenceIds.every((e) => typeof e === 'string' && e.trim() !== '')
}

/** Memeriksa konsistensi registri terhadap daftar mesin yang ada di disk (dipasok pemanggil). */
export function auditReviewRegistry(
  entries: readonly CalculatorReviewEntry[],
  engineFiles: readonly string[],
): ReviewRegistryAudit {
  const problems: string[] = []
  const seen = new Set<string>()
  for (const e of entries) {
    if (seen.has(e.engine)) problems.push(`duplicate entry: ${e.engine}`)
    seen.add(e.engine)
    if (e.state === 'PENDING_CLINICAL_REVIEW') {
      if (e.clinicallyReviewed) problems.push(`pending entry marked reviewed: ${e.engine}`)
      if (e.review) problems.push(`pending entry carries a review record: ${e.engine}`)
    } else if (e.state === 'CLINICALLY_REVIEWED') {
      if (!e.clinicallyReviewed) problems.push(`reviewed state without clinicallyReviewed flag: ${e.engine}`)
      if (!validReviewRecord(e.review)) problems.push(`reviewed without reviewer/date/evidence: ${e.engine}`)
    } else {
      problems.push(`unknown state on ${e.engine}`)
    }
  }
  for (const f of engineFiles) if (!seen.has(f)) problems.push(`engine not registered: ${f}`)
  for (const e of entries) if (!engineFiles.includes(e.engine)) problems.push(`registry entry without engine file: ${e.engine}`)
  return { ok: problems.length === 0, problems }
}

/** Status efektif: nama tak terdaftar dianggap belum ditinjau, bukan "tidak perlu". */
export function reviewStateOf(entries: readonly CalculatorReviewEntry[], engine: string): ReviewState {
  const e = entries.find((x) => x.engine === engine)
  if (!e || e.state !== 'CLINICALLY_REVIEWED' || !e.clinicallyReviewed || !validReviewRecord(e.review)) return 'PENDING_CLINICAL_REVIEW'
  return 'CLINICALLY_REVIEWED'
}
