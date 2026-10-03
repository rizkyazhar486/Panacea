/**
 * Charlson Comorbidity Index (Charlson et al. 1987, J Chronic Dis 40:373): bobot 19 kondisi + poin usia dan estimasi
 * kesintasan 10 tahun 0.983^exp(0.9×skor). Bobot, pasangan eksklusif, ambang usia, dan rumus dipindahkan dari halaman
 * tanpa perubahan; yang baru hanya penolakan usia di luar rentang. Usia kosong sebelumnya terbaca 0 → poin usia 0 →
 * kesintasan yang tampak lebih baik dari sebenarnya. Estimasi tingkat populasi, bukan prognosis individu.
 */
import { inRange } from './inputs'

export const CHARLSON_CONDITIONS = [
  { key: 'mi', label: 'Myocardial infarction (history)', pts: 1 },
  { key: 'chf', label: 'Congestive heart failure', pts: 1 },
  { key: 'pvd', label: 'Peripheral vascular disease', pts: 1 },
  { key: 'cva', label: 'Cerebrovascular disease (CVA/TIA)', pts: 1 },
  { key: 'dementia', label: 'Dementia', pts: 1 },
  { key: 'copd', label: 'Chronic pulmonary disease', pts: 1 },
  { key: 'ctd', label: 'Connective tissue disease', pts: 1 },
  { key: 'pud', label: 'Peptic ulcer disease', pts: 1 },
  { key: 'liverMild', label: 'Mild liver disease', pts: 1 },
  { key: 'dm', label: 'Diabetes without end-organ damage', pts: 1 },
  { key: 'hemiplegia', label: 'Hemiplegia', pts: 2 },
  { key: 'ckd', label: 'Moderate-severe chronic kidney disease', pts: 2 },
  { key: 'dmOrgan', label: 'Diabetes with end-organ damage', pts: 2 },
  { key: 'tumor', label: 'Solid tumor (non-metastatic)', pts: 2 },
  { key: 'leukemia', label: 'Leukemia', pts: 2 },
  { key: 'lymphoma', label: 'Lymphoma', pts: 2 },
  { key: 'liverSevere', label: 'Moderate-severe liver disease', pts: 3 },
  { key: 'mets', label: 'Metastatic solid tumor', pts: 6 },
  { key: 'aids', label: 'AIDS', pts: 6 },
] as const

export const CHARLSON_AGE = { min: 18, max: 110 } as const

export function charlsonAgePoints(age: number): number {
  if (age < 50) return 0
  if (age < 60) return 1
  if (age < 70) return 2
  if (age < 80) return 3
  return 4
}

export type CharlsonResult =
  | { ok: true; data: { comorbidityPts: number; agePts: number; total: number; survival10y: number; tone: 'brand' | 'low' | 'critical' } }
  | { ok: false; reason: string }

export function charlsonIndex(age: number, checked: Readonly<Record<string, boolean>>): CharlsonResult {
  if (!inRange(age, CHARLSON_AGE.min, CHARLSON_AGE.max)) return { ok: false, reason: `Age must be ${CHARLSON_AGE.min}–${CHARLSON_AGE.max} years` }
  // Pasangan eksklusif: hanya bentuk yang lebih berat yang dihitung, seperti pada indeks aslinya.
  const comorbidityPts = CHARLSON_CONDITIONS.reduce((s, c) => {
    if (checked[c.key] !== true) return s
    if (c.key === 'dm' && checked.dmOrgan === true) return s
    if (c.key === 'liverMild' && checked.liverSevere === true) return s
    if (c.key === 'tumor' && checked.mets === true) return s
    return s + c.pts
  }, 0)
  const agePts = charlsonAgePoints(age)
  const total = comorbidityPts + agePts
  const survival10y = Math.pow(0.983, Math.exp(0.9 * total)) * 100
  const tone = survival10y >= 90 ? 'brand' : survival10y >= 50 ? 'low' : 'critical'
  return { ok: true, data: { comorbidityPts, agePts, total, survival10y, tone } }
}
