import { koordinatIrisPasien, type Citra } from './dicom'

export type BidangMpr = 'source' | 'cross-row' | 'cross-column'

export interface VolumeMpr {
  irisan: readonly Citra[]
  baris: number
  kolom: number
  kedalaman: number
  jarakBarisMm: number
  jarakKolomMm: number
  jarakIrisMm: number
  minimum: number
  maksimum: number
  terbalik: boolean
  seriesInstanceUid?: string
  frameOfReferenceUid?: string
  orientasiPasien?: Citra['orientasiPasien']
}

export interface IrisanMpr {
  bidang: BidangMpr
  baris: number
  kolom: number
  nilai: Float32Array
  aspek: number
}

export type HasilVolumeMpr =
  | { ok: true; volume: VolumeMpr }
  | { ok: false; alasan: string }

function median(values: number[]): number | undefined {
  const valid = values.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b)
  if (!valid.length) return undefined
  const middle = Math.floor(valid.length / 2)
  return valid.length % 2 ? valid[middle] : (valid[middle - 1] + valid[middle]) / 2
}

function hampirSama(a: number, b: number, tolerance = 0.02): boolean {
  const scale = Math.max(Math.abs(a), Math.abs(b), 1e-6)
  return Math.abs(a - b) / scale <= tolerance
}

function deskripsiNormal(value?: string): string | undefined {
  const text = value?.trim().replace(/\s+/g, ' ').toLowerCase()
  return text || undefined
}

function normalDariOrientasi(orientation?: Citra['orientasiPasien']): [number, number, number] | undefined {
  if (!orientation) return undefined
  const [rx, ry, rz, cx, cy, cz] = orientation
  const nx = ry * cz - rz * cy
  const ny = rz * cx - rx * cz
  const nz = rx * cy - ry * cx
  const length = Math.hypot(nx, ny, nz)
  if (!Number.isFinite(length) || length < 1e-6) return undefined
  return [nx / length, ny / length, nz / length]
}

function arahSama(a?: Citra['orientasiPasien'], b?: Citra['orientasiPasien']): boolean {
  if (!a || !b) return false
  const rowDot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  const colDot = a[3] * b[3] + a[4] * b[4] + a[5] * b[5]
  return rowDot > 0.999 && colDot > 0.999
}

function nilaiIdentitas(items: readonly Citra[], key: 'seriesInstanceUid' | 'frameOfReferenceUid'): {
  value?: string
  partial: boolean
  mixed: boolean
} {
  const values = items.map((item) => item[key]?.trim()).filter((value): value is string => Boolean(value))
  const unique = new Set(values)
  return {
    value: unique.size === 1 ? values[0] : undefined,
    partial: values.length > 0 && values.length !== items.length,
    mixed: unique.size > 1,
  }
}

/**
 * Builds a strictly local 3-D voxel stack from already-decoded DICOM slices.
 * It never invents missing slices, interpolates anatomy, or claims diagnostic MPR.
 * Identity, orientation and spacing conflicts fail closed rather than creating a
 * visually plausible but spatially false volume.
 */
