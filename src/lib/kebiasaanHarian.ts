// Dua catatan kecil yang belum punya tempat: suplemen dan paparan panas/dingin.
//
// SUPLEMEN DICATAT TANPA SATU PUN KLAIM. Daftarnya ditulis sendiri oleh
// pemakainya, dan aplikasi ini tidak menganjurkan, menilai, atau menyusun
// "protokol" apa pun — yang dikerjakannya hanya mengingat apakah yang sudah
// diputuskan orang itu sudah diminum hari ini. Anjuran memulai suplemen adalah
// urusan dokter yang melihat hasil labnya, bukan urusan kotak centang.
//
// PANAS DAN DINGIN DICATAT SEBAGAI KEGIATAN, BUKAN SEBAGAI TERAPI. Yang
// disimpan lamanya dan tanggalnya. Bukti pada manusia untuk sauna paling kuat
// pada penelitian pengamatan (mis. kohor Finlandia), dan untuk rendaman dingin
// masih kecil dan bertentangan — karena itu widgetnya hanya menghitung, tidak
// menjanjikan.

export interface Suplemen {
  id: string
  nama: string
  /** 'pagi' | 'siang' | 'malam' — hanya untuk mengelompokkan pengingat. */
  waktu: 'pagi' | 'siang' | 'malam'
}

export interface SesiSuhu {
  id: string
  /** yyyy-mm-dd */
  tanggal: string
  jenis: 'panas' | 'dingin'
  menit: number
}

const KUNCI_SUP = 'pmd_suplemen_v1'
const KUNCI_MINUM = 'pmd_suplemen_minum_v1'
const KUNCI_SUHU = 'pmd_suhu_sesi_v1'

function baca<T>(kunci: string, bawaan: T): T {
  try {
    const v = JSON.parse(localStorage.getItem(kunci) || 'null')
    return v == null ? bawaan : (v as T)
  } catch { return bawaan }
}
function tulis(kunci: string, v: unknown, peristiwa: string) {
  try { localStorage.setItem(kunci, JSON.stringify(v)) } catch { /* kuota */ }
  try { window.dispatchEvent(new Event(peristiwa)) } catch { /* ignore */ }
}

export function tanggalHariIni(d = new Date()): string {
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// ── Suplemen ───────────────────────────────────────────────────────────────
export function ambilSuplemen(): Suplemen[] {
  const v = baca<Suplemen[]>(KUNCI_SUP, [])
  return Array.isArray(v) ? v.filter((s) => s && typeof s.nama === 'string').slice(0, 30) : []
}

export function tambahSuplemen(nama: string, waktu: Suplemen['waktu']): void {
  const bersih = nama.trim().slice(0, 40)
  if (!bersih) return
  tulis(KUNCI_SUP, [...ambilSuplemen(), { id: `s${Date.now()}`, nama: bersih, waktu }], 'panacea:suplemen')
}

export function hapusSuplemen(id: string): void {
  tulis(KUNCI_SUP, ambilSuplemen().filter((s) => s.id !== id), 'panacea:suplemen')
}

/** Id suplemen yang sudah ditandai diminum hari ini. */
export function sudahDiminum(): string[] {
  const v = baca<{ tanggal: string; id: string[] }>(KUNCI_MINUM, { tanggal: '', id: [] })
  return v.tanggal === tanggalHariIni() && Array.isArray(v.id) ? v.id : []
}

export function alihkanMinum(id: string): string[] {
  const kini = sudahDiminum()
  const next = kini.includes(id) ? kini.filter((x) => x !== id) : [...kini, id]
  tulis(KUNCI_MINUM, { tanggal: tanggalHariIni(), id: next }, 'panacea:suplemen')
  return next
}

// ── Sesi panas / dingin ────────────────────────────────────────────────────
export function ambilSesiSuhu(): SesiSuhu[] {
  const v = baca<SesiSuhu[]>(KUNCI_SUHU, [])
  return Array.isArray(v) ? v.filter((s) => s && typeof s.tanggal === 'string').slice(-200) : []
}

export function catatSesiSuhu(jenis: SesiSuhu['jenis'], menit: number): void {
  const m = Math.max(1, Math.min(120, Math.round(menit)))
  tulis(KUNCI_SUHU, [...ambilSesiSuhu(), { id: `h${Date.now()}`, tanggal: tanggalHariIni(), jenis, menit: m }], 'panacea:suhu-sesi')
}

/** Berapa hari sejak sesi terakhir jenis tertentu; null bila belum pernah. */
export function hariSejak(jenis: SesiSuhu['jenis']): number | null {
  const daftar = ambilSesiSuhu().filter((s) => s.jenis === jenis)
  if (!daftar.length) return null
  const akhir = daftar[daftar.length - 1]
  const t = Date.parse(`${akhir.tanggal}T00:00:00`)
  if (Number.isNaN(t)) return null
  return Math.floor((Date.now() - t) / 864e5)
}
