/**
 * Untuk apa orang ini memakai aplikasinya.
 *
 * DIPISAHKAN DARI PERAN AKUN, dan itu bukan kerapian belaka — peran tidak bisa
 * menjawab pertanyaan ini. Peran "Doctor" mensyaratkan nomor STR, sedangkan
 * mahasiswa kedokteran belum punya STR, sehingga mereka mendaftar sebagai
 * "pasien". Menyusun beranda dari peran berarti separuh pemakai yang justru
 * datang untuk isi klinis mendapat susunan orang awam.
 *
 * Karena itu pilihannya ditanyakan, bukan ditebak. Satu ketukan, bisa diubah
 * kapan saja, dan apa pun jawabannya tidak ada bagian yang disembunyikan —
 * yang berubah hanya urutannya.
 */

const KUNCI = 'panacea_tujuan_v1'

export type Tujuan = 'belajar' | 'sehat' | 'keduanya'

export const PILIHAN_TUJUAN: { id: Tujuan; ikon: string; judul: string; isi: string }[] = [
  { id: 'belajar', ikon: '🧠', judul: 'Belajar kedokteran', isi: 'Mahasiswa, koas, dokter' },
  { id: 'sehat', ikon: '🏃', judul: 'Menjaga kesehatan', isi: 'Untuk badan saya sendiri' },
  { id: 'keduanya', ikon: '⚖️', judul: 'Keduanya', isi: 'Belajar sekaligus menjaga badan' },
]

/**
 * `null` berarti belum menjawab — dan itu keadaan yang berarti, bukan sekadar
 * ketiadaan nilai: selama masih null beranda menampilkan pertanyaannya. Ia
 * tidak boleh diam-diam diganti dengan nilai bawaan, karena tebakan yang salah
 * tidak akan pernah dikoreksi oleh pemakainya.
 */
export function ambilTujuan(): Tujuan | null {
  try {
    const v = localStorage.getItem(KUNCI)
    return v === 'belajar' || v === 'sehat' || v === 'keduanya' ? v : null
  } catch {
    return null
  }
}

export function simpanTujuan(t: Tujuan): void {
  try {
    localStorage.setItem(KUNCI, t)
  } catch {
    /* mode penyamaran atau penyimpanan penuh — tidak perlu menggagalkan apa pun */
  }
}
