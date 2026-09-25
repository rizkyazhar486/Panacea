// Status longitudinal kanonik → sistem tubuh di Body Exposure.
//
// Peta ini menjawab "di sistem organ mana tes ini LAZIM diinterpretasikan"
// (asosiasi edukatif), BUKAN "di mana letak kelainan pasien". Tes yang sistemnya
// tidak dimodelkan di Body Exposure (hematologi: Hb, MCV, RDW, feritin, B12;
// vitamin D yang lintas sistem) sengaja tidak dipetakan daripada dipaksakan.
import type { BodySystemId } from './bodySystemSourceWave.ts'
import { metricSnapshot, numericMetricTrend, type LongitudinalPatientState } from './panaceaLongitudinalState.ts'

export const SISTEM_UNTUK_METRIK: Readonly<Record<string, BodySystemId>> = {
  'lab.gdp': 'endocrine', 'lab.hba1c': 'endocrine', 'lab.tsh': 'endocrine',
  'lab.apob': 'cardiovascular', 'lab.ldl': 'cardiovascular', 'lab.hdl': 'cardiovascular', 'lab.tg': 'cardiovascular',
  'lab.kreatinin': 'urinary', 'lab.egfr': 'urinary',
  'lab.sgot': 'digestive', 'lab.sgpt': 'digestive', 'lab.alp': 'digestive', 'lab.albumin': 'digestive',
  'lab.crp': 'lymphatic-immune', 'lab.wbc': 'lymphatic-immune', 'lab.limfosit': 'lymphatic-immune',
}

/** Vital dari jembatan penyimpanan: kunci metrik diakhiri nama vitalnya. */
const VITAL: Readonly<Record<string, BodySystemId>> = {
  systolic: 'cardiovascular', diastolic: 'cardiovascular', heartRate: 'cardiovascular', restingHr: 'cardiovascular',
  spo2: 'respiratory', respiratoryRate: 'respiratory',
}

export function sistemUntukMetrik(metric: string): BodySystemId | null {
  if (SISTEM_UNTUK_METRIK[metric]) return SISTEM_UNTUK_METRIK[metric]
  if (metric.startsWith('lab.')) return null
  return VITAL[metric.split('.').pop() ?? ''] ?? null
}

export interface SinyalSistem {
  metric: string
  value: number
  unit?: string
  recordedAt: string
  count: number
  delta: number | null
  method?: string
}

export function sinyalPerSistem(state: LongitudinalPatientState): Map<BodySystemId, SinyalSistem[]> {
  const peta = new Map<BodySystemId, SinyalSistem[]>()
  for (const metric of Object.keys(state.metricEventIds)) {
    const sistem = sistemUntukMetrik(metric)
    const s = metricSnapshot(state, metric)
    if (!sistem || !s || typeof s.latest.value !== 'number') continue
    const t = numericMetricTrend(state, metric)
    const daftar = peta.get(sistem) ?? []
    daftar.push({ metric, value: s.latest.value, unit: s.latest.unit, recordedAt: s.latest.recordedAt, count: s.eventCount, delta: t ? t.absoluteDelta : null, method: s.latest.provenance.method })
    peta.set(sistem, daftar)
  }
  for (const d of peta.values()) d.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
  return peta
}
