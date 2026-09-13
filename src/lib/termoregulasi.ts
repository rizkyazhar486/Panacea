// Neraca panas tubuh: S = M − W ± R ± C ± K − E.
//
// KENAPA INI DIGAMBAR, BUKAN DICETAK. `bodyPhysiology.ts` memuat persamaan itu
// sebagai TEKS dan tidak menghitung apa pun dengannya. Rumus yang dicetak tidak
// pernah bisa salah, dan karena itu tidak pernah bisa mengajar.
//
// Pelajarannya ada pada satu suku yang paling mudah diabaikan: penguapan tidak
// dibatasi oleh berapa banyak keringat yang keluar, melainkan oleh SELISIH
// TEKANAN UAP antara kulit dan udara. Kalau udara sudah hampir jenuh, keringat
// boleh mengalir sederas apa pun -- ia menetes, tidak menguap, dan tidak
// membuang panas sama sekali.
//
// Akibatnya tidak bisa ditabelkan: pada suhu udara yang SAMA dan produksi panas
// yang SAMA, kelembapan sendirian memindahkan tubuh dari keadaan tunak ke
// keadaan yang tidak punya keadaan tunak. Suhu intinya naik terus karena tidak
// ada lagi jalan keluar bagi panasnya. Itu pernyataan tentang BENTUK KURVA.
//
// Semua fungsi di sini juga yang MENGGAMBAR kurva di panelnya. Kalau gambar dan
// angka punya dua sumber, gambarnya bisa berbohong sementara uji tetap lulus.

export const TETAPAN_TERMO = {
  /** Panas jenis jaringan tubuh, J/(kg·K). */
  PANAS_JENIS: 3470,
  /** Luas permukaan tubuh rujukan, m². MASUKAN asumsi, bukan hasil ukur. */
  LUAS_RUJUKAN: 1.8,
  /** Koefisien gabungan radiasi + konveksi, W/(m²·K), udara tenang. */
  H_KERING: 8.3,
  /** Koefisien penguapan, W/(m²·kPa). */
  H_BASAH: 124,
  /** Suhu kulit lazim saat vasodilatasi penuh, °C. */
  SUHU_KULIT: 35,
} as const

/**
 * Tekanan uap air jenuh, kPa (Magnus–Tetens).
 *
 * Bentuknya EKSPONENSIAL, dan itulah seluruh persoalannya: menaikkan suhu udara
 * beberapa derajat menaikkan tekanan uap jenuhnya jauh lebih cepat daripada
 * dugaan linear.
 */
export function tekananUapJenuh(suhuC: number): number {
  if (!Number.isFinite(suhuC)) return Number.NaN
  return 0.61094 * Math.exp((17.625 * suhuC) / (suhuC + 243.04))
}

export interface LingkunganTermo {
  /** Suhu udara, °C. */
  suhuUdara: number
  /** Kelembapan relatif, 0–100 %. */
  kelembapan: number
  /** Produksi panas metabolik, W. */
  metabolik: number
  /** Kerja mekanik eksternal, W. Panas = M − W. */
  kerja?: number
  /** Massa tubuh, kg. */
  massa?: number
  /** Luas permukaan, m². */
  luas?: number
}

/** Pertukaran kering (radiasi + konveksi), W. Positif = tubuh KEHILANGAN panas. */
export function pertukaranKering(suhuUdara: number, luas: number = TETAPAN_TERMO.LUAS_RUJUKAN): number {
  if (!Number.isFinite(suhuUdara) || !Number.isFinite(luas) || luas <= 0) return Number.NaN
  return TETAPAN_TERMO.H_KERING * luas * (TETAPAN_TERMO.SUHU_KULIT - suhuUdara)
}

/**
 * Kapasitas penguapan MAKSIMUM, W.
 *
 * Inilah pagarnya. Ia ditentukan selisih tekanan uap, bukan laju keringat.
 * Dijepit di nol: udara yang lebih lembap daripada kulit tidak membuat tubuh
 * menyerap panas lewat penguapan terbalik pada model sesederhana ini.
 */
export function kapasitasPenguapan(
  suhuUdara: number, kelembapan: number, luas: number = TETAPAN_TERMO.LUAS_RUJUKAN,
): number {
  if (!Number.isFinite(suhuUdara) || !Number.isFinite(kelembapan)) return Number.NaN
  if (kelembapan < 0 || kelembapan > 100) return Number.NaN
  if (!Number.isFinite(luas) || luas <= 0) return Number.NaN
  const pKulit = tekananUapJenuh(TETAPAN_TERMO.SUHU_KULIT)
  const pUdara = tekananUapJenuh(suhuUdara) * (kelembapan / 100)
  return Math.max(0, TETAPAN_TERMO.H_BASAH * luas * (pKulit - pUdara))
}

