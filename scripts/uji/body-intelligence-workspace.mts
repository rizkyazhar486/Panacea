import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  BODY_EXPOSURE_CONCEPT_SPINE,
  BODY_INTELLIGENCE_WORKSPACE_BOUNDARY,
  BODY_INTELLIGENCE_WORKSPACE_TABS,
  getBodyExposureConceptStage,
  getBodyIntelligenceWorkspaceTab,
} from '../../src/lib/bodyIntelligenceWorkspace.ts'

assert.equal(BODY_EXPOSURE_CONCEPT_SPINE.length, 7, 'Body Exposure concept spine must retain seven canonical stages')
assert.deepEqual(
  BODY_EXPOSURE_CONCEPT_SPINE.map((stage) => stage.id),
  ['whole-body', 'system', 'function', 'failure', 'mechanism', 'evidence', 'learning'],
  'concept spine must preserve whole body → system → function → failure → mechanism → evidence → learning',
)
assert.equal(new Set(BODY_EXPOSURE_CONCEPT_SPINE.map((stage) => stage.id)).size, 7, 'concept-stage ids must be unique')
for (const stage of BODY_EXPOSURE_CONCEPT_SPINE) {
  assert.ok(stage.label.length >= 10, `${stage.id} needs a clear full label`)
  assert.ok(stage.shortLabel.length >= 5 && stage.shortLabel.length <= 16, `${stage.id} needs a compact orientation label`)
  assert.ok(stage.description.length >= 90, `${stage.id} needs a substantive mental-model description`)
  assert.equal(getBodyExposureConceptStage(stage.id).id, stage.id)
}

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
  assert.ok(BODY_EXPOSURE_CONCEPT_SPINE.some((stage) => stage.id === tab.conceptStageId), `${tab.id} must map to a canonical concept stage`)
  assert.equal(getBodyIntelligenceWorkspaceTab(tab.id).id, tab.id)
}

assert.equal(getBodyIntelligenceWorkspaceTab('pathophysiology').conceptStageId, 'failure')
assert.equal(getBodyIntelligenceWorkspaceTab('pharmacology').conceptStageId, 'mechanism')
assert.equal(getBodyIntelligenceWorkspaceTab('causal-bridge').conceptStageId, 'mechanism')
assert.equal(getBodyIntelligenceWorkspaceTab('unified-graph').conceptStageId, 'mechanism')
assert.equal(getBodyIntelligenceWorkspaceTab('evidence').conceptStageId, 'evidence')
assert.equal(getBodyIntelligenceWorkspaceTab('learning-route').conceptStageId, 'learning')

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
assert.match(osSource, /bodyExposureDesignAlignment\.css/, 'Body Exposure must load the HIG alignment layer after its local OS styles')
assert.match(osSource, /key:\s*'intelligence'.*label:\s*'Intelligence'.*destination:\s*'intelligence'/s, 'top navigation must expose Intelligence as a first-class destination')
assert.match(osSource, /Open intelligence/i, 'hero must expose a direct one-tap path into the intelligence workspace')
assert.match(osSource, /intelligenceRef\.current\?\.scrollIntoView/, 'Intelligence navigation must directly manipulate the workspace location')
assert.match(osSource, /onClickCapture=\{\(\) => setActiveMode\('intelligence'\)\}/, 'workspace interaction must keep the top-level active mental model synchronized')

const workspaceSource = readFileSync(resolve('src/pages/bodyhub/BodyIntelligenceWorkspace.tsx'), 'utf8')
assert.match(workspaceSource, /BODY_EXPOSURE_CONCEPT_SPINE/, 'workspace must render the canonical concept spine')
assert.match(workspaceSource, /aria-label="Body Exposure concept spine"/, 'concept spine must have an accessible landmark label')
assert.match(workspaceSource, /aria-current=\{active \? 'step' : undefined\}/, 'active concept stage must be exposed semantically')
assert.match(workspaceSource, /is-foundational/, 'whole-body/system/function foundation stages must remain visually distinguishable')
assert.match(workspaceSource, /Whole body → System → Function → Failure → Mechanism → Evidence → Learning/, 'workspace footer must state the canonical mental model')
assert.match(workspaceSource, /bodyExposureConceptSpine\.css/, 'workspace must load the dedicated concept-spine visual layer')