export function buatVolumeMpr(citra: readonly Citra[]): HasilVolumeMpr {
  if (citra.length < 3) return { ok: false, alasan: 'Load at least 3 slices from one compatible series for orthogonal views.' }

  const pertama = citra[0]
  if (pertama.bingkai !== 1) return { ok: false, alasan: 'Orthogonal views currently require single-frame DICOM slices.' }

  const seriesIdentity = nilaiIdentitas(citra, 'seriesInstanceUid')
  if (seriesIdentity.partial) {
    return { ok: false, alasan: 'Only some slices contain a SeriesInstanceUID. Panacea will not guess whether they belong to one acquisition.' }
  }
  if (seriesIdentity.mixed) {
    return { ok: false, alasan: 'More than one DICOM SeriesInstanceUID is present. Select a single series for linked orthogonal views.' }
  }

  const frameIdentity = nilaiIdentitas(citra, 'frameOfReferenceUid')
  if (frameIdentity.partial) {
    return { ok: false, alasan: 'Only some slices contain a FrameOfReferenceUID. Spatial continuity is not assumed.' }
  }
  if (frameIdentity.mixed) {
    return { ok: false, alasan: 'Slices use different DICOM frames of reference and are not combined into one volume.' }
  }

  // Description is a fallback separation aid only when exact SeriesInstanceUID
  // is absent. Exact DICOM series identity takes precedence when present.
  if (!seriesIdentity.value) {
    const descriptions = new Set(citra.map((item) => deskripsiNormal(item.deskripsiSeri)).filter((value): value is string => Boolean(value)))
    if (descriptions.size > 1) {
      return { ok: false, alasan: 'More than one series description is present. Select a single MRI/CT acquisition before creating linked orthogonal views.' }
    }
  }

  const orientationCount = citra.filter((item) => item.orientasiPasien).length
  if (orientationCount > 0 && orientationCount !== citra.length) {
    return { ok: false, alasan: 'Only some slices contain Image Orientation (Patient). Panacea will not guess the missing spatial orientation.' }
  }

  for (const item of citra) {
    if (item.baris !== pertama.baris || item.kolom !== pertama.kolom) {
      return { ok: false, alasan: 'Slices have different matrix sizes, so they are not combined into one volume.' }
    }
    if (item.bingkai !== 1) {
      return { ok: false, alasan: 'A multi-frame object is mixed into this stack; it is kept out of the reconstructed volume.' }
    }
    if (item.modalitas !== pertama.modalitas) {
      return { ok: false, alasan: 'Different modalities are mixed in this selection.' }
    }
    if (item.terbalik !== pertama.terbalik) {
      return { ok: false, alasan: 'Slices use different grayscale photometric interpretation and are not combined.' }
    }
    if (orientationCount === citra.length && !arahSama(pertama.orientasiPasien, item.orientasiPasien)) {
      return { ok: false, alasan: 'Slice orientation changes inside the selected stack. A straight orthogonal reformat would be spatially misleading.' }
    }

    const a = pertama.jarakPiksel
    const b = item.jarakPiksel
    if (a && b && (!hampirSama(a[0], b[0]) || !hampirSama(a[1], b[1]))) {
      return { ok: false, alasan: 'Pixel spacing changes inside the selected stack, so a continuous orthogonal view would be misleading.' }
    }
  }

  const coordinatesAlongNormal = citra.map((item) => koordinatIrisPasien(item))
  const allNormalCoordinates = coordinatesAlongNormal.every((value): value is number => value != null && Number.isFinite(value))
  const fallbackZ = citra.map((item) => item.posisiZ)
  const anyFallbackZ = fallbackZ.some((value) => value != null && Number.isFinite(value))
  const allFallbackZ = fallbackZ.every((value): value is number => value != null && Number.isFinite(value))

  if (!allNormalCoordinates && anyFallbackZ && !allFallbackZ) {
    return { ok: false, alasan: 'Only some slices contain patient-position coordinates. Panacea will not guess the missing slice positions.' }
  }

  const spatialCoordinates = allNormalCoordinates
    ? coordinatesAlongNormal as number[]
    : allFallbackZ
      ? fallbackZ as number[]
      : []
  const spatialDistances: number[] = []

  if (spatialCoordinates.length === citra.length) {
    for (let i = 1; i < spatialCoordinates.length; i++) {
      const delta = Math.abs(spatialCoordinates[i] - spatialCoordinates[i - 1])
      if (delta <= 1e-4) return { ok: false, alasan: 'Two or more slices share the same recorded spatial position, so the stack is not treated as a continuous volume.' }
      spatialDistances.push(delta)
    }

    const typical = median(spatialDistances)
    if (typical != null) {
      const tolerance = Math.max(0.15, typical * 0.12)
      if (spatialDistances.some((delta) => Math.abs(delta - typical) > tolerance)) {
        return { ok: false, alasan: 'Slice spacing is irregular. Orthogonal reconstruction is withheld instead of stretching or inventing anatomy.' }
      }
    }
  }

  const jarakIrisMm = median(spatialDistances)
    ?? median(citra.map((item) => item.tebalIrisMm ?? Number.NaN))
    ?? 1
  const jarakBarisMm = median(citra.map((item) => item.jarakPiksel?.[0] ?? Number.NaN)) ?? 1
  const jarakKolomMm = median(citra.map((item) => item.jarakPiksel?.[1] ?? Number.NaN)) ?? 1

  let minimum = Infinity
  let maksimum = -Infinity
  for (const item of citra) {
    minimum = Math.min(minimum, item.minimum)
    maksimum = Math.max(maksimum, item.maksimum)
  }
  if (!Number.isFinite(minimum) || !Number.isFinite(maksimum) || maksimum < minimum) {
    return { ok: false, alasan: 'The selected stack does not contain a valid finite pixel range.' }
  }

  return {
    ok: true,
    volume: {
      irisan: citra,
      baris: pertama.baris,
      kolom: pertama.kolom,
      kedalaman: citra.length,
      jarakBarisMm,
      jarakKolomMm,
      jarakIrisMm,
      minimum,
      maksimum,
      terbalik: pertama.terbalik,
      seriesInstanceUid: seriesIdentity.value,
      frameOfReferenceUid: frameIdentity.value,
      orientasiPasien: orientationCount === citra.length ? pertama.orientasiPasien : undefined,
    },
  }
}

