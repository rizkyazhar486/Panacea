// Rencana anamnesis harian (Continuous Care) di server.
//
// Kernel klinisnya ada di src/lib/continuousCareOperatingSystem.ts dan berjalan
// di peramban (server hanya mengirim folder server/, jadi tidak bisa
// mengimpornya). Pembagian tugasnya:
// - server: batas kepercayaan — siapa boleh menulis/membaca, bentuk dan ukuran
//   rencana, jawaban harus cocok dengan pertanyaan rencana;
// - peramban dokter: kernel menghitung ulang laporan (prioritas, aturan yang
//   terpicu) dari jawaban MENTAH, sehingga pasien tidak dapat menyembunyikan
//   aturan yang terpicu dengan mengirim ringkasan palsu.
// Server tidak menambah aturan klinis, ambang, atau red flag apa pun.

import { createHash, randomBytes } from 'node:crypto'
import { uuidStabil } from './labFhir.js'

export type JenisPertanyaan = 'boolean' | 'number' | 'text' | 'choice'
export interface PertanyaanRencana {
  id: string; metric: string; prompt: string; kind: JenisPertanyaan; domain: 'symptom' | 'medication'
  required: boolean; unit?: string; choices?: string[]
  showWhen?: { questionId: string; operator: Operator; value: boolean | number | string }
}
type Operator = 'equals' | 'not-equals' | 'gte' | 'lte' | 'contains'
export interface AturanLaporanPasien {
  id: string; label: string; questionId: string; operator: Operator; value: boolean | number | string
  priority: 'review-today' | 'immediate-human-review'; rationale: string
}
export interface RencanaPerawatan {
  id: string; version: string; subjectId: string; clinicianId: string; questionnaireId: string
  diagnosisRefs: { system: 'icd-10' | 'snomed-ct' | 'local'; code: string; display: string; verificationStatus: 'confirmed' | 'provisional' | 'differential' }[]
  signature?: { actorId: string; at: string; contentHash: string }
  activeFrom: string; activeUntil?: string
  schedule: { cadence: 'daily'; graceMinutes: number }
  questions: PertanyaanRencana[]
  patientReportedReviewRules: AturanLaporanPasien[]
  measurementReviewRules: AturanPengukuran[]
  monitoredMetrics: string[]
}
/** Aturan tinjauan atas NILAI LAB yang dibagikan pasien. Ditulis dokter, wajib
 *  rujukan bukti; verifiedBy/verifiedAt selalu identitas & waktu server. */
export interface AturanPengukuran {
  id: string; label: string; metric: string; operator: 'gte' | 'lte'; threshold: number; unit: string
  maxAgeMinutes: number; priority: 'review-today' | 'immediate-human-review'; rationale: string
  evidenceRef: string; verifiedBy: string; verifiedAt: string
  sourcePolicy: 'shared-lab-transcribed' | 'verified-clinical-vital'
}
export const MAKS_HARI_UMUR_NILAI = 730
export const VITAL_RULE_UNITS: Readonly<Record<string, string>> = {
  'vital.sbp': 'mmHg', 'vital.dbp': 'mmHg', 'vital.hr': 'bpm', 'vital.rr': '/min',
  'vital.temp': '°C', 'vital.spo2': '%', 'vital.glucose': 'mg/dL',
}

export interface LaporanHarian {
  id: string; planId: string; planVersion: string; subjectId: string
  scheduledFor: string; authoredAt: string; answers: { questionId: string; value: boolean | number | string }[]
  /** Kunci idempotensi dari klien: kirim ulang (antrean offline) tidak menggandakan laporan. */
  clientId?: string
}

const ID = /^[A-Za-z0-9_-]{1,40}$/
const OPS: readonly Operator[] = ['equals', 'not-equals', 'gte', 'lte', 'contains']
const teks = (v: unknown, nama: string, maks: number): string => {
  const s = typeof v === 'string' ? v.trim() : ''
  if (!s || s.length > maks) throw new Error(`${nama} is required (max ${maks} characters)`)
  return s
}
const nilaiSah = (v: unknown) => typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v)) || (typeof v === 'string' && v.length <= 200)

