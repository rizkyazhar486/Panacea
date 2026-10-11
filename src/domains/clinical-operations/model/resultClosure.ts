/**
 * Penutupan tindak lanjut hasil (PRD §8.5 "Result follow-up closure"): hasil yang jatuh tempo dalam jendela evaluasi hanya dihitung
 * TUTUP bila SEMUA langkah yang diwajibkan protokol punya bukti yang dicatat oleh orang. Aturan PRD yang dikodekan di sini:
 * catatan atau notifikasi yang dibuat sistem TIDAK menutup tugas; hasil yang lewat tempo tidak disembunyikan; penyebut nol atau
 * data tak sahih = "tidak terukur" (null), bukan 0% atau 100%; alasan "tidak berlaku" harus dari daftar yang ditetapkan lebih dulu.
 * Fungsi murni: waktu dievaluasi disuntikkan (`evaluatedAt`), tanpa jam atau I/O. Ini bukti kontrol alur kerja, BUKAN bukti
 * kebenaran klinis; peninjauan klinis tetap pada klinisi terotorisasi.
 */
export type ClosureStep = 'review' | 'explanation' | 'follow-up'

export interface ClosureEvidence {
  /** Waktu pencatatan (ISO 8601). */
  at: string
  actorId: string
  /** `person` = dicatat manusia; `system` = dibuat otomatis (draf, notifikasi) dan tidak pernah menutup. */
  recordedBy: 'person' | 'system'
  /** Untuk tinjauan: peninjau punya otorisasi klinis terverifikasi untuk pasien ini. Tidak dipakai untuk penjelasan/tindak lanjut. */
  authorizedClinician?: boolean
}

export interface ClosureFollowUp {
  evidence?: ClosureEvidence
  /** Alasan "tidak berlaku"; harus ada pada `validNotApplicableReasons`. */
  notApplicableReason?: string
}

export interface ResultClosureRecord {
  resultId: string
  patientId: string
  resultedAt: string
  /** Batas tutup menurut aturan protokol yang ditetapkan pemanggil. */
  dueBy: string
  required: Readonly<Record<ClosureStep, boolean>>
  review?: ClosureEvidence
  explanation?: ClosureEvidence
  followUp?: ClosureFollowUp
}

export interface ResultClosureInput {
  targetPatientId: string
  evaluatedAt: string
  windowStart: string
  windowEnd: string
  validNotApplicableReasons: readonly string[]
  results: readonly ResultClosureRecord[]
}

export type ResultClosureState = 'closed' | 'open-not-due' | 'overdue' | 'invalid'
export type ResultInvalidReason =
  | 'foreign-patient' | 'duplicate-id' | 'invalid-timestamp' | 'evidence-in-future' | 'evidence-before-result' | 'due-before-result'

export interface ResultClosureItem {
  resultId: string
  state: ResultClosureState
  unmetSteps: ClosureStep[]
  /** Tutup setelah batas tutup (tetap dihitung tutup, tetapi terlihat). */
  closedLate: boolean
  invalidReasons: ResultInvalidReason[]
}

export interface ResultClosureResult {
  items: ResultClosureItem[]
  dueCount: number
  closedCount: number
  overdueIds: string[]
  invalidIds: string[]
  /** null = tidak terukur (penyebut nol, atau ada rekaman tak sahih / masukan evaluasi tak sahih). */
  closureRate: number | null
  unmeasuredReason: string | null
}

const ms = (iso: string): number => (typeof iso === 'string' ? Date.parse(iso) : Number.NaN)

function evidenceInvalid(e: ClosureEvidence | undefined, resultedAt: number, evaluatedAt: number, out: Set<ResultInvalidReason>): void {
  if (!e) return
  const t = ms(e.at)
  if (!Number.isFinite(t)) { out.add('invalid-timestamp'); return }
  if (t > evaluatedAt) out.add('evidence-in-future')
  else if (t < resultedAt) out.add('evidence-before-result')
}

