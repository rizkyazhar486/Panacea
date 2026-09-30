import {
  isConsentActive,
  validateLongitudinalEvent,
  type ClinicianReviewEnvelope,
  type ConsentEnvelope,
  type ConsentPurpose,
  type LongitudinalEvent,
} from './panaceaLongitudinalState.ts'

/**
 * Embodied Workflow Observation OS
 *
 * Converts already-authorized perception output (egocentric/head-mounted camera,
 * room camera, phone, AR glasses, or fused sensors) into a governed evidence graph.
 *
 * It deliberately does NOT perform covert capture, identity inference, diagnosis,
 * operative navigation, or autonomous clinical action. Perception adapters remain
 * replaceable; this file owns the stable Panacea contract and canonical-state bridge.
 */
export const EMBODIED_WORKFLOW_OS_POLICY = {
  covertCaptureAllowed: false,
  patientIdentityInferenceAllowed: false,
  operatorIdentityInferenceAllowed: false,
  rawMediaInCanonicalStateAllowed: false,
  protocolComplianceClaimWithoutHumanReviewAllowed: false,
  autonomousClinicalActionAllowed: false,
  patientSpecificSurgicalNavigationAllowed: false,
  medicationOrDeviceActuationAllowed: false,
  modelEstimateMayOverwriteMeasuredTruth: false,
  explicitPatientBindingRequiredForCanonicalWrite: true,
} as const

export type EmbodiedWorkflowContextKind =
  | 'laboratory'
  | 'clinical-care'
  | 'procedure-education'
  | 'rehabilitation'
  | 'self-care'

export type EmbodiedCaptureSourceKind =
  | 'head-mounted-camera'
  | 'room-camera'
  | 'mobile-camera'
  | 'ar-glasses'
  | 'mixed-sensor'

export type EmbodiedDetectionKind =
  | 'hand'
  | 'instrument'
  | 'container'
  | 'reagent'
  | 'device'
  | 'anatomy'
  | 'workspace'
  | 'other'

export type EmbodiedHandedness = 'left' | 'right' | 'unknown'

export interface NormalizedBoundingBox {
  xMin: number
  yMin: number
  xMax: number
  yMax: number
}

export interface EmbodiedDetection {
  id: string
  kind: EmbodiedDetectionKind
  label: string
  confidence: number
  handedness?: EmbodiedHandedness
  trackId?: string
  box?: NormalizedBoundingBox
  sourceRef?: string
}

export interface HandObjectRelationEvidence {
  id: string
  handDetectionId: string
  objectDetectionId: string
  actionLabel: string
  spatialConfidence: number
  temporalConfidence: number
  contactConfidence: number
  actionConfidence: number
  sourceRef?: string
}

export interface EmbodiedWorkflowFrame {
  id: string
  workspaceId: string
  capturedAt: string
  source: {
    kind: EmbodiedCaptureSourceKind
    id: string
    modelVersion?: string
    calibrationRef?: string
  }
  detections: readonly EmbodiedDetection[]
  relations: readonly HandObjectRelationEvidence[]
}

export interface ProtocolInteractionRequirement {
  id: string
  objectLabels: readonly string[]
  actionLabels?: readonly string[]
  handedness?: EmbodiedHandedness
  minInteractionConfidence?: number
}

export interface ProtocolStepDefinition {
  id: string
  label: string
  requirements: readonly ProtocolInteractionRequirement[]
  weight?: number
  supportThreshold?: number
}

export interface WorkflowProtocolDefinition {
  id: string
  version: string
  label: string
  contextKinds?: readonly EmbodiedWorkflowContextKind[]
  steps: readonly ProtocolStepDefinition[]
  provenanceRef: string
}

export interface EmbodiedInteraction {
  id: string
  frameId: string
  capturedAt: string
  handDetectionId: string
  handedness: EmbodiedHandedness
  objectDetectionId: string
  objectLabel: string
  objectKind: EmbodiedDetectionKind
  actionLabel: string
  confidence: number
  evidence: {
    handConfidence: number
    objectConfidence: number
    spatialConfidence: number
    temporalConfidence: number
    contactConfidence: number
    actionConfidence: number
  }
  sourceRefs: readonly string[]
}