/**
 * Menyusun rencana dari masukan dokter. subjectId/clinicianId SELALU diambil
 * dari identitas server (pasien pemberi izin, dokter yang login), tidak pernah
 * dari payload. Aturan pengukuran (ambang vital) belum diterima di jalur ini:
 * aturan itu butuh rujukan bukti + verifikator dan belum ada alurnya.
 */
export function susunRencana(masukan: unknown, subjectId: string, clinicianId: string, kini: Date): RencanaPerawatan {
  const m = (masukan ?? {}) as Record<string, unknown>
  const dxMentah = Array.isArray(m.diagnosisRefs) ? m.diagnosisRefs : []
  if (dxMentah.length < 1 || dxMentah.length > 5) throw new Error('add 1–5 diagnoses')
  const diagnosisRefs = dxMentah.map((d) => {
    const x = (d ?? {}) as Record<string, unknown>
    const system = x.system === 'icd-10' || x.system === 'snomed-ct' ? x.system : 'local'
    const verificationStatus = x.verificationStatus === 'confirmed' || x.verificationStatus === 'differential' ? x.verificationStatus : 'provisional'
    return { system, code: teks(x.code, 'diagnosis code', 40), display: teks(x.display, 'diagnosis name', 120), verificationStatus } as RencanaPerawatan['diagnosisRefs'][number]
  })
  const qMentah = Array.isArray(m.questions) ? m.questions : []
  if (qMentah.length < 1 || qMentah.length > 20) throw new Error('add 1–20 questions')
  const ids = new Set<string>()
  const questions: PertanyaanRencana[] = qMentah.map((q) => {
    const x = (q ?? {}) as Record<string, unknown>
    const id = teks(x.id, 'question id', 40)
    if (!ID.test(id) || ids.has(id)) throw new Error('question ids must be unique letters/numbers')
    ids.add(id)
    const kind = x.kind as JenisPertanyaan
    if (!['boolean', 'number', 'text', 'choice'].includes(kind)) throw new Error('invalid question type')
    const choices = kind === 'choice' ? (Array.isArray(x.choices) ? x.choices : []).map((c) => teks(c, 'choice', 60)) : undefined
    if (kind === 'choice' && (!choices || choices.length < 1 || choices.length > 12)) throw new Error('choice questions need 1–12 choices')
    const unit = x.unit == null || x.unit === '' ? undefined : teks(x.unit, 'unit', 20)
    return {
      id, metric: `daily.${id}`, prompt: teks(x.prompt, 'question', 300), kind,
      domain: x.domain === 'medication' ? 'medication' : 'symptom', required: x.required === true,
      ...(unit ? { unit } : {}), ...(choices ? { choices } : {}),
    }
  })
  const aturanMentah = Array.isArray(m.patientReportedReviewRules) ? m.patientReportedReviewRules : []
  if (aturanMentah.length > 20) throw new Error('at most 20 review rules')
  const patientReportedReviewRules: AturanLaporanPasien[] = aturanMentah.map((r, i) => {
    const x = (r ?? {}) as Record<string, unknown>
    const questionId = String(x.questionId ?? '')
    if (!ids.has(questionId)) throw new Error('a review rule points to an unknown question')
    if (!OPS.includes(x.operator as Operator)) throw new Error('invalid rule operator')
    if (!nilaiSah(x.value)) throw new Error('invalid rule value')
    return {
      id: `rule-${i + 1}`, label: teks(x.label, 'rule label', 120), questionId, operator: x.operator as Operator,
      value: x.value as boolean | number | string,
      priority: x.priority === 'immediate-human-review' ? 'immediate-human-review' : 'review-today',
      rationale: teks(x.rationale, 'rule rationale', 300),
    }
  })
  const ukurMentah = Array.isArray(m.measurementReviewRules) ? m.measurementReviewRules : []
  if (ukurMentah.length > 10) throw new Error('at most 10 measurement review rules')
  const measurementReviewRules: AturanPengukuran[] = ukurMentah.map((r, i) => {
    const x = (r ?? {}) as Record<string, unknown>
    const metric = String(x.metric ?? '')
    const lab = /^lab\.[a-z0-9_-]{1,32}$/.test(metric)
    const vitalUnit = VITAL_RULE_UNITS[metric]
    if (!lab && !vitalUnit) throw new Error('measurement rule must name a supported lab or vital metric')
    if (x.operator !== 'gte' && x.operator !== 'lte') throw new Error('measurement rule operator must be ≥ or ≤')
    const threshold = typeof x.threshold === 'number' ? x.threshold : NaN
    if (!Number.isFinite(threshold)) throw new Error('measurement rule threshold must be a number')
    const hari = typeof x.maxAgeDays === 'number' ? x.maxAgeDays : NaN
    if (!Number.isInteger(hari) || hari < 1 || hari > MAKS_HARI_UMUR_NILAI) throw new Error(`measurement rule age must be 1–${MAKS_HARI_UMUR_NILAI} days`)
    const unit = vitalUnit ?? teks(x.unit, 'lab rule unit', 20)
    if (vitalUnit && x.unit !== vitalUnit) throw new Error('vital rule unit must use the canonical unit')
    return {
      id: `${vitalUnit ? 'vital' : 'lab'}-rule-${i + 1}`, label: teks(x.label, 'measurement rule label', 120), metric, operator: x.operator, threshold,
      unit, maxAgeMinutes: hari * 1440,
      priority: x.priority === 'immediate-human-review' ? 'immediate-human-review' : 'review-today',
      rationale: teks(x.rationale, 'measurement rule rationale', 300),
      evidenceRef: teks(x.evidenceRef, 'evidence reference', 300),
      verifiedBy: clinicianId, verifiedAt: kini.toISOString(),
      sourcePolicy: vitalUnit ? 'verified-clinical-vital' : 'shared-lab-transcribed',
    }
  })
  const hariIni = kini.toISOString()
  return {
    id: `care-${randomBytes(8).toString('hex')}`, version: '1', subjectId, clinicianId,
    questionnaireId: `panaceamed-daily-${clinicianId}`, diagnosisRefs,
    activeFrom: new Date(Date.parse(hariIni.slice(0, 10) + 'T00:00:00Z')).toISOString(),
    schedule: { cadence: 'daily', graceMinutes: 720 },
    questions, patientReportedReviewRules, measurementReviewRules, monitoredMetrics: [...new Set(measurementReviewRules.map((r) => r.metric))],
  }
}

