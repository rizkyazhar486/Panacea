/**
 * BX-6 Imaging Plane Correlator — matematika bidang potong murni atas kotak pembatas struktur atlas.
 * Tidak ada anatomi yang ditulis keras di sini: pemanggil memberi struktur (nama + kotak pembatas, meter),
 * mesin hanya menjawab struktur mana yang dilintasi bidang. Label atlas, bukan citra pasien.
 */
export type ImagingPlane = 'axial' | 'sagittal' | 'coronal'
export type Vec3 = readonly [number, number, number]
export interface AtlasBox { name: string; min: Vec3; max: Vec3 }
export type PlaneResult =
  | { ok: true; plane: ImagingPlane; coordinate: number; intersectedStructures: string[]; truthClass: 'reference'; label: 'Atlas reference — not patient imaging' }
  | { ok: false; reason: 'invalid_plane' | 'invalid_coordinate' | 'invalid_structure' }

// sumbu glTF/atlas: x = kiri-kanan (sagital), y = depan-belakang (koronal), z = atas-bawah (aksial)
const AXIS: Record<ImagingPlane, 0 | 1 | 2> = { sagittal: 0, coronal: 1, axial: 2 }

export function correlateImagingPlane(plane: ImagingPlane, coordinate: number, structures: readonly AtlasBox[]): PlaneResult {
  if (!(plane in AXIS)) return { ok: false, reason: 'invalid_plane' }
  if (!Number.isFinite(coordinate)) return { ok: false, reason: 'invalid_coordinate' }
  const a = AXIS[plane]
  for (const s of structures) {
    const okVec = (v: Vec3) => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite)
    if (!s || typeof s.name !== 'string' || !s.name || !okVec(s.min) || !okVec(s.max) || s.min[a] > s.max[a]) return { ok: false, reason: 'invalid_structure' }
  }
  const hit = structures.filter((s) => s.min[a] <= coordinate && coordinate <= s.max[a]).map((s) => s.name)
  return { ok: true, plane, coordinate, intersectedStructures: hit, truthClass: 'reference', label: 'Atlas reference — not patient imaging' }
}
