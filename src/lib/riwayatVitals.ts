import { getVitals, type Vitals } from './healthVitals'

// ─────────────────────────────────────────────────────────────────────────────
// Riwayat angka tubuh, dan rentang kebiasaan Anda sendiri.
//
// CACAT YANG DITEMUKAN SAAT MENGEVALUASI. Aplikasi ini menyimpan 113 medan
// metrik, tetapi menyimpannya sebagai SATU POTRET: setiap kali data baru masuk,
// nilai kemarin ditimpa dan hilang selamanya. Akibatnya tidak ada satu pun
// angka tubuh yang punya riwayat — grafik kecil pada ubin beranda hanya dapat
// digambar untuk tidur dan makanan, yang kebetulan disimpan per tanggal.
//
// Itu bukan kekurangan tampilan melainkan kekurangan DATA, dan tidak ada
// susunan warna atau tata letak yang dapat menutupinya.
//
// MENGAPA RIWAYAT ITU YANG PALING MENENTUKAN. Gagasan terbaik dari aplikasi
// yang menjadi rujukan bukan warnanya, melainkan RENTANG PRIBADI: alih-alih
// menyatakan sebuah angka baik atau buruk menurut populasi, ia menyatakan
// apakah angka itu biasa BAGI ANDA, dengan menyebut kebiasaan Anda sendiri
// secara terbuka — "HRV Anda 35,7 ms; dalam 90 hari terakhir kebiasaan Anda
// 39,5 sampai 68,0 ms".
//
// Pernyataan semacam itu jujur dengan cara yang tidak dimiliki penilaian
// populasi. Denyut istirahat 58 bpm tidak dapat disebut baik atau buruk tanpa
// tahu siapa orangnya; tetapi 58 bpm pada orang yang selama tiga bulan berada
// di 46-52 bpm adalah SESUATU YANG BERUBAH, dan perubahan itu fakta, bukan
// tafsiran. Pembandingnya adalah dirinya sendiri, dan pembanding itu disebutkan
// apa adanya sehingga dapat diperiksa.
//
// YANG TETAP TIDAK DILAKUKAN. Rentang pribadi TIDAK menggantikan rentang
// rujukan medis dan tidak dipakai untuk menyatakan sehat atau sakit. Seseorang
// yang saturasinya tiga bulan terakhir 88-90% akan mendapati 89% sebagai
// "biasa bagi Anda", padahal justru itu yang harus diperiksakan. Karena itu
// kalimatnya selalu berbentuk "dibanding kebiasaan Anda", bukan "normal", dan
// halaman rentang rujukan tetap menjadi tempat penilaian medisnya.
// ─────────────────────────────────────────────────────────────────────────────

const KUNCI = 'pmd_riwayat_vitals_v1'
const MAKS_HARI = 180

/** Satu hari, satu potret. Nilai terakhir pada hari itu yang disimpan. */
export interface HariVitals {
  tanggal: string
  nilai: Record<string, number>
}

function kunciTanggalLokal(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function ambilRiwayat(): HariVitals[] {
  try {
    const raw = localStorage.getItem(KUNCI)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((h) => h && typeof h.tanggal === 'string' && h.nilai) : []
  } catch {
    return []
  }
}

/**
 * Catat potret hari ini.
 *
 * SATU BARIS PER HARI, bukan satu baris per penyaluran data. Jam tangan
 * menyalurkan data berkali-kali sehari, dan menyimpan tiap penyaluran akan
 * membuat sebuah hari yang kebetulan disinkronkan dua puluh kali menguasai
 * perhitungan rentang, seolah hari itu dua puluh kali lebih penting daripada
 * hari lain.
 *
 * Dipanggil dari mergeVitals, sehingga tidak ada jalan masuk data yang lolos
 * tanpa tercatat.
 */
export function catatRiwayat(v: Vitals = getVitals()): void {
  const angka: Record<string, number> = {}
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === 'number' && Number.isFinite(val) && val > 0) angka[k] = val
  }
  if (!Object.keys(angka).length) return

  const hariIni = kunciTanggalLokal()
  const riwayat = ambilRiwayat().filter((h) => h.tanggal !== hariIni)
  riwayat.push({ tanggal: hariIni, nilai: angka })
  riwayat.sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1))

  try {
    localStorage.setItem(KUNCI, JSON.stringify(riwayat.slice(-MAKS_HARI)))
  } catch {
    // Kuota penuh: buang separuh tertua lalu coba sekali lagi. Gagal menyimpan
    // riwayat tidak boleh menggagalkan penyimpanan angka hari ini.
    try {
      localStorage.setItem(KUNCI, JSON.stringify(riwayat.slice(-Math.floor(MAKS_HARI / 2))))
    } catch { /* menyerah, tanpa mengganggu apa pun */ }
  }
}

