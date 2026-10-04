// API publik domain Physiology: satu-satunya pintu impor dari luar domain.
// Sengaja tidak mengekspor deklarasi parameter apa pun: deklarasi adalah data kurasi dengan sumber, bukan bagian gerbang.
export { evaluatePersonalization } from './engine/personalizationGate'
export type {
  ParameterDeclaration, PersonalizationObservation, PersonalizationProposal, PersonalizationBlocker,
  PersonalizationBlockerCode, PersonalizationDecision,
} from './model/personalization'
