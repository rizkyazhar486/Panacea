// Validasi masukan Predictive Models Toolkit. Kolom kosong/teks/NaN/Infinity/di luar rentang ditolak (bukan dibaca 0), sehingga
// model ilustrasi tidak menampilkan angka dari masukan yang tidak pernah diisi. Rentang = kewajaran masukan, BUKAN ambang klinis.

export type FieldResult = { ok: true; value: number } | { ok: false; problem: string }

type Spec = { label: string; min: number; max: number; unit: string }

export const PREDICTIVE_FIELDS = {
  bodyFatPct: { label: 'Body fat', min: 2, max: 70, unit: '%' },
  hoursSinceMeal: { label: 'Hours since last meal', min: 0, max: 72, unit: 'h' },
  lightWithinMin: { label: 'Daylight within', min: 0, max: 240, unit: 'min' },
  coffeeWithinMin: { label: 'Coffee within', min: 0, max: 240, unit: 'min' },
  saunaMinutes: { label: 'Session length', min: 1, max: 180, unit: 'min' },
  saunaTempC: { label: 'Temperature', min: 40, max: 110, unit: '°C' },
  foodGrams: { label: 'Amount', min: 1, max: 2000, unit: 'g' },
} as const satisfies Record<string, Spec>

export type PredictiveField = keyof typeof PREDICTIVE_FIELDS

/** Teks kolom → angka tervalidasi. Kosong dan "0" dibedakan: 0 hanya sah bila rentang memuatnya. */
export function parsePredictiveField(field: PredictiveField, text: unknown): FieldResult {
  const s = PREDICTIVE_FIELDS[field]
  const range = `${s.min}–${s.max} ${s.unit}`
  if (typeof text !== 'string' || text.trim() === '') return { ok: false, problem: `${s.label} is empty — enter a value (${range}).` }
  const n = Number(text)
  if (!Number.isFinite(n)) return { ok: false, problem: `${s.label} must be a finite number (${range}).` }
  if (n < s.min || n > s.max) return { ok: false, problem: `${s.label} must be within ${range}.` }
  return { ok: true, value: n }
}
