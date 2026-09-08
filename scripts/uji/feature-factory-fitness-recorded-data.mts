import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const hub = await readFile('src/pages/PusatLatihan.tsx', 'utf8')
const history = await readFile('src/pages/WorkoutHistory.tsx', 'utf8')
const charts = await readFile('src/components/GrafikOlahraga.tsx', 'utf8')
const store = await readFile('src/lib/workoutStore.ts', 'utf8')
const importQa = await readFile('scripts/uji/workout-import-integrity.mts', 'utf8')
const analyticsQa = await readFile('scripts/uji/training-analytics.mts', 'utf8')
const summaryQa = await readFile('scripts/uji/workout-summary.mts', 'utf8')
const surfaces = JSON.parse(await readFile('data/feature-factory/surfaces.json', 'utf8')) as {
  surfaces: Array<{ domainId: string; route: string; surface: string }>
}

const surface = surfaces.surfaces.find((item) => item.domainId === 'fitness')
assert.equal(surface?.route, '/latihan', 'Fitness must remain reachable through the Training Lab')
assert.equal(surface?.surface, 'dedicated', 'Training Lab is the dedicated fitness surface')

// Performance: the large training workbenches are route/tab lazy and local
// history is capped before expensive per-session sensor traces can grow forever.
assert.match(hub, /const WorkoutHistory = lazy\(\(\) => import\('\.\/WorkoutHistory'\)/, 'training history must remain lazy-loaded')
assert.match(hub, /const AnalisisPro = lazy\(\(\) => import\('\.\/AnalisisPro'\)/, 'training analysis must remain lazy-loaded')
assert.match(store, /const MAX_WORKOUTS = 200/, 'stored workout history must remain bounded')
assert.match(store, /const MAX_NOTIFS = 100/, 'stored HR notifications must remain bounded')
assert.match(store, /cachedWorkoutRaw/, 'repeated localStorage parsing must remain cached for shared widget reads')

// Snapshot + fail-closed data quality: the Training Lab uses real stored sessions
// and pauses derived status when required profile inputs are absent.
assert.match(hub, /const workouts = getWorkouts\(\)/, 'Training Lab snapshot must start from the recorded workout store')
assert.match(hub, /if \(!workouts\.length\)/, 'Training Lab must preserve an explicit no-session state')
assert.match(hub, /Training-load model paused rather than inventing profile values\./, 'missing profile inputs must pause derived training status rather than fabricate defaults')
assert.match(store, /function normalisasiWorkout\(w: unknown\)/, 'runtime workout storage must be sanitized at the trust boundary')
assert.match(store, /if \(typeof x\.id !== 'string' \|\| !x\.id\.trim\(\)\) return null/, 'invalid workout identity must fail closed')
assert.match(store, /if \(Number\.isNaN\(mulaiTs\)\) return null/, 'invalid workout timestamps must fail closed')
assert.match(store, /if \(hrr1 !== undefined && pemulihan\.some\(\(p\) => p\.t >= 45 && p\.t <= 75\)\) hasil\.hrr1 = hrr1/, 'cached HRR1 must retain timing evidence before being reused')

// Validated import: deterministic QA already exercises timestamp/order/negative
// values and forbids synthetic sensor timestamps.
assert.match(importQa, /invalid or pre-start HR samples must be dropped instead of receiving synthetic timestamps/, 'workout import must reject synthetic HR timing')
assert.match(importQa, /negative step-count samples must not reduce valid recorded steps/, 'workout import must sanitize malformed step samples')
assert.match(importQa, /an end timestamp before start must not anchor recovery/, 'workout recovery timing must fail closed on invalid ordering')

// Offline/fallback: local history remains the primary usable cache and a failed
// server pull does not erase it. Incoming imports merge instead of replacing history.
assert.match(store, /Tidak ada\n\/\/ yang dikirim ke mana pun\./, 'workout local store must remain local-only')
assert.match(history, /\.catch\(\(\) => \{ \/\* offline: yang tersimpan lokal tetap tampil \*\/ \}\)/, 'server pull failure must preserve local workout history')
assert.match(store, /Menggabungkan hasil impor dengan yang sudah tersimpan/, 'new workout imports must merge with retained local history')
assert.match(history, /No sessions stored yet\./, 'fitness history must expose an explicit empty state')

// Timeline/trend/chart: recorded sessions drive the view; sparse/missing data is
// not drawn as false zeroes and low-coverage fields do not become fake trends.
assert.match(history, /title="Sessions" subtitle="Tap a session to see its heart-rate curve and zone breakdown"/, 'recorded session timeline must remain reachable')
assert.match(history, /<GrafikOlahraga workouts=\{workouts\} hrMax=\{hrMax\} \/>/, 'fitness timeline must feed recorded sessions into the shared chart surface')
assert.match(charts, /const MIN_SESI = 5/, 'fitness trend rendering must require a minimum recorded-session count')
assert.match(charts, /nilai: \(number \| null\)\[]/, 'fitness line charts must preserve explicit missing points')
assert.match(charts, /if \(v === null\)[\s\S]*kini = \[\]/, 'missing days must break the line rather than draw a false drop to zero')
assert.match(charts, /role="img" aria-label="trend chart"/, 'fitness line charts must keep accessible chart semantics')
assert.match(charts, /\(\[30, 90\] as const\)/, 'fitness chart history selector must remain bounded to explicit 30/90-day windows')

// Existing deterministic analytics guards keep the descriptive trend contract
// tied to valid recorded fields only.
assert.match(analyticsQa, /7\/28-day charts and HRR1 trends only from valid recorded fields/, 'training analytics must stay recorded-data only')
assert.match(summaryQa, /invalid duration must not poison total training minutes/, 'weekly summaries must survive malformed optional metrics')
assert.match(summaryQa, /non-distance workout duration must not contaminate aggregate pace/, 'aggregate pace must use distance-bearing sessions only')

console.log('Feature Factory fitness recorded-data: snapshot, timeline, chart/trend, validated import, offline/fallback, data-quality, performance and deterministic QA are guarded without adding clinical recommendations.')