const cssSource = readFileSync(resolve('src/pages/bodyExposureOS.css'), 'utf8')
for (const token of ['--be-space-black', '--be-cyan', '--be-violet', '--be-magenta', '--be-border-soft', '--be-radius-panel']) {
  assert.ok(cssSource.includes(token), `Body Exposure visual token ${token} must remain defined`)
}
assert.match(cssSource, /\.body-intelligence-workspace\s*\{/, 'workspace shell must retain a dedicated scoped visual surface')
assert.match(cssSource, /\.body-intelligence-workspace__tab\.is-active/, 'workspace must preserve a coherent active-tab visual state')
assert.match(cssSource, /\.body-intelligence-workspace__panel > section/, 'child intelligence panels must remain normalized by the workspace shell')
assert.match(cssSource, /prefers-reduced-motion/, 'workspace visual system must preserve reduced-motion accessibility')

const alignmentSource = readFileSync(resolve('src/pages/bodyExposureDesignAlignment.css'), 'utf8')
for (const globalToken of ['--pmd-black', '--pmd-space', '--pmd-surface', '--pmd-surface-raised', '--pmd-line', '--pmd-radius-2xl', '--pmd-fast', '--pmd-focus']) {
  assert.ok(alignmentSource.includes(globalToken), `Body Exposure must bridge to global HIG token ${globalToken}`)
}
assert.match(alignmentSource, /--be-cyan:\s*77,\s*231,\s*255/, 'Body cyan must match the global Panacea HIG cyan family')
assert.match(alignmentSource, /--be-violet:\s*156,\s*124,\s*255/, 'Body violet must match the global Panacea HIG violet family')
assert.match(alignmentSource, /--be-magenta:\s*255,\s*99,\s*216/, 'Body magenta must match the global Panacea HIG magenta family')
assert.match(alignmentSource, /HIG material hierarchy/i, 'alignment layer must preserve content-vs-control material semantics')
assert.match(alignmentSource, /var\(--pmd-material/, 'translucent workspace controls must inherit the global HIG control material')
assert.match(alignmentSource, /var\(--be-surface-2\).*important/s, 'biomedical content panel must use the calmer raised content surface')
assert.match(alignmentSource, /touch-action:\s*manipulation/, 'direct-manipulation touch semantics must remain enabled')
assert.match(alignmentSource, /Panel groups/, 'legacy BodyExplorer rails must remain included in the same HIG alignment layer')
assert.match(alignmentSource, /prefers-reduced-motion/, 'HIG alignment must retain reduced-motion behavior')

const spineCssSource = readFileSync(resolve('src/pages/bodyExposureConceptSpine.css'), 'utf8')
assert.match(spineCssSource, /\.body-intelligence-workspace__spine\s*\{/, 'concept spine must retain a dedicated orientation surface')
assert.match(spineCssSource, /\.body-intelligence-workspace__spine-stage\.is-active/, 'concept spine must expose a coherent active-stage state')
assert.match(spineCssSource, /\.body-intelligence-workspace__spine-stage\.is-foundational/, 'concept spine must distinguish whole-body/system/function foundation stages')
assert.match(spineCssSource, /overflow-x:\s*auto/, 'concept spine must remain usable on narrow screens')
assert.match(spineCssSource, /@media \(min-width:\s*1024px\)/, 'concept spine must expand coherently on desktop')
assert.match(spineCssSource, /prefers-reduced-motion/, 'concept spine must preserve reduced-motion accessibility')

console.log('body intelligence workspace: seven-stage concept spine + six progressive-disclosure layers validated with direct Intelligence navigation, Panacea HIG token alignment, aligned legacy controls and non-clinical navigation boundaries')
