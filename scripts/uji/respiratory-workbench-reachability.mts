import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const workspace = await readFile(new URL('../../src/pages/bodyhub/BodySystemDeepDiveWorkspace.tsx', import.meta.url), 'utf8')
const workbench = await readFile(new URL('../../src/pages/bodyhub/RespiratoryGasExchangeWorkbench.tsx', import.meta.url), 'utf8')

assert.match(workspace, /selectedAtlasSystemId === 'respiratory'/)
assert.match(workspace, /RespiratoryGasExchangeWorkbench/)
assert.match(workbench, /data-body-respiratory-gas-exchange="v5"/)
assert.match(workbench, /schematic/i)
assert.match(workbench, /not patient-specific/i)
assert.match(workbench, /RESPIRATORY_GAS_EXCHANGE_PROVENANCE/)
console.log('respiratory workbench: selected-system reachability, schematic boundary and provenance locked')
