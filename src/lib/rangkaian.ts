import { kunciTanggal } from './ramalan'

// ─────────────────────────────────────────────────────────────────────────────
// Rangkaian hari — dan empat keputusan yang membedakannya dari "streak".
//
// APA YANG SEBENARNYA DIUKUR. Rangkaian ini menghitung BERAPA HARI BERTURUT
// ANDA MENCATAT, bukan berapa hari berturut Anda sehat. Keduanya sering
// tertukar, dan tertukarnya merugikan: orang yang tidur delapan jam tanpa
// mencatatnya akan melihat angkanya jatuh, lalu menyimpulkan sesuatu tentang
// tubuhnya padahal yang berubah hanyalah kebiasaan mencatatnya. Kalimat itu
// ditulis apa adanya di layar, bukan disembunyikan di halaman bantuan.
//
// EMPAT ATURAN, DAN ALASANNYA:
//
//   1. TENGGANG SATU HARI. Rangkaian tetap hidup bila hari ini ATAU kemarin
//      tercatat. Memutusnya tepat tengah malam adalah batas yang dibuat oleh
//      jam, bukan oleh tubuh — dan orang yang mencatat pada jam 00.10 setelah
//      pulang kerja tidak sedang gagal melakukan apa pun.
//
//   2. TIDAK ADA HUKUMAN SAAT TERPUTUS. Yang ditampilkan hanyalah angka baru;
//      tidak ada kalimat kehilangan, tidak ada peringatan, tidak ada tawaran
//      "selamatkan rangkaian Anda". Rasa bersalah menaikkan pemakaian aplikasi
//      dalam jangka pendek dan menurunkannya dalam jangka panjang, karena
//      orang berhenti membuka aplikasi yang membuatnya merasa gagal.
//
//   3. JUMLAH SELURUH HARI SELALU DITAMPILKAN BERDAMPINGAN. Ini yang tidak
//      pernah hilang. Seseorang yang mencatat 200 hari dengan beberapa jeda
//      sesungguhnya lebih rajin daripada yang mencatat 30 hari beruntun, dan
//      angka yang hanya menghitung keberuntunan justru mengatakan sebaliknya.
//
//   4. TIDAK ADA HADIAH ACAK, TIDAK ADA TINGKATAN, TIDAK ADA LENCANA. Semua itu
//      bekerja — memang itu masalahnya. Yang dibangun di sini alat kesehatan,
//      bukan mesin kebiasaan.
// ─────────────────────────────────────────────────────────────────────────────

const HARI = 86400_000

export interface Rangkaian {
  /** Hari berturut yang tercatat, dengan tenggang satu hari. */
  berjalan: number
  /** Rangkaian terpanjang yang pernah dicapai. */
  terpanjang: number
  /** Seluruh hari yang pernah tercatat, berjeda maupun tidak. Lihat aturan 3. */
  total: number
  /** Apakah hari ini sudah tercatat. */
  hariIniSudah: boolean
  /** Tanggal tercatat terakhir, atau null. */
  terakhir: string | null
}

function mundur(kunci: string, n: number): string {
  const t = Date.parse(`${kunci}T12:00:00`)
  return Number.isNaN(t) ? kunci : kunciTanggal(new Date(t - n * HARI))
}

/**
 * Hitung rangkaian dari sekumpulan tanggal (format YYYY-MM-DD).
 *
 * Masukannya sengaja berupa tanggal telanjang, bukan objek catatan: apa yang
 * dianggap "tercatat" adalah keputusan pemanggil, dan menaruhnya di sini akan
 * membuat berkas ini ikut memutuskan hal yang bukan urusannya.
 */
export function hitungRangkaian(tanggal: string[], sekarang = Date.now()): Rangkaian {
  const set = new Set(tanggal.filter(Boolean))
  const hariIni = kunciTanggal(new Date(sekarang))
  const kemarin = mundur(hariIni, 1)

  const hariIniSudah = set.has(hariIni)
  const total = set.size
  const urut = [...set].sort()
  const terakhir = urut.length ? urut[urut.length - 1] : null

  // Aturan 1: titik mulai boleh hari ini maupun kemarin.
  let mulai: string | null = null
  if (hariIniSudah) mulai = hariIni
  else if (set.has(kemarin)) mulai = kemarin

  let berjalan = 0
  if (mulai) {
    let k: string = mulai
    while (set.has(k)) {
      berjalan++
      k = mundur(k, 1)
    }
  }

  // Terpanjang: satu lintasan atas tanggal yang sudah terurut.
  let terpanjang = 0
  let jalan = 0
  let sebelumnya: string | null = null
  for (const k of urut) {
    jalan = sebelumnya && mundur(k, 1) === sebelumnya ? jalan + 1 : 1
    if (jalan > terpanjang) terpanjang = jalan
    sebelumnya = k
  }

  return { berjalan, terpanjang, total, hariIniSudah, terakhir }
}

/**
 * Kalimat yang menemani angkanya.
 *
 * Tidak ada kalimat yang menyalahkan, dan tidak ada yang memuji berlebihan.
 * Yang dikatakan hanyalah apa yang benar-benar diketahui aplikasi ini: berapa
 * hari tercatat, dan bahwa yang dihitung adalah pencatatannya.
 */
export function bacaRangkaian(r: Rangkaian): string {
  if (r.total === 0) {
    return 'Belum ada hari yang tercatat. Satu catatan hari ini sudah cukup untuk memulai.'
  }
  if (r.berjalan === 0) {
    return `Ada jeda sejak catatan terakhir. Seluruhnya sudah ${r.total} hari tercatat, dan angka itu tidak berkurang.`
  }
  if (r.berjalan === 1) {
    return `Hari ini tercatat. Seluruhnya ${r.total} hari.`
  }
  return `${r.berjalan} hari berturut tercatat, dan ${r.total} hari seluruhnya.`
}

/** Peringatan yang wajib menemani angka ini di mana pun ia ditampilkan. */
export const PERINGATAN_RANGKAIAN =
  'Angka ini menghitung hari Anda MENCATAT, bukan hari Anda sehat.'
