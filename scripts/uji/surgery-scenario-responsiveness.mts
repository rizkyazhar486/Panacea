import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const simulatorSource = await readFile(new URL('../../src/pages/bodyhub/SurgerySimulatorLab.tsx', import.meta.url), 'utf8')
const shellSource = await readFile(new URL('../../src/pages/bodyhub/SurgicalLab.tsx', import.meta.url), 'utf8')

assert.doesNotMatch(
  simulatorSource,
  /useTransition|startScenarioTransition/,
  'Surgery scenario identity must not be deferred behind a low-priority React transition; the procedure map needs to respond immediately even while WebGL is busy.',
)

assert.match(
  simulatorSource,
  /function chooseScenario\(id: string\)[\s\S]*?if \(id === scenarioId\) return[\s\S]*?setScenarioId\(id\)/,
  'Scenario selection must synchronously commit the selected scenario before AtlasViewer3D performs its effect-driven GLB teardown/load.',
)

assert.match(
  simulatorSource,
  /<div className="mt-1 text-sm font-black">\{scenario\.label\}<\/div>/,
  'The selected procedure label must remain visible independently of atlas loading progress.',
)

assert.match(
  shellSource,
  /const SurgerySimulatorLab = lazy\(\(\) => import\('\.\/SurgerySimulatorLab'\)\)/,
  'The WebGL-heavy surgery simulator must stay lazy behind the lightweight SurgicalLab shell.',
)

assert.match(
  shellSource,
  /const \[simulatorReady, setSimulatorReady\] = useState\(false\)/,
  'SurgicalLab must render a lightweight shell before mounting the simulator.',
)

assert.match(
  shellSource,
  /requestAnimationFrame\(\(\) => setSimulatorReady\(true\)\)/,
  'Heavy simulator mounting must be deferred until the frame after the surgical tab shell commits.',
)

assert.match(
  shellSource,
  /data-surgery-workspace-state="opening"[\s\S]*?Opening surgical workspace…/,
  'The surgical tab needs immediate visible feedback while the heavy simulator mount is deferred.',
)

assert.doesNotMatch(
  shellSource,
  /import SurgerySimulatorLab,\s*\{[^}]*SurgerySharedView[^}]*\}\s*from '\.\/SurgerySimulatorLab'/,
  'SurgicalLab must not reintroduce an eager runtime import of the simulator.',
)

console.log('✓ surgery tab and scenario identity stay responsive while atlas/WebGL work remains deferred')
