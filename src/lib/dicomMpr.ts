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

function hampirSama(a: number, b: number, tolerance = 0.02): boolean {
  const scale = Math.max(Math.abs(a), Math.abs(b), 1e-6)
  return Math.abs(a - b) / scale <= tolerance
}

function deskripsiNormal(value?: string): string | undefined {
  const text = value?.trim().replace(/\s+/g, ' ').toLowerCase()
  return text || undefined
}

/**
 * Builds a strictly local 3-D voxel stack from already-decoded DICOM slices.
 * It never invents missing slices, interpolates anatomy, or claims diagnostic MPR.
 * Incomplete identity metadata is handled conservatively: obvious mixed-series or
 * irregular stacks are rejected instead of being rendered as one continuous volume.
 */
export function buatVolumeMpr(citra: readonly Citra[]): HasilVolumeMpr {
  if (citra.length < 3) return { ok: false, alasan: 'Load at least 3 slices from one compatible series for orthogonal views.' }

  const pertama = citra[0]
  if (pertama.bingkai !== 1) return { ok: false, alasan: 'Orthogonal views currently require single-frame DICOM slices.' }

  const deskripsi = new Set(citra.map((item) => deskripsiNormal(item.deskripsiSeri)).filter((value): value is string => Boolean(value)))
  if (deskripsi.size > 1) {
    return { ok: false, alasan: 'More than one series description is present. Select a single MRI/CT series before creating linked orthogonal views.' }
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

    const a = pertama.jarakPiksel
    const b = item.jarakPiksel
    if (a && b && (!hampirSama(a[0], b[0]) || !hampirSama(a[1], b[1]))) {
      return { ok: false, alasan: 'Pixel spacing changes inside the selected stack, so a continuous orthogonal view would be misleading.' }
    }
  }

  const posisiSemua = citra.map((item) => item.posisiZ)
  const posisi = posisiSemua.filter((value): value is number => value != null && Number.isFinite(value))
  const jarakPosisi: number[] = []

  if (posisi.length > 0 && posisi.length !== citra.length) {
    return { ok: false, alasan: 'Only some slices contain patient-position coordinates. Panacea will not guess the missing slice positions.' }
  }

  if (posisi.length === citra.length) {
    for (let i = 1; i < posisi.length; i++) {
      const delta = Math.abs(posisi[i] - posisi[i - 1])
      if (delta <= 1e-4) return { ok: false, alasan: 'Two or more slices share the same recorded position, so the stack is not treated as a continuous volume.' }
      jarakPosisi.push(delta)
    }

    const typical = median(jarakPosisi)
    if (typical != null) {
      const tolerance = Math.max(0.15, typical * 0.12)
      if (jarakPosisi.some((delta) => Math.abs(delta - typical) > tolerance)) {
        return { ok: false, alasan: 'Slice spacing is irregular. Orthogonal reconstruction is withheld instead of stretching or inventing anatomy.' }
      }
    }
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
  'Orthogonal views are local voxel reformats of one compatible loaded series. Panacea rejects obvious mixed or irregular stacks, never invents missing anatomy or findings, and only uses anatomical plane names when the source series explicitly identifies its plane.'
