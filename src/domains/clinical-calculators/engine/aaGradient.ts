/**
 * Gradien oksigen alveolar–arteri (persamaan gas alveolar baku) dengan masukan tervalidasi. Rumus dan ambang dipindahkan
 * dari halaman tanpa perubahan; yang baru hanya penolakan masukan di luar rentang: kolom kosong dibaca 0 dan PaO2 kosong
 * sebelumnya menghasilkan "Elevated gradient". Aturan umur/4 + 4 berlaku pada udara ruangan; itu ditandai oleh pemanggil
 * lewat `supplementalOxygen`, bukan diubah di sini. Alat bantu interpretasi, bukan diagnosis.
 */
import { inRange } from './inputs'

export const AA_RANGES = {
  fio2: { min: 21, max: 100, unit: ' %' },
  pao2: { min: 1, max: 700, unit: ' mmHg' },
  paco2: { min: 5, max: 150, unit: ' mmHg' },
  age: { min: 0, max: 120, unit: ' years' },
  patm: { min: 400, max: 800, unit: ' mmHg' },
} as const

const NAMES: Readonly<Record<keyof typeof AA_RANGES, string>> = {
  fio2: 'FiO2', pao2: 'PaO2', paco2: 'PaCO2', age: 'Age', patm: 'Atmospheric pressure',
}

export const PH2O_MMHG = 47
export const RESPIRATORY_QUOTIENT = 0.8
/** Di atas FiO2 ini aturan umur/4 + 4 (diturunkan pada udara ruangan) tidak lagi berlaku apa adanya. */
export const ROOM_AIR_RULE_FIO2_MAX = 30

export type AaInput = Readonly<{ fio2: number; pao2: number; paco2: number; age: number; patm: number }>
export type AaResult =
  | { ok: true; data: { alveolar: number; gradient: number; expectedForAge: number; elevated: boolean; supplementalOxygen: boolean } }
  | { ok: false; reason: string }

export function aaGradient(input: AaInput): AaResult {
  for (const key of Object.keys(AA_RANGES) as (keyof typeof AA_RANGES)[]) {
    const { min, max, unit } = AA_RANGES[key]
    if (!inRange(input[key], min, max)) return { ok: false, reason: `${NAMES[key]} must be ${min}–${max}${unit}` }
  }
  const { fio2, pao2, paco2, age, patm } = input
  const alveolar = (fio2 / 100) * (patm - PH2O_MMHG) - paco2 / RESPIRATORY_QUOTIENT
  const gradient = alveolar - pao2
  const expectedForAge = age / 4 + 4
  return { ok: true, data: { alveolar, gradient, expectedForAge, elevated: gradient > expectedForAge, supplementalOxygen: fio2 > ROOM_AIR_RULE_FIO2_MAX } }
}
