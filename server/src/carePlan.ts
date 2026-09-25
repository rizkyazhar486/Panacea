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
  return {
    id: `daily-${randomBytes(8).toString('hex')}`, planId: rencana.id, planVersion: rencana.version,
    subjectId: rencana.subjectId, scheduledFor: `${tanggal}T00:00:00.000Z`, authoredAt: kini.toISOString(), answers,
  }
}
