import { RIWAYAT_OSCE, SISTEM_OSCE, type StasiunOsce } from './osceUkmppdRiwayat'

// ─────────────────────────────────────────────────────────────────────────────
// Menghitung apa yang SESUNGGUHNYA keluar di OSCE UKMPPD, dari 1.416 stasiun
// sepanjang 32 periode ujian.
//
// PERTANYAAN YANG DIJAWAB. Daftar SKDI memuat 736 penyakit dan tidak memberi
// tahu mana yang benar-benar diujikan. Rekap ini memberi tahu — dan itu
// mengubah urutan belajar sepenuhnya: kasus yang muncul dua belas kali dalam
// sepuluh tahun bukan setara dengan kasus yang belum pernah muncul sama sekali.
//
// PENYERAGAMAN NAMA DILAKUKAN DI SINI, BUKAN DI DALAM DATA. Berkas data
// menyimpan nama apa adanya; di sinilah "DHF grade 2", "DHF Grade II", dan
// "Dengue Hemorrhagic Fever grade 2" disatukan. Alasannya: penyeragaman adalah
// TAFSIRAN, dan tafsiran yang disimpan sebagai data tidak dapat lagi dibedakan
// dari catatan aslinya oleh pembaca berikutnya. Di sini ia dapat dibaca,
// diperiksa, dan diperbaiki.
//
// TIGA HAL YANG SENGAJA TIDAK DILAKUKAN:
//
//   1. TIDAK MERAMALKAN SOAL YANG AKAN KELUAR. Frekuensi masa lalu bukan
//      peluang masa depan, dan aplikasi yang berkata "ini akan keluar" sedang
//      menjual keyakinan yang tidak dimilikinya. Yang ditampilkan adalah
//      hitungan apa adanya, beserta kapan terakhir muncul.
//
//   2. TIDAK MENYEMBUNYIKAN EKOR PANJANGNYA. Sebagian besar kasus hanya muncul
//      sekali. Menampilkan sepuluh teratas saja memberi kesan ujiannya dapat
//      ditebak; jumlah kasus yang hanya sekali muncul ikut dilaporkan supaya
//      kesan itu tidak terbentuk.
//
//   3. TIDAK MENGURUTKAN SISTEM MENURUT "KEPENTINGAN". Seluruh dua belas sistem
//      diuji setiap periode; yang berbeda hanyalah keragaman kasusnya.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pembakuan ringan: huruf kecil, tanda baca dan spasi dirapikan, keterangan
 * tindakan di dalam kurung dibuang, dan beberapa ejaan yang jelas sama
 * disatukan.
 *
 * Sengaja TIDAK agresif. Menyatukan "Anemia defisiensi besi" dengan "Anemia
 * defisiensi besi e.c. hookworm" akan menghapus keterangan penyebab yang justru
 * menjadi inti stasiunnya.
 */
