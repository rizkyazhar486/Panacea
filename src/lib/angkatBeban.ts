// Catatan latihan beban: set, ulangan, dan beban — beserta apa yang boleh
// disimpulkan darinya.
//
// VOLUME BEBAN (set x ulangan x kg) adalah penjumlahan, bukan model. Ia benar
// apa adanya, dan itulah sebabnya ia dipakai sebagai angka utama di sini.
//
// PERKIRAAN 1RM adalah persamaan, dan persamaan punya batas. Epley (1985):
// 1RM = w x (1 + r/30). Ia dicocokkan pada ulangan RENDAH; di atas sepuluh
// ulangan sebaran antarorang melebar tajam dan angkanya menjadi tebakan.
// Karena itu hasil di atas sepuluh ulangan ditandai, bukan disembunyikan.

const KUNCI = 'pmd_beban_v1'

export interface SetAngkat {
  ulangan: number
  kg: number
}

export interface SesiAngkat {
  id: string
  tanggal: string
  gerakan: string
  set: SetAngkat[]
  catatan?: string
}

// Batas kewajaran masukan (bukan ambang klinis): menolak salah ketik dan data
// tersimpan yang rusak, bukan menilai kemampuan seseorang.
export const BATAS_ULANGAN = { min: 1, maks: 100 } as const
export const BATAS_KG = { minEksklusif: 0, maks: 1000 } as const
const PANJANG_GERAKAN_MAKS = 60

export function setSah(x: unknown): x is SetAngkat {
  if (!x || typeof x !== 'object') return false
  const { ulangan, kg } = x as Record<string, unknown>
  return typeof ulangan === 'number' && Number.isInteger(ulangan)
    && ulangan >= BATAS_ULANGAN.min && ulangan <= BATAS_ULANGAN.maks
    && typeof kg === 'number' && Number.isFinite(kg)
    && kg > BATAS_KG.minEksklusif && kg <= BATAS_KG.maks
}

/** Tanggal kalender nyata YYYY-MM-DD (bolak-balik, agar 2026-02-30 ditolak) dan tidak di masa depan. */
function tanggalSah(t: string, sekarang: number): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return false
  const ms = Date.parse(`${t}T00:00:00Z`)
  if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 10) !== t) return false
  return ms <= sekarang
}

/** Alasan penolakan sesi, atau null bila sah. `sekarang` disuntikkan agar deterministik. */
export function alasanSesiDitolak(s: SesiAngkat, sekarang: number): string | null {
  const g = typeof s.gerakan === 'string' ? s.gerakan.trim() : ''
  if (!g) return 'movement name is required'
  if (g.length > PANJANG_GERAKAN_MAKS) return `movement name must be at most ${PANJANG_GERAKAN_MAKS} characters`
  if (typeof s.tanggal !== 'string' || !tanggalSah(s.tanggal, sekarang)) return 'date must be a real date, not in the future'
  if (!Array.isArray(s.set) || s.set.length === 0) return 'at least one set is required'
  if (!s.set.every(setSah)) {
    return `every set needs whole reps ${BATAS_ULANGAN.min}–${BATAS_ULANGAN.maks} and a weight above 0 up to ${BATAS_KG.maks} kg`
  }
  return null
}

function aman(x: unknown): x is SesiAngkat {
  if (!x || typeof x !== 'object') return false
  const s = x as Record<string, unknown>
  return typeof s.id === 'string' && typeof s.tanggal === 'string' && typeof s.gerakan === 'string' && Array.isArray(s.set)
}

export function ambilSesi(): SesiAngkat[] {
  try {
    const raw = localStorage.getItem(KUNCI)
    const arr = raw ? JSON.parse(raw) : []
    // Set rusak (NaN/negatif/bukan angka dari penyimpanan lama) dibuang agar tidak meracuni volume dan rekor.
    return Array.isArray(arr)
      ? arr.filter(aman).map((x) => ({ ...x, set: x.set.filter(setSah) })).filter((x) => x.set.length > 0)
      : []
  } catch {
    return []
  }
}

export function simpanSesi(s: SesiAngkat, sekarang = Date.now()): SesiAngkat[] {
  // Fail-closed: sesi tak sah tidak ditulis; daftar tersimpan dikembalikan apa adanya.
  if (alasanSesiDitolak(s, sekarang)) return ambilSesi()
  const semua = [s, ...ambilSesi().filter((x) => x.id !== s.id)].slice(0, 500)
  try { localStorage.setItem(KUNCI, JSON.stringify(semua)) } catch { /* penuh: biarkan */ }
  return semua
}

export function hapusSesi(id: string): SesiAngkat[] {
  const semua = ambilSesi().filter((x) => x.id !== id)
  try { localStorage.setItem(KUNCI, JSON.stringify(semua)) } catch { /* biarkan */ }
  return semua
}

/** Volume beban satu sesi: penjumlahan set x ulangan x kg. */
export function volumeSesi(s: SesiAngkat): number {
  return s.set.reduce((a, x) => a + x.ulangan * x.kg, 0)
}

export interface Perkiraan1RM {
  kg: number
  dariKg: number
  dariUlangan: number
  /** true bila ulangannya di atas 10, tempat persamaan ini melemah. */
  raguh: boolean
}

export function epley(kg: number, ulangan: number): Perkiraan1RM | null {
  if (!(kg > 0 && ulangan > 0)) return null
  return { kg: kg * (1 + ulangan / 30), dariKg: kg, dariUlangan: ulangan, raguh: ulangan > 10 }
}

export interface RekorGerakan {
  gerakan: string
  terbaik1RM: Perkiraan1RM
  bebanTerberat: number
  sesi: number
  volumeTotal: number
  terakhir: string
}

export function rekorPerGerakan(semua: SesiAngkat[]): RekorGerakan[] {
  const peta = new Map<string, RekorGerakan>()
  for (const s of semua) {
    for (const st of s.set) {
      const e = epley(st.kg, st.ulangan)
      if (!e) continue
      const ada = peta.get(s.gerakan)
      if (!ada) {
        peta.set(s.gerakan, {
          gerakan: s.gerakan, terbaik1RM: e, bebanTerberat: st.kg,
          sesi: 1, volumeTotal: st.ulangan * st.kg, terakhir: s.tanggal,
        })
        continue
      }
      if (e.kg > ada.terbaik1RM.kg) ada.terbaik1RM = e
      if (st.kg > ada.bebanTerberat) ada.bebanTerberat = st.kg
      ada.volumeTotal += st.ulangan * st.kg
      if (s.tanggal > ada.terakhir) ada.terakhir = s.tanggal
    }
    const ada = peta.get(s.gerakan)
    if (ada) ada.sesi = semua.filter((x) => x.gerakan === s.gerakan).length
  }
  return [...peta.values()].sort((a, b) => b.terbaik1RM.kg - a.terbaik1RM.kg)
}

/** Volume per minggu, mundur dari hari ini. */
export function volumeMingguan(semua: SesiAngkat[], minggu = 8, sekarang = Date.now()): { mulai: string; volume: number }[] {
  const keluar: { mulai: string; volume: number }[] = []
  for (let i = minggu - 1; i >= 0; i--) {
    const akhir = sekarang - i * 7 * 864e5
    const awal = akhir - 7 * 864e5
    const volume = semua
      .filter((s) => {
        const t = Date.parse(s.tanggal)
        return t >= awal && t < akhir
      })
      .reduce((a, s) => a + volumeSesi(s), 0)
    keluar.push({ mulai: new Date(awal).toISOString().slice(0, 10), volume })
  }
  return keluar
}
