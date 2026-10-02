export type OcularSide = 'R' | 'L'

export type OcularEffector =
  | 'MR'
  | 'LR'
  | 'SR'
  | 'IR'
  | 'SO'
  | 'IO'
  | 'LPS'
  | 'parasympathetic'
  | 'sympathetic'
  | 'MLF'

export type OculomotorLesionKey =
  | 'normal'
  | 'III'
  | 'III-pupil-sparing'
  | 'III-superior'
  | 'III-inferior'
  | 'IV'
  | 'VI'
  | 'INO'
  | 'Horner'

export type OculomotorSyndromeKey =
  | 'none'
  | 'cavernous-sinus'
  | 'orbital-apex'
  | 'bilateral-VI'
  | 'bilateral-IV'
  | 'III-nuclear'
  | 'one-and-a-half'
  | 'Weber'

export type OculomotorPattern =
  | { scope: 'lesion'; key: OculomotorLesionKey }
  | { scope: 'syndrome'; key: OculomotorSyndromeKey }

export type OculomotorGazeKey =
  | 'primary'
  | 'right'
  | 'left'
  | 'up'
  | 'down'
  | 'up-right'
  | 'up-left'
  | 'down-right'
  | 'down-left'

export type OcularFunctionState = Record<OcularEffector, number>

export type EyeSimulation = {
  side: OcularSide
  function: OcularFunctionState
  primaryHorizontal: number
  primaryVertical: number
  pupilMm: number
  lidOpenFraction: number
  gazeFunction: number
  convergenceFunction: number
}

export type OculomotorSimulation = {
  pattern: OculomotorPattern
  affectedSide: OcularSide
  severity: number
  gaze: OculomotorGazeKey
  right: EyeSimulation
  left: EyeSimulation
  affectedEffectors: OcularEffector[]
  teachingNotes: string[]
}
