import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  DIAGNOSTICS_OPEN_EVENT,
  DIAGNOSTIC_EVENTS_MAX,
  DIAGNOSTIC_MESSAGE_MAX,
  DIAGNOSTIC_ROUTE_MAX,
  HEALTH_PROBE_TIMEOUT_MS,
  ROUTE_ERROR_EVENT,
  SERVER_WAKE_EVENT,
  appendDiagnosticEvent,
  extractApiHostLabel,
  formatDiagnosticReport,
  isDiagnosticsShortcut,
  redactSensitiveText,
  resolveAmbientStatus,
  sanitizeDiagnosticRoute,
  type DiagnosticEvent,
  type DiagnosticSnapshot,
} from '../../src/domains/observability/uiDiagnostics.ts'

// ── 1. Positive tests ──────────────────────────────────────────────────────────
assert.equal(
  redactSensitiveText(new TypeError('Cannot read properties of undefined')),
  'TypeError: Cannot read properties of undefined',
)
assert.equal(sanitizeDiagnosticRoute('#/emr?patient=123&nama=Budi'), '/emr')
assert.equal(sanitizeDiagnosticRoute('/clinical-hub#section'), '/clinical-hub')

assert.deepEqual(extractApiHostLabel('https://panaceamed-backend.onrender.com/api'), {
  appMode: 'cloud',
  apiHost: 'panaceamed-backend.onrender.com',
})
assert.deepEqual(extractApiHostLabel('http://localhost:8787'), {
  appMode: 'local',
  apiHost: 'localhost:8787',
})
assert.deepEqual(extractApiHostLabel(''), {
  appMode: 'local',
  apiHost: 'Perangkat (Lokal)',
})

assert.equal(
  resolveAmbientStatus({
    offline: true,
    justReconnected: true,
    wake: { phase: 'waking', attempt: 1, maxAttempts: 3, message: 'Waking' },
    syncPending: true,
    syncDismissed: false,
    updateAvailable: true,
  }).kind,
  'offline',
  'offline must have highest ambient status priority',
)
assert.equal(
  resolveAmbientStatus({
    offline: false,
    justReconnected: false,
    wake: { phase: 'waking', attempt: 1, maxAttempts: 3, message: 'Server bangun' },
    syncPending: true,
    syncDismissed: false,
    updateAvailable: true,
  }).kind,
  'waking',
)
assert.equal(
  resolveAmbientStatus({
    offline: false,
    justReconnected: false,
    wake: { phase: 'timeout', attempt: 3, maxAttempts: 3, message: 'Timeout' },
    syncPending: true,
    syncDismissed: false,
    updateAvailable: true,
  }).kind,
  'wake-timeout',
)
assert.equal(
  resolveAmbientStatus({
    offline: false,
    justReconnected: false,
    wake: { phase: 'idle', attempt: 0, maxAttempts: 3, message: '' },
    syncPending: true,
    syncDismissed: false,
    updateAvailable: true,
  }).kind,
  'update-available',
)
assert.equal(
  resolveAmbientStatus({
    offline: false,
    justReconnected: false,
    wake: null,
    syncPending: true,
    syncDismissed: false,
    updateAvailable: false,
  }).kind,
  'sync-pending',
)
assert.equal(
  resolveAmbientStatus({
    offline: false,
    justReconnected: true,
    wake: null,
    syncPending: false,
    syncDismissed: false,
    updateAvailable: false,
  }).kind,
  'reconnected',
)
assert.equal(
  resolveAmbientStatus({
    offline: false,
    justReconnected: false,
    wake: null,
    syncPending: false,
    syncDismissed: false,
    updateAvailable: false,
  }).kind,
  'none',
)

const ev1 = appendDiagnosticEvent([], {
  id: 'ev-1',
  atIso: '2026-11-20T10:00:00.000Z',
  kind: 'network',
  severity: 'warn',
  summary: 'Gateway timeout',
  route: '#/clinical-hub?tab=1',
  requestId: 'req_12345678',
})
assert.equal(ev1.length, 1)
assert.equal(ev1[0].route, '/clinical-hub')
assert.equal(ev1[0].requestId, 'req_12345678')

