import type { AnatomyLayer } from '../components/Body3D'

export type ExposureDepth = 'body' | 'organ' | 'tissue' | 'molecular'

export interface ExposureDepthDefinition {
  key: ExposureDepth
  label: string
  hint: string
  dissect: number
}

export const EXPOSURE_DEPTHS: ExposureDepthDefinition[] = [
  { key: 'body', label: 'Whole body', hint: 'Orient first. Keep the complete body in view.', dissect: 0.08 },
  { key: 'organ', label: 'Organ', hint: 'Focus one organ without leaving the same atlas.', dissect: 0.22 },
  { key: 'tissue', label: 'Tissue', hint: 'Increase dissection while preserving the selected structure.', dissect: 0.48 },
  { key: 'molecular', label: 'Molecular', hint: 'Only show cross-scale bridges that are explicitly validated.', dissect: 0.68 },
]

export interface BodySystemDefinition {
  key: string
  label: string
  layer: AnatomyLayer['key']
  description: string
}

export const BODY_SYSTEMS: BodySystemDefinition[] = [
  { key: 'surface', label: 'Surface', layer: 'surface', description: 'Skin and external anatomical regions' },
  { key: 'skeletal', label: 'Skeletal', layer: 'skeletal', description: 'Bones and osseous landmarks' },
  { key: 'muscular', label: 'Muscular', layer: 'muscular', description: 'Skeletal muscles and attachments' },
  { key: 'cardiovascular', label: 'Cardiovascular', layer: 'cardiovascular', description: 'Heart and vascular tree' },
  { key: 'nervous', label: 'Nervous', layer: 'nervous', description: 'Central and peripheral neural structures' },
  { key: 'visceral', label: 'Visceral', layer: 'visceral', description: 'Thoracic, abdominal and pelvic organs' },
  { key: 'lymphoid', label: 'Lymphatic', layer: 'lymphoid', description: 'Lymphatic and lymphoid structures' },
]

export const CORE_WHOLE_BODY_LAYERS: AnatomyLayer['key'][] = [
  'skeletal',
  'muscular',
  'cardiovascular',
  'nervous',
  'visceral',
]

export function canonicalStructureId(rawName: string): string {
  return rawName
    .trim()
    .toLowerCase()
    .replace(/\.[lr]$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function depthDefinition(depth: ExposureDepth): ExposureDepthDefinition {
  return EXPOSURE_DEPTHS.find((item) => item.key === depth) ?? EXPOSURE_DEPTHS[0]
}
