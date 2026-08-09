import { useEffect, useState } from 'react'

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

const PERISTIWA = 'panacea:tujuan'

export function simpanTujuan(t: Tujuan): void {
  try {
    localStorage.setItem(KUNCI, t)
  } catch {
    /* mode penyamaran atau penyimpanan penuh — tidak perlu menggagalkan apa pun */
  }
  // Diumumkan supaya halaman lain yang sedang terpasang ikut berubah. Peristiwa
  // 'storage' bawaan peramban TIDAK menyala di tab yang menulisnya sendiri,
  // jadi mengandalkannya saja berarti halaman lain baru menyesuaikan diri
  // setelah dimuat ulang.
  try {
    window.dispatchEvent(new CustomEvent(PERISTIWA, { detail: t }))
  } catch {
    /* lingkungan tanpa DOM */
  }
}

/**
 * Tujuan pakai yang selalu mengikuti perubahan, dari tab ini maupun tab lain.
 *
 * Dipakai halaman-halaman yang bahasanya harus menyesuaikan pembacanya —
 * istilah ujian bagi yang sedang belajar, bahasa sehari-hari bagi yang tidak.
 */
export function useTujuan(): Tujuan | null {
  const [t, setT] = useState<Tujuan | null>(() => ambilTujuan())
  useEffect(() => {
    const segarkan = () => setT(ambilTujuan())
    window.addEventListener(PERISTIWA, segarkan)
    window.addEventListener('storage', segarkan)
    return () => {
      window.removeEventListener(PERISTIWA, segarkan)
      window.removeEventListener('storage', segarkan)
    }
  }, [])
  return t
}

/**
 * Benar bila pembacanya BUKAN orang yang sedang belajar kedokteran.
 *
 * Hanya 'sehat' yang dianggap awam. 'keduanya' diperlakukan sebagai pembelajar,
 * karena orang yang menyatakan ikut belajar kedokteran memang membutuhkan
 * istilah ujiannya — SKDI dan level kompetensi adalah bahasa yang diujikan
 * kepadanya, bukan jargon yang bisa diganti.
 *
 * Selama belum dijawab hasilnya `false`, yaitu tampilan lengkap dengan istilah
 * aslinya. Itu disengaja: menyembunyikan istilah dari mahasiswa merugikan
 * belajarnya, sedangkan menampilkan istilah kepada orang awam hanya membuatnya
 * bertanya — dan pertanyaan tujuan pakai ada di beranda untuk dijawab.
 */
export function modeAwam(t: Tujuan | null): boolean {
  return t === 'sehat'
}
