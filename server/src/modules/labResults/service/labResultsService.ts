// Use-case hasil lab dan rujukan. Tanpa HTTP, tanpa penyimpanan: repo disuntikkan lewat port,
// waktu dan id disuntikkan agar deterministik dan bisa diuji. Backend adalah sumber kebenaran:
// membaca TIDAK pernah mengubah status ("dilihat" ≠ "selesai").
import { transition, verifyTrail } from '../domain/lifecycle.js'
import type { Actor, AuditEntry, TransitionRejection } from '../domain/lifecycle.js'
import { REFERRAL_STATUSES, RESULT_STATUSES, STAFF_READ_ROLES as STAFF_READ, referralLifecycle, resultLifecycle } from '../domain/definitions.js'
import type { ReferralStatus, ResultStatus } from '../domain/definitions.js'

export const TENANT_PRAKTIK = 'praktik'
export const CHANNEL_KOMUNIKASI = ['in-person', 'phone', 'portal-message', 'letter'] as const
export type ChannelKomunikasi = (typeof CHANNEL_KOMUNIKASI)[number]
export const JENIS_RUJUKAN = ['lab', 'specialist', 'imaging', 'other'] as const
export type JenisRujukan = (typeof JENIS_RUJUKAN)[number]

export interface ButirHasil {
  name: string
  /** Nilai sebagaimana dicatat; server tidak menafsirkannya. Salah satu dari value/valueText wajib. */
  value?: number
  valueText?: string
  unit?: string
  referenceRange?: string
  collectedAt: string
}
export interface Komunikasi { channel: ChannelKomunikasi; note: string; at: string; by: string }
export interface HasilLabRekam {
  id: string; tenantId: string; patientId: string; status: ResultStatus
  item: ButirHasil
  provenance: { source: 'lab-intake' | 'manual-entry'; recordedBy: string; recordedAt: string }
  trail: AuditEntry<ResultStatus>[]
  communication?: Komunikasi
}
export interface RujukanRekam {
  id: string; tenantId: string; patientId: string; status: ReferralStatus
  kind: JenisRujukan; reason: string; toFacility: string
  trail: AuditEntry<ReferralStatus>[]
  resultId?: string; returnNote?: string; closeReason?: string
}

export interface RepoRekam<T extends { id: string }> { get(id: string): T | undefined; put(rec: T): void; all(): T[] }
export interface Konteks { hasil: RepoRekam<HasilLabRekam>; rujukan: RepoRekam<RujukanRekam>; now: () => Date; newId: (prefix: string) => string }

export type Galat = TransitionRejection | 'invalid-input' | 'not-found' | 'forbidden' | 'stale-status' | 'evidence-required' | 'linked-result-invalid' | 'trail-corrupt'
export type Hasil<T> = { ok: true; value: T } | { ok: false; reason: Galat; detail?: string }
const gagal = (reason: Galat, detail?: string): { ok: false; reason: Galat; detail?: string } => ({ ok: false, reason, ...(detail ? { detail } : {}) })

export const MAKS_NAMA = 120, MAKS_TEKS = 200, MAKS_CATATAN = 500, MAKS_ID = 80

const str = (v: unknown, max: number, min = 1): string | undefined => {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t.length >= min && t.length <= max ? t : undefined
}

function tanggalSah(v: unknown, sekarang: Date): string | undefined {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/.test(v)) return undefined
  const ms = Date.parse(v)
  // Toleransi satu hari untuk zona waktu, selaras dengan labLog.
  if (!Number.isFinite(ms) || ms > sekarang.getTime() + 864e5 || ms < Date.parse('1900-01-01')) return undefined
  return v
}

