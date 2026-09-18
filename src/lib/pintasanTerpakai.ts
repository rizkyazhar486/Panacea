import type { EntriKatalog } from './katalogLengkap'

/**
 * Pintasan menuju kapabilitas yang BENAR-BENAR dibuka orang ini.
 *
 * Jumlahnya sengaja kecil. Pintasan yang panjang bukan pintasan lagi — ia
 * menjadi daftar kedua yang harus dipindai sebelum sampai ke daftar pertama.
 */
export const BATAS_PINTASAN = 6

/**
 * Berapa kali sebuah tujuan harus dibuka sebelum ia layak disebut "sering".
 *
 * Satu kunjungan bukan kebiasaan; ia bisa saja salah ketuk. Menampilkannya
 * sebagai pintasan pribadi membuat daftar ini terasa mengarang, dan begitu
 * sebuah bagian layar terasa mengarang, bagian lain di layar yang sama ikut
 * kehilangan kepercayaan.
 */
export const MINIMAL_KUNJUNGAN = 2

/**
 * Menyusun pintasan dari hitungan kunjungan yang tersimpan di perangkat.
 *
 * Mengembalikan daftar KOSONG ketika belum ada yang cukup sering dibuka, dan
 * itu disengaja: bagian "paling sering dipakai" yang diisi tebakan pada
 * pemakaian pertama adalah personalisasi yang dikarang. Lebih baik tidak
 * muncul sama sekali daripada muncul dan salah.
 *
 * `hitungan` dikunci pada rute KANONIK yang sama dengan yang ditautkan layar,
 * karena itulah yang dicatat saat orang membukanya; memakai rute mentah akan
 * membuat tujuan yang dialihkan tidak pernah terhitung sama sekali.
 */
export function pintasanTerpakai(
  tersedia: readonly EntriKatalog[],
  hitungan: Readonly<Record<string, number>>,
  kanonik: (to: string) => string,
  batas: number = BATAS_PINTASAN,
): EntriKatalog[] {
  const terlihat = new Set<string>()
  return tersedia
    .map((entri) => ({ entri, n: hitungan[kanonik(entri.to)] ?? hitungan[entri.to] ?? 0 }))
    .filter(({ entri, n }) => {
      if (n < MINIMAL_KUNJUNGAN) return false
      const kunci = kanonik(entri.to)
      if (terlihat.has(kunci)) return false
      terlihat.add(kunci)
      return true
    })
    .sort((a, b) => b.n - a.n)
    .slice(0, Math.max(0, batas))
    .map(({ entri }) => entri)
}
