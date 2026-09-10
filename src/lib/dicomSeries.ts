import { buatVolumeMpr } from './dicomMpr'
import { urutkanSeri, type Citra } from './dicom'

export interface DicomSliceItem {
  nama: string
  citra: Citra
}

export interface DicomDisplayGroup {
  id: string
  label: string
  modality: string
  description?: string
  rows: number
  columns: number
  slices: DicomSliceItem[]
  linkedPlanesAvailable: boolean
  linkedPlanesReason?: string
}

function clean(value?: string): string {
  return value?.trim().replace(/\s+/g, ' ') || ''
}

function spacingKey(citra: Citra): string {
  const spacing = citra.jarakPiksel
  if (!spacing) return 'unknown-spacing'
  return `${spacing[0].toFixed(4)}x${spacing[1].toFixed(4)}`
}

function displaySignature(citra: Citra): string {
  // This is deliberately NOT called a SeriesInstanceUID. Older Panacea DICOM
  // metadata does not yet expose that UID, so this only separates obviously
  // different user-loaded acquisitions for safer display.
  return [
    clean(citra.modalitas).toUpperCase() || 'OT',
    clean(citra.deskripsiSeri).toLowerCase() || 'unnamed',
    `${citra.baris}x${citra.kolom}`,
    spacingKey(citra),
    citra.bingkai === 1 ? 'single-frame' : `frames-${citra.bingkai}`,
  ].join('|')
}

function stableId(signature: string): string {
  let hash = 2166136261
  for (let i = 0; i < signature.length; i++) {
    hash ^= signature.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return `display-${(hash >>> 0).toString(36)}`
}

export function kelompokkanDicomUntukTampilan(items: readonly DicomSliceItem[]): DicomDisplayGroup[] {
  const map = new Map<string, DicomSliceItem[]>()
  for (const item of items) {
    const key = displaySignature(item.citra)
    const existing = map.get(key)
    if (existing) existing.push(item)
    else map.set(key, [item])
  }

  return [...map.entries()]
    .map(([signature, slices], index) => {
      const ordered = urutkanSeri(slices)
      const first = ordered[0].citra
      const mpr = buatVolumeMpr(ordered.map((item) => item.citra))
      const description = clean(first.deskripsiSeri) || undefined
      return {
        id: stableId(`${signature}|${index}`),
        label: description || `${first.modalitas || 'OT'} acquisition ${index + 1}`,
        modality: first.modalitas || 'OT',
        description,
        rows: first.baris,
        columns: first.kolom,
        slices: ordered,
        linkedPlanesAvailable: mpr.ok,
        linkedPlanesReason: mpr.ok ? undefined : mpr.alasan,
      }
    })
    .sort((a, b) => {
      const modality = a.modality.localeCompare(b.modality)
      return modality || a.label.localeCompare(b.label)
    })
}

export const BATAS_KELOMPOK_DICOM =
  'Loaded images are separated into display groups using modality, description, matrix, spacing and frame count. This is a safety convenience, not proof of DICOM SeriesInstanceUID identity; Panacea still validates a stack before linked orthogonal viewing.'
