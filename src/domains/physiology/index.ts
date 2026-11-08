// API publik domain Physiology: satu-satunya pintu impor dari luar domain.
// Sengaja tidak mengekspor deklarasi parameter apa pun: deklarasi adalah data kurasi dengan sumber, bukan bagian gerbang.
export { evaluatePersonalization } from './engine/personalizationGate'
export { ALVEOLAR_GAS_DEFAULTS, ALVEOLAR_GAS_CONTROLS, ALVEOLAR_GAS_MODELS, ALVEOLAR_GAS_BOUNDARY, evaluateAlveolarGasBudget, alveolarFrequencySweep } from './engine/alveolarGasBudget'
export { deadSpaceFraction, shuntFraction } from './engine/gasExchangeIdentities'
export type { IdentityResult } from './engine/gasExchangeIdentities'
export type { AlveolarGasScenario, AlveolarGasBudget } from './engine/alveolarGasBudget'
export type {
  ParameterDeclaration, PersonalizationObservation, PersonalizationProposal, PersonalizationBlocker,
  PersonalizationBlockerCode, PersonalizationDecision,
} from './model/personalization'
export { transpulmonaryPressure, TRANSPULMONARY_SOURCE, TRANSPULMONARY_BOUNDARY } from './engine/transpulmonaryPressure'
export type { TranspulmonaryInput, TranspulmonaryResult } from './engine/transpulmonaryPressure'
