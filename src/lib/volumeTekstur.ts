// Volume DICOM -> tekstur 3D untuk ray-casting di GPU.
//
// Yang dilakukan berkas ini hanya satu hal, dan sengaja hanya itu: mengubah
// tumpukan irisan yang sudah dibaca bacaDicom() menjadi satu blok byte yang
// dapat diunggah ke WebGL2 sebagai sampler3D, beserta ukuran FISIKNYA dalam
// milimeter. Tidak ada anatomi yang ditebak, tidak ada irisan yang dikarang,
// dan tidak ada nilai yang dihaluskan.
//
// DUA HAL YANG PALING MUDAH DIBUAT SALAH DI SINI, dan karena itu ditulis di
// muka:
//
//   1. VOXEL TIDAK KUBUS. Jarak antar-irisan CT lazimnya beberapa milimeter
//      sementara jarak antar-piksel di dalam irisan kurang dari satu. Merender
//      kubus 256x256x64 sebagai kubus akan memampatkan tubuh ke arah kepala-
//      kaki dan membuat organ tampak pipih. Ukuran fisik dibawa terpisah dari
//      ukuran voxel justru untuk itu.
//
//   2. KUANTISASI KE 8 BIT MEMBUANG INFORMASI. Rentang CT mencakup ribuan
//      satuan Hounsfield; satu byte hanya punya 256 langkah. Yang dipetakan
//      karena itu BUKAN seluruh rentang melainkan jendela yang dipilih, dan
//      jendela itu ikut dikembalikan supaya pembaca tahu byte 0 dan 255 itu
//      berapa HU — tanpa itu, ambang di layar tidak berarti apa-apa.

import type { VolumeMpr } from './dicomMpr'

/** Batas yang dipilih demi memori peramban telepon, bukan demi ketepatan. */
export const BATAS_VOLUME = {
  /** Sisi terpanjang sesudah penyusutan. 256^3 byte = 16 MB. */
  SISI_MAKS: 256,
  /** Di bawah ini ray-casting tidak menghasilkan apa pun yang bisa dibaca. */
  KEDALAMAN_MIN: 3,
} as const

export interface JendelaVolume {
  /** Nilai yang dipetakan ke byte 0. */
  bawah: number
  /** Nilai yang dipetakan ke byte 255. */
  atas: number
}

export interface VolumeTekstur {
  data: Uint8Array
  lebar: number
  tinggi: number
  dalam: number
  /** Ukuran fisik kotak pembatas dalam milimeter, untuk skala yang benar. */
  fisikMm: [number, number, number]
  /** Rentang nilai yang dipetakan ke 0..255. */
  jendela: JendelaVolume
  /** Faktor penyusutan per sumbu; 1 berarti tidak disusutkan. */
  susut: [number, number, number]
  /** Satuan nilai aslinya. HU hanya sah untuk CT. */
  satuan: 'HU' | 'nilai relatif'
}

export type HasilVolumeTekstur =
  | { ok: true; tekstur: VolumeTekstur }
  | { ok: false; alasan: string }

/**
 * Faktor penyusutan terkecil yang membuat sebuah sisi muat dalam batas.
 *
 * Bilangan bulat, bukan pecahan: menyusutkan dengan faktor pecahan
 * memerlukan interpolasi, dan interpolasi pada tahap ini akan mengarang nilai
 * di antara voxel sebelum ada yang melihat voxel aslinya.
 */
export function faktorSusut(panjang: number, maksimum: number): number {
  if (panjang <= maksimum) return 1
  return Math.ceil(panjang / maksimum)
}

/**
 * Jendela awal untuk sebuah volume.
 *
 * Memakai minimum dan maksimum volume, bukan preset jaringan: preset baru
 * berarti sesudah pembaca memilihnya. Udara pada CT ada di sekitar -1000 HU
 * dan mendominasi tepi rentang, jadi memetakan seluruh rentang apa adanya
 * adalah pilihan yang jujur untuk tampilan pertama.
 */
export function jendelaAwalVolume(volume: VolumeMpr): JendelaVolume {
  const bawah = Number.isFinite(volume.minimum) ? volume.minimum : 0
  const atas = Number.isFinite(volume.maksimum) ? volume.maksimum : bawah + 1
  return atas > bawah ? { bawah, atas } : { bawah, atas: bawah + 1 }
}

