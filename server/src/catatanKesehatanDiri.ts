// Catatan self-vital dan VO₂max yang diketik pengguna, disimpan di profil
// kesehatan server agar tidak hanya hidup di peramban.
//
// Validasi di batas kepercayaan: klien tidak dipercaya. Baris tidak lengkap
// atau angka non-positif ditolak, bukan diisi nol.
import type { CatatanSelfVitalServer, CatatanVo2Server } from './keadaanLongitudinal.js'

export const MAKS_SELF_VITAL = 50
export const MAKS_VO2 = 50
const ID = /^[A-Za-z0-9_.:-]{1,80}$/

function angkaPositif(v: unknown, min = 0, max = 1e6): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= min || v > max) return null
  return v
}

export function validasiSelfVitalsLog(masukan: unknown): CatatanSelfVitalServer[] {
  if (!Array.isArray(masukan)) throw new Error('self vitals must be a list')
  if (masukan.length > MAKS_SELF_VITAL) throw new Error('too many self vitals')
  const keluar: CatatanSelfVitalServer[] = []
  const dilihat = new Set<string>()
  for (const b of masukan) {
    if (!b || typeof b !== 'object' || Array.isArray(b)) throw new Error('invalid self vital')
    const x = b as Record<string, unknown>
    if (typeof x.id !== 'string' || !ID.test(x.id)) throw new Error('invalid self vital id')
    if (dilihat.has(x.id)) continue
    if (typeof x.at !== 'string' || !Number.isFinite(Date.parse(x.at))) throw new Error('invalid self vital time')
    const systolic = angkaPositif(x.systolic, 0, 300)
    const diastolic = angkaPositif(x.diastolic, 0, 200)
    const heartRate = angkaPositif(x.heartRate, 0, 300)
    const spo2 = angkaPositif(x.spo2, 0, 100)
    const tempC = angkaPositif(x.tempC, 25, 45)
    if (systolic == null || diastolic == null || heartRate == null || spo2 == null || tempC == null) {
      throw new Error('incomplete self vital')
    }
    dilihat.add(x.id)
    keluar.push({ id: x.id, at: new Date(Date.parse(x.at)).toISOString(), systolic, diastolic, heartRate, spo2, tempC })
  }
  return keluar.sort((a, b) => b.at.localeCompare(a.at)).slice(0, MAKS_SELF_VITAL)
}

export function validasiVo2maxLog(masukan: unknown): CatatanVo2Server[] {
  if (!Array.isArray(masukan)) throw new Error('vo2max log must be a list')
  if (masukan.length > MAKS_VO2) throw new Error('too many vo2max entries')
  const keluar: CatatanVo2Server[] = []
  const dilihat = new Set<string>()
  for (const b of masukan) {
    if (!b || typeof b !== 'object' || Array.isArray(b)) throw new Error('invalid vo2max entry')
    const x = b as Record<string, unknown>
    if (typeof x.id !== 'string' || !ID.test(x.id)) throw new Error('invalid vo2max id')
    if (dilihat.has(x.id)) continue
    if (typeof x.at !== 'string' || !Number.isFinite(Date.parse(x.at))) throw new Error('invalid vo2max time')
    const value = angkaPositif(x.value, 0, 100)
    if (value == null) throw new Error('invalid vo2max value')
    const method = typeof x.method === 'string' && x.method.trim() ? x.method.trim().slice(0, 80) : 'Manual'
    dilihat.add(x.id)
    keluar.push({ id: x.id, at: new Date(Date.parse(x.at)).toISOString(), value, method })
  }
  return keluar.sort((a, b) => b.at.localeCompare(a.at)).slice(0, MAKS_VO2)
}

/** Baca daftar tersimpan tanpa melempar — baris rusak dilewati. */
export function bacaSelfVitalsLog(profil: Record<string, unknown> | undefined | null): CatatanSelfVitalServer[] {
  try {
    return validasiSelfVitalsLog(profil && Array.isArray(profil.selfVitalsLog) ? profil.selfVitalsLog : [])
  } catch {
    return []
  }
}

export function bacaVo2maxLog(profil: Record<string, unknown> | undefined | null): CatatanVo2Server[] {
  try {
    return validasiVo2maxLog(profil && Array.isArray(profil.vo2maxEntries) ? profil.vo2maxEntries : [])
  } catch {
    return []
  }
}
