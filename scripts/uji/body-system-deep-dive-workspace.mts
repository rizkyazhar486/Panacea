import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs';import { resolve } from 'node:path'
const os=readFileSync(resolve('src/pages/BodyExposureOS.tsx'),'utf8'),deep=readFileSync(resolve('src/pages/bodyhub/BodySystemDeepDiveWorkspace.tsx'),'utf8')
assert.match(deep,/cardiovascular:/);assert.match(deep,/if\(!meta\) return null/);assert.match(deep,/selectedAtlasSystemId==='cardiovascular'/);assert.match(deep,/selected-system only/i)
const bridge=os.indexOf('<AtlasPhysiologyBridgePanel'),dive=os.indexOf('<BodySystemDeepDiveWorkspace'),path=os.indexOf('<PathophysiologyNetworkPanel');assert.ok(bridge>=0&&dive>bridge&&path>dive);assert.match(os,/organ-specific function/i);assert.doesNotMatch(os,/const CardiacHemodynamicsWorkbench = lazy/)
console.log('body system deep dive: cardiovascular lab is context-locked between physiology orientation and failure mechanisms')
