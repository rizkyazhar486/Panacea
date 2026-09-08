import { kunciTanggal } from './ramalan'
import type { ImportedWorkout } from './workoutImport'

export interface TrainingWeekSummary {
  sesi: number
  menit: number
  km: number
  kcal: number
  paceSec?: number
  sesiDurasi: number
  sesiJarak: number
  sesiHr: number
  sesiRpe: number
  sesiRecovery: number
}

export interface TrainingBlock28 {
  label: string
  menit: number
  km: number
  sesi: number
  sesiJarak: number
  srpe: number
  sesiRpe: number
  sesiDurasi: number
}

export interface SameActivityPacePoint {
  id: string
  label: string
  paceSec: number
}

export interface SameActivityHrrPoint {
  id: string
  label: string
  hrr1: number
}

export interface TrainingAnalytics {
  minggu: TrainingWeekSummary
  blok28: TrainingBlock28[]
  total28: {
    sesi: number
    menit: number
    km: number
    sesiDurasi: number
    sesiJarak: number
    sesiHr: number
    sesiRpe: number
    sesiRecovery: number
  }
  paceAktivitas: {
    nama: string
    titik: SameActivityPacePoint[]
  } | null
  hrrAktivitas: {
    nama: string
    titik: SameActivityHrrPoint[]
  } | null
}

function angkaPositif(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0
}

function angkaNonNegatif(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0
}

function rpeValid(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= 1 && v <= 10 ? v : null
}

function namaAktivitas(v: unknown): string {
  return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : ''
}

