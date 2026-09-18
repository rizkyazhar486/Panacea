export const PERSONAL_AVATAR_CAPTURE_VIEWS = [
  { id: 'front', label: 'Front', instruction: 'Face the camera with the full body visible.', yawDegrees: 0, framing: 'full-body' },
  { id: 'front-left', label: 'Front 45°', instruction: 'Turn about 45° to your left.', yawDegrees: -45, framing: 'full-body' },
  { id: 'left', label: 'Left', instruction: 'Turn to a left side profile.', yawDegrees: -90, framing: 'full-body' },
  { id: 'back-left', label: 'Rear 45°', instruction: 'Continue turning to a rear-left angle.', yawDegrees: -135, framing: 'full-body' },
  { id: 'back', label: 'Back', instruction: 'Face directly away from the camera.', yawDegrees: 180, framing: 'full-body' },
  { id: 'back-right', label: 'Rear 45°', instruction: 'Continue turning to a rear-right angle.', yawDegrees: 135, framing: 'full-body' },
  { id: 'right', label: 'Right', instruction: 'Turn to a right side profile.', yawDegrees: 90, framing: 'full-body' },
  { id: 'front-right', label: 'Front 45°', instruction: 'Turn about 45° to your right.', yawDegrees: 45, framing: 'full-body' },
  { id: 'head-close', label: 'Face', instruction: 'Move closer and keep the face centered for the final frame.', yawDegrees: 0, framing: 'face' },
] as const

export type PersonalAvatarCaptureViewId = (typeof PERSONAL_AVATAR_CAPTURE_VIEWS)[number]['id']
export type PersonalAvatarCaptureStatus = 'consent-required' | 'capturing' | 'capture-ready' | 'reconstruction-ready'

export interface PersonalAvatarCaptureConsent {
  granted: boolean
  grantedAt: string
  purpose: 'personal-avatar-reconstruction'
  rawFrameRetention: 'ephemeral'
  allowReconstruction: boolean
}

export interface PersonalAvatarCaptureFrame {
  id: string
  viewId: PersonalAvatarCaptureViewId
  capturedAt: string
  width: number
  height: number
  source: 'rgb-camera'
  persisted: false
}

export interface PersonalAvatarCaptureSession {
  id: string
  subjectId: string
  createdAt: string
  status: PersonalAvatarCaptureStatus
  consent: PersonalAvatarCaptureConsent
  frames: Partial<Record<PersonalAvatarCaptureViewId, PersonalAvatarCaptureFrame>>
}

export interface PersonalAvatarReconstructionRequest {
  sessionId: string
  subjectId: string
  captureViewIds: PersonalAvatarCaptureViewId[]
  source: 'monocular-rgb-multiframe'
  outputTarget: 'rigged-personal-surface-avatar'
  governance: {
    rawFramesAreClinicalRecord: false
    cameraAvatarIsPatientSpecificInternalAnatomy: false
    cameraAvatarIsClinicalMeasurement: false
    referenceAtlasMayBeUsedAsInternalTruth: false
    patientSpecificInternalAnatomyRequiresVerifiedImaging: true
  }
}

export interface PersonalAvatarQualityScore {
  faceSimilarity: number
  bodyProportionSimilarity: number
  postureSimilarity: number
  textureSimilarity: number
  motionSimilarity: number
}

export const PERSONAL_AVATAR_TRUTH_BOUNDARY =
  'Camera reconstruction may approximate external appearance, body habitus, posture and surface geometry. It must not be presented as patient-specific internal anatomy, a clinical measurement, diagnosis, operative target or imaging-derived truth.'

function assertIso(value: string, field: string) {
  if (!Number.isFinite(Date.parse(value))) throw new Error(`${field} must be a valid ISO timestamp`)
}

function assertNonBlank(value: string, field: string) {
  if (!value.trim()) throw new Error(`${field} must not be blank`)
}

export function createPersonalAvatarCaptureSession(input: {
  id: string
  subjectId: string
  createdAt: string
  consent: PersonalAvatarCaptureConsent
}): PersonalAvatarCaptureSession {
  assertNonBlank(input.id, 'id')
  assertNonBlank(input.subjectId, 'subjectId')
  assertIso(input.createdAt, 'createdAt')
  assertIso(input.consent.grantedAt, 'consent.grantedAt')
  return {
    id: input.id.trim(),
    subjectId: input.subjectId.trim(),
    createdAt: input.createdAt,
    status: input.consent.granted ? 'capturing' : 'consent-required',
    consent: { ...input.consent, rawFrameRetention: 'ephemeral' },
    frames: {},
  }
}

