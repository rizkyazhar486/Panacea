import type {
  EyeSimulation,
  OcularEffector,
  OcularFunctionState,
  OcularSide,
  OculomotorGazeKey,
  OculomotorLesionKey,
  OculomotorPattern,
  OculomotorSimulation,
  OculomotorSyndromeKey,
} from '../model/oculomotor'

/**
 * Educational oculomotor lesion engine.
 *
 * Design reference:
 * docramiro/oculomotor (MIT), especially its explicit CN III/IV/VI, INO,
 * cavernous-sinus and orbital-apex lesion maps. This implementation is adapted
 * to Panacea's deterministic domain model rather than copied as a browser-global simulator.
 *
 * Numerical pupil/lid teaching proxies are adapted from the MIT reference model
 * and MUST NOT be interpreted as patient-specific measurements.
 */
export const OCULOMOTOR_REFERENCE = {
  repository: 'https://github.com/docramiro/oculomotor',
  license: 'MIT for original code/content; referenced face asset is CC BY 3.0 and is not bundled here.',
  purpose: 'Educational cranial-nerve ocular motility and lesion simulation reference.',
} as const

const EFFECTORS: readonly OcularEffector[] = [
  'MR', 'LR', 'SR', 'IR', 'SO', 'IO', 'LPS', 'parasympathetic', 'sympathetic', 'MLF',
]

const BASELINE: OcularFunctionState = {
  MR: 1,
  LR: 1,
  SR: 1,
  IR: 1,
  SO: 1,
  IO: 1,
  LPS: 1,
  parasympathetic: 1,
  sympathetic: 1,
  MLF: 1,
}

export const OCULOMOTOR_LESION_OPTIONS: ReadonlyArray<{ key: OculomotorLesionKey; label: string }> = [
  { key: 'normal', label: 'Normal' },
  { key: 'III', label: 'CN III complete + pupil' },
  { key: 'III-pupil-sparing', label: 'CN III pupil-sparing' },
  { key: 'III-superior', label: 'CN III superior division' },
  { key: 'III-inferior', label: 'CN III inferior division' },
  { key: 'IV', label: 'CN IV trochlear' },
  { key: 'VI', label: 'CN VI abducens' },
  { key: 'INO', label: 'Internuclear ophthalmoplegia (MLF)' },
  { key: 'Horner', label: 'Horner pattern (contrast)' },
]

export const OCULOMOTOR_SYNDROME_OPTIONS: ReadonlyArray<{ key: OculomotorSyndromeKey; label: string }> = [
  { key: 'none', label: 'No multi-structure syndrome' },
  { key: 'cavernous-sinus', label: 'Cavernous sinus syndrome' },
  { key: 'orbital-apex', label: 'Orbital apex syndrome' },
  { key: 'bilateral-VI', label: 'Bilateral CN VI pattern' },
  { key: 'bilateral-IV', label: 'Bilateral CN IV pattern' },
  { key: 'III-nuclear', label: 'CN III nuclear pattern' },
  { key: 'one-and-a-half', label: 'One-and-a-half syndrome' },
  { key: 'Weber', label: 'Weber pattern' },
]

export const OCULOMOTOR_GAZE: Record<OculomotorGazeKey, { label: string; x: number; y: number }> = {
  primary: { label: 'Primary', x: 0, y: 0 },
  right: { label: 'Right', x: 1, y: 0 },
  left: { label: 'Left', x: -1, y: 0 },
  up: { label: 'Up', x: 0, y: 1 },
  down: { label: 'Down', x: 0, y: -1 },
  'up-right': { label: 'Up-right', x: 1, y: 1 },
  'up-left': { label: 'Up-left', x: -1, y: 1 },
  'down-right': { label: 'Down-right', x: 1, y: -1 },
  'down-left': { label: 'Down-left', x: -1, y: -1 },
}

