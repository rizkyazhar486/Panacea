import { jalurKemih, STRUKTUR_KELENJAR, type SistemKelenjar } from './kelenjarSaluran'

/**
 * Deterministic navigation order for the existing source-backed 3D glands / urinary atlas.
 *
 * This is navigation only. It does not invent flow speed, hormone kinetics, organ motion,
 * physiology, diagnosis, treatment, or patient-specific anatomy. Every returned id must
 * already exist in STRUKTUR_KELENJAR and therefore resolve to declared source geometry.
 */
export function idTurKelenjar(sistem: SistemKelenjar): string[] {
  if (sistem === 'urinary') return jalurKemih().map((struktur) => struktur.id)
  return STRUKTUR_KELENJAR.filter((struktur) => struktur.sistem === 'endocrine').map((struktur) => struktur.id)
}

export function langkahTurKelenjar(
  sistem: SistemKelenjar,
  idAktif: string | null,
  arah: -1 | 1,
): string | null {
  const ids = idTurKelenjar(sistem)
  if (!ids.length) return null

  const indeks = idAktif ? ids.indexOf(idAktif) : -1
  if (indeks < 0) return arah > 0 ? ids[0] : ids[ids.length - 1]

  return ids[(indeks + arah + ids.length) % ids.length] ?? null
}

export function posisiTurKelenjar(
  sistem: SistemKelenjar,
  idAktif: string | null,
): { indeks: number; jumlah: number } {
  const ids = idTurKelenjar(sistem)
  const indeks = idAktif ? ids.indexOf(idAktif) : -1
  return { indeks: indeks >= 0 ? indeks + 1 : 0, jumlah: ids.length }
}
