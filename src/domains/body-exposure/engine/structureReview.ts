// Tinjauan klinis per struktur anatomi: daftar periksa, catatan tinjauan, dan aturan kapan sebuah catatan boleh dihitung sebagai "ditinjau".
// Murni (tanpa DOM/jaringan/waktu tersembunyi): waktu "sekarang" dan daftar peninjau berwenang disuntikkan oleh pemanggil.
// Prinsip: tinjauan klinis hanya sah bila peninjau teridentifikasi DAN terdaftar berwenang menyetujui versi aset PERSIS yang ditinjau;
// keputusan selain "confirmed" tidak pernah menyetujui apa pun, dan kegagalan data apa pun berarti TIDAK ditinjau (gagal-tertutup).

export type StructureMethod = 'manual_segmentation' | 'model_segmented' | 'reference_stand_in' | 'other'
export type ReviewDecision = 'confirmed' | 'corrections_needed' | 'cannot_assess'

export interface StructureReviewCheck {
  id: string
  label: string
  detail: string
  /** Hanya berlaku untuk metode tertentu; kosong = semua metode. */
  methods?: readonly StructureMethod[]
}

export const STRUCTURE_REVIEW_CHECKLIST: readonly StructureReviewCheck[] = [
  { id: 'identity', label: 'Name and identifier', detail: 'The displayed name and the structure ID name the right anatomical structure (Terminologia Anatomica).' },
  { id: 'laterality', label: 'Laterality', detail: 'Left, right or unpaired is correct for this structure, in the subject frame (+X is the subject\'s left).' },
  { id: 'position', label: 'Position and relations', detail: 'Position, orientation and relations to neighbouring structures are anatomically correct (no overlap, no gap, no displacement).' },
  { id: 'completeness', label: 'Shape is complete', detail: 'No missing parts, holes, spurious pieces, merged neighbours or stair-step artefacts that change the anatomy.' },
  { id: 'scale', label: 'Size is plausible', detail: 'Size is plausible for the donor or reference body it belongs to.' },
  { id: 'provenance', label: 'Source, licence and method', detail: 'The source, licence and method stored on the structure match the data that was actually used.' },
  { id: 'method_check', label: 'Machine segmentation checked', detail: 'The model output was compared with the underlying images or an independent reference, not only inspected as a surface.', methods: ['model_segmented'] },
  { id: 'stand_in', label: 'Stand-in is declared', detail: 'The geometry is declared as borrowed from another body and is not presented as this individual\'s anatomy.', methods: ['reference_stand_in'] },
  { id: 'limitations', label: 'Limitations are accurate', detail: 'The stated limitations are accurate and sufficient; nothing known is left unsaid.' },
]

export function requiredCheckIds(method: StructureMethod): string[] {
  return STRUCTURE_REVIEW_CHECKLIST.filter((c) => !c.methods || c.methods.includes(method)).map((c) => c.id)
}

export function reviewReadiness(checks: Readonly<Record<string, boolean>>, method: StructureMethod): { complete: boolean; missing: string[] } {
  const missing = requiredCheckIds(method).filter((id) => checks[id] !== true)
  return { complete: missing.length === 0, missing }
}

export interface StructureReviewRecord {
  schema: 1
  body_id: string
  structure_id: string
  /** Versi aset yang ditinjau (panacea_version + metode); catatan hanya berlaku untuk versi ini. */
  asset_version: string
  method: StructureMethod
  decision: ReviewDecision
  checks: Record<string, boolean>
  reviewer_id: string
  reviewed_at: string
  notes: string
}

export interface ReviewInput {
  body_id: string
  structure_id: string
  asset_version: string
  method: StructureMethod
  decision: ReviewDecision
  checks: Record<string, boolean>
  reviewer_id: string
  notes: string
}

