import type { EvidenceLevel } from './regenerationResearch'

// Mesin simulasi replikasi DNA dan atrisi telomer.
//
// KENAPA MODUL INI ADA. `regenerationResearch.ts` sudah menyebut "telomere
// attrition" sebagai salah satu ciri penuaan, tetapi hanya sebagai entri
// katalog: sebuah label dan sebuah deskripsi. Tidak ada satu pun angka yang
// bergerak. Padahal justru mekanismenya yang menjelaskan kenapa sel somatik
// punya batas pembelahan, kenapa sel punca tidak, dan kenapa "anti-penuaan"
// bukan satu tombol melainkan beberapa proses yang saling menahan.
//
// BATAS ILMIAH — dibaca sebelum menambah apa pun di berkas ini.
//
// Semua tetapan di bawah adalah BIOLOGI RUJUKAN tingkat buku teks untuk sel
// manusia pada umumnya. Ia bukan pengukuran pada seseorang, tidak boleh
// dipakai untuk menaksir "usia biologis" seseorang, dan tidak memprediksi umur
// siapa pun. Rentangnya sengaja disimpan bersama nilai tengahnya supaya
// ketidakpastian ikut terbawa, bukan hilang saat dipakai.
//
// Simulasi ini juga BUKAN protokol laboratorium. Ia menjelaskan mekanisme;
// ia tidak memberi langkah untuk mengubah genom manusia.

/** Satu tetapan biologis beserta rentang dan asal-usulnya. */
export interface TetapanBiologi {
  nilai: number
  min: number
  maks: number
  satuan: string
  /** Dari mana angkanya berasal, ditulis untuk dibaca manusia. */
  dasar: string
  bukti: EvidenceLevel
}

const T = (nilai: number, min: number, maks: number, satuan: string, dasar: string): TetapanBiologi =>
  ({ nilai, min, maks, satuan, dasar, bukti: 'reference-biology' })

/**
 * Tetapan replikasi untuk sel somatik manusia.
 *
 * Angka-angka ini konsisten dengan biologi sel tingkat buku teks. Rentangnya
 * nyata: laju garpu dan panjang fragmen Okazaki memang bervariasi antar jenis
 * sel dan antar kondisi, dan menyembunyikan variasi itu di balik satu angka
 * tunggal akan membuat keluaran simulasi terdengar lebih pasti daripada
 * biologinya sendiri.
 */
export const TETAPAN = {
  lajuGarpu: T(50, 20, 100, 'nt/s per garpu',
    'Laju garpu replikasi mamalia; jauh lebih lambat daripada bakteri (~1000 nt/s).'),
  panjangOkazaki: T(150, 100, 200, 'nt',
    'Fragmen Okazaki eukariot, kira-kira satu panjang nukleosom; bakteri 1000-2000 nt.'),
  genomHaploid: T(3_100_000_000, 3_000_000_000, 3_200_000_000, 'bp',
    'Ukuran genom haploid manusia.'),
  originAktif: T(40_000, 30_000, 50_000, 'origin per fase S',
    'Origin replikasi yang menyala di sepanjang satu fase S somatik, dijumlahkan.'),
  originSerempak: T(1_100, 700, 1_600, 'origin aktif serentak',
    'Origin yang bekerja pada saat yang SAMA. Jauh lebih sedikit daripada total '
    + 'per fase S karena origin menyala bergelombang menurut domain waktu, dan '
    + 'faktor replikasi yang tersedia terbatas. Nilainya dibatasi oleh lama fase '
    + 'S yang teramati (~8 jam), bukan dihitung terpisah -- dan itu memang '
    + 'ketergantungan yang harus disebut, bukan disembunyikan.'),
  telomerLahir: T(11_000, 10_000, 15_000, 'bp',
    'Panjang telomer leukosit sekitar kelahiran.'),
  atrisiPerPembelahan: T(120, 100, 150, 'bp per pembelahan',
    'Kehilangan telomer per penggandaan populasi pada fibroblas manusia YANG '
    + 'DIBIAKKAN -- sistem yang justru diukur Hayflick. Angka in vivo untuk '
    + 'leukosit lebih rendah (sekitar 50-100 bp per pembelahan); memakai angka '
    + 'in vivo itu di sini menghasilkan 85 pembelahan, bukan ~50 yang '
    + 'dilaporkan, dan itulah sebabnya keduanya dipisah alih-alih dirata-rata.'),
  atrisiInVivoLeukosit: T(70, 50, 100, 'bp per pembelahan',
    'Atrisi telomer leukosit in vivo. Disimpan terpisah karena menjawab '
    + 'pertanyaan yang berbeda dari angka biakan di atas.'),
  ambangSenesens: T(5_000, 4_000, 6_000, 'bp',
    'Panjang telomer saat respons kerusakan DNA menetap dan sel berhenti membelah (batas Hayflick).'),
  galatSebelumProofreading: T(1e-5, 1e-4, 1e-6, 'galat per basa',
    'Kesalahan penyisipan polimerase sebelum koreksi.'),
  galatSetelahProofreading: T(1e-7, 1e-6, 1e-8, 'galat per basa',
    'Setelah aktivitas eksonuklease 3\'->5\' polimerase itu sendiri.'),
  galatSetelahMMR: T(1e-9, 1e-9, 1e-10, 'galat per basa',
    'Setelah perbaikan ketidakcocokan (mismatch repair) pasca-replikasi.'),
} as const

