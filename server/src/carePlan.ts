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

import { randomBytes } from 'node:crypto'
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
  activeFrom: string; activeUntil?: string
  schedule: { cadence: 'daily'; graceMinutes: number }
  questions: PertanyaanRencana[]
  patientReportedReviewRules: AturanLaporanPasien[]
  measurementReviewRules: never[]
  monitoredMetrics: string[]
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
  const hariIni = kini.toISOString()
  return {
    id: `care-${randomBytes(8).toString('hex')}`, version: '1', subjectId, clinicianId,
    questionnaireId: `panaceamed-daily-${clinicianId}`, diagnosisRefs,
    activeFrom: new Date(Date.parse(hariIni.slice(0, 10) + 'T00:00:00Z')).toISOString(),
    schedule: { cadence: 'daily', graceMinutes: 720 },
    questions, patientReportedReviewRules, measurementReviewRules: [], monitoredMetrics: [],
  }
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