const EJAAN: [RegExp, string][] = [
  [/\bdhf\b/g, 'dengue hemorrhagic fever'],
  [/\bdbd\b/g, 'dengue hemorrhagic fever'],
  [/\bgrade\s*([ivx]+|\d+)\b/g, 'grade $1'],
  [/\bgrd\b/g, 'grade'],
  [/\bec\b|\be\.c\.?\b/g, 'ec'],
  [/\bppok\b/g, 'ppok'],
  [/\bkds\b/g, 'kejang demam sederhana'],
  [/\bkdk\b/g, 'kejang demam kompleks'],
  [/\bapn\b/g, 'asuhan persalinan normal'],
  [/\brjp\b/g, 'resusitasi jantung paru'],
  [/\bcts\b/g, 'carpal tunnel syndrome'],
  // Singkatan yang benar-benar muncul di sumbernya sebagai entri tersendiri.
  // Diperiksa satu per satu, bukan diduga: tanpa penggabungan ini "BV" dan
  // "bakterial vaginosis" terhitung sebagai dua kasus berbeda yang
  // masing-masing tujuh kali, padahal keduanya stasiun yang sama sebanyak
  // empat belas kali — dan urutan prioritas belajarnya berubah karenanya.
  [/\bbv\b/g, 'bakterial vaginosis'],
  [/\badb\b/g, 'anemia defisiensi besi'],
  [/\bkpd\b/g, 'ketuban pecah dini'],
  [/\boma\b/g, 'otitis media akut'],
  [/\bome\b/g, 'otitis media efusi'],
  [/\bomsk\b/g, 'otitis media supuratif kronik'],
  [/\bisk\b/g, 'infeksi saluran kemih'],
  [/\bispa\b/g, 'infeksi saluran pernapasan akut'],
  [/\bgnaps\b/g, 'glomerulonefritis akut pasca streptokokus'],
  [/\bra\b/g, 'rheumatoid arthritis'],
  [/\boa\b/g, 'osteoarthritis'],
  [/\bsle\b/g, 'systemic lupus erythematosus'],
  [/\bhpp\b/g, 'perdarahan pascapersalinan'],
  // Singkatan yang menjadi NAMA RESMI penyakitnya di daftar SKDI. Tanpa
  // penerjemahan ini, alat pencari catatan melaporkan "PTSD 0/8" padahal
  // entrinya ada dengan nama panjang — dan daftar kerja yang mengatakan sesuatu
  // belum dikerjakan padahal sudah, membuatnya dikerjakan dua kali.
  [/\bptsd\b/g, 'post traumatic stress disorder'],
  [/\btth\b/g, 'tension type headache'],
  [/\bcorpal\b/g, 'corpus alienum'],
  [/\bkorpal\b/g, 'corpus alienum'],
  [/\bkdk?\b/g, 'kejang demam'],
  [/\brme\b/g, ''],
  [/\bga\b/g, ''],
]

/**
 * Isi kurung yang berupa KETERANGAN TINDAKAN atau administrasi ujian, bukan
 * keterangan penyakit. Hanya yang cocok dengan pola ini yang dibuang.
 */
const KURUNG_TINDAKAN = /\b(rme|nebul|infus|iv ?line|ivfd|tindakan|pasang|px|pemeriksaan|ekstraksi|hecting|kateter|ngt|sirkum|ekg|bidai|edukasi|kie|langkah|baca)\b/i

export function bakukan(nama: string): string {
  let s = nama.toLowerCase()
  /*
   * Isi kurung dibuang HANYA bila berupa keterangan tindakan.
   *
   * Percobaan pertama membuang seluruh isi kurung tanpa kecuali, dan itu
   * menghasilkan pemisahan yang tidak masuk akal: "GNAPS (dewasa)" menjadi
   * kunci yang sama dengan "GNAPS", sedangkan "GNAPS dewasa" — kata yang sama
   * persis, hanya tanpa kurung — menjadi kunci yang BERBEDA. Aturan yang
   * hasilnya bergantung pada ada tidaknya tanda kurung bukan aturan, melainkan
   * kebetulan.
   *
   * Yang dibuang kini hanya keterangan tindakan dan administrasi ujian, karena
   * itu memang bukan pembeda penyakitnya. Keterangan klinis di dalam kurung —
   * "(dewasa)", "(anak)", "(grade II)" — dipertahankan, karena stasiun GNAPS
   * pada dewasa memang bukan stasiun yang sama dengan GNAPS pada anak.
   */
  s = s.replace(/\(([^)]*)\)/g, (_, isi) => (KURUNG_TINDAKAN.test(isi) ? ' ' : ' ' + isi + ' '))
  s = s.replace(/[-–—]/g, ' ')
  for (const [re, ganti] of EJAAN) s = s.replace(re, ganti)
  s = s.replace(/[^a-z0-9/+ ]/g, ' ').replace(/\s+/g, ' ').trim()
  return s
}