assert.equal(
  isDiagnosticsShortcut({ altKey: true, shiftKey: true, key: 'D', targetTagName: 'BODY' }),
  true,
)

const cleanSnapshot: DiagnosticSnapshot = {
  appMode: 'cloud',
  apiHost: 'panaceamed-backend.onrender.com',
  online: true,
  route: '/harian',
  viewport: '390x844',
  theme: 'light',
  buildCommit: '7e95584ca824',
  activeStatus: 'none',
  healthProbe: {
    state: 'ok',
    httpStatus: 200,
    latencyMs: 145,
    storage: 'postgres',
    checkedAtIso: '2026-11-20T10:00:00.000Z',
    note: 'HTTP 200 OK',
  },
  events: ev1,
  capturedAtIso: '2026-11-20T10:00:01.000Z',
}
const report = formatDiagnosticReport(cleanSnapshot)
assert.match(report, /^Panaceamed Diagnostics \(No PHI\)/)
assert.match(report, /panaceamed-backend\.onrender\.com/)
assert.match(report, /7e95584ca824/)

// ── 2. Negative & PHI-redaction tests ──────────────────────────────────────────
const leakyRaw =
  'Failed auth for dokter@klinik.id with Authorization: Bearer super.secret.token token=secret123 api_key=xyz987 JWT eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature123 phone 081234567890 NIK 3174011234567890'
const redacted = redactSensitiveText(leakyRaw, 500)
for (const secret of [
  'dokter@klinik.id',
  'super.secret.token',
  'secret123',
  'xyz987',
  'eyJhbGciOiJIUzI1NiJ9',
  '081234567890',
  '3174011234567890',
]) {
  assert.ok(!redacted.includes(secret), `Secret leaked in redactSensitiveText: ${secret}`)
}
assert.match(redacted, /\[REDACTED_EMAIL\]/)
assert.match(redacted, /\[REDACTED_TOKEN\]/)
assert.match(redacted, /\[REDACTED_ID\]/)

const evLeaky = appendDiagnosticEvent([], {
  id: 'ev-leak',
  atIso: '2026-11-20T10:00:00.000Z',
  kind: 'error',
  severity: 'error',
  summary: leakyRaw,
  route: '#/messages?token=secret123',
  requestId: 'bad id spaces',
})
assert.equal(evLeaky[0].requestId, null, 'invalid requestId must be rejected as null')
assert.equal(evLeaky[0].route, '/messages')
const leakyReport = formatDiagnosticReport({ ...cleanSnapshot, events: evLeaky })
for (const secret of ['dokter@klinik.id', 'secret123', '081234567890', '3174011234567890']) {
  assert.ok(!leakyReport.includes(secret), `Secret leaked in formatDiagnosticReport: ${secret}`)
}

for (const badTag of ['INPUT', 'TEXTAREA', 'SELECT']) {
  assert.equal(
    isDiagnosticsShortcut({ altKey: true, shiftKey: true, key: 'd', targetTagName: badTag }),
    false,
    `shortcut must stay disabled inside ${badTag}`,
  )
}
assert.equal(
  isDiagnosticsShortcut({ altKey: true, shiftKey: true, key: 'd', isContentEditable: true }),
  false,
)
assert.equal(
  isDiagnosticsShortcut({ altKey: true, shiftKey: true, ctrlKey: true, key: 'd' }),
  false,
)
assert.equal(
  isDiagnosticsShortcut({ altKey: true, shiftKey: false, key: 'd' }),
  false,
)

const hostileObj = { toString() { throw new Error('hostile') } }
assert.equal(redactSensitiveText(hostileObj), '')
assert.equal(redactSensitiveText(null), '')
assert.equal(redactSensitiveText(undefined), '')
assert.equal(typeof redactSensitiveText(Symbol('x')), 'string')
assert.equal(sanitizeDiagnosticRoute(null), '/')
assert.equal(sanitizeDiagnosticRoute('   '), '/')

