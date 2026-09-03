// Tindakan pada tombol melayang — dipilih sendiri, bukan ditebak.
//
// Aturan yang sama seperti daftar pantauan: yang paling sering ditekan tidak
// selalu yang paling dibutuhkan. Seorang koas menjelang ujian ingin OSCE dan
// tatalaksana di sana; seorang pelari ingin catat latihan dan pace; seorang
// yang mengurus orang tuanya ingin obat dan darurat. Menebak berarti salah
// bagi sebagian besar dari mereka.
//
// LIMA BELAS SLOT DI ATAS DUA HALAMAN. Menunya bukan lagi satu kisi tunggal:
// satu halaman memuat delapan tempat (kisi 3x3 dengan tengah dibiarkan kosong),
// dan halaman kedua digeser mendatar seperti pada layar utama ponsel. Slot
// terakhir SELALU "Ubah", jadi 15 + 1 = 16 = dua halaman penuh.
//
// MENGAPA BUKAN LIMA. Bentuk pertama hanya menyediakan lima tempat, dan lima
// terlalu sedikit untuk orang yang memakai aplikasi ini dengan dua kepala
// sekaligus — koas menjelang ujian DAN pelari. Tombol bantu pada ponsel pun
// tidak berhenti di lima.
//
// Angka ini pernah salah: batasnya ditulis enam sementara menunya hanya
// menggambar lima, sehingga tindakan keenam yang dipilih orang tersimpan tetapi
// tidak pernah muncul. Ketahuan dari uji peramban, bukan dari kode. Karena itu
// SLOT_PER_HALAMAN ada di berkas ini, bukan ditulis ulang di komponennya.

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
  { id: 'catat', label: 'Log', ikon: '✎', jenis: 'rute', ke: '/harian' },
  { id: 'sos', label: 'SOS', ikon: '✚', jenis: 'rute', ke: '/emergency' },
  { id: 'tema', label: 'Light/dark', ikon: '◐', jenis: 'tema' },
  { id: 'osce', label: 'OSCE', ikon: '🩺', jenis: 'rute', ke: '/osce-ukmppd' },
  { id: 'obat', label: 'Treatment', ikon: '💊', jenis: 'rute', ke: '/med-study?bagian=therapy' },
  { id: 'penyakit', label: 'Diseases', ikon: '📖', jenis: 'rute', ke: '/med-study?bagian=diseases' },
  { id: 'kalkulator', label: 'Calculator', ikon: '🧮', jenis: 'rute', ke: '/clinical-calculators' },
  { id: 'latihan', label: 'Training', ikon: '🏃', jenis: 'rute', ke: '/latihan' },
  { id: 'ikhtisar', label: 'Overview', ikon: '📈', jenis: 'rute', ke: '/ikhtisar' },
  { id: 'salat', label: 'Prayer', ikon: '🕌', jenis: 'rute', ke: '/prayer-times' },
  { id: 'apotek', label: 'Pharmacy', ikon: '🏪', jenis: 'rute', ke: '/pharmacy' },
  { id: 'rs', label: 'Hospital', ikon: '🏥', jenis: 'rute', ke: '/hospitals' },
  { id: 'gizi', label: 'Nutrition', ikon: '🥗', jenis: 'rute', ke: '/nutrition' },
  { id: 'tidur', label: 'Sleep', ikon: '🌙', jenis: 'rute', ke: '/pola-tidur' },
  { id: 'tubuh', label: 'Body', ikon: '🫁', jenis: 'rute', ke: '/tubuh' },
  { id: 'beban', label: 'Weightlifting', ikon: '🏋️', jenis: 'rute', ke: '/latihan-beban' },
  { id: 'analisis', label: 'Analysis', ikon: '📊', jenis: 'rute', ke: '/analisis-pro' },
  { id: 'semuaFitur', label: 'All features', ikon: '⊞', jenis: 'rute', ke: '/semua-fitur' },
  { id: 'pengaturan', label: 'Settings', ikon: '⚙', jenis: 'rute', ke: '/settings' },
]

/** Tempat per halaman menu: kisi 3x3 dikurangi tengahnya yang dibiarkan kosong. */
export const SLOT_PER_HALAMAN = 8

export const MAKS_AKSI = 15
const KUNCI = 'pmd-aksi-fab-v1'

/** Bawaannya sengaja tindakan umum, bukan fitur khusus profesi mana pun. */
export const AKSI_BAWAAN = ['cari', 'kembali', 'beranda', 'catat', 'sos']

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

/**
 * Menyalakan/mematikan satu tindakan.
 *
 * Bila sudah penuh dan yang baru dinyalakan, yang PALING LAMA dipilih yang
 * dibuang — bukan permintaannya yang ditolak. Menolak dengan pesan "sudah
 * penuh" memaksa orang mematikan sesuatu dahulu, dan itu dua langkah untuk
 * pekerjaan yang jelas maksudnya.
 */
export function alihkanAksi(id: string): string[] {
  const kini = ambilAksi()
  if (kini.includes(id)) return simpan(kini.filter((x) => x !== id))
  const baru = [...kini, id]
  return simpan(baru.length > MAKS_AKSI ? baru.slice(baru.length - MAKS_AKSI) : baru)
}

export function kembalikanBawaan(): string[] {
  return simpan(AKSI_BAWAAN)
}
