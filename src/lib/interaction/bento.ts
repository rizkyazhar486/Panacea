// Ukuran ubin bento dibaca dari isinya.
//
// Tinggal di sini, bukan di dalam komponennya, karena komponen Beranda mengimpor
// stylesheet dan karena itu tidak dapat dimuat oleh gerbang Node. Aturan yang
// tidak dapat diuji akan berubah menjadi selera pada revisi berikutnya.

export type BentoSpan = 'lead' | 'wide' | 'unit'

/**
 * Menentukan lebar ubin dari PANGSA isinya terhadap seluruh katalog yang
 * sedang ditampilkan.
 *
 * Dipakai pangsa, bukan ambang jumlah tetap: begitu pencarian mempersempit
 * daftar menjadi dua belas hasil, "lebih dari tiga puluh" tidak lagi berarti
 * "besar" — tidak akan ada satu pun ubin yang besar, dan bentonya runtuh
 * menjadi deretan kotak seragam yang tidak memberi tahu apa pun.
 */
export function bentoSpan(count: number, total: number): BentoSpan {
  if (total <= 0) return 'unit'
  const share = count / total
  if (share >= 0.3) return 'lead'
  if (share >= 0.15) return 'wide'
  return 'unit'
}
