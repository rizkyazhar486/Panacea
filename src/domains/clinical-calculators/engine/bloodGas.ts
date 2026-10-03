/**
 * Interpretasi gas darah bertahap: status pH → gangguan primer → adekuasi kompensasi (rumus Winter) → anion gap
 * terkoreksi albumin → delta ratio. Logika dan teks keluaran dipindahkan dari halaman tanpa perubahan; yang baru hanya
 * penolakan masukan di luar rentang (kolom kosong dibaca 0 dan sebelumnya menghasilkan "Acidemia"/gap palsu).
 * Alat bantu interpretasi, bukan diagnosis; tidak memeriksa konsistensi pH–PaCO2–HCO3 (itu fitur klinis terpisah).
 */
import { inRange } from './inputs'

// Batas kewarasan masukan (bukan ambang klinis).
export const ABG_RANGES = {
  ph: { min: 6.5, max: 8.0 },
  paco2: { min: 5, max: 150 },
  hco3: { min: 1, max: 60 },
  na: { min: 90, max: 200 },
  cl: { min: 50, max: 160 },
  albumin: { min: 0.5, max: 7 },
} as const

export type AbgInput = Readonly<{ ph: number; paco2: number; hco3: number; na: number; cl: number; albumin: number }>
export type AbgResult =
  | {
      ok: true
      data: {
        phStatus: 'Acidemia' | 'Alkalemia' | 'Normal pH'
        primary: string
        compensationNote: string
        correctedAnionGap: number
        anionGapHigh: boolean
        deltaRatioNote: string
      }
    }
  | { ok: false; reason: string }

const LABELS: Readonly<Record<keyof AbgInput, { name: string; unit: string }>> = {
  ph: { name: 'pH', unit: '' }, paco2: { name: 'PaCO2', unit: ' mmHg' }, hco3: { name: 'HCO3', unit: ' mEq/L' },
  na: { name: 'Na', unit: ' mEq/L' }, cl: { name: 'Cl', unit: ' mEq/L' }, albumin: { name: 'Albumin', unit: ' g/dL' },
}

export function interpretAbg(input: AbgInput): AbgResult {
  for (const key of Object.keys(ABG_RANGES) as (keyof AbgInput)[]) {
    const { min, max } = ABG_RANGES[key]
    if (!inRange(input[key], min, max)) return { ok: false, reason: `${LABELS[key].name} must be ${min}–${max}${LABELS[key].unit}` }
  }
  const { ph, paco2, hco3, na, cl, albumin } = input
  const acidemia = ph < 7.35
  const alkalemia = ph > 7.45

  let primary: string
  if (acidemia) primary = hco3 < 22 ? 'Metabolic Acidosis' : paco2 > 45 ? 'Respiratory Acidosis' : 'Mixed/unclear acidemia'
  else if (alkalemia) primary = hco3 > 26 ? 'Metabolic Alkalosis' : paco2 < 35 ? 'Respiratory Alkalosis' : 'Mixed/unclear alkalemia'
  else primary = (paco2 > 45 || paco2 < 35 || hco3 > 26 || hco3 < 22) ? 'Normal pH but abnormal PaCO2/HCO3 — possible mixed disorder (full compensation)' : 'Normal'

  const winterExpected = 1.5 * hco3 + 8
  const winterLo = winterExpected - 2
  const winterHi = winterExpected + 2
  let compensationNote = ''
  if (primary === 'Metabolic Acidosis') {
    if (paco2 < winterLo) compensationNote = `PaCO2 (${paco2}) is lower than the Winter's formula estimate (${winterLo.toFixed(1)}-${winterHi.toFixed(1)}) — suspect concomitant respiratory alkalosis.`
    else if (paco2 > winterHi) compensationNote = `PaCO2 (${paco2}) is higher than the Winter's formula estimate (${winterLo.toFixed(1)}-${winterHi.toFixed(1)}) — suspect concomitant respiratory acidosis.`
    else compensationNote = `Respiratory compensation is appropriate (Winter's estimate ${winterLo.toFixed(1)}-${winterHi.toFixed(1)}).`
  }

  const anionGap = na - (cl + hco3)
  const correctedAnionGap = anionGap + 2.5 * (4 - albumin)
  const anionGapHigh = correctedAnionGap > 12

  let deltaRatioNote = ''
  // Asidosis metabolik berarti HCO3 < 22, jadi penyebut (24 − HCO3) selalu positif di cabang ini.
  if (primary === 'Metabolic Acidosis' && anionGapHigh) {
    const deltaRatio = (correctedAnionGap - 12) / (24 - hco3)
    deltaRatioNote = deltaRatio < 0.4
      ? `Delta ratio ${deltaRatio.toFixed(2)} (<0.4) — suspect concomitant non-gap (hyperchloremic) acidosis.`
      : deltaRatio <= 2
      ? `Delta ratio ${deltaRatio.toFixed(2)} (0.4-2) — consistent with pure high-gap acidosis.`
      : `Delta ratio ${deltaRatio.toFixed(2)} (>2) — suspect concomitant metabolic alkalosis or chronic respiratory acidosis.`
  }

  return {
    ok: true,
    data: { phStatus: acidemia ? 'Acidemia' : alkalemia ? 'Alkalemia' : 'Normal pH', primary, compensationNote, correctedAnionGap, anionGapHigh, deltaRatioNote },
  }
}
