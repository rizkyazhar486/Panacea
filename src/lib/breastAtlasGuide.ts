export type BreastSide = 'Left' | 'Right'

export interface BreastGuideStage {
  id: string
  label: string
  sourceSuffix: string
  description: string
}

export const BREAST_GUIDE_STAGES: readonly BreastGuideStage[] = [
  {
    id: 'nipple',
    label: 'Nipple',
    sourceSuffix: 'nipple',
    description: 'External projection where the source atlas brings the ductal anatomy to the surface.',
  },
  {
    id: 'areola',
    label: 'Areola',
    sourceSuffix: 'areola',
    description: 'Pigmented region surrounding the nipple, represented as its own source structure.',
  },
  {
    id: 'areolar-tubercles',
    label: 'Areolar tubercles',
    sourceSuffix: 'areolar tubercles',
    description: 'Surface landmarks explicitly named in the shipped breast reference geometry.',
  },
  {
    id: 'lactiferous-sinuses',
    label: 'Lactiferous sinuses',
    sourceSuffix: 'main lactiferous sinuses',
    description: 'Source-labelled ductal dilatations near the nipple; this view is structural, not a milk-flow simulation.',
  },
  {
    id: 'lactiferous-ducts',
    label: 'Lactiferous ducts',
    sourceSuffix: 'main lactiferous ducts',
    description: 'Source-labelled duct pathways linking glandular tissue toward the nipple.',
  },
  {
    id: 'mammary-lobes',
    label: 'Mammary lobes',
    sourceSuffix: 'mammary lobes',
    description: 'Glandular lobar tissue represented by the HuBMAP female reference geometry.',
  },
  {
    id: 'suspensory-ligaments',
    label: 'Suspensory ligaments',
    sourceSuffix: 'suspensory ligaments',
    description: 'Connective support structures represented as named source geometry.',
  },
  {
    id: 'fat',
    label: 'Fat',
    sourceSuffix: 'fat',
    description: 'Adipose volume providing contour and spatial context around the glandular structures.',
  },
] as const

export function breastGuideSourceName(side: BreastSide, stage: BreastGuideStage): string {
  return `${side} ${stage.sourceSuffix}`
}

export function breastGuideNames(side: BreastSide): string[] {
  return BREAST_GUIDE_STAGES.map((stage) => breastGuideSourceName(side, stage))
}