export const MAX_NOTES = 4000
const DECISIONS: readonly ReviewDecision[] = ['confirmed', 'corrections_needed', 'cannot_assess']
const METHODS: readonly StructureMethod[] = ['manual_segmentation', 'model_segmented', 'reference_stand_in', 'other']

const nonEmpty = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0

/** Susun catatan tinjauan dari masukan formulir. Masukan tidak sah ditolak dengan alasan; tidak ada nilai tebakan. */
export function buildReviewRecord(input: ReviewInput, nowIso: string): { ok: true; record: StructureReviewRecord } | { ok: false; error: string } {
  if (!nonEmpty(input.body_id) || !nonEmpty(input.structure_id)) return { ok: false, error: 'body_id and structure_id are required' }
  if (!nonEmpty(input.asset_version)) return { ok: false, error: 'asset_version is required (the exact structure version under review)' }
  if (!nonEmpty(input.reviewer_id)) return { ok: false, error: 'reviewer_id is required' }
  if (!METHODS.includes(input.method)) return { ok: false, error: 'unknown method' }
  if (!DECISIONS.includes(input.decision)) return { ok: false, error: 'unknown decision' }
  if (typeof input.notes !== 'string' || input.notes.length > MAX_NOTES) return { ok: false, error: `notes must be text of at most ${MAX_NOTES} characters` }
  if (Number.isNaN(Date.parse(nowIso))) return { ok: false, error: 'invalid timestamp' }
  const checks: Record<string, boolean> = {}
  for (const c of STRUCTURE_REVIEW_CHECKLIST) if (input.checks[c.id] === true) checks[c.id] = true
  if (input.decision === 'confirmed') {
    const r = reviewReadiness(checks, input.method)
    if (!r.complete) return { ok: false, error: `a confirmed review needs every required check: missing ${r.missing.join(', ')}` }
  }
  return { ok: true, record: { schema: 1, body_id: input.body_id.trim(), structure_id: input.structure_id.trim(), asset_version: input.asset_version.trim(), method: input.method, decision: input.decision, checks, reviewer_id: input.reviewer_id.trim(), reviewed_at: new Date(nowIso).toISOString(), notes: input.notes.trim() } }
}

export interface ApprovalContext {
  /** Daftar peninjau berwenang yang dipelihara pemilik (kosong = tidak ada yang berwenang). */
  authorizedReviewers: readonly string[]
  /** Versi aset yang berlaku saat ini untuk struktur tersebut. */
  currentAssetVersion: string
  nowIso: string
}

/** Apakah catatan ini menjadikan struktur "clinically_reviewed". Semua syarat harus terpenuhi; selain itu: tidak. */
export function recordApproves(record: unknown, ctx: ApprovalContext): { approved: boolean; reason: string } {
  const no = (reason: string) => ({ approved: false, reason })
  if (typeof record !== 'object' || record === null) return no('record is not an object')
  const r = record as Partial<StructureReviewRecord>
  if (r.schema !== 1) return no('unsupported schema')
  if (r.decision !== 'confirmed') return no('decision is not "confirmed"')
  if (!nonEmpty(r.reviewer_id)) return no('reviewer is not identified')
  if (!ctx.authorizedReviewers.includes(r.reviewer_id)) return no('reviewer is not on the authorised list')
  if (!nonEmpty(r.asset_version) || r.asset_version !== ctx.currentAssetVersion) return no('record is for a different asset version')
  if (!METHODS.includes(r.method as StructureMethod)) return no('unknown method')
  if (typeof r.checks !== 'object' || r.checks === null || !reviewReadiness(r.checks, r.method as StructureMethod).complete) return no('required checks are incomplete')
  const t = typeof r.reviewed_at === 'string' ? Date.parse(r.reviewed_at) : NaN
  const now = Date.parse(ctx.nowIso)
  if (Number.isNaN(t) || Number.isNaN(now)) return no('invalid review time')
  if (t > now) return no('review time is in the future')
  return { approved: true, reason: 'confirmed by an authorised reviewer for this exact asset version' }
}
