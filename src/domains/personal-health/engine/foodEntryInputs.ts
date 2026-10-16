// Masukan catatan makan: nilai yang hilang BUKAN nol, dan porsi tidak pernah dikarang.
// Dulu (a) gram kosong pada kartu makanan kemasan menjadi `Number('') || 0` lalu dijepit ke 1 g, sehingga makanan 1 gram tersimpan diam-diam,
// dan nilai gizi per 100 g yang tidak ada disimpan sebagai 0 kkal; (b) keluaran model foto `+i.kcal || 0` / `+i.grams || 100` menyimpan kalori
// yang hilang sebagai 0 dan porsi yang hilang sebagai 100 g karangan. Sekarang masukan yang tidak lengkap ditolak atau dilewati secara eksplisit.

export const PORTION_GRAMS = { min: 1, max: 2000 } as const
export const DETECTED_LIMITS = { gramsMax: 5000, kcalMax: 10000, macroMax: 2000 } as const

/** Angka dari nilai mentah: angka hingga, atau teks angka tak-kosong; selain itu `NaN` (hilang), tidak pernah 0. */
function angka(v: unknown): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string' && v.trim() !== '') return Number(v)
  return Number.NaN
}

/** Gram porsi dari teks (koma desimal diterima). Kosong, bukan angka, atau di luar rentang → `null` (tidak diubah diam-diam jadi 1 atau 2000). */
export function parsePortionGrams(teks: unknown): number | null {
  if (typeof teks !== 'string') return null
  const v = angka(teks.replace(',', '.'))
  return Number.isFinite(v) && v >= PORTION_GRAMS.min && v <= PORTION_GRAMS.max ? v : null
}

/** Nilai gizi untuk `gram` dari nilai per 100 g; `null` bila nilai per 100 g tidak ada atau tidak sah (BUKAN 0). */
export function scaledPer100(per100: unknown, gram: number): number | null {
  if (typeof per100 !== 'number' || !Number.isFinite(per100) || per100 < 0 || !Number.isFinite(gram) || gram <= 0) return null
  const v = Math.round((per100 * gram) / 100)
  return Number.isFinite(v) ? v : null
}

export interface DetectedFoodDraft { name: string; grams: number; kcal: number; carbs: number; protein: number; fat: number }

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const own = (o: Record<string, unknown>, k: string): unknown => (Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined)

/**
 * Keluaran model (tidak tepercaya) → draf catatan makan. Tiap butir wajib punya nama, gram > 0 dan kalori/karbo/protein/lemak hingga
 * nonnegatif (nol eksplisit sah). Butir yang tidak lengkap atau tidak sah DILEWATI dan dihitung, tidak diisi dengan 0 atau 100 g.
 */
export function parseDetectedFoods(mentah: unknown): { items: DetectedFoodDraft[]; skipped: number } {
  if (!Array.isArray(mentah)) return { items: [], skipped: 0 }
  const items: DetectedFoodDraft[] = []
  let skipped = 0
  for (const e of mentah) {
    if (!isRecord(e)) { skipped++; continue }
    const nama = own(e, 'name')
    const grams = angka(own(e, 'grams')), kcal = angka(own(e, 'kcal')), carbs = angka(own(e, 'carbs')), protein = angka(own(e, 'protein')), fat = angka(own(e, 'fat'))
    const sah = typeof nama === 'string' && nama.trim() !== ''
      && Number.isFinite(grams) && grams >= 1 && grams <= DETECTED_LIMITS.gramsMax
      && Number.isFinite(kcal) && kcal >= 0 && kcal <= DETECTED_LIMITS.kcalMax
      && [carbs, protein, fat].every((m) => Number.isFinite(m) && m >= 0 && m <= DETECTED_LIMITS.macroMax)
    if (!sah) { skipped++; continue }
    items.push({ name: (nama as string).trim().slice(0, 60), grams: Math.round(grams), kcal: Math.round(kcal), carbs: Math.round(carbs), protein: Math.round(protein), fat: Math.round(fat) })
  }
  return { items, skipped }
}
