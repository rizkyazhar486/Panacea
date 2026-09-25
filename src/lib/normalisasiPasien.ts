// Pasien dari server/penyimpanan lama bisa tidak lengkap (API menerima bentuk
// bebas). Satu komponen yang memanggil .map pada field array yang hilang akan
// menjatuhkan seluruh Shell, jadi field array & teks dinormalisasi di batas masuk.
// Tidak ada nilai klinis yang dikarang: yang hilang menjadi kosong, bukan tebakan.
import type { Patient } from './types.ts'

const daftar = (x: unknown): string[] => (Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string') : [])

export function normalisasiPasien(p: unknown): Patient | null {
  if (!p || typeof p !== 'object') return null
  const o = p as Record<string, unknown>
  const id = typeof o.id === 'string' ? o.id.trim() : ''
  if (!id) return null
  return {
    ...(o as unknown as Patient),
    id,
    name: typeof o.name === 'string' && o.name.trim() ? o.name : 'Unnamed patient',
    mrn: typeof o.mrn === 'string' ? o.mrn : '',
    allergies: daftar(o.allergies),
    chronicConditions: daftar(o.chronicConditions),
    riskFlags: daftar(o.riskFlags) as Patient['riskFlags'],
    avatarColor: typeof o.avatarColor === 'string' ? o.avatarColor : '#64748b',
  }
}

export function normalisasiDaftarPasien(xs: unknown): Patient[] {
  return (Array.isArray(xs) ? xs : []).map(normalisasiPasien).filter((p): p is Patient => p !== null)
}
