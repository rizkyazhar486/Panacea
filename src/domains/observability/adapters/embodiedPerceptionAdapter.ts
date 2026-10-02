import {
  buildEmbodiedInteractionGraph,
  type EmbodiedCaptureSourceKind,
  type EmbodiedDetection,
  type EmbodiedDetectionKind,
  type EmbodiedHandedness,
  type EmbodiedWorkflowFrame,
  type HandObjectRelationEvidence,
  type NormalizedBoundingBox,
} from '../../../lib/embodiedWorkflowOS.ts'

export const EMBODIED_PERCEPTION_ADAPTER_POLICY = {
  schemaVersion: '1',
  maxDetectionsPerPacket: 512,
  maxRelationsPerPacket: 1024,
  rawMediaAccepted: false,
  identityFieldsAccepted: false,
  captureAuthorizationRequired: true,
  sourceModelVersionRequired: true,
} as const

const CAPTURE_SOURCE_KINDS: readonly EmbodiedCaptureSourceKind[] = [
  'head-mounted-camera',
  'room-camera',
  'mobile-camera',
  'ar-glasses',
  'mixed-sensor',
]

const DETECTION_KINDS: readonly EmbodiedDetectionKind[] = [
  'hand',
  'instrument',
  'container',
  'reagent',
  'device',
  'anatomy',
  'workspace',
  'other',
]

const HANDEDNESS: readonly EmbodiedHandedness[] = ['left', 'right', 'unknown']

const FORBIDDEN_PACKET_FIELDS = [
  'rawMedia',
  'imageData',
  'videoData',
  'audioData',
  'faceIdentity',
  'biometricIdentity',
  'patientId',
  'operatorId',
] as const

export type PerceptionContinuityGap =
  | {
      kind: 'sequence-gap'
      afterSequence: number
      beforeSequence: number
      missingPackets: number
    }
  | {
      kind: 'timestamp-regression'
      previousSequence: number
      currentSequence: number
      previousCapturedAt: string
      currentCapturedAt: string
    }

export interface EmbodiedPerceptionStream {
  sourceId: string
  workspaceId: string
  frames: readonly EmbodiedWorkflowFrame[]
  continuity: {
    firstSequence: number
    lastSequence: number
    missingPacketCount: number
    gaps: readonly PerceptionContinuityGap[]
  }
}

interface NormalizedPacket {
  sequence: number
  frame: EmbodiedWorkflowFrame
}

function asRecord(value: unknown, field: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(field + ' must be an object')
  }
  return value as Record<string, unknown>
}

function asArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(field + ' must be an array')
  return value
}

function asNonBlankString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(field + ' must be a non-blank string')
  return value.trim()
}

function optionalNonBlankString(value: unknown, field: string) {
  if (value === undefined) return undefined
  return asNonBlankString(value, field)
}

function asFiniteNumber(value: unknown, field: string) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(field + ' must be finite')
  return value
}

function asConfidence(value: unknown, field: string) {
  const normalized = asFiniteNumber(value, field)
  if (normalized < 0 || normalized > 1) throw new Error(field + ' must be inside [0, 1]')
  return normalized
}

function asNonNegativeInteger(value: unknown, field: string) {
  const normalized = asFiniteNumber(value, field)
  if (!Number.isInteger(normalized) || normalized < 0) {
    throw new Error(field + ' must be a non-negative integer')
  }
  return normalized
}

const ISO_8601_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|[+-](\d{2}):(\d{2}))$/

function isStrictIsoTimestamp(value: string) {
  const match = ISO_8601_TIMESTAMP.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6])
  const offsetHour = match[7] === undefined ? 0 : Number(match[7])
  const offsetMinute = match[8] === undefined ? 0 : Number(match[8])
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

  if (month < 1 || month > 12) return false
  if (day < 1 || day > daysInMonth[month - 1]!) return false
  if (hour > 23 || minute > 59 || second > 59) return false
  if (offsetHour > 14 || offsetMinute > 59) return false
  if (offsetHour === 14 && offsetMinute !== 0) return false
  return Number.isFinite(Date.parse(value))
}

function asIsoString(value: unknown, field: string) {
  const normalized = asNonBlankString(value, field)
  if (!isStrictIsoTimestamp(normalized)) throw new Error(field + ' must be a valid ISO timestamp')
  return normalized
}

function asEnum<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  const normalized = asNonBlankString(value, field)
  if (!allowed.includes(normalized as T)) throw new Error(field + ' is unsupported')
  return normalized as T
}

