// ─────────────────────────────────────────────────────────────────────────────
// Mesin perubahan — bagian yang membuat membaca berubah menjadi berbuat.
//
// Aplikasi ini sudah punya tiga belas topik edukasi. Membaca tiga belas topik
// tidak mengubah hidup siapa pun; ia hanya membuat orang merasa sudah berubah.
// Yang benar-benar mengubah perilaku, menurut bukti yang paling bisa
// dipertanggungjawabkan, adalah lima hal yang membosankan:
//
//   1. SATU sasaran, bukan tujuh. Perhatian adalah sumber daya yang habis, dan
//      orang yang mengejar banyak perubahan sekaligus menyelesaikan lebih
//      sedikit daripada yang mengejar satu.
//   2. NIAT PELAKSANAAN — kapan, di mana, bagaimana. Menentukannya lebih dulu
//      memindahkan keputusan keluar dari saat orang lelah dan sedang menawar
//      dengan dirinya sendiri. Ini temuan yang paling kokoh di bidangnya,
//      meski besarannya sedang saja.
//   3. VERSI MINIMUM yang tetap dijalankan di hari terburuk. Program yang
//      hanya punya bentuk penuh akan berhenti sepenuhnya pada pekan pertama
//      yang kacau, dan berhenti itulah yang mahal.
//   4. UKURAN YANG BISA MENJAWAB "TIDAK". Sasaran yang dinilai setelah
//      kejadian selalu dinilai berhasil, karena selalu ada angka yang naik.
//   5. TINJAUAN BERKALA yang menanyakan hal tidak nyaman.
//
// YANG SENGAJA TIDAK DIBANGUN, dan ini keputusan tetap:
//
//   * Tidak ada runtutan hari (streak) yang menghukum. Runtutan mengubah satu
//     hari terlewat menjadi kegagalan identitas, dan pola itulah yang membuat
//     orang berhenti sama sekali alih-alih melanjutkan.
//   * Tidak ada hadiah acak, lencana, atau papan peringkat. Semuanya bekerja
//     dengan memindahkan motivasi dari dalam ke luar, dan motivasi yang
//     digerakkan dari luar runtuh begitu hadiahnya berhenti.
//   * Tidak ada nada menghakimi pada pekan yang terlewat. Pekan terlewat
//     adalah data.
// ─────────────────────────────────────────────────────────────────────────────

const KUNCI = 'pmd-perubahan-v1'

export type Wilayah = 'physical' | 'mind' | 'work' | 'relationships' | 'finance'

export interface Komitmen {
  /** Satu kalimat: apa yang berubah bila ini berhasil. */
  sasaran: string
  wilayah: Wilayah
  /** Ukuran yang bisa menjawab "tidak". */
  ukuran: string
  /** Apa yang akan MEMBUKTIKAN ini gagal. Ditulis sebelum mulai. */
  pembatal: string
  /** Kapan, di mana, sesudah apa. */
  kapan: string
  dimana: string
  /** Versi terkecil yang tetap dijalankan di hari terburuk. */
  minimum: string
  /** Apa yang dilakukan setelah satu pekan terlewat. */
  rencanaPulih: string
  mulaiPada: string
  pekanTotal: number
}

export interface Tinjauan {
  pekan: number
  pada: string
  /** Berapa hari versi minimum benar-benar terjadi. */
  hariMinimum: number
  /** Bergerak, diam, atau mundur. */
  arah: 'maju' | 'diam' | 'mundur'
  /** Halangan terbesar pekan ini, ditulis pengguna. */
  halangan: string
  /** Satu perubahan untuk pekan depan. */
  penyesuaian: string
}

export interface Keadaan {
  komitmen?: Komitmen
  tinjauan: Tinjauan[]
  /** Riwayat komitmen yang sudah selesai atau dihentikan. */
  arsip: { komitmen: Komitmen; tinjauan: Tinjauan[]; selesaiPada: string; hasil: string }[]
}

const KOSONG: Keadaan = { tinjauan: [], arsip: [] }

export function muat(): Keadaan {
  try {
    const raw = localStorage.getItem(KUNCI)
    if (!raw) return { ...KOSONG }
    const d = JSON.parse(raw) as Partial<Keadaan>
    return {
      komitmen: d.komitmen,
      tinjauan: Array.isArray(d.tinjauan) ? d.tinjauan : [],
      arsip: Array.isArray(d.arsip) ? d.arsip : [],
    }
  } catch { return { ...KOSONG } }
}

