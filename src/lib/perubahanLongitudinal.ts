// Pengurutan "What changed" di atas status longitudinal kanonik — murni, teruji di Node.
import { numericMetricTrend, metricSnapshot, type LongitudinalPatientState } from './panaceaLongitudinalState.ts'
import { JENIS_LAB } from './lab.ts'

export const JENDELA_HARI = 180
const LABEL: Record<string, string> = {
  systolic: 'Systolic BP', diastolic: 'Diastolic BP', heartRate: 'Heart rate', restingHr: 'Resting heart rate',
  weightKg: 'Weight', spo2: 'SpO₂', temperatureC: 'Temperature', respiratoryRate: 'Respiratory rate', vo2max: 'VO₂max',
  glucose: 'Glucose', hrvMs: 'HRV', sleepH: 'Sleep',
}
export const labelMetrik = (m: string) => {
  if (m.startsWith('lab.')) return JENIS_LAB.find((j) => j.id === m.slice(4))?.nama ?? m.slice(4)
  const kunci = m.split('.').pop() ?? m
  return LABEL[kunci] ?? kunci.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
}
export const asal = (method?: string, kind?: string) => method === 'patient-transcribed-lab-report' ? 'from your lab report' : kind === 'wearable' || kind === 'device' ? 'from a device' : kind === 'clinical-system' ? 'clinical record' : 'self-recorded'
export const angka = (x: number) => Number(x.toFixed(Math.abs(x) < 10 ? 2 : 1)).toString()

export function perubahanTeratas(state: LongitudinalPatientState, kini: Date, batas = 5) {
  const sejak = new Date(kini.getTime() - JENDELA_HARI * 864e5).toISOString()
  return Object.keys(state.metricEventIds)
    .map((m) => ({ m, t: numericMetricTrend(state, m, sejak), s: metricSnapshot(state, m) }))
    .filter((x): x is { m: string; t: NonNullable<typeof x.t>; s: NonNullable<typeof x.s> } => !!x.t && !!x.s && x.t.relativeDelta !== null)
    .sort((a, b) => Math.abs(b.t.relativeDelta!) - Math.abs(a.t.relativeDelta!))
    .slice(0, batas)
}