export type ProtocolStepEvidenceState = 'supported-candidate' | 'partial' | 'unobserved'

export interface ProtocolStepEvidence {
  stepId: string
  label: string
  state: ProtocolStepEvidenceState
  coverage: number
  confidence: number
  matchedRequirementIds: readonly string[]
  missingRequirementIds: readonly string[]
  supportingInteractionIds: readonly string[]
  earliestEvidenceAt?: string
  latestEvidenceAt?: string
}

export type ProtocolSequenceEvidence =
  | 'not-applicable'
  | 'consistent-candidate'
  | 'out-of-order-candidate'
  | 'insufficient-evidence'

export interface EmbodiedWorkflowEpisode {
  id: string
  contextKind: EmbodiedWorkflowContextKind
  workspaceId: string
  capturedFrom: string
  capturedTo: string
  sourceIds: readonly string[]
  interactions: readonly EmbodiedInteraction[]
  protocol: null | {
    id: string
    version: string
    label: string
    provenanceRef: string
  }
  stepEvidence: readonly ProtocolStepEvidence[]
  protocolCoverage: number | null
  protocolCoverageGap: number | null
  inferenceConfidence: number
  uncertaintyIndex: number
  sequenceEvidence: ProtocolSequenceEvidence
  boundary: {
    rawMediaEmbedded: false
    subjectIdentityInferred: false
    operatorIdentityInferred: false
    protocolComplianceEstablished: false
    autonomousClinicalActionAllowed: false
    patientSpecificNavigationAllowed: false
  }
}

const INTERACTION_WEIGHTS = {
  hand: 0.20,
  object: 0.20,
  spatial: 0.20,
  temporal: 0.15,
  contact: 0.15,
  action: 0.10,
} as const

function nonBlank(value: string, field: string) {
  const normalized = value.trim()
  if (!normalized) throw new Error(field + ' must not be blank')
  return normalized
}

function parseIso(value: string, field: string) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) throw new Error(field + ' must be a valid ISO timestamp')
  return timestamp
}

function confidence(value: number, field: string) {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(field + ' must be finite and inside [0, 1]')
  }
  return value
}

function clamp01(value: number) {
  if (value <= 0) return 0
  if (value >= 1) return 1
  return value
}

function normalizeLabel(value: string) {
  return nonBlank(value, 'label').toLocaleLowerCase()
}

function validateBox(box: NormalizedBoundingBox, field: string) {
  confidence(box.xMin, field + '.xMin')
  confidence(box.yMin, field + '.yMin')
  confidence(box.xMax, field + '.xMax')
  confidence(box.yMax, field + '.yMax')
  if (box.xMax <= box.xMin || box.yMax <= box.yMin) {
    throw new Error(field + ' must have positive width and height')
  }
}

function weightedGeometricMean(
  values: readonly { value: number; weight: number; field: string }[],
) {
  if (!values.length) return 0
  let totalWeight = 0
  let logSum = 0
  for (const item of values) {
    confidence(item.value, item.field)
    if (!Number.isFinite(item.weight) || item.weight <= 0) {
      throw new Error(item.field + ' weight must be finite and positive')
    }
    if (item.value === 0) return 0
    totalWeight += item.weight
    logSum += item.weight * Math.log(item.value)
  }
  return clamp01(Math.exp(logSum / totalWeight))
}

