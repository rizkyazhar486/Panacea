import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function read(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

const unifiedBody = read('src/pages/UnifiedBodyWorkspace.tsx')
const clinical = read('src/pages/ClinicalHub.tsx')
const explorer = read('src/pages/BodyExplorer.tsx')
const systems = read('src/components/BodyAllSystems3D.tsx')
const portal = read('src/components/BodyExposurePortal.tsx')
const navigator = read('src/components/BodyExposureActivityNavigator.tsx')
const activities = read('src/lib/bodyExposureActivities.ts')

assert.ok(
  !unifiedBody.includes('PersonalBodyAvatar3D'),
  'Your Body must not use the standalone mannequin/avatar as its primary body surface',
)
assert.match(
  unifiedBody,
  /<BodyExposurePortal context="personal"/,
  'Your Body must embed the canonical Body Exposure portal',
)
assert.match(
  clinical,
  /<BodyExposurePortal context="clinical"/,
  'Clinical must embed the canonical Body Exposure portal',
)
assert.ok(
  !clinical.includes("const layerGlyph"),
  'Clinical must not substitute anatomy with symbolic placeholder glyphs',
)
assert.match(
  explorer,
  /<BodyExposureActivityNavigator/,
  'Body Explorer must use progressive activity navigation',
)
assert.ok(
  !explorer.includes('ref={barisTab}'),
  'Body Explorer must not restore the all-features horizontal tab wall',
)
assert.match(
  explorer,
  /searchParams\.get\('panel'\)/,
  'Body Explorer must accept deep-linked activities from compiled super pages',
)
assert.match(
  systems,
  /presentation\?: 'full' \| 'compact'/,
  'Canonical source-backed renderer must expose compact embedding without forking anatomy',
)
assert.match(
  portal,
  /<BodyAllSystems3D[\s\S]*presentation="compact"[\s\S]*startOpen/,
  'Shared portal must reuse BodyAllSystems3D rather than a duplicate renderer',
)
assert.match(
  navigator,
  /Find anatomy, physiology, disease, surgery/,
  'Large capability sets must remain searchable',
)
assert.match(
  navigator,
  /max-h-64/,
  'Expanded activities must stay bounded so the page remains compact',
)

const activityCount = (activities.match(/\{ key: '/g) || []).length
assert.ok(activityCount >= 40, `expected the existing Body Exposure capability set to remain intact; found ${activityCount}`)

console.log(`body exposure super-page compile: canonical anatomy embedded in Your Body + Clinical; ${activityCount} activities preserved behind progressive navigation`)