export function validasiButir(x: unknown, sekarang: Date): ButirHasil | undefined {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return undefined
  const b = x as Record<string, unknown>
  const name = str(b.name, MAKS_NAMA)
  const collectedAt = tanggalSah(b.collectedAt, sekarang)
  if (!name || !collectedAt) return undefined
  const adaNilai = b.value !== undefined, adaTeks = b.valueText !== undefined
  if (adaNilai === adaTeks) return undefined // tepat satu: tidak ada nilai tebakan, tidak ada dua nilai
  let value: number | undefined, valueText: string | undefined
  if (adaNilai) { if (typeof b.value !== 'number' || !Number.isFinite(b.value)) return undefined; value = b.value }
  else { valueText = str(b.valueText, MAKS_TEKS); if (!valueText) return undefined }
  const unit = b.unit === undefined ? undefined : str(b.unit, 32)
  const referenceRange = b.referenceRange === undefined ? undefined : str(b.referenceRange, 64)
  if ((b.unit !== undefined && !unit) || (b.referenceRange !== undefined && !referenceRange)) return undefined
  return { name, ...(value !== undefined ? { value } : { valueText }), ...(unit ? { unit } : {}), ...(referenceRange ? { referenceRange } : {}), collectedAt }
}

const bolehBaca = (a: Actor, rec: { tenantId: string; patientId: string }): boolean => {
  if (a.tenantId !== rec.tenantId) return false
  if (a.role === 'patient') return (a.patientIds ?? []).includes(rec.patientId)
  return STAFF_READ.includes(a.role)
}

// Aktor sistem (intake otomatis) tidak membaca data, tetapi boleh MENGAJUKAN transisi yang diizinkan
// definisi siklus hidup (received -> pending_review); transisi lain ditolak dengan alasan eksplisit.
const bolehAjukan = (a: Actor, rec: { tenantId: string; patientId: string }): boolean =>
  bolehBaca(a, rec) || (a.role === 'system' && a.tenantId === rec.tenantId)

const BOLEH_INTAKE: readonly Actor['role'][] = ['lab-staff', 'nurse', 'clinician', 'admin']

/** B2: hasil diterima dan disimpan persisten dengan provenans. Hanya staf; pasien dan sistem tidak. */
export function terimaHasil(k: Konteks, a: Actor, masukan: { patientId?: unknown; item?: unknown; source?: unknown }): Hasil<HasilLabRekam> {
  if (a.tenantId !== TENANT_PRAKTIK) return gagal('tenant-mismatch')
  if (!BOLEH_INTAKE.includes(a.role)) return gagal('forbidden')
  const now = k.now()
  const patientId = str(masukan.patientId, MAKS_ID)
  const item = validasiButir(masukan.item, now)
  const source = masukan.source === 'lab-intake' || masukan.source === 'manual-entry' ? masukan.source : undefined
  if (!patientId || !item || !source) return gagal('invalid-input')
  const rec: HasilLabRekam = {
    id: k.newId('lab'), tenantId: a.tenantId, patientId, status: resultLifecycle.initial, item,
    provenance: { source, recordedBy: a.actorId, recordedAt: now.toISOString() }, trail: [],
  }
  k.hasil.put(rec)
  return { ok: true, value: rec }
}

export interface MajuHasil { to: unknown; expectedStatus?: unknown; communication?: { channel?: unknown; note?: unknown } }

/** B3+B4: satu langkah maju, teraudit; `communicated` mewajibkan bukti komunikasi dari orang. */
export function majukanHasil(k: Konteks, a: Actor, id: string, m: MajuHasil): Hasil<HasilLabRekam> {
  const rec = k.hasil.get(id)
  if (!rec || !bolehAjukan(a, rec)) return gagal('not-found') // tidak membocorkan keberadaan
  if (!RESULT_STATUSES.includes(m.to as ResultStatus)) return gagal('invalid-input', 'to')
  const to = m.to as ResultStatus
  if (m.expectedStatus !== undefined && m.expectedStatus !== rec.status) return gagal('stale-status')
  const utuh = verifyTrail(resultLifecycle, rec.id, rec.trail)
  if (!utuh.ok || utuh.status !== rec.status) return gagal('trail-corrupt')
  let komunikasi: Komunikasi | undefined
  if (to === 'communicated') {
    const channel = CHANNEL_KOMUNIKASI.find((c) => c === m.communication?.channel)
    const note = str(m.communication?.note, MAKS_CATATAN)
    if (!channel || !note) return gagal('evidence-required')
    komunikasi = { channel, note, at: k.now().toISOString(), by: a.actorId }
  }
  const r = transition(resultLifecycle, { subjectId: rec.id, tenantId: rec.tenantId, current: rec.status, target: to, actor: a, at: k.now().toISOString(), trail: rec.trail })
  if (!r.ok) return gagal(r.reason)
  const baru: HasilLabRekam = { ...rec, status: r.status, trail: [...rec.trail, r.entry], ...(komunikasi ? { communication: komunikasi } : {}) }
  k.hasil.put(baru)
  return { ok: true, value: baru }
}