/**
 * Susun tekstur 3D dari volume.
 *
 * Tata letaknya x paling cepat, lalu y, lalu z — urutan yang diharapkan
 * texImage3D. Nilai di luar jendela DIJEPIT, tidak dibuang: membuangnya akan
 * membuat tulang dan udara sama-sama hilang alih-alih sama-sama pekat.
 */
export function susunVolumeTekstur(volume: VolumeMpr, jendela: JendelaVolume): HasilVolumeTekstur {
  if (volume.kedalaman < BATAS_VOLUME.KEDALAMAN_MIN) {
    return { ok: false, alasan: `Volume rendering needs at least ${BATAS_VOLUME.KEDALAMAN_MIN} slices; this series has ${volume.kedalaman}.` }
  }
  if (!(jendela.atas > jendela.bawah)) {
    return { ok: false, alasan: 'The window upper bound must be greater than the lower bound.' }
  }

  const sx = faktorSusut(volume.kolom, BATAS_VOLUME.SISI_MAKS)
  const sy = faktorSusut(volume.baris, BATAS_VOLUME.SISI_MAKS)
  const sz = faktorSusut(volume.kedalaman, BATAS_VOLUME.SISI_MAKS)

  const lebar = Math.floor(volume.kolom / sx)
  const tinggi = Math.floor(volume.baris / sy)
  const dalam = Math.floor(volume.kedalaman / sz)
  if (lebar < 2 || tinggi < 2 || dalam < 2) {
    return { ok: false, alasan: 'This series is too small in one axis to ray-cast.' }
  }

  const rentang = jendela.atas - jendela.bawah
  const data = new Uint8Array(lebar * tinggi * dalam)

  for (let z = 0; z < dalam; z++) {
    const citra = volume.irisan[z * sz]
    const nilai = citra.nilai
    const kolomSumber = citra.kolom
    for (let y = 0; y < tinggi; y++) {
      const barisSumber = y * sy * kolomSumber
      const tujuanBaris = (z * tinggi + y) * lebar
      for (let x = 0; x < lebar; x++) {
        const v = nilai[barisSumber + x * sx]
        const n = ((v - jendela.bawah) / rentang) * 255
        data[tujuanBaris + x] = n <= 0 ? 0 : n >= 255 ? 255 : n | 0
      }
    }
  }

  return {
    ok: true,
    tekstur: {
      data,
      lebar,
      tinggi,
      dalam,
      // Ukuran fisik dihitung dari volume PENUH, bukan dari volume yang sudah
      // disusutkan: menyusutkan tidak mengubah besar tubuhnya.
      fisikMm: [
        volume.kolom * volume.jarakKolomMm,
        volume.baris * volume.jarakBarisMm,
        volume.kedalaman * volume.jarakIrisMm,
      ],
      jendela,
      susut: [sx, sy, sz],
      satuan: 'HU',
    },
  }
}

/**
 * Ubah ambang dalam satuan asli menjadi 0..1 di ruang tekstur.
 *
 * Tanpa fungsi ini, penggeser di layar akan berbicara dalam byte sementara
 * labelnya berbicara dalam Hounsfield, dan keduanya akan berbeda tanpa ada
 * yang tahu.
 */
export function ambangKeTekstur(nilai: number, jendela: JendelaVolume): number {
  const t = (nilai - jendela.bawah) / (jendela.atas - jendela.bawah)
  return t <= 0 ? 0 : t >= 1 ? 1 : t
}

/** Kebalikannya, untuk menuliskan kembali posisi penggeser sebagai HU. */
export function teksturKeAmbang(t: number, jendela: JendelaVolume): number {
  return jendela.bawah + t * (jendela.atas - jendela.bawah)
}

/**
 * Skala kotak pembatas yang mempertahankan perbandingan fisik.
 *
 * Sisi terpanjang menjadi 1; dua lainnya mengecil sesuai ukuran aslinya dalam
 * milimeter. Inilah yang mencegah tubuh tampak pipih ketika jarak antar-irisan
 * jauh lebih besar daripada jarak antar-piksel.
 */
export function skalaKotak(fisikMm: readonly [number, number, number]): [number, number, number] {
  const maks = Math.max(fisikMm[0], fisikMm[1], fisikMm[2])
  if (!(maks > 0)) return [1, 1, 1]
  return [fisikMm[0] / maks, fisikMm[1] / maks, fisikMm[2] / maks]
}
