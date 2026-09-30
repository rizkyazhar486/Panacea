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

const TANGGAL = /^\d{4}-\d{2}-\d{2}$/
export const MAKS_TIDUR = 60
export const MAKS_MAKANAN = 200
export const MAKS_WELLNESS = 60

export interface CatatanTidurServer {
  id: string
  date: string
  hours: number
  bedtimeConsistent: boolean
}

export interface CatatanMakananServer {
  id: string
  date: string
  name: string
  grams: number
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export interface CatatanWellnessServer {
  date: string
  sleepHr?: number
  waterMl?: number
}

function tanggalSah(v: unknown): string | null {
  if (typeof v !== 'string' || !TANGGAL.test(v) || !Number.isFinite(Date.parse(v))) return null
  return v
}

function angkaRentang(v: unknown, min: number, max: number, termasukNol: boolean): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v) || v > max) return null
  if (termasukNol ? v < min : v <= min) return null
  return v
}

export function validasiDiarySleep(masukan: unknown): CatatanTidurServer[] {
  if (!Array.isArray(masukan)) throw new Error('sleep log must be a list')
  if (masukan.length > MAKS_TIDUR) throw new Error('too many sleep rows')
  const keluar: CatatanTidurServer[] = []
  const dilihat = new Set<string>()
  for (const b of masukan) {
    if (!b || typeof b !== 'object' || Array.isArray(b)) throw new Error('invalid sleep row')
    const x = b as Record<string, unknown>
    if (typeof x.id !== 'string' || !ID.test(x.id)) throw new Error('invalid sleep id')
    if (dilihat.has(x.id)) continue
    const date = tanggalSah(x.date)
    const hours = angkaRentang(x.hours, 0, 24, true)
    if (!date || hours == null) throw new Error('invalid sleep row')
    if (typeof x.bedtimeConsistent !== 'boolean') throw new Error('invalid sleep row')
    dilihat.add(x.id)
    keluar.push({ id: x.id, date, hours, bedtimeConsistent: x.bedtimeConsistent })
  }
  return keluar.sort((a, b) => b.date.localeCompare(a.date)).slice(0, MAKS_TIDUR)
}

export function validasiDiaryFoods(masukan: unknown): CatatanMakananServer[] {
  if (!Array.isArray(masukan)) throw new Error('food log must be a list')
  if (masukan.length > MAKS_MAKANAN) throw new Error('too many food rows')
  const keluar: CatatanMakananServer[] = []
  const dilihat = new Set<string>()
  for (const b of masukan) {
    if (!b || typeof b !== 'object' || Array.isArray(b)) throw new Error('invalid food row')
    const x = b as Record<string, unknown>
    if (typeof x.id !== 'string' || !ID.test(x.id)) throw new Error('invalid food id')
    if (dilihat.has(x.id)) continue
    const date = tanggalSah(x.date)
    const name = typeof x.name === 'string' ? x.name.trim().slice(0, 80) : ''
    const grams = angkaRentang(x.grams, 0, 5000, false)
    const kcal = angkaRentang(x.kcal, 0, 20000, false)
    const protein = angkaRentang(x.protein, 0, 2000, true)
    const carbs = angkaRentang(x.carbs, 0, 2000, true)
    const fat = angkaRentang(x.fat, 0, 2000, true)
    if (!date || !name || grams == null || kcal == null || protein == null || carbs == null || fat == null) {
      throw new Error('invalid food row')
    }
    dilihat.add(x.id)
    keluar.push({ id: x.id, date, name, grams, kcal, protein, carbs, fat })
  }
  return keluar.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)).slice(0, MAKS_MAKANAN)
}

