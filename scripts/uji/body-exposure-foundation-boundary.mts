import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const os = readFileSync(resolve('src/pages/BodyExposureOS.tsx'), 'utf8')
const projector = readFileSync(resolve('src/pages/bodyhub/UnifiedHumanSimulationProjector.tsx'), 'utf8')
const explorerPage = readFileSync(resolve('src/pages/BodyExplorer.tsx'), 'utf8')
const routes = readFileSync(resolve('src/main.tsx'), 'utf8')
const body3d = readFileSync(resolve('src/components/BodyAllSystems3D.tsx'), 'utf8')
const visualFirstRuntime = readFileSync(resolve('public/panacea-visual-first-v43.js'), 'utf8')
const visualFirstStyles = readFileSync(resolve('public/panacea-visual-first-v43.css'), 'utf8')
const liquidRuntime = readFileSync(resolve('public/panacea-liquid-actions-v45.js'), 'utf8')
const grading = readFileSync(resolve('public/panacea-control-grading-v46.css'), 'utf8')

assert.match(os, /data-pmd-body-exposure="true"/, 'Body Exposure must declare an explicit product boundary')
assert.match(os, /data-pmd-unclamped="true"/, 'Body Exposure must opt out of generic copy mutation/clamping')
assert.match(os, /data-pmd-liquid="off"/, 'Body Exposure must opt out of generic liquid-action runtime binding')

assert.match(routes, /path="\/body-explorer"\s+element=\{<BodyExplorer \/>\}/,
  'the standalone Body Explorer route remains an accepted entry point and therefore needs its own runtime boundary')
assert.match(explorerPage, /data-pmd-body-exposure="true"/,
  'standalone Body Explorer must declare the same Body product boundary as Body Exposure OS')
assert.match(explorerPage, /data-pmd-unclamped="true"/,
  'standalone Body Explorer must block generic visual-first copy mutation so Body controls cannot open global context dialogs')
assert.match(explorerPage, /data-pmd-liquid="off"/,
  'standalone Body Explorer must block generic liquid-action binding on Body controls')

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

const projectorMount = os.indexOf('<UnifiedHumanSimulationProjector')
const explorer = os.indexOf('<BodyExplorer')
assert.ok(projectorMount >= 0 && explorer > projectorMount,
  'the unified simulation projector must remain the primary Body Exposure experience before the full legacy explorer')

const domainTokens = [
  "id: 'anatomy'",
  "id: 'physiology'",
  "id: 'pathophysiology'",
  "id: 'biomechanics'",
  "id: 'cell'",
  "id: 'genome'",
  "id: 'surgery'",
  "id: 'pharmacology'",
]
const domainPositions = domainTokens.map((token) => projector.indexOf(token))
assert.ok(domainPositions.every((position) => position >= 0), 'every unified simulation domain must remain declared')
for (let index = 1; index < domainPositions.length; index += 1) {
  assert.ok(domainPositions[index] > domainPositions[index - 1],
    'the unified domain ladder must remain anatomy → physiology → pathophysiology → biomechanics → cell → genome → surgery → pharmacology')
}

for (const requiredEngine of [
  'BodyAllSystems3D',
  'AtlasPhysiologyBridgePanel',
  'BodySystemDeepDiveWorkspace',
  'PathophysiologyNetworkPanel',
  'BiomechanicsMotionLab',
  'CellLab',
  'AlphaGenomeAtlas',
  'SurgicalLab',
  'PharmacologyMechanismPanel',
]) {
  assert.match(projector, new RegExp(requiredEngine), `${requiredEngine} must remain integrated in the unified projector`)
}

assert.match(os, /selectedSystemId=\{selectedBodySystemId\}/,
  'Body Exposure must pass the shared selected-system state into the unified projector')
assert.match(os, /onSystemChange=\{setSelectedBodySystemId\}/,
  'Body Exposure must receive source-atlas system changes through controlled React state')
assert.match(projector, /selectedAtlasSystemId=\{selectedSystemId\}/,
  'the selected system must keep driving physiology, deep-dive, pathology and pharmacology projections')
assert.match(projector, /<BodyAllSystems3D[\s\S]*selectedSystemId=\{selectedSystemId\}[\s\S]*onSystemChange=\{onSystemChange\}/,
  'the 3D source atlas must use the same selected-system source of truth as the simulation projections')
assert.match(body3d, /const systemId = selectedSystemId \?\? internalSystemId/,
  '3D atlas must support a controlled system id while preserving standalone fallback behavior')
assert.match(body3d, /onSystemChange\?\.\(nextSystemId\)/,
  '3D atlas selection must propagate directly instead of relying on DOM text capture')
assert.doesNotMatch(os, /resolveBodySystemIdFromAtlasLabel|captureSystemAtlasSelection/,
  'Body Exposure must not synchronize anatomy state by scraping button labels from the DOM')
assert.match(projector, /Generic atlas geometry and synthetic models are not patient-specific anatomy/,
  'the unified projector must preserve an explicit reference/simulation clinical boundary')

console.log('body exposure foundation boundary: global UI isolation is preserved and one controlled system state now drives the unified multi-scale simulation projector')
