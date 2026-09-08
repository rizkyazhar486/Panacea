import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../../src/pages/bodyhub/SurgerySimulatorLab.tsx', import.meta.url), 'utf8')

assert.doesNotMatch(
  source,
  /useTransition|startScenarioTransition/,
  'Surgery scenario identity must not be deferred behind a low-priority React transition; the procedure map needs to respond immediately even while WebGL is busy.',
)

assert.match(
  source,
  /function chooseScenario\(id: string\)[\s\S]*?if \(id === scenarioId\) return[\s\S]*?setScenarioId\(id\)/,
  'Scenario selection must synchronously commit the selected scenario before AtlasViewer3D performs its effect-driven GLB teardown/load.',
)

assert.match(
  source,
  /<div className="mt-1 text-sm font-black">\{scenario\.label\}<\/div>/,
  'The selected procedure label must remain visible independently of atlas loading progress.',
)

console.log('✓ surgery scenario identity stays responsive while atlas loading remains effect-driven')
