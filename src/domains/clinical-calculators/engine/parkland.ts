/**
 * Parkland (Baxter) burn resuscitation volumes. Murni dan deterministik; halaman hanya menampilkan hasilnya.
 * Rumus: total 24 jam = 4 mL × berat(kg) × %TBSA; separuh dalam 8 jam pertama sejak cedera, sisanya 16 jam.
 * Ini tampilan pendukung keputusan, bukan order: titrasi tetap terhadap keluaran urin oleh klinisi.
 */
export type ParklandResult =
  | { ok: true; data: { total24hMl: number; first8hMlPerHour: number; next16hMlPerHour: number } }
  | { ok: false; reason: string }

export const PARKLAND_WEIGHT_KG = { min: 0.5, max: 300 } as const
// Batas bawah eksklusif: 0 %TBSA bukan luka bakar, jadi tidak ada volume yang bermakna.
export const PARKLAND_TBSA_PERCENT = { min: 0, max: 100 } as const

const finite = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)

export function parklandVolumes(weightKg: number, tbsaPercent: number): ParklandResult {
  if (!finite(weightKg) || weightKg < PARKLAND_WEIGHT_KG.min || weightKg > PARKLAND_WEIGHT_KG.max) {
    return { ok: false, reason: `Weight must be ${PARKLAND_WEIGHT_KG.min}–${PARKLAND_WEIGHT_KG.max} kg` }
  }
  if (!finite(tbsaPercent) || tbsaPercent <= PARKLAND_TBSA_PERCENT.min || tbsaPercent > PARKLAND_TBSA_PERCENT.max) {
    return { ok: false, reason: '%TBSA must be above 0 and at most 100' }
  }
  const total24hMl = 4 * weightKg * tbsaPercent
  return {
    ok: true,
    data: { total24hMl, first8hMlPerHour: total24hMl / 2 / 8, next16hMlPerHour: total24hMl / 2 / 16 },
  }
}
