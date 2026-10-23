// Alpha E4 evidence: no personal or clinical data in server logs. Real application over HTTP in isolated file mode with the
// server's stdout and stderr captured, plus a static guard on the source. Synthetic fixtures with distinctive markers.
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { consoleCallsWithRequestData } from './support/consoleRequestGuard.ts'
import { serverRoot, startIsolatedServer } from './support/isolatedServer.ts'

// 1. Static guard: no console statement in the server source may interpolate an email address. New code that logs one fails here.
function sources(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) sources(path, out)
    else if (name.endsWith('.ts') && !name.endsWith('.d.ts')) out.push(path)
  }
  return out
}
const EMAIL_IN_LOG = /\b(?:u|user|pasien|dokter|patient)?\.?[eE]mail\b|\.email\b|Email\}/
const offenders: string[] = []
for (const file of sources(join(serverRoot, 'src'))) {
  readFileSync(file, 'utf8').split('\n').forEach((line, index) => {
    // Only the opaque marker may stand in for an address: references inside penandaLog(...) are fine, anything else is not.
    const bare = line.slice(Math.max(line.indexOf('console.'), 0)).replace(/penandaLog\([^)]*\)/g, '')
    if (/console\.(log|warn|error|info|debug)\(/.test(line) && EMAIL_IN_LOG.test(bare) && !/features\.|Resend|RESEND|set RESEND/.test(line)) offenders.push(`${file.slice(serverRoot.length)}:${index + 1}`)
  })
}
assert.deepEqual(offenders, [], `a log statement interpolates an email address: ${offenders.join(', ')}`)

// 1b. Static guard over EVERY route group: no console statement may receive request data (body, query, params, headers, cookies, url).
// The scanner is proven on synthetic source first (positive, negative, paired and boundary cases), then run over server/src.
const flagged = (src: string) => consoleCallsWithRequestData(src).findings.length
for (const leak of [
  'console.log(req.body)', "console.error('failed', req.query)", 'console.warn(request.params.id)', 'console.info(req.headers.authorization)',
  'console.log(`saved ${req.body.name}`)', 'console.log(\n  "multi-line",\n  req.body,\n)', 'console.debug(fn(a(b)), req.cookies)', 'console.log(req)',
  'console.log(req?.body)', 'console.log(req.originalUrl)', 'console.log(request, 1)',
]) assert.equal(flagged(leak), 1, `request data in a console call must be flagged: ${leak}`)
for (const fine of [
  "console.log('req.body is never logged')", 'console.log(`req.body is ${count} bytes`)', 'console.log(penandaLog(userId))', 'console.log(req.method, req.path)',
  'const b = req.body; handle(b)', 'res.json(req.body)', 'console.log(requested)', 'console.log(reqCount)', "console.warn('[x]', e?.message)",
]) assert.equal(flagged(fine), 0, `must not be flagged: ${fine}`)
// Paired: the same statement is flagged only because of the request argument.
assert.equal(flagged('console.log(note)'), 0)
assert.equal(flagged('console.log(note, req.body)'), 1)
assert.equal(flagged('console.log(1)\nconsole.log(req.body)').valueOf(), 1, 'only the offending statement counts')
assert.deepEqual(consoleCallsWithRequestData('a\nb\nconsole.log(req.body)').findings, [{ line: 3, call: 'console.log(' }], 'the finding names the line')
assert.equal(consoleCallsWithRequestData('console.log(req.body').findings[0]?.call, 'unbalanced console call', 'an unbalanced call fails closed instead of being skipped')
assert.deepEqual(consoleCallsWithRequestData(''), { scanned: 0, findings: [] })
const requestLeaks: string[] = []
let consoleCalls = 0
for (const file of sources(join(serverRoot, 'src'))) {
  const { scanned, findings } = consoleCallsWithRequestData(readFileSync(file, 'utf8'))
  consoleCalls += scanned
  for (const f of findings) requestLeaks.push(`${file.slice(serverRoot.length)}:${f.line}`)
}
assert.ok(consoleCalls > 30, `the scanner must see the real console statements (saw ${consoleCalls}), otherwise an empty result proves nothing`)
assert.deepEqual(requestLeaks, [], `a console statement receives request data: ${requestLeaks.join(', ')}`)

