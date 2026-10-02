import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const os = readFileSync(resolve('src/pages/BodyExposureOS.tsx'), 'utf8')
const projector = readFileSync(resolve('src/pages/bodyhub/UnifiedHumanSimulationProjector.tsx'), 'utf8')
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

const physiologyCase = projector.indexOf("case 'physiology':")
const bridge = projector.indexOf('<AtlasPhysiologyBridgePanel', physiologyCase)
const dive = projector.indexOf('<BodySystemDeepDiveWorkspace', bridge)
const pathophysiologyCase = projector.indexOf("case 'pathophysiology':", dive)
const pathophysiology = projector.indexOf('<PathophysiologyNetworkPanel', pathophysiologyCase)
assert.ok(physiologyCase >= 0 && bridge > physiologyCase && dive > bridge && pathophysiologyCase > dive && pathophysiology > pathophysiologyCase,
  'physiology orientation and organ deep dive must stay coupled before the pathophysiology projection')
assert.match(projector, /BodySystemDeepDiveWorkspace selectedAtlasSystemId=\{selectedSystemId\}/,
  'organ deep dive must consume the projector shared-system context')
assert.match(projector, /PathophysiologyNetworkPanel selectedAtlasSystemId=\{selectedSystemId\}/,
  'pathophysiology must consume the same projector shared-system context')
assert.match(os, /UnifiedHumanSimulationProjector/)
assert.doesNotMatch(os, /const CardiacHemodynamicsWorkbench = lazy/)
assert.doesNotMatch(os, /const NeurovascularPerfusionWorkbench = lazy/)

console.log('body system deep dive: cardiovascular and nervous labs remain context-locked inside the unified physiology → pathophysiology projector flow')
