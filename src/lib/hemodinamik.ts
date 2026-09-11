// Hemodinamika dan hantaran oksigen.
//
// `bodyPhysiology.ts` menuliskan rantai ini sebagai teks: CO = HR x SV,
// EF = SV / EDV, DO2 = CO x CaO2 x 10, VO2 = CO x (CaO2 - CvO2) x 10. Empat
// rumus yang saling terkait, tidak satu pun dihitung. Rumus yang hanya dicetak
// tidak pernah salah, dan tidak pernah mengajarkan apa pun.
//
// Yang membuat rantai ini layak dikodekan adalah keterkaitannya: beberapa
// besaran bisa dicapai lewat dua jalur berbeda, dan kedua jalur itu HARUS
// bertemu di angka yang sama. Ketidaksepakatan di antara keduanya adalah
// pendeteksi galat yang tidak bisa dipalsukan -- itulah yang diuji.
//
// BATAS:
//
//   * Menghitung dari angka yang diberikan. Bukan pemantauan, bukan diagnosis,
//     dan tidak menaksir hemodinamika siapa pun.
//   * Tidak ada anjuran tata laksana. Bahwa hantaran oksigen turun tidak
//     berarti sesuatu harus diberikan.
//   * Nilai rujukan adalah dewasa sehat pada umumnya, bukan seseorang.

/** Kapasitas angkut oksigen hemoglobin, mL O2 per gram Hb. */
export const HUFNER = 1.34

/** Kelarutan oksigen dalam plasma, mL O2 per dL per mmHg. */
export const KELARUTAN_PLASMA = 0.003

/**
 * Kandungan oksigen arteri, mL O2 per dL.
 *
 * CaO2 = 1,34 x Hb x SaO2 + 0,003 x PaO2
 *
 * Suku terlarut kecil dan sering diabaikan, tetapi tetap ditulis: menghapusnya
 * membuat oksigen hiperbarik dan keracunan karbon monoksida menjadi mustahil
 * dijelaskan, dan keduanya justru terletak persis di suku itu.
 */
export function kandunganOksigen(hemoglobin: number, saturasi: number, tekananParsial: number): number {
  if (!(hemoglobin >= 0) || !(saturasi >= 0) || !(tekananParsial >= 0)) return Number.NaN
  return HUFNER * hemoglobin * saturasi + KELARUTAN_PLASMA * tekananParsial
}

/** Isi sekuncup dari volume: SV = EDV - ESV. */
export function isiSekuncup(volumeAkhirDiastol: number, volumeAkhirSistol: number): number {
  return volumeAkhirDiastol - volumeAkhirSistol
}

/** Curah jantung dalam L/menit, dari SV dalam mL. */
export function curahJantung(denyutPerMenit: number, isiSekuncupMl: number): number {
  return (denyutPerMenit * isiSekuncupMl) / 1000
}

/** Fraksi ejeksi, 0..1. */
export function fraksiEjeksi(isiSekuncupMl: number, volumeAkhirDiastol: number): number {
  if (!(volumeAkhirDiastol > 0)) return Number.NaN
  return isiSekuncupMl / volumeAkhirDiastol
}

/**
 * Hantaran oksigen, mL O2 per menit.
 *
 * DO2 = CO x CaO2 x 10. Angka sepuluh bukan tetapan fisiologis melainkan
 * konversi satuan: kandungan dinyatakan per DESILITER sementara curah jantung
 * per LITER. Ditulis di sini supaya tidak dihafal sebagai sihir.
 */
export function hantaranOksigen(curahLPerMenit: number, kandunganPerDl: number): number {
  return curahLPerMenit * kandunganPerDl * 10
}

/** Konsumsi oksigen menurut prinsip Fick. */
export function konsumsiOksigenFick(
  curahLPerMenit: number, kandunganArteri: number, kandunganVena: number,
): number {
  return curahLPerMenit * (kandunganArteri - kandunganVena) * 10
}

/**
 * Curah jantung dari prinsip Fick — persamaan yang sama, dibalik.
 *
 * Inilah cara curah jantung benar-benar diukur sebelum ada termodilusi, dan
 * ia memberi pemeriksaan yang tidak bisa dipalsukan: menghitung VO2 dari
 * sebuah CO lalu mengembalikan CO dari VO2 itu harus memberi angka semula.
 */
export function curahJantungFick(
  konsumsiOksigen: number, kandunganArteri: number, kandunganVena: number,
): number {
  const beda = kandunganArteri - kandunganVena
  if (!(beda > 0)) return Number.NaN
  return konsumsiOksigen / (beda * 10)
}

/** Rasio ekstraksi oksigen, 0..1. */
export function rasioEkstraksiOksigen(konsumsi: number, hantaran: number): number {
  if (!(hantaran > 0)) return Number.NaN
  return konsumsi / hantaran
}

/**
 * Nilai rujukan dewasa sehat.
 *
 * Dipilih supaya rantai lengkapnya mendarat pada tiga angka yang memang
 * dilaporkan: CaO2 sekitar 20 mL/dL, DO2 sekitar 1000 mL/menit, VO2 sekitar
 * 250 mL/menit, dan karena itu ekstraksi sekitar 25%. Uji pendampingnya
 * memeriksa ketiganya, jadi menggeser salah satu masukan sampai rantainya
 * tidak masuk akal akan gagal.
 */
export const RUJUKAN_HEMODINAMIK = {
  denyutPerMenit: 70,
  volumeAkhirDiastol: 120,
  volumeAkhirSistol: 50,
  hemoglobin: 15,
  saturasiArteri: 0.98,
  tekananParsialArteri: 100,
  saturasiVena: 0.75,
  tekananParsialVena: 40,
} as const
