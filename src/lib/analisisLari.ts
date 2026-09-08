// Analisis lari dari sesi yang benar-benar tersimpan.
//
// Empat pertanyaan yang tidak terjawab oleh angka beban saja:
//   1. Sebaran intensitas — berapa yang benar-benar mudah?
//   2. Hanyutan denyut pada sesi panjang — apakah dasar aerobiknya kokoh?
//   3. Volume mingguan — naik, turun, atau tetap, dan seberapa cepat?
//   4. Perkiraan waktu lomba dari usaha terbaik yang tercatat.
//
// Semua mengembalikan null bila bahannya kurang. Tidak ada nilai bawaan.

import type { ImportedWorkout } from './workoutImport'

const HARI = 864e5

// ── 1. Sebaran intensitas ──────────────────────────────────────────────────
//
// Batas 80% dan 87% HRmaks memisahkan mudah / sedang / keras. Ini pembagian
// tiga zona yang dipakai kepustakaan latihan polarisasi (Seiler & Kjerland,
// 2006, Scand J Med Sci Sports 16:49-56), bukan lima zona perangkat.
//
// Rujukan 80/20 berasal dari pengamatan bahwa atlet ketahanan elite menghabiskan
// sekitar 80% waktunya di bawah ambang aerobik pertama. Itu POLA YANG DIAMATI
// pada atlet terlatih, bukan resep yang terbukti pada semua orang.

export interface Sebaran {
  menit: [number, number, number]
  persen: [number, number, number]
  totalMenit: number
  sesi: number
}

export function sebaranIntensitas(sesi: ImportedWorkout[], hrMax: number): Sebaran | null {
  if (!Number.isFinite(hrMax) || !(hrMax > 0)) return null
  const m: [number, number, number] = [0, 0, 0]
  let titik = 0
  let dipakai = 0
  for (const w of sesi) {
    if (!Array.isArray(w.hr) || !w.hr.length) continue
    let titikSesi = 0
    for (const p of w.hr) {
      if (!p || !Number.isFinite(p.t) || p.t < 0 || !Number.isFinite(p.bpm) || p.bpm <= 0) continue
      const pct = p.bpm / hrMax
      m[pct < 0.8 ? 0 : pct < 0.87 ? 1 : 2] += 1
      titik += 1
      titikSesi += 1
    }
    if (titikSesi > 0) dipakai += 1
  }
  if (titik < 30) return null
  const persen = m.map((x) => (x / titik) * 100) as [number, number, number]
  return { menit: m, persen, totalMenit: titik, sesi: dipakai }
}

export interface Hanyutan {
  tanggal: string
  nama: string
  km: number
  awalBpm: number
  akhirBpm: number
  persen: number
}

export function hanyutanDenyut(sesi: ImportedWorkout[], minMenit = 45): Hanyutan[] {
  if (!Number.isFinite(minMenit) || minMenit < 2) return []
  const out: Hanyutan[] = []
  for (const w of sesi) {
    if (!Array.isArray(w.hr) || !w.hr.length) continue
    const hrValid = w.hr.filter((p) =>
      Boolean(p) && Number.isFinite(p.t) && p.t >= 0 && Number.isFinite(p.bpm) && p.bpm > 0,
    )
    if (hrValid.length < minMenit) continue
    const tengah = Math.floor(hrValid.length / 2)
    const rata = (a: { bpm: number }[]) => a.reduce((s, p) => s + p.bpm, 0) / a.length
    const awal = rata(hrValid.slice(0, tengah))
    const akhir = rata(hrValid.slice(tengah))
    if (!(awal > 0) || !Number.isFinite(awal) || !Number.isFinite(akhir)) continue
    out.push({
      tanggal: w.mulai.slice(0, 10),
      nama: w.nama,
      km: w.jarakKm ?? 0,
      awalBpm: Math.round(awal),
      akhirBpm: Math.round(akhir),
      persen: ((akhir - awal) / awal) * 100,
    })
  }
  return out.sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1)).slice(0, 6)
}

export interface Volume {
  minggu: { mulai: string; km: number; menit: number }[]
  rataKm: number
  trenKmPerMinggu: number
}

export function volumeMingguan(sesi: ImportedWorkout[], jumlahMinggu = 8, sekarang = Date.now()): Volume | null {
  if (!sesi.length) return null
  const minggu: { mulai: string; km: number; menit: number }[] = []
  for (let i = jumlahMinggu - 1; i >= 0; i--) {
    const akhir = sekarang - i * 7 * HARI
    const awal = akhir - 7 * HARI
    const dalam = sesi.filter((w) => {
      const t = Date.parse(w.mulai)
      return t >= awal && t < akhir
    })
    minggu.push({
      mulai: new Date(awal).toISOString().slice(0, 10),
      km: dalam.reduce((a, w) => a + (w.jarakKm ?? 0), 0),
      menit: Math.round(dalam.reduce((a, w) => a + (w.durasi ?? 0), 0) / 60),
    })
  }
  const kmArr = minggu.map((m) => m.km)
  if (kmArr.every((k) => k === 0)) return null
  const n = kmArr.length
  const rataX = (n - 1) / 2
  const rataY = kmArr.reduce((a, b) => a + b, 0) / n
  let atas = 0
  let bawah = 0
  for (let i = 0; i < n; i++) {
    atas += (i - rataX) * (kmArr[i] - rataY)
    bawah += (i - rataX) ** 2
  }
  return { minggu, rataKm: rataY, trenKmPerMinggu: bawah === 0 ? 0 : atas / bawah }
}

export const RIEGEL_EKSPONEN = 1.06

export interface Perkiraan {
  dariKm: number
  dariDetik: number
  target: { km: number; label: string; detik: number; jauh: boolean }[]
}

const TARGET = [
  { km: 5, label: '5K' },
  { km: 10, label: '10K' },
  { km: 21.0975, label: 'Half' },
  { km: 42.195, label: 'Marathon' },
]

export function perkiraanRiegel(dariKm: number, dariDetik: number): Perkiraan | null {
  if (!(dariKm > 0 && dariDetik > 0)) return null
  return {
    dariKm,
    dariDetik,
    target: TARGET.filter((t) => Math.abs(t.km - dariKm) > 0.01).map((t) => ({
      km: t.km,
      label: t.label,
      detik: dariDetik * Math.pow(t.km / dariKm, RIEGEL_EKSPONEN),
      jauh: t.km > dariKm * 2,
    })),
  }
}

export interface MingguSebaran {
  mulai: string
  persen: [number, number, number]
  menit: number
}

export function sebaranPerMinggu(
  sesi: ImportedWorkout[],
  hrMax: number,
  jumlahMinggu = 6,
  sekarang = Date.now(),
): MingguSebaran[] {
  if (!(hrMax > 0)) return []
  const keluar: MingguSebaran[] = []
  for (let i = jumlahMinggu - 1; i >= 0; i--) {
    const akhir = sekarang - i * 7 * HARI
    const dalam = sesi.filter((w) => {
      const t = Date.parse(w.mulai)
      return t >= akhir - 7 * HARI && t < akhir
    })
    const s = sebaranIntensitas(dalam, hrMax)
    if (!s) continue
    keluar.push({ mulai: new Date(akhir - 7 * HARI).toISOString().slice(0, 10), persen: s.persen, menit: s.totalMenit })
  }
  return keluar
}