function hasOwn(record: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(record, key)
}

function assertNoForbiddenFields(packet: Record<string, unknown>) {
  const pending: unknown[] = [packet]
  const seen = new Set<object>()

  while (pending.length) {
    const current = pending.pop()
    if (current === null || typeof current !== 'object') continue
    if (seen.has(current)) continue
    seen.add(current)

    if (Array.isArray(current)) {
      pending.push(...current)
      continue
    }

    const record = current as Record<string, unknown>
    for (const field of FORBIDDEN_PACKET_FIELDS) {
      if (hasOwn(record, field)) {
        throw new Error('perception packet contains forbidden field: ' + field)
      }
    }

    pending.push(...Object.values(record))
  }
}

function normalizeBox(value: unknown, field: string): NormalizedBoundingBox | undefined {
  if (value === undefined) return undefined
  const box = asRecord(value, field)
  const normalized = {
    xMin: asConfidence(box.xMin, field + '.xMin'),
    yMin: asConfidence(box.yMin, field + '.yMin'),
    xMax: asConfidence(box.xMax, field + '.xMax'),
    yMax: asConfidence(box.yMax, field + '.yMax'),
  }
  if (normalized.xMax <= normalized.xMin || normalized.yMax <= normalized.yMin) {
    throw new Error(field + ' must have positive width and height')
  }
  return normalized
}

function normalizeDetection(value: unknown, index: number): EmbodiedDetection {
  const field = 'detections[' + index + ']'
  const detection = asRecord(value, field)
  return {
    id: asNonBlankString(detection.id, field + '.id'),
    kind: asEnum(detection.kind, DETECTION_KINDS, field + '.kind'),
    label: asNonBlankString(detection.label, field + '.label'),
    confidence: asConfidence(detection.confidence, field + '.confidence'),
    handedness: detection.handedness === undefined
      ? undefined
      : asEnum(detection.handedness, HANDEDNESS, field + '.handedness'),
    trackId: optionalNonBlankString(detection.trackId, field + '.trackId'),
    box: normalizeBox(detection.box, field + '.box'),
    sourceRef: optionalNonBlankString(detection.sourceRef, field + '.sourceRef'),
  }
}

function normalizeRelation(value: unknown, index: number): HandObjectRelationEvidence {
  const field = 'relations[' + index + ']'
  const relation = asRecord(value, field)
  return {
    id: asNonBlankString(relation.id, field + '.id'),
    handDetectionId: asNonBlankString(relation.handDetectionId, field + '.handDetectionId'),
    objectDetectionId: asNonBlankString(relation.objectDetectionId, field + '.objectDetectionId'),
    actionLabel: asNonBlankString(relation.actionLabel, field + '.actionLabel'),
    spatialConfidence: asConfidence(relation.spatialConfidence, field + '.spatialConfidence'),
    temporalConfidence: asConfidence(relation.temporalConfidence, field + '.temporalConfidence'),
    contactConfidence: asConfidence(relation.contactConfidence, field + '.contactConfidence'),
    actionConfidence: asConfidence(relation.actionConfidence, field + '.actionConfidence'),
    sourceRef: optionalNonBlankString(relation.sourceRef, field + '.sourceRef'),
  }
}

function assertCaptureAuthorization(authorizationValue: unknown, capturedAt: string) {
  const authorization = asRecord(authorizationValue, 'authorization')
  if (authorization.captureAuthorized !== true) {
    throw new Error('authorization.captureAuthorized must be true')
  }

  asNonBlankString(authorization.purposeRef, 'authorization.purposeRef')
  const authorizedAt = asIsoString(authorization.authorizedAt, 'authorization.authorizedAt')
  const capturedAtMs = Date.parse(capturedAt)
  if (Date.parse(authorizedAt) > capturedAtMs) {
    throw new Error('capture cannot precede authorization.authorizedAt')
  }

  if (authorization.expiresAt !== undefined) {
    const expiresAt = asIsoString(authorization.expiresAt, 'authorization.expiresAt')
    if (capturedAtMs >= Date.parse(expiresAt)) throw new Error('capture authorization is expired')
  }

  if (authorization.revokedAt !== undefined) {
    const revokedAt = asIsoString(authorization.revokedAt, 'authorization.revokedAt')
    if (capturedAtMs >= Date.parse(revokedAt)) throw new Error('capture authorization is revoked')
  }
}