export interface HitunganKasus {
  /** Bentuk terpanjang yang pernah tertulis — paling banyak keterangannya. */
  label: string
  kunci: string
  sistem: string
  jumlah: number
  /** Periode-periode tempat ia muncul, terbaru lebih dahulu. */
  periode: string[]
}

/**
 * Urutan periode. Sumbernya bercampur dua bentuk — 'Februari 2016' dan
 * '2026-02-26' — sehingga pengurutan abjad menghasilkan urutan yang keliru.
 */
const BULAN: Record<string, number> = {
  januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
  juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, ags: 8, agu: 8, sep: 9, okt: 10, nov: 11, des: 12,
}

export function urutanPeriode(p: string): number {
  const iso = p.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return Number(iso[1]) * 12 + Number(iso[2])
  const teks = p.toLowerCase().match(/([a-z]+)[\s-]*(\d{2,4})/)
  if (teks) {
    const b = BULAN[teks[1]] ?? 0
    let th = Number(teks[2])
    if (th < 100) th += 2000
    return th * 12 + b
  }
  return 0
}

export function hitungKasus(riwayat: readonly StasiunOsce[] = RIWAYAT_OSCE): HitunganKasus[] {
  const peta = new Map<string, HitunganKasus>()
  for (const s of riwayat) {
    const kunci = bakukan(s.kasus)
    if (!kunci) continue
    const id = `${s.sistem}|${kunci}`
    const ada = peta.get(id)
    if (ada) {
      ada.jumlah++
      if (!ada.periode.includes(s.periode)) ada.periode.push(s.periode)
      // Label terpanjang dipertahankan: ia membawa paling banyak keterangan.
      if (s.kasus.length > ada.label.length) ada.label = s.kasus
    } else {
      peta.set(id, { label: s.kasus, kunci, sistem: s.sistem, jumlah: 1, periode: [s.periode] })
    }
  }
  const out = [...peta.values()]
  for (const k of out) k.periode.sort((a, b) => urutanPeriode(b) - urutanPeriode(a))
  return out.sort((a, b) => b.jumlah - a.jumlah || a.label.localeCompare(b.label))
}

export interface RingkasSistem {
  sistem: string
  /** Berapa stasiun seluruhnya pernah keluar dari sistem ini. */
  stasiun: number
  /** Berapa kasus BERBEDA — makin banyak, makin sulit ditebak. */
  ragam: number
  /** Berapa kasus yang baru muncul sekali saja. */
  sekali: number
  teratas: HitunganKasus[]
}

export function ringkasPerSistem(riwayat: readonly StasiunOsce[] = RIWAYAT_OSCE): RingkasSistem[] {
  const semua = hitungKasus(riwayat)
  return SISTEM_OSCE.map((sistem) => {
    const punya = semua.filter((k) => k.sistem === sistem)
    return {
      sistem,
      stasiun: punya.reduce((a, k) => a + k.jumlah, 0),
      ragam: punya.length,
      sekali: punya.filter((k) => k.jumlah === 1).length,
      teratas: punya.slice(0, 8),
    }
  }).filter((r) => r.stasiun > 0)
}

export function periodeTerurut(riwayat: readonly StasiunOsce[] = RIWAYAT_OSCE): string[] {
  return [...new Set(riwayat.map((s) => s.periode))].sort((a, b) => urutanPeriode(b) - urutanPeriode(a))
}

/** Angka utuh untuk kepala halaman — tanpa satu pun yang ditaksir. */
export function ringkasSeluruh(riwayat: readonly StasiunOsce[] = RIWAYAT_OSCE) {
  const kasus = hitungKasus(riwayat)
  return {
    stasiun: riwayat.length,
    periode: periodeTerurut(riwayat).length,
    ragam: kasus.length,
    sekali: kasus.filter((k) => k.jumlah === 1).length,
    berulang: kasus.filter((k) => k.jumlah >= 3).length,
  }
}
