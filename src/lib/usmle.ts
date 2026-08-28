// ─────────────────────────────────────────────────────────────────────────────
// Kurikulum praklinik dan USMLE — tulang punggungnya.
//
// APA YANG ADA DI BERKAS INI, DAN APA YANG TIDAK.
//
// Di sini ada SUSUNANNYA: mata kuliah praklinik, disiplin Step 1, disiplin dan
// spesialisasi Step 2 CK, bentuk Step 3, jalur sertifikasi ECFMG, dan daftar
// spesialis serta subspesialis. Susunan itu bukan karangan — ia mengikuti
// Content Outline resmi USMLE, syarat ECFMG, dan daftar ABMS, dan semuanya
// dokumen publik yang dapat diperiksa sendiri lewat tautan pada tiap bagian.
//
// Isi tulisan tiap topik ada di berkas SEBELAH (usmleNotes.ts), dan sengaja
// dipisah. Alasannya bukan kerapian melainkan kejujuran: susunan dapat
// diselesaikan seluruhnya dan memang sudah, sedangkan isi tulisan tumbuh satu
// per satu. Dengan dipisah, layar dapat menunjukkan dengan tepat mana topik
// yang sudah ditulis dan mana yang baru kerangka — tanpa satu pun topik yang
// berpura-pura sudah jadi.
//
// ATURAN SITASI, DAN INI YANG PALING PENTING DI BERKAS INI.
//
// Tidak ada satu pun sitasi yang dikarang. Di aplikasi ini sudah ada
// preseden yang mahal: pemetaan ICD-11 dan id edisi tafsir dibiarkan KOSONG
// alih-alih ditebak, karena rujukan yang salah lebih buruk daripada rujukan
// yang tidak ada — pembaca tidak punya cara mengetahui bahwa ia salah.
//
// Karena itu, yang boleh ditulis sebagai sumber hanyalah:
//   · BADAN dan NAMA PEDOMANNYA — "KDIGO 2021 Blood Pressure in CKD",
//     "GOLD Report", "Surviving Sepsis Campaign". Keduanya stabil dan dapat
//     dicari dengan tepat.
//   · BUKU RUJUKAN TERBUKA yang dapat disebut namanya — NCBI Bookshelf,
//     StatPearls.
//   · Tautan ke SITUS BADANNYA atau ke PENCARIAN, bukan ke DOI atau nomor
//     halaman tertentu. DOI yang salah satu digit menuju ke makalah lain sama
//     sekali, dan tidak ada yang akan menyadarinya.
//
// TAHUN PEDOMAN DITULIS SEBAGAI PENANDA, BUKAN SEBAGAI JAMINAN. Pedoman
// diperbarui, dan berkas ini tidak tahu kapan ia dibaca. Tiap sumber karena
// itu membawa peringatan yang sama di layar: cari edisi terbarunya.
//
// TIDAK ADA SATU KALIMAT PUN YANG DISALIN dari bahan berbayar. Larangan itu
// sudah berlaku di aplikasi ini dan tidak berubah di sini.
// ─────────────────────────────────────────────────────────────────────────────

export type Jenjang = 'preklinik' | 'step1' | 'step2ck' | 'step3' | 'ecfmg' | 'spesialis'

export interface Sumber {
  /** Badan yang menerbitkannya, atau penerbit rujukan terbukanya. */
  badan: string
  /** Nama dokumennya sebagaimana ia dikenal dan dapat dicari. */
  nama: string
  /**
   * Tahun edisi yang dirujuk, bila edisinya memang bernomor tahun.
   * Penanda, bukan jaminan — lihat catatan di kepala berkas.
   */
  tahun?: number
  /** Situs badannya atau pencarian. Tidak pernah DOI atau nomor halaman. */
  tautan?: string
}

export interface Topik {
  id: string
  judul: string
  /** Disiplin atau blok tempat topik ini berada. */
  blok: string
  /**
   * Sistem organ menurut Content Outline USMLE, bila topiknya memang berada
   * di dalam satu sistem. Disiplin dasar seperti biostatistik tidak.
   */
  sistem?: string
  /** Mengapa topik ini ada di daftar — apa yang benar-benar diuji. */
  mengapa: string
  sumber: Sumber[]
}

