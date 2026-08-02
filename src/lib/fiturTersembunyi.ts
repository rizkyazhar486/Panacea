// ─────────────────────────────────────────────────────────────────────────────
// Menyembunyikan fitur.
//
// Aplikasi ini punya lebih dari seratus tujuh puluh rute. Tidak ada seorang pun
// yang memakai semuanya, dan daftar panjang membuat yang benar-benar dipakai
// jadi sulit ditemukan. Jadi pengguna boleh menyembunyikan apa yang tidak ia
// pakai.
//
// Tiga aturan yang menjaga ini tetap aman:
//
//   1. MENYEMBUNYIKAN, BUKAN MENGHAPUS. Rutenya tetap hidup. Tautan lama,
//      penanda halaman, dan tautan dari halaman lain tetap bekerja — yang
//      hilang hanya kehadirannya di menu dan di hub.
//   2. ADA YANG TIDAK BISA DISEMBUNYIKAN. Beranda, Profil, Pengaturan dan
//      Kartu Darurat selalu ada. Menyembunyikan jalan keluar dari layar
//      pengaturan akan mengunci pengguna dari pengaturannya sendiri, dan
//      menyembunyikan tombol darurat adalah hal yang tidak pantas dilakukan
//      aplikasi kesehatan.
//   3. SELALU BISA DIKEMBALIKAN, dari satu tempat, tanpa perlu mengingat apa
//      yang dulu disembunyikan.
// ─────────────────────────────────────────────────────────────────────────────

const KUNCI = 'pmd-fitur-tersembunyi'

/** Rute yang tidak pernah boleh hilang dari navigasi. */
export const TIDAK_BISA_DISEMBUNYIKAN: readonly string[] = [
  '/',            // beranda
  '/profile',     // profil
  '/settings',    // jalan untuk mengembalikan yang disembunyikan
  '/emergency',   // kartu darurat & SOS
  '/atur-fitur',  // layar pengaturan fitur itu sendiri
]

export function bolehDisembunyikan(rute: string): boolean {
  return !TIDAK_BISA_DISEMBUNYIKAN.includes(rute)
}

export function ambilTersembunyi(): string[] {
  try {
    const raw = localStorage.getItem(KUNCI)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr.filter((x): x is string => typeof x === 'string' && bolehDisembunyikan(x))
  } catch {
    return []
  }
}

export function simpanTersembunyi(rute: string[]): void {
  const bersih = [...new Set(rute.filter(bolehDisembunyikan))]
  try { localStorage.setItem(KUNCI, JSON.stringify(bersih)) } catch { /* kuota penuh */ }
  try { window.dispatchEvent(new Event('panacea:fitur')) } catch { /* ignore */ }
}

export function alihkanFitur(rute: string): string[] {
  if (!bolehDisembunyikan(rute)) return ambilTersembunyi()
  const kini = ambilTersembunyi()
  const next = kini.includes(rute) ? kini.filter((x) => x !== rute) : [...kini, rute]
  simpanTersembunyi(next)
  return next
}

export function tampilkanSemua(): void {
  simpanTersembunyi([])
}

/** Saring daftar apa pun yang punya properti `to`. */
export function saring<T extends { to: string }>(items: T[], tersembunyi: string[]): T[] {
  if (!tersembunyi.length) return items
  const set = new Set(tersembunyi)
  return items.filter((i) => !set.has(i.to))
}

/** Hook sederhana tanpa dependensi: baca sekali, lalu ikuti siarannya. */
export function langgananFitur(cb: (tersembunyi: string[]) => void): () => void {
  const on = () => cb(ambilTersembunyi())
  window.addEventListener('panacea:fitur', on)
  window.addEventListener('storage', on)
  return () => {
    window.removeEventListener('panacea:fitur', on)
    window.removeEventListener('storage', on)
  }
}
