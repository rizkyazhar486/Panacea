import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const page = await readFile('src/pages/HealthProfile.tsx', 'utf8')
const main = await readFile('src/main.tsx', 'utf8')

// Privacy controls: local structured imports, explicit screenshot exception,
// secret webhook scope, and revocation-by-rotation are visible to the user.
assert.match(page, /\.xml\/\.csv\/\.json files are processed on your device and never uploaded\./, 'structured health imports must disclose local processing')
assert.match(page, /Screenshots are different:[\s\S]*image is sent to the server to be read/, 'screenshot OCR must disclose its server-processing exception')
assert.match(page, /crop that part out before uploading/, 'screenshot privacy guidance must allow data minimization before upload')
assert.match(page, /Keep this link secret — anyone who has it can push data into your account\./, 'private sync-link scope must be explicit')
assert.match(page, /The OLD link stops working immediately/, 'sync-link rotation must explicitly revoke the prior link')
assert.match(page, /Create a new link \(if the old one leaked\)/, 'privacy recovery must be user-controlled rather than silent')

// Progressive onboarding: explain the path in-place and provide a dedicated
// deeper tutorial without blocking core manual use.
assert.match(page, /title="Import & Export"/, 'Health Profile must explain import/export at point of use')
assert.match(page, /Apple Watch[\s\S]*Garmin and WHOOP/, 'onboarding must distinguish supported sync/import paths')
assert.match(page, /to="\/health-data\/tutorial"/, 'a deeper Health Data tutorial must remain directly reachable')
assert.match(page, /Buka panduan lengkap \(8 langkah, ~5 menit\)/, 'tutorial link must set a bounded expectation')
assert.match(page, /Review, then press Save\./, 'import flow must require user review before persistence')

// Performance budget: route-level lazy loading plus bounded payload/history/
// diagnostic rendering. These guards must remain network/polling neutral.
assert.match(main, /const HealthProfile = lazy\(\(\) => import\('\.\/pages\/HealthProfile'\)/, 'Health Profile must remain route-level lazy loaded')
assert.match(page, /MAX_IMPORT_BYTES = 60 \* 1024 \* 1024/, 'large browser imports must stay explicitly bounded')
assert.match(page, /return \[\.\.\.prev, snap\]\.slice\(-90\)/, 'saved trend history must remain bounded')
assert.match(page, /const MAX_ROWS = 60/, 'diagnostic rendering must remain bounded on mobile')
assert.match(page, /textarea[\s\S]*defaultValue=""/, 'large diagnostic payload text must remain uncontrolled rather than React-state mirrored')
assert.doesNotMatch(page, /setInterval\(/, 'Health Profile must not introduce repeated polling')

// Interactive chart: responsive, bounded recorded points with explicit tooltip
// and insufficient-data fallback; no extrapolation or fabricated series.
assert.match(page, /function TrendChart\(\{ history \}/, 'Health Profile must retain an interactive trend chart surface')
assert.match(page, /ResponsiveContainer width="100%" height="100%"/, 'trend chart must remain responsive')
assert.match(page, /<Tooltip /, 'trend chart must expose point detail interactively')
assert.match(page, /if \(history\.length < 2\)/, 'chart must provide an explicit insufficient-data state')
assert.match(page, /const data = history\.map/, 'chart points must come only from recorded history')
assert.match(page, /const active = series\.filter\(\(s\) => data\.some/, 'empty series must not be fabricated into the chart')

console.log('Feature Factory health-profile UX safety: privacy, progressive onboarding, performance budgets, and bounded interactive chart behavior are regression-guarded.')
