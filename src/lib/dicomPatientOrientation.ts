import type { Citra } from './dicom'

export type PatientDirection = 'L' | 'R' | 'A' | 'P' | 'S' | 'I'
export type Vec3 = readonly [number, number, number]

export interface DirectionPair {
  negative: PatientDirection
  positive: PatientDirection
}

export interface DicomPlaneDirections {
  source: { horizontal: DirectionPair; vertical: DirectionPair }
  crossRow: { horizontal: DirectionPair; vertical: DirectionPair }
  crossColumn: { horizontal: DirectionPair; vertical: DirectionPair }
  normal: Vec3
}

function normalize(vector: Vec3): Vec3 | undefined {
  const length = Math.hypot(vector[0], vector[1], vector[2])
  if (!Number.isFinite(length) || length < 1e-6) return undefined
  return [vector[0] / length, vector[1] / length, vector[2] / length]
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
}

function opposite(direction: PatientDirection): PatientDirection {
  if (direction === 'L') return 'R'
  if (direction === 'R') return 'L'
  if (direction === 'P') return 'A'
  if (direction === 'A') return 'P'
  if (direction === 'S') return 'I'
  return 'S'
}

/**
 * DICOM patient coordinates use +X toward Left, +Y toward Posterior and +Z
 * toward Superior. For oblique vectors we deliberately show only the dominant
 * patient axis instead of pretending the acquisition is perfectly canonical.
 */
export function arahPasienDominan(vector: Vec3): PatientDirection | undefined {
  const unit = normalize(vector)
  if (!unit) return undefined
  const [x, y, z] = unit
  const abs = [Math.abs(x), Math.abs(y), Math.abs(z)]
  const dominant = Math.max(...abs)
  if (dominant < 0.5) return undefined
  if (abs[0] === dominant) return x >= 0 ? 'L' : 'R'
  if (abs[1] === dominant) return y >= 0 ? 'P' : 'A'
  return z >= 0 ? 'S' : 'I'
}

export function pasanganArahPasien(vector: Vec3): DirectionPair | undefined {
  const positive = arahPasienDominan(vector)
  if (!positive) return undefined
  return { negative: opposite(positive), positive }
}

/**
 * Converts Image Orientation (Patient) into compact direction pairs for the
 * local educational viewer. This does not register the scan to an atlas and
 * does not infer anatomy. The first orientation triplet follows increasing
 * displayed X (DICOM row direction); the second follows increasing displayed
 * Y (DICOM column direction). The third direction is their right-handed normal.
 */
export function arahBidangDicom(
  orientation?: Citra['orientasiPasien'],
): DicomPlaneDirections | undefined {
  if (!orientation) return undefined
  const row = normalize([orientation[0], orientation[1], orientation[2]])
  const column = normalize([orientation[3], orientation[4], orientation[5]])
  if (!row || !column) return undefined
  const normal = normalize(cross(row, column))
  if (!normal) return undefined

  // Reject strongly non-orthogonal metadata. Direction labels on corrupt or
  // malformed orientation would be more dangerous than omitting the labels.
  const dot = row[0] * column[0] + row[1] * column[1] + row[2] * column[2]
  if (Math.abs(dot) > 0.02) return undefined

  const rowPair = pasanganArahPasien(row)
  const columnPair = pasanganArahPasien(column)
  const normalPair = pasanganArahPasien(normal)
  if (!rowPair || !columnPair || !normalPair) return undefined

  return {
    source: { horizontal: rowPair, vertical: columnPair },
    crossRow: { horizontal: rowPair, vertical: normalPair },
    crossColumn: { horizontal: columnPair, vertical: normalPair },
    normal,
  }
}

export function formatPasanganArah(pair: DirectionPair): string {
  return `${pair.negative} → ${pair.positive}`
}

export const BATAS_ARAH_DICOM =
  'Patient-direction labels are derived only from valid Image Orientation (Patient) metadata. Missing or malformed orientation stays unlabeled; no anatomical registration or diagnosis is inferred.'
