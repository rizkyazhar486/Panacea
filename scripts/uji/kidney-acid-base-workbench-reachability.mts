import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const workspace = await readFile(new URL('../../src/pages/bodyhub/BodySystemDeepDiveWorkspace.tsx', import.meta.url), 'utf8')
const workbench = await readFile(new URL('../../src/pages/bodyhub/RenalFiltrationWorkbench.tsx', import.meta.url), 'utf8')

assert.match(workspace, /selectedAtlasSystemId === 'urinary'/)
assert.match(workspace, /RenalFiltrationWorkbench/)
assert.match(workbench, /data-body-renal-filtration="v2-acid-base"/)
assert.match(workbench, /KIDNEY_ACID_BASE_RELATIONSHIPS/)
assert.match(workbench, /KIDNEY_ACID_BASE_EVIDENCE/)
assert.match(workbench, /KIDNEY_ACID_BASE_BOUNDARY/)
console.log('kidney acid-base workbench: selected-system reachability into the renal filtration workbench locked')
