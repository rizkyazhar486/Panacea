// Pengurutan "What changed" di atas status longitudinal kanonik — murni, teruji di Node.
import { numericMetricTrend, metricSnapshot, type LongitudinalPatientState } from './panaceaLongitudinalState.ts'
import { JENIS_LAB } from './lab.ts'

export const JENDELA_HARI = 180
const LABEL: Record<string, string> = {
  systolic: 'Systolic BP', diastolic: 'Diastolic BP', heartRate: 'Heart rate', restingHr: 'Resting heart rate',
  weightKg: 'Weight', spo2: 'SpO₂', temperatureC: 'Temperature', respiratoryRate: 'Respiratory rate', vo2max: 'VO₂max',
  glucose: 'Glucose', hrvMs: 'HRV', sleepH: 'Sleep',
}
export const labelMetrik = (m: string, labels: Record<string, string> = {}) => {
  if (labels[m]) return labels[m]
  if (m.startsWith('review.lab.')) return `Doctor review · ${JENIS_LAB.find((j) => j.id === m.slice(11))?.nama ?? m.slice(11)}`
  if (m.startsWith('lab.')) return JENIS_LAB.find((j) => j.id === m.slice(4))?.nama ?? m.slice(4)
  const kunci = m.split('.').pop() ?? m
  return LABEL[kunci] ?? kunci.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
}
export type SudutPandang = 'pasien' | 'dokter'
// Label asal dari sudut pandang pembaca: pasien membaca 'your lab report', dokter membaca 'patient-transcribed'.
export const asal = (method?: string, kind?: string, sudut: SudutPandang = 'pasien') => sudut === 'dokter'
  ? (method === 'clinician-review' ? 'clinician review' : method?.startsWith('daily-questionnaire:') ? 'patient daily check-in' : method === 'patient-transcribed-lab-report' ? 'patient-transcribed lab report' : kind === 'wearable' || kind === 'device' ? 'device' : kind === 'clinical-system' ? 'clinical record' : 'patient-recorded')
  : method === 'clinician-review' ? 'by your doctor' : method?.startsWith('daily-questionnaire:') ? 'daily check-in' : method === 'patient-transcribed-lab-report' ? 'from your lab report' : kind === 'wearable' || kind === 'device' ? 'from a device' : kind === 'clinical-system' ? 'clinical record' : 'self-recorded'
export const angka = (x: number) => Number(x.toFixed(Math.abs(x) < 10 ? 2 : 1)).toString()

export function perubahanTeratas(state: LongitudinalPatientState, kini: Date, batas = 5) {
  const sejak = new Date(kini.getTime() - JENDELA_HARI * 864e5).toISOString()
  return Object.keys(state.metricEventIds)
    .map((m) => ({ m, t: numericMetricTrend(state, m, sejak), s: metricSnapshot(state, m) }))
    .filter((x): x is { m: string; t: NonNullable<typeof x.t>; s: NonNullable<typeof x.s> } => !!x.t && !!x.s && x.t.relativeDelta !== null)
    .sort((a, b) => Math.abs(b.t.relativeDelta!) - Math.abs(a.t.relativeDelta!))
    .slice(0, batas)
}


// ── Timeline pribadi: "kapan", dari status kanonik yang sama ────────────────
export interface HariTimeline {
  tanggal: string
  butir: { id: string; metric: string; label: string; value: number | string; unit?: string; asal: string; keadaan?: import('./panaceaLongitudinalState').SemanticState }[]
}

/** Event dikelompokkan per tanggal (UTC, sesuai recordedAt), terbaru di atas. */
export function timelineHarian(state: LongitudinalPatientState, batasHari = 30, labels: Record<string, string> = {}, sudut: SudutPandang = 'pasien'): HariTimeline[] {
  const perHari = new Map<string, HariTimeline['butir']>()
  for (const e of Object.values(state.eventsById)) {
    if (typeof e.value !== 'number' && typeof e.value !== 'string' && typeof e.value !== 'boolean') continue
    const t = e.recordedAt.slice(0, 10)
    const d = perHari.get(t) ?? []
    d.push({ id: e.id, metric: e.metric, label: labelMetrik(e.metric, labels), value: typeof e.value === 'boolean' ? (e.value ? 'Yes' : 'No') : e.value, unit: e.unit, asal: asal(e.provenance.method, e.provenance.sourceKind, sudut), ...(e.semanticState ? { keadaan: e.semanticState } : {}) })
    perHari.set(t, d)
  }
  return [...perHari.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, batasHari)
    .map(([tanggal, butir]) => ({ tanggal, butir: butir.sort((a, b) => a.label.localeCompare(b.label)) }))
}
