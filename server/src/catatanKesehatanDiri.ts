// Catatan self-vital dan VO₂max yang diketik pengguna, disimpan di profil
// kesehatan server agar tidak hanya hidup di peramban.
//
// Validasi di batas kepercayaan: klien tidak dipercaya. Baris tidak lengkap
// atau angka non-positif ditolak, bukan diisi nol.
import type { CatatanSelfVitalServer, CatatanVo2Server } from './keadaanLongitudinal.js'
import { isRealCalendarDate } from './shared/calendarDate.js'

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

export const MAKS_TIDUR = 60
export const MAKS_MAKANAN = 200
export const MAKS_WELLNESS = 60
export const MAKS_LATIHAN = 120
export const MAKS_GPS = 80
const JENIS_OLAHRAGA = new Set(['run', 'cycle', 'swim', 'marathon', 'half_marathon', 'triathlon', 'walk'])

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

export interface CatatanLatihanServer {
  id: string
  date: string
  rpe: number
  type: string
  note?: string
}

export interface CatatanGpsServer {
  id: string
  name: string
  sport: string
  sportType: string
  emoji?: string
  distKm: number
  durSec: number
  avgSpeedKmh: number
  kcal: number
  at: string
  avgHr?: number
  maxHr?: number
}

function tanggalSah(v: unknown): string | null {
  if (typeof v !== 'string' || !isRealCalendarDate(v)) return null
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

export function bacaDiaryDihapus(profil: Record<string, unknown> | undefined | null): { foods: string[]; sleep: string[]; training: string[]; gps: string[] } {
  return {
    foods: bacaNisan(profil, 'diaryRemovedFoods'),
    sleep: bacaNisan(profil, 'diaryRemovedSleep'),
    training: bacaNisan(profil, 'diaryRemovedTraining'),
    gps: bacaNisan(profil, 'diaryRemovedGps'),
  }
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
  if (keluar.length > MAKS_NISAN) throw new Error('deletion memory is full')
  return keluar
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

/** Same date keeps an existing sleep value. Zero clears that night's sleep without dropping water. Water may rise, and zero clears that day's water without dropping sleep. */
export function gabungDiaryWellness(tersimpan: readonly CatatanWellnessServer[], masuk: readonly CatatanWellnessServer[]): CatatanWellnessServer[] {
  const byDate = new Map(tersimpan.map((r) => [r.date, { ...r }]))
  for (const row of masuk) {
    const ada = byDate.get(row.date) ?? { date: row.date }
    if (row.sleepHr === 0) delete ada.sleepHr
    else if (ada.sleepHr == null && row.sleepHr != null) ada.sleepHr = row.sleepHr
    if (row.waterMl === 0) delete ada.waterMl
    else if (row.waterMl != null && (ada.waterMl == null || row.waterMl > ada.waterMl)) ada.waterMl = row.waterMl
    if (ada.sleepHr == null && ada.waterMl == null) byDate.delete(row.date)
    else byDate.set(row.date, ada)
  }
  return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, MAKS_WELLNESS)
}

function gabungMenurutId<T extends { id: string }>(
  tersimpan: readonly T[],
  masuk: readonly T[],
  urut: (a: T, b: T) => number,
  maks: number,
  dihapus: ReadonlySet<string> = new Set(),
): T[] {
  const ids = new Set<string>()
  const gabung: T[] = []
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
  return gabung.sort(urut).slice(0, maks)
}

export function validasiDiaryTraining(masukan: unknown): CatatanLatihanServer[] {
  if (!Array.isArray(masukan)) throw new Error('training log must be a list')
  if (masukan.length > MAKS_LATIHAN) throw new Error('too many training rows')
  const keluar: CatatanLatihanServer[] = []
  const dilihat = new Set<string>()
  for (const b of masukan) {
    if (!b || typeof b !== 'object' || Array.isArray(b)) throw new Error('invalid training row')
    const x = b as Record<string, unknown>
    if (typeof x.id !== 'string' || !ID.test(x.id)) throw new Error('invalid training id')
    if (dilihat.has(x.id)) continue
    const date = tanggalSah(x.date)
    const rpe = angkaRentang(x.rpe, 1, 10, true)
    const type = typeof x.type === 'string' ? x.type.trim().slice(0, 40) : ''
    if (!date || rpe == null || !type) throw new Error('invalid training row')
    const row: CatatanLatihanServer = { id: x.id, date, rpe, type }
    if (x.note != null) {
      if (typeof x.note !== 'string') throw new Error('invalid training note')
      const note = x.note.trim().slice(0, 140)
      if (note) row.note = note
    }
    dilihat.add(x.id)
    keluar.push(row)
  }
  return keluar.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)).slice(0, MAKS_LATIHAN)
}

function detakOpsional(v: unknown, ada: boolean): number | undefined {
  if (!ada) return undefined
  const n = angkaRentang(v, 29, 230, false)
  if (n == null) throw new Error('invalid gps heart rate')
  return n
}

