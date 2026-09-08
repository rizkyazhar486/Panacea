import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const [page, main, surfaces, vitals] = await Promise.all([
  readFile('src/pages/Readiness.tsx', 'utf8'),
  readFile('src/main.tsx', 'utf8'),
  readFile('data/feature-factory/surfaces.json', 'utf8').then((text) => JSON.parse(text) as {
    surfaces: Array<{ domainId: string; route: string; surface: string }>
  }),
  readFile('src/lib/healthVitals.ts', 'utf8'),
])

const surface = surfaces.surfaces.find((item) => item.domainId === 'recovery-stress')
assert.ok(surface, 'recovery-stress must have a canonical user-facing surface')
assert.equal(surface?.route, '/readiness', 'recovery-stress surface must resolve to /readiness')
assert.equal(surface?.surface, 'dedicated', 'recovery-stress must remain a dedicated usable page')
assert.match(main, /const Readiness = lazy\(\(\) => import\('\.\/pages\/Readiness'\)/, 'Readiness must remain lazy-loaded')
assert.match(main, /path="\/readiness"[\s\S]*?<Readiness\s*\/>/, 'the canonical /readiness route must mount Readiness')

// Candidate scope: recorded-input snapshot and provenance-safe plumbing only.
// The page's separate recovery-score, strain-target and behavior-impact formulas
// are deliberately outside this completion evidence and still require their own
// scientific/academic review before any clinical interpretation is promoted.
assert.match(page, /const KEY = 'pmd_readiness_v1'/, 'Readiness must persist its own dated local record')
assert.match(page, /localStorage\.getItem\(KEY\) \|\| '\{\}'/, 'Readiness history must start empty rather than seeded')
assert.match(page, /store\[tk\] \?\? \{ behaviors: \[\], workouts: \[\] \}/, 'today must not fabricate HRV, resting HR or sleep values')
assert.match(page, /if \(!today\.hrv\)[\s\S]*awal\('hrvMs', 0\)/, 'HRV may prefill only from an existing recorded shared vital')
assert.match(page, /if \(!today\.rhr\)[\s\S]*awalBulat\('restingHr', 0\)/, 'resting HR may prefill only from an existing recorded shared vital')
assert.match(page, /if \(!today\.sleepH\)[\s\S]*awal\('sleepH', 0\)/, 'sleep may prefill only from an existing recorded shared vital')
assert.match(page, /KUNCI_VITAL:[\s\S]*hrv: 'hrvMs', rhr: 'restingHr', sleepH: 'sleepH'/, 'recorded inputs must preserve canonical metric identities')
assert.match(page, /mergeVitals\(\{ \[KUNCI_VITAL\[key\]\]: nilai, source: 'Manual', measuredAt: new Date\(\)\.toISOString\(\) \}\)/, 'manual corrections must retain explicit Manual source and measurement timestamp')
assert.match(vitals, /source\?: string[\s\S]*measuredAt\?: string[\s\S]*syncedAt\?: string/, 'shared vitals must preserve source and timestamp provenance')
assert.match(page, /HRV/, 'recorded snapshot must expose HRV input')
assert.match(page, /Resting HR|Resting heart|denyut istirahat/i, 'recorded snapshot must expose resting-HR input')
assert.match(page, /Sleep/, 'recorded snapshot must expose sleep input')

console.log('Feature Factory recovery-stress snapshot: canonical route, empty-by-default recorded inputs, shared-vitals provenance, and no derived-score validation claim.')
