import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  BODY_INTELLIGENCE_WORKSPACE_BOUNDARY,
  BODY_INTELLIGENCE_WORKSPACE_TABS,
  getBodyIntelligenceWorkspaceTab,
} from '../../src/lib/bodyIntelligenceWorkspace.ts'

assert.equal(BODY_INTELLIGENCE_WORKSPACE_TABS.length, 6, 'workspace must expose exactly six intelligence layers in this wave')
assert.equal(new Set(BODY_INTELLIGENCE_WORKSPACE_TABS.map((tab) => tab.id)).size, 6, 'workspace tab ids must be unique')
assert.deepEqual(
  BODY_INTELLIGENCE_WORKSPACE_TABS.map((tab) => tab.id),
  ['pathophysiology', 'pharmacology', 'causal-bridge', 'unified-graph', 'evidence', 'learning-route'],
  'workspace order must preserve mechanism → navigation → evidence → learning hierarchy',
)

for (const tab of BODY_INTELLIGENCE_WORKSPACE_TABS) {
  assert.ok(tab.label.length >= 8, `${tab.id} needs a clear full label`)
  assert.ok(tab.shortLabel.length >= 3 && tab.shortLabel.length <= 20, `${tab.id} needs a compact control label`)
  assert.ok(tab.description.length >= 90, `${tab.id} needs a substantive progressive-disclosure description`)
  assert.ok(['mechanism', 'navigation', 'audit', 'learning'].includes(tab.category), `${tab.id} uses unsupported workspace category`)
  assert.equal(getBodyIntelligenceWorkspaceTab(tab.id).id, tab.id)
}

assert.equal(BODY_INTELLIGENCE_WORKSPACE_TABS.filter((tab) => tab.category === 'mechanism').length, 3, 'mechanism family should remain the largest first-order intelligence group')
assert.equal(BODY_INTELLIGENCE_WORKSPACE_TABS.filter((tab) => tab.category === 'navigation').length, 1)
assert.equal(BODY_INTELLIGENCE_WORKSPACE_TABS.filter((tab) => tab.category === 'audit').length, 1)
assert.equal(BODY_INTELLIGENCE_WORKSPACE_TABS.filter((tab) => tab.category === 'learning').length, 1)
assert.ok(BODY_INTELLIGENCE_WORKSPACE_TABS.filter((tab) => tab.selectedSystemAware).length >= 4, 'most workspace layers should remain synchronized to the live atlas mental model')

assert.match(BODY_INTELLIGENCE_WORKSPACE_BOUNDARY, /progressive-disclosure shell only/i)
assert.match(BODY_INTELLIGENCE_WORKSPACE_BOUNDARY, /do not rank disease importance/i)
assert.match(BODY_INTELLIGENCE_WORKSPACE_BOUNDARY, /treatment priority/i)
assert.match(BODY_INTELLIGENCE_WORKSPACE_BOUNDARY, /patient-specific clinical relevance/i)

const osSource = readFileSync(resolve('src/pages/BodyExposureOS.tsx'), 'utf8')
assert.match(osSource, /BodyIntelligenceWorkspace/, 'Body Exposure OS must mount the unified intelligence workspace')
assert.doesNotMatch(osSource, /const PathophysiologyNetworkPanel = lazy/, 'OS shell must not return to directly stacking pathophysiology intelligence panel')
assert.doesNotMatch(osSource, /const PharmacologyMechanismPanel = lazy/, 'OS shell must not return to directly stacking pharmacology intelligence panel')
assert.doesNotMatch(osSource, /const MechanismCausalBridgePanel = lazy/, 'OS shell must not return to directly stacking causal bridge panel')
assert.doesNotMatch(osSource, /const UnifiedMechanismGraphPanel = lazy/, 'OS shell must not return to directly stacking graph panel')
assert.doesNotMatch(osSource, /const EvidenceProvenanceObservatory = lazy/, 'OS shell must not return to directly stacking evidence panel')
assert.doesNotMatch(osSource, /const LearningRouteComposerPanel = lazy/, 'OS shell must not return to directly stacking learning panel')
assert.match(osSource, /whole-body first/i)
assert.match(osSource, /multiscale intelligence/i)
assert.match(osSource, /evidence traceable/i)

const cssSource = readFileSync(resolve('src/pages/bodyExposureOS.css'), 'utf8')
for (const token of ['--be-space-black', '--be-cyan', '--be-violet', '--be-magenta', '--be-border-soft', '--be-radius-panel']) {
  assert.ok(cssSource.includes(token), `Body Exposure visual token ${token} must remain defined`)
}
assert.match(cssSource, /\.body-intelligence-workspace\s*\{/, 'workspace shell must retain a dedicated scoped visual surface')
assert.match(cssSource, /\.body-intelligence-workspace__tab\.is-active/, 'workspace must preserve a coherent active-tab visual state')
assert.match(cssSource, /\.body-intelligence-workspace__panel > section/, 'child intelligence panels must remain normalized by the workspace shell')
assert.match(cssSource, /prefers-reduced-motion/, 'workspace visual system must preserve reduced-motion accessibility')

console.log('body intelligence workspace: six progressive-disclosure layers validated with whole-body-first hierarchy, shared visual tokens and non-clinical navigation boundaries')
