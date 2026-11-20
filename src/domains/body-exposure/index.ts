// API lintas-domain; pertahankan nama publik dan kurasi setiap ekspor baru.

// ── MODEL ──────────────────────────────────────────
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


// ── ENGINE: GROSS ANATOMY ──────────────────────────────────────────
export { kalimatPertama } from './engine/kalimatPertama'

export { jenisDariNamaStruktur } from './engine/jenisStruktur'

export { faktaMilikOrgan, kunciMilikOrgan, type OrganFakta, type CalonOrgan } from './engine/faktaMilikOrgan'

export { namaBagianAtlas } from './engine/namaBagianAtlas'

export { selubungAtlas } from './engine/selubungAtlas'

export { searchStructures, type StructureSearchRow, type StructureSearchMatch, type StructureOntology } from './engine/structureSearch'

export {
  ATLAS_LAYERS,
  ANATOMICAL_REGIONS,
  type AtlasStage,
  type LayerSpec,
  type SelectedStructureInfo,
} from './engine/atlasHomeConfig'

export {
  atlasEnvelope,
  organFactIndex,
  organKeyIndex,
  firstSentence,
  atlasRegionNames,
  structureTypeFromName,
  diagnosticImagingEngine,
} from './engine/structureAtlas'


// ── ENGINE: RENDERING ──────────────────────────────────────────
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

export { classifyTissue, tissueShading, type TissueClass, type TissueShading } from './engine/tissueShading'

export { matchBakedAo, aoToVertexColors, type AoLayerEntry, type AoMatch } from './engine/bakedAo'

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

export { type PresentationLighting } from './engine/presentationLighting'


// ── ENGINE: IMAGING ──────────────────────────────────────────
export { FETAL_PARCEL_COLORS, parseFetalParcelDataset, visibleParcelTriangles, wholeLungOverlap, type FetalParcelDataset, type FetalParcelRegion } from './engine/fetalParcelInspection'

export { parseFetalMriContext, type FetalMriContext, type FetalMriRegion, type FetalMriImage } from './engine/fetalMriContext'

export {
  correlateImagingPlane, type ImagingPlane, type AtlasBox, type PlaneResult,
  IMAGING_PLANE_DISCLAIMER,
  correlateImagingPlaneWithStructures,
  type ImagingPlaneCorrelationFailure,
  type ImagingPlaneCorrelationResult,
  type ImagingPlaneCorrelationSuccess,
  type ImagingPlaneFailureReason,
  type ImagingSliceDefinition,
  type LpsAnatomicalBoundingBox3D,
  type LpsVector3D,
  type RadiologicalPlaneOrientation,
} from './engine/imagingPlaneEngine'

export {
  computeSubsurfacePenetrationDepth,
  computeTissueDiffuseTransmittance,
  computeDirectionalLightVector,
  classifyHounsfieldLayer,
  evaluateHounsfieldTransferFunction,
  intersectRayAabb,
  computeMprSliceCoordinates,
  createDefaultKaloLumenState,
  DIAGNOSTIC_CT_PRESETS,
  type DiagnosticCtWindowPreset,
  type DiagnosticCtWindowPresetId,
  type KaloLumenLayerId,
  type MultiPlanarViewMode,
  type OpticalSubsurfaceScatteringProperties,
  type KaloLumenDensityLayerConfig,
  type DirectionalLightSourceState,
  type MultiPlanarClippingPlane,
  type KaloLumenEngineState,
  type RayAabbIntersectionResult,
  type MprSliceCoordinates,
} from './engine/kaloLumenDicomEngine'


// ── ENGINE: PHYSIOLOGY ──────────────────────────────────────────
export {
  cycleAt,
  DEFAULT_BREATH_PERIOD_S,
  parseRespiratoryModel,
  sampleRespiration,
  type ParseRespiratory,
  type RespirationSample,
  type RespiratoryModel,
} from './engine/respiratoryMotion'

export { cardiacStateAt, validateParams as validateCardiacParams, phaseDurations, DEFAULT_PARAMS as DEFAULT_CARDIAC_PARAMS, DEFAULT_HR, HR_MIN as CARDIAC_HR_MIN, HR_MAX as CARDIAC_HR_MAX, PHASE_LABEL as CARDIAC_PHASE_LABEL, type CardiacParams, type CardiacState, type CardiacPhase } from './engine/cardiacCycle'

export {
  evaluateCardiopulmonaryCoupling,
  CARDIOPULMONARY_DISCLAIMER,
  CARDIOPULMONARY_PROVENANCE,
  CARDIOPULMONARY_SCENARIO_PRESETS,
  type CardiopulmonaryInput,
  type CardiopulmonaryResult,
  type CardiopulmonaryScenario,
  type CardiopulmonarySuccess,
  type CardiopulmonaryFailure,
  type PvLoopPoint,
} from './engine/cardiopulmonaryCouplingEngine'

