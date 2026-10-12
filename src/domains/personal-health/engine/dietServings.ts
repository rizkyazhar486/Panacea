// Sajian makanan per pekan untuk Carbon Diet. Kosong tetap tidak diketahui; negatif, NaN, Infinity,
// teks bukan angka, dan nilai di luar kewajaran ditolak — bukan dipaksa jadi 0 atau diterima apa adanya.
// Batas atas 100 sajian/pekan (~14/hari) adalah kewajaran input, bukan ambang gizi/klinis.
export const MAX_SERVINGS_PER_WEEK = 100

export type ServingParse =
  | { ok: true; value: number }
  | { ok: false; reason: 'required' | 'not_a_number' | 'negative' | 'too_many' }

export function parseServingField(text: unknown): ServingParse {
  if (typeof text === 'number') return checkServing(text)
  if (typeof text !== 'string') return { ok: false, reason: 'not_a_number' }
  const t = text.trim()
  if (t === '') return { ok: false, reason: 'required' }
  // Number('0x10') / Number('1e2') lolos Number(); hanya desimal polos yang dianggap input pengguna.
  if (!/^[+-]?\d+(\.\d+)?$/.test(t)) return { ok: false, reason: 'not_a_number' }
  return checkServing(Number(t))
}

function checkServing(n: number): ServingParse {
  if (!Number.isFinite(n)) return { ok: false, reason: 'not_a_number' }
  if (n < 0) return { ok: false, reason: 'negative' }
  if (n > MAX_SERVINGS_PER_WEEK) return { ok: false, reason: 'too_many' }
  return { ok: true, value: n }
}

// Data dari localStorage tidak dipercaya: hanya kunci dikenal dengan nilai sah yang dipertahankan.
export function sanitizeServings(raw: unknown, knownKeys: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {}
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return out
  const src = raw as Record<string, unknown>
  for (const k of knownKeys) {
    if (!Object.prototype.hasOwnProperty.call(src, k)) continue
    const v = src[k]
    if (typeof v !== 'number') continue
    const p = checkServing(v)
    if (p.ok) out[k] = p.value
  }
  return out
}

/** Sum only explicitly recorded foods. Missing categories are never inferred to be zero. */
export function estimateRecordedFood(servings: unknown, foods: readonly { key: string; servingG: number; kgCo2ePerKg: number }[]) {
  const clean = sanitizeServings(servings, foods.map(f => f.key))
  const entered = foods.filter(f => Object.prototype.hasOwnProperty.call(clean, f.key))
  const totalWeek = entered.length === 0 ? null : entered.reduce((sum, food) => sum + clean[food.key] * food.servingG / 1000 * food.kgCo2ePerKg, 0)
  return { totalWeek, recorded: entered.length, missing: foods.length - entered.length }
}