const LESION_EFFECTORS: Record<OculomotorLesionKey, readonly OcularEffector[]> = {
  normal: [],
  III: ['MR', 'SR', 'IR', 'IO', 'LPS', 'parasympathetic'],
  'III-pupil-sparing': ['MR', 'SR', 'IR', 'IO', 'LPS'],
  'III-superior': ['SR', 'LPS'],
  'III-inferior': ['MR', 'IR', 'IO', 'parasympathetic'],
  IV: ['SO'],
  VI: ['LR'],
  INO: ['MLF'],
  Horner: ['sympathetic'],
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

function validateSeverity(severity: number) {
  if (!Number.isFinite(severity) || severity < 0 || severity > 100) {
    throw new RangeError('severity must be a finite number from 0 to 100')
  }
}

function cloneBaseline(): OcularFunctionState {
  return { ...BASELINE }
}

function reduce(state: OcularFunctionState, effectors: readonly OcularEffector[], fraction: number) {
  for (const effector of effectors) state[effector] = Math.min(state[effector], clamp01(1 - fraction))
}

function applyFocal(
  right: OcularFunctionState,
  left: OcularFunctionState,
  side: OcularSide,
  key: OculomotorLesionKey,
  fraction: number,
) {
  reduce(side === 'R' ? right : left, LESION_EFFECTORS[key], fraction)
}

function applySyndrome(
  right: OcularFunctionState,
  left: OcularFunctionState,
  side: OcularSide,
  key: OculomotorSyndromeKey,
  fraction: number,
) {
  if (key === 'none') return
  const ipsi = side === 'R' ? right : left
  const contra = side === 'R' ? left : right
  const iiiAll: OcularEffector[] = ['MR', 'SR', 'IR', 'IO', 'LPS', 'parasympathetic']

  switch (key) {
    case 'cavernous-sinus':
      reduce(ipsi, [...iiiAll, 'SO', 'LR', 'sympathetic'], fraction)
      break
    case 'orbital-apex':
      reduce(ipsi, [...iiiAll, 'SO', 'LR'], fraction)
      break
    case 'bilateral-VI':
      reduce(right, ['LR'], fraction)
      reduce(left, ['LR'], fraction)
      break
    case 'bilateral-IV':
      reduce(right, ['SO'], fraction)
      reduce(left, ['SO'], fraction)
      break
    case 'III-nuclear':
      reduce(ipsi, ['MR', 'IR', 'IO', 'SR', 'parasympathetic'], fraction)
      reduce(contra, ['SR'], fraction)
      reduce(ipsi, ['LPS'], fraction * 0.8)
      reduce(contra, ['LPS'], fraction * 0.8)
      break
    case 'one-and-a-half':
      reduce(ipsi, ['LR'], fraction)
      reduce(right, ['MLF'], fraction)
      reduce(left, ['MLF'], fraction)
      break
    case 'Weber':
      reduce(ipsi, iiiAll, fraction)
      break
  }
}

function gazeFunction(side: OcularSide, gaze: OculomotorGazeKey, state: OcularFunctionState) {
  const adduction = state.MR * state.MLF
  switch (gaze) {
    case 'primary':
      return 1
    case 'right':
      return side === 'R' ? state.LR : adduction
    case 'left':
      return side === 'L' ? state.LR : adduction
    case 'up-right':
      return side === 'R' ? state.SR : state.IO
    case 'up-left':
      return side === 'L' ? state.SR : state.IO
    case 'down-right':
      return side === 'R' ? state.IR : state.SO
    case 'down-left':
      return side === 'L' ? state.IR : state.SO
    case 'up':
      return (state.SR + state.IO) / 2
    case 'down':
      return (state.IR + state.SO) / 2
  }
}

function primaryPosition(state: OcularFunctionState) {
  // Qualitative normalized imbalance proxy only; not degrees of deviation.
  const horizontal = clamp01((state.LR - state.MR + 1) / 2) * 2 - 1
  const elevators = state.SR + state.IO
  const depressors = state.IR + state.SO
  const vertical = Math.max(-1, Math.min(1, (elevators - depressors) / 2))
  return { horizontal, vertical }
}

function pupilDiameterMm(state: OcularFunctionState) {
  // Adapted educational proxy from docramiro/oculomotor (MIT):
  // pupil = 3.5 + 3.0*(1-parasympathetic) - 1.3*(1-sympathetic)
  return Math.max(1.5, Math.min(8, 3.5 + 3 * (1 - state.parasympathetic) - 1.3 * (1 - state.sympathetic)))
}

function lidOpenFraction(state: OcularFunctionState) {
  // Adapted educational proxy from docramiro/oculomotor (MIT).
  return clamp01(Math.max(0.03, 0.12 + 0.88 * state.LPS - 0.22 * (1 - state.sympathetic)))
}

function toEyeSimulation(side: OcularSide, state: OcularFunctionState, gaze: OculomotorGazeKey): EyeSimulation {
  const primary = primaryPosition(state)
  return {
    side,
    function: state,
    primaryHorizontal: primary.horizontal,
    primaryVertical: primary.vertical,
    pupilMm: pupilDiameterMm(state),
    lidOpenFraction: lidOpenFraction(state),
    gazeFunction: gazeFunction(side, gaze, state),
    // INO classically affects conjugate adduction through the MLF; convergence can be preserved.
    convergenceFunction: state.MR,
  }
}

export function prismDioptersFromDegrees(degrees: number) {
  if (!Number.isFinite(degrees)) throw new TypeError('degrees must be finite')
  return 100 * Math.tan(Math.abs(degrees) * Math.PI / 180)
}

export function simulateOculomotor(input: {
  pattern: OculomotorPattern
  side: OcularSide
  severity: number
  gaze: OculomotorGazeKey
}): OculomotorSimulation {
  validateSeverity(input.severity)
  const fraction = input.severity / 100
  const right = cloneBaseline()
  const left = cloneBaseline()

  if (input.pattern.scope === 'lesion') {
    applyFocal(right, left, input.side, input.pattern.key, fraction)
  } else {
    applySyndrome(right, left, input.side, input.pattern.key, fraction)
  }

  const affectedEffectors = EFFECTORS.filter((effector) => right[effector] < 1 || left[effector] < 1)
  const notes = [
    'Educational kinematic/localization model only; not a diagnostic device and not patient-specific.',
    'Residual effector function uses f = 1 - severity/100 for the selected teaching lesion.',
    'INO reduces conjugate adduction through the MLF while the convergence proxy uses medial-rectus function directly.',
  ]
  if (input.pattern.scope === 'lesion' && input.pattern.key === 'III') {
    notes.push('A painful pupil-involving third-nerve palsy is an emergency localization pattern in clinical practice; this simulator does not triage patients.')
  }

  return {
    pattern: input.pattern,
    affectedSide: input.side,
    severity: input.severity,
    gaze: input.gaze,
    right: toEyeSimulation('R', right, input.gaze),
    left: toEyeSimulation('L', left, input.gaze),
    affectedEffectors,
    teachingNotes: notes,
  }
}
