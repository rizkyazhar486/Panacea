/**
 * @file atlasHomeConfig.ts
 * @description Canonical configuration, layers, and anatomical region presets for BodyExposureAtlasHome.
 */

export type AtlasStage = 'anatomy' | 'physiology' | 'clinical'

export interface LayerSpec {
  id: string
  file: string
  label: string
  color: string
  defaultOpacity: number
  peelRank: number
}

export const ATLAS_LAYERS: LayerSpec[] = [
  { id: 'surface', file: 'surface.glb', label: 'Integumentary (Skin)', color: '#d8b4a0', defaultOpacity: 0.85, peelRank: 0 },
  { id: 'muscular', file: 'muscular.glb', label: 'Muscular System', color: '#c25e5e', defaultOpacity: 0.95, peelRank: 1 },
  { id: 'skeletal', file: 'skeletal.glb', label: 'Skeletal Framework', color: '#e2d9cc', defaultOpacity: 0.95, peelRank: 2 },
  { id: 'cardiovascular', file: 'cardiovascular.glb', label: 'Cardiovascular Vessels', color: '#dc2626', defaultOpacity: 0.95, peelRank: 3 },
  { id: 'visceral', file: 'visceral.glb', label: 'Visceral Organs', color: '#ea580c', defaultOpacity: 0.95, peelRank: 4 },
  { id: 'nervous', file: 'nervous.glb', label: 'Nervous System', color: '#eab308', defaultOpacity: 0.95, peelRank: 5 },
  { id: 'lymphoid', file: 'lymphoid.glb', label: 'Lymphatic & Spleen', color: '#16a34a', defaultOpacity: 0.95, peelRank: 6 },
]

export const ANATOMICAL_REGIONS = [
  { id: 'all', label: 'Whole Body', targetY: 0, distance: 3.2 },
  { id: 'head-neck', label: 'Head & Neck', targetY: 0.72, distance: 1.1 },
  { id: 'thorax', label: 'Thorax', targetY: 0.35, distance: 1.2 },
  { id: 'abdomen', label: 'Abdomen', targetY: 0.05, distance: 1.2 },
  { id: 'pelvis', label: 'Pelvis', targetY: -0.22, distance: 1.1 },
  { id: 'upper-limb', label: 'Upper Limbs', targetY: 0.25, distance: 1.5 },
  { id: 'lower-limb', label: 'Lower Limbs', targetY: -0.65, distance: 1.6 },
] as const

export interface SelectedStructureInfo {
  meshName: string
  layerId: string
  cleanName: string
  functionalRole: string
  organKey?: string
}
