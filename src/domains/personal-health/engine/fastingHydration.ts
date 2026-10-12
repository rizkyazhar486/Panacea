/**
 * Kalkulator kebiasaan Nutrition Toolkit (kopi & elektrolit puasa) sebagai fungsi murni.
 *
 * Halaman dulu membaca kolom kosong sebagai 0 (`Number(x) || 0`), sehingga "belum diisi" tampil sebagai target
 * 0 mg / 0 mL yang tampak sah. Di sini kolom kosong, NaN, Infinity, dan nilai di luar rentang ditolak dengan alasan
 * eksplisit dan tanpa angka. Rentang = kewajaran masukan (sama dengan atribut min/max kolom), BUKAN ambang klinis.
 * Koefisien elektrolit dipindahkan tanpa perubahan dari halaman; masih estimasi kasar, belum ditinjau klinisi.
 */
export type NutritionEstimate<T> = { ok: true; value: T } | { ok: false; problem: string }

export const FASTING_HYDRATION_REVIEW = {
  status: 'PENDING_CLINICAL_REVIEW', clinically_reviewed: false, coefficient_evidence: 'UNVERIFIED',
  reviewer: null, reviewed_at: null, evidence: null,
} as const

export const COFFEE_CUPS_MAX = 15
export const FASTING_HOURS_MAX = 72
const ML_PER_CUP = 150

const tolak = (problem: string) => ({ ok: false as const, problem })

/** Cangkir kopi hari ini: bilangan bulat 0–15; 0 sah hanya bila diketik eksplisit. */
export function coffeeFluidMl(cups: number): NutritionEstimate<{ ml: number }> {
  if (!Number.isFinite(cups)) return tolak('Enter the number of cups (a whole number from 0 to 15).')
  if (!Number.isInteger(cups) || cups < 0 || cups > COFFEE_CUPS_MAX) return tolak(`Cups must be a whole number from 0 to ${COFFEE_CUPS_MAX}.`)
  return { ok: true, value: { ml: cups * ML_PER_CUP } }
}

/** Jam puasa 0–72 (boleh pecahan); keluaran model ilustratif mg natrium/kalium/magnesium; bukan target asupan atau dosis. */
export function fastingElectrolytes(hours: number): NutritionEstimate<{ sodiumMg: number; potassiumMg: number; magnesiumMg: number }> {
  if (!Number.isFinite(hours)) return tolak('Enter how many hours you have been fasting (0 to 72).')
  if (hours < 0 || hours > FASTING_HOURS_MAX) return tolak(`Fasting hours must be between 0 and ${FASTING_HOURS_MAX}.`)
  return {
    ok: true,
    value: {
      sodiumMg: Math.min(3000, Math.round(hours * 60)),
      potassiumMg: Math.min(2500, Math.round(hours * 45)),
      magnesiumMg: Math.min(350, Math.round(hours * 8)),
    },
  }
}
