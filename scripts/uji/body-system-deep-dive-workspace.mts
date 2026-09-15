import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const os = readFileSync(resolve('src/pages/BodyExposureOS.tsx'), 'utf8')
const deepDive = readFileSync(resolve('src/pages/bodyhub/BodySystemDeepDiveWorkspace.tsx'), 'utf8')

assert.match(deepDive, /cardiovascular:\s*\{/, 'deep-dive registry must expose cardiovascular context')
assert.match(deepDive, /nervous:\s*\{/, 'deep-dive registry must expose nervous-system context')
assert.match(deepDive, /respiratory:\s*\{/, 'deep-dive registry must expose respiratory context')
assert.match(deepDive, /if \(!meta\) return null/, 'systems without an authored deep dive must remain empty rather than inherit another organ workspace')

assert.match(deepDive, /selectedAtlasSystemId === 'cardiovascular'/, 'cardiac workbench must be context-locked to the cardiovascular atlas system')
assert.match(deepDive, /CardiacHemodynamicsWorkbench selectedAtlasSystemId=\{selectedAtlasSystemId\}/, 'deep-dive workspace must pass live atlas context into the cardiac lab')
assert.match(deepDive, /selectedAtlasSystemId === 'nervous'/, 'neurovascular workbench must be context-locked to the nervous atlas system')
assert.match(deepDive, /NeurovascularPerfusionWorkbench selectedAtlasSystemId=\{selectedAtlasSystemId\}/, 'deep-dive workspace must pass live atlas context into the neurovascular lab')
assert.match(deepDive, /selectedAtlasSystemId === 'respiratory'/, 'respiratory workbench must be context-locked to the respiratory atlas system')
assert.match(deepDive, /RespiratoryGasExchangeWorkbench selectedAtlasSystemId=\{selectedAtlasSystemId\}/, 'deep-dive workspace must pass live atlas context into the respiratory lab')
assert.match(deepDive, /selected-system only/i, 'deep-dive UI must explain its contextual scope')

const bridgeIndex = os.indexOf('<AtlasPhysiologyBridgePanel')
const deepDiveIndex = os.indexOf('<BodySystemDeepDiveWorkspace')
const intelligenceIndex = os.indexOf('<BodyIntelligenceWorkspace')
assert.ok(bridgeIndex >= 0, 'OS must retain anatomy↔physiology bridge')
assert.ok(deepDiveIndex > bridgeIndex, 'system deep dive must appear after anatomy↔physiology orientation')
assert.ok(intelligenceIndex > deepDiveIndex, 'intelligence/failure/mechanism workspace must remain after organ-function deep dive')
assert.match(os, /organ-specific function/i, 'top-level Body concept copy must acknowledge progressive organ-function depth')
assert.doesNotMatch(os, /const CardiacHemodynamicsWorkbench = lazy/, 'OS shell must not directly accumulate cardiac workbench wiring')
assert.doesNotMatch(os, /const NeurovascularPerfusionWorkbench = lazy/, 'OS shell must not directly accumulate neurovascular workbench wiring')
assert.doesNotMatch(os, /const RespiratoryGasExchangeWorkbench = lazy/, 'OS shell must not directly accumulate respiratory workbench wiring')

console.log('body system deep-dive workspace: heart, neurovascular and respiratory labs are isolated by selected atlas context and composed between physiology orientation and intelligence layers')