function normalizePacket(input: unknown): NormalizedPacket {
  const packet = asRecord(input, 'packet')
  assertNoForbiddenFields(packet)

  if (packet.schemaVersion !== EMBODIED_PERCEPTION_ADAPTER_POLICY.schemaVersion) {
    throw new Error('packet.schemaVersion is unsupported')
  }

  const packetId = asNonBlankString(packet.packetId, 'packet.packetId')
  const workspaceId = asNonBlankString(packet.workspaceId, 'packet.workspaceId')
  const capturedAt = asIsoString(packet.capturedAt, 'packet.capturedAt')
  const sequence = asNonNegativeInteger(packet.sequence, 'packet.sequence')
  assertCaptureAuthorization(packet.authorization, capturedAt)

  const source = asRecord(packet.source, 'packet.source')
  const sourceId = asNonBlankString(source.id, 'packet.source.id')
  const sourceKind = asEnum(source.kind, CAPTURE_SOURCE_KINDS, 'packet.source.kind')
  const modelVersion = asNonBlankString(source.modelVersion, 'packet.source.modelVersion')
  const calibrationRef = optionalNonBlankString(source.calibrationRef, 'packet.source.calibrationRef')

  const rawDetections = asArray(packet.detections, 'packet.detections')
  if (rawDetections.length > EMBODIED_PERCEPTION_ADAPTER_POLICY.maxDetectionsPerPacket) {
    throw new Error('packet.detections exceeds adapter limit')
  }

  const rawRelations = asArray(packet.relations, 'packet.relations')
  if (rawRelations.length > EMBODIED_PERCEPTION_ADAPTER_POLICY.maxRelationsPerPacket) {
    throw new Error('packet.relations exceeds adapter limit')
  }

  const frame: EmbodiedWorkflowFrame = {
    id: packetId,
    workspaceId,
    capturedAt,
    source: {
      kind: sourceKind,
      id: sourceId,
      modelVersion,
      calibrationRef,
    },
    detections: rawDetections.map(normalizeDetection),
    relations: rawRelations.map(normalizeRelation),
  }

  // Reuse canonical graph validation so adapters cannot bypass referential integrity.
  buildEmbodiedInteractionGraph(frame)
  return { sequence, frame }
}

/**
 * Normalize one untrusted structured perception packet.
 * Raw media and identity-bearing fields are rejected at this boundary.
 */
export function adaptExternalEmbodiedPerceptionPacket(input: unknown): EmbodiedWorkflowFrame {
  return normalizePacket(input).frame
}

/**
 * Normalize an ordered packet stream without silently hiding transport loss.
 * Sequence gaps and capture-clock regressions remain explicit replay evidence.
 */
export function adaptExternalEmbodiedPerceptionStream(
  inputs: readonly unknown[],
): EmbodiedPerceptionStream {
  if (!inputs.length) throw new Error('perception stream must not be empty')

  const packets = inputs.map(normalizePacket)
  const sourceId = packets[0]!.frame.source.id
  const workspaceId = packets[0]!.frame.workspaceId
  const gaps: PerceptionContinuityGap[] = []
  let missingPacketCount = 0

  for (let index = 0; index < packets.length; index += 1) {
    const current = packets[index]!
    if (current.frame.source.id !== sourceId) throw new Error('one perception stream must use one source id')
    if (current.frame.workspaceId !== workspaceId) throw new Error('one perception stream must use one workspace id')

    const previous = packets[index - 1]
    if (!previous) continue

    if (current.sequence <= previous.sequence) {
      throw new Error('packet.sequence must increase strictly inside one stream')
    }

    if (current.sequence > previous.sequence + 1) {
      const missingPackets = current.sequence - previous.sequence - 1
      missingPacketCount += missingPackets
      gaps.push({
        kind: 'sequence-gap',
        afterSequence: previous.sequence,
        beforeSequence: current.sequence,
        missingPackets,
      })
    }

    if (Date.parse(current.frame.capturedAt) < Date.parse(previous.frame.capturedAt)) {
      gaps.push({
        kind: 'timestamp-regression',
        previousSequence: previous.sequence,
        currentSequence: current.sequence,
        previousCapturedAt: previous.frame.capturedAt,
        currentCapturedAt: current.frame.capturedAt,
      })
    }
  }

  return {
    sourceId,
    workspaceId,
    frames: packets.map((packet) => packet.frame),
    continuity: {
      firstSequence: packets[0]!.sequence,
      lastSequence: packets[packets.length - 1]!.sequence,
      missingPacketCount,
      gaps,
    },
  }
}