export function validasiDiaryWellness(masukan: unknown): CatatanWellnessServer[] {
  if (!Array.isArray(masukan)) throw new Error('wellness log must be a list')
  if (masukan.length > MAKS_WELLNESS) throw new Error('too many wellness rows')
  const keluar: CatatanWellnessServer[] = []
  const dilihat = new Set<string>()
  for (const b of masukan) {
    if (!b || typeof b !== 'object' || Array.isArray(b)) throw new Error('invalid wellness row')
    const x = b as Record<string, unknown>
    const date = tanggalSah(x.date)
    if (!date || dilihat.has(date)) continue
    const row: CatatanWellnessServer = { date }
    if (x.sleepHr != null) {
      const sleepHr = angkaRentang(x.sleepHr, 0, 24, true)
      if (sleepHr == null) throw new Error('invalid wellness sleep')
      row.sleepHr = sleepHr
    }
    if (x.waterMl != null) {
      const waterMl = angkaRentang(x.waterMl, 0, 20000, true)
      if (waterMl == null) throw new Error('invalid wellness water')
      row.waterMl = waterMl
    }
    if (row.sleepHr == null && row.waterMl == null) continue
    dilihat.add(date)
    keluar.push(row)
  }
  return keluar.sort((a, b) => b.date.localeCompare(a.date)).slice(0, MAKS_WELLNESS)
}

function bacaDaftar(profil: Record<string, unknown> | undefined | null, kunci: string, validasi: (m: unknown) => unknown[]) {
  try {
    return validasi(profil && Array.isArray(profil[kunci]) ? profil[kunci] : [])
  } catch {
    return []
  }
}

export function bacaDiarySleep(profil: Record<string, unknown> | undefined | null) {
  return bacaDaftar(profil, 'diarySleep', validasiDiarySleep) as CatatanTidurServer[]
}
export function bacaDiaryFoods(profil: Record<string, unknown> | undefined | null) {
  return bacaDaftar(profil, 'diaryFoods', validasiDiaryFoods) as CatatanMakananServer[]
}
export function bacaDiaryWellness(profil: Record<string, unknown> | undefined | null) {
  return bacaDaftar(profil, 'diaryWellness', validasiDiaryWellness) as CatatanWellnessServer[]
}

export const MAKS_NISAN = 400
const MAKS_HAPUS_SEKALI = 100

function bacaNisan(profil: Record<string, unknown> | undefined | null, kunci: string): string[] {
  const mentah = profil?.[kunci]
  if (!Array.isArray(mentah)) return []
  const keluar: string[] = []
  for (const id of mentah) {
    if (typeof id === 'string' && ID.test(id) && !keluar.includes(id)) keluar.push(id)
  }
  return keluar.slice(-MAKS_NISAN)
}

export function bacaDiaryDihapus(profil: Record<string, unknown> | undefined | null): { foods: string[]; sleep: string[] } {
  return { foods: bacaNisan(profil, 'diaryRemovedFoods'), sleep: bacaNisan(profil, 'diaryRemovedSleep') }
}

export function validasiIdDihapus(masukan: unknown): string[] {
  if (!Array.isArray(masukan)) throw new Error('removed ids must be a list')
  if (masukan.length > MAKS_HAPUS_SEKALI) throw new Error('too many removed ids')
  const keluar: string[] = []
  for (const id of masukan) {
    if (typeof id !== 'string' || !ID.test(id)) throw new Error('invalid removed id')
    if (!keluar.includes(id)) keluar.push(id)
  }
  return keluar
}

function simpanNisan(ada: readonly string[], tambahan: readonly string[]): string[] {
  const keluar = [...ada]
  for (const id of tambahan) if (!keluar.includes(id)) keluar.push(id)
  return keluar.slice(-MAKS_NISAN)
}

/** One night stays one row. A new id for the same date replaces the stored night and names the id that must not return. */
export function gabungDiarySleep(
  tersimpan: readonly CatatanTidurServer[],
  masuk: readonly CatatanTidurServer[],
  dihapus: ReadonlySet<string>,
): { rows: CatatanTidurServer[]; diganti: string[] } {
  let rows = tersimpan.filter((r) => !dihapus.has(r.id))
  const diganti: string[] = []
  for (const row of masuk) {
    if (dihapus.has(row.id)) continue
    const sama = rows.filter((r) => r.date === row.date)
    if (sama.some((r) => r.id === row.id)) continue
    for (const lama of sama) diganti.push(lama.id)
    rows = rows.filter((r) => r.date !== row.date)
    rows.push(row)
  }
  return {
    rows: rows.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)).slice(0, MAKS_TIDUR),
    diganti,
  }
}

