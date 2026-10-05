export type {
  EyeSimulation,
  OcularEffector,
  OcularFunctionState,
  OcularSide,
  OculomotorGazeKey,
  OculomotorLesionKey,
  OculomotorPattern,
  OculomotorSimulation,
  OculomotorSyndromeKey,
} from './model/oculomotor'

export {
  OCULOMOTOR_GAZE,
  OCULOMOTOR_LESION_OPTIONS,
  OCULOMOTOR_REFERENCE,
  OCULOMOTOR_SYNDROME_OPTIONS,
  prismDioptersFromDegrees,
  simulateOculomotor,
} from './engine/oculomotorLesionEngine'

export { OculomotorLesionLab } from './ui/OculomotorLesionLab'

export {
  BoundsBvh,
  type BvhItem,
  type BvhRayHit,
  type BvhStats,
  type BvhVec3,
} from './engine/boundsBvh'

export {
  layoutLabels,
  DEFAULT_LABEL_LAYOUT_OPTIONS,
  type LabelCandidate,
  type LabelLayout,
  type LabelLayoutOptions,
  type LabelPlacement,
  type ScreenPoint,
  type ScreenRect,
} from './engine/labelLayout'

export {
  buildExplodedLayout,
  interpolateExplodedOffset,
  DEFAULT_EXPLODE_OPTIONS,
  type ExplodeItem,
  type ExplodeLayout,
  type ExplodeOptions,
  type ExplodeTransform,
  type ExplodeVec3,
} from './engine/explodedLayout'

export { kalimatPertama } from './engine/kalimatPertama'
export { classifyTissue, tissueShading, type TissueClass, type TissueShading } from './engine/tissueShading'
export { matchBakedAo, aoToVertexColors, type AoLayerEntry, type AoMatch } from './engine/bakedAo'
export { applyBakedAoToLayer } from './adapters/bakedAoLayer'
