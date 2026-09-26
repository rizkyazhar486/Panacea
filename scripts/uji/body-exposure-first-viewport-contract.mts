import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workspace = readFileSync(new URL('../../src/pages/UnifiedBodyWorkspace.tsx', import.meta.url), 'utf8')
const exposure = readFileSync(new URL('../../src/pages/BodyExposureOS.tsx', import.meta.url), 'utf8')

// Body Exposure owns its visible product identity. The parent Your Body workspace
// must provide navigation/accessibility without spending phone-height on a
// second marketing header before the spatial surface.
assert.doesNotMatch(workspace, /flagship atlas/i,
  'Body Exposure parent workspace reintroduced a duplicate flagship badge')
assert.doesNotMatch(workspace, /Your body, from whole person to molecule/i,
  'Body Exposure parent workspace reintroduced a duplicate visible hero')
assert.match(workspace, /<h1 className="sr-only">Your Body · \{active\.label\}<\/h1>/,
  'Your Body workspace must retain one accessible page title')
assert.match(workspace, /data-body-workspace-rail="v1"/,
  'Body workspace navigation must remain directly reachable')
assert.match(workspace, /About \{active\.label\}/,
  'Progressively disclosed workspace help must remain reachable')
assert.match(exposure, /id="body-exposure-os-title"[\s\S]{0,220}?Your body\. Every scale\./,
  'BodyExposureOS must remain the single visible Body Exposure identity header')

const rail = workspace.indexOf('data-body-workspace-rail="v1"')
const panel = workspace.indexOf('<section role="tabpanel"')
assert.ok(rail >= 0 && panel >= 0 && rail < panel,
  'Body workspace navigation must remain before the active Body Exposure panel')

console.log('body-exposure-first-viewport-contract: parent header deduplicated; navigation/help preserved; BodyExposureOS owns visible identity.')