// The authenticated clinician explicitly approves the exact stored plan content.
// This records session-bound approval; it is not a certificate or clinical validation.
function planHash(plan: RencanaPerawatan): string {
  const { signature: _signature, ...content } = plan
  return createHash('sha256').update(JSON.stringify(content)).digest('hex')
}
export function signCarePlan(plan: RencanaPerawatan, actorId: string, at: Date): RencanaPerawatan {
  if (!actorId || actorId !== plan.clinicianId || !Number.isFinite(at.getTime())) throw new Error('invalid care plan signer')
  return { ...plan, signature: { actorId, at: at.toISOString(), contentHash: planHash(plan) } }
}
export function isSignedCarePlan(plan: RencanaPerawatan): boolean {
  const signature = plan?.signature
  return !!signature && typeof signature.actorId === 'string' && signature.actorId === plan.clinicianId
    && typeof signature.at === 'string' && Number.isFinite(Date.parse(signature.at))
    && signature.contentHash === planHash(plan)
}

/** Jawaban mentah pasien harus cocok dengan pertanyaan rencana. */
export function susunLaporan(rencana: RencanaPerawatan, masukan: unknown, kini: Date): LaporanHarian {
  const m = (masukan ?? {}) as Record<string, unknown>
  const tanggal = String(m.scheduledFor ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) throw new Error('invalid check-in date')
  const batas = new Date(kini.getTime() + 864e5).toISOString().slice(0, 10)
  if (tanggal > batas || tanggal < rencana.activeFrom.slice(0, 10)) throw new Error('check-in date is outside the plan')
  const jawabanMentah = Array.isArray(m.answers) ? m.answers : []
  const terlihat = new Set<string>()
  const answers = jawabanMentah.map((a) => {
    const x = (a ?? {}) as Record<string, unknown>
    const q = rencana.questions.find((p) => p.id === x.questionId)
    if (!q) throw new Error('answer to an unknown question')
    if (terlihat.has(q.id)) throw new Error('duplicate answer')
    terlihat.add(q.id)
    const v = x.value
    const cocok = q.kind === 'boolean' ? typeof v === 'boolean'
      : q.kind === 'number' ? typeof v === 'number' && Number.isFinite(v)
      : typeof v === 'string' && v.length <= 1000 && (q.kind !== 'choice' || (q.choices ?? []).includes(v))
    if (!cocok) throw new Error(`answer does not fit question "${q.prompt.slice(0, 40)}"`)
    return { questionId: q.id, value: v as boolean | number | string }
  })
  const clientId = m.clientId == null ? undefined : String(m.clientId)
  if (clientId !== undefined && !/^[A-Za-z0-9_-]{8,64}$/.test(clientId)) throw new Error('invalid client id')
  const authoredMentah = m.authoredAt == null ? null : Date.parse(String(m.authoredAt))
  // Jawaban yang diantre offline membawa waktu ditulisnya; diterima hanya bila masuk akal (≤ 7 hari lalu, tidak di masa depan).
  const authoredAt = authoredMentah != null && Number.isFinite(authoredMentah) && authoredMentah <= kini.getTime() + 5 * 60e3 && authoredMentah >= kini.getTime() - 7 * 864e5
    ? new Date(authoredMentah).toISOString() : kini.toISOString()
  return {
    id: `daily-${randomBytes(8).toString('hex')}`, planId: rencana.id, planVersion: rencana.version,
    subjectId: rencana.subjectId, scheduledFor: `${tanggal}T00:00:00.000Z`, authoredAt, answers,
    ...(clientId ? { clientId } : {}),
  }
}

