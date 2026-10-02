// Perfusi organ dari keadaan sirkulasi + oksigen yang SAMA (tidak ada keadaan organ terpisah).
//
// Ginjal  : tekanan perfusi ginjal = MAP aorta distal − CVP (kongesti vena ikut menurunkan);
//           filtrasi relatif mengikuti kurva autoregulasi ILUSTRATIF; kreatinin berevolusi
//           lambat menurut neraca massa (Chen 2013): Vd·dCr/dt = produksi − GFR·Cr.
// Otak    : hantaran O2 cabang brakiosefal + karotis kiri; arah aliran otak terhadap PaCO2.
//           CPP = MAP − ICP; ICP TIDAK dimodelkan, jadi CPP tidak ditampilkan (bukan ditebak).
// Splanknik: hantaran O2 cabang viseral + CVP sebagai tanda kongesti.
// Tungkai : kanula femoral mengurangi lumen arteri; kanula perfusi distal (DPC) menambah aliran.
//           Arah dari meta-analisis Marbach 2022 (kanula < 17 Fr dan DPC profilaksis menurunkan
//           iskemia tungkai); besaran indeks ILUSTRATIF, bukan probabilitas.

import type { HasilSirkulasi } from './sirkulasi'
import type { KeadaanVA } from './mesin'

export interface KeadaanGinjal { tekananPerfusi: number; fraksiFiltrasi: number; status: 'terjaga' | 'turun' | 'sangat-turun' }

/** Fraksi filtrasi relatif terhadap tekanan perfusi ginjal (ilustratif: datar ≥ 75, nol ≤ 40 mmHg). */
export function fraksiFiltrasi(tekananPerfusi: number): number {
  return Math.max(0, Math.min(1, (tekananPerfusi - 40) / 35))
}

export function keadaanGinjal(h: HasilSirkulasi): KeadaanGinjal {
  const tp = h.mapDistal - h.cvp
  const f = fraksiFiltrasi(tp)
  return { tekananPerfusi: tp, fraksiFiltrasi: f, status: f >= 0.9 ? 'terjaga' : f >= 0.4 ? 'turun' : 'sangat-turun' }
}

export interface ParameterKreatinin { crAwal: number; gfrDasar: number; beratKg: number }
/**
 * Kreatinin plasma (mg/dL) setelah `jam` pada GFR konstan (mL/menit), solusi eksak neraca massa
 * Chen 2013. Produksi diambil dari keadaan tunak awal (produksi = GFRdasar·Cr0), Vd = 0,6·berat.
 */
export function kreatininSetelah(jam: number, gfr: number, p: ParameterKreatinin): number {
  const vdDl = 0.6 * p.beratKg * 10                   // L → dL
  const produksi = p.gfrDasar * (p.crAwal / 100)       // mg/menit (Cr mg/dL = mg per 100 mL)
  const menit = Math.max(0, jam) * 60
  if (gfr <= 1e-9) return p.crAwal + (produksi * menit) / vdDl
  const k = (gfr / 100) / vdDl                         // per menit (GFR mL/menit → dL/menit)
  const crTunak = produksi / (gfr / 100)
  return crTunak + (p.crAwal - crTunak) * Math.exp(-k * menit)
}

export interface KeadaanTungkai {
  fraksiLumenTersisa: number
  indeksPerfusi: number       // 0–1 relatif terhadap tungkai tanpa kanula
  saturasi: number
  status: 'cukup' | 'berkurang' | 'kritis'
}

/**
 * Tungkai sisi kanulasi. Kanula OD (mm) = Fr/3. Lumen tersisa = 1 − (d_kanula/d_arteri)².
 * DPC mengalirkan sebagian aliran ECMO langsung ke distal (0,15 L/menit per referensi 1,0 — ilustratif).
 */
export function keadaanTungkai(frKanula: number, diameterArteriMm: number, adaDpc: boolean, qEcmo: number, saturasiEcmo: number, saturasiTungkaiAsli: number): KeadaanTungkai {
  const dK = frKanula / 3
  const sisa = Math.max(0, 1 - (dK / diameterArteriMm) ** 2)
  const dpc = adaDpc && qEcmo > 0.2 ? Math.min(0.6, 0.15 * qEcmo) : 0
  const indeks = Math.min(1, sisa + dpc)
  const sat = indeks > 0 ? (sisa * saturasiTungkaiAsli + dpc * saturasiEcmo) / (sisa + dpc || 1) : NaN
  return { fraksiLumenTersisa: sisa, indeksPerfusi: indeks, saturasi: sat, status: indeks >= 0.6 ? 'cukup' : indeks >= 0.3 ? 'berkurang' : 'kritis' }
}

export interface KeadaanOrganVA {
  ginjal: KeadaanGinjal
  otakDo2: number        // mL O2/menit ke cabang kepala-leher (brakiosefal + karotis kiri)
  splanknikDo2: number   // mL O2/menit ke viseral
  cvp: number
}

export function keadaanOrganVA(h: HasilSirkulasi, v: KeadaanVA): KeadaanOrganVA {
  const do2 = (id: string) => v.cabang.find((c) => c.id === id)?.hantaranO2 ?? NaN
  return { ginjal: keadaanGinjal(h), otakDo2: do2('brakiosefal') + do2('karotis-kiri'), splanknikDo2: do2('viseral'), cvp: h.cvp }
}