export function ambilIrisanMpr(
  volume: VolumeMpr,
  bidang: BidangMpr,
  posisi: { x: number; y: number; z: number },
): IrisanMpr {
  const x = Math.min(volume.kolom - 1, Math.max(0, Math.round(posisi.x)))
  const y = Math.min(volume.baris - 1, Math.max(0, Math.round(posisi.y)))
  const z = Math.min(volume.kedalaman - 1, Math.max(0, Math.round(posisi.z)))

  if (bidang === 'source') {
    const citra = volume.irisan[z]
    return {
      bidang,
      baris: volume.baris,
      kolom: volume.kolom,
      nilai: citra.nilai.subarray(0, volume.baris * volume.kolom),
      aspek: (volume.kolom * volume.jarakKolomMm) / Math.max(1e-6, volume.baris * volume.jarakBarisMm),
    }
  }

  if (bidang === 'cross-row') {
    const nilai = new Float32Array(volume.kedalaman * volume.kolom)
    for (let iz = 0; iz < volume.kedalaman; iz++) {
      const sumber = volume.irisan[iz].nilai
      const awal = y * volume.kolom
      for (let ix = 0; ix < volume.kolom; ix++) nilai[iz * volume.kolom + ix] = sumber[awal + ix]
    }
    return {
      bidang,
      baris: volume.kedalaman,
      kolom: volume.kolom,
      nilai,
      aspek: (volume.kolom * volume.jarakKolomMm) / Math.max(1e-6, volume.kedalaman * volume.jarakIrisMm),
    }
  }

  const nilai = new Float32Array(volume.kedalaman * volume.baris)
  for (let iz = 0; iz < volume.kedalaman; iz++) {
    const sumber = volume.irisan[iz].nilai
    for (let iy = 0; iy < volume.baris; iy++) nilai[iz * volume.baris + iy] = sumber[iy * volume.kolom + x]
  }
  return {
    bidang,
    baris: volume.kedalaman,
    kolom: volume.baris,
    nilai,
    aspek: (volume.baris * volume.jarakBarisMm) / Math.max(1e-6, volume.kedalaman * volume.jarakIrisMm),
  }
}

/** Window arbitrary scalar pixels without assigning tissue meaning to MR signal. */
export function jendelakanMpr(
  nilai: Float32Array,
  pusat: number,
  lebar: number,
  terbalik = false,
): Uint8ClampedArray {
  const keluar = new Uint8ClampedArray(nilai.length)
  const width = Math.max(1.000001, lebar)
  const bawah = pusat - 0.5 - (width - 1) / 2
  const atas = pusat - 0.5 + (width - 1) / 2

  for (let i = 0; i < nilai.length; i++) {
    const value = nilai[i]
    let gray: number
    if (value <= bawah) gray = 0
    else if (value > atas) gray = 255
    else gray = ((value - (pusat - 0.5)) / Math.max(1e-6, width - 1) + 0.5) * 255
    keluar[i] = terbalik ? 255 - gray : gray
  }
  return keluar
}

function labelsFromOrientation(orientation: Citra['orientasiPasien']): Record<BidangMpr, string> | undefined {
  const normal = normalDariOrientasi(orientation)
  if (!normal) return undefined
  const [x, y, z] = normal.map(Math.abs)
  // Only use a canonical anatomical name when the plane is close enough to a
  // principal patient axis. Oblique acquisitions stay explicitly labelled oblique.
  const dominant = Math.max(x, y, z)
  if (dominant < 0.9) return {
    source: 'Oblique source plane',
    'cross-row': 'Orthogonal A',
    'cross-column': 'Orthogonal B',
  }
  if (z === dominant) return { source: 'Axial', 'cross-row': 'Coronal-like', 'cross-column': 'Sagittal-like' }
  if (y === dominant) return { source: 'Coronal', 'cross-row': 'Axial-like', 'cross-column': 'Sagittal-like' }
  return { source: 'Sagittal', 'cross-row': 'Axial-like', 'cross-column': 'Coronal-like' }
}

export function labelBidangMpr(
  deskripsiSeri?: string,
  orientasiPasien?: Citra['orientasiPasien'],
): Record<BidangMpr, string> {
  const byOrientation = labelsFromOrientation(orientasiPasien)
  if (byOrientation) return byOrientation

  const text = (deskripsiSeri ?? '').toLowerCase()
  if (/\b(ax|axial|trans|transverse)\b/.test(text)) {
    return { source: 'Axial', 'cross-row': 'Coronal-like', 'cross-column': 'Sagittal-like' }
  }
  if (/\b(cor|coronal)\b/.test(text)) {
    return { source: 'Coronal', 'cross-row': 'Axial-like', 'cross-column': 'Sagittal-like' }
  }
  if (/\b(sag|sagittal)\b/.test(text)) {
    return { source: 'Sagittal', 'cross-row': 'Axial-like', 'cross-column': 'Coronal-like' }
  }
  return { source: 'Source plane', 'cross-row': 'Orthogonal A', 'cross-column': 'Orthogonal B' }
}

export const BATAS_MPR =
  'Orthogonal views are local voxel reformats of one compatible loaded series. Panacea validates available SeriesInstanceUID, frame of reference, orientation and spacing, never invents missing anatomy or findings, and marks simple row/column reconstructions as “-like” rather than implying a diagnostic reformat.'
