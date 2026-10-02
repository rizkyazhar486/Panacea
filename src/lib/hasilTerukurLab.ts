// Hasil terukur alur lab → tren → tinjauan dokter → cek ulang (definisi v1).
//
// Ini ukuran PROSES, bukan ukuran klinis: menjawab "apakah alurnya menutup
// lingkaran?", bukan "apakah pasien menjadi lebih sehat". Ukuran hasil klinis
// (mis. perubahan HbA1c) membutuhkan protokol prospektif dan tidak dihitung di
// sini. Semua dihitung dari data yang benar-benar ada; bila penyebut nol,
// hasilnya null (bukan 0% dan bukan 100%).
//
// Definisi:
// 1. cakupanTinjauan = hasil di luar rentang yang ditinjau dokter untuk tes itu
//    dalam JENDELA_TINJAUAN_HARI setelah tanggal pengambilan / semua hasil di
//    luar rentang yang jendelanya sudah lewat.
// 2. medianHariKeTinjauan = median (tanggal tinjauan − tanggal pengambilan)
//    untuk hasil yang tertinjau menurut definisi 1.
// 3. kepatuhanCekUlang = tinjauan ber-cekUlangSebelum yang tenggatnya sudah
//    lewat DAN ada hasil baru tes itu setelah tanggal tinjauan hingga tenggat /
//    semua tinjauan ber-tenggat yang tenggatnya sudah lewat.

import { JENIS_LAB, rentangUntuk, type ButirLab } from './lab'

export const VERSI_DEFINISI = 'lab-outcome-v1'
export const JENDELA_TINJAUAN_HARI = 14

export interface TinjauanRingkas { tes: string; ditinjau: string; cekUlangSebelum?: string }
export interface Rasio { pembilang: number; penyebut: number; nilai: number | null }
export interface HasilTerukurLab {
  versi: string
  cakupanTinjauan: Rasio
  medianHariKeTinjauan: number | null
  kepatuhanCekUlang: Rasio
}

const hari = (a: string, b: string) => Math.round((Date.parse(`${b.slice(0, 10)}T00:00:00Z`) - Date.parse(`${a.slice(0, 10)}T00:00:00Z`)) / 864e5)
const rasio = (p: number, q: number): Rasio => ({ pembilang: p, penyebut: q, nilai: q ? p / q : null })

export function hitungHasilTerukur(lab: Record<string, ButirLab[]>, tinjauan: TinjauanRingkas[], hariIniISO: string): HasilTerukurLab {
  let p1 = 0, q1 = 0
  const jeda: number[] = []
  for (const j of JENIS_LAB) {
    for (const b of lab[j.id] ?? []) {
      const r = rentangUntuk(b, j)
      const luar = (r.bawah != null && b.nilai < r.bawah) || (r.atas != null && b.nilai > r.atas)
      if (!luar) continue
      const cocok = tinjauan
        .filter((t) => t.tes === j.id)
        .map((t) => hari(b.tanggal, t.ditinjau))
        .filter((d) => d >= 0 && d <= JENDELA_TINJAUAN_HARI)
      if (cocok.length) { p1++; q1++; jeda.push(Math.min(...cocok)); continue }
      if (hari(b.tanggal, hariIniISO) > JENDELA_TINJAUAN_HARI) q1++
    }
  }
  jeda.sort((a, b) => a - b)
  const tengah = jeda.length ? (jeda.length % 2 ? jeda[(jeda.length - 1) / 2] : (jeda[jeda.length / 2 - 1] + jeda[jeda.length / 2]) / 2) : null

  let p3 = 0, q3 = 0
  for (const t of tinjauan) {
    if (!t.cekUlangSebelum || t.cekUlangSebelum >= hariIniISO.slice(0, 10)) continue
    q3++
    const ada = (lab[t.tes] ?? []).some((b) => b.tanggal > t.ditinjau.slice(0, 10) && b.tanggal <= t.cekUlangSebelum!)
    if (ada) p3++
  }
  return { versi: VERSI_DEFINISI, cakupanTinjauan: rasio(p1, q1), medianHariKeTinjauan: tengah, kepatuhanCekUlang: rasio(p3, q3) }
}
