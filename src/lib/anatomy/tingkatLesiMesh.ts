// Tempat lesi yang ditunjukkan PADA MODEL, bukan disebut namanya.
//
// `lokalisasiLesi.ts` menyimpulkan tingkat dan sisi dengan benar lalu
// menuliskannya sebagai kalimat: "Left medulla". Sebuah kalimat tidak
// memperlihatkan bahwa piramis kiri dan gyrus presentralis kiri berada di dua
// ujung lintasan yang sama, dan justru itulah seluruh isi penalarannya.
//
// Yang menahan modul ini tetap jujur: tidak semua tingkat PUNYA geometri.
// nervous.glb mengirim korteks, midbrain dan piramis medula berpasangan
// kiri-kanan, mengirim medula spinalis tanpa sisi sama sekali, mengirim pons
// hanya sisi kiri, dan tidak mengirim kapsula interna sama sekali.
//
// Godaannya adalah menyorot "sesuatu yang dekat" supaya gambarnya selalu
// menyala. Itu akan menampilkan tempat lesi yang SALAH pada model anatomi, dan
// tidak ada yang akan tahu. Karena itu setiap tingkat menyatakan cakupannya,
// dan ujinya memeriksa pernyataan itu terhadap berkas yang benar-benar
// dikirim -- termasuk arah sebaliknya: sebuah tingkat tidak boleh dinyatakan
// 'tidak ada' kalau geometrinya ternyata ada.

import type { Sisi, TingkatLesi } from '../lokalisasiLesi'

export type CakupanTingkat =
  /** Dua mesh terpisah, kiri dan kanan. Sisi lesi bisa ditunjukkan. */
  | 'berpasangan'
  /** Satu mesh tanpa sisi. Tempatnya bisa ditunjukkan, sisinya tidak. */
  | 'tanpa-sisi'
  /** Hanya satu sisi yang dikirim. Sisi lain tidak bisa ditunjukkan. */
  | 'sebagian'
  /** Tidak ada geometri sama sekali di berkas ini. */
  | 'tidak-ada'

export interface IkatanTingkat {
  tingkat: TingkatLesi
  cakupan: CakupanTingkat
  /** Mesh per sisi. Kosong untuk 'tidak-ada'. */
  mesh: Partial<Record<Sisi, readonly string[]>>
  /** Mesh tanpa sisi, dipakai saat cakupan 'tanpa-sisi'. */
  meshTanpaSisi?: readonly string[]
  /**
   * Alasan yang DITAMPILKAN saat tingkat ini tidak bisa digambar.
   * Ditulis untuk pengguna, bukan untuk pengembang.
   */
  keterangan?: string
}

export const BERKAS_SARAF = 'anatomy/nervous.glb'

export const IKATAN_TINGKAT: readonly IkatanTingkat[] = [
  {
    tingkat: 'korteks',
    cakupan: 'berpasangan',
    mesh: { kiri: ['Precentral gyrus.l'], kanan: ['Precentral gyrus.r'] },
  },
  {
    // Kapsula interna tidak dikirim sebagai objek tersendiri. Menyorot talamus
    // di sebelahnya akan terlihat meyakinkan dan menunjuk tempat yang keliru.
    tingkat: 'kapsula-interna',
    cakupan: 'tidak-ada',
    mesh: {},
    keterangan:
      'This model file does not carry the internal capsule as its own structure, so the site is named but not shown. Nothing nearby is highlighted in its place.',
  },
  {
    tingkat: 'midbrain',
    cakupan: 'berpasangan',
    mesh: { kiri: ['Midbrain.l'], kanan: ['Midbrain.r'] },
  },
  {
    // Hanya sisi kiri yang dikirim. Mencerminkannya ke kanan akan berarti
    // mengarang geometri dan menampilkannya sebagai anatomi.
    tingkat: 'pons',
    cakupan: 'sebagian',
    mesh: { kiri: ['Pons.l'] },
    keterangan:
      'Only the left half of the pons ships in this model, so a right pontine site is named but not shown. The geometry is not mirrored to fill the gap.',
  },
  {
    // Piramis: tempat lintasan motorik menyilang, dan justru karena itu ia
    // objek yang paling layak disorot untuk tingkat ini.
    tingkat: 'medula',
    cakupan: 'berpasangan',
    mesh: {
      kiri: ['Pyramid of medulla oblongata.l'],
      kanan: ['Pyramid of medulla oblongata.r'],
    },
  },
  {
    tingkat: 'medula-spinalis',
    cakupan: 'tanpa-sisi',
    mesh: {},
    meshTanpaSisi: ['White matter of spinal cord', 'Anterior horn of spinal cord', 'Posterior horn of spinal cord'],
    keterangan:
      'The cord ships as a single model without left and right halves, so the level is shown but the side is not.',
  },
] as const

/**
 * Lintasan yang selalu ditampilkan sebagai konteks.
 *
 * Tanpa lintasan, sebuah struktur yang menyala hanyalah bentuk yang menyala.
 * Dengan lintasan, penyilangan itu terlihat: piramis duduk di antara korteks
 * di atasnya dan traktus kortikospinal di bawahnya.
 */
export const MESH_LINTASAN: readonly string[] = [
  'Lateral corticospinal tract',
  'Anterior corticospinal tract',
  'Lateral spinothalamic tract',
  'Anterior spinothalamic tract',
  'Gracile fasciculus',
  'Cuneate fasciculus',
] as const

/** Lihat `bronkusSegmental.ts`: aturan sanitasi nama GLTFLoader berbeda antar versi. */
export function kunciNama(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function ikatanUntuk(tingkat: TingkatLesi): IkatanTingkat | undefined {
  return IKATAN_TINGKAT.find((i) => i.tingkat === tingkat)
}

/**
 * Mesh yang harus disorot untuk sebuah tingkat dan sisi.
 *
 * Mengembalikan daftar KOSONG bila tingkat itu tidak punya geometri, atau bila
 * sisi yang diminta tidak dikirim. Panggilnya wajib memperlakukan daftar kosong
 * sebagai "katakan kenapa", bukan sebagai "jangan gambar apa-apa".
 */
export function meshSorot(tingkat: TingkatLesi, sisi: Sisi): readonly string[] {
  const ikatan = ikatanUntuk(tingkat)
  if (!ikatan) return []
  if (ikatan.cakupan === 'tanpa-sisi') return ikatan.meshTanpaSisi ?? []
  return ikatan.mesh[sisi] ?? []
}
