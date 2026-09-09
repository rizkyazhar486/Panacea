import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildSleepRecordedChecklist, summarizeSleepRecordedChecklist } from '../../src/lib/sleepRecordedChecklist'

const hub = readFileSync('src/pages/PusatTubuh.tsx', 'utf8')
const sleep = readFileSync('src/pages/SleepPattern.tsx', 'utf8')
const surfaces = JSON.parse(readFileSync('data/feature-factory/surfaces.json', 'utf8')) as {
  surfaces: Array<{ domainId: string; route: string; surface: string; label: string }>
}

const surface = surfaces.surfaces.find((item) => item.domainId === 'sleep')
assert.equal(surface?.route, '/tubuh?t=tidur', 'Sleep domain must resolve to the real Body · Sleep tab')
assert.equal(surface?.surface, 'shared', 'Sleep intentionally reuses the Body Signals tab surface')

// Performance: keep the route lazy, bound history, and never add background polling.
assert.match(hub, /const SleepPattern = lazy\(\(\) => import\('\.\/SleepPattern'\)/, 'Sleep Pattern must remain lazy-loaded inside Body Signals')
assert.match(hub, /\{ id: 'tidur', label: 'Sleep'[\s\S]*komponen: SleepPattern/, 'Sleep tab must remain reachable from Body Signals')
assert.match(sleep, /slice\(0, 30\)/, 'Sleep Pattern must bound the rendered history to the latest 30 nights')
assert.doesNotMatch(sleep, /setInterval\(/, 'Sleep Pattern must not introduce repeated polling')

// Snapshot/timeline: descriptive values come from received SleepNight records only.
assert.match(sleep, /const \[nights, setNights\] = useState<SleepNight\[]>\(\[\]\)/, 'sleep history must begin empty rather than with fabricated nights')
assert.match(sleep, /api\.sleepSeries\(\)/, 'sleep records must come from the normalized server series')
assert.match(sleep, /\[\.\.\.nights\]\.sort\([\s\S]*\.slice\(0, 30\)/, 'sleep timeline must sort actual received nights and remain bounded')
assert.match(sleep, /title="Summary" subtitle=\{`Last \$\{ringkas!\.malam\} nights`\}/, 'sleep snapshot must disclose the number of recorded nights summarized')
assert.match(sleep, /title="Night by night"/, 'sleep timeline must expose the recorded nightly sequence')
assert.match(sleep, /new Date\(n\.date \+ 'T00:00:00'\)/, 'nightly entries must retain their actual record date')

// Descriptive trend: summary statistics derive from received values only.
assert.match(sleep, /const totals = urut\.map\(\(n\) => n\.totalH\)\.filter/, 'average sleep must derive from recorded totals')
assert.match(sleep, /const deeps = urut\.map\(\(n\) => n\.deepH\)\.filter/, 'deep-sleep summary must derive from recorded values')
assert.match(sleep, /const rems = urut\.map\(\(n\) => n\.remH\)\.filter/, 'REM summary must derive from recorded values')
assert.match(sleep, /reratatotal: totals\.length \? totals\.reduce/, 'descriptive average must use only recorded totals')

// Chart: missing stage values stay visibly missing instead of becoming fake data.
assert.match(sleep, /const stages = \[[\s\S]*n\.deepH \?\? 0[\s\S]*n\.remH \?\? 0[\s\S]*n\.coreH \?\? 0[\s\S]*n\.awakeH \?\? 0/, 'night chart must use actual received stage fields')
assert.match(sleep, /No stages recorded this night/, 'missing stage data must remain visible')
assert.match(sleep, /title=\{`\$\{s\.k\} \$\{fmtDurasi\(s\.v\)\}`\}/, 'night bars must expose recorded stage detail')

// Graceful fallback and data quality states remain explicit and retryable where possible.
assert.match(sleep, /if \(!backendEnabled\)/, 'Sleep Pattern must have an explicit no-backend state')
assert.match(sleep, /Stage-by-stage sleep detail is filled in by the server/, 'no-backend state must explain why detail is unavailable')
assert.match(sleep, /Could not load sleep data\./, 'upstream failure must be explicit')
assert.match(sleep, /Try again/, 'upstream failure must offer a user-controlled retry')
assert.match(sleep, /Loading…/, 'sleep fetch must expose a loading state')
assert.match(sleep, /No nights recorded yet\./, 'empty sleep history must remain explicit')

// Checklist: complete traceable records pass, while missing provenance/times/units fail closed.
const complete = buildSleepRecordedChecklist([
  {
    date: '2026-09-09',
    start: '2026-09-08T23:10:00+07:00',
    end: '2026-09-09T06:30:00+07:00',
    totalH: 7.1,
    deepH: 1.2,
    remH: 1.5,
    coreH: 4.0,
    awakeH: 0.4,
    source: 'Recorded provider',
  },
])
assert.deepEqual(complete.map((item) => item.id), ['history', 'timestamps', 'source', 'measurements', 'boundary'])
assert.ok(complete.every((item) => item.status === 'ready'))
assert.deepEqual(summarizeSleepRecordedChecklist(complete), { total: 5, ready: 5, attention: 0 })

const missingProvenance = buildSleepRecordedChecklist([
  { date: '2026-09-09', totalH: 7.1 },
])
assert.equal(missingProvenance.find((item) => item.id === 'source')?.status, 'attention')
assert.match(missingProvenance.find((item) => item.id === 'source')?.detail ?? '', /does not infer Apple Health, Oura, WHOOP/i)

const invalidRecord = buildSleepRecordedChecklist([
  { date: 'not-a-date', start: 'also-not-a-date', totalH: -1, deepH: Number.NaN, source: 'Recorded provider' },
])
assert.equal(invalidRecord.find((item) => item.id === 'timestamps')?.status, 'attention')
assert.equal(invalidRecord.find((item) => item.id === 'measurements')?.status, 'attention')
assert.match(invalidRecord.find((item) => item.id === 'measurements')?.detail ?? '', /remain missing instead of being imputed/i)

const empty = buildSleepRecordedChecklist([])
assert.equal(empty.find((item) => item.id === 'history')?.status, 'attention')
assert.equal(empty.find((item) => item.id === 'boundary')?.status, 'ready')
assert.match(empty.find((item) => item.id === 'history')?.detail ?? '', /rather than synthesizing history/i)

const oversized = buildSleepRecordedChecklist(Array.from({ length: 35 }, (_, i) => ({
  date: `2026-08-${String((i % 28) + 1).padStart(2, '0')}`,
  totalH: 7,
  source: 'Recorded provider',
})))
assert.match(oversized.find((item) => item.id === 'history')?.detail ?? '', /30 recorded nights retained/i)

const boundary = complete.find((item) => item.id === 'boundary')
assert.match(boundary?.detail ?? '', /does not validate wearable sleep staging[\s\S]*diagnose[\s\S]*clinically approve/i)
assert.match(sleep, /buildSleepRecordedChecklist/)
assert.match(sleep, /Recorded sleep data checklist/)
assert.match(sleep, /does not clinically validate wearable sleep staging/i)
assert.doesNotMatch(sleep, /\bfetch\s*\(/)
assert.doesNotMatch(sleep, /axios\./)

console.log('feature-factory sleep recorded-data + checklist: ok')
