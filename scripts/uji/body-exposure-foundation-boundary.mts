import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const os = readFileSync(resolve('src/pages/BodyExposureOS.tsx'), 'utf8')
const visualFirstRuntime = readFileSync(resolve('public/panacea-visual-first-v43.js'), 'utf8')
const visualFirstStyles = readFileSync(resolve('public/panacea-visual-first-v43.css'), 'utf8')
const liquidRuntime = readFileSync(resolve('public/panacea-liquid-actions-v45.js'), 'utf8')
const grading = readFileSync(resolve('public/panacea-control-grading-v46.css'), 'utf8')

assert.match(os, /data-pmd-body-exposure="true"/, 'Body Exposure must declare an explicit product boundary')
assert.match(os, /data-pmd-unclamped="true"/, 'Body Exposure must opt out of generic copy mutation/clamping')
assert.match(os, /data-pmd-liquid="off"/, 'Body Exposure must opt out of generic liquid-action runtime binding')

assert.match(visualFirstRuntime, /\[data-pmd-unclamped=\\"true\\"\]/, 'visual-first runtime must honor the unclamped boundary')
assert.match(visualFirstStyles, /\[data-pmd-unclamped='true'\]/, 'visual-first styles must honor the unclamped boundary')
assert.match(liquidRuntime, /\[data-pmd-liquid=\\"off\\"\]/, 'liquid runtime must honor the local opt-out boundary')

assert.match(os, /LIQUID_ACTIONS_ROOT_CLASS = 'pmd-liquid-actions-v45'/)
assert.match(os, /html\.classList\.remove\(LIQUID_ACTIONS_ROOT_CLASS\)/, 'Body Exposure must suspend the later global control-material selector while mounted')
assert.match(os, /if \(hadLiquidActions\) html\.classList\.add\(LIQUID_ACTIONS_ROOT_CLASS\)/, 'Body Exposure must restore the global control layer when the workspace unmounts')
assert.match(grading, /html\.pmd-liquid-actions-v45/, 'guard assumption changed: review the Body Exposure isolation boundary before removing it')

const bridge = os.indexOf('<AtlasPhysiologyBridgePanel')
const deepDive = os.indexOf('<BodySystemDeepDiveWorkspace')
const pathophysiology = os.indexOf('<PathophysiologyNetworkPanel')
const pharmacology = os.indexOf('<PharmacologyMechanismPanel')
const explorer = os.indexOf('<BodyExplorer')
assert.ok(bridge >= 0 && deepDive > bridge && pathophysiology > deepDive && pharmacology > pathophysiology && explorer > pharmacology,
  'Body Exposure learning flow must remain anatomy/physiology → organ deep dive → pathophysiology → pharmacology → full explorer')

assert.match(os, /selectedAtlasSystemId=\{selectedBodySystemId\}/, 'selected system must keep driving downstream Body workbenches')
assert.match(os, /onSystemChange=\{setSelectedBodySystemId\}/, 'atlas/physiology bridge must remain the shared system-state owner')

console.log('body exposure foundation boundary: generic global UI mutation is isolated while the validated Body learning flow remains intact')
