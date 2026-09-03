// ─────────────────────────────────────────────────────────────────────────────
// KEBUGARAN DAN UMUR PANJANG — ANGKA YANG DAPAT DILACAK KE SUMBERNYA.
//
// CACAT YANG MELAHIRKAN BERKAS INI. Halaman Longevity sudah ada dan sudah
// menghitung "skor komposit". Tetapi angka-angka penyusunnya DIKARANG:
//
//     weight: 0.22  untuk VO2max, 0.13 untuk grip, 0.11 untuk tidur
//     vo2Score = (vo2 / vo2Good) * 75
//     bioAge   = usia - (skor - 72) * 0.25
//
// Tidak ada satu pun penelitian yang memberikan bobot 0,22 kepada VO2max, dan
// tidak ada yang menyatakan bahwa setiap 10 poin skor setara 2,5 tahun usia
// biologis. Angka-angka itu masuk akal secara arah, tetapi besarannya karangan
// — dan ditampilkan dengan satu angka di belakang koma, yang membuatnya
// terbaca sebagai hasil ukur.
//
// INI LEBIH BERBAHAYA DARIPADA TIDAK ADA ANGKA SAMA SEKALI. Pemakai tidak
// punya cara membedakan mana yang berasal dari kohort 122.007 orang dan mana
// yang berasal dari tebakan penulis kode.
//
// APA YANG DIKERJAKAN BERKAS INI. Ia hanya memuat besaran yang BENAR-BENAR
// dilaporkan penelitian, masing-masing dengan sumbernya, ukuran kohortnya, dan
// batas ketidakpastiannya. Bila sebuah angka adalah perkiraan, ia disebut
// perkiraan. Bila sebuah patokan hanyalah titik tengah rujukan, ia tidak
// disebut persentil.
//
// YANG SENGAJA TIDAK DIKERJAKAN:
//   - Tidak ada skor komposit baru. Menjumlahkan hal-hal yang satuannya
//     berbeda dengan bobot karangan hanya memindahkan masalahnya.
//   - Tidak ada "usia biologis". Tidak ada persamaan yang disepakati untuk
//     menghitungnya dari pengukuran lapangan, dan menampilkannya dengan
//     desimal adalah ketepatan palsu.
//   - Tidak ada ramalan sisa umur. Rasio bahaya berlaku bagi KELOMPOK, bukan
//     bagi seorang; menerjemahkannya menjadi "Anda akan hidup X tahun lagi"
//     adalah kekeliruan penafsiran yang paling sering pada data seperti ini.
// ─────────────────────────────────────────────────────────────────────────────

export interface Sumber {
  kunci: string
  kutipan: string
  n?: string
  catatan?: string
}

/**
 * Seluruh sumber yang dipakai berkas ini, untuk ditampilkan di layar.
 *
 * Ditulis sebagai data, bukan sebagai teks di dalam komponen, supaya satu
 * angka tidak dapat berubah tanpa sumbernya ikut terlihat.
 */
