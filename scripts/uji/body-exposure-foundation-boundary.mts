import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const os = readFileSync(resolve('src/pages/BodyExposureOS.tsx'), 'utf8')
const body3d = readFileSync(resolve('src/components/BodyAllSystems3D.tsx'), 'utf8')
const main = readFileSync(resolve('src/main.tsx'), 'utf8')
const visualFirstRuntime = readFileSync(resolve('public/panacea-visual-first-v43.js'), 'utf8')
const visualFirstStyles = readFileSync(resolve('public/panacea-visual-first-v43.css'), 'utf8')
const liquidRuntime = readFileSync(resolve('public/panacea-liquid-actions-v45.js'), 'utf8')
const grading = readFileSync(resolve('public/panacea-control-grading-v46.css'), 'utf8')

assert.match(os, /data-pmd-body-exposure="true"/, 'Body Exposure must declare an explicit product boundary')
assert.match(os, /data-pmd-unclamped="true"/, 'Body Exposure must opt out of generic copy mutation/clamping')
assert.match(os, /data-pmd-liquid="off"/, 'Body Exposure must opt out of generic liquid-action runtime binding')

assert.match(main, /path="\/body-explorer"\s+element=\{<BodyExplorer\s*\/>\}/,
  'guard assumption changed: /body-explorer is a direct BodyExplorer route and needs runtime-level isolation')
assert.match(visualFirstRuntime, /isBodyExplorerRoute/,
  'visual-first runtime must recognize the direct Body Explorer route')
assert.match(visualFirstRuntime, /if \(isBodyExplorerRoute\(\)\) return false/,
  'visual-first runtime must not mutate Body Explorer copy into context-dialog buttons')
assert.match(liquidRuntime, /isBodyExplorerRoute/,
  'liquid-action runtime must recognize the direct Body Explorer route')
assert.match(liquidRuntime, /if \(isBodyExplorerRoute\(\)\) return false/,
  'liquid-action runtime must not take ownership of Body Explorer controls')

assert.match(visualFirstRuntime, /\[data-pmd-unclamped="true"\]/, 'visual-first runtime must honor the unclamped boundary')
assert.match(visualFirstStyles, /\[data-pmd-unclamped='true'\]/, 'visual-first styles must honor the unclamped boundary')
assert.match(liquidRuntime, /\[data-pmd-liquid="off"\]/, 'liquid runtime must honor the local opt-out boundary')

assert.match(os, /useLayoutEffect\(\(\) =>/, 'Body Exposure presentation isolation must be applied before first paint')
assert.match(os, /LIQUID_ACTIONS_ROOT_CLASS = 'pmd-liquid-actions-v45'/)
assert.match(os, /new MutationObserver\(suppressGlobalControlSkin\)/, 'Body Exposure must keep the global control skin suppressed for the full mount lifecycle')
assert.match(os, /classObserver\.disconnect\(\)/, 'Body Exposure must clean up the class observer on navigation')
assert.match(os, /html\.classList\.remove\(LIQUID_ACTIONS_ROOT_CLASS\)/, 'Body Exposure must suspend the later global control-material selector while mounted')
assert.match(os, /if \(restoreLiquidActions\) html\.classList\.add\(LIQUID_ACTIONS_ROOT_CLASS\)/, 'Body Exposure must restore the global control layer when the workspace unmounts')
assert.match(grading, /html\.pmd-liquid-actions-v45/, 'guard assumption changed: review the Body Exposure isolation boundary before removing it')

const atlas3d = os.indexOf('<BodyAllSystems3D')
const bridge = os.indexOf('<AtlasPhysiologyBridgePanel')
const deepDive = os.indexOf('<BodySystemDeepDiveWorkspace')
const pathophysiology = os.indexOf('<PathophysiologyNetworkPanel')
const pharmacology = os.indexOf('<PharmacologyMechanismPanel')
const explorer = os.indexOf('<BodyExplorer')
assert.ok(atlas3d >= 0 && bridge > atlas3d && deepDive > bridge && pathophysiology > deepDive && pharmacology > pathophysiology && explorer > pharmacology,
  'Body Exposure learning flow must remain 3D anatomy → physiology → organ deep dive → pathophysiology → pharmacology → full explorer')

assert.match(os, /<BodyAllSystems3D selectedSystemId=\{selectedBodySystemId\} onSystemChange=\{setSelectedBodySystemId\}/,
  '3D anatomy atlas must use the same selected-system source of truth as the downstream workbenches')
assert.match(body3d, /const systemId = selectedSystemId \?\? internalSystemId/,
  '3D atlas must support a controlled system id while preserving standalone fallback behavior')
assert.match(body3d, /onSystemChange\?\.\(nextSystemId\)/,
  '3D atlas selection must propagate directly instead of relying on DOM text capture')
assert.doesNotMatch(os, /resolveBodySystemIdFromAtlasLabel|captureSystemAtlasSelection/,
  'Body Exposure must not synchronize anatomy state by scraping button labels from the DOM')
assert.match(os, /selectedAtlasSystemId=\{selectedBodySystemId\}/, 'selected system must keep driving downstream Body workbenches')
assert.match(os, /onSystemChange=\{setSelectedBodySystemId\}/, 'atlas/physiology bridge must remain synchronized with the shared system state')

console.log('body exposure foundation boundary: active route resists global UI mutation and the end-to-end body-system state stays synchronized')