// ── 3. Boundary tests ──────────────────────────────────────────────────────────
assert.equal(redactSensitiveText('x'.repeat(DIAGNOSTIC_MESSAGE_MAX)).length, DIAGNOSTIC_MESSAGE_MAX)
assert.equal(redactSensitiveText('x'.repeat(DIAGNOSTIC_MESSAGE_MAX + 50)).length, DIAGNOSTIC_MESSAGE_MAX)
assert.equal(sanitizeDiagnosticRoute('#/' + 'r'.repeat(DIAGNOSTIC_ROUTE_MAX + 20)).length, DIAGNOSTIC_ROUTE_MAX)
assert.equal(HEALTH_PROBE_TIMEOUT_MS, 45_000)
assert.equal(DIAGNOSTICS_OPEN_EVENT, 'panacea:open-diagnostics')
assert.equal(SERVER_WAKE_EVENT, 'panacea:server-wake')
assert.equal(ROUTE_ERROR_EVENT, 'panacea:route-error')

let ring: DiagnosticEvent[] = []
for (let i = 1; i <= DIAGNOSTIC_EVENTS_MAX + 3; i++) {
  ring = appendDiagnosticEvent(ring, {
    id: `ev-${i}`,
    atIso: '2026-11-20T10:00:00.000Z',
    kind: 'error',
    severity: 'error',
    summary: `Error ${i}`,
    route: '/',
  })
}
assert.equal(ring.length, DIAGNOSTIC_EVENTS_MAX)
assert.equal(ring[0].id, `ev-${DIAGNOSTIC_EVENTS_MAX + 3}`, 'newest event must be first')
assert.equal(
  appendDiagnosticEvent(ring, {
    id: 'ev-one',
    atIso: '2026-11-20T10:00:00.000Z',
    kind: 'network',
    severity: 'info',
    summary: 'single',
    route: '/',
  }, 0).length,
  1,
)
assert.equal(
  resolveAmbientStatus({
    offline: false,
    justReconnected: false,
    wake: null,
    syncPending: true,
    syncDismissed: true,
    updateAvailable: false,
  }).kind,
  'none',
  'dismissed sync banner resolves to none',
)

