import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const os = readFileSync(resolve('src/pages/BodyExposureOS.tsx'), 'utf8')
const deep = readFileSync(resolve('src/pages/bodyhub/BodySystemDeepDiveWorkspace.tsx'), 'utf8')
const neuro = readFileSync(resolve('src/pages/bodyhub/NeurovascularPerfusionWorkbench.tsx'), 'utf8')

assert.match(deep, /cardiovascular:/)
assert.match(deep, /nervous:/)
assert.match(deep, /if \(!meta\) return null/)
assert.match(deep, /selectedAtlasSystemId === 'cardiovascular'/)
assert.match(deep, /selectedAtlasSystemId === 'nervous'/)
assert.match(deep, /selected-system only/i)
assert.match(deep, /NeurovascularPerfusionWorkbench/)
assert.doesNotMatch(neuro, /selectedAtlasSystemId/, 'brain workbench context must be owned by the shared selected-system workspace')

const bridge = os.indexOf('<AtlasPhysiologyBridgePanel')
const dive = os.indexOf('<BodySystemDeepDiveWorkspace')
const pathophysiology = os.indexOf('<PathophysiologyNetworkPanel')
assert.ok(bridge >= 0 && dive > bridge && pathophysiology > dive)
assert.match(os, /Loading organ-specific function/i)
assert.doesNotMatch(os, /const CardiacHemodynamicsWorkbench = lazy/)
assert.doesNotMatch(os, /const NeurovascularPerfusionWorkbench = lazy/)

console.log('body system deep dive: cardiovascular and nervous labs are independently context-locked between physiology orientation and failure mechanisms')