/** Bukti sah sebagai penutup langkah: dicatat orang, ada pelaku, dan (untuk tinjauan) klinisi terotorisasi. */
function counts(e: ClosureEvidence | undefined, needsAuthorizedClinician: boolean): boolean {
  if (!e || e.recordedBy !== 'person') return false
  if (typeof e.actorId !== 'string' || e.actorId.trim() === '') return false
  return needsAuthorizedClinician ? e.authorizedClinician === true : true
}

export function evaluateResultClosure(input: ResultClosureInput): ResultClosureResult {
  const evaluatedAt = ms(input.evaluatedAt)
  const start = ms(input.windowStart)
  const end = ms(input.windowEnd)
  const badInput = !Number.isFinite(evaluatedAt) || !Number.isFinite(start) || !Number.isFinite(end) || start > end
  const idCounts = new Map<string, number>()
  for (const r of input.results) idCounts.set(r.resultId, (idCounts.get(r.resultId) ?? 0) + 1)

  const items: ResultClosureItem[] = []
  let dueCount = 0
  let closedCount = 0
  for (const r of input.results) {
    const invalid = new Set<ResultInvalidReason>()
    if (r.patientId !== input.targetPatientId) invalid.add('foreign-patient')
    if ((idCounts.get(r.resultId) ?? 0) > 1) invalid.add('duplicate-id')
    const resultedAt = ms(r.resultedAt)
    const dueBy = ms(r.dueBy)
    if (!Number.isFinite(resultedAt) || !Number.isFinite(dueBy)) invalid.add('invalid-timestamp')
    else if (dueBy < resultedAt) invalid.add('due-before-result')
    if (Number.isFinite(resultedAt) && !badInput) {
      evidenceInvalid(r.review, resultedAt, evaluatedAt, invalid)
      evidenceInvalid(r.explanation, resultedAt, evaluatedAt, invalid)
      evidenceInvalid(r.followUp?.evidence, resultedAt, evaluatedAt, invalid)
    }
    if (invalid.size > 0 || badInput) {
      items.push({ resultId: r.resultId, state: 'invalid', unmetSteps: [], closedLate: false, invalidReasons: [...invalid] })
      continue
    }

    const unmet: ClosureStep[] = []
    if (r.required.review && !counts(r.review, true)) unmet.push('review')
    if (r.required.explanation && !counts(r.explanation, false)) unmet.push('explanation')
    if (r.required['follow-up']) {
      const fu = r.followUp
      const naOk = typeof fu?.notApplicableReason === 'string' && input.validNotApplicableReasons.includes(fu.notApplicableReason)
      if (!(counts(fu?.evidence, false) || naOk)) unmet.push('follow-up')
    }
    const due = dueBy >= start && dueBy <= end && dueBy <= evaluatedAt
    const closed = unmet.length === 0
    if (due) { dueCount += 1; if (closed) closedCount += 1 }
    const latest = Math.max(...[r.review, r.explanation, r.followUp?.evidence].filter((e): e is ClosureEvidence => !!e && counts(e, false)).map((e) => ms(e.at)), resultedAt)
    items.push({
      resultId: r.resultId,
      state: closed ? 'closed' : dueBy <= evaluatedAt ? 'overdue' : 'open-not-due',
      unmetSteps: unmet,
      closedLate: closed && latest > dueBy,
      invalidReasons: [],
    })
  }

  const invalidIds = items.filter((i) => i.state === 'invalid').map((i) => i.resultId)
  const overdueIds = items.filter((i) => i.state === 'overdue').map((i) => i.resultId)
  let unmeasuredReason: string | null = null
  if (badInput) unmeasuredReason = 'evaluation inputs are invalid (timestamps or window)'
  else if (invalidIds.length > 0) unmeasuredReason = 'one or more result records are invalid'
  else if (dueCount === 0) unmeasuredReason = 'no results due in the evaluation window'
  return {
    items, dueCount, closedCount, overdueIds, invalidIds,
    closureRate: unmeasuredReason === null ? closedCount / dueCount : null,
    unmeasuredReason,
  }
}
