import type { EvidenceLevel } from './regenerationResearch'

// Mesin farmakodinamik untuk senyawa geroscience.
//
// Repositori ini sudah punya katalog mekanisme obat sepanjang ribuan baris dan
// daftar target molekuler. Semuanya DESKRIPTIF: ia memberi tahu apa yang
// diikat sebuah senyawa, bukan berapa banyak efek yang muncul pada konsentrasi
// berapa. Tanpa itu, tidak ada yang bisa dihitung, dibandingkan, atau
// dibantah -- dan "senyawa X memperpanjang umur" tidak punya bentuk yang bisa
// diuji.
//
// Yang dikerjakan berkas ini adalah bagian kuantitatifnya, dan hanya itu.
//
// BATAS, ditulis sebelum satu baris pun kode:
//
//   1. Tidak ada anjuran dosis untuk manusia di sini, dan tidak boleh ada.
//      Parameter di bawah adalah nilai MODEL dan in vitro. Menerjemahkannya ke
//      dosis manusia menuntut farmakokinetik, ikatan protein plasma,
//      distribusi jaringan, dan uji klinis -- tidak satu pun ada di sini.
//   2. Nilai EC50 in vitro BUKAN konsentrasi plasma yang dicapai obat.
//      Senyawa yang kuat di cawan bisa tidak pernah mendekati konsentrasi itu
//      pada manusia. Itu sebabnya setiap entri membawa tingkat buktinya.
//   3. Model ini menjelaskan bentuk kurva, bukan hasil klinis. Umur panjang
//      bukan keluaran yang bisa dihitung dari EC50.

/**
 * Persamaan Hill.
 *
 * E(C) = Emax * C^n / (EC50^n + C^n)
 *
 * Dipilih bukan karena populer melainkan karena ia punya identitas analitik
 * yang bisa dipakai untuk MEMBUKTIKAN implementasinya benar: pada C = EC50
 * efeknya tepat setengah Emax, dan rasio konsentrasi yang memberi 80% dan 20%
 * efek adalah tepat 16^(1/n), apa pun EC50-nya. Uji di berkas pendampingnya
 * memeriksa keduanya terhadap nilai eksak, bukan terhadap angka yang pernah
 * keluar dari fungsi ini sendiri.
 */
export function hill(konsentrasi: number, ec50: number, koefisienHill = 1, emax = 1): number {
  if (!(konsentrasi > 0)) return 0
  if (!(ec50 > 0) || !(koefisienHill > 0)) return Number.NaN
  const c = Math.pow(konsentrasi, koefisienHill)
  const k = Math.pow(ec50, koefisienHill)
  return (emax * c) / (k + c)
}

/**
 * Konsentrasi yang memberi pecahan efek tertentu — kebalikan hill().
 *
 * C_x = EC50 * (x / (1 - x))^(1/n)
 */
export function konsentrasiUntukEfek(pecahan: number, ec50: number, koefisienHill = 1): number {
  if (!(pecahan > 0) || pecahan >= 1) return Number.NaN
  if (!(ec50 > 0) || !(koefisienHill > 0)) return Number.NaN
  return ec50 * Math.pow(pecahan / (1 - pecahan), 1 / koefisienHill)
}

/**
 * Model nol Bliss independence untuk dua senyawa.
 *
 * E = Ea + Eb - Ea*Eb. Ini yang diharapkan bila keduanya bekerja lewat jalur
 * yang saling bebas. Efek yang melampaui ini disebut sinergi TERHADAP MODEL
 * INI -- bukan sinergi secara mutlak, karena dua model nol yang berbeda bisa
 * memberi jawaban berbeda pada data yang sama.
 */
export function blissIndependen(efekA: number, efekB: number): number {
  return efekA + efekB - efekA * efekB
}

/**
 * Indeks kombinasi Loewe.
 *
 * CI = Ca/Cx_a + Cb/Cx_b, dengan Cx adalah konsentrasi tunggal yang memberi
 * efek yang sama. CI = 1 berarti aditif, < 1 sinergis, > 1 antagonis.
 *
 * Dipakai dalam penelitian senolitik karena kombinasi dua senyawa memang cara
 * kerja lapangan itu; dasatinib + quercetin adalah contoh kanonisnya.
 */
