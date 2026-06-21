// Chronic-care monitoring: target ranges & daily TTV (vital sign) evaluation.
// Helps patients with chronic conditions stay in range, with red-flag alerts
// that route to consultation / emergency.
import type { VitalSign } from './types'

export type VitalStatus = 'ok' | 'warn' | 'alert'

export interface VitalEval {
  label: string
  value: string
  unit: string
  status: VitalStatus
  target: string
}

function has(conditions: string[], ...kw: string[]): boolean {
  const c = conditions.join(' ').toLowerCase()
  return kw.some((k) => c.includes(k))
}

// Evaluate the latest reading against general + condition-specific targets.
export function evaluateVitals(v: VitalSign, conditions: string[]): VitalEval[] {
  const out: VitalEval[] = []
  const hyper = has(conditions, 'hipertensi', 'hypertension', 'darah tinggi', 'jantung')
  const dm = has(conditions, 'diabetes', 'dm', 'gula')

  // Blood pressure
  const bpTarget = hyper ? '<140/90' : '<130/85'
  let bp: VitalStatus = 'ok'
  if (v.systolic >= 160 || v.diastolic >= 100) bp = 'alert'
  else if (v.systolic >= (hyper ? 140 : 135) || v.diastolic >= 90) bp = 'warn'
  if (v.systolic < 90 || v.diastolic < 60) bp = 'alert' // hypotension
  out.push({ label: 'Tekanan Darah', value: `${v.systolic}/${v.diastolic}`, unit: 'mmHg', status: bp, target: bpTarget })

  // Heart rate
  let hr: VitalStatus = 'ok'
  if (v.heartRate > 120 || v.heartRate < 50) hr = 'alert'
  else if (v.heartRate > 100 || v.heartRate < 60) hr = 'warn'
  out.push({ label: 'Nadi', value: `${v.heartRate}`, unit: 'x/mnt', status: hr, target: '60–100' })

  // SpO2
  let spo2: VitalStatus = 'ok'
  if (v.spo2 < 92) spo2 = 'alert'
  else if (v.spo2 < 95) spo2 = 'warn'
  out.push({ label: 'SpO₂', value: `${v.spo2}`, unit: '%', status: spo2, target: '≥95' })

  // Temperature
  let temp: VitalStatus = 'ok'
  if (v.tempC >= 39 || v.tempC < 35) temp = 'alert'
  else if (v.tempC >= 37.5) temp = 'warn'
  out.push({ label: 'Suhu', value: `${v.tempC}`, unit: '°C', status: temp, target: '36–37.4' })

  // Glucose (only when measured)
  if (v.glucose != null) {
    let g: VitalStatus = 'ok'
    if (v.glucose >= 250 || v.glucose < 54) g = 'alert'
    else if (v.glucose >= (dm ? 180 : 200) || v.glucose < 70) g = 'warn'
    out.push({ label: 'Gula Darah', value: `${v.glucose}`, unit: 'mg/dL', status: g, target: dm ? '80–180' : '70–140' })
  }
  return out
}

// Worst status across all evaluated vitals (drives the alert banner).
export function overallStatus(evals: VitalEval[]): VitalStatus {
  if (evals.some((e) => e.status === 'alert')) return 'alert'
  if (evals.some((e) => e.status === 'warn')) return 'warn'
  return 'ok'
}

export const STATUS_COLOR: Record<VitalStatus, string> = { ok: '#00BF63', warn: '#f59e0b', alert: '#FF3131' }
export const STATUS_LABEL: Record<VitalStatus, string> = { ok: 'Terkontrol', warn: 'Perlu perhatian', alert: 'Bahaya' }
