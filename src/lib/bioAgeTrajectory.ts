// Trajektori usia biologis (PhenoAge) — docs/LONGEVITY_FIRST_MASTER_DIRECTIVE.md §9.
//
// Nilai produk usia biologis bukan satu angka, melainkan ARAHNYA. Satu
// PhenoAge adalah potret; dua atau lebih pada tanggal pengambilan darah yang
// berbeda menunjukkan apakah jarak terhadap usia sebenarnya melebar atau
// menyempit.
//
//   AgeGap   = PhenoAge − usia kronologis              (= `percepatan`)
//   ΔAgeGap  = AgeGap_terakhir − AgeGap_sebelumnya
//   laju     = ΔAgeGap ÷ (selang tahun)                (tahun per tahun)
//
// Batas yang sengaja dijaga:
// - Tanggal adalah tanggal PENGAMBILAN DARAH, bukan tanggal disimpan. Satu
//   tanggal = satu titik; menyimpan ulang pada tanggal yang sama menggantinya.
// - Selisih usia kronologis antara dua titik sudah dihilangkan oleh AgeGap,
//   jadi ΔAgeGap tidak "naik" hanya karena orangnya bertambah tua.
// - PhenoAge (Levine 2018) adalah model populasi NHANES. Perubahan kecil
//   bisa berasal dari variasi lab/assay; di bawah 1 tahun dilaporkan "datar"
//   dan tidak diberi arti. Ambang 1 tahun ini adalah batas tampilan yang
//   konservatif, bukan ambang klinis yang tervalidasi.
// - Tidak ada rekomendasi pengobatan dari angka ini.

import type { HasilPhenoAge } from './longevity'

export interface TitikUsiaBiologis {
  /** yyyy-mm-dd — tanggal pengambilan darah. */
  tanggal: string
  usia: number
  phenoAge: number
  ageGap: number
  metode: 'phenoage-levine-2018'
}

export interface Trajektori {
  titik: TitikUsiaBiologis[]
  ageGapTerakhir: number | null
  deltaAgeGap: number | null
  lajuPerTahun: number | null
  arah: 'membaik' | 'memburuk' | 'datar' | 'belum-cukup-data'
}

export const AMBANG_DATAR_TAHUN = 1
const KUNCI = 'pmd_bioage_trajectory_v1'
const TANGGAL = /^\d{4}-\d{2}-\d{2}$/

export function titikDariHasil(tanggal: string, usia: number, h: HasilPhenoAge): TitikUsiaBiologis | null {
  if (!TANGGAL.test(tanggal) || !(usia > 0) || !Number.isFinite(h.phenoAge)) return null
  return { tanggal, usia, phenoAge: h.phenoAge, ageGap: Number((h.phenoAge - usia).toFixed(1)), metode: 'phenoage-levine-2018' }
}

/** Menyisipkan atau mengganti titik pada tanggal yang sama; hasil terurut. */
export function gabungTitik(daftar: readonly TitikUsiaBiologis[], baru: TitikUsiaBiologis): TitikUsiaBiologis[] {
  return [...daftar.filter((t) => t.tanggal !== baru.tanggal), baru].sort((a, b) => a.tanggal.localeCompare(b.tanggal))
}

export function hitungTrajektori(daftarMentah: readonly TitikUsiaBiologis[]): Trajektori {
  const titik = daftarMentah
    .filter((t) => TANGGAL.test(t.tanggal) && Number.isFinite(t.ageGap))
    .slice()
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
  if (titik.length < 2) {
    return { titik, ageGapTerakhir: titik.length ? titik[titik.length - 1].ageGap : null, deltaAgeGap: null, lajuPerTahun: null, arah: 'belum-cukup-data' }
  }
  const a = titik[titik.length - 2]
  const b = titik[titik.length - 1]
  const delta = Number((b.ageGap - a.ageGap).toFixed(1))
  const tahun = (Date.parse(`${b.tanggal}T00:00:00Z`) - Date.parse(`${a.tanggal}T00:00:00Z`)) / (365.25 * 864e5)
  const laju = tahun > 0 ? Number((delta / tahun).toFixed(2)) : null
  const arah = Math.abs(delta) < AMBANG_DATAR_TAHUN ? 'datar' : delta < 0 ? 'membaik' : 'memburuk'
  return { titik, ageGapTerakhir: b.ageGap, deltaAgeGap: delta, lajuPerTahun: laju, arah }
}

export function ambilTrajektori(): TitikUsiaBiologis[] {
  try {
    const d = JSON.parse(localStorage.getItem(KUNCI) || '[]')
    return Array.isArray(d) ? d.filter((t) => t && TANGGAL.test(t.tanggal) && Number.isFinite(t.ageGap)) : []
  } catch {
    return []
  }
}

export function simpanTitik(t: TitikUsiaBiologis): TitikUsiaBiologis[] {
  const baru = gabungTitik(ambilTrajektori(), t).slice(-60)
  try { localStorage.setItem(KUNCI, JSON.stringify(baru)) } catch { /* kuota */ }
  return baru
}