export function validasiDiaryGps(masukan: unknown): CatatanGpsServer[] {
  if (!Array.isArray(masukan)) throw new Error('gps log must be a list')
  if (masukan.length > MAKS_GPS) throw new Error('too many gps rows')
  const keluar: CatatanGpsServer[] = []
  const dilihat = new Set<string>()
  for (const b of masukan) {
    if (!b || typeof b !== 'object' || Array.isArray(b)) throw new Error('invalid gps row')
    const x = b as Record<string, unknown>
    if (typeof x.id !== 'string' || !ID.test(x.id)) throw new Error('invalid gps id')
    if (dilihat.has(x.id)) continue
    const name = typeof x.name === 'string' ? x.name.trim().slice(0, 60) : ''
    const sport = typeof x.sport === 'string' ? x.sport.trim().slice(0, 40) : ''
    const sportType = typeof x.sportType === 'string' ? x.sportType : ''
    const distKm = angkaRentang(x.distKm, 0, 500, false)
    const durSec = angkaRentang(x.durSec, 0, 86400, false)
    const avgSpeedKmh = angkaRentang(x.avgSpeedKmh, 0, 150, false)
    const kcal = angkaRentang(x.kcal, 0, 20000, true)
    if (!name || !sport || !JENIS_OLAHRAGA.has(sportType) || distKm == null || durSec == null || avgSpeedKmh == null || kcal == null) {
      throw new Error('invalid gps row')
    }
    if (typeof x.at !== 'string' || !Number.isFinite(Date.parse(x.at))) throw new Error('invalid gps time')
    const avgHr = detakOpsional(x.avgHr, x.avgHr != null)
    const maxHr = detakOpsional(x.maxHr, x.maxHr != null)
    if (avgHr != null && maxHr != null && maxHr < avgHr) throw new Error('invalid gps heart rate')
    const row: CatatanGpsServer = {
      id: x.id,
      name,
      sport,
      sportType,
      distKm,
      durSec,
      avgSpeedKmh,
      kcal,
      at: new Date(Date.parse(x.at)).toISOString(),
    }
    if (typeof x.emoji === 'string') {
      const emoji = x.emoji.trim().slice(0, 8)
      if (emoji) row.emoji = emoji
    } else if (x.emoji != null) throw new Error('invalid gps row')
    if (avgHr != null) row.avgHr = avgHr
    if (maxHr != null) row.maxHr = maxHr
    dilihat.add(x.id)
    keluar.push(row)
  }
  return keluar.sort((a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id)).slice(0, MAKS_GPS)
}

export function bacaDiaryTraining(profil: Record<string, unknown> | undefined | null) {
  return bacaDaftar(profil, 'diaryTraining', validasiDiaryTraining) as CatatanLatihanServer[]
}
export function bacaDiaryGps(profil: Record<string, unknown> | undefined | null) {
  return bacaDaftar(profil, 'diaryGps', validasiDiaryGps) as CatatanGpsServer[]
}

const KUNCI_DIARY_TERKUNCI = ['selfVitalsLog', 'vo2maxEntries', 'diarySleep', 'diaryFoods', 'diaryWellness', 'diaryTraining', 'diaryGps', 'diaryRemovedFoods', 'diaryRemovedSleep', 'diaryRemovedTraining', 'diaryRemovedGps'] as const

/** Generic profile writes cannot set diary rows or their tombstones. */
export function buangKunciDiary(data: Record<string, unknown>): Record<string, unknown> {
  const keluar: Record<string, unknown> = { ...data }
  for (const kunci of KUNCI_DIARY_TERKUNCI) delete keluar[kunci]
  return keluar
}

/** Validate then union. A listed id is removed and remembered so a later upload cannot restore it. */
export function susunPatchDiary(
  profil: Record<string, unknown> | undefined | null,
  body: { sleepLogs?: unknown; foods?: unknown; wellness?: unknown; trainingLogs?: unknown; gpsActivities?: unknown; removeFoodIds?: unknown; removeSleepIds?: unknown; removeTrainingIds?: unknown; removeGpsIds?: unknown },
): Record<string, unknown> {
  const foodsHapus = body && 'removeFoodIds' in body ? validasiIdDihapus(body.removeFoodIds) : []
  const sleepHapus = body && 'removeSleepIds' in body ? validasiIdDihapus(body.removeSleepIds) : []
  const trainingHapus = body && 'removeTrainingIds' in body ? validasiIdDihapus(body.removeTrainingIds) : []
  const gpsHapus = body && 'removeGpsIds' in body ? validasiIdDihapus(body.removeGpsIds) : []
  const dihapus = bacaDiaryDihapus(profil)
  const nisanMakan = simpanNisan(dihapus.foods, foodsHapus)
  const nisanTidurAwal = simpanNisan(dihapus.sleep, sleepHapus)
  const nisanLatihan = simpanNisan(dihapus.training, trainingHapus)
  const nisanGps = simpanNisan(dihapus.gps, gpsHapus)
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
  if (body && ('trainingLogs' in body || trainingHapus.length > 0)) {
    patch.diaryTraining = gabungMenurutId(
      bacaDiaryTraining(profil),
      'trainingLogs' in body ? validasiDiaryTraining(body.trainingLogs) : [],
      (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id),
      MAKS_LATIHAN,
      new Set(nisanLatihan),
    )
    patch.diaryRemovedTraining = nisanLatihan
  }
  if (body && ('gpsActivities' in body || gpsHapus.length > 0)) {
    patch.diaryGps = gabungMenurutId(
      bacaDiaryGps(profil),
      'gpsActivities' in body ? validasiDiaryGps(body.gpsActivities) : [],
      (a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id),
      MAKS_GPS,
      new Set(nisanGps),
    )
    patch.diaryRemovedGps = nisanGps
  }
  if (!Object.keys(patch).length) throw new Error('diary payload is empty')
  return patch
}
