// ─────────────────────────────────────────────────────────────────────────────
// Tanggal ujian, dan pilihan kasus untuk hari ini.
//
// SATU ANGKA YANG BOLEH MENAKUTKAN. Sisa hari menuju ujian adalah satu-satunya
// angka di beranda yang tidak dilunakkan. Selebihnya aplikasi ini menolak
// menghakimi, tetapi tanggal ujian bukan penilaian melainkan kenyataan, dan
// menyembunyikannya tidak membuat ujiannya mundur.
//
// PEMILIHAN KASUS BERPUTAR, BUKAN ACAK. Kasus hari ini ditentukan dari nomor
// hari, sehingga: dibuka dua kali dalam sehari memberi kasus yang sama (kalau
// berubah, orang akan menekan muat ulang sampai mendapat yang mudah), dan
// seluruh daftar pasti terlewati tanpa ada yang tertinggal. Acak tidak menjamin
// keduanya.
//
// TIDAK ADA HUKUMAN DAN TIDAK ADA PENGHITUNG "TERLEWAT". Hari yang tidak dibuka
// tidak dicatat sebagai kegagalan; yang dihitung hanya hari yang dipakai.
// ─────────────────────────────────────────────────────────────────────────────

const KUNCI_TANGGAL = 'pmd_tanggal_ujian_v1'

/** Tanggal ujian tersimpan, atau null bila belum pernah diisi. */
export function ambilTanggalUjian(): string | null {
  try {
    const v = localStorage.getItem(KUNCI_TANGGAL)
    return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null
  } catch { return null }
}

export function simpanTanggalUjian(iso: string | null): void {
  try {
    if (iso) localStorage.setItem(KUNCI_TANGGAL, iso)
    else localStorage.removeItem(KUNCI_TANGGAL)
  } catch { /* penyimpanan penuh atau ditolak — abaikan */ }
}

/**
 * Sisa hari menuju tanggal ujian.
 *
 * Dihitung pada TENGAH MALAM setempat kedua tanggal, bukan selisih milidetik
 * dibagi 86.400.000. Selisih milidetik salah menghitung di seputar pergantian
 * waktu musim panas dan pada jam berapa pun selain tengah malam: ujian besok
 * pagi terbaca "0 hari lagi" bila sekarang sudah lewat pukul yang sama.
 */
export function sisaHari(iso: string, sekarang: Date = new Date()): number {
  const [th, bl, hr] = iso.split('-').map(Number)
  const target = new Date(th, bl - 1, hr).getTime()
  const kini = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate()).getTime()
  return Math.round((target - kini) / 86_400_000)
}

/** Nomor hari sejak epoch pada waktu setempat — dasar perputaran harian. */
export function nomorHari(sekarang: Date = new Date()): number {
  const t = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate()).getTime()
  return Math.floor(t / 86_400_000)
}

/**
 * Ambil `jumlah` butir dari `daftar` untuk hari ini, berputar tanpa mengulang
 * sampai seluruh daftar habis terlewati.
 */
export function jatahHariIni<T>(daftar: readonly T[], jumlah: number, sekarang: Date = new Date()): T[] {
  if (daftar.length === 0) return []
  const n = Math.min(jumlah, daftar.length)
  const mulai = (nomorHari(sekarang) * n) % daftar.length
  return Array.from({ length: n }, (_, i) => daftar[(mulai + i) % daftar.length])
}
