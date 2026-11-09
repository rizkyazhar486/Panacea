// API publik domain: satu-satunya pintu impor dari luar.
export { synthesize, EVIDENCE_KINDS, SYNTHESIS_BOUNDARY, MAX_QUESTION_CHARS, MAX_SOURCES, MAX_CLAIMS } from './engine/synthesize'
export type {
  AttributedClaim, AttributedTeaching, Certainty, ClaimRecord, Rejection, RejectReason, SourceKind, SourceRecord, Stance,
  StanceGroup, Synthesis, SynthesisInput, SynthesisResult,
} from './model/types'
