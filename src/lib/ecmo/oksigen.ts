// Transport oksigen: kurva disosiasi (Severinghaus 1979) dan kandungan O2 (ELSO VV 2021).
// Satuan tunggal di seluruh mesin: Hb g/dL, S fraksi 0-1, PO2 mmHg, C mL/dL, Q L/min, VO2/DO2 mL/min.

export const KOEF_IKAT_HB = 1.39      // mL O2 per g Hb (ELSO VV 2021)
export const KOEF_LARUT = 0.0034      // mL O2 per dL per mmHg (ELSO VV 2021, dibaca dalam satuan dL)

/** Saturasi dari PO2, kurva baku (Severinghaus 1979, persamaan 1). */
export function saturasiDariPO2(po2: number): number {
  if (!(po2 > 0)) return 0
  return 1 / (23400 / (po2 ** 3 + 150 * po2) + 1)
}

/** PO2 dari saturasi: kebalikan numerik persamaan 1 (bisection; monoton naik). */
export function po2DariSaturasi(s: number): number {
  if (!(s > 0)) return 0
  if (s >= saturasiDariPO2(700)) return 700
  let lo = 0, hi = 700
  for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (saturasiDariPO2(mid) < s) lo = mid; else hi = mid }
  return (lo + hi) / 2
}

/** Kandungan O2 darah, mL/dL. */
export function kandunganO2(hbGdl: number, s: number, po2: number): number {
  return KOEF_IKAT_HB * hbGdl * s + KOEF_LARUT * po2
}

/** PO2 yang menghasilkan kandungan tertentu pada Hb tertentu (kebalikan monoton). */
export function po2DariKandungan(c: number, hbGdl: number): number {
  if (c <= 0) return 0
  let lo = 0, hi = 2000
  for (let i = 0; i < 90; i++) { const mid = (lo + hi) / 2; if (kandunganO2(hbGdl, saturasiDariPO2(mid), mid) < c) lo = mid; else hi = mid }
  return (lo + hi) / 2
}

export const hantaranO2 = (coLmin: number, caMlDl: number) => 10 * coLmin * caMlDl
