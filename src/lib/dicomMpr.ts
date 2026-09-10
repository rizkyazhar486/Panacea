import type { Citra } from './dicom'

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

/**
 * Builds a strictly local 3-D voxel stack from already-decoded DICOM slices.
 * It never invents missing slices, interpolates anatomy, or claims diagnostic MPR.
 */
export function buatVolumeMpr(citra: readonly Citra[]): HasilVolumeMpr {
  if (citra.length < 3) return { ok: false, alasan: 'Load at least 3 slices from one compatible series for orthogonal views.' }

  const pertama = citra[0]
  if (pertama.bingkai !== 1) return { ok: false, alasan: 'Orthogonal views currently require single-frame DICOM slices.' }

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
  }

  const posisi = citra.map((item) => item.posisiZ).filter((value): value is number => value != null && Number.isFinite(value))
  const jarakPosisi: number[] = []
  for (let i = 1; i < posisi.length; i++) {
    const delta = Math.abs(posisi[i] - posisi[i - 1])
    if (delta > 1e-4) jarakPosisi.push(delta)
  }

  const jarakIrisMm = median(jarakPosisi)
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
  const width = Math.max(1, lebar)
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

export function labelBidangMpr(deskripsiSeri?: string): Record<BidangMpr, string> {
  const text = (deskripsiSeri ?? '').toLowerCase()
  if (/\b(ax|axial|trans|transverse)\b/.test(text)) {
    return { source: 'Axial', 'cross-row': 'Coronal', 'cross-column': 'Sagittal' }
  }
  if (/\b(cor|coronal)\b/.test(text)) {
    return { source: 'Coronal', 'cross-row': 'Axial', 'cross-column': 'Sagittal' }
  }
  if (/\b(sag|sagittal)\b/.test(text)) {
    return { source: 'Sagittal', 'cross-row': 'Axial', 'cross-column': 'Coronal' }
  }
  return { source: 'Source plane', 'cross-row': 'Orthogonal A', 'cross-column': 'Orthogonal B' }
}

export const BATAS_MPR =
  'Orthogonal views are local voxel reformats of the loaded series. No missing anatomy is generated, no finding is inferred, and plane names are used only when the DICOM series description explicitly identifies the source plane.'