function arithmeticMean(values: readonly number[]) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function validateFrame(frame: EmbodiedWorkflowFrame) {
  nonBlank(frame.id, 'frame.id')
  nonBlank(frame.workspaceId, 'frame.workspaceId')
  nonBlank(frame.source.id, 'frame.source.id')
  parseIso(frame.capturedAt, 'frame.capturedAt')

  const detectionById = new Map<string, EmbodiedDetection>()
  for (const detection of frame.detections) {
    const id = nonBlank(detection.id, 'detection.id')
    if (detectionById.has(id)) throw new Error('duplicate detection id: ' + id)
    nonBlank(detection.label, 'detection.label')
    confidence(detection.confidence, 'detection.confidence')
    if (detection.box) validateBox(detection.box, 'detection.box')
    detectionById.set(id, detection)
  }

  const relationIds = new Set<string>()
  for (const relation of frame.relations) {
    const relationId = nonBlank(relation.id, 'relation.id')
    if (relationIds.has(relationId)) throw new Error('duplicate relation id: ' + relationId)
    relationIds.add(relationId)
    nonBlank(relation.actionLabel, 'relation.actionLabel')
    confidence(relation.spatialConfidence, 'relation.spatialConfidence')
    confidence(relation.temporalConfidence, 'relation.temporalConfidence')
    confidence(relation.contactConfidence, 'relation.contactConfidence')
    confidence(relation.actionConfidence, 'relation.actionConfidence')

    const hand = detectionById.get(relation.handDetectionId)
    const object = detectionById.get(relation.objectDetectionId)
    if (!hand) throw new Error('relation hand detection is missing: ' + relation.handDetectionId)
    if (!object) throw new Error('relation object detection is missing: ' + relation.objectDetectionId)
    if (hand.kind !== 'hand') throw new Error('relation handDetectionId must reference a hand')
    if (object.kind === 'hand') throw new Error('relation objectDetectionId must reference a non-hand object')
  }

  return detectionById
}

/**
 * C_interaction = product(c_k ^ w_k)
 *
 * Weights:
 * hand 0.20, object 0.20, spatial 0.20, temporal 0.15,
 * contact 0.15, action 0.10.
 *
 * A weighted geometric mean is deliberately used so one weak evidence channel
 * suppresses confidence instead of being hidden by several strong channels.
 */
export function calculateEmbodiedInteractionConfidence(input: {
  handConfidence: number
  objectConfidence: number
  spatialConfidence: number
  temporalConfidence: number
  contactConfidence: number
  actionConfidence: number
}) {
  return weightedGeometricMean([
    { value: input.handConfidence, weight: INTERACTION_WEIGHTS.hand, field: 'handConfidence' },
    { value: input.objectConfidence, weight: INTERACTION_WEIGHTS.object, field: 'objectConfidence' },
    { value: input.spatialConfidence, weight: INTERACTION_WEIGHTS.spatial, field: 'spatialConfidence' },
    { value: input.temporalConfidence, weight: INTERACTION_WEIGHTS.temporal, field: 'temporalConfidence' },
    { value: input.contactConfidence, weight: INTERACTION_WEIGHTS.contact, field: 'contactConfidence' },
    { value: input.actionConfidence, weight: INTERACTION_WEIGHTS.action, field: 'actionConfidence' },
  ])
}

export function buildEmbodiedInteractionGraph(frame: EmbodiedWorkflowFrame): EmbodiedInteraction[] {
  const detectionById = validateFrame(frame)

  return [...frame.relations]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((relation) => {
      const hand = detectionById.get(relation.handDetectionId)!
      const object = detectionById.get(relation.objectDetectionId)!
      const evidence = {
        handConfidence: hand.confidence,
        objectConfidence: object.confidence,
        spatialConfidence: relation.spatialConfidence,
        temporalConfidence: relation.temporalConfidence,
        contactConfidence: relation.contactConfidence,
        actionConfidence: relation.actionConfidence,
      }
      const sourceRefs = [
        hand.sourceRef,
        object.sourceRef,
        relation.sourceRef,
      ].filter((value): value is string => Boolean(value?.trim()))

      return {
        id: relation.id,
        frameId: frame.id,
        capturedAt: frame.capturedAt,
        handDetectionId: hand.id,
        handedness: hand.handedness ?? 'unknown',
        objectDetectionId: object.id,
        objectLabel: object.label.trim(),
        objectKind: object.kind,
        actionLabel: relation.actionLabel.trim(),
        confidence: calculateEmbodiedInteractionConfidence(evidence),
        evidence,
        sourceRefs: [...new Set(sourceRefs)],
      }
    })
}