/** Deret nilai satu metrik, terlama di depan. */
export function deretMetrik(kunci: string, maksHari = MAKS_HARI): { tanggal: string; nilai: number }[] {
  return ambilRiwayat()
    .slice(-maksHari)
    .filter((h) => typeof h.nilai[kunci] === 'number')
    .map((h) => ({ tanggal: h.tanggal, nilai: h.nilai[kunci] }))
}

/** Jumlah hari terkecil sebelum sebuah rentang pribadi boleh disebut. */
export const CUKUP_HARI = 14

export interface RentangPribadi {
  bawah: number
  atas: number
  /** Berapa hari yang menjadi dasarnya. */
  hari: number
  /** Nilai terakhir dibanding rentangnya. */
  posisi: 'below your usual' | 'within your usual' | 'above your usual'
}

/**
 * Rentang kebiasaan pribadi untuk satu metrik.
 *
 * Memakai PERSENTIL 10 dan 90, bukan nilai terkecil dan terbesar. Satu hari
 * yang aneh — jam tangan terlepas, demam sehari, alat salah baca — akan
 * melebarkan rentang minimum-maksimum sedemikian rupa sehingga tidak ada nilai
 * yang pernah terbaca di luar kebiasaan, dan rentang yang tidak pernah
 * dilanggar tidak memberi tahu apa pun.
 *
 * Mengembalikan null bila harinya kurang dari CUKUP_HARI. Rentang yang disusun
 * dari lima hari lebih menyesatkan daripada tidak ada rentang sama sekali.
 */
export function rentangPribadi(kunci: string, nilaiKini?: number): RentangPribadi | null {
  const deret = deretMetrik(kunci, 90).map((d) => d.nilai)
  if (deret.length < CUKUP_HARI) return null

  const urut = [...deret].sort((a, b) => a - b)
  const ambil = (p: number) => urut[Math.min(urut.length - 1, Math.max(0, Math.round((urut.length - 1) * p)))]
  const bawah = ambil(0.1)
  const atas = ambil(0.9)

  const kini = typeof nilaiKini === 'number' ? nilaiKini : deret[deret.length - 1]
  const posisi = kini < bawah ? 'below your usual' : kini > atas ? 'above your usual' : 'within your usual'
  return { bawah, atas, hari: deret.length, posisi }
}

/**
 * Kalimat yang menemani rentang itu.
 *
 * Selalu menyebut ANGKANYA, bukan hanya kesimpulannya. "Di luar kebiasaan"
 * tanpa menyebut kebiasaannya berapa adalah penilaian yang tidak dapat
 * diperiksa pembacanya — dan penilaian yang tidak dapat diperiksa persis yang
 * dihindari seluruh aplikasi ini.
 */
export function bacaRentang(r: RentangPribadi, satuan: string, bulat = 0): string {
  const f = (n: number) => (bulat ? n.toFixed(bulat) : String(Math.round(n)))
  return `${r.posisi}: ${f(r.bawah)}-${f(r.atas)} ${satuan} over the last ${r.hari} days`
}
