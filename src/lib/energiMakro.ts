// Angka gizi yang bisa DILIHAT, bukan sekadar dibaca satu per satu.
//
// hitungTdee sudah mengeluarkan protein, lemak dan karbohidrat dalam gram.
// Empat ubin angka di layar membuat ketiganya tampak berdiri sendiri-sendiri,
// padahal ketiganya adalah satu anggaran energi yang sama. Berkas ini
// menerjemahkan gram menjadi kilokalori memakai faktor Atwater, lalu
// MEMBANDINGKAN jumlahnya dengan target.
//
// Perbandingan itu bukan hiasan. Di tdee.ts karbohidrat dihitung sebagai sisa
// dan DIJEPIT di nol:
//
//     const karboG = Math.max(0, Math.round((target - proteinG * 4 - lemakG * 9) / 4))
//
// Untuk orang kecil dengan defisit besar dan protein tinggi, protein dan lemak
// saja sudah melampaui target. Karbohidrat menjadi 0 dan rencananya diam-diam
// berhenti menjumlah ke targetnya sendiri — empat ubin angka tidak akan pernah
// memperlihatkan itu. Sebuah batang memperlihatkannya, asal batangnya digambar
// terhadap jumlah yang SEBENARNYA dan selisihnya disebut dengan angka.

import type { HasilTdee } from './tdee'

/** Faktor Atwater: kilokalori per gram. Konvensi, bukan hasil pengukuran ulang. */
export const ATWATER = { protein: 4, karbo: 4, lemak: 9 } as const

export type KunciMakro = 'protein' | 'karbo' | 'lemak'

/**
 * Berapa besar selisih yang masih bisa dijelaskan oleh pembulatan saja.
 *
 * Tiap makro dibulatkan ke gram bulat (±0,5 g), jadi paling jauh menggeser
 * 0,5·4 + 0,5·4 + 0,5·9 = 8,5 kkal, ditambah pembulatan target sendiri.
 * Sepuluh kilokalori adalah batas atasnya; apa pun di atas itu berarti
 * anggarannya memang tidak berjumlah, bukan sekadar dibulatkan.
 */
export const AMBANG_KKAL = 10

export interface SegmenMakro {
  /** Kunci, bukan teks tampilan. */
  kunci: KunciMakro
  label: string
  gram: number
  kkal: number
  /** Bagian dari JUMLAH yang benar-benar ada, bukan dari target. */
  pecahan: number
}

export interface BagianEnergi {
  segmen: SegmenMakro[]
  jumlahKkal: number
  targetKkal: number
  /** Positif berarti makronya melampaui target. */
  selisihKkal: number
  /** Benar hanya bila selisihnya masih sebesar pembulatan. */
  berjumlah: boolean
  /** Protein adalah RENTANG (ISSN/ACSM), bukan satu angka. Ini tepinya. */
  pitaProteinKkal: { lo: number; hi: number }
}

/**
 * Membagi target harian menjadi kilokalori per makro.
 *
 * Yang sengaja TIDAK dilakukan: menormalkan ketiganya menjadi 100%. Menormalkan
 * akan membuat setiap rencana tampak pas, termasuk rencana yang tidak pas.
 */
export function bagiEnergi(h: HasilTdee): BagianEnergi {
  const mentah: { kunci: KunciMakro; label: string; gram: number; kkal: number }[] = [
    { kunci: 'protein', label: 'Protein', gram: h.proteinG, kkal: h.proteinG * ATWATER.protein },
    { kunci: 'karbo', label: 'Carbohydrate', gram: h.karboG, kkal: h.karboG * ATWATER.karbo },
    { kunci: 'lemak', label: 'Fat', gram: h.lemakG, kkal: h.lemakG * ATWATER.lemak },
  ]
  const jumlahKkal = mentah.reduce((n, s) => n + s.kkal, 0)
  const selisihKkal = jumlahKkal - h.target
  return {
    segmen: mentah.map((s) => ({ ...s, pecahan: jumlahKkal > 0 ? s.kkal / jumlahKkal : 0 })),
    jumlahKkal,
    targetKkal: h.target,
    selisihKkal,
    berjumlah: Math.abs(selisihKkal) <= AMBANG_KKAL,
    pitaProteinKkal: { lo: h.proteinLo * ATWATER.protein, hi: h.proteinHi * ATWATER.protein },
  }
}

/** Kalimat yang menyebut keadaan apa adanya. Dipakai di layar, bukan di log. */
export function kalimatSelisih(b: BagianEnergi): string {
  if (b.berjumlah) return 'Protein, carbohydrate and fat add up to the daily target.'
  if (b.selisihKkal > 0) {
    return `Protein and fat alone already come to ${b.jumlahKkal.toLocaleString()} kcal, ` +
      `which is ${Math.round(b.selisihKkal).toLocaleString()} kcal above the ${b.targetKkal.toLocaleString()} kcal target. ` +
      'Carbohydrate cannot go below zero, so the split shown here does not reach the target — ' +
      'the protein range or the deficit has to give.'
  }
  return `The macros come to ${b.jumlahKkal.toLocaleString()} kcal, ` +
    `${Math.abs(Math.round(b.selisihKkal)).toLocaleString()} kcal under the ${b.targetKkal.toLocaleString()} kcal target.`
}

export interface BebanHari {
  indeks: number
  hari: string
  /** Menit perkiraan dari organizerLatihan — perkiraan, bukan resep. */
  menit: number
  judul: string
  latihan: boolean
}

/** Menit terbesar dalam sepekan; dipakai sebagai skala batang, minimal 30. */
export function puncakMenit(hari: readonly BebanHari[]): number {
  return Math.max(30, ...hari.map((h) => h.menit))
}

export const BATAS_ENERGI: readonly string[] = [
  'Atwater factors are a convention for converting grams to kilocalories, not a measurement of the food you will eat.',
  'The macro split comes from one equation, not from a diet trial; it is a starting point to be adjusted.',
  'Session minutes are estimated from sets and rest, not a duration prescribed for you.',
  'Nothing here screens food for allergens or checks it against a medical restriction.',
]
