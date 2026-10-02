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

export { createRestorableEnvironment } from './engine/restorableEnvironment'
export type {
  EnvironmentHandle,
  RebuildOptions,
  RestorableEnvironment,
  RestorableEnvironmentOptions,
} from './engine/restorableEnvironment'
