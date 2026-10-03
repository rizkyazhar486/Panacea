/**
 * Child-Pugh (Pugh et al. 1973): lima kriteria bernilai 1–3, total 5–15, kelas A/B/C. Ambang poin, batas kelas dan angka
 * kesintasan populasi dipindahkan dari halaman tanpa perubahan. Yang baru: kolom lab kosong ("belum diisi") dipisahkan dari
 * nilai di luar rentang; keduanya tidak menghasilkan poin. Dulu kolom kosong terbaca 0 → bilirubin/albumin/INR kosong diberi
 * poin yang tampak sah, dan angka mustahil (bilirubin 9999) tetap menghasilkan kelas. Rentang di bawah adalah batas kewajaran
 * masukan, bukan ambang klinis. Asites dan ensefalopati adalah jawaban yang selalu ada (1 = tidak ada) dan harus 1, 2 atau 3.
 * Estimasi tingkat populasi, bukan prognosis individu.
 */
import { inRange } from './inputs'

export const CHILD_PUGH_RANGES = {
  bilirubin: { min: 0.1, max: 60, name: 'total bilirubin', unit: ' mg/dL' },
  albumin: { min: 0.5, max: 7, name: 'albumin', unit: ' g/dL' },
  inr: { min: 0.5, max: 15, name: 'INR', unit: '' },
} as const
type LabField = keyof typeof CHILD_PUGH_RANGES

export type ChildPughLevel = 1 | 2 | 3
export type ChildPughTone = 'brand' | 'low' | 'critical'
export type ChildPughClass = Readonly<{ label: string; tone: ChildPughTone; survival: string }>
export type ChildPughInput = Readonly<{ bilirubin: number; albumin: number; inr: number; ascites: number; enceph: number }>
export type ChildPughResult =
  | Readonly<{ ok: true; points: number; cls: ChildPughClass }>
  | Readonly<{ ok: false; /** Nama kolom lab yang belum diisi. */ missing: readonly string[]; /** Pesan nilai di luar rentang. */ invalid: readonly string[] }>

export function bilirubinPts(v: number): ChildPughLevel {
  if (v < 2) return 1
  if (v <= 3) return 2
  return 3
}
export function albuminPts(v: number): ChildPughLevel {
  if (v > 3.5) return 1
  if (v >= 2.8) return 2
  return 3
}
export function inrPts(v: number): ChildPughLevel {
  if (v < 1.7) return 1
  if (v <= 2.3) return 2
  return 3
}

export function classifyChildPugh(score: number): ChildPughClass {
  if (score <= 6) return { label: 'Class A', tone: 'brand', survival: '~100% 1-year, ~85% 2-year survival' }
  if (score <= 9) return { label: 'Class B', tone: 'low', survival: '~80% 1-year, ~60% 2-year survival' }
  return { label: 'Class C', tone: 'critical', survival: '~45% 1-year, ~35% 2-year survival' }
}

export function childPugh(input: ChildPughInput): ChildPughResult {
  const missing: string[] = []
  const invalid: string[] = []
  for (const k of Object.keys(CHILD_PUGH_RANGES) as LabField[]) {
    const { min, max, name, unit } = CHILD_PUGH_RANGES[k]
    const v = input[k]
    if (typeof v === 'number' && Number.isNaN(v)) missing.push(name)
    else if (!inRange(v, min, max)) invalid.push(`${name} must be ${min}–${max}${unit}`)
  }
  for (const [v, name] of [[input.ascites, 'Ascites'], [input.enceph, 'Hepatic encephalopathy']] as const) {
    if (v !== 1 && v !== 2 && v !== 3) invalid.push(`${name} must be 1, 2 or 3 points`)
  }
  if (missing.length > 0 || invalid.length > 0) return { ok: false, missing, invalid }
  const points = bilirubinPts(input.bilirubin) + albuminPts(input.albumin) + inrPts(input.inr) + input.ascites + input.enceph
  return { ok: true, points, cls: classifyChildPugh(points) }
}
