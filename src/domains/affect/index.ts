// API publik domain Affect: satu-satunya pintu impor dari luar domain.
export { deriveAffectDecision, summarizeAffectEvents } from './engine/affectEngine'
export type {
  AffectPhase, AffectTrigger, AffectEventType, AffectInputs, AffectDecision, AffectEvent, AffectSessionSummary,
} from './engine/affectEngine'
export { recordAffectEvent, summarizeAffectSession, resetAffectSession } from './adapters/affectSessionStore'
