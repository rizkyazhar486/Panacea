import type { Salat } from './adzan'

// ─────────────────────────────────────────────────────────────────────────────
// Catatan salat yang sudah ditunaikan — bukan pengganti niat, hanya penanda.
//
// Disimpan per TANGGAL LOKAL, bukan per hari-UTC atau per timestamp mentah.
// Seseorang yang menandai Isya jam 23 lewat, lalu membuka aplikasi lagi jam 1
// dini hari, harus tetap melihat Isya tertandai untuk HARI YANG SAMA — bukan
// hilang karena harinya sudah berganti di UTC padahal belum berganti baginya.
//
// Tidak ada yang dihitung mundur ke belakang: menandai hari ini tidak menyusun
// ulang riwayat hari kemarin, dan streak (bila nanti ditambahkan) harus
// dihitung dari catatan yang benar-benar ada, bukan diasumsikan.
// ─────────────────────────────────────────────────────────────────────────────

const KUNCI = 'pmd_catatan_salat_v1'

interface Catatan {
  [tanggal: string]: Salat[]
}

function baca(): Catatan {
  try {
    const v = JSON.parse(localStorage.getItem(KUNCI) || '{}')
    return v && typeof v === 'object' ? v : {}
  } catch { return {} }
}

function simpan(c: Catatan) {
  try { localStorage.setItem(KUNCI, JSON.stringify(c)) } catch { /* kuota */ }
}

/** Tanggal lokal `YYYY-MM-DD`, bukan `toISOString()` yang memotong ke UTC. */
export function tanggalLokal(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function sudahDicatat(tanggal: string, salat: Salat): boolean {
  return baca()[tanggal]?.includes(salat) ?? false
}

export function catatSelesai(tanggal: string, salat: Salat): void {
  const c = baca()
  const hari = c[tanggal] ?? []
  if (!hari.includes(salat)) simpan({ ...c, [tanggal]: [...hari, salat] })
}

/** Kebalikan `catatSelesai` — menekan terlalu jauh harus bisa dibatalkan. */
export function batalkanCatatan(tanggal: string, salat: Salat): void {
  const c = baca()
  const hari = c[tanggal]
  if (!hari?.includes(salat)) return
  simpan({ ...c, [tanggal]: hari.filter((s) => s !== salat) })
}

export function jumlahHariIni(tanggal: string): number {
  return baca()[tanggal]?.length ?? 0
}