export function gabungDiaryFoods(
  tersimpan: readonly CatatanMakananServer[],
  masuk: readonly CatatanMakananServer[],
  dihapus: ReadonlySet<string>,
): CatatanMakananServer[] {
  const ids = new Set<string>()
  const gabung: CatatanMakananServer[] = []
  for (const row of tersimpan) {
    if (dihapus.has(row.id) || ids.has(row.id)) continue
    ids.add(row.id)
    gabung.push(row)
  }
  for (const row of masuk) {
    if (dihapus.has(row.id) || ids.has(row.id)) continue
    ids.add(row.id)
    gabung.push(row)
  }
  return gabung.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)).slice(0, MAKS_MAKANAN)
}

/** Same date keeps stored numbers and only fills fields the account does not have yet. */
export function gabungDiaryWellness(tersimpan: readonly CatatanWellnessServer[], masuk: readonly CatatanWellnessServer[]): CatatanWellnessServer[] {
  const byDate = new Map(tersimpan.map((r) => [r.date, { ...r }]))
  for (const row of masuk) {
    const ada = byDate.get(row.date)
    if (!ada) { byDate.set(row.date, { ...row }); continue }
    if (ada.sleepHr == null && row.sleepHr != null) ada.sleepHr = row.sleepHr
    if (ada.waterMl == null && row.waterMl != null) ada.waterMl = row.waterMl
  }
  return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, MAKS_WELLNESS)
}

const KUNCI_DIARY_TERKUNCI = ['selfVitalsLog', 'vo2maxEntries', 'diarySleep', 'diaryFoods', 'diaryWellness', 'diaryRemovedFoods', 'diaryRemovedSleep'] as const

/** Generic profile writes cannot set diary rows or their tombstones. */
export function buangKunciDiary(data: Record<string, unknown>): Record<string, unknown> {
  const keluar: Record<string, unknown> = { ...data }
  for (const kunci of KUNCI_DIARY_TERKUNCI) delete keluar[kunci]
  return keluar
}

/** Validate then union. A listed id is removed and remembered so a later upload cannot restore it. */
export function susunPatchDiary(
  profil: Record<string, unknown> | undefined | null,
  body: { sleepLogs?: unknown; foods?: unknown; wellness?: unknown; removeFoodIds?: unknown; removeSleepIds?: unknown },
): Record<string, unknown> {
  const foodsHapus = body && 'removeFoodIds' in body ? validasiIdDihapus(body.removeFoodIds) : []
  const sleepHapus = body && 'removeSleepIds' in body ? validasiIdDihapus(body.removeSleepIds) : []
  const dihapus = bacaDiaryDihapus(profil)
  const nisanMakan = simpanNisan(dihapus.foods, foodsHapus)
  const nisanTidurAwal = simpanNisan(dihapus.sleep, sleepHapus)
  const patch: Record<string, unknown> = {}
  if (body && ('sleepLogs' in body || sleepHapus.length > 0)) {
    const masuk = 'sleepLogs' in body ? validasiDiarySleep(body.sleepLogs) : []
    const hasil = gabungDiarySleep(bacaDiarySleep(profil), masuk, new Set(nisanTidurAwal))
    const masihHidup = new Set(hasil.rows.map((r) => r.id))
    const nisanTidur = simpanNisan(nisanTidurAwal, hasil.diganti.filter((id) => !masihHidup.has(id)))
    patch.diarySleep = hasil.rows.filter((r) => !nisanTidur.includes(r.id))
    patch.diaryRemovedSleep = nisanTidur
  }
  if (body && ('foods' in body || foodsHapus.length > 0)) {
    patch.diaryFoods = gabungDiaryFoods(bacaDiaryFoods(profil), 'foods' in body ? validasiDiaryFoods(body.foods) : [], new Set(nisanMakan))
    patch.diaryRemovedFoods = nisanMakan
  }
  if (body && 'wellness' in body) patch.diaryWellness = gabungDiaryWellness(bacaDiaryWellness(profil), validasiDiaryWellness(body.wellness))
  if (!Object.keys(patch).length) throw new Error('diary payload is empty')
  return patch
}
