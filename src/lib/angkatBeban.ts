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

function aman(x: unknown): x is SesiAngkat {
  if (!x || typeof x !== 'object') return false
  const s = x as Record<string, unknown>
  return typeof s.id === 'string' && typeof s.tanggal === 'string' && typeof s.gerakan === 'string' && Array.isArray(s.set)
}

export function ambilSesi(): SesiAngkat[] {
  try {
    const raw = localStorage.getItem(KUNCI)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter(aman) : []
  } catch {
    return []
  }
}

export function simpanSesi(s: SesiAngkat): SesiAngkat[] {
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