export function indeksKombinasiLoewe(
  konsentrasiA: number, ec50A: number, hillA: number,
  konsentrasiB: number, ec50B: number, hillB: number,
  efekGabungan: number,
): number {
  const cxA = konsentrasiUntukEfek(efekGabungan, ec50A, hillA)
  const cxB = konsentrasiUntukEfek(efekGabungan, ec50B, hillB)
  if (!Number.isFinite(cxA) || !Number.isFinite(cxB) || cxA <= 0 || cxB <= 0) return Number.NaN
  return konsentrasiA / cxA + konsentrasiB / cxB
}

/**
 * Beban sel senesen sebagai persamaan diferensial.
 *
 * dS/dt = produksi - (pembersihan alami + pembersihan senolitik) * S
 *
 * Sengaja dibuat linear terhadap S supaya ADA penyelesaian analitiknya:
 *
 *   S(t) = S_inf + (S0 - S_inf) * exp(-k t),  dengan S_inf = produksi / k
 *
 * Solver numeriknya kemudian diuji terhadap rumus itu, bukan terhadap
 * dirinya sendiri. Model yang tidak punya kebenaran acuan hanya bisa diperiksa
 * "kelihatan masuk akal", dan itu bukan pemeriksaan.
 */
export interface ParameterSenesens {
  /** Sel senesen baru per satuan waktu, sebagai pecahan jaringan. */
  produksi: number
  /** Laju pembersihan imun alami, per satuan waktu. */
  pembersihanAlami: number
}

export function bebanSetimbang(p: ParameterSenesens, pembersihanSenolitik = 0): number {
  const k = p.pembersihanAlami + pembersihanSenolitik
  if (!(k > 0)) return Number.POSITIVE_INFINITY
  return p.produksi / k
}

export function bebanAnalitik(
  p: ParameterSenesens, bebanAwal: number, waktu: number, pembersihanSenolitik = 0,
): number {
  const k = p.pembersihanAlami + pembersihanSenolitik
  if (!(k > 0)) return bebanAwal + p.produksi * waktu
  const setimbang = p.produksi / k
  return setimbang + (bebanAwal - setimbang) * Math.exp(-k * waktu)
}

/** Satu langkah Euler maju — dipakai untuk memverifikasi, bukan menggantikan. */
export function langkahBeban(
  beban: number, p: ParameterSenesens, dt: number, pembersihanSenolitik = 0,
): number {
  const k = p.pembersihanAlami + pembersihanSenolitik
  return beban + dt * (p.produksi - k * beban)
}

/**
 * Senyawa geroscience beserta batas buktinya.
 *
 * Yang TIDAK ada di sini, dan itu disengaja: dosis manusia, anjuran pemakaian,
 * dan klaim perpanjangan umur manusia. Tidak satu pun senyawa di bawah punya
 * bukti perpanjangan umur pada manusia; beberapa punya bukti kuat pada hewan,
 * dan jarak antara keduanya adalah inti seluruh bidang ini.
 */
export interface SenyawaGero {
  id: string
  nama: string
  /** Jalur molekuler yang diikat, sedekat mungkin dengan target sebenarnya. */
  target: string
  /** id ciri penuaan di regenerationResearch.ts. */
  ciriPenuaan: string[]
  /** Bukti TERTINGGI yang benar-benar ada, bukan yang diharapkan. */
  bukti: EvidenceLevel
  /**
   * EC50/IC50 in vitro dalam mikromolar, bila dilaporkan konsisten.
   * null berarti tidak ada satu angka yang bisa dipertanggungjawabkan --
   * dan itu ditulis null, bukan ditebak.
   */
  ec50Mikromolar: number | null
  koefisienHill: number | null
  /** Apa yang benar-benar ditunjukkan, dan pada spesies apa. */
  catatan: string
}