function validateProtocol(protocol: WorkflowProtocolDefinition) {
  nonBlank(protocol.id, 'protocol.id')
  nonBlank(protocol.version, 'protocol.version')
  nonBlank(protocol.label, 'protocol.label')
  nonBlank(protocol.provenanceRef, 'protocol.provenanceRef')
  if (!protocol.steps.length) throw new Error('protocol.steps must not be empty')

  const stepIds = new Set<string>()
  for (const step of protocol.steps) {
    const stepId = nonBlank(step.id, 'protocol.step.id')
    if (stepIds.has(stepId)) throw new Error('duplicate protocol step id: ' + stepId)
    stepIds.add(stepId)
    nonBlank(step.label, 'protocol.step.label')
    if (!step.requirements.length) throw new Error('protocol step requirements must not be empty')
    if (step.weight !== undefined && (!Number.isFinite(step.weight) || step.weight <= 0)) {
      throw new Error('protocol step weight must be finite and positive')
    }
    if (step.supportThreshold !== undefined) confidence(step.supportThreshold, 'protocol.step.supportThreshold')

    const requirementIds = new Set<string>()
    for (const requirement of step.requirements) {
      const requirementId = nonBlank(requirement.id, 'protocol.requirement.id')
      if (requirementIds.has(requirementId)) throw new Error('duplicate protocol requirement id: ' + requirementId)
      requirementIds.add(requirementId)
      if (!requirement.objectLabels.length) throw new Error('protocol requirement objectLabels must not be empty')
      requirement.objectLabels.forEach((label) => nonBlank(label, 'protocol.requirement.objectLabel'))
      requirement.actionLabels?.forEach((label) => nonBlank(label, 'protocol.requirement.actionLabel'))
      if (requirement.minInteractionConfidence !== undefined) {
        confidence(requirement.minInteractionConfidence, 'protocol.requirement.minInteractionConfidence')
      }
    }
  }
}

function matchesRequirement(
  interaction: EmbodiedInteraction,
  requirement: ProtocolInteractionRequirement,
) {
  const objectLabels = new Set(requirement.objectLabels.map(normalizeLabel))
  if (!objectLabels.has(normalizeLabel(interaction.objectLabel))) return false

  if (requirement.actionLabels?.length) {
    const actionLabels = new Set(requirement.actionLabels.map(normalizeLabel))
    if (!actionLabels.has(normalizeLabel(interaction.actionLabel))) return false
  }

  if (requirement.handedness && interaction.handedness !== requirement.handedness) return false
  if (interaction.confidence < (requirement.minInteractionConfidence ?? 0)) return false
  return true
}

/**
 * C_step = coverage * GM(C_interaction matched)
 *
 * coverage = matched_required_interactions / total_required_interactions
 */
export function scoreProtocolStep(
  step: ProtocolStepDefinition,
  interactions: readonly EmbodiedInteraction[],
): ProtocolStepEvidence {
  const used = new Set<string>()
  const matches: Array<{ requirementId: string; interaction: EmbodiedInteraction }> = []
  const missing: string[] = []

  for (const requirement of step.requirements) {
    const best = interactions
      .filter((interaction) => !used.has(interaction.id) && matchesRequirement(interaction, requirement))
      .sort((left, right) => right.confidence - left.confidence
        || Date.parse(left.capturedAt) - Date.parse(right.capturedAt)
        || left.id.localeCompare(right.id))[0]

    if (!best) {
      missing.push(requirement.id)
      continue
    }
    used.add(best.id)
    matches.push({ requirementId: requirement.id, interaction: best })
  }

  const coverage = step.requirements.length ? matches.length / step.requirements.length : 0
  const matchedConfidence = weightedGeometricMean(
    matches.map((match) => ({
      value: match.interaction.confidence,
      weight: 1,
      field: 'interaction.confidence',
    })),
  )
  const stepConfidence = clamp01(coverage * matchedConfidence)
  const threshold = step.supportThreshold ?? 0.72
  const state: ProtocolStepEvidenceState = matches.length === 0
    ? 'unobserved'
    : coverage === 1 && stepConfidence >= threshold
      ? 'supported-candidate'
      : 'partial'

  const ordered = matches
    .map((match) => match.interaction)
    .sort((left, right) => Date.parse(left.capturedAt) - Date.parse(right.capturedAt) || left.id.localeCompare(right.id))

  return {
    stepId: step.id,
    label: step.label,
    state,
    coverage,
    confidence: stepConfidence,
    matchedRequirementIds: matches.map((match) => match.requirementId),
    missingRequirementIds: missing,
    supportingInteractionIds: matches.map((match) => match.interaction.id),
    earliestEvidenceAt: ordered[0]?.capturedAt,
    latestEvidenceAt: ordered[ordered.length - 1]?.capturedAt,
  }
}