export type NamaTetapan = keyof typeof TETAPAN

/** Jenis sel menentukan apakah telomerase menahan atrisi. */
export type JenisSel = 'somatik' | 'punca' | 'germinal' | 'kanker'

/**
 * Aktivitas telomerase sebagai pecahan atrisi yang dikompensasi.
 *
 * 0 berarti tidak ada kompensasi sama sekali (sel somatik dewasa); 1 berarti
 * panjang telomer dipertahankan sepenuhnya. Sel punca berada di antaranya --
 * itulah sebabnya jaringan yang memperbarui diri tetap menua, hanya lebih
 * lambat. Ini penyederhanaan yang disengaja: telomerase sesungguhnya diatur
 * per-sel dan per-siklus, bukan satu angka tetap.
 */
export const TELOMERASE: Record<JenisSel, number> = {
  somatik: 0,
  punca: 0.5,
  germinal: 1,
  kanker: 0.98,
}

export interface Garpu {
  /** Basa yang sudah disalin pada untai maju (kontinu). */
  majuBp: number
  /** Basa yang sudah disalin pada untai lambat (terputus-putus). */
  lambatBp: number
  /** Fragmen Okazaki yang sudah selesai pada untai lambat. */
  fragmen: number
}

export interface KeadaanReplikasi {
  /** Detik sejak fase S dimulai. */
  waktuDetik: number
  /** Basa total yang sudah direplikasi oleh seluruh origin aktif. */
  bpSelesai: number
  /** Genom yang harus disalin, dalam bp. */
  bpTarget: number
  garpu: Garpu
  origin: number
  lajuGarpu: number
  panjangOkazaki: number
  selesai: boolean
}

/**
 * Satu garpu berjalan dua arah, jadi satu origin menghasilkan dua garpu.
 * Ini sering terlewat dan membuat perkiraan lama fase S meleset dua kali
 * lipat.
 */
export const GARPU_PER_ORIGIN = 2

export function mulaiReplikasi(opsi?: {
  origin?: number
  lajuGarpu?: number
  panjangOkazaki?: number
  bpTarget?: number
}): KeadaanReplikasi {
  // Yang menentukan laju adalah origin yang aktif SERENTAK, bukan jumlah
  // seluruh origin yang menyala sepanjang fase S. Memakai angka total membuat
  // fase S keluar sekitar 13 menit alih-alih ~8 jam -- terukur, dan itulah
  // kekeliruan yang ditangkap uji lama fase S.
  const origin = opsi?.origin ?? TETAPAN.originSerempak.nilai
  return {
    waktuDetik: 0,
    bpSelesai: 0,
    bpTarget: opsi?.bpTarget ?? TETAPAN.genomHaploid.nilai,
    garpu: { majuBp: 0, lambatBp: 0, fragmen: 0 },
    origin,
    lajuGarpu: opsi?.lajuGarpu ?? TETAPAN.lajuGarpu.nilai,
    panjangOkazaki: opsi?.panjangOkazaki ?? TETAPAN.panjangOkazaki.nilai,
    selesai: false,
  }
}

/**
 * Majukan replikasi sebesar `dtDetik`.
 *
 * Untai maju disintesis terus-menerus; untai lambat menempuh jarak yang sama
 * tetapi dalam potongan-potongan, sehingga jumlah fragmennya bertambah. Kedua
 * untai bergerak bersama garpu yang sama -- yang berbeda adalah cara
 * sintesisnya, bukan kecepatannya.
 */
export function langkahReplikasi(k: KeadaanReplikasi, dtDetik: number): KeadaanReplikasi {
  if (k.selesai || dtDetik <= 0) return k
  const majuPerGarpu = k.lajuGarpu * dtDetik
  const totalGarpu = k.origin * GARPU_PER_ORIGIN
  const bpBaru = majuPerGarpu * totalGarpu
  const bpSelesai = Math.min(k.bpTarget, k.bpSelesai + bpBaru)
  const majuBp = k.garpu.majuBp + majuPerGarpu
  const lambatBp = k.garpu.lambatBp + majuPerGarpu
  return {
    ...k,
    waktuDetik: k.waktuDetik + dtDetik,
    bpSelesai,
    garpu: {
      majuBp,
      lambatBp,
      fragmen: Math.floor(lambatBp / k.panjangOkazaki),
    },
    selesai: bpSelesai >= k.bpTarget,
  }
}

