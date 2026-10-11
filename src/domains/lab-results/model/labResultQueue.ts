// Antrean tinjauan klinisi atas hasil lab (Alpha B7). Murni: tanpa React/fetch/jam tersembunyi.
// Server (server/src/modules/labResults) adalah satu-satunya otoritas siklus hidup; modul ini hanya
// membaca kontraknya dan menurunkan tampilan. Cermin tepi di bawah hanya untuk menampilkan tombol —
// server tetap menolak langkah ilegal, dan UI tidak pernah mengarang status/ambang yang tidak ada.

export const RESULT_STATUSES = ['received', 'pending_review', 'reviewed', 'communicated', 'closed'] as const
export type ResultStatus = (typeof RESULT_STATUSES)[number]
export const COMMUNICATION_CHANNELS = ['in-person', 'phone', 'portal-message', 'letter'] as const
export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number]

export interface LabResultItem {
  name: string
  value?: number
  valueText?: string
  unit?: string
  referenceRange?: string
  collectedAt: string
}
export interface LabResultRecord {
  id: string
  patientId: string
  status: ResultStatus
  item: LabResultItem
  source: 'lab-intake' | 'manual-entry'
  recordedAt: string
}

const NEXT: Record<ResultStatus, ResultStatus | null> = {
  received: 'pending_review', pending_review: 'reviewed', reviewed: 'communicated', communicated: 'closed', closed: null,
}
// Sama dengan MAKS_CATATAN server; server tetap menegakkan.
export const MAX_NOTE = 500
export const nextStatus = (s: ResultStatus): ResultStatus | null => NEXT[s]

export type ParseOutcome = { ok: true; records: LabResultRecord[] } | { ok: false; reason: 'not-a-list' | 'invalid-record'; index?: number }

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
const isStr = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0
const isIso = (x: unknown): x is string => isStr(x) && Number.isFinite(Date.parse(x))
const optStr = (x: unknown): string | undefined => (typeof x === 'string' && x.trim() ? x : undefined)

/** Fail closed: satu rekam cacat menolak seluruh daftar — tidak menampilkan hasil separuh-valid ke klinisi. */
export function parseLabResults(raw: unknown): ParseOutcome {
  const list = isObj(raw) ? raw.results : undefined
  if (!Array.isArray(list)) return { ok: false, reason: 'not-a-list' }
  const records: LabResultRecord[] = []
  for (let i = 0; i < list.length; i++) {
    const r = list[i]
    if (!isObj(r) || !isObj(r.item) || !isObj(r.provenance)) return { ok: false, reason: 'invalid-record', index: i }
    const { item, provenance: p } = r
    const status = RESULT_STATUSES.find((s) => s === r.status)
    const hasValue = (typeof item.value === 'number' && Number.isFinite(item.value)) || isStr(item.valueText)
    if (!isStr(r.id) || !isStr(r.patientId) || !status || !isStr(item.name) || !hasValue || !isIso(item.collectedAt)
      || !isIso(p.recordedAt) || (p.source !== 'lab-intake' && p.source !== 'manual-entry')) return { ok: false, reason: 'invalid-record', index: i }
    records.push({
      id: r.id, patientId: r.patientId, status, source: p.source, recordedAt: p.recordedAt,
      item: {
        name: item.name, collectedAt: item.collectedAt,
        ...(typeof item.value === 'number' && Number.isFinite(item.value) ? { value: item.value } : {}),
        ...(optStr(item.valueText) ? { valueText: optStr(item.valueText) } : {}),
        ...(optStr(item.unit) ? { unit: optStr(item.unit) } : {}),
        ...(optStr(item.referenceRange) ? { referenceRange: optStr(item.referenceRange) } : {}),
      },
    })
  }
  return { ok: true, records }
}

export interface QueueRow extends LabResultRecord {
  /** Jam sejak dicatat; null bila jam rekam di masa depan terhadap `now` (tidak ditebak). */
  ageHours: number | null
  nextStatus: ResultStatus | null
  needsReview: boolean
}

// Urutan kerja klinisi: yang menunggu tinjauan dulu, lalu tindak lanjut; selesai paling akhir.
const ORDER: Record<ResultStatus, number> = { pending_review: 0, received: 1, reviewed: 2, communicated: 3, closed: 4 }

export function buildQueue(records: readonly LabResultRecord[], now: Date): QueueRow[] {
  const t = now.getTime()
  return records
    .map((r): QueueRow => {
      const h = (t - Date.parse(r.recordedAt)) / 3.6e6
      return { ...r, ageHours: Number.isFinite(h) && h >= 0 ? h : null, nextStatus: nextStatus(r.status), needsReview: r.status === 'pending_review' }
    })
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.recordedAt.localeCompare(b.recordedAt) || a.id.localeCompare(b.id))
}

export function formatValue(i: LabResultItem): string {
  const v = typeof i.value === 'number' ? String(i.value) : (i.valueText ?? '')
  return i.unit && typeof i.value === 'number' ? `${v} ${i.unit}` : v
}

export interface AdvanceRequest { to: ResultStatus; expectedStatus: ResultStatus; communication?: { channel: CommunicationChannel; note: string } }
export type AdvanceBuild = { ok: true; request: AdvanceRequest } | { ok: false; reason: 'no-next-step' | 'communication-required' | 'invalid-channel' | 'note-required' | 'note-too-long' }

/** Bangun body advance. `expectedStatus` selalu dikirim agar server menolak (409) bila rekam sudah berubah. */
export function buildAdvance(row: Pick<LabResultRecord, 'status'>, comm?: { channel: string; note: string }): AdvanceBuild {
  const to = nextStatus(row.status)
  if (!to) return { ok: false, reason: 'no-next-step' }
  if (to !== 'communicated') return { ok: true, request: { to, expectedStatus: row.status } }
  if (!comm) return { ok: false, reason: 'communication-required' }
  const channel = COMMUNICATION_CHANNELS.find((c) => c === comm.channel)
  if (!channel) return { ok: false, reason: 'invalid-channel' }
  const note = comm.note.trim()
  if (!note) return { ok: false, reason: 'note-required' }
  if (note.length > MAX_NOTE) return { ok: false, reason: 'note-too-long' }
  return { ok: true, request: { to, expectedStatus: row.status, communication: { channel, note } } }
}
