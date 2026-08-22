// Tindakan pada tombol melayang — dipilih sendiri, bukan ditebak.
//
// Aturan yang sama seperti daftar pantauan: yang paling sering ditekan tidak
// selalu yang paling dibutuhkan. Seorang koas menjelang ujian ingin OSCE dan
// tatalaksana di sana; seorang pelari ingin catat latihan dan pace; seorang
// yang mengurus orang tuanya ingin obat dan darurat. Menebak berarti salah
// bagi sebagian besar dari mereka.
//
// LIMA SLOT, BUKAN ENAM. Menu lingkar punya enam tempat, dan satu di antaranya
// SELALU dipakai "Ubah" — pengaturan yang hanya dapat ditemukan lewat halaman
// pengaturan lain tidak akan pernah ditemukan orang yang paling membutuhkannya.
// Sisanya lima.
//
// Angka ini pernah salah: batasnya ditulis enam sementara menunya hanya
// menggambar lima, sehingga tindakan keenam yang dipilih orang tersimpan tetapi
// tidak pernah muncul. Ketahuan dari uji peramban, bukan dari kode.

export type JenisAksi = 'rute' | 'kembali' | 'atas' | 'tema'

export interface AksiFab {
  id: string
  label: string
  ikon: string
  jenis: JenisAksi
  /** Untuk jenis 'rute'. */
  ke?: string
}

export const KATALOG_AKSI: AksiFab[] = [
  { id: 'cari', label: 'Cari', ikon: '⌕', jenis: 'rute', ke: '/cari' },
  { id: 'kembali', label: 'Kembali', ikon: '‹', jenis: 'kembali' },
  { id: 'beranda', label: 'Beranda', ikon: '⌂', jenis: 'rute', ke: '/' },
  { id: 'atas', label: 'Ke atas', ikon: '↑', jenis: 'atas' },
  { id: 'catat', label: 'Catat', ikon: '✎', jenis: 'rute', ke: '/harian' },
  { id: 'sos', label: 'SOS', ikon: '✚', jenis: 'rute', ke: '/darurat' },
  { id: 'tema', label: 'Terang/gelap', ikon: '◐', jenis: 'tema' },
  { id: 'osce', label: 'OSCE', ikon: '🩺', jenis: 'rute', ke: '/osce-ukmppd' },
  { id: 'obat', label: 'Tatalaksana', ikon: '💊', jenis: 'rute', ke: '/med-study?bagian=therapy' },
  { id: 'penyakit', label: 'Penyakit', ikon: '📖', jenis: 'rute', ke: '/med-study?bagian=diseases' },
  { id: 'kalkulator', label: 'Kalkulator', ikon: '🧮', jenis: 'rute', ke: '/clinical-calculators' },
  { id: 'latihan', label: 'Latihan', ikon: '🏃', jenis: 'rute', ke: '/latihan' },
  { id: 'ikhtisar', label: 'Ikhtisar', ikon: '📈', jenis: 'rute', ke: '/ikhtisar' },
  { id: 'salat', label: 'Salat', ikon: '🕌', jenis: 'rute', ke: '/prayer-times' },
  { id: 'apotek', label: 'Apotek', ikon: '🏪', jenis: 'rute', ke: '/pharmacy' },
  { id: 'rs', label: 'Rumah sakit', ikon: '🏥', jenis: 'rute', ke: '/hospitals' },
]

export const MAKS_AKSI = 5
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
 * Bila sudah enam dan yang baru dinyalakan, yang PALING LAMA dipilih yang
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