// ── 4. Source contracts & Self-Sabotage proofs ────────────────────────────────
function validateDiagnosticsSources(sources: {
  domainIndex: string
  uiDiagnostics: string
  appStatus: string
  dialog: string
  routeBoundary: string
  mainTsx: string
}): string[] {
  const issues: string[] = []
  if (!/redactSensitiveText/.test(sources.domainIndex)) {
    issues.push('domains/observability/index.ts must re-export redactSensitiveText')
  }
  if (!/REDACTED_EMAIL/.test(sources.uiDiagnostics) || !/REDACTED_TOKEN/.test(sources.uiDiagnostics)) {
    issues.push('uiDiagnostics.ts must redact emails and tokens')
  }
  if (!/<SmartNotificationOrchestrator\s*\/>/.test(sources.appStatus)) {
    issues.push('AppStatus.tsx must keep SmartNotificationOrchestrator')
  }
  if (!/lazy\([\s\S]*SystemDiagnosticsDialog/.test(sources.appStatus)) {
    issues.push('AppStatus.tsx must lazy-load SystemDiagnosticsDialog')
  }
  if (!/className=\{?[`'"]dark\b/.test(sources.appStatus)) {
    issues.push('AppStatus.tsx dark floating status surfaces must carry the dark class for contrast safety')
  }
  if (!/AdaptiveDialog/.test(sources.dialog)) {
    issues.push('SystemDiagnosticsDialog.tsx must reuse AdaptiveDialog')
  }
  if (!/disabled=\{probing\}/.test(sources.dialog)) {
    issues.push('SystemDiagnosticsDialog.tsx must disable Cek Server while probing')
  }
  if (!/redactSensitiveText\(/.test(sources.dialog)) {
    issues.push('SystemDiagnosticsDialog.tsx must sanitize displayed text through redactSensitiveText')
  }
  if (/<OfflineBanner\s*\/>/.test(sources.mainTsx)) {
    issues.push('main.tsx must not mount duplicate OfflineBanner alongside unified AppStatus')
  }
  if (!/const QA_TANPA_BATAS = import\.meta\.env\.VITE_QA_HOOKS === '1' && import\.meta\.env\.VITE_QA_NO_ROUTE_BOUNDARY === '1'/.test(sources.routeBoundary)) {
    issues.push('RouteErrorBoundary.tsx must preserve ENG-F1-03 QA_TANPA_BATAS gate')
  }
  if (!/ROUTE_ERROR_EVENT/.test(sources.routeBoundary)) {
    issues.push('RouteErrorBoundary.tsx must emit ROUTE_ERROR_EVENT to feed cross-page diagnostics')
  }
  return issues
}

const realSources = {
  domainIndex: readFileSync(new URL('../../src/domains/observability/index.ts', import.meta.url), 'utf8'),
  uiDiagnostics: readFileSync(new URL('../../src/domains/observability/uiDiagnostics.ts', import.meta.url), 'utf8'),
  appStatus: readFileSync(new URL('../../src/components/layout/AppStatus.tsx', import.meta.url), 'utf8'),
  dialog: readFileSync(new URL('../../src/components/layout/SystemDiagnosticsDialog.tsx', import.meta.url), 'utf8'),
  routeBoundary: readFileSync(new URL('../../src/components/layout/RouteErrorBoundary.tsx', import.meta.url), 'utf8'),
  mainTsx: readFileSync(new URL('../../src/main.tsx', import.meta.url), 'utf8'),
}

assert.deepEqual(validateDiagnosticsSources(realSources), [], 'Live sources must pass all orchestrator contracts')

// Self-Sabotage proofs: verify our contract validator genuinely catches regressions
const sabotages: [string, Partial<typeof realSources>, RegExp][] = [
  [
    'removed SmartNotificationOrchestrator',
    { appStatus: realSources.appStatus.replaceAll('<SmartNotificationOrchestrator />', '') },
    /SmartNotificationOrchestrator/,
  ],
  [
    'reintroduced duplicate OfflineBanner in main.tsx',
    { mainTsx: realSources.mainTsx.replace('<AppStatus />', '<AppStatus />\n      <OfflineBanner />') },
    /duplicate OfflineBanner/,
  ],
  [
    'dropped AdaptiveDialog in SystemDiagnosticsDialog',
    { dialog: realSources.dialog.replaceAll('AdaptiveDialog', 'PlainDivDialog') },
    /AdaptiveDialog/,
  ],
  [
    'disabled PHI email redaction in uiDiagnostics',
    { uiDiagnostics: realSources.uiDiagnostics.replaceAll('REDACTED_EMAIL', 'RAW_EMAIL') },
    /redact emails/,
  ],
  [
    'removed dark class from AppStatus dark surfaces',
    { appStatus: realSources.appStatus.replaceAll('className="dark ', 'className="').replaceAll("className={`dark ", 'className={`') },
    /dark class/,
  ],
  [
    'removed ROUTE_ERROR_EVENT dispatch in RouteErrorBoundary',
    { routeBoundary: realSources.routeBoundary.replaceAll('ROUTE_ERROR_EVENT', 'NO_EVENT') },
    /ROUTE_ERROR_EVENT/,
  ],
]

for (const [name, patch, pattern] of sabotages) {
  const result = validateDiagnosticsSources({ ...realSources, ...patch })
  assert.ok(result.some((msg) => pattern.test(msg)), `Self-sabotage check MUST fail for: ${name}`)
}

console.log(`ui-diagnostics-orchestrator: ok (${sabotages.length} self-sabotage proofs, PHI redaction, priority & contracts verified)`)