export const SENYAWA_GERO: SenyawaGero[] = [
  {
    id: 'rapamycin',
    nama: 'Rapamycin (sirolimus)',
    target: 'mTORC1 (via FKBP12)',
    ciriPenuaan: ['deregulated-nutrient-sensing', 'loss-proteostasis'],
    bukti: 'preclinical',
    ec50Mikromolar: 0.001,
    koefisienHill: 1,
    catatan: 'Memperpanjang umur pada mencit bahkan ketika dimulai di usia tua. '
      + 'Bukti umur pada manusia tidak ada. Imunosupresi adalah efek kelasnya, bukan efek samping langka.',
  },
  {
    id: 'metformin',
    nama: 'Metformin',
    target: 'Kompleks I rantai pernapasan; pengaktifan AMPK tidak langsung',
    ciriPenuaan: ['deregulated-nutrient-sensing', 'mitochondrial-dysfunction'],
    bukti: 'clinical-research',
    ec50Mikromolar: null,
    koefisienHill: null,
    catatan: 'Obat diabetes yang mapan. Efek geroprotektifnya pada manusia non-diabetes sedang diuji '
      + '(TAME) dan belum terjawab. Tidak ada satu EC50 in vitro yang konsisten antar-sistem, jadi '
      + 'tidak ada angka yang dicantumkan.',
  },
  {
    id: 'dasatinib-quercetin',
    nama: 'Dasatinib + Quercetin',
    target: 'Jalur anti-apoptosis sel senesen (SCAP), termasuk BCL-2/BCL-xL dan tirosin kinase',
    ciriPenuaan: ['cellular-senescence'],
    bukti: 'clinical-research',
    ec50Mikromolar: null,
    koefisienHill: null,
    catatan: 'Kombinasi senolitik kanonis. Membersihkan sel senesen pada hewan dan pada uji manusia '
      + 'berskala sangat kecil dengan titik akhir jaringan, bukan titik akhir umur. Kombinasi dipakai '
      + 'justru karena tipe sel senesen yang berbeda bergantung pada jalur bertahan yang berbeda.',
  },
  {
    id: 'spermidine',
    nama: 'Spermidine',
    target: 'Penginduksi autofagi; penghambatan asetiltransferase EP300',
    ciriPenuaan: ['loss-proteostasis', 'disabled-macroautophagy'],
    bukti: 'preclinical',
    ec50Mikromolar: null,
    koefisienHill: null,
    catatan: 'Memperpanjang umur pada beberapa organisme model. Data manusia bersifat observasional '
      + 'dan tidak bisa memisahkan senyawa dari pola makan yang mengandungnya.',
  },
  {
    id: 'nmn-nr',
    nama: 'Prekursor NAD+ (NMN, NR)',
    target: 'Jalur penyelamatan NAD+ (NAMPT/NMNAT)',
    ciriPenuaan: ['mitochondrial-dysfunction', 'deregulated-nutrient-sensing'],
    bukti: 'clinical-research',
    ec50Mikromolar: null,
    koefisienHill: null,
    catatan: 'Menaikkan NAD+ darah pada manusia secara terukur. Bahwa kenaikan itu menghasilkan '
      + 'manfaat klinis belum ditunjukkan; menaikkan biomarker bukan hasil.',
  },
]

/** Senyawa yang menyebut satu ciri penuaan tertentu. */
export function senyawaUntukCiri(idCiri: string): SenyawaGero[] {
  return SENYAWA_GERO.filter((s) => s.ciriPenuaan.includes(idCiri))
}

/**
 * Berapa banyak entri yang benar-benar punya parameter kuantitatif.
 *
 * Dipakai di antarmuka untuk menyatakan cakupan secara jujur: sebagian besar
 * senyawa geroscience TIDAK punya satu EC50 yang bisa dipertanggungjawabkan,
 * dan menyembunyikan itu akan membuat mesin ini tampak lebih tahu daripada
 * bidangnya sendiri.
 */
export function cakupanKuantitatif(): { berparameter: number; total: number } {
  return {
    berparameter: SENYAWA_GERO.filter((s) => s.ec50Mikromolar !== null).length,
    total: SENYAWA_GERO.length,
  }
}
