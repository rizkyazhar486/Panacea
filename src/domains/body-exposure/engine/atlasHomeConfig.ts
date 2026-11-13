/**
 * @file atlasHomeConfig.ts
 * @description Canonical configuration, layers, and anatomical region presets for BodyExposureAtlasHome.
 *
 * The layer order is not decided here. It is the dissection order documented in lib/dissection (KEDALAMAN);
 * this file only attaches a file, a label and a colour to each of those depths. Regions are the framing
 * windows measured from the shipped atlas file (engine/atlas-stage/regionFraming).
 */

import { KEDALAMAN } from '../../../lib/dissection.ts'
import { ATLAS_DEPTH_ORDER, type AtlasLayerId, type AtlasLayerInfo } from './atlas-stage/stageLayers.ts'
import { ATLAS_REGIONS } from './atlas-stage/regionFraming.ts'

export type AtlasStage = 'anatomy' | 'physiology' | 'clinical'

export type LayerSpec = AtlasLayerInfo

const LAYER_FACTS: Record<AtlasLayerId, Omit<LayerSpec, 'id' | 'peelRank'>> = {
  surface: { file: 'surface.glb', label: 'Integumentary (Skin)', short: 'Skin', color: '#d8b4a0', sizeBytes: 998_480 },
  muscular: { file: 'muscular.glb', label: 'Muscular System', short: 'Muscles', color: '#e05a5a', sizeBytes: 5_636_668 },
  cardiovascular: { file: 'cardiovascular.glb', label: 'Cardiovascular Vessels', short: 'Vessels', color: '#ff4d6a', sizeBytes: 12_344_948 },
  nervous: { file: 'nervous.glb', label: 'Nervous System', short: 'Nerves', color: '#f5c542', sizeBytes: 7_785_940 },
  lymphoid: { file: 'lymphoid.glb', label: 'Lymphatic & Spleen', short: 'Lymph', color: '#3ddc97', sizeBytes: 652_008 },
  visceral: { file: 'visceral.glb', label: 'Visceral Organs', short: 'Organs', color: '#ff8a3d', sizeBytes: 3_682_364 },
  skeletal: { file: 'skeletal.glb', label: 'Skeletal Framework', short: 'Skeleton', color: '#e8dfd0', sizeBytes: 2_653_500 },
}

/** Outermost first, in canonical dissection order. */
export const ATLAS_LAYERS: LayerSpec[] = ATLAS_DEPTH_ORDER.map((id) => ({ id, ...LAYER_FACTS[id], peelRank: KEDALAMAN[id] }))

export const ANATOMICAL_REGIONS = ATLAS_REGIONS

export type { SelectedStructureInfo } from './atlas-stage/structureInfo.ts'
