import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const page = await readFile('src/pages/HealthProfile.tsx', 'utf8')
const healthImport = await readFile('src/lib/healthImport.ts', 'utf8')
const surfaces = JSON.parse(await readFile('data/feature-factory/surfaces.json', 'utf8')) as {
  surfaces: Array<{ domainId: string; route: string; surface: string }>
}

const surface = surfaces.surfaces.find((item) => item.domainId === 'health-profile')
assert.equal(surface?.route, '/health-data', 'Health Profile foundation capabilities must remain reachable from /health-data')
assert.equal(surface?.surface, 'dedicated', 'Health Profile must remain a dedicated usable product surface')

// Export: explicit user action, real stored values only, no hidden synthesis.
assert.match(page, /function exportJson\(\)[\s\S]*JSON\.stringify\(p, null, 2\)/, 'JSON export must serialize the actual Health Profile state')
assert.match(page, /function exportCsv\(\)[\s\S]*const rows = p\.history \?\? \[\]/, 'CSV export must use the actual recorded history')
assert.match(page, /No history to export yet — save your data first\./, 'empty history must fail closed instead of exporting fabricated rows')
assert.match(page, /Download history CSV/, 'history export must remain explicitly user controlled')

// Validated import: bounded payload, local parser for structured files, provenance retained.
assert.match(page, /MAX_IMPORT_BYTES = 60 \* 1024 \* 1024/, 'Health Profile import must cap large browser payloads')
assert.match(page, /parseHealthFile\(file\.name, text\)/, 'structured health exports must pass through the validated parser')
assert.match(page, /mergeVitals\(\{ \.\.\.r, source: r\.source, measuredAt: r\.measuredAt \}\)/, 'validated imports must preserve source identity and measurement timestamp')
assert.match(page, /No recognizable data found in that file/, 'unrecognized imports must fail closed with a meaningful empty state')
assert.match(healthImport, /Everything runs client-side — no file ever leaves the device/, 'structured-file parser must remain local-first')
assert.match(healthImport, /out\.measuredAt = new Date\(newest\)\.toISOString\(\)/, 'Health Auto Export parsing must retain the newest measurement timestamp')

// Offline/fallback: local state is primary fallback and sync failure must not erase it.
assert.match(page, /localStorage\.getItem\(LKEY\)/, 'Health Profile must load its local fallback when available')
assert.match(page, /localStorage\.setItem\(LKEY, JSON\.stringify\(payload\)\)/, 'Health Profile must persist locally before optional server sync')
assert.match(page, /Saved on this device, but syncing to the server failed \(offline\)/, 'server sync failure must disclose the local-only fallback')
assert.match(page, /Server not active — data is stored locally on this device/, 'offline/local-only state must remain explicit to the user')
assert.match(page, /Loading health data…/, 'initial loading must have an explicit non-stale state')

// Provenance: source + save time + device sync source/time remain visible and propagated.
assert.match(page, /Source: \{p\.source\}/, 'selected data source identity must remain visible')
assert.match(page, /Saved \{new Date\(savedAt\)/, 'latest save timestamp must remain visible')
assert.match(page, /profile\.deviceSyncSource \?\? 'Device'/, 'device-sync source identity must remain visible')
assert.match(page, /profile\.lastDeviceSyncAt/, 'device-sync timestamp must remain retained')
assert.match(page, /source: data\.deviceSyncSource \?\? data\.source, measuredAt: data\.lastDeviceSyncAt/, 'server/device data must publish provenance into the shared vitals store')

// Data quality: diagnostic work stays local, identifies missing/unknown data, and bounds rendering.
assert.match(page, /title="Diagnostik Sinkronisasi"/, 'Health Profile must expose its data-quality diagnostic surface')
assert.match(page, /Its contents are examined on your own device — nothing is sent anywhere\./, 'diagnostic payload inspection must remain local')
assert.match(page, /const MAX_ROWS = 60/, 'diagnostic result rendering must be bounded on mobile')
assert.match(page, /d\.matchedCount/, 'diagnostic output must expose recognized metric count')
assert.match(page, /d\.emptyCount/, 'diagnostic output must expose missing\/empty metric count')
assert.match(page, /d\.unknownNames\.join/, 'diagnostic output must expose unresolved source names rather than silently dropping them')

// Trend: use only recorded snapshots, require enough points, keep history bounded.
assert.match(page, /return \[\.\.\.prev, snap\]\.slice\(-90\)/, 'Health Profile longitudinal history must remain bounded to 90 saves')
assert.match(page, /function TrendChart\(\{ history \}/, 'Health Profile must retain its dedicated trend explorer')
assert.match(page, /if \(history\.length < 2\)/, 'trend chart must expose a meaningful insufficient-data state')
assert.match(page, /const data = history\.map/, 'trend chart must derive points only from recorded history')
assert.match(page, /const active = series\.filter\(\(s\) => data\.some/, 'trend series must render only when recorded values actually exist')

// QA capability: this file is intentionally deterministic and network-free.
assert.doesNotMatch(page, /setInterval\(/, 'Health Profile must not introduce repeated polling for these foundation capabilities')

console.log('Feature Factory health-profile foundation: export, validated import, offline/fallback, provenance, data-quality diagnostics, recorded-only trends, and deterministic QA are reachable and bounded.')
