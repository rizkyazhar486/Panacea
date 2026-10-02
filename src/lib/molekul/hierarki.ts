// Hierarki multi-skala eksplisit L0–L5 dengan transformasi SE(3) antar-level.
//   L0 atom · L1 residu · L2 domain/protein · L3 kompleks & organel · L4 sel/jaringan · L5 organ
// Level tanpa data geometri sumber dinyatakan `geometri: 'not-modelled'` — tidak
// pernah diisi bentuk karangan (aturan fail-closed Body Exposure).
import type { SE3 } from './geometri.ts'

export type Level = 0 | 1 | 2 | 3 | 4 | 5
export const NAMA_LEVEL: Record<Level, string> = { 0: 'atoms', 1: 'residues', 2: 'domains / proteins', 3: 'complexes & organelles', 4: 'cells / tissue', 5: 'organs' }

export type Geometri =
  | { jenis: 'experimental-structure'; berkas: string; sha256: string; idPdb: string }
  | { jenis: 'not-modelled'; alasan: string }

export interface Simpul {
  id: string; level: Level; label: string
  /** Pose dalam kerangka induk (Å untuk L0–L3; unit induk dinyatakan di `satuan`). */
  pose: SE3; satuan: 'angstrom' | 'micrometre' | 'millimetre'
  geometri: Geometri
  /** Resolusi yang diminta untuk simpul ini (fokus region-of-interest). */
  resolusi: 'all-atom' | 'residue' | 'coarse'
  anak: Simpul[]
  sumber?: { uniprot?: string; pdb?: string; catatan?: string }
}

export const IDENTITAS: SE3 = { R: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], t: [0, 0, 0] }

/** Validasi hierarki: level anak harus lebih halus; satuan konsisten; tak ada geometri tanpa hash. */
export function validasiHierarki(akar: Simpul): string[] {
  const galat: string[] = []
  const jalan = (s: Simpul) => {
    if (s.geometri.jenis === 'experimental-structure' && !/^[0-9a-f]{64}$/.test(s.geometri.sha256)) galat.push(`${s.id}: experimental geometry without a sha256`)
    if (s.geometri.jenis === 'not-modelled' && s.resolusi !== 'coarse') galat.push(`${s.id}: requests ${s.resolusi} resolution but has no source geometry`)
    for (const a of s.anak) { if (a.level >= s.level) galat.push(`${a.id}: level ${a.level} must be finer than parent ${s.id} (level ${s.level})`); jalan(a) }
  }
  jalan(akar)
  return galat
}

/**
 * Estimasi biaya memori parametris (bukan klaim tentang proteom): byte per atom
 * representasi ini ≈ 3×8 (koordinat Float64) + ~40 metadata ≈ 64 B.
 */
export function estimasiMemori(p: { jumlahProtein: number; rerataPanjang: number; atomBeratPerResidu: number; resolusi: 'all-atom' | 'residue' | 'coarse' }) {
  const residu = p.jumlahProtein * p.rerataPanjang
  const atom = p.resolusi === 'all-atom' ? residu * p.atomBeratPerResidu : p.resolusi === 'residue' ? residu : p.jumlahProtein
  return { entitas: atom, byte: atom * 64, mib: (atom * 64) / 2 ** 20 }
}
