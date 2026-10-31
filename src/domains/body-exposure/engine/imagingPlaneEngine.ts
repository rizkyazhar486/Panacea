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

// Frame kanonik atlas (sama dengan cameraViews.ts): glTF Y-up, +X = kiri subjek, +Y = superior, +Z = anterior.
// Bidang aksial tegak lurus sumbu superior–inferior (Y), sagital tegak lurus kiri–kanan (X), koronal tegak lurus anterior–posterior (Z).
const AXIS: Readonly<Record<ImagingPlane, 0 | 1 | 2>> = { sagittal: 0, axial: 1, coronal: 2 }

const okVec = (v: unknown): v is Vec3 => Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === 'number' && Number.isFinite(n))

// Seluruh sumbu divalidasi (bukan hanya sumbu bidang): kotak terbalik di sumbu lain tetap data rusak, ditolak daripada ditebak.
const validBox = (s: AtlasBox): boolean =>
  !!s && typeof s.name === 'string' && s.name.length > 0 && okVec(s.min) && okVec(s.max) && s.min.every((lo, i) => lo <= s.max[i])

export function correlateImagingPlane(plane: ImagingPlane, coordinate: number, structures: readonly AtlasBox[]): PlaneResult {
  if (typeof plane !== 'string' || !Object.prototype.hasOwnProperty.call(AXIS, plane)) return { ok: false, reason: 'invalid_plane' }
  if (typeof coordinate !== 'number' || !Number.isFinite(coordinate)) return { ok: false, reason: 'invalid_coordinate' }
  if (!Array.isArray(structures) || !structures.every(validBox)) return { ok: false, reason: 'invalid_structure' }
  const a = AXIS[plane]
  const hit = structures.filter((s) => s.min[a] <= coordinate && coordinate <= s.max[a]).map((s) => s.name)
  return { ok: true, plane, coordinate, intersectedStructures: hit, truthClass: 'reference', label: 'Atlas reference — not patient imaging' }
}