export {
  VQ_EQUATION_SOURCE,
  VQ_LAB_DISCLAIMER,
  evaluateVqAndAlveolarGradient,
  type AlveolarGasInput,
  type VqFailureReason,
  type VqMismatchFailure,
  type VqMismatchResult,
  type VqMismatchSuccess,
  type VqPhysiologicalRegime,
} from './engine/vqMismatchEngine'


// ── ENGINE: CLINICAL CORRELATION ──────────────────────────────────────────
export {
  OCULOMOTOR_GAZE,
  OCULOMOTOR_LESION_OPTIONS,
  OCULOMOTOR_REFERENCE,
  OCULOMOTOR_SYNDROME_OPTIONS,
  prismDioptersFromDegrees,
  simulateOculomotor,
} from './engine/oculomotorLesionEngine'

export {
  AHA17_CORONARY_TERRITORY_SOURCE,
  AHA17_CORONARY_TERRITORY_TABLE,
  AHA17_LIMITATIONS,
  AHA17_RINGS,
  AHA17_SEGMENT_COUNT,
  AHA17_SEGMENT_NAMES,
  AHA17_SOURCES,
  AHA17_TERRITORY_LIMITATIONS,
  ATLAS_REFERENCE_LABEL,
  DOMINANCE_PREVALENCE,
  branchForSegment,
  evaluateAHA17PerfusionBurden,
  mapCoronaryToAHA17,
  territoryForArtery,
  type CoronaryArtery,
  type CoronaryArteryId,
  type CoronaryBranch,
  type CoronaryDominanceColumns,
  type CoronaryDominanceInput,
  type CoronaryTerritoryTable,
  type CoronaryTerritoryTableRow,
  type Dominance,
  type EvidenceKind,
  type KnownCoronaryDominance,
  type MapCoronaryOptions,
  type PerfusionBurdenInput,
  type PerfusionBurdenResult,
  type SegmentEvidence,
  type SegmentInfo,
  type SegmentResult,
  type TerritoryResult,
  type VascularFailureReason,
  type VascularMapping,
  type VascularMappingFailure,
  type VascularMappingSuccess,
  type VascularTerritorySource,
  type VascularTruthClass,
} from './engine/vascularTerritoryEngine'

export {
  LESION_ATLAS_DISCLAIMER,
  LESION_LOCALIZER_SOURCE,
  NEURO_SYNDROME_CATALOG,
  localizeNeurologicalLesion,
  type CranialNerveFinding,
  type CranialNerveId,
  type Laterality,
  type LesionCandidateMatch,
  type LesionFailureReason,
  type LesionLocalizationFailure,
  type LesionLocalizationInput,
  type LesionLocalizationResult,
  type LesionLocalizationSuccess,
  type LesionSourceReference,
  type LimbMotorFinding,
  type MotorNeuronPattern,
  type NeuroSyndromeDefinition,
  type SensoryModality,
  type SensoryTractFinding,
} from './engine/lesionLocalizerEngine'

export {
  DERMATOME_CONVERGENCE_SOURCE,
  DERMATOME_SPATIAL_ANCHORS,
  REFERRED_PAIN_DISCLAIMER,
  VISCERAL_REFERRED_PAIN_TABLE,
  calculateCentralSensitizationNociceptiveDrive,
  evaluateViscerosomaticConvergence,
  type CalculateNociceptiveDriveInput,
  type DermatomeSpatialAnchor,
  type EvaluateReferredPainInput,
  type NociceptiveConvergenceTelemetry,
  type ReferredPainEvaluation,
  type ReferredPainFailure,
  type ReferredPainFailureReason,
  type ReferredPainSource,
  type VisceralOrganKey,
  type VisceralReferredPainRow,
  type ViscerosomaticConvergenceResult,
} from './engine/referredPainEngine'

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

export { assessMeasurement, parseFetalTables, normalCdf, GA_MIN_WEEKS, GA_MAX_WEEKS, type Assessment, type AssessResult, type FetalTables, type MeasureId, type ReferenceId } from './engine/fetalBiometry'

export {
  FETAL_GROWTH_DISCLAIMER,
  FETAL_GROWTH_SOURCE,
  evaluateHadlockFetalGrowth,
  evaluateSerialFetalGrowthVelocity,
  type FetalGrowthFailure,
  type FetalGrowthFailureReason,
  type FetalGrowthPointSuccess,
  type FetalGrowthResult,
  type FetalGrowthVelocityResult,
  type FetalGrowthVelocitySuccess,
  type HadlockBiometryInput,
} from './engine/fetalGrowthEngine'

export {
  DRUG_ACTION_DISCLAIMER,
  DRUG_MULTISCALE_TARGET_TABLE,
  IUPHAR_DRUG_ACTION_SOURCE,
  evaluateMultiscaleDrugAction,
  type CanonicalDrugId,
  type DrugActionFailure,
  type DrugActionFailureReason,
  type DrugActionResult,
  type DrugActionSource,
  type DrugActionSuccess,
  type DrugMultiscaleTargetRow,
  type HillOccupancyInput,
} from './engine/drugActionEngine'

