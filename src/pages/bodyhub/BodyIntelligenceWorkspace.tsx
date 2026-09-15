import { lazy, Suspense, useMemo, useState } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import {
  BODY_INTELLIGENCE_WORKSPACE_BOUNDARY,
  BODY_INTELLIGENCE_WORKSPACE_TABS,
  getBodyIntelligenceWorkspaceTab,
  type BodyIntelligenceWorkspaceTabId,
} from '../../lib/bodyIntelligenceWorkspace'

const PathophysiologyNetworkPanel = lazy(() => import('./PathophysiologyNetworkPanel'))
const PharmacologyMechanismPanel = lazy(() => import('./PharmacologyMechanismPanel'))
const MechanismCausalBridgePanel = lazy(() => import('./MechanismCausalBridgePanel'))
const UnifiedMechanismGraphPanel = lazy(() => import('./UnifiedMechanismGraphPanel'))
const EvidenceProvenanceObservatory = lazy(() => import('./EvidenceProvenanceObservatory'))
const LearningRouteComposerPanel = lazy(() => import('./LearningRouteComposerPanel'))

interface BodyIntelligenceWorkspaceProps {
  selectedAtlasSystemId: BodySystemId
}

const CATEGORY_LABELS = {
  mechanism: 'Mechanism',
  navigation: 'Navigation',
  audit: 'Evidence',
  learning: 'Learning',
} as const

function PanelFallback({ label }: { label: string }) {
  return (
    <div className="body-intelligence-workspace__fallback" aria-live="polite">
      <div className="body-intelligence-workspace__pulse" aria-hidden />
      <span>Loading {label}…</span>
    </div>
  )
}

export function BodyIntelligenceWorkspace({ selectedAtlasSystemId }: BodyIntelligenceWorkspaceProps) {
  const [activeTabId, setActiveTabId] = useState<BodyIntelligenceWorkspaceTabId>('pathophysiology')
  const activeTab = getBodyIntelligenceWorkspaceTab(activeTabId)

  const categoryCounts = useMemo(() => {
    return BODY_INTELLIGENCE_WORKSPACE_TABS.reduce<Record<string, number>>((acc, tab) => {
      acc[tab.category] = (acc[tab.category] ?? 0) + 1
      return acc
    }, {})
  }, [])

  const panel = (() => {
    switch (activeTabId) {
      case 'pathophysiology':
        return <PathophysiologyNetworkPanel selectedAtlasSystemId={selectedAtlasSystemId} />
      case 'pharmacology':
        return <PharmacologyMechanismPanel selectedAtlasSystemId={selectedAtlasSystemId} />
      case 'causal-bridge':
        return <MechanismCausalBridgePanel />
      case 'unified-graph':
        return <UnifiedMechanismGraphPanel selectedAtlasSystemId={selectedAtlasSystemId} />
      case 'evidence':
        return <EvidenceProvenanceObservatory />
      case 'learning-route':
        return <LearningRouteComposerPanel selectedAtlasSystemId={selectedAtlasSystemId} />
    }
  })()

  return (
    <section className="body-intelligence-workspace" aria-labelledby="body-intelligence-workspace-title">
      <div className="body-intelligence-workspace__spectral" aria-hidden />

      <header className="body-intelligence-workspace__header">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="body-intelligence-workspace__eyebrow">Body Intelligence Workspace</span>
            <span className="body-intelligence-workspace__badge">progressive disclosure</span>
            <span className="body-intelligence-workspace__badge body-intelligence-workspace__badge--live">
              {selectedAtlasSystemId}
            </span>
          </div>
          <h3 id="body-intelligence-workspace-title" className="body-intelligence-workspace__title">
            One visual language for mechanism, evidence, graph navigation and learning.
          </h3>
          <p className="body-intelligence-workspace__lede">
            Keep the whole-body atlas visible as the primary spatial anchor, then reveal one intelligence layer at a time. Every layer uses the same surface hierarchy, spacing rhythm, interaction states and biomedical-cosmic visual grammar.
          </p>
        </div>

        <div className="body-intelligence-workspace__summary" aria-label="Workspace summary">
          {Object.entries(CATEGORY_LABELS).map(([category, label]) => (
            <div key={category} className="body-intelligence-workspace__summary-card">
              <strong>{categoryCounts[category] ?? 0}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </header>

      <nav className="body-intelligence-workspace__tabbar" aria-label="Body intelligence layers">
        <div className="body-intelligence-workspace__tabtrack" role="tablist">
          {BODY_INTELLIGENCE_WORKSPACE_TABS.map((tab) => {
            const active = tab.id === activeTabId
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls="body-intelligence-active-panel"
                onClick={() => setActiveTabId(tab.id)}
                className={`body-intelligence-workspace__tab ${active ? 'is-active' : ''}`}
              >
                <span className="body-intelligence-workspace__tab-category">{CATEGORY_LABELS[tab.category]}</span>
                <span className="body-intelligence-workspace__tab-label">{tab.shortLabel}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <div className="body-intelligence-workspace__context" aria-live="polite">
        <div>
          <span className="body-intelligence-workspace__context-kicker">Active layer</span>
          <strong>{activeTab.label}</strong>
          <p>{activeTab.description}</p>
        </div>
        <div className="body-intelligence-workspace__context-state">
          <span>{activeTab.selectedSystemAware ? 'Synced to atlas' : 'Global knowledge layer'}</span>
          {activeTab.selectedSystemAware && <strong>{selectedAtlasSystemId}</strong>}
        </div>
      </div>

      <div id="body-intelligence-active-panel" role="tabpanel" className="body-intelligence-workspace__panel">
        <Suspense fallback={<PanelFallback label={activeTab.label} />}>
          {panel}
        </Suspense>
      </div>

      <footer className="body-intelligence-workspace__footer">
        <span>Concept alignment: whole-body first → progressive depth → inspectable mechanism → traceable evidence.</span>
        <p>{BODY_INTELLIGENCE_WORKSPACE_BOUNDARY}</p>
      </footer>
    </section>
  )
}

export default BodyIntelligenceWorkspace
