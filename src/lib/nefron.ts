// Mesin nefron: filtrasi glomerulus, penanganan tubulus, dan klirens.
//
// `bodyPhysiology.ts` sudah MENAMPILKAN rumusnya sebagai teks -- "Cx = (Ux x V)
// / Px", "FF = GFR / RPF" -- dan tidak ada satu pun yang menghitungnya. Rumus
// yang hanya ditulis tidak bisa salah, dan juga tidak bisa mengajari apa pun:
// tidak ada yang bisa dimasukkan, tidak ada yang bisa dibantah.
//
// Modul ini menghitungnya, dan diuji terhadap identitas yang sudah benar
// sebelum kodenya ada. Yang paling tajam: zat yang disaring bebas, tidak
// direabsorpsi dan tidak disekresi memiliki klirens yang SAMA PERSIS dengan
// GFR. Itu definisi inulin, dan ia menangkap hampir semua cara rumus klirens
// bisa ditulis keliru.
//
// BATAS:
//
//   * Ini menghitung dari angka yang DIBERIKAN. Ia bukan pemeriksaan, bukan
//     diagnosis, dan tidak menaksir fungsi ginjal siapa pun.
//   * eGFR populasi (CKD-EPI) sudah ada di longevity.ts dan sengaja tidak
//     diulang di sini: persamaan itu menjawab pertanyaan yang berbeda --
//     perkiraan dari kreatinin, bukan mekanisme dari gaya Starling.
//   * Nefron tunggal yang seragam adalah penyederhanaan besar. Ginjal nyata
//     punya nefron kortikal dan jukstamedular dengan perilaku berbeda,
//     gradien medula, dan umpan balik tubuloglomerular yang tidak ada di sini.

/** Tekanan dalam mmHg. */
export interface GayaStarlingGlomerulus {
  /** Tekanan hidrostatik kapiler glomerulus. */
  hidrostatikKapiler: number
  /** Tekanan hidrostatik ruang Bowman. */
  hidrostatikBowman: number
  /** Tekanan onkotik koloid kapiler. */
  onkotikKapiler: number
}

/**
 * Tekanan ultrafiltrasi neto.
 *
 * P_UF = P_GC - P_BS - pi_GC. Onkotik ruang Bowman dianggap nol karena
 * filtrat normal praktis bebas protein -- dan itu asumsi, bukan kebetulan,
 * jadi ditulis di sini alih-alih disembunyikan sebagai angka nol di rumus.
 */
export function tekananUltrafiltrasi(g: GayaStarlingGlomerulus): number {
  return g.hidrostatikKapiler - g.hidrostatikBowman - g.onkotikKapiler
}

/**
 * GFR dari gaya Starling. Kf dalam mL/menit per mmHg.
 *
 * Tekanan neto yang nol atau negatif berarti filtrasi berhenti, bukan
 * filtrasi terbalik: mengembalikan angka negatif di sini akan menghasilkan
 * "urin mengalir kembali ke darah" yang lolos tanpa suara ke perhitungan
 * berikutnya.
 */
export function gfrDariStarling(g: GayaStarlingGlomerulus, kf: number): number {
  if (!(kf > 0)) return 0
  return Math.max(0, tekananUltrafiltrasi(g) * kf)
}

/** Klirens: Cx = (Ux * V) / Px, dalam mL/menit. */
export function klirens(konsentrasiUrin: number, alirUrin: number, konsentrasiPlasma: number): number {
  if (!(konsentrasiPlasma > 0)) return Number.NaN
  if (!(alirUrin >= 0) || !(konsentrasiUrin >= 0)) return Number.NaN
  return (konsentrasiUrin * alirUrin) / konsentrasiPlasma
}

/** Fraksi filtrasi: bagian plasma yang tiba lalu tersaring. */
export function fraksiFiltrasi(gfr: number, alirPlasmaGinjal: number): number {
  if (!(alirPlasmaGinjal > 0)) return Number.NaN
  return gfr / alirPlasmaGinjal
}

/** Beban tersaring: jumlah zat yang masuk ke tubulus per menit. */
export function bebanTersaring(gfr: number, konsentrasiPlasma: number): number {
  return gfr * konsentrasiPlasma
}

/**
 * Neraca massa tubulus.
 *
 * Yang tersaring harus berakhir sebagai diekskresi atau direabsorpsi, dan
 * sekresi menambah dari sisi darah. Nilai reabsorpsi NETO yang negatif berarti
 * sekresi neto -- dan itu keadaan yang nyata, bukan galat.
 */
export interface NeracaTubulus {
  tersaring: number
  diekskresi: number
  /** Positif = reabsorpsi neto; negatif = sekresi neto. */
  reabsorpsiNeto: number
}

export function neracaTubulus(gfr: number, plasma: number, urin: number, alirUrin: number): NeracaTubulus {
  const tersaring = bebanTersaring(gfr, plasma)
  const diekskresi = urin * alirUrin
  return { tersaring, diekskresi, reabsorpsiNeto: tersaring - diekskresi }
}

/**
 * Ekskresi fraksional: bagian beban tersaring yang benar-benar keluar.
 *
 * FE = Cx / GFR. Nilai 1 berarti zat itu melewati nefron tanpa disentuh --
 * yang justru membuatnya bisa dipakai MENGUKUR GFR.
 */
export function ekskresiFraksional(klirensZat: number, gfr: number): number {
  if (!(gfr > 0)) return Number.NaN
  return klirensZat / gfr
}

/**
 * Ekskresi fraksional natrium sebagaimana dihitung di samping pasien.
 *
 * FENa = (UNa x PCr) / (PNa x UCr)
 *
 * Bentuk ini menghapus laju alir urin, sehingga tidak perlu pengumpulan
 * berjangka waktu. Ia HARUS memberi angka yang sama dengan jalur berbasis
 * klirens, dan uji pendampingnya memeriksa keduanya -- dua jalan menuju satu
 * angka yang tidak sepakat berarti salah satunya salah.
 */
export function feNaBedside(
  natriumUrin: number, kreatininPlasma: number,
  natriumPlasma: number, kreatininUrin: number,
): number {
  const penyebut = natriumPlasma * kreatininUrin
  if (!(penyebut > 0)) return Number.NaN
  return (natriumUrin * kreatininPlasma) / penyebut
}

/** Nilai rujukan dewasa, sebagai titik awal yang bisa diubah. */
export const RUJUKAN = {
  /** mL/menit per mmHg. */
  kf: 12.5,
  // 60 - 18 - 32 memberi tekanan neto 10 mmHg, dan dengan Kf 12,5 itu
  // menghasilkan GFR 125 mL/menit -- angka dewasa yang memang dilaporkan.
  // Nilai Bowman sempat ditulis 15, yang memberi GFR 162 mL/menit: terlalu
  // tinggi, dan ketahuan hanya karena keluarannya dihitung, bukan karena
  // angkanya terlihat salah.
  starling: { hidrostatikKapiler: 60, hidrostatikBowman: 18, onkotikKapiler: 32 } as GayaStarlingGlomerulus,
  /** mL/menit. */
  alirPlasmaGinjal: 600,
} as const