export interface Blok {
  id: string
  jenjang: Jenjang
  judul: string
  emoji: string
  ringkas: string
  topik: Topik[]
}

// ── Sumber yang dipakai berulang ────────────────────────────────────────────
// Ditulis satu kali dan dirujuk, supaya nama badan tidak pernah berbeda-beda
// di dua tempat — perbedaan kecil pada nama membuat pencariannya gagal.

export const S = {
  usmleOutline: {
    badan: 'USMLE (NBME & FSMB)',
    nama: 'USMLE Content Outline and Specifications',
    tautan: 'https://www.usmle.org/prepare-your-exam',
  },
  ecfmg: {
    badan: 'ECFMG',
    nama: 'ECFMG Information Booklet — certification requirements',
    tautan: 'https://www.ecfmg.org',
  },
  abms: {
    badan: 'ABMS',
    nama: 'ABMS Board Certification — specialties and subspecialties',
    tautan: 'https://www.abms.org/member-boards/specialty-subspecialty-certificates/',
  },
  acgme: {
    badan: 'ACGME',
    nama: 'ACGME Program Requirements by specialty',
    tautan: 'https://www.acgme.org/specialties/',
  },
  statpearls: {
    badan: 'NCBI Bookshelf',
    nama: 'StatPearls — open access clinical reference',
    tautan: 'https://www.ncbi.nlm.nih.gov/books/NBK430685/',
  },
  bookshelf: {
    badan: 'NCBI Bookshelf',
    nama: 'NCBI Bookshelf — open access biomedical books',
    tautan: 'https://www.ncbi.nlm.nih.gov/books/',
  },
  who: { badan: 'WHO', nama: 'WHO guidelines', tautan: 'https://www.who.int/publications/who-guidelines' },
  cdc: { badan: 'CDC', nama: 'CDC clinical guidance', tautan: 'https://www.cdc.gov' },
  uspstf: {
    badan: 'USPSTF',
    nama: 'USPSTF Recommendation Statements',
    tautan: 'https://www.uspreventiveservicestaskforce.org/uspstf/topic_search_results',
  },
  ahaAcc: { badan: 'ACC/AHA', nama: 'ACC/AHA Clinical Practice Guidelines', tautan: 'https://www.acc.org/Guidelines' },
  ada: { badan: 'American Diabetes Association', nama: 'Standards of Care in Diabetes', tautan: 'https://diabetesjournals.org/care' },
  kdigo: { badan: 'KDIGO', nama: 'KDIGO Clinical Practice Guidelines', tautan: 'https://kdigo.org/guidelines/' },
  gold: { badan: 'GOLD', nama: 'Global Strategy for Diagnosis, Management and Prevention of COPD', tautan: 'https://goldcopd.org' },
  gina: { badan: 'GINA', nama: 'Global Strategy for Asthma Management and Prevention', tautan: 'https://ginasthma.org' },
  idsa: { badan: 'IDSA', nama: 'IDSA Practice Guidelines', tautan: 'https://www.idsociety.org/practice-guideline/practice-guidelines/' },
  acog: { badan: 'ACOG', nama: 'ACOG Practice Bulletins', tautan: 'https://www.acog.org/clinical' },
  aap: { badan: 'AAP', nama: 'AAP Clinical Practice Guidelines', tautan: 'https://publications.aap.org/collection/523/Clinical-Practice-Guidelines' },
  apa: { badan: 'American Psychiatric Association', nama: 'DSM-5-TR and APA Practice Guidelines', tautan: 'https://www.psychiatry.org/psychiatrists/practice/clinical-practice-guidelines' },
  ssc: { badan: 'Society of Critical Care Medicine / ESICM', nama: 'Surviving Sepsis Campaign guidelines', tautan: 'https://www.sccm.org/SurvivingSepsisCampaign/Guidelines' },
  acs: { badan: 'American Cancer Society / NCCN', nama: 'Cancer screening and treatment guidelines', tautan: 'https://www.nccn.org/guidelines/category_1' },
  aan: { badan: 'American Academy of Neurology', nama: 'AAN Clinical Practice Guidelines', tautan: 'https://www.aan.com/practice/guidelines' },
} as const satisfies Record<string, Sumber>

export default S