// 2. Dynamic: run a clinical journey and read everything the server wrote.
const ownerEmail = 'logprivacy-owner@localhost.test'
const running = await startIsolatedServer('log-privacy', ownerEmail, { captureLogs: true })
try {
  const { call, logs } = running
  const login = async (email: string, role: string, name: string) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string } }
  }
  const owner = await login(ownerEmail, 'pasien', 'Owner Marker Person')
  const doctor = await login('logprivacy-doctor@localhost.test', 'dokter', 'Dr Marker Doctor')
  const alice = await login('logprivacy-alice@localhost.test', 'pasien', 'Alice Marker Patient')
  assert.equal((await call('POST', `/api/doctors/${doctor.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)
  const patientId = `self-u-${alice.user.id}`
  await call('POST', '/api/clinical/patient', doctor.token, { patient: { id: patientId, name: 'Alice Marker Patient', sex: 'P', dob: '1991-02-03', mrn: 'MRN-MARKER-123', allergies: ['penicillin-marker'], chronicConditions: [], riskFlags: [] } })
  await call('POST', '/api/clinical/record', doctor.token, { patientId, record: { id: 'r', patientId, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', anamnesis: { keluhanUtama: 'complaint-marker-xyz' }, physicalExam: { general: 'exam-marker-xyz' }, problems: [], plan: [], references: [], signedAt: 'sign-intent' } })
  await call('POST', '/api/lab-results', doctor.token, { patientId, item: { name: 'Synthetic', valueText: 'labvalue-marker-987', collectedAt: '2026-01-01' }, source: 'lab-intake' })
  await call('PUT', '/api/lab-log', alice.token, { log: { gdp: [{ id: 'g1', tanggal: '2026-01-02', nilai: 987.65 }] }, diperbaruiPada: new Date().toISOString() })
  const share = (await call('POST', '/api/lab-log/shares', alice.token, { dokterEmail: 'logprivacy-doctor@localhost.test', hari: 7 })).body
  await call('POST', `/api/clinician/lab-shares/${share.id}/review`, doctor.token, { tes: 'gdp', catatan: 'review-note-marker-xyz' })
  const token = (await call('GET', '/api/health-profile/webhook-token', alice.token)).body.token
  const privateLabel = 'synthetic-private-health-label\nsynthetic-forged-log-line'
  const delivered = await call('POST', `/api/health-webhook/${token}`, undefined, { data: { metrics: [
    { name: 'weight_body_mass', units: 'kg', data: [{ qty: 71.234, date: '2026-10-11 08:00:00 +0000' }] },
    { name: privateLabel, data: [{ qty: 53117, date: '2026-10-11 08:00:00 +0000' }] },
  ] } })
  assert.equal(delivered.status, 200, 'valid delivery must remain accepted')
  assert.equal(delivered.body.imported, 1, 'unknown labels must not become clinical measurements')
  assert.equal(delivered.body.profile.weightKg, 71.23, 'normal measurement normalization must be preserved')
  const profile = await call('GET', '/api/health-profile', alice.token)
  const diagnosis = await call('GET', '/api/health-sync/diagnosis', alice.token)
  assert.equal(profile.status, 200)
  assert.equal(profile.body.profile.weightKg, 71.23, 'imported measurement must persist')
  assert.equal(diagnosis.status, 200)
  assert.deepEqual(diagnosis.body.recent[0].metricGroups, [
    { name: 'weight_body_mass', samples: 1 }, { name: privateLabel, samples: 1 },
  ], 'raw exporter naming evidence belongs in account-scoped diagnostics')
  assert.deepEqual(diagnosis.body.recent[0].matched, ['weightKg'])
  const otherDiagnosis = await call('GET', '/api/health-sync/diagnosis', owner.token)
  assert.equal(otherDiagnosis.status, 200)
  assert.deepEqual(otherDiagnosis.body.recent, [], 'another account must not see delivery diagnostics')
  const rejected = await call('POST', '/api/health-webhook/not-a-real-token', undefined, { data: { metrics: [
    { name: 'weight_body_mass', units: 'kg', data: [{ qty: 99, date: '2026-10-12 08:00:00 +0000' }] },
  ] } })
  assert.equal(rejected.status, 404)
  assert.equal(rejected.body.error, 'unknown_token')
  assert.deepEqual((await call('GET', '/api/health-profile', alice.token)).body, profile.body, 'invalid token must not change the profile')
  assert.deepEqual((await call('GET', '/api/health-sync/diagnosis', alice.token)).body.recent, diagnosis.body.recent, 'invalid token must not record a delivery')
  await running.restart()
  assert.deepEqual((await call('GET', '/api/health-profile', alice.token)).body, profile.body, 'measurement must survive process restart')
  assert.deepEqual((await call('GET', '/api/health-sync/diagnosis', alice.token)).body.recent, diagnosis.body.recent, 'private diagnostics must survive process restart')
  await call('PUT', '/api/settings', alice.token, { settings: { strStatus: 'forged' } })
  await call('POST', '/api/second-opinion', alice.token, { symptoms: 'symptom-marker-xyz', history: 'history-marker-xyz' })
  await call('POST', '/api/feedback', alice.token, { kind: 'Question', text: 'feedback-marker-xyz text' })
  // Rejected payloads never reach a handler, but Node's JSON.parse error text quotes part of the input. Each must be refused with a
  // client error (the body limit is 12 MB, so the oversize case is 13 MB) and leave no trace of its content in the log (the parse and too-large errors are answered 400/413 without logging).
  const malformed: Array<[path: string, body: string, status: number, contentType?: string]> = [
    ['/api/clinical/patient', '{"patient":{"name":"malformed-name-marker","mrn":"malformed-mrn-marker"', 400],
    ['/api/clinical/patient', '{"patient":{"name":"malformed-trailing-marker"}} garbage', 400],
    ['/api/second-opinion', '{symptoms: "malformed-unquoted-marker"}', 400],
    ['/api/feedback', "{'text':'malformed-singlequote-marker'}", 400],
    ['/api/lab-results', '{"item":{"name":"malformed-lab-marker","valueText":"malformed-value-marker"', 400],
    ['/api/second-opinion', 'malformed-not-json-marker', 400],
    ['/api/clinical/record', `{"record":{"anamnesis":{"keluhanUtama":"malformed-oversize-marker${'x'.repeat(13_000_000)}"}}}`, 413],
  ]
  for (const [path, body, status, contentType] of malformed) {
    const refused = await fetch(`${running.origin}${path}`, { method: 'POST', headers: { 'content-type': contentType ?? 'application/json', authorization: `Bearer ${alice.token}` }, body, signal: AbortSignal.timeout(10000) })
    assert.equal(refused.status, status, `a malformed payload to ${path} must be refused with ${status}`)
  }
  await new Promise(resolve => setTimeout(resolve, 1500))

  const written = logs()
  assert.ok(written.length > 0, 'the server wrote its startup and request lines, so the capture is real')
  for (const secret of [
    'logprivacy-alice@localhost.test', 'logprivacy-doctor@localhost.test', ownerEmail, '@localhost.test',
    'Alice Marker', 'Dr Marker', 'Owner Marker', 'MRN-MARKER', 'penicillin-marker', 'complaint-marker', 'exam-marker', 'labvalue-marker', '987.65',
    'review-note-marker', '71.234', '71.23', '53117', 'symptom-marker', 'history-marker', 'feedback-marker', 'forged',
    privateLabel, 'synthetic-private-health-label', 'synthetic-forged-log-line', 'weight_body_mass', 'weightKg', token,
    'malformed-name-marker', 'malformed-mrn-marker', 'malformed-trailing-marker', 'malformed-unquoted-marker', 'malformed-singlequote-marker',
    'malformed-lab-marker', 'malformed-value-marker', 'malformed-not-json-marker', 'malformed-oversize-marker',
  ]) assert.ok(!written.includes(secret), `the server log must not contain "${secret}"`)
  // Operational telemetry retains counts and correlation, without health categories.
  assert.match(written, /\[health-webhook\] u:[0-9a-f]{10}: groups=2 workouts=0 matched=1(?:\r?\n|$)/, 'the webhook line keeps counts under an opaque marker')
  assert.match(written, /\[settings\] u:[0-9a-f]{10} attempted to write server-owned keys: strStatus/, 'the settings warning keeps its diagnostics under an opaque marker')
  const markers = new Set([...written.matchAll(/\bu:[0-9a-f]{10}\b/g)].map(m => m[0]))
  assert.equal(markers.size, 1, 'one account is one stable marker across lines (so a support engineer can correlate them)')

  console.log('logPrivacyHttp: no email interpolated in any log statement; a clinical journey writes no names, emails, MRNs, clinical text or values to the server log; diagnostics keep a stable opaque marker; passed')
} finally {
  await running.stop()
}