export function recordPersonalAvatarFrame(
  session: PersonalAvatarCaptureSession,
  frame: PersonalAvatarCaptureFrame,
): PersonalAvatarCaptureSession {
  if (!session.consent.granted) throw new Error('camera-avatar capture requires explicit consent')
  if (!PERSONAL_AVATAR_CAPTURE_VIEWS.some((view) => view.id === frame.viewId)) {
    throw new Error('unknown camera-avatar capture view')
  }
  assertIso(frame.capturedAt, 'frame.capturedAt')
  if (!Number.isFinite(frame.width) || frame.width <= 0 || !Number.isFinite(frame.height) || frame.height <= 0) {
    throw new Error('frame dimensions must be positive finite numbers')
  }
  if (frame.persisted !== false || frame.source !== 'rgb-camera') {
    throw new Error('camera-avatar raw frames remain ephemeral RGB capture data')
  }

  const frames = { ...session.frames, [frame.viewId]: { ...frame } }
  const complete = PERSONAL_AVATAR_CAPTURE_VIEWS.every((view) => Boolean(frames[view.id]))
  return {
    ...session,
    status: complete && session.consent.allowReconstruction ? 'reconstruction-ready' : complete ? 'capture-ready' : 'capturing',
    frames,
  }
}

export function personalAvatarMissingViews(session: PersonalAvatarCaptureSession) {
  return PERSONAL_AVATAR_CAPTURE_VIEWS
    .filter((view) => !session.frames[view.id])
    .map((view) => view.id)
}

export function buildPersonalAvatarQaGrid(session: PersonalAvatarCaptureSession) {
  return PERSONAL_AVATAR_CAPTURE_VIEWS.map((view, index) => ({
    row: Math.floor(index / 3),
    column: index % 3,
    view,
    frame: session.frames[view.id] ?? null,
  }))
}

export function preparePersonalAvatarReconstruction(
  session: PersonalAvatarCaptureSession,
): PersonalAvatarReconstructionRequest {
  if (!session.consent.granted || !session.consent.allowReconstruction) {
    throw new Error('explicit avatar-reconstruction consent is required')
  }
  const missing = personalAvatarMissingViews(session)
  if (missing.length > 0) throw new Error(`capture is incomplete: missing ${missing.join(', ')}`)

  return {
    sessionId: session.id,
    subjectId: session.subjectId,
    captureViewIds: PERSONAL_AVATAR_CAPTURE_VIEWS.map((view) => view.id),
    source: 'monocular-rgb-multiframe',
    outputTarget: 'rigged-personal-surface-avatar',
    governance: {
      rawFramesAreClinicalRecord: false,
      cameraAvatarIsPatientSpecificInternalAnatomy: false,
      cameraAvatarIsClinicalMeasurement: false,
      referenceAtlasMayBeUsedAsInternalTruth: false,
      patientSpecificInternalAnatomyRequiresVerifiedImaging: true,
    },
  }
}

export function anthropometricErrorPercent(avatarValue: number, referenceValue: number) {
  if (!Number.isFinite(avatarValue) || !Number.isFinite(referenceValue) || referenceValue <= 0) {
    throw new Error('anthropometric values must be finite and referenceValue must be > 0')
  }
  return Math.abs(avatarValue - referenceValue) / referenceValue * 100
}

export function weightedPersonalAvatarSimilarity(
  score: PersonalAvatarQualityScore,
  weights: PersonalAvatarQualityScore,
) {
  const entries = Object.keys(score) as Array<keyof PersonalAvatarQualityScore>
  for (const key of entries) {
    if (!Number.isFinite(score[key]) || score[key] < 0 || score[key] > 1) throw new Error(`${key} score must be in [0, 1]`)
    if (!Number.isFinite(weights[key]) || weights[key] < 0) throw new Error(`${key} weight must be >= 0`)
  }
  const weightSum = entries.reduce((sum, key) => sum + weights[key], 0)
  if (Math.abs(weightSum - 1) > 1e-9) throw new Error('avatar similarity weights must sum to 1')
  return entries.reduce((sum, key) => sum + score[key] * weights[key], 0)
}