export const SUMBER: Record<string, Sumber> = {
  kodama: {
    kunci: 'kodama',
    kutipan: 'Kodama S, et al. JAMA. 2009;301(19):2024-35.',
    n: 'meta-analysis of 33 cohorts, 102,980 people',
    catatan: 'Each 1 MET rise in aerobic capacity is associated with 13% lower all-cause mortality (HR 0.87; 95% CI 0.84-0.90).',
  },
  mandsager: {
    kunci: 'mandsager',
    kutipan: 'Mandsager K, et al. JAMA Netw Open. 2018;1(6):e183605.',
    n: '122,007 treadmill tests',
    catatan: 'Elite fitness versus the lowest group is associated with far lower mortality (HR around 0.20). Low fitness carries risk comparable to, or exceeding, smoking and diabetes.',
  },
  ross: {
    kunci: 'ross',
    kutipan: 'Ross R, et al. Circulation. 2016;134:e653-99 (AHA scientific statement).',
    catatan: 'Aerobic capacity is recommended to be treated as a CLINICAL VITAL SIGN, not merely a measure of exercise.',
  },
  friend: {
    kunci: 'friend',
    kutipan: 'Kaminsky LA, et al. Mayo Clin Proc — the FRIEND registry.',
    catatan: 'VO2max reference values by age and sex. The numbers in this file are APPROXIMATE MIDPOINTS drawn from comparable data, not measured percentiles, and apply to TREADMILL testing — cycle testing yields values roughly 10-15% lower.',
  },
  uth: {
    kunci: 'uth',
    kutipan: 'Uth N, et al. Eur J Appl Physiol. 2004;91(1):111-5.',
    catatan: 'VO2max estimated from 15.3 × (maximum heart rate / resting heart rate). An estimate, not a measurement: it can differ from direct testing by well over ten per cent.',
  },
  leong: {
    kunci: 'leong',
    kutipan: 'Leong DP, et al. Lancet. 2015;386(9990):266-73 (the PURE study).',
    n: '139,691 people, 17 countries',
    catatan: 'Each 5 kg LOWER grip strength is associated with 16% higher all-cause mortality (HR 1.16; 95% CI 1.13-1.20).',
  },
  paluch: {
    kunci: 'paluch',
    kutipan: 'Paluch AE, et al. Lancet Public Health. 2022;7(3):e219-28.',
    n: 'meta-analysis of 15 cohorts, 47,471 people',
    catatan: 'Mortality falls as daily steps rise, then PLATEAUS: around 6,000-8,000 steps at age 60 and above, and around 8,000-10,000 steps below 60. Stepping pace adds no further benefit once the count is accounted for.',
  },
  wen: {
    kunci: 'wen',
    kutipan: 'Wen CP, et al. Lancet. 2011;378(9798):1244-53.',
    n: '416,175 people',
    catatan: 'Fifteen minutes of activity a day is associated with 14% lower all-cause mortality than being inactive.',
  },
  seiler: {
    kunci: 'seiler',
    kutipan: 'Seiler S. Int J Sports Physiol Perform. 2010;5(3):276-91.',
    catatan: 'Accomplished endurance athletes generally place about 80% of sessions at LOW intensity and about 20% at high intensity. This describes an observed pattern, not a tested prescription for non-athletes.',
  },
  garber: {
    kunci: 'garber',
    kutipan: 'Garber CE, et al. Med Sci Sports Exerc. 2011;43(7):1334-59 (ACSM).',
    catatan: 'Recommends 150 minutes of moderate or 75 minutes of vigorous activity per week, plus strength training on 2 days per week.',
  },
}

/** Satu MET setara dengan pemakaian oksigen 3,5 mL/kg/menit saat istirahat. */
export const ML_PER_MET = 3.5

// ─────────────────────────────────────────────────────────────────────────────
// NILAI RUJUKAN VO2max
//
// KEJUJURAN YANG PERLU DISEBUT DI SINI. Angka di bawah adalah TITIK TENGAH
// PENDEKATAN untuk orang sehat menurut usia dan jenis kelamin, disusun mengikuti
// bentuk data rujukan seperti registri FRIEND. Ia BUKAN persentil hasil ukur,
// dan tidak boleh ditampilkan sebagai "persentil ke-sekian". Yang layak
// dikatakan hanyalah: nilai Anda berada di sekitar, di bawah, atau di atas
// titik tengah orang seusia Anda.
//
// Berlaku untuk uji TREADMILL. Uji sepeda menghasilkan nilai 10-15% lebih
// rendah, dan membandingkan hasil sepeda dengan tabel treadmill akan
// menyesatkan ke arah yang lebih buruk daripada keadaan sebenarnya.
// ─────────────────────────────────────────────────────────────────────────────

type JK = 'L' | 'P'

const TITIK_TENGAH: Record<JK, [batasUsia: number, nilai: number][]> = {
  L: [[29, 48], [39, 44], [49, 40], [59, 35], [69, 30.5], [200, 26]],
  P: [[29, 37.5], [39, 35], [49, 32], [59, 27.5], [69, 24], [200, 20.5]],
}

/** Titik tengah rujukan VO2max (mL/kg/menit) untuk usia dan jenis kelamin. */
export function titikTengahVo2(usia: number, jk: JK): number {
  const baris = TITIK_TENGAH[jk]
  for (const [batas, nilai] of baris) if (usia <= batas) return nilai
  return baris[baris.length - 1][1]
}

export type Pita = 'well below' | 'below' | 'around' | 'above' | 'well above'

