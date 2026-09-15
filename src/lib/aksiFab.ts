// Tindakan pada tombol melayang — dipilih sendiri, bukan ditebak.
//
// Menu ini adalah command dock global Panacea. Ia sengaja berisi TINDAKAN
// yang benar-benar dapat dijalankan dari halaman mana pun, bukan sekadar
// navigasi dekoratif. Pengguna dapat memilih kombinasi yang sesuai dengan
// hidupnya: belajar, latihan, uang, cerita hidup, tubuh, ibadah, atau klinis.

/**
 * ONE MOBILE NAVIGATION LAYER.
 *
 * Shell masih memiliki strip pintasan historis (`data-pintasan`) sementara
 * FabNavigasi sudah menjadi command dock global. Menampilkan keduanya sekaligus
 * membuat dua lapisan navigasi berebut ruang 390px yang sama dan memberi dua
 * jalan visual menuju tujuan serupa. Untuk stabilisasi cepat, sumber tindakan
 * FAB menjadi pemilik kebijakan ini dan menonaktifkan strip lama pada viewport
 * mobile. Rute, drawer, search, dan isi strip tidak dihapus; hanya presentasi
 * redundannya yang dihentikan. Claude/Astra dapat memindahkan aturan ini ke
 * stylesheet global saat finishing tanpa mengubah perilaku produk.
 */
if (typeof document !== 'undefined' && !document.getElementById('panacea-single-mobile-nav')) {
  const style = document.createElement('style')
  style.id = 'panacea-single-mobile-nav'
  style.textContent = '@media (max-width: 1023px){[data-pintasan]{display:none!important}}'
  document.head.appendChild(style)
}

export type JenisAksi = 'rute' | 'kembali' | 'atas' | 'tema' | 'cari'

export interface AksiFab {
  id: string
  label: string
  ikon: string
  jenis: JenisAksi
  /** Untuk jenis 'rute'. */
  ke?: string
}

export const KATALOG_AKSI: AksiFab[] = [
  { id: 'cari', label: 'Search', ikon: '⌕', jenis: 'cari' },
  { id: 'kembali', label: 'Back', ikon: '‹', jenis: 'kembali' },
  { id: 'beranda', label: 'Home', ikon: '⌂', jenis: 'rute', ke: '/' },
  { id: 'atas', label: 'To top', ikon: '↑', jenis: 'atas' },
  { id: 'tema', label: 'Light/dark', ikon: '◐', jenis: 'tema' },
  { id: 'semuaFitur', label: 'All features', ikon: '⊞', jenis: 'rute', ke: '/semua-fitur' },
  { id: 'pengaturan', label: 'Settings', ikon: '⚙', jenis: 'rute', ke: '/settings' },
  { id: 'catat', label: 'Log today', ikon: '✎', jenis: 'rute', ke: '/harian' },
  { id: 'rencana', label: 'Plan', ikon: '◫', jenis: 'rute', ke: '/planning' },
  { id: 'cerita', label: 'My story', ikon: '📖', jenis: 'rute', ke: '/my-story' },
  { id: 'uang', label: 'Money', ikon: '◉', jenis: 'rute', ke: '/keuangan' },
  { id: 'komunitas', label: 'People', ikon: '◌', jenis: 'rute', ke: '/community' },
  { id: 'tanya', label: 'Ask Panacea', ikon: '✦', jenis: 'rute', ke: '/chatbot' },
  { id: 'latihan', label: 'Training', ikon: '🏃', jenis: 'rute', ke: '/latihan' },
  { id: 'beban', label: 'Weightlifting', ikon: '🏋️', jenis: 'rute', ke: '/latihan-beban' },
  { id: 'analisis', label: 'Analysis', ikon: '📊', jenis: 'rute', ke: '/analisis-pro' },
  { id: 'tidur', label: 'Sleep', ikon: '🌙', jenis: 'rute', ke: '/pola-tidur' },
  { id: 'recovery', label: 'Recovery', ikon: '↺', jenis: 'rute', ke: '/recovery' },
  { id: 'gizi', label: 'Nutrition', ikon: '🥗', jenis: 'rute', ke: '/nutrition' },
  { id: 'tubuh', label: 'Body', ikon: '🫁', jenis: 'rute', ke: '/tubuh' },
  { id: 'atlas', label: '3D Body', ikon: '◎', jenis: 'rute', ke: '/body-explorer' },
  { id: 'ikhtisar', label: 'Overview', ikon: '📈', jenis: 'rute', ke: '/ikhtisar' },
  { id: 'belajar', label: 'Learn', ikon: '📚', jenis: 'rute', ke: '/med-study' },
  { id: 'osce', label: 'OSCE', ikon: '🩺', jenis: 'rute', ke: '/osce-ukmppd' },
  { id: 'obat', label: 'Treatment', ikon: '💊', jenis: 'rute', ke: '/med-study?bagian=therapy' },
  { id: 'penyakit', label: 'Diseases', ikon: '📖', jenis: 'rute', ke: '/med-study?bagian=diseases' },
  { id: 'kalkulator', label: 'Calculator', ikon: '🧮', jenis: 'rute', ke: '/clinical-calculators' },
  { id: 'sos', label: 'SOS', ikon: '✚', jenis: 'rute', ke: '/emergency' },
  { id: 'salat', label: 'Prayer', ikon: '🕌', jenis: 'rute', ke: '/prayer-times' },
  { id: 'apotek', label: 'Pharmacy', ikon: '🏪', jenis: 'rute', ke: '/pharmacy' },
  { id: 'rs', label: 'Hospital', ikon: '🏥', jenis: 'rute', ke: '/hospitals' },
]

export const SLOT_PER_HALAMAN = 8
export const MAKS_AKSI = 15
const KUNCI = 'pmd-aksi-fab-v1'
export const AKSI_BAWAAN = ['cari', 'kembali', 'beranda', 'catat', 'rencana', 'latihan', 'cerita', 'semuaFitur']

export function ambilAksi(): string[] {
  try {
    const arr = JSON.parse(localStorage.getItem(KUNCI) || 'null')
    if (!Array.isArray(arr)) return AKSI_BAWAAN
    const sah = arr.filter((id) => typeof id === 'string' && KATALOG_AKSI.some((a) => a.id === id))
    return sah.length ? sah.slice(0, MAKS_AKSI) : AKSI_BAWAAN
  } catch {
    return AKSI_BAWAAN
  }
}

function simpan(daftar: string[]): string[] {
  const potong = daftar.slice(0, MAKS_AKSI)
  try { localStorage.setItem(KUNCI, JSON.stringify(potong)) } catch { /* kuota */ }
  try { window.dispatchEvent(new Event('panacea:aksi-fab')) } catch { /* ignore */ }
  return potong
}

export function alihkanAksi(id: string): string[] {
  const kini = ambilAksi()
  if (kini.includes(id)) return simpan(kini.filter((x) => x !== id))
  const baru = [...kini, id]
  return simpan(baru.length > MAKS_AKSI ? baru.slice(baru.length - MAKS_AKSI) : baru)
}

export function kembalikanBawaan(): string[] {
  return simpan(AKSI_BAWAAN)
}