// ── Ekspor FHIR R4: Questionnaire + QuestionnaireResponse ────────────────
// Jawaban MENTAH pasien saja (patient-reported). Prioritas/aturan yang
// terpicu TIDAK diekspor: itu dihitung ulang oleh kernel di peramban dokter,
// dan menuliskannya di sini akan membuat server tampak menilai secara klinis.

export function laporanKeBundelFhir(rencana: RencanaPerawatan, laporan: LaporanHarian[], pasienRef: string, dibuat: string) {
  const qUrl = `urn:uuid:${uuidStabil(`Questionnaire/${rencana.id}/${rencana.version}`)}`
  const canonical = `https://panaceamed.id/fhir/Questionnaire/${rencana.questionnaireId}|${rencana.version}`
  const tipe = { boolean: 'boolean', number: 'decimal', text: 'string', choice: 'choice' } as const
  const questionnaire = {
    resourceType: 'Questionnaire', url: canonical.split('|')[0], version: rencana.version, status: 'active',
    title: 'Daily check-in', subjectType: ['Patient'], date: dibuat,
    item: rencana.questions.map((q) => ({
      linkId: q.id, text: q.prompt, type: tipe[q.kind], required: q.required,
      ...(q.choices ? { answerOption: q.choices.map((c) => ({ valueString: c })) } : {}),
    })),
  }
  const qrs = laporan.filter((l) => l.planId === rencana.id).map((l) => {
    const url = `urn:uuid:${uuidStabil(`QuestionnaireResponse/${l.id}`)}`
    const item = l.answers.map((a) => {
      const q = rencana.questions.find((x) => x.id === a.questionId)!
      const answer = typeof a.value === 'boolean' ? { valueBoolean: a.value }
        : typeof a.value === 'number' ? (q.unit ? { valueQuantity: { value: a.value, unit: q.unit } } : { valueDecimal: a.value })
        : q.kind === 'choice' ? { valueString: a.value } : { valueString: a.value }
      return { linkId: q.id, text: q.prompt, answer: [answer] }
    })
    return { fullUrl: url, resource: {
      resourceType: 'QuestionnaireResponse', identifier: { system: 'https://panaceamed.id/fhir/NamingSystem/daily-checkin', value: l.id },
      questionnaire: canonical, status: 'completed', subject: { reference: pasienRef },
      authored: l.authoredAt, author: { reference: pasienRef }, source: { reference: pasienRef },
      extension: [{ url: 'https://panaceamed.id/fhir/StructureDefinition/scheduled-for', valueDate: l.scheduledFor.slice(0, 10) }],
      item,
    } }
  })
  const provenance = {
    resourceType: 'Provenance', recorded: dibuat,
    target: [{ reference: qUrl }, ...qrs.map((x) => ({ reference: x.fullUrl }))],
    agent: [
      { type: { text: 'author' }, who: { reference: pasienRef }, onBehalfOf: undefined },
      { type: { text: 'questionnaire author' }, who: { display: 'Clinician who authored the daily plan' } },
    ].map((a) => JSON.parse(JSON.stringify(a))),
    entity: [{ role: 'source', what: { display: 'Patient-reported answers; review priority is not included (recomputed by the clinician client)' } }],
  }
  return {
    resourceType: 'Bundle', type: 'collection', timestamp: dibuat,
    entry: [
      { fullUrl: qUrl, resource: questionnaire },
      ...qrs,
      { fullUrl: `urn:uuid:${uuidStabil(`Provenance/care/${rencana.id}/${dibuat}`)}`, resource: provenance },
    ],
  }
}

