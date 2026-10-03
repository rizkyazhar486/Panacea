import type { Hasil } from '../../../lib/longevity'

// Parkland/Baxter: 4 mL × kg × %TBSA kristaloid dalam 24 jam sejak LUKA BAKAR (bukan sejak tiba di RS);
// separuh pada 8 jam pertama, sisanya 16 jam berikutnya. Ini tampilan pendukung keputusan, bukan order cairan.
export interface ParklandHasil {
  total24hMl: number
  first8hMlPerH: number
  next16hMlPerH: number
}

const sah = (x: unknown, min: number, maks: number): x is number =>
  typeof x === 'number' && Number.isFinite(x) && x >= min && x <= maks

export function parklandFluid(beratKg: number, tbsaPersen: number): Hasil<ParklandHasil> {
  if (!sah(beratKg, 0.5, 300)) return { ok: false, alasan: 'Body weight must be 0.5–300 kg' }
  if (!sah(tbsaPersen, 0, 100)) return { ok: false, alasan: '%TBSA must be 0–100' }
  const total24hMl = 4 * beratKg * tbsaPersen
  return {
    ok: true,
    data: { total24hMl, first8hMlPerH: total24hMl / 2 / 8, next16hMlPerH: total24hMl / 2 / 16 },
  }
}
