// Mesin asam-basa: Henderson-Hasselbalch, celah anion, dan kompensasi.
//
// `bodyPhysiology.ts` menuliskan "pH = 6.1 + log(HCO3 / (0.03 x PaCO2))" dan
// "AG = Na - (Cl + HCO3)" sebagai teks, lalu tidak menghitung satu pun. Organ
// keempat dengan celah yang sama.
//
// Yang membuat asam-basa layak digambar, bukan sekadar dihitung: satu titik
// pada bidang pH-bikarbonat menjawab tiga pertanyaan sekaligus -- ke mana
// gangguan menggeser, seberapa jauh kompensasi mengembalikan, dan apakah
// jaraknya masih masuk akal. Daftar angka tidak memperlihatkan jarak. Diagram
// Davenport memperlihatkannya, karena isobar PaCO2 adalah kurva nyata dan
// titik pasien duduk di salah satunya.
//
// BATAS:
//
//   * Menghitung dari angka yang DIBERIKAN. Bukan pemeriksaan, bukan
//     diagnosis, tidak menaksir status asam-basa siapa pun.
//   * Aturan kompensasi (Winter dan kerabatnya) adalah regresi populasi pada
//     gangguan TUNGGAL yang sudah mapan. Ia memberi rentang yang diharapkan,
//     bukan vonis; gangguan campuran justru dikenali karena keluar dari
//     rentang itu.
//   * Pendekatan Stewart (SID, asam lemah non-volatil) tidak ada di sini.
//     Bidang Davenport adalah kerangka bikarbonat, dan mencampur dua kerangka
//     dalam satu gambar hanya mengaburkan keduanya.

/** Tetapan Henderson-Hasselbalch untuk plasma pada 37 C. */
export const TETAPAN = {
  /** pKa' sistem bikarbonat/CO2 dalam plasma. */
  pKa: 6.1,
  /** Kelarutan CO2 plasma, mmol/L per mmHg. */
  kelarutanCo2: 0.03,
} as const

export interface GasDarah {
  /** Bikarbonat plasma, mmol/L. */
  bikarbonat: number
  /** Tekanan parsial CO2 arteri, mmHg. */
  paco2: number
}

/**
 * pH dari bikarbonat dan PaCO2.
 *
 * Penyebutnya adalah CO2 TERLARUT, bukan PaCO2 mentah -- itulah gunanya
 * tetapan kelarutan, dan menghilangkannya adalah cara paling umum rumus ini
 * ditulis keliru.
 */
export function phDariBikarbonat(g: GasDarah): number {
  const terlarut = TETAPAN.kelarutanCo2 * g.paco2
  if (!(terlarut > 0) || !(g.bikarbonat > 0)) return Number.NaN
  return TETAPAN.pKa + Math.log10(g.bikarbonat / terlarut)
}

/**
 * Bikarbonat yang tersirat oleh sebuah pH pada PaCO2 tertentu.
 *
 * Ini kebalikan tepat dari `phDariBikarbonat`, dan sekaligus persamaan yang
 * MENGGAMBAR isobar PaCO2 di diagram Davenport. Satu fungsi untuk dua tugas
 * itu disengaja: kalau kurva yang digambar dan angka yang ditampilkan berasal
 * dari sumber berbeda, gambar bisa berbohong tanpa satu pun uji gagal.
 */
export function bikarbonatDariPh(ph: number, paco2: number): number {
  const terlarut = TETAPAN.kelarutanCo2 * paco2
  return terlarut * Math.pow(10, ph - TETAPAN.pKa)
}

export interface Elektrolit {
  natrium: number
  klorida: number
  bikarbonat: number
  /** Albumin serum g/dL; celah anion dikoreksi terhadapnya. */
  albumin: number
}

/** Celah anion tanpa kalium: AG = Na - (Cl + HCO3). */
export function celahAnion(e: Elektrolit): number {
  return e.natrium - (e.klorida + e.bikarbonat)
}

/**
 * Celah anion terkoreksi albumin.
 *
 * Albumin adalah anion tak terukur terbesar. Pada hipoalbuminemia celah anion
 * mentah turun sekitar 2,5 mmol/L per 1 g/dL, sehingga asidosis celah-lebar
 * bisa tampak normal. Koreksi ini yang membuatnya kembali terlihat.
 */
export function celahAnionTerkoreksi(e: Elektrolit): number {
  return celahAnion(e) + 2.5 * (4.0 - e.albumin)
}

/**
 * Rasio delta: kenaikan celah anion dibanding penurunan bikarbonat.
 *
 * Sekitar 1-2 pada asidosis celah-lebar murni. Di bawah 1 menandakan asidosis
 * hiperkloremik yang menyertai; di atas 2 menandakan alkalosis metabolik yang
 * bersamaan. Nilainya tidak terdefinisi saat bikarbonat tidak turun.
 */