export interface NeracaPanas {
  /** Panas yang harus dibuang, W. */
  produksi: number
  /** Radiasi + konveksi, W (positif = keluar). */
  kering: number
  /** Kapasitas penguapan maksimum, W. */
  penguapanMaks: number
  /**
   * Panas yang HARUS dibuang lewat penguapan, W (nol kalau tidak ada).
   *
   * Disediakan di sini supaya panelnya tidak perlu menghitungnya sendiri.
   * Versi pertama panel itu menyusun ulang `pertukaranKering` secara inline
   * untuk menggambar garis putus-putusnya -- dua salinan fisika yang sama,
   * sehingga garisnya bisa diam-diam tidak sepakat dengan setiap angka di
   * sebelahnya sementara seluruh uji tetap lulus. Itu persis kegagalan yang
   * dijaga di seluruh repositori ini, jadi nilainya dihitung SEKALI di sini.
   */
  perluDiuapkan: number
  /** Penguapan yang benar-benar terpakai, W. */
  penguapan: number
  /** Simpanan panas S, W. Positif = suhu inti NAIK. */
  simpanan: number
  /** Apakah ada keadaan tunak: panas bisa dibuang seluruhnya. */
  tunak: boolean
}

/**
 * Neraca panas pada satu titik waktu.
 *
 * Penguapan tidak pernah melebihi apa yang PERLU dibuang maupun apa yang MUNGKIN
 * diuapkan. Membiarkannya melebihi salah satunya akan menggambar tubuh yang
 * mendinginkan dirinya di bawah keadaan tunak, yang tidak terjadi di sini.
 */
export function neracaPanas({
  suhuUdara, kelembapan, metabolik, kerja = 0,
  luas = TETAPAN_TERMO.LUAS_RUJUKAN as number,
}: LingkunganTermo): NeracaPanas {
  const kosong: NeracaPanas = {
    produksi: Number.NaN, kering: Number.NaN, penguapanMaks: Number.NaN,
    perluDiuapkan: Number.NaN, penguapan: Number.NaN, simpanan: Number.NaN, tunak: false,
  }
  if (!Number.isFinite(metabolik) || metabolik < 0) return kosong
  if (!Number.isFinite(kerja) || kerja < 0 || kerja > metabolik) return kosong
  const kering = pertukaranKering(suhuUdara, luas)
  const penguapanMaks = kapasitasPenguapan(suhuUdara, kelembapan, luas)
  if (!Number.isFinite(kering) || !Number.isFinite(penguapanMaks)) return kosong

  const produksi = metabolik - kerja
  const perluDiuapkan = Math.max(0, produksi - kering)
  const penguapan = Math.min(perluDiuapkan, penguapanMaks)
  const simpanan = produksi - kering - penguapan
  return { produksi, kering, penguapanMaks, perluDiuapkan, penguapan, simpanan, tunak: simpanan <= 1e-9 }
}

/** Laju kenaikan suhu inti, °C per jam. */
export function lajuSuhuInti(simpanan: number, massa = 70): number {
  if (!Number.isFinite(simpanan) || !Number.isFinite(massa) || massa <= 0) return Number.NaN
  return (simpanan / (massa * TETAPAN_TERMO.PANAS_JENIS)) * 3600
}

export interface TitikTermo {
  x: number
  penguapanMaks: number
  simpanan: number
  tunak: boolean
}

/**
 * Deret terhadap kelembapan, pada suhu udara dan beban metabolik TETAP.
 *
 * Inilah kurva yang tidak bisa disampaikan tabel: satu-satunya yang berubah di
 * sepanjang sumbunya adalah kelembapan, dan di suatu titik neracanya berpindah
 * dari tunak ke tidak-pernah-tunak.
 */
export function deretKelembapan(
  suhuUdara: number, metabolik: number, kerja = 0, langkah = 1,
): TitikTermo[] {
  const titik: TitikTermo[] = []
  for (let rh = 0; rh <= 100 + 1e-9; rh += langkah) {
    const n = neracaPanas({ suhuUdara, kelembapan: rh, metabolik, kerja })
    titik.push({ x: rh, penguapanMaks: n.penguapanMaks, simpanan: n.simpanan, tunak: n.tunak })
  }
  return titik
}

/** Deret terhadap suhu udara, pada kelembapan dan beban tetap. */
export function deretSuhuUdara(
  kelembapan: number, metabolik: number, kerja = 0, min = 15, maks = 50, langkah = 0.5,
): TitikTermo[] {
  const titik: TitikTermo[] = []
  for (let t = min; t <= maks + 1e-9; t += langkah) {
    const n = neracaPanas({ suhuUdara: t, kelembapan, metabolik, kerja })
    titik.push({ x: t, penguapanMaks: n.penguapanMaks, simpanan: n.simpanan, tunak: n.tunak })
  }
  return titik
}

/**
 * Kelembapan terkecil yang membuat neracanya tidak lagi tunak, atau null.
 *
 * Dicari dengan MENJALANKAN neracanya, bukan dari rumus tertutup terpisah --
 * supaya angka yang dicetak panel tidak bisa menyimpang dari kurva yang sama.
 */
export function kelembapanKritis(suhuUdara: number, metabolik: number, kerja = 0): number | null {
  for (const t of deretKelembapan(suhuUdara, metabolik, kerja, 0.5)) {
    if (!t.tunak) return t.x
  }
  return null
}

export const RENTANG_TERMO = {
  suhuUdara: { min: 15, maks: 50 },
  kelembapan: { min: 0, maks: 100 },
  metabolik: { min: 80, maks: 900 },
  massa: { min: 40, maks: 120 },
} as const