export function simpan(k: Keadaan): void {
  try { localStorage.setItem(KUNCI, JSON.stringify(k)) } catch { /* kuota penuh */ }
}

/** Pekan keberapa sekarang, 1-berbasis. 0 bila belum mulai. */
export function pekanBerjalan(k: Komitmen, sekarang = Date.now()): number {
  const mulai = Date.parse(k.mulaiPada)
  if (Number.isNaN(mulai) || sekarang < mulai) return 0
  return Math.floor((sekarang - mulai) / (7 * 86400_000)) + 1
}

export function tinjauanJatuhTempo(s: Keadaan, sekarang = Date.now()): number | null {
  if (!s.komitmen) return null
  const pekan = pekanBerjalan(s.komitmen, sekarang)
  if (pekan < 1 || pekan > s.komitmen.pekanTotal) return null
  // Pekan berjalan baru bisa ditinjau setelah ia lewat, kecuali pekan terakhir.
  const terakhirDitinjau = s.tinjauan.reduce((a, t) => Math.max(a, t.pekan), 0)
  return pekan - 1 > terakhirDitinjau ? pekan - 1 : null
}

export interface Ringkasan {
  pekan: number
  total: number
  ditinjau: number
  rerataHariMinimum: number
  /** Berapa banyak pekan yang bergerak maju. */
  pekanMaju: number
  /**
   * Putusan jujur, dan sengaja bisa berbunyi "tidak".
   *
   * Ambangnya tidak diambil dari penelitian mana pun — tidak ada penelitian
   * yang memberi ambang untuk ini — melainkan dari satu prinsip: sebuah sistem
   * yang tidak pernah bisa mengatakan "ini tidak berjalan" tidak berguna untuk
   * mengambil keputusan.
   */
  putusan: 'terlalu-awal' | 'berjalan' | 'goyah' | 'tidak-berjalan'
  alasan: string
}

export function ringkas(s: Keadaan, sekarang = Date.now()): Ringkasan | null {
  const k = s.komitmen
  if (!k) return null
  const pekan = pekanBerjalan(k, sekarang)
  const t = s.tinjauan
  const rerata = t.length ? t.reduce((a, x) => a + x.hariMinimum, 0) / t.length : 0
  const maju = t.filter((x) => x.arah === 'maju').length

  let putusan: Ringkasan['putusan'] = 'terlalu-awal'
  let alasan = 'Too early to judge. Give it at least three weeks before deciding anything.'

  if (t.length >= 3) {
    if (rerata < 2) {
      putusan = 'tidak-berjalan'
      alasan = 'The minimum version is not happening. That is a design problem, not a discipline problem — make it smaller or move it to a different time.'
    } else if (maju === 0) {
      putusan = 'tidak-berjalan'
      alasan = 'You are showing up but nothing is moving. Either the stimulus is too small, or the measure is not sensitive enough to see what changed.'
    } else if (rerata < 4 || maju < t.length / 2) {
      putusan = 'goyah'
      alasan = 'Partly working. Before adding anything, find the week that went worst and fix what caused it.'
    } else {
      putusan = 'berjalan'
      alasan = 'Working. Change nothing yet — the most common way to break something that works is to improve it too early.'
    }
  }
  return { pekan, total: k.pekanTotal, ditinjau: t.length, rerataHariMinimum: Math.round(rerata * 10) / 10, pekanMaju: maju, putusan, alasan }
}

export const WILAYAH: { id: Wilayah; label: string; ikon: string; contoh: string }[] = [
  { id: 'physical', label: 'Body', ikon: '🏃', contoh: 'Run 5 km without stopping' },
  { id: 'mind', label: 'Mind', ikon: '🧠', contoh: 'Read 20 pages on most days' },
  { id: 'work', label: 'Work', ikon: '🛠️', contoh: 'Ship one thing every week' },
  { id: 'relationships', label: 'People', ikon: '🤝', contoh: 'One real conversation each week' },
  { id: 'finance', label: 'Money', ikon: '💰', contoh: 'Save a fixed amount before spending' },
]
