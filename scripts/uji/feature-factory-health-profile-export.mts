import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const page = await readFile('src/pages/HealthProfile.tsx', 'utf8')
const surfaces = JSON.parse(await readFile('data/feature-factory/surfaces.json', 'utf8')) as {
  surfaces: Array<{ domainId: string; route: string; surface: string }>
}

const surface = surfaces.surfaces.find((item) => item.domainId === 'health-profile')
assert.ok(surface, 'health-profile must have a canonical user-facing surface')
assert.equal(surface?.route, '/health-data', 'health-profile export must remain reachable at /health-data')
assert.equal(surface?.surface, 'dedicated', 'health-profile export must remain on a dedicated usable page')

assert.match(page, /function download\(name: string, text: string, type: string\)/, 'health-profile must keep one explicit download boundary')
assert.match(page, /void simpanTeks\(text, name, type, 'Panaceamed\.id'\)/, 'exports must flow through the shared user-triggered text-download helper')

assert.match(page, /function exportJson\(\) \{[\s\S]*JSON\.stringify\(p, null, 2\)/, 'JSON export must serialize the recorded HealthProfile snapshot without hidden synthesis')
assert.match(page, /health-data-\$\{hariIni\(\)\}\.json/, 'JSON export filename must carry an explicit local date')
assert.match(page, /application\/json/, 'JSON export must use an explicit JSON media type')

assert.match(page, /function exportCsv\(\)/, 'health-profile must keep a dedicated history CSV export')
assert.match(page, /const rows = p\.history \?\? \[\]/, 'CSV export must derive only from persisted history records')
assert.match(page, /if \(!rows\.length\) \{ setErr\('No history to export yet — save your data first\.'\); return \}/, 'empty history must fail closed instead of fabricating rows')
assert.match(page, /const cols: \(keyof Snapshot\)\[\] = \['date', 'vo2max', 'restingHr', 'hrvMs', 'recoveryPct', 'sleepH'\]/, 'CSV export columns must remain explicit and provenance-preserving')
assert.match(page, /cols\.map\(\(c\) => r\[c\] \?\? ''\)\.join\(','\)/, 'missing CSV values must remain missing rather than being imputed')
assert.match(page, /health-history-\$\{hariIni\(\)\}\.csv/, 'CSV export filename must carry an explicit local date')
assert.match(page, /text\/csv/, 'CSV export must use an explicit CSV media type')

assert.match(page, /onClick=\{exportJson\}[\s\S]*Download JSON/, 'JSON export must require an explicit user action')
assert.match(page, /onClick=\{exportCsv\}[\s\S]*Download history CSV/, 'CSV export must require an explicit user action')

const exportSlice = page.slice(page.indexOf('function download('), page.indexOf('const num ='))
assert.doesNotMatch(exportSlice, /fetch\(|api\.|backendEnabled/, 'export functions must not make hidden network calls')
assert.doesNotMatch(exportSlice, /Math\.|generateInsights|benchmark|estimate|predict|infer/i, 'export functions must not derive hidden scores, estimates or predictions')

console.log('Feature Factory health-profile export: dedicated, user-triggered, local, date-stamped, bounded to recorded snapshot/history, explicit-column, and no hidden synthesis.')
