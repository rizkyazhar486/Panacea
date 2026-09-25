// Nama halaman di bilah perintah.
//
// Sebelum berkas ini, judulnya diambil hanya dari katalog navigasi yang SUDAH
// disaring oleh preferensi "Atur Fitur". Akibatnya tiga tujuan terpenting
// aplikasi — Your Body, Clinical, For You — tampil sebagai "Panaceamed.id",
// karena entri katalognya disembunyikan. Pemakainya berpindah ke super-page
// lalu melihat nama merek, bukan nama tempat ia berada.
//
// Katalognya juga menyimpan label yang memang untuk menu, bukan untuk judul:
// "🏃 Fitness Hub (all)", "🩺 More clinical & AI tools". Emoji dan kurung
// internal itu hiasan menu; di bilah judul ia hanya memakan lebar yang sudah
// sempit lalu terpotong.
//
// Jadi urutannya: registri super-page dulu (satu-satunya sumber kanonis untuk
// nama super-page), lalu katalog yang terlihat, lalu katalog penuh supaya rute
// yang disembunyikan tetap punya nama, baru nama merek sebagai jalan terakhir.

import { SUPER_PAGES } from './superPages'
import { routePathOnly } from './productSpaces'

export const JUDUL_CADANGAN = 'Panaceamed.id'

export interface RuteBerjudul {
  to: string
  label: string
  end?: boolean
}

/**
 * Membuang hiasan menu dari sebuah label sehingga tersisa namanya saja.
 *
 * Hanya dua hal yang dibuang, dan keduanya hanya di tempat yang aman:
 * simbol/emoji di AWAL, dan satu kurung di AKHIR. Kurung di tengah kalimat
 * dan tanda baca yang memang bagian dari nama dibiarkan utuh.
 */
export function bersihkanJudul(label: string): string {
  const tanpaHiasanDepan = label.replace(/^[^\p{L}\p{N}]+/u, '')
  const tanpaKurungAkhir = tanpaHiasanDepan.replace(/\s*\([^()]*\)\s*$/u, '')
  const hasil = tanpaKurungAkhir.trim()
  // Label yang seluruhnya hiasan tidak boleh menghasilkan judul kosong.
  return hasil || label.trim()
}

/**
 * Nama halaman untuk sebuah lokasi.
 *
 * `cocok` adalah pencocokan rute milik Shell, diteruskan apa adanya supaya
 * berkas ini tidak menumbuhkan aturan pencocokan kedua yang bisa menyimpang.
 */
export function judulRute<T extends RuteBerjudul>(
  pathname: string,
  terlihat: readonly T[],
  semua: readonly T[],
  cocok: (rute: T, pathname: string) => boolean,
): string {
  const jalur = routePathOnly(pathname)

  // For You tinggal sebagai tab di beranda (`/?t=for-you`), jadi jalurnya '/'.
  // Mencocokkannya lewat jalur saja akan menamai beranda "For You". Registri
  // hanya boleh memberi nama super-page yang benar-benar punya rutenya sendiri.
  const superPage = SUPER_PAGES.find(
    (s) => routePathOnly(s.to) !== '/' && routePathOnly(s.to) === jalur,
  )
  if (superPage) return superPage.label

  const terpilih =
    terlihat.find((n) => cocok(n, pathname)) ?? semua.find((n) => cocok(n, pathname))
  return terpilih ? bersihkanJudul(terpilih.label) : JUDUL_CADANGAN
}