export function rasioDelta(e: Elektrolit, agRujukan = 12, bikarbonatRujukan = 24): number {
  const naikAg = celahAnionTerkoreksi(e) - agRujukan
  const turunBikarbonat = bikarbonatRujukan - e.bikarbonat
  if (!(turunBikarbonat > 0)) return Number.NaN
  return naikAg / turunBikarbonat
}

export type Gangguan =
  | 'normal'
  | 'asidosis-metabolik'
  | 'alkalosis-metabolik'
  | 'asidosis-respiratorik'
  | 'alkalosis-respiratorik'

/** Rentang yang diharapkan untuk sebuah kompensasi, dalam satuan aslinya. */
export interface RentangKompensasi {
  bawah: number
  atas: number
  /** Besaran yang dikompensasi: PaCO2 mmHg atau bikarbonat mmol/L. */
  besaran: 'paco2' | 'bikarbonat'
}

/**
 * Kompensasi yang diharapkan untuk gangguan tunggal.
 *
 * Semua ini regresi populasi, bukan hukum. Rentangnya sengaja dipertahankan
 * alih-alih dipadatkan jadi satu angka: lebar rentang itulah yang memisahkan
 * "terkompensasi" dari "ada gangguan kedua".
 */
export function kompensasiDiharapkan(
  gangguan: Gangguan,
  g: GasDarah,
  akut = true,
): RentangKompensasi | null {
  switch (gangguan) {
    // Winter: PaCO2 = 1,5 x HCO3 + 8 (+/- 2).
    case 'asidosis-metabolik': {
      const tengah = 1.5 * g.bikarbonat + 8
      return { bawah: tengah - 2, atas: tengah + 2, besaran: 'paco2' }
    }
    // PaCO2 naik sekitar 0,7 mmHg per 1 mmol/L kenaikan bikarbonat.
    case 'alkalosis-metabolik': {
      const tengah = 40 + 0.7 * (g.bikarbonat - 24)
      return { bawah: tengah - 5, atas: tengah + 5, besaran: 'paco2' }
    }
    // Akut 1 mmol/L per 10 mmHg; kronik 4 -- dapar sel dulu, ginjal kemudian.
    case 'asidosis-respiratorik': {
      const per10 = akut ? 1 : 4
      const tengah = 24 + (per10 * (g.paco2 - 40)) / 10
      return { bawah: tengah - 2, atas: tengah + 2, besaran: 'bikarbonat' }
    }
    // Akut 2 mmol/L per 10 mmHg; kronik 5.
    case 'alkalosis-respiratorik': {
      const per10 = akut ? 2 : 5
      const tengah = 24 - (per10 * (40 - g.paco2)) / 10
      return { bawah: tengah - 2, atas: tengah + 2, besaran: 'bikarbonat' }
    }
    case 'normal':
      return null
  }
}

/**
 * Gangguan utama dari pH dan arah kedua besaran.
 *
 * pH memilih sisi; besaran yang bergerak SEARAH dengan sisi itu adalah
 * penyebabnya, karena kompensasi tidak pernah melampaui gangguan yang
 * dikompensasinya.
 */
export function gangguanUtama(g: GasDarah): Gangguan {
  const ph = phDariBikarbonat(g)
  if (!Number.isFinite(ph)) return 'normal'
  if (ph < 7.35) return g.paco2 > 45 ? 'asidosis-respiratorik' : 'asidosis-metabolik'
  if (ph > 7.45) return g.paco2 < 35 ? 'alkalosis-respiratorik' : 'alkalosis-metabolik'
  return 'normal'
}

export interface Tafsiran {
  ph: number
  gangguan: Gangguan
  kompensasi: RentangKompensasi | null
  /** Nilai terukur dari besaran yang dikompensasi. */
  terukur: number | null
  /** Null saat tidak ada gangguan tunggal untuk dinilai. */
  sesuaiKompensasi: boolean | null
}

export function tafsirkan(g: GasDarah, akut = true): Tafsiran {
  const ph = phDariBikarbonat(g)
  const gangguan = gangguanUtama(g)
  const kompensasi = kompensasiDiharapkan(gangguan, g, akut)
  const terukur = kompensasi ? (kompensasi.besaran === 'paco2' ? g.paco2 : g.bikarbonat) : null
  return {
    ph,
    gangguan,
    kompensasi,
    terukur,
    sesuaiKompensasi:
      kompensasi && terukur !== null ? terukur >= kompensasi.bawah && terukur <= kompensasi.atas : null,
  }
}