function sequenceEvidenceForSteps(steps: readonly ProtocolStepEvidence[]): ProtocolSequenceEvidence {
  if (!steps.length) return 'not-applicable'
  if (steps.some((step) => step.state === 'unobserved' || !step.earliestEvidenceAt)) {
    return 'insufficient-evidence'
  }

  let previous = Number.NEGATIVE_INFINITY
  for (const step of steps) {
    const current = Date.parse(step.earliestEvidenceAt!)
    if (current < previous) return 'out-of-order-candidate'
    previous = current
  }
  return 'consistent-candidate'
}

export function buildEmbodiedWorkflowEpisode(input: {
  id: string
  contextKind: EmbodiedWorkflowContextKind
  frames: readonly EmbodiedWorkflowFrame[]
  protocol?: WorkflowProtocolDefinition
}): EmbodiedWorkflowEpisode {
  nonBlank(input.id, 'episode.id')
  if (!input.frames.length) throw new Error('episode.frames must not be empty')

  const frameIds = new Set<string>()
  for (const frame of input.frames) {
    if (frameIds.has(frame.id)) throw new Error('duplicate episode frame id: ' + frame.id)
    frameIds.add(frame.id)
    validateFrame(frame)
  }

  const frames = [...input.frames].sort((left, right) =>
    Date.parse(left.capturedAt) - Date.parse(right.capturedAt) || left.id.localeCompare(right.id))

  const workspaceId = frames[0]!.workspaceId
  if (frames.some((frame) => frame.workspaceId !== workspaceId)) {
    throw new Error('one embodied workflow episode must use one workspaceId')
  }

  if (input.protocol) {
    validateProtocol(input.protocol)
    if (input.protocol.contextKinds?.length && !input.protocol.contextKinds.includes(input.contextKind)) {
      throw new Error('protocol is not declared for episode context kind')
    }
  }

  const interactions = frames.flatMap(buildEmbodiedInteractionGraph)
    .sort((left, right) => Date.parse(left.capturedAt) - Date.parse(right.capturedAt) || left.id.localeCompare(right.id))

  const stepEvidence = input.protocol
    ? input.protocol.steps.map((step) => scoreProtocolStep(step, interactions))
    : []

  const totalStepWeight = input.protocol
    ? input.protocol.steps.reduce((sum, step) => sum + (step.weight ?? 1), 0)
    : 0

  const protocolCoverage = input.protocol
    ? input.protocol.steps.reduce((sum, step, index) =>
      sum + stepEvidence[index]!.coverage * (step.weight ?? 1), 0) / totalStepWeight
    : null

  const inferenceConfidence = input.protocol
    ? input.protocol.steps.reduce((sum, step, index) =>
      sum + stepEvidence[index]!.confidence * (step.weight ?? 1), 0) / totalStepWeight
    : arithmeticMean(interactions.map((interaction) => interaction.confidence))

  return {
    id: input.id.trim(),
    contextKind: input.contextKind,
    workspaceId,
    capturedFrom: frames[0]!.capturedAt,
    capturedTo: frames[frames.length - 1]!.capturedAt,
    sourceIds: [...new Set(frames.map((frame) => frame.source.id))].sort(),
    interactions,
    protocol: input.protocol
      ? {
        id: input.protocol.id,
        version: input.protocol.version,
        label: input.protocol.label,
        provenanceRef: input.protocol.provenanceRef,
      }
      : null,
    stepEvidence,
    protocolCoverage,
    protocolCoverageGap: protocolCoverage === null ? null : clamp01(1 - protocolCoverage),
    inferenceConfidence: clamp01(inferenceConfidence),
    uncertaintyIndex: clamp01(1 - inferenceConfidence),
    sequenceEvidence: sequenceEvidenceForSteps(stepEvidence),
    boundary: {
      rawMediaEmbedded: false,
      subjectIdentityInferred: false,
      operatorIdentityInferred: false,
      protocolComplianceEstablished: false,
      autonomousClinicalActionAllowed: false,
      patientSpecificNavigationAllowed: false,
    },
  }
}

