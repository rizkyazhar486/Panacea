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

// ── Lingkar tekanan-volume ─────────────────────────────────────────────────
//
// Panel pertama modul ini hanya menampilkan deretan angka. Angka saja tidak
// memperlihatkan BENTUK siklus jantung, padahal bentuk itulah yang membuat
// perbedaan preload, afterload dan kontraktilitas bisa dikenali sekilas -- dan
// ketiganya menggeser lingkarnya dengan cara yang sama sekali berbeda.
//
// Model elastans berubah-waktu (Suga-Sagawa): bilik diperlakukan sebagai pegas
// yang kekakuannya naik-turun sepanjang siklus.
//
//   P(V, t) = e(t) * Ees * (V - V0) + (1 - e(t)) * Ped(V)
//
// e(t) berayun 0..1. Pada e = 1 bilik berada di garis akhir-sistolik ESPVR;
// pada e = 0 ia mengikuti kurva pengisian pasif EDPVR. Ini penyederhanaan yang
// sudah mapan, bukan karangan: ESPVR yang lurus dan EDPVR yang eksponensial
// adalah bentuk yang dipakai di literatur hemodinamika.

export interface ParameterBilik {
  /** Elastans akhir-sistolik, mmHg/mL. Ukuran kontraktilitas. */
  ees: number
  /** Volume tanpa tekanan, mL. */
  v0: number
  /** Kekakuan pengisian pasif, mmHg. */
  kekakuanPasif: number
  /** Tetapan eksponensial EDPVR, per mL. */
  eksponenPasif: number
  /** Tekanan arteri yang harus dilampaui katup untuk membuka, mmHg. */
  afterload: number
  /** Volume akhir-diastolik yang dicapai pengisian, mL. */
  volumeAkhirDiastol: number
}

export const BILIK_RUJUKAN: ParameterBilik = {
  ees: 2.3,
  v0: 15,
  // Dipilih supaya tekanan akhir-diastolik mendarat sekitar 10 mmHg pada EDV
  // 120 mL. Nilai pertama (2,6 dan 0,028) memberi 46,6 mmHg -- itu gagal
  // jantung berat yang ditampilkan sebagai normal, dan tidak ada yang
  // mencurigakan pada dua angka itu sampai keluarannya dihitung.
  kekakuanPasif: 0.45,
  eksponenPasif: 0.03,
  afterload: 90,
  volumeAkhirDiastol: 120,
}

/** Tekanan pengisian pasif pada volume tertentu. */
export function tekananPasif(volume: number, p: ParameterBilik): number {
  const dv = Math.max(0, volume - p.v0)
  return p.kekakuanPasif * (Math.exp(p.eksponenPasif * dv) - 1)
}

/** Tekanan akhir-sistolik yang bisa dihasilkan bilik pada volume tertentu. */
export function tekananAkhirSistolik(volume: number, p: ParameterBilik): number {
  return Math.max(0, p.ees * (volume - p.v0))
}

/**
 * Volume akhir-sistolik: tempat garis ESPVR memotong afterload.
 *
 * Bilik mengeluarkan darah sampai tekanan yang MASIH bisa dihasilkannya turun
 * ke tekanan arteri. Dari situ katup menutup. Jadi ESV bukan angka yang
 * dipilih melainkan titik potong -- dan itulah sebabnya menaikkan afterload
 * menaikkan ESV tanpa ada yang mengubah kontraktilitas.
 */
export function volumeAkhirSistolik(p: ParameterBilik): number {
  if (!(p.ees > 0)) return p.volumeAkhirDiastol
  const v = p.v0 + p.afterload / p.ees
  // Tidak bisa mengeluarkan lebih banyak daripada yang ada, dan tidak bisa
  // mengeluarkan volume negatif.
  return Math.min(p.volumeAkhirDiastol, Math.max(p.v0, v))
}

export interface TitikLingkar { volume: number; tekanan: number }

/**
 * Empat fase siklus sebagai lintasan tertutup.
 *
 * Pengisian sepanjang EDPVR, kontraksi isovolumik tegak, ejeksi pada afterload,
 * relaksasi isovolumik tegak. Lingkarnya tertutup karena memang harus: bilik
 * kembali ke tempat ia mulai.
 */
export function lingkarTekananVolume(p: ParameterBilik, langkahPerFase = 24): TitikLingkar[] {
  const esv = volumeAkhirSistolik(p)
  const edv = Math.max(esv, p.volumeAkhirDiastol)
  const titik: TitikLingkar[] = []

  // 1. Pengisian: dari ESV ke EDV mengikuti kurva pasif.
  for (let i = 0; i <= langkahPerFase; i++) {
    const v = esv + ((edv - esv) * i) / langkahPerFase
    titik.push({ volume: v, tekanan: tekananPasif(v, p) })
  }
  // 2. Kontraksi isovolumik: volume tetap, tekanan naik sampai katup membuka.
  const pEd = tekananPasif(edv, p)
  for (let i = 1; i <= langkahPerFase; i++) {
    titik.push({ volume: edv, tekanan: pEd + ((p.afterload - pEd) * i) / langkahPerFase })
  }
  // 3. Ejeksi: volume turun pada tekanan arteri.
  for (let i = 1; i <= langkahPerFase; i++) {
    titik.push({ volume: edv - ((edv - esv) * i) / langkahPerFase, tekanan: p.afterload })
  }
  // 4. Relaksasi isovolumik: kembali turun ke tekanan pengisian di ESV.
  const pEs = tekananPasif(esv, p)
  for (let i = 1; i <= langkahPerFase; i++) {
    titik.push({ volume: esv, tekanan: p.afterload - ((p.afterload - pEs) * i) / langkahPerFase })
  }
  return titik
}

/**
 * Kerja sekuncup = luas lingkar, mmHg*mL.
 *
 * Dihitung dengan rumus tali sepatu, sehingga ia benar-benar LUAS lintasan
 * yang digambar, bukan perkiraan persegi panjang SV x tekanan. Kalau lingkar
 * dan angka berpisah, uji akan menangkapnya.
 */
export function kerjaSekuncup(lingkar: readonly TitikLingkar[]): number {
  let dua = 0
  for (let i = 0; i < lingkar.length; i++) {
    const a = lingkar[i]
    const b = lingkar[(i + 1) % lingkar.length]
    dua += a.volume * b.tekanan - b.volume * a.tekanan
  }
  return Math.abs(dua) / 2
}
