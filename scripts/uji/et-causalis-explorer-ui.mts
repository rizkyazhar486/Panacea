import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  MULTIORGAN_SCENARIO_SPECS,
  simulateMultiorganCausalTrajectory,
} from '../../src/engines/reality-view/etCausalisMultiorganEngine.ts'

const root = fileURLToPath(new URL('../../', import.meta.url))
const panel = readFileSync(join(root, 'src/components/reality-view/EtCausalisExplorerPanel.tsx'), 'utf8')
const cockpit = readFileSync(join(root, 'src/components/reality-view/RealityViewCockpit.tsx'), 'utf8')
const projector = readFileSync(join(root, 'src/pages/bodyhub/UnifiedHumanSimulationProjector.tsx'), 'utf8')

// 1. Explicit dark-surface marker & scientific honesty disclosure
assert.match(panel, /className="dark\b[^"]*bg-\[#050b18\]/, 'EtCausalisExplorerPanel root section must declare dark marker')
assert.match(panel, /clinically_reviewed=false/, 'EtCausalisExplorerPanel must surface educational non-clinical disclosure')
assert.ok(!panel.includes('as any'), 'EtCausalisExplorerPanel must not use unsafe as any casts')
assert.ok(!panel.includes('localStorage'), 'EtCausalisExplorerPanel must not persist raw browser storage')

// 2. Lazy on-demand mounting in both RealityViewCockpit and Body Disease mode (UnifiedHumanSimulationProjector)
assert.match(cockpit, /lazy\(\(\) => import\('\.\/EtCausalisExplorerPanel'\)\)/, 'RealityViewCockpit must lazy-load EtCausalisExplorerPanel')
assert.match(cockpit, /data-rv-etcausalis-toggle/, 'RealityViewCockpit must expose on-demand Et Causalis toggle')
assert.match(projector, /lazy\(\(\) => import\('\.\.\/\.\.\/components\/reality-view\/EtCausalisExplorerPanel'\)\)/, 'UnifiedHumanSimulationProjector must lazy-load EtCausalisExplorerPanel')
assert.match(projector, /Et Causalis · 25-Scenario Systemic Multiorgan Engine/, 'Body Disease mode must expose Et Causalis fold')

// 3. Engine backing sanity: 25 scenarios present & deterministic ODE response
assert.equal(MULTIORGAN_SCENARIO_SPECS.length, 25, 'Et Causalis must ship all 25 systemic scenarios')
const sepsis = simulateMultiorganCausalTrajectory({
  scenarioId: '8_SEPTIC_SHOCK_EARLY',
  cohortId: 'ADULT_MALE_REFERENCE',
  durationMinutes: 30,
  stepMinutes: 5,
  fluidBolusMl: 1000,
  vasopressorGain: 0.4,
})
assert.ok(sepsis.timeline.length >= 6, 'Timeline must integrate multiple timepoints')
assert.equal(sepsis.truthClass, 'SIMULATED_EDUCATIONAL')
console.log('et-causalis-explorer-ui: PASS (25 scenarios, dark marker, lazy Cockpit + Body Disease mount)')
