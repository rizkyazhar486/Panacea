import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const bodySmoke = readFileSync(new URL('../qa/body3d-mobile-smoke-v2.mjs', import.meta.url), 'utf8')
assert.match(
  bodySmoke,
  /waitForSelector\('#pmd-splash',\s*\{\s*state:\s*'detached'/,
  'Body3D mobile smoke no longer waits for the transient startup splash to leave the DOM',
)
assert.match(
  bodySmoke,
  /if \(!centerHit\.unobstructed\) throw new Error\(/,
  'Body3D obstruction assertion was removed while fixing the splash race',
)

const eyeSmoke = readFileSync(new URL('../qa/eye-optics-smoke.mjs', import.meta.url), 'utf8')
const helper = eyeSmoke.match(/async function activateWithKeyboard\(button\) \{[\s\S]*?\n\}/)?.[0] ?? ''
assert.ok(helper, 'activateWithKeyboard helper is missing')
assert.match(helper, /await button\.focus\(\)/, 'keyboard helper no longer focuses the intended control')
assert.match(helper, /await expect\(button\)\.toBeFocused\(\)/, 'keyboard helper no longer proves focus before pressing Enter')
assert.match(helper, /button\.page\(\)\.keyboard\.press\('Enter'\)/, 'keyboard helper no longer sends Enter to the verified active element')
assert.doesNotMatch(
  helper,
  /button\.press\('Enter'\)/,
  'keyboard helper reintroduced the locator-level press cycle that times out under WebGL load',
)

console.log('shared Body3D/eye-optics QA race guards: ok')