// ── Tindak lanjut terjadwal (Alpha A7) ─────────────────────────────────────────
// Dibuat HANYA dari rencana yang sudah bertanda tangan klinisi; pemilik = klinisi penanda tangan.
// Server tidak menentukan kapan tindak lanjut klinis diperlukan: tanggal dan alasan ditulis klinisi.
export const MAKS_TINDAK_LANJUT_PER_RENCANA = 50
export const MAKS_HARI_KE_DEPAN_TINDAK_LANJUT = 365
export interface TindakLanjut {
  id: string; planId: string; subjectId: string; ownerClinicianId: string
  dueDate: string; reason: string; status: 'scheduled'; createdAt: string; clientId?: string
}
const TGL = /^\d{4}-\d{2}-\d{2}$/
const ID_KLIEN = /^[A-Za-z0-9_-]{8,80}$/
function hariUtc(d: Date): number { return Math.floor(d.getTime() / 86_400_000) }

export function susunTindakLanjut(rencana: RencanaPerawatan, masukan: unknown, id: string, kini: Date): TindakLanjut {
  if (!isSignedCarePlan(rencana)) throw new Error('follow-up requires a clinician-signed care plan')
  if (!Number.isFinite(kini.getTime())) throw new Error('invalid clock')
  const m = (masukan && typeof masukan === 'object' ? masukan : {}) as Record<string, unknown>
  const dueDate = typeof m.dueDate === 'string' ? m.dueDate : ''
  const tanggal = TGL.test(dueDate) ? new Date(`${dueDate}T00:00:00Z`) : null
  if (!tanggal || !Number.isFinite(tanggal.getTime()) || tanggal.toISOString().slice(0, 10) !== dueDate) throw new Error('dueDate must be a real YYYY-MM-DD date')
  const selisih = hariUtc(tanggal) - hariUtc(kini)
  if (selisih < 0) throw new Error('dueDate cannot be in the past')
  if (selisih > MAKS_HARI_KE_DEPAN_TINDAK_LANJUT) throw new Error(`dueDate is more than ${MAKS_HARI_KE_DEPAN_TINDAK_LANJUT} days ahead`)
  const reason = typeof m.reason === 'string' ? m.reason.trim() : ''
  if (reason.length < 3 || reason.length > 300) throw new Error('reason must be 3-300 characters')
  let clientId: string | undefined
  if (m.clientId !== undefined) {
    if (typeof m.clientId !== 'string' || !ID_KLIEN.test(m.clientId)) throw new Error('invalid client id')
    clientId = m.clientId
  }
  return { id, planId: rencana.id, subjectId: rencana.subjectId, ownerClinicianId: rencana.clinicianId, dueDate, reason, status: 'scheduled', createdAt: kini.toISOString(), ...(clientId ? { clientId } : {}) }
}
