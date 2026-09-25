// Mesin tren lab pribadi — "kenali datamu sebelum gejalamu".
//
// Hasil lab dibandingkan dengan RIWAYAT ORANG ITU SENDIRI, bukan hanya dengan
// rentang populasi. Rentang populasi menjawab "apakah angka ini lazim untuk
// manusia pada umumnya"; garis dasar pribadi menjawab "apakah angka ini lazim
// untuk SAYA". Keduanya dilaporkan terpisah dan tidak pernah dicampur.
//
// ── Keputusan metode, dan mengapa ──────────────────────────────────────────
// 1. Variabilitas diukur dari riwayat orang itu sendiri: median dan MAD
//    (median absolute deviation, diskalakan 1,4826 agar setara SD pada data
//    normal). Tabel variasi biologis intra-individu (CVi, basis data EFLM)
//    lebih baik bila ada, tetapi angka CVi per analit tidak ditulis di sini
//    tanpa sumber yang dapat diperiksa — mengarangnya justru lebih buruk.
// 2. Garis dasar butuh ≥3 pengukuran SEBELUM yang terakhir. Kurang dari itu,
//    mesin menyatakan "belum cukup data", bukan menebak.
// 3. Satu titik menyimpang TIDAK PERNAH menjadi "perubahan bermakna". Butuh
//    dua pengukuran berurutan yang sama-sama menyimpang ke arah yang sama.
//    Satu titik saja hanya "pantau".
// 4. Mesin ini TIDAK menghasilkan "urgent". Urgensi klinis butuh konteks yang
//    tidak dimiliki angka lab yang dimasukkan sendiri; tingkat tertinggi yang
//    boleh dikeluarkan adalah "bicarakan dengan dokter".
// 5. Bila MAD = 0 (semua riwayat identik), simpangan z tidak terdefinisi;
//    mesin memakai lantai 1% dari median agar satu digit bulat tidak menjadi
//    "simpangan tak hingga".
//
// Ini sinyal pemantauan, bukan diagnosis.

import type { ButirLab, JenisLab } from './lab'

export const MIN_RIWAYAT_GARIS_DASAR = 3
export const Z_BERMAKNA = 2
const SKALA_MAD = 1.4826
const LANTAI_SEBAR_RELATIF = 0.01

export type StatusTren =
  | 'belum-cukup-data'
  | 'stabil'
  | 'pantau'
  | 'perubahan-bermakna'
  | 'bicarakan-dengan-dokter'

export type Arah = 'naik' | 'turun' | 'datar'

