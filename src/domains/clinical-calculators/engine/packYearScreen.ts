/**
 * Bungkus-tahun dan kelayakan penapisan kanker paru USPSTF 2021 (usia 50–80, ≥20 bungkus-tahun, masih merokok atau berhenti ≤15 tahun
 * lalu). Rumus (batang/hari ÷ 20 × tahun) dan kriteria dipindahkan dari halaman tanpa perubahan. Yang baru: tiap masukan diperiksa
 * rentangnya dan "belum diisi" dipisahkan dari "di luar rentang". Dulu usia kosong terbaca 0 dan halaman berkata "age or quit-date
 * criteria are not yet met" (seolah usia diperiksa dan tidak memenuhi), dan "tahun sejak berhenti" kosong terbaca 0 = masih merokok
 * sehingga kolom yang tak diisi dapat memenuhi syarat kelayakan. Kini kolom itu wajib diketik (0 = masih merokok). Rentang = batas
 * kewajaran masukan, BUKAN ambang klinis. Alat bantu penapisan, bukan diagnosis; keputusan tetap pada klinisi.
 */
import { inRange } from './inputs'

export const PACK_YEAR_RANGES = {
  cigsPerDay: { min: 0, max: 200, name: 'cigarettes per day', unit: '' },
  yearsSmoked: { min: 0, max: 90, name: 'years smoked', unit: ' years' },
  age: { min: 10, max: 120, name: 'age', unit: ' years' },
  quitYearsAgo: { min: 0, max: 100, name: 'years since quitting', unit: ' years' },
} as const
type Field = keyof typeof PACK_YEAR_RANGES

export const USPSTF_2021 = { minAge: 50, maxAge: 80, minPackYears: 20, maxYearsSinceQuit: 15 } as const

export type PackYearStatus = 'eligible' | 'pack-years-met-other-criteria-not' | 'below-pack-years'
export type PackYearInput = Readonly<Record<Field, number>>
export type PackYearResult = Readonly<{
  missing: readonly string[]
  invalid: readonly string[]
  packYears: number | null
  status: PackYearStatus | null
}>

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)

export function packYearScreen(input: PackYearInput): PackYearResult {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<Field, number>> = {}
  for (const k of Object.keys(PACK_YEAR_RANGES) as Field[]) {
    const { min, max, name, unit } = PACK_YEAR_RANGES[k]
    const v = input[k]
    if (isEmpty(v)) { missing.push(name); continue }
    if (!inRange(v, min, max)) { invalid.push(`${name} must be ${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, packYears: null, status: null }
  const { cigsPerDay, yearsSmoked, age, quitYearsAgo } = ok as Record<Field, number>
  const packYears = (cigsPerDay / 20) * yearsSmoked
  const eligible = packYears >= USPSTF_2021.minPackYears && age >= USPSTF_2021.minAge && age <= USPSTF_2021.maxAge &&
    quitYearsAgo <= USPSTF_2021.maxYearsSinceQuit && cigsPerDay > 0
  const status: PackYearStatus = eligible ? 'eligible' : packYears >= USPSTF_2021.minPackYears ? 'pack-years-met-other-criteria-not' : 'below-pack-years'
  return { missing, invalid, packYears, status }
}