/**
 * Perkiraan lama fase S dari laju garpu dan jumlah origin.
 *
 * Berguna sebagai pemeriksaan kewarasan: dengan tetapan bawaan hasilnya harus
 * jatuh pada kisaran fase S manusia yang memang diamati, sekitar 8 jam.
 */
export function lamaFaseSDetik(
  bpTarget = TETAPAN.genomHaploid.nilai,
  origin = TETAPAN.originSerempak.nilai,
  lajuGarpu = TETAPAN.lajuGarpu.nilai,
): number {
  const totalGarpu = origin * GARPU_PER_ORIGIN
  if (totalGarpu <= 0 || lajuGarpu <= 0) return Number.POSITIVE_INFINITY
  return bpTarget / (totalGarpu * lajuGarpu)
}

/** Galat yang lolos setiap lapis pengamanan, untuk satu kali replikasi genom. */
export interface AnggaranGalat {
  tanpaKoreksi: number
  setelahProofreading: number
  setelahMMR: number
}

export function anggaranGalat(bp = TETAPAN.genomHaploid.nilai): AnggaranGalat {
  return {
    tanpaKoreksi: bp * TETAPAN.galatSebelumProofreading.nilai,
    setelahProofreading: bp * TETAPAN.galatSetelahProofreading.nilai,
    setelahMMR: bp * TETAPAN.galatSetelahMMR.nilai,
  }
}

export interface KeadaanTelomer {
  pembelahan: number
  panjangBp: number
  senesen: boolean
  jenis: JenisSel
}

export function mulaiTelomer(jenis: JenisSel = 'somatik', panjangAwalBp?: number): KeadaanTelomer {
  return {
    pembelahan: 0,
    panjangBp: panjangAwalBp ?? TETAPAN.telomerLahir.nilai,
    senesen: false,
    jenis,
  }
}

/**
 * Atrisi bersih per pembelahan setelah kompensasi telomerase.
 *
 * Ini inti "masalah replikasi ujung": primer RNA terakhir pada untai lambat
 * tidak bisa digantikan DNA, sehingga setiap putaran replikasi memendekkan
 * ujung kromosom. Telomerase mengembalikan sebagian -- pada sel germinal,
 * praktis seluruhnya.
 */
export function atrisiBersihBp(jenis: JenisSel, atrisiKotorBp = TETAPAN.atrisiPerPembelahan.nilai): number {
  const kompensasi = TELOMERASE[jenis] ?? 0
  return atrisiKotorBp * (1 - kompensasi)
}

export function langkahPembelahan(k: KeadaanTelomer, atrisiKotorBp?: number): KeadaanTelomer {
  if (k.senesen) return k
  const panjangBp = Math.max(0, k.panjangBp - atrisiBersihBp(k.jenis, atrisiKotorBp))
  return {
    ...k,
    pembelahan: k.pembelahan + 1,
    panjangBp,
    senesen: panjangBp <= TETAPAN.ambangSenesens.nilai,
  }
}

/**
 * Berapa kali sel masih bisa membelah sebelum senesens.
 *
 * Mengembalikan `null` -- bukan angka besar, dan bukan Infinity yang
 * diam-diam ikut terbawa ke dalam aritmetika -- ketika telomerase menahan
 * atrisi sepenuhnya, karena "tak terhingga" di sini adalah pernyataan tentang
 * model, bukan tentang sel.
 */
export function sisaPembelahan(k: KeadaanTelomer, atrisiKotorBp?: number): number | null {
  if (k.senesen) return 0
  const perPembelahan = atrisiBersihBp(k.jenis, atrisiKotorBp)
  if (perPembelahan <= 0) return null
  const cadangan = k.panjangBp - TETAPAN.ambangSenesens.nilai
  if (cadangan <= 0) return 0
  return Math.ceil(cadangan / perPembelahan)
}

/**
 * Batas Hayflick yang diturunkan dari tetapan, bukan ditulis sebagai angka
 * hafalan. Dengan nilai bawaan hasilnya jatuh di kisaran ~50-60 pembelahan
 * untuk fibroblas manusia, yang memang angka yang dilaporkan Hayflick.
 */
export function batasHayflick(
  panjangAwalBp = TETAPAN.telomerLahir.nilai,
  atrisiKotorBp = TETAPAN.atrisiPerPembelahan.nilai,
): number {
  return Math.floor((panjangAwalBp - TETAPAN.ambangSenesens.nilai) / atrisiKotorBp)
}