export interface TrenLab {
  status: StatusTren
  arah: Arah
  terakhir: number
  sebelumnya: number | null
  /** Median riwayat SEBELUM pengukuran terakhir. */
  garisDasar: number | null
  /** Rentang pribadi: median ± 2 × MAD terskala. */
  rentangPribadi: [number, number] | null
  selisih: number | null
  selisihPersen: number | null
  /** Laju per tahun antara dua pengukuran terakhir. */
  lajuPerTahun: number | null
  zPribadi: number | null
  diLuarRentangPopulasi: boolean
  jumlahRiwayat: number
  /** Satu kalimat, bahasa awam, alasan status ini muncul. */
  alasan: string
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function di_luar(nilai: number, j: JenisLab): boolean {
  return (typeof j.bawah === 'number' && nilai < j.bawah) || (typeof j.atas === 'number' && nilai > j.atas)
}

function hari(tanggal: string): number {
  return Date.parse(`${tanggal}T00:00:00Z`) / 864e5
}

/**
 * Mesin yang sama untuk sembarang deret bertanggal (lab, wearable, tubuh).
 * `rentang` adalah rentang populasi bila ada; tanpa itu tingkat tertinggi
 * yang mungkin adalah "perubahan bermakna".
 */
export function analisisTrenSeri(
  seri: readonly { tanggal: string; nilai: number }[],
  rentang: { bawah?: number; atas?: number } = {},
): TrenLab | null {
  return analisisTrenLab(
    seri.map((x, i) => ({ id: String(i), tanggal: x.tanggal, nilai: x.nilai })),
    { id: 'seri', nama: 'seri', satuan: '', sumber: '', ...rentang },
  )
}

export function analisisTrenLab(butirMentah: readonly ButirLab[], jenis: JenisLab): TrenLab | null {
  const butir = butirMentah
    .filter((b) => Number.isFinite(b.nilai) && /^\d{4}-\d{2}-\d{2}$/.test(b.tanggal))
    .slice()
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
  if (!butir.length) return null

  const akhir = butir[butir.length - 1]
  const sebelum = butir.length > 1 ? butir[butir.length - 2] : null
  const luarPop = di_luar(akhir.nilai, jenis)
  const riwayat = butir.slice(0, -1).map((b) => b.nilai)

  let lajuPerTahun: number | null = null
  if (sebelum) {
    const dt = hari(akhir.tanggal) - hari(sebelum.tanggal)
    if (dt > 0) lajuPerTahun = ((akhir.nilai - sebelum.nilai) / dt) * 365.25
  }

  const dasar: Omit<TrenLab, 'status' | 'arah' | 'alasan'> = {
    terakhir: akhir.nilai,
    sebelumnya: sebelum?.nilai ?? null,
    garisDasar: null,
    rentangPribadi: null,
    selisih: null,
    selisihPersen: null,
    lajuPerTahun,
    zPribadi: null,
    diLuarRentangPopulasi: luarPop,
    jumlahRiwayat: butir.length,
  }

  if (riwayat.length < MIN_RIWAYAT_GARIS_DASAR) {
    return {
      ...dasar,
      status: 'belum-cukup-data',
      arah: 'datar',
      alasan: `Your personal baseline needs ${MIN_RIWAYAT_GARIS_DASAR} earlier results; you have ${riwayat.length}.`,
    }
  }

  const med = median(riwayat)
  const mad = median(riwayat.map((x) => Math.abs(x - med))) * SKALA_MAD
  const sebar = Math.max(mad, Math.abs(med) * LANTAI_SEBAR_RELATIF, Number.EPSILON)
  const z = (akhir.nilai - med) / sebar
  const selisih = akhir.nilai - med
  const selisihPersen = med !== 0 ? (selisih / Math.abs(med)) * 100 : null
  const arah: Arah = Math.abs(z) < Z_BERMAKNA ? 'datar' : z > 0 ? 'naik' : 'turun'

  // Konfirmasi: pengukuran sebelumnya juga menyimpang ke arah yang sama
  // terhadap garis dasar yang dibangun TANPA dirinya.
  let terkonfirmasi = false
  if (arah !== 'datar' && sebelum && riwayat.length - 1 >= MIN_RIWAYAT_GARIS_DASAR) {
    const riwayat2 = riwayat.slice(0, -1)
    const med2 = median(riwayat2)
    const mad2 = median(riwayat2.map((x) => Math.abs(x - med2))) * SKALA_MAD
    const sebar2 = Math.max(mad2, Math.abs(med2) * LANTAI_SEBAR_RELATIF, Number.EPSILON)
    const z2 = (sebelum.nilai - med2) / sebar2
    terkonfirmasi = Math.abs(z2) >= Z_BERMAKNA && Math.sign(z2) === Math.sign(z)
  }

  const isi = {
    ...dasar,
    garisDasar: med,
    rentangPribadi: [med - Z_BERMAKNA * sebar, med + Z_BERMAKNA * sebar] as [number, number],
    selisih,
    selisihPersen,
    zPribadi: z,
    arah,
  }

  if (arah === 'datar') {
    return {
      ...isi,
      status: luarPop ? 'pantau' : 'stabil',
      alasan: luarPop
        ? 'Steady for you, but outside the usual population range — worth checking against your lab sheet.'
        : 'Within your own usual range.',
    }
  }
  if (!terkonfirmasi) {
    return {
      ...isi,
      status: 'pantau',
      alasan: 'One result moved away from your usual range; a single result can be noise, so recheck before reading into it.',
    }
  }
  return {
    ...isi,
    status: luarPop ? 'bicarakan-dengan-dokter' : 'perubahan-bermakna',
    alasan: luarPop
      ? 'Two results in a row moved the same way and now sit outside the usual range — worth discussing with a doctor.'
      : 'Two results in a row moved the same way from your usual range.',
  }
}