export {
  CRANIAL_NERVES,
  BRAINSTEM_REFLEX_ARCS,
  LONG_TRACTS,
  NEURO_SYNDROMES,
  simulateReflexArc,
  evaluateNeurologicalSyndrome,
  type CranialNerveProfile,
  type BrainstemReflexArc,
  type LongTractProfile,
  type NeuroLesionSyndrome,
  type ReflexSimulationResult,
  type SyndromicDeficitResult,
} from './engine/neuroFascicularTractographyEngine'


// ── ENGINE: BIOMECHANICS & GAIT ──────────────────────────────────────────
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
  GAIT_BIOMECHANICS_SOURCE,
  GAIT_LIBRARY_DISCLAIMER,
  classifyPathologicalGaitCycle,
  type GaitCycleKinematicsInput,
  type GaitEvaluationFailure,
  type GaitEvaluationResult,
  type GaitEvaluationSuccess,
  type GaitFailureReason,
  type PathologicalGaitPatternId,
} from './engine/pathologicalGaitEngine'

export {
  KINEMATICS_SENSORIUM_METADATA,
  calculateSagittalKinematics,
  calculateVerticalGrf,
  calculateRobinsonSymmetryIndex,
  evaluateGaitSymmetry,
  synthesizeKinematicTelemetry,
  type GaitCyclePhaseId,
  type SagittalKinematicsProfile,
  type VerticalGrfProfile,
  type GaitSymmetryInput,
  type GaitSymmetryMetrics,
  type KinematicTelemetryEnvelope,
} from './engine/gaitKinematicsSensoriumEngine'

export {
  ORGAN_BIOMECHANICS_CATALOG,
  SOFT_TISSUE_BIOMECHANICS_DISCLAIMER,
  calculateNeoHookeanStress,
  generateStressStrainCurve,
  evaluatePalpationIndentation,
  evaluateDiaphragmaticExcursion,
  evaluatePeristalsis,
  GI_PERISTALSIS_CATALOG,
  type OrganMechanicalId,
  type OrganBiomechanicsProfile,
  type HyperelasticStressPoint,
  type PalpationProbeInput,
  type PalpationContactEvaluation,
  type TissueContactSafetyStatus,
  type RespirationMode,
  type RespirationExcursionInput,
  type VisceralDisplacementVector,
  type DiaphragmaticExcursionEvaluation,
  type GastrointestinalSegment,
  type PeristalsisSegmentProfile,
  type PeristalsisWavePoint,
  type PeristalsisEvaluation,
} from './engine/softTissueBiomechanicsEngine'


// ── ENGINE: DATA & REVIEW ──────────────────────────────────────────
export { DATA_GAPS, GAP_STATUS_LABEL, validateGaps, type DataGap, type GapKind, type GapStatus } from './engine/dataGaps'

export { buildOpenCellIndex, parseOpenCellIndex, searchProteins, LOCALISATIONS, LOCALISATION_LABEL, type OpenCellProtein, type PublishedOpenCell } from './engine/openCellIndex'

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

export {
  evaluateStructureReviewWorkflow,
  type StructureWorkflowFailure,
  type StructureWorkflowFailureReason,
  type StructureWorkflowInput,
  type StructureWorkflowResult,
  type StructureWorkflowSuccess,
  type WorkflowStage,
} from './engine/structureReviewWorkflowEngine'


// ── ADAPTERS ──────────────────────────────────────────
export { applyBakedAoToLayer } from './adapters/bakedAoLayer'

export { mergeRigMeshes, structureAtFace, type MergeResult, type MergedRange } from './adapters/mergeRigMeshes'

export { createPresentationLighting } from './adapters/studioLighting'


// ── UI (cross-domain only) ──────────────────────────────────────────
// Studio masih dipakai pages/bodyhub dan digital-twin; jangan internalisasi sebelum
// pemakai dimigrasi. Bukti pemakai dijaga body-exposure-api-surface.test.mjs.
export { OculomotorLesionLab } from './ui/OculomotorLesionLab'

export { AnatomicalLightingControls } from './ui/AnatomicalLightingControls'

export { KaloLumenVolumetricStudio } from './ui/KaloLumenVolumetricStudio'

export { ReferredPainDermatomeStudio } from './ui/ReferredPainDermatomeStudio'

export { OrganBiometricOverlayCard } from './ui/OrganBiometricOverlayCard'

export { OpenCellPanel } from './ui/OpenCellPanel'

export { FetalGrowthPanel } from './ui/FetalGrowthPanel'

export { PerfusionChainPanel } from './ui/PerfusionChainPanel'

export { CoronaryTerritoryPanel } from './ui/CoronaryTerritoryPanel'

export { CardiopulmonaryCouplingDeck } from './ui/CardiopulmonaryCouplingDeck'

export {
  SoftTissueBiomechanicsDeck,
  type SoftTissueBiomechanicsDeckProps,
} from './ui/SoftTissueBiomechanicsDeck'

export { NeuroFascicularReflexDeck } from './ui/NeuroFascicularReflexDeck'

export { BodyExposureAtlasHome } from './ui/BodyExposureAtlasHome'
