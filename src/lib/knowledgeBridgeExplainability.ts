import type { BridgeTopic } from './knowledgeBridgeMap'

export const BRIDGE_EXPLAINABILITY_INTERPRETATION = 'educational-system-trace-only' as const
export const BRIDGE_EXPLAINABILITY_BOUNDARY = 'not-evidence-verification-or-clinical-reasoning' as const

export type BridgeExplainabilityTrace = Readonly<{
  topicId: string
  topicTitle: string
  input: string
  transformations: readonly string[]
  uncertainty: readonly string[]
  interpretation: typeof BRIDGE_EXPLAINABILITY_INTERPRETATION
  boundary: typeof BRIDGE_EXPLAINABILITY_BOUNDARY
}>

export function buildBridgeExplainabilityTrace(topic: BridgeTopic, query: string): BridgeExplainabilityTrace {
  const cleanQuery = query.replace(/\s+/g, ' ').trim()
  const input = cleanQuery
    ? `User query “${cleanQuery}” resolved to curated topic “${topic.title}” (${topic.id}).`
    : `Curated topic “${topic.title}” (${topic.id}) was selected directly.`

  return {
    topicId: topic.id,
    topicTitle: topic.title,
    input,
    transformations: [
      'Resolve the input to one curated local topic; unmatched inputs are not silently mapped to a different disease.',
      'Present the topic in the fixed learning sequence: anatomy → physiology → pathology → signals → diagnostics → management → evidence.',
      'Display the curated stage text without adding a score, probability, diagnosis, treatment decision, or patient-specific inference.',
    ],
    uncertainty: [
      'A curated learning map can omit alternative explanations, population differences, contraindications, and newer evidence.',
      'A source pointer or citation shelf is provenance, not proof that a medical claim has been independently verified.',
      'Clinical application requires current source review and patient context outside this educational trace.',
    ],
    interpretation: BRIDGE_EXPLAINABILITY_INTERPRETATION,
    boundary: BRIDGE_EXPLAINABILITY_BOUNDARY,
  }
}
