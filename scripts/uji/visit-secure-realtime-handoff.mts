import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const claude = readFileSync('CLAUDE.md', 'utf8')

assert.match(
  claude,
  /## Visit OS secure realtime handoff — updated 2026-09-20/,
  'CLAUDE.md must carry the current secure Visit realtime handoff',
)

assert.doesNotMatch(
  claude,
  /backend has no canonical server-side visit\/encounter membership registry/i,
  'CLAUDE.md must not retain the resolved Visit membership blocker',
)

for (const required of [
  'canonical server-side visit membership registry resolves the exact patient, clinician, lifecycle, and visit window',
  'replay/sequence protection persists across re-join attempts',
  'canonical membership is re-read before every secure Visit signal',
  'one WebSocket may belong to only one realtime room at a time',
  'These boundaries landed through #1919 and #1921',
  'Remaining Visit work should extend from the current implementation rather than replace it',
]) {
  assert.ok(
    claude.includes(required),
    `CLAUDE.md secure Visit handoff missing current boundary: ${required}`,
  )
}

console.log('visit-secure-realtime-handoff: lulus')
