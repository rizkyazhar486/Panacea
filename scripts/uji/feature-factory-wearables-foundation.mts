import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const page = await readFile('src/pages/HealthProfile.tsx', 'utf8')
const healthImport = await readFile('src/lib/healthImport.ts', 'utf8')
const surfaces = JSON.parse(await readFile('data/feature-factory/surfaces.json', 'utf8')) as {
  surfaces: Array<{ domainId: string; route: string; surface: string; label: string }>
}
const hae = JSON.parse(await readFile('data/source-registry/wearable/health-auto-export.json', 'utf8')) as {
  id: string
  usage?: { runtime?: boolean; networkRequired?: boolean }
  adapter?: { status?: string; module?: string }
  validation?: { clinicalDecisionUse?: string }
  provenance?: { sourceIdentityRequired?: boolean; versionPinRequired?: boolean }
}

const wearableSurface = surfaces.surfaces.find((item) => item.domainId === 'wearables')
const interoperabilitySurface = surfaces.surfaces.find((item) => item.domainId === 'interoperability')
assert.equal(wearableSurface?.route, '/health-data', 'Wearables must resolve to the actual health-device surface, not the social /connect route')
assert.equal(wearableSurface?.surface, 'shared', 'Wearables intentionally reuse the mature Health Data surface')
assert.match(wearableSurface?.label ?? '', /Wearables/, 'Wearables shared surface must name the subexperience')
assert.equal(interoperabilitySurface?.route, '/health-data', 'Health-data interoperability/provenance must not resolve to the unrelated social /connect route')

// Source integration boundary: HealthyApps is a transport bridge, while the
// originating Apple Health/device identity remains the evidence-bearing source.
assert.equal(hae.id, 'health_auto_export')
assert.equal(hae.usage?.runtime, true)
assert.equal(hae.usage?.networkRequired, true)
assert.equal(hae.adapter?.status, 'ACTIVE')
assert.equal(hae.adapter?.module, 'server/src/healthWebhook.ts', 'wearable live transport must terminate in the server adapter, not a React page')
assert.equal(hae.validation?.clinicalDecisionUse, 'NO', 'wearable transport must not be promoted to clinical-decision evidence')
assert.equal(hae.provenance?.sourceIdentityRequired, true)
assert.equal(hae.provenance?.versionPinRequired, true)
assert.doesNotMatch(page, /healthyapps\.dev[\s\S]*fetch\(/i, 'Health Profile must not call the third-party wearable service directly from React')

// Snapshot + provenance: only received/user-entered values are displayed, with
// explicit device/source/time context and empty state rather than seeded data.
assert.match(page, /title="Synced From Your Device"/, 'Wearables must expose a device-sync snapshot on the canonical surface')
assert.match(page, /profile\.deviceSyncSource \?\? 'Device'/, 'wearable snapshot must expose transport/source context')
assert.match(page, /profile\.lastDeviceSyncAt/, 'wearable snapshot must expose sync timestamp')
assert.match(page, /The device is connected, but this sync carried no matching metrics/, 'wearable snapshot must preserve a real empty-sync state')
assert.match(page, /Source: \{p\.source\}/, 'manual/imported wearable source identity must remain visible')
assert.match(page, /mergeVitals\(\{ \.\.\.r, source: r\.source, measuredAt: r\.measuredAt \}\)/, 'wearable imports must propagate source and measurement time')

// Validated import + fallback/offline: structured files are local-first, capped,
// fail closed on unknown data, and the core profile remains usable without sync.
assert.match(page, /MAX_IMPORT_BYTES = 60 \* 1024 \* 1024/, 'wearable import payload must remain bounded')
assert.match(page, /parseHealthFile\(file\.name, text\)/, 'wearable structured exports must use the normalized parser')
assert.match(page, /No recognizable data found in that file/, 'unknown wearable exports must fail closed')
assert.match(healthImport, /Supports Apple Health[\s\S]*WHOOP[\s\S]*Garmin Connect/, 'wearable import adapter must keep the supported source families explicit')
assert.match(page, /Server not active — data is stored locally on this device/, 'wearable surface must remain useful without live backend sync')
assert.match(page, /Saved on this device, but syncing to the server failed \(offline\)/, 'wearable sync failure must preserve local state')

// Portable export: only actual current state/history is serialized and an empty
// history never becomes fabricated rows.
assert.match(page, /function exportJson\(\)[\s\S]*JSON\.stringify\(p, null, 2\)/, 'wearable JSON export must serialize actual Health Profile state')
assert.match(page, /function exportCsv\(\)[\s\S]*const rows = p\.history \?\? \[\]/, 'wearable CSV export must serialize actual recorded history')
assert.match(page, /No history to export yet — save your data first\./, 'wearable history export must fail closed when no records exist')

// Timeline/trend/chart: wearable observations reuse the same bounded recorded
// history without prediction, synthetic interpolation or empty-series seeding.
assert.match(page, /return \[\.\.\.prev, snap\]\.slice\(-90\)/, 'wearable longitudinal history must remain bounded')
assert.match(page, /function TrendChart\(\{ history \}/, 'wearable observations must remain visible on the shared trend surface')
assert.match(page, /if \(history\.length < 2\)/, 'wearable trend surface must expose an insufficient-data state')
assert.match(page, /ResponsiveContainer width="100%" height="100%"/, 'wearable chart must remain responsive')
assert.match(page, /<Tooltip /, 'wearable chart must expose recorded point details')
assert.match(page, /const data = history\.map/, 'wearable trend points must be derived from recorded history only')
assert.match(page, /const active = series\.filter\(\(s\) => data\.some/, 'wearable chart must not fabricate empty series')

// Privacy + data quality + onboarding + performance are product behavior, not
// clinical claims. Keep them explicit and bounded.
assert.match(page, /Screenshots are different:[\s\S]*image is sent to the server to be read/, 'wearable screenshot processing must disclose network transfer')
assert.match(page, /Keep this link secret — anyone who has it can push data into your account\./, 'wearable sync credential scope must be explicit')
assert.match(page, /The OLD link stops working immediately/, 'credential rotation must revoke the old wearable sync link')
assert.match(page, /title="Diagnostik Sinkronisasi"/, 'wearable data-quality diagnostics must be reachable')
assert.match(page, /const MAX_ROWS = 60/, 'wearable diagnostic rendering must be bounded')
assert.match(page, /to="\/health-data\/tutorial"/, 'wearable setup onboarding must be reachable from the canonical surface')
assert.doesNotMatch(page, /setInterval\(/, 'wearable surface must not add repeated polling')

console.log('Feature Factory wearables foundation: canonical surface, adapter boundary, snapshot/provenance, import/export, offline/fallback, recorded timeline/trend/chart, privacy, diagnostics, onboarding, performance and QA are regression-guarded.')
