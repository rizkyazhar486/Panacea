export type BodyIntelligenceWorkspaceTabId =
  | 'pathophysiology'
  | 'pharmacology'
  | 'causal-bridge'
  | 'unified-graph'
  | 'evidence'
  | 'learning-route'

export interface BodyIntelligenceWorkspaceTab {
  id: BodyIntelligenceWorkspaceTabId
  label: string
  shortLabel: string
  description: string
  category: 'mechanism' | 'navigation' | 'audit' | 'learning'
  selectedSystemAware: boolean
}

export const BODY_INTELLIGENCE_WORKSPACE_TABS: readonly BodyIntelligenceWorkspaceTab[] = [
  {
    id: 'pathophysiology',
    label: 'Pathophysiology Network',
    shortLabel: 'Disease',
    description: 'Follow curated disease cascades from trigger through injury, compensation, propagation and consequence.',
    category: 'mechanism',
    selectedSystemAware: true,
  },
  {
    id: 'pharmacology',
    label: 'Pharmacology Mechanisms',
    shortLabel: 'Drug biology',
    description: 'Trace class-level target biology across molecular, cellular, organ and systems scales without prescribing.',
    category: 'mechanism',
    selectedSystemAware: true,
  },
  {
    id: 'causal-bridge',
    label: 'Disease ↔ Drug Causal Bridge',
    shortLabel: 'Causal bridge',
    description: 'Inspect the exact curated disease node where a pharmacology mechanism intersects the pathophysiology chain.',
    category: 'mechanism',
    selectedSystemAware: false,
  },
  {
    id: 'unified-graph',
    label: 'Unified Mechanism Graph',
    shortLabel: 'Graph',
    description: 'Navigate deterministic anatomy → physiology → disease → pharmacology routes compiled from existing curated models.',
    category: 'navigation',
    selectedSystemAware: true,
  },
  {
    id: 'evidence',
    label: 'Evidence Provenance Observatory',
    shortLabel: 'Evidence',
    description: 'Audit PMID anchors, citation reuse, derivation mode and interpretation boundaries across biomedical claim records.',
    category: 'audit',
    selectedSystemAware: false,
  },
  {
    id: 'learning-route',
    label: 'Mechanism Learning Route',
    shortLabel: 'Learn',
    description: 'Compose a graph-backed educational journey from the currently selected atlas system to a disease or drug mechanism.',
    category: 'learning',
    selectedSystemAware: true,
  },
] as const

export const BODY_INTELLIGENCE_WORKSPACE_BOUNDARY =
  'Progressive-disclosure shell only. Workspace tab order, active state and category are presentation/navigation metadata; they do not rank disease importance, evidence strength, treatment priority, diagnostic probability or patient-specific clinical relevance.'

export function getBodyIntelligenceWorkspaceTab(id: BodyIntelligenceWorkspaceTabId): BodyIntelligenceWorkspaceTab {
  const tab = BODY_INTELLIGENCE_WORKSPACE_TABS.find((candidate) => candidate.id === id)
  if (!tab) throw new Error(`Unknown Body Intelligence workspace tab: ${id}`)
  return tab
}