function tanggalAman(v: unknown): Date | null {
  if (typeof v !== 'string') return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

function adaHr(w: ImportedWorkout): boolean {
  return Array.isArray(w.hr) && w.hr.some((p) => Boolean(p) && Number.isFinite(p.t) && p.t >= 0 && Number.isFinite(p.bpm) && p.bpm > 0)
}

function adaRecovery(w: ImportedWorkout): boolean {
  return Array.isArray(w.pemulihan) && w.pemulihan.some((p) => Boolean(p) && Number.isFinite(p.t) && p.t >= 0 && Number.isFinite(p.bpm) && p.bpm > 0)
}

/**
 * HRR1 lama dari cache tidak dipercaya sendirian. Nilai hanya layak masuk tren
 * bila sesi juga masih memiliki sampel recovery yang benar-benar berada pada
 * jendela sekitar satu menit yang dipakai importer (45–75 detik).
 */
function hrr1Tervalidasi(w: ImportedWorkout): number | null {
  const hrr1 = angkaPositif(w.hrr1)
  if (!(hrr1 > 0) || !Array.isArray(w.pemulihan)) return null
  const punyaSampelMenit = w.pemulihan.some(
    (p) => Boolean(p) && Number.isFinite(p.t) && p.t >= 45 && p.t <= 75 && Number.isFinite(p.bpm) && p.bpm > 0,
  )
  return punyaSampelMenit ? Math.round(hrr1) : null
}

/**
 * Menyusun analytics deskriptif dari sesi yang sudah terekam.
 *
 * Tidak ada target, readiness score, injury prediction, atau klasifikasi
 * "baik/buruk". Setiap agregat hanya berasal dari field yang benar-benar ada.
 */
export function buildTrainingAnalytics(workouts: ImportedWorkout[], anchorInput: Date): TrainingAnalytics {
  const anchor = new Date(anchorInput)
  if (Number.isNaN(anchor.getTime())) {
    return {
      minggu: { sesi: 0, menit: 0, km: 0, kcal: 0, sesiDurasi: 0, sesiJarak: 0, sesiHr: 0, sesiRpe: 0, sesiRecovery: 0 },
      blok28: [],
      total28: { sesi: 0, menit: 0, km: 0, sesiDurasi: 0, sesiJarak: 0, sesiHr: 0, sesiRpe: 0, sesiRecovery: 0 },
      paceAktivitas: null,
      hrrAktivitas: null,
    }
  }
  anchor.setHours(12, 0, 0, 0)

  const tanggal28 = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(anchor)
    d.setDate(anchor.getDate() - (27 - i))
    return { key: kunciTanggal(d), date: d }
  })
  const keys28 = new Set(tanggal28.map((d) => d.key))
  const keys7 = new Set(tanggal28.slice(-7).map((d) => d.key))

  const valid = workouts
    .map((w) => ({ w, date: tanggalAman(w?.mulai) }))
    .filter((x): x is { w: ImportedWorkout; date: Date } => x.date !== null)
    .filter((x) => keys28.has(kunciTanggal(x.date)))

  const ringkas = (rows: typeof valid): TrainingWeekSummary => {
    let detik = 0
    let km = 0
    let kcal = 0
    let detikJarak = 0
    let kmPace = 0
    let sesiDurasi = 0
    let sesiJarak = 0
    let sesiHr = 0
    let sesiRpe = 0
    let sesiRecovery = 0

    for (const { w } of rows) {
      const d = angkaPositif(w.durasi)
      const j = angkaPositif(w.jarakKm)
      const k = angkaNonNegatif(w.kcal)
      detik += d
      km += j
      kcal += k
      if (d > 0) sesiDurasi += 1
      if (j > 0) sesiJarak += 1
      if (d > 0 && j > 0) {
        detikJarak += d
        kmPace += j
      }
      if (adaHr(w)) sesiHr += 1
      if (rpeValid(w.rpe) !== null && d > 0) sesiRpe += 1
      if (adaRecovery(w)) sesiRecovery += 1
    }

    return {
      sesi: rows.length,
      menit: Math.round(detik / 60),
      km: +km.toFixed(2),
      kcal: Math.round(kcal),
      paceSec: detikJarak > 0 && kmPace > 0 ? Math.round(detikJarak / kmPace) : undefined,
      sesiDurasi,
      sesiJarak,
      sesiHr,
      sesiRpe,
      sesiRecovery,
    }
  }

  const mingguRows = valid.filter((x) => keys7.has(kunciTanggal(x.date)))
  const minggu = ringkas(mingguRows)

  const blok28 = Array.from({ length: 4 }, (_, blok) => {
    const dates = tanggal28.slice(blok * 7, blok * 7 + 7)
    const keys = new Set(dates.map((d) => d.key))
    const rows = valid.filter((x) => keys.has(kunciTanggal(x.date)))
    const dasar = ringkas(rows)
    let srpe = 0
    for (const { w } of rows) {
      const d = angkaPositif(w.durasi)
      const rpe = rpeValid(w.rpe)
      if (d > 0 && rpe !== null) srpe += (d / 60) * rpe
    }
    const awal = dates[0].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const akhir = dates[dates.length - 1].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return {
      label: `${awal}–${akhir}`,
      menit: dasar.menit,
      km: dasar.km,
      sesi: dasar.sesi,
      sesiJarak: dasar.sesiJarak,
      srpe: Math.round(srpe),
      sesiRpe: dasar.sesiRpe,
      sesiDurasi: dasar.sesiDurasi,
    }
  })

  const total28Base = ringkas(valid)
  const total28 = {
    sesi: total28Base.sesi,
    menit: total28Base.menit,
    km: total28Base.km,
    sesiDurasi: total28Base.sesiDurasi,
    sesiJarak: total28Base.sesiJarak,
    sesiHr: total28Base.sesiHr,
    sesiRpe: total28Base.sesiRpe,
    sesiRecovery: total28Base.sesiRecovery,
  }

  const movement = valid
    .filter(({ w }) => namaAktivitas(w.nama) && angkaPositif(w.paceSec) > 0)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
  const latest = movement[0]
  let paceAktivitas: TrainingAnalytics['paceAktivitas'] = null
  if (latest) {
    const nama = namaAktivitas(latest.w.nama)
    const key = nama.toLocaleLowerCase()
    const titik = movement
      .filter(({ w }) => namaAktivitas(w.nama).toLocaleLowerCase() === key)
      .slice(0, 6)
      .reverse()
      .map(({ w, date }) => ({
        id: w.id,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        paceSec: Math.round(angkaPositif(w.paceSec)),
      }))
    if (titik.length >= 2) paceAktivitas = { nama, titik }
  }

  const hrrRows = valid
    .map((x) => ({ ...x, hrr1: hrr1Tervalidasi(x.w) }))
    .filter((x): x is typeof x & { hrr1: number } => x.hrr1 !== null && Boolean(namaAktivitas(x.w.nama)))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
  const latestHrr = hrrRows[0]
  let hrrAktivitas: TrainingAnalytics['hrrAktivitas'] = null
  if (latestHrr) {
    const nama = namaAktivitas(latestHrr.w.nama)
    const key = nama.toLocaleLowerCase()
    const titik = hrrRows
      .filter(({ w }) => namaAktivitas(w.nama).toLocaleLowerCase() === key)
      .slice(0, 6)
      .reverse()
      .map(({ w, date, hrr1 }) => ({
        id: w.id,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hrr1,
      }))
    if (titik.length >= 2) hrrAktivitas = { nama, titik }
  }

  return { minggu, blok28, total28, paceAktivitas, hrrAktivitas }
}
