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
  CROSSFADE_S,
  crossfadeWeight,
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
export {
  STRUCTURE_REVIEW_CHECKLIST,
  MAX_NOTES,
  requiredCheckIds,
  reviewReadiness,
  buildReviewRecord,
  recordApproves,
  type StructureMethod,
  type ReviewDecision,
  type StructureReviewCheck,
  type StructureReviewRecord,
  type ReviewInput,
  type ApprovalContext,
} from './engine/structureReview'
export { reviewLabel, type ReviewLabel } from './engine/reviewLabel'
export { createPresentationLighting } from './adapters/studioLighting'
export { AnatomicalLightingControls } from './ui/AnatomicalLightingControls'
export { type PresentationLighting } from './engine/presentationLighting'

export {
  cycleAt,
  DEFAULT_BREATH_PERIOD_S,
  parseRespiratoryModel,
  sampleRespiration,
  type ParseRespiratory,
  type RespirationSample,
  type RespiratoryModel,
} from './engine/respiratoryMotion'

export { DATA_GAPS, GAP_STATUS_LABEL, validateGaps, type DataGap, type GapKind, type GapStatus } from './engine/dataGaps'

export { OpenCellPanel } from './ui/OpenCellPanel'
export { searchStructures, type StructureSearchRow, type StructureSearchMatch, type StructureOntology } from './engine/structureSearch'
export { buildOpenCellIndex, parseOpenCellIndex, searchProteins, LOCALISATIONS, LOCALISATION_LABEL, type OpenCellProtein, type PublishedOpenCell } from './engine/openCellIndex'

export { cardiacStateAt, validateParams as validateCardiacParams, phaseDurations, DEFAULT_PARAMS as DEFAULT_CARDIAC_PARAMS, DEFAULT_HR, HR_MIN as CARDIAC_HR_MIN, HR_MAX as CARDIAC_HR_MAX, PHASE_LABEL as CARDIAC_PHASE_LABEL, type CardiacParams, type CardiacState, type CardiacPhase } from './engine/cardiacCycle'
export { FetalGrowthPanel } from './ui/FetalGrowthPanel'
export { PerfusionChainPanel } from './ui/PerfusionChainPanel'
export { assessMeasurement, parseFetalTables, normalCdf, GA_MIN_WEEKS, GA_MAX_WEEKS, type Assessment, type AssessResult, type FetalTables, type MeasureId, type ReferenceId } from './engine/fetalBiometry'
export { FETAL_PARCEL_COLORS, parseFetalParcelDataset, visibleParcelTriangles, wholeLungOverlap, type FetalParcelDataset, type FetalParcelRegion } from './engine/fetalParcelInspection'
export { parseFetalMriContext, type FetalMriContext, type FetalMriRegion, type FetalMriImage } from './engine/fetalMriContext'

export {
  ATLAS_STRUCTURE_DISCLAIMER,
  CANONICAL_ORGAN_BINDINGS,
  EXPECTED_METRIC_UNITS,
  OVERLAY_LABEL,
  aggregateLongitudinalOrganOverlay,
  computeCanonicalRecordOverlays,
  resolveAnatomicalOverlayBinding,
  type AnatomicalMultiscaleBinding,
  type CanonicalRecordInput,
  type ComputeOverlayOptions,
  type ConversionProvenance,
  type ExpectedMetricUnit,
  type LongitudinalMetricSeries,
  type LongitudinalSeriesResult,
  type MeasurementDimension,
  type OverlayRejectionReason,
  type OverlayTruthClass,
  type RecordOverlayRejectionItem,
  type RecordOverlayResultItem,
  type RecordOverlaySuccessItem,
  type UnitConversionRule,
} from './engine/recordOverlayEngine'