/** B5: baca satu hasil. Murni baca — status tidak berubah. */
export function bacaHasil(k: Konteks, a: Actor, id: string): Hasil<HasilLabRekam> {
  const rec = k.hasil.get(id)
  return rec && bolehBaca(a, rec) ? { ok: true, value: rec } : gagal('not-found')
}

export function daftarHasil(k: Konteks, a: Actor, patientId?: string): HasilLabRekam[] {
  return k.hasil.all().filter((r) => bolehBaca(a, r) && (!patientId || r.patientId === patientId)).sort((x, y) => x.provenance.recordedAt.localeCompare(y.provenance.recordedAt) || x.id.localeCompare(y.id))
}

export interface MetrikPenutupan {
  total: number
  byStatus: Record<ResultStatus, number>
  closed: number
  /** null bila penyebut nol — tidak diukur, bukan 0%. */
  closureRate: number | null
  oldestOpenHours: number | null
  /** null bila ambang tidak diberikan pemanggil: ambang bukan angka yang dikarang server. */
  overdue: number | null
}

/** B9: metrik dihitung dari backend; hanya hasil yang jejaknya utuh yang dihitung, sisanya dilaporkan terpisah. */
export function metrikPenutupan(k: Konteks, a: Actor, opsi: { dueHours?: number } = {}): Hasil<MetrikPenutupan & { corrupt: number }> {
  if (!STAFF_READ.includes(a.role) || a.tenantId !== TENANT_PRAKTIK) return gagal('forbidden')
  const byStatus = Object.fromEntries(RESULT_STATUSES.map((s) => [s, 0])) as Record<ResultStatus, number>
  const sekarang = k.now().getTime()
  let total = 0, corrupt = 0, oldest: number | null = null, overdue: number | null = opsi.dueHours === undefined ? null : 0
  if (opsi.dueHours !== undefined && !(Number.isFinite(opsi.dueHours) && opsi.dueHours > 0)) return gagal('invalid-input', 'dueHours')
  for (const r of k.hasil.all()) {
    if (r.tenantId !== a.tenantId) continue
    const v = verifyTrail(resultLifecycle, r.id, r.trail)
    if (!v.ok || v.status !== r.status) { corrupt++; continue }
    total++; byStatus[r.status]++
    if (r.status !== 'closed') {
      const umur = (sekarang - Date.parse(r.provenance.recordedAt)) / 3.6e6
      oldest = oldest === null ? umur : Math.max(oldest, umur)
      if (overdue !== null && umur > (opsi.dueHours as number)) overdue++
    }
  }
  return { ok: true, value: { total, byStatus, closed: byStatus.closed, closureRate: total === 0 ? null : byStatus.closed / total, oldestOpenHours: oldest, overdue, corrupt } }
}

// ── Rujukan (B6) ────────────────────────────────────────────────────────────

