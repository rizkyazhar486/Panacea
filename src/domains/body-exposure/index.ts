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
export { jenisDariNamaStruktur } from './engine/jenisStruktur'
export { faktaMilikOrgan, kunciMilikOrgan, type OrganFakta, type CalonOrgan } from './engine/faktaMilikOrgan'
export { namaBagianAtlas } from './engine/namaBagianAtlas'
export { selubungAtlas } from './engine/selubungAtlas'
export { classifyTissue, tissueShading, type TissueClass, type TissueShading } from './engine/tissueShading'
export { matchBakedAo, aoToVertexColors, type AoLayerEntry, type AoMatch } from './engine/bakedAo'
export { applyBakedAoToLayer } from './adapters/bakedAoLayer'
export {
  parseMotionTimeline,
  parseMotionLibrary,
  movementAt,
  advanceClock,
  scrubToTime,
  MOTION_SPEEDS,
  type MotionTimeline,
  type MotionTruthClass,
  type MotionMovement,
  type MotionClock,
  type MotionSpeed,
} from './engine/motionTimeline'
export {
  QUALITY_PRESETS,
  FRAME_BUDGET_MS,
  frameStats,
  nextAutoPreset,
  stepAuto,
  type AutoState,
  initialPreset,
  effectivePixelRatio,
  type QualityPreset,
  type QualityChoice,
  type QualitySettings,
  type FrameStats,
} from './engine/renderQuality'
export {
  ANATOMICAL_VIEWS,
  viewPose,
  smootherstep,
  stepTween,
  type AnatomicalView,
  type CameraPose,
  type CameraTween,
  type Vec3,
} from './engine/cameraViews'
export { mergeRigMeshes, structureAtFace, type MergeResult, type MergedRange } from './adapters/mergeRigMeshes'
