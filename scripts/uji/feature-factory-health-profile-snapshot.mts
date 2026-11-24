import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const page = await readFile('src/pages/bodyhub/HealthProfile.tsx', 'utf8')
const surfaces = JSON.parse(await readFile('data/feature-factory/surfaces.json', 'utf8')) as {
  surfaces: Array<{ domainId: string; route: string; surface: string }>
}

const surface = surfaces.surfaces.find((item) => item.domainId === 'health-profile')
assert.ok(surface, 'health-profile must have a canonical user-facing surface')
assert.equal(surface?.route, '/health-data', 'health-profile surface must resolve to /health-data')
assert.equal(surface?.surface, 'dedicated', 'health-profile must remain a dedicated usable page')

assert.match(page, /title="My Health Data"/, 'Health Data page must expose its primary snapshot surface')
assert.match(page, /title="Demographics"/, 'snapshot must expose recorded demographics')
assert.match(page, /title="Cardio, Recovery & HRV"/, 'snapshot must expose recorded cardio/recovery fields')
assert.match(page, /title="Sleep & Activity"/, 'snapshot must expose recorded sleep/activity fields')
assert.match(page, /title="Body Composition"/, 'snapshot must expose recorded body-composition fields')
assert.match(page, /Source: \{p\.source\}/, 'snapshot must keep data-source identity visible')
assert.match(page, /Saved \{new Date\(savedAt\)/, 'snapshot must expose the latest save timestamp when present')
assert.match(page, /Loading health data…/, 'snapshot must expose an explicit loading state')
assert.match(page, /savedLocally \? 'Saved on this device\. ' : 'Unable to save on this device\. '/, 'snapshot must report the outcome of local persistence on server failure')
assert.match(page, /error instanceof GalatApi && error\.status === 401[\s\S]*?Sign in with Google or a verified email code[\s\S]*?Server sync failed\. Try saving again\./, 'snapshot must distinguish a rejected session from other sync failures')
assert.match(page, /setSavedAt\(savedLocally \|\| savedOnServer \? now : null\)/, 'snapshot must only report a successful save when storage accepted it')
assert.match(page, /if \(loading\) return/, 'snapshot must not render stale placeholder content while loading')
assert.match(page, /const DEF: HealthProfile = \{[\s\S]*vo2max: 0[\s\S]*restingHr: 0[\s\S]*sleepH: 0/, 'empty metrics must remain zero-valued inputs rather than fabricated observations')
assert.match(page, /history: \[\]/, 'history must begin empty rather than with fabricated trend points')

console.log('Feature Factory health-profile snapshot: reachable, source-labelled, timestamped, loading/offline-safe, and free of fabricated default observations.')