export function buatRujukan(k: Konteks, a: Actor, m: { patientId?: unknown; kind?: unknown; reason?: unknown; toFacility?: unknown }): Hasil<RujukanRekam> {
  if (a.tenantId !== TENANT_PRAKTIK) return gagal('tenant-mismatch')
  if (a.role !== 'clinician' || a.authorizedClinician !== true) return gagal('forbidden')
  const patientId = str(m.patientId, MAKS_ID), reason = str(m.reason, MAKS_CATATAN), toFacility = str(m.toFacility, MAKS_NAMA)
  const kind = JENIS_RUJUKAN.find((j) => j === m.kind)
  if (!patientId || !reason || !toFacility || !kind) return gagal('invalid-input')
  const rec: RujukanRekam = { id: k.newId('ref'), tenantId: a.tenantId, patientId, status: referralLifecycle.initial, kind, reason, toFacility, trail: [] }
  k.rujukan.put(rec)
  return { ok: true, value: rec }
}

export interface MajuRujukan { to: unknown; expectedStatus?: unknown; resultId?: unknown; returnNote?: unknown; closeReason?: unknown }

export function majukanRujukan(k: Konteks, a: Actor, id: string, m: MajuRujukan): Hasil<RujukanRekam> {
  const rec = k.rujukan.get(id)
  if (!rec || !bolehAjukan(a, rec)) return gagal('not-found')
  if (!REFERRAL_STATUSES.includes(m.to as ReferralStatus)) return gagal('invalid-input', 'to')
  const to = m.to as ReferralStatus
  if (m.expectedStatus !== undefined && m.expectedStatus !== rec.status) return gagal('stale-status')
  const utuh = verifyTrail(referralLifecycle, rec.id, rec.trail)
  if (!utuh.ok || utuh.status !== rec.status) return gagal('trail-corrupt')
  const tambahan: Partial<RujukanRekam> = {}
  if (to === 'result_returned') {
    // Hasil kembali harus berupa bukti: hasil lab yang tercatat untuk pasien yang sama, atau catatan (non-lab).
    const resultId = m.resultId === undefined ? undefined : str(m.resultId, MAKS_ID)
    const note = m.returnNote === undefined ? undefined : str(m.returnNote, MAKS_CATATAN)
    if ((m.resultId !== undefined && !resultId) || (m.returnNote !== undefined && !note)) return gagal('invalid-input')
    if (resultId) {
      const h = k.hasil.get(resultId)
      if (!h || h.tenantId !== rec.tenantId || h.patientId !== rec.patientId) return gagal('linked-result-invalid')
      tambahan.resultId = resultId
    } else if (note && rec.kind !== 'lab') tambahan.returnNote = note
    else return gagal('evidence-required')
  }
  if (to === 'closed' && rec.resultId) {
    // Penutupan rujukan terverifikasi: hasil yang kembali harus sudah ditutup di siklus hasilnya.
    const h = k.hasil.get(rec.resultId)
    if (!h || h.status !== 'closed') return gagal('linked-result-invalid', 'linked result is not closed')
  }
  if (to === 'declined' || to === 'cancelled') {
    const alasan = str(m.closeReason, MAKS_CATATAN)
    if (!alasan) return gagal('evidence-required')
    tambahan.closeReason = alasan
  }
  const r = transition(referralLifecycle, { subjectId: rec.id, tenantId: rec.tenantId, current: rec.status, target: to, actor: a, at: k.now().toISOString(), trail: rec.trail })
  if (!r.ok) return gagal(r.reason)
  const baru: RujukanRekam = { ...rec, ...tambahan, status: r.status, trail: [...rec.trail, r.entry] }
  k.rujukan.put(baru)
  return { ok: true, value: baru }
}

export function bacaRujukan(k: Konteks, a: Actor, id: string): Hasil<RujukanRekam> {
  const rec = k.rujukan.get(id)
  return rec && bolehBaca(a, rec) ? { ok: true, value: rec } : gagal('not-found')
}
export function daftarRujukan(k: Konteks, a: Actor, patientId?: string): RujukanRekam[] {
  return k.rujukan.all().filter((r) => bolehBaca(a, r) && (!patientId || r.patientId === patientId)).sort((x, y) => x.id.localeCompare(y.id))
}
