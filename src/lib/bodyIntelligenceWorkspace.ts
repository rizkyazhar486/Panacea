export type BodyIntelligenceWorkspaceTabId =
  | 'pathophysiology'
  | 'pharmacology'
  | 'causal-bridge'
  | 'unified-graph'
  | 'evidence'
  | 'learning-route'

export type BodyExposureConceptStageId =
  | 'whole-body'
  | 'system'
  | 'function'
  | 'failure'
  | 'mechanism'
  | 'evidence'
  | 'learning'

export interface BodyExposureConceptStage {
  id: BodyExposureConceptStageId
  label: string
  shortLabel: string
  description: string
}

export interface BodyIntelligenceWorkspaceTab {
  id: BodyIntelligenceWorkspaceTabId
  label: string
  shortLabel: string
  description: string
  category: 'mechanism' | 'navigation' | 'audit' | 'learning'
  selectedSystemAware: boolean
  conceptStageId: BodyExposureConceptStageId
}

export const BODY_EXPOSURE_CONCEPT_SPINE: readonly BodyExposureConceptStage[] = [
  {
    id: 'whole-body',
    label: 'Whole-body spatial anchor',
    shortLabel: 'Whole body',
    description: 'Begin with the complete body so every later detail keeps a stable anatomical frame of reference.',
  },
  {
    id: 'system',
    label: 'System anatomy',
    shortLabel: 'System',
    description: 'Narrow the whole body into a source-backed anatomical system without losing its relationship to the organism.',
  },
  {
    id: 'function',
    label: 'Physiologic function',
    shortLabel: 'Function',
    description: 'Explain what the selected system does and how it couples to other body systems under reference physiology.',
  },
  {
    id: 'failure',
    label: 'Pathophysiologic failure',
    shortLabel: 'Failure',
    description: 'Trace how normal function can be disrupted through curated mechanistic disease cascades rather than isolated labels.',
  },
  {
    id: 'mechanism',
    label: 'Mechanistic intervention biology',
    shortLabel: 'Mechanism',
    description: 'Inspect molecular and systems mechanisms, including pharmacology, without turning mechanism education into prescribing.',
  },
  {
    id: 'evidence',
    label: 'Evidence provenance',
    shortLabel: 'Evidence',
    description: 'Audit where biomedical claims and mechanistic interpretations obtain their traceable source anchors and boundaries.',
  },
  {
    id: 'learning',
    label: 'Guided synthesis',
    shortLabel: 'Learning',
    description: 'Turn the connected model into a transparent learning route while preserving the same anatomy and evidence context.',
  },
] as const

export const BODY_INTELLIGENCE_WORKSPACE_TABS: readonly BodyIntelligenceWorkspaceTab[] = [
  {
    id: 'pathophysiology',
    label: 'Pathophysiology Network',
    shortLabel: 'Disease',
    description: 'Follow curated disease cascades from trigger through injury, compensation, propagation and consequence.',
    category: 'mechanism',
    selectedSystemAware: true,
    conceptStageId: 'failure',
  },
  {
    id: 'pharmacology',
    label: 'Pharmacology Mechanisms',
    shortLabel: 'Drug biology',
    description: 'Trace class-level target biology across molecular, cellular, organ and systems scales without prescribing.',
    category: 'mechanism',
    selectedSystemAware: true,
    conceptStageId: 'mechanism',
  },
  {
    id: 'causal-bridge',
    label: 'Disease ↔ Drug Causal Bridge',
    shortLabel: 'Causal bridge',
    description: 'Inspect the exact curated disease node where a pharmacology mechanism intersects the pathophysiology chain.',
    category: 'mechanism',
    selectedSystemAware: false,
    conceptStageId: 'mechanism',
  },
  {
    id: 'unified-graph',
    label: 'Unified Mechanism Graph',
    shortLabel: 'Graph',
    description: 'Navigate deterministic anatomy → physiology → disease → pharmacology routes compiled from existing curated models.',
    category: 'navigation',
    selectedSystemAware: true,
    conceptStageId: 'mechanism',
  },
  {
    id: 'evidence',
    label: 'Evidence Provenance Observatory',
    shortLabel: 'Evidence',
    description: 'Audit PMID anchors, citation reuse, derivation mode and interpretation boundaries across biomedical claim records.',
    category: 'audit',
    selectedSystemAware: false,
    conceptStageId: 'evidence',
  },
  {
    id: 'learning-route',
    label: 'Mechanism Learning Route',
    shortLabel: 'Learn',
    description: 'Compose a graph-backed educational journey from the currently selected atlas system to a disease or drug mechanism.',
    category: 'learning',
    selectedSystemAware: true,
    conceptStageId: 'learning',
  },
] as const

export const BODY_INTELLIGENCE_WORKSPACE_BOUNDARY =
  'Progressive-disclosure shell only. Workspace tab order, concept-stage position, active state and category are presentation/navigation metadata; they do not rank disease importance, evidence strength, treatment priority, diagnostic probability or patient-specific clinical relevance.'

export function getBodyIntelligenceWorkspaceTab(id: BodyIntelligenceWorkspaceTabId): BodyIntelligenceWorkspaceTab {
  const tab = BODY_INTELLIGENCE_WORKSPACE_TABS.find((candidate) => candidate.id === id)
  if (!tab) throw new Error(`Unknown Body Intelligence workspace tab: ${id}`)
  return tab
}

export function getBodyExposureConceptStage(id: BodyExposureConceptStageId): BodyExposureConceptStage {
  const stage = BODY_EXPOSURE_CONCEPT_SPINE.find((candidate) => candidate.id === id)
  if (!stage) throw new Error(`Unknown Body Exposure concept stage: ${id}`)
  return stage
}
