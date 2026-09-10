import { buatVolumeMpr } from './dicomMpr'
import { urutkanSeri, type Citra } from './dicom'

export interface DicomSliceItem {
  nama: string
  citra: Citra
}

export type DicomGroupIdentity = 'dicom-series-uid' | 'fallback-signature'

export interface DicomDisplayGroup {
  id: string
  label: string
  modality: string
  description?: string
  studyInstanceUid?: string
  seriesInstanceUid?: string
  frameOfReferenceUid?: string
  identity: DicomGroupIdentity
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

function fallbackDisplaySignature(citra: Citra): string {
  return [
    clean(citra.modalitas).toUpperCase() || 'OT',
    clean(citra.deskripsiSeri).toLowerCase() || 'unnamed',
    `${citra.baris}x${citra.kolom}`,
    spacingKey(citra),
    citra.bingkai === 1 ? 'single-frame' : `frames-${citra.bingkai}`,
  ].join('|')
}

function groupKey(citra: Citra): { key: string; identity: DicomGroupIdentity } {
  const seriesUid = clean(citra.seriesInstanceUid)
  if (seriesUid) {
    const studyUid = clean(citra.studyInstanceUid) || 'study-unspecified'
    return { key: `uid:${studyUid}|${seriesUid}`, identity: 'dicom-series-uid' }
  }
  return { key: `fallback:${fallbackDisplaySignature(citra)}`, identity: 'fallback-signature' }
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
  const map = new Map<string, { identity: DicomGroupIdentity; slices: DicomSliceItem[] }>()
  for (const item of items) {
    const grouping = groupKey(item.citra)
    const existing = map.get(grouping.key)
    if (existing) existing.slices.push(item)
    else map.set(grouping.key, { identity: grouping.identity, slices: [item] })
  }

  return [...map.entries()]
    .map(([signature, entry], index) => {
      const ordered = urutkanSeri(entry.slices)
      const first = ordered[0].citra
      const mpr = buatVolumeMpr(ordered.map((item) => item.citra))
      const description = clean(first.deskripsiSeri) || undefined
      return {
        id: stableId(signature),
        label: description || `${first.modalitas || 'OT'} acquisition ${index + 1}`,
        modality: first.modalitas || 'OT',
        description,
        studyInstanceUid: first.studyInstanceUid,
        seriesInstanceUid: first.seriesInstanceUid,
        frameOfReferenceUid: first.frameOfReferenceUid,
        identity: entry.identity,
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
  'When SeriesInstanceUID is present, Panacea groups slices by exact DICOM series identity. Files without that UID use a conservative modality/description/matrix/spacing/frame fallback and are still validated before linked orthogonal viewing.'