export interface EmbodiedWorkflowCanonicalBinding {
  subjectId: string
  purpose: ConsentPurpose
  consent: ConsentEnvelope
  receivedAt: string
  review?: ClinicianReviewEnvelope
  sourceId?: string
}

/**
 * Writes only a compact derived summary into Canonical Longitudinal State.
 * Raw video, face identity, biometric identity, and pixel geometry are excluded.
 *
 * Until an identified human reviewer accepts the result, the event remains
 * semanticState = model-estimated.
 */
export function buildEmbodiedWorkflowLongitudinalEvent(
  episode: EmbodiedWorkflowEpisode,
  binding: EmbodiedWorkflowCanonicalBinding,
): LongitudinalEvent {
  const subjectId = nonBlank(binding.subjectId, 'binding.subjectId')
  const receivedAtMs = parseIso(binding.receivedAt, 'binding.receivedAt')
  const fromMs = parseIso(episode.capturedFrom, 'episode.capturedFrom')
  const toMs = parseIso(episode.capturedTo, 'episode.capturedTo')

  if (receivedAtMs < toMs) throw new Error('binding.receivedAt must not be before episode completion')
  if (!isConsentActive(binding.consent, binding.purpose, fromMs)
    || !isConsentActive(binding.consent, binding.purpose, toMs)) {
    throw new Error('purpose consent must be active across the complete embodied workflow episode')
  }

  const review = binding.review ?? { state: 'pending' as const }
  const semanticState = review.state === 'accepted' ? 'clinician-reviewed' : 'model-estimated'

  const event: LongitudinalEvent = {
    id: 'embodied-workflow:' + episode.id,
    subjectId,
    domain: 'other',
    metric: 'embodied-workflow-episode',
    value: {
      episodeId: episode.id,
      contextKind: episode.contextKind,
      workspaceId: episode.workspaceId,
      capturedFrom: episode.capturedFrom,
      capturedTo: episode.capturedTo,
      protocol: episode.protocol,
      protocolCoverage: episode.protocolCoverage,
      protocolCoverageGap: episode.protocolCoverageGap,
      inferenceConfidence: episode.inferenceConfidence,
      uncertaintyIndex: episode.uncertaintyIndex,
      sequenceEvidence: episode.sequenceEvidence,
      stepEvidence: episode.stepEvidence,
      interactionSummary: episode.interactions.map((interaction) => ({
        capturedAt: interaction.capturedAt,
        handedness: interaction.handedness,
        objectLabel: interaction.objectLabel,
        objectKind: interaction.objectKind,
        actionLabel: interaction.actionLabel,
        confidence: interaction.confidence,
      })),
      purpose: binding.purpose,
      boundary: episode.boundary,
    },
    recordedAt: episode.capturedTo,
    confidence: episode.inferenceConfidence,
    semanticState,
    provenance: {
      sourceKind: 'derived',
      sourceId: binding.sourceId?.trim() || ('embodied:' + episode.sourceIds.join('+')),
      capturedAt: episode.capturedFrom,
      receivedAt: binding.receivedAt,
      method: 'embodied-workflow-os-v1-derived-summary',
      version: '1',
    },
    consent: { ...binding.consent, purposes: [...binding.consent.purposes] },
    review: { ...review },
    tags: [
      'embodied-workflow',
      episode.contextKind,
      ...(episode.protocol ? ['protocol:' + episode.protocol.id] : []),
    ],
  }

  validateLongitudinalEvent(event)
  return event
}
