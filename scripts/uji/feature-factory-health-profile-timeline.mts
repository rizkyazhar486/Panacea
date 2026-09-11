import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const page = await readFile('src/pages/HealthProfile.tsx', 'utf8')
const surfaces = JSON.parse(await readFile('data/feature-factory/surfaces.json', 'utf8')) as {
  surfaces: Array<{ domainId: string; route: string; surface: string }>
}

const surface = surfaces.surfaces.find((item) => item.domainId === 'health-profile')
assert.ok(surface, 'health-profile must have a canonical user-facing surface')
assert.equal(surface?.route, '/health-data', 'health-profile timeline must remain reachable at /health-data')
assert.equal(surface?.surface, 'dedicated', 'health-profile timeline must remain on a dedicated usable page')

assert.match(page, /interface Snapshot \{[\s\S]*date: string/, 'timeline records must carry an explicit date')
assert.match(page, /function withSnapshot\(cur: HealthProfile\): Snapshot\[\]/, 'timeline must use a deterministic snapshot builder')
assert.match(page, /const prev = \(cur\.history \?\? \[\]\)\.filter\(\(s\) => s\.date !== today\)/, 'timeline must replace same-day records instead of duplicating them')
assert.match(page, /return \[\.\.\.prev, snap\]\.slice\(-90\)/, 'timeline history must stay bounded to the latest 90 daily records')
assert.match(page, /title="Trends" subtitle=\{`\$\{history\.length\} records saved`\}/, 'timeline must expose the number of saved records')
assert.match(page, /title="Trends" subtitle="The chart appears after ≥2 saves"/, 'timeline must expose a meaningful empty state before a trend can be drawn')
assert.match(page, /Download history CSV/, 'timeline must expose a portable user-controlled history export')
assert.match(page, /const cols: \(keyof Snapshot\)\[\] = \['date', 'vo2max', 'restingHr', 'hrvMs', 'recoveryPct', 'sleepH'\]/, 'timeline export must preserve the explicit recorded fields without hidden synthesis')
assert.match(page, /const data = history\.map\(\(s\) => \(\{ \.\.\.s, label:/, 'trend chart must derive labels from persisted timeline records')
assert.doesNotMatch(page, /history:\s*\[[^\]]+\]/, 'timeline must not seed fabricated historical observations')

console.log('Feature Factory health-profile timeline: reachable, date-stamped, same-day deduplicated, 90-record bounded, exportable, and empty-state safe.')
