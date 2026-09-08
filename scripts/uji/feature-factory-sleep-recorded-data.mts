import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const hub = await readFile('src/pages/PusatTubuh.tsx', 'utf8')
const sleep = await readFile('src/pages/SleepPattern.tsx', 'utf8')
const surfaces = JSON.parse(await readFile('data/feature-factory/surfaces.json', 'utf8')) as {
  surfaces: Array<{ domainId: string; route: string; surface: string; label: string }>
}

const surface = surfaces.surfaces.find((item) => item.domainId === 'sleep')
assert.equal(surface?.route, '/tubuh?t=tidur', 'Sleep domain must resolve to the real Body · Sleep tab')
assert.equal(surface?.surface, 'shared', 'Sleep intentionally reuses the Body Signals tab surface')

// Performance: the body hub defers the sleep implementation until the tab is
// opened, and the sleep page bounds historical rendering to the latest 30 nights.
assert.match(hub, /const SleepPattern = lazy\(\(\) => import\('\.\/SleepPattern'\)/, 'Sleep Pattern must remain lazy-loaded inside Body Signals')
assert.match(hub, /\{ id: 'tidur', label: 'Sleep'[\s\S]*komponen: SleepPattern/, 'Sleep tab must remain reachable from Body Signals')
assert.match(sleep, /slice\(0, 30\)/, 'Sleep Pattern must bound the rendered history to the latest 30 nights')
assert.doesNotMatch(sleep, /setInterval\(/, 'Sleep Pattern must not introduce repeated polling')

// Snapshot/timeline: all descriptive values come from the received SleepNight
// series; no seeded nights or fake stage samples are introduced.
assert.match(sleep, /const \[nights, setNights\] = useState<SleepNight\[]>\(\[\]\)/, 'sleep history must begin empty rather than with fabricated nights')
assert.match(sleep, /api\.sleepSeries\(\)/, 'sleep records must come from the normalized server series')
assert.match(sleep, /\[\.\.\.nights\]\.sort\([\s\S]*\.slice\(0, 30\)/, 'sleep timeline must sort actual received nights and remain bounded')
assert.match(sleep, /title="Summary" subtitle=\{`Last \$\{ringkas!\.malam\} nights`\}/, 'sleep snapshot must disclose the number of recorded nights summarized')
assert.match(sleep, /title="Night by night"/, 'sleep timeline must expose the recorded nightly sequence')
assert.match(sleep, /new Date\(n\.date \+ 'T00:00:00'\)/, 'nightly entries must retain their actual record date')

// Descriptive trend: summary statistics are computed from received values only;
// no population reference, prediction, or diagnosis is needed for this capability.
assert.match(sleep, /const totals = urut\.map\(\(n\) => n\.totalH\)\.filter/, 'average sleep must derive from recorded totals')
assert.match(sleep, /const deeps = urut\.map\(\(n\) => n\.deepH\)\.filter/, 'deep-sleep summary must derive from recorded values')
assert.match(sleep, /const rems = urut\.map\(\(n\) => n\.remH\)\.filter/, 'REM summary must derive from recorded values')
assert.match(sleep, /reratatotal: totals\.length \? totals\.reduce/, 'descriptive average must fail to zero only when no recorded totals exist')

// Chart: nightly bars are built from actual stage values and explicitly show
// missing stage data instead of inventing a distribution.
assert.match(sleep, /const stages = \[[\s\S]*n\.deepH \?\? 0[\s\S]*n\.remH \?\? 0[\s\S]*n\.coreH \?\? 0[\s\S]*n\.awakeH \?\? 0/, 'night chart must use actual received stage fields')
assert.match(sleep, /No stages recorded this night/, 'missing stage data must remain visible')
assert.match(sleep, /title=\{`\$\{s\.k\} \$\{fmtDurasi\(s\.v\)\}`\}/, 'night bars must expose recorded stage detail without a hidden synthetic tooltip')

// Graceful fallback and data quality: backend-disabled, load failure, loading,
// empty series and stage-missing states are all explicit and retryable where possible.
assert.match(sleep, /if \(!backendEnabled\)/, 'Sleep Pattern must have an explicit no-backend state')
assert.match(sleep, /Stage-by-stage sleep detail is filled in by the server/, 'no-backend state must explain why detail is unavailable')
assert.match(sleep, /Could not load sleep data\./, 'upstream failure must be explicit')
assert.match(sleep, /Try again/, 'upstream failure must offer a user-controlled retry')
assert.match(sleep, /Loading…/, 'sleep fetch must expose a loading state')
assert.match(sleep, /No nights recorded yet\./, 'empty sleep history must remain explicit')
assert.match(sleep, /No stages recorded this night/, 'per-night stage missingness must remain explicit')

console.log('Feature Factory sleep recorded-data: snapshot, bounded timeline, descriptive trend, nightly chart, fallback/data-quality states, performance and deterministic QA are guarded without promoting medical interpretation.')