export interface HasilKebugaran {
  vo2: number
  met: number
  titikTengah: number
  metTitikTengah: number
  selisihMet: number
  pita: Pita
  /**
   * Rasio bahaya kematian segala sebab dibanding orang seusia yang berada
   * pada titik tengah, dihitung dari Kodama 2009: 0,87 per MET.
   * Berlaku bagi KELOMPOK, bukan ramalan bagi seorang.
   */
  hrTerhadapTitikTengah: number
}

/**
 * Menempatkan VO2max seseorang terhadap titik tengah orang seusianya, dan
 * menerjemahkan selisihnya menjadi rasio bahaya menurut Kodama 2009.
 *
 * MENGAPA MEMAKAI SELISIH MET, BUKAN PERSENTASE. Kodama melaporkan efeknya
 * PER MET, bukan per persen. Mengubahnya menjadi persentase lalu mengalikannya
 * kembali akan menambah kekeliruan tanpa menambah keterangan.
 */
export function nilaiKebugaran(vo2: number, usia: number, jk: JK): HasilKebugaran | null {
  if (!(vo2 > 0) || !(usia > 0)) return null
  const titik = titikTengahVo2(usia, jk)
  const met = vo2 / ML_PER_MET
  const metTitik = titik / ML_PER_MET
  const selisih = met - metTitik
  const pita: Pita =
    selisih <= -2 ? 'well below' : selisih <= -0.75 ? 'below' : selisih < 0.75 ? 'around' : selisih < 2 ? 'above' : 'well above'
  return {
    vo2,
    met,
    titikTengah: titik,
    metTitikTengah: metTitik,
    selisihMet: selisih,
    pita,
    // 0,87 per MET (Kodama 2009). Selisih positif -> rasio di bawah 1.
    hrTerhadapTitikTengah: Math.pow(0.87, selisih),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PERKIRAAN VO2max TANPA UJI LABORATORIUM
// ─────────────────────────────────────────────────────────────────────────────

export interface PerkiraanVo2 {
  nilai: number
  cara: string
  sumber: string
  /** Batas ketidakpastian yang WAJIB ikut ditampilkan. */
  ketidakpastian: string
}

/**
 * Perkiraan VO2max dari denyut maksimal dan denyut istirahat (Uth 2004).
 *
 * KETIDAKPASTIANNYA BESAR DAN HARUS DISEBUT. Rumus ini diturunkan pada
 * sekelompok kecil orang terlatih; pada orang yang tidak terlatih dan pada
 * denyut istirahat yang diukur tidak pada keadaan basal, selisihnya terhadap
 * uji langsung dapat mencapai belasan persen. Ia berguna untuk MELIHAT ARAH
 * PERUBAHAN pada orang yang sama, bukan untuk membandingkan antarorang.
 */
export function vo2DariDenyut(hrMaks: number, hrIstirahat: number): PerkiraanVo2 | null {
  if (!(hrMaks > 0) || !(hrIstirahat > 0) || hrMaks <= hrIstirahat) return null
  return {
    nilai: 15.3 * (hrMaks / hrIstirahat),
    cara: 'Ratio of maximum heart rate to resting heart rate',
    sumber: 'uth',
    ketidakpastian: 'An estimate, not a measurement. It can differ from direct testing by well over ten per cent, and is most useful for tracking CHANGE in the same person.',
  }
}

/**
 * Perkiraan denyut maksimal.
 *
 * Rumus 220 dikurangi usia sengaja TIDAK dipakai sendirian: simpangan bakunya
 * sekitar 10-12 denyut, sehingga pada satu orang ia dapat meleset lebih dari
 * 20 denyut. Dipakai rumus Tanaka yang lebih baik pada usia lanjut, dan
 * selisihnya tetap disebut.
 */
export function denyutMaksPerkiraan(usia: number): { nilai: number; ketidakpastian: string } | null {
  if (!(usia > 0)) return null
  return {
    nilai: 208 - 0.7 * usia, // Tanaka H, dkk. J Am Coll Cardiol. 2001;37:153-6.
    ketidakpastian: 'Standard deviation is about 10 beats. If your maximum heart rate has ever been MEASURED during hard training, use that figure — it is far better than any formula.',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// KEKUATAN GENGGAM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rasio bahaya kematian segala sebab menurut selisih kekuatan genggam,
 * dari PURE (Leong 2015): 1,16 per 5 kg yang LEBIH RENDAH.
 *
 * Titik acuannya sengaja dibiarkan sebagai parameter, sebab PURE melaporkan
 * efek per selisih 5 kg dan BUKAN nilai batas normal. Menyebut satu angka
 * sebagai "normal" akan menambahkan sesuatu yang tidak ada di dalam datanya.
 */
export function hrGenggam(kg: number, acuanKg: number): number | null {
  if (!(kg > 0) || !(acuanKg > 0)) return null
  const selisih5 = (acuanKg - kg) / 5
  return Math.pow(1.16, selisih5)
}

// ─────────────────────────────────────────────────────────────────────────────
// LANGKAH HARIAN
// ─────────────────────────────────────────────────────────────────────────────

export interface BacaanLangkah {
  langkah: number
  batasMendatar: [number, number]
  sudahMendatar: boolean
  keterangan: string
}

/**
 * Menempatkan jumlah langkah harian terhadap titik MENDATARNYA manfaat
 * (Paluch 2022).
 *
 * MENGAPA TITIK MENDATAR, BUKAN SASARAN 10.000. Angka 10.000 berasal dari
 * nama sebuah alat pedometer Jepang tahun 1960-an, bukan dari penelitian.
 * Data yang ada menunjukkan manfaat bertambah lalu MENDATAR, dan letak
 * mendatarnya berbeda menurut usia.
 */
export function bacaLangkah(langkah: number, usia: number): BacaanLangkah | null {
  if (!(langkah >= 0) || !(usia > 0)) return null
  const batas: [number, number] = usia >= 60 ? [6000, 8000] : [8000, 10000]
  const sudah = langkah >= batas[0]
  return {
    langkah,
    batasMendatar: batas,
    sudahMendatar: sudah,
    keterangan: sudah
      ? `Sudah berada pada kisaran tempat manfaatnya MENDATAR (${batas[0].toLocaleString('id-ID')}-${batas[1].toLocaleString('id-ID')} langkah untuk usia Anda). Menambah langkah di atas ini manfaat tambahannya kecil menurut data yang ada.`
      : `Masih di bawah kisaran tempat manfaatnya mendatar (${batas[0].toLocaleString('id-ID')}-${batas[1].toLocaleString('id-ID')} langkah untuk usia Anda). Pada bagian kurva ini, setiap tambahan langkah masih berkaitan dengan penurunan risiko yang bermakna.`,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SEBARAN INTENSITAS LATIHAN
// ─────────────────────────────────────────────────────────────────────────────

export interface BacaanSebaran {
  persenRendah: number
  persenTinggi: number
  /** Selisih terhadap pola 80/20 yang diamati pada atlet ketahanan. */
  selisih: number
  keterangan: string
}

/**
 * Membandingkan sebaran zona seseorang terhadap pola 80/20 (Seiler 2010).
 *
 * DISEBUT SEBAGAI POLA YANG DIAMATI, BUKAN RESEP. Data Seiler berasal dari
 * pengamatan pada atlet ketahanan berprestasi; ia tidak membuktikan bahwa
 * sebaran itu terbaik bagi orang kebanyakan, dan tidak ada uji acak berskala
 * besar yang menegakkannya untuk kesehatan umum. Menampilkannya sebagai
 * sasaran wajib akan melampaui apa yang ditunjukkan datanya.
 */
export function bacaSebaran(menitPerZona: number[]): BacaanSebaran | null {
  const total = menitPerZona.reduce((a, b) => a + b, 0)
  if (!(total > 0)) return null
  // Zona 1-2 dihitung sebagai intensitas rendah; zona 4-5 sebagai tinggi.
  const rendah = (menitPerZona[0] ?? 0) + (menitPerZona[1] ?? 0)
  const tinggi = (menitPerZona[3] ?? 0) + (menitPerZona[4] ?? 0)
  const pRendah = (rendah / total) * 100
  const pTinggi = (tinggi / total) * 100
  return {
    persenRendah: pRendah,
    persenTinggi: pTinggi,
    selisih: pRendah - 80,
    keterangan:
      pRendah < 65
        ? 'Less of the work sits at low intensity than the pattern observed in endurance athletes. In some people this accumulates fatigue faster than the fitness it returns.'
        : pRendah > 92
          ? 'Almost entirely low intensity. The pattern observed in endurance athletes leaves about a fifth of sessions at high intensity.'
          : 'This distribution sits close to the pattern observed in endurance athletes.',
  }
}

export default nilaiKebugaran
