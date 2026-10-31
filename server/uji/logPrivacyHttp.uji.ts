// Alpha E4 evidence: no personal or clinical data in server logs. Real application over HTTP in isolated file mode with the
// server's stdout and stderr captured, plus a static guard on the source. Synthetic fixtures with distinctive markers.
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { request as httpRequest } from 'node:http'
import { deflateSync, gzipSync } from 'node:zlib'
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

  // GHSA-27r3-jxmh-p828: frame gzip valid diikuti sampah tidak boleh keluar sebagai exception proses.
  // Rujukan patch primer: https://github.com/expressjs/body-parser/commit/f7075eae3a84c3473ab4bf0a777da28db208e916
  const compressed = gzipSync(JSON.stringify({ email: ['logprivacy-alice', 'localhost.test'].join('@'), role: 'pasien', name: 'Alice Marker Patient' }))
  const sendEncoded = (body: Buffer, encoding = 'gzip', options: { contentType?: string; path?: string; token?: string } = {}): Promise<{ status: number; body: { user?: { id?: string }; error?: string } }> => new Promise((resolve, reject) => {
    const req = httpRequest(new URL(options.path ?? '/api/auth/dev-login', running.origin), {
      method: 'POST', agent: false,
      headers: { 'content-type': options.contentType ?? 'application/json', 'content-encoding': encoding, 'content-length': body.length, 'user-agent': 'Mozilla/5.0 PanaceaSyntheticTest', ...(options.token ? { authorization: `Bearer ${options.token}` } : {}) },
    }, response => {
      const chunks: Buffer[] = []
      response.on('data', (chunk: Buffer) => chunks.push(chunk))
      response.on('error', reject)
      response.on('end', () => {
        try { resolve({ status: response.statusCode ?? 0, body: JSON.parse(Buffer.concat(chunks).toString('utf8')) }) }
        catch (error) { reject(error) }
      })
    })
    req.on('error', reject)
    req.setTimeout(5000, () => req.destroy(new Error('synthetic compressed request timeout')))
    req.end(body)
  })
  const incidentsBefore = (logs().match(/\[incident\]/g) ?? []).length
  assert.equal(incidentsBefore, 0, 'compression probe must start without incidents so alert throttling cannot hide a parser error')
  const validCompressed = await sendEncoded(compressed)
  assert.equal(validCompressed.status, 200, 'valid compressed JSON remains accepted')
  assert.equal(validCompressed.body.user?.id, alice.user.id, 'valid compressed login retains the same synthetic identity')
  const usersBefore = (JSON.parse(readFileSync(running.dataFile, 'utf8')) as { users: unknown[] }).users.length
  const corrupted = Buffer.from(compressed)
  corrupted[0] ^= 0xff
  const invalidCompressed = await sendEncoded(corrupted)
  assert.equal(invalidCompressed.status, 400, 'invalid gzip is refused before the handler')
  assert.equal(invalidCompressed.body.error, 'bad_request')
  assert.equal((JSON.parse(readFileSync(running.dataFile, 'utf8')) as { users: unknown[] }).users.length, usersBefore, 'invalid compressed JSON cannot create an account')
  const trailingCompressed = await sendEncoded(Buffer.concat([compressed, Buffer.from([0]), Buffer.alloc(100 * 1024, 0x58)]))
  assert.equal(trailingCompressed.status, 200, 'completed gzip frame preserves valid JSON semantics despite trailing bytes')
  assert.equal(trailingCompressed.body.user?.id, alice.user.id)
  await new Promise(resolve => setTimeout(resolve, 250))
  assert.equal((logs().match(/\[incident\]/g) ?? []).length, incidentsBefore, 'compressed trailing bytes must not raise an uncaught incident')
  assert.equal((await call('GET', '/api/health')).status, 200, 'server remains responsive after compressed trailing bytes')
  assert.deepEqual((await call('GET', '/api/health-profile', alice.token)).body, profile.body, 'compressed parser probes do not change health data')
  console.log('bodyParserCompression: valid gzip accepted, invalid gzip refused without mutation, trailing bytes produce no uncaught incident, server responsive; passed')

  // Batas tetap 12 MiB; payload sintetis yang sama diuji mentah dan setelah ekspansi.
  // Padding tidak menjadi data akun. Pembandingan berkas membuktikan setiap penolakan tidak menulis.
  const limit = 12 * 1024 * 1024
  const loginPayload = JSON.stringify({ email: ['logprivacy-alice', 'localhost.test'].join('@'), role: 'pasien', name: 'Alice Marker Patient', padding: 'parser-private-marker' })
  const boundary = Buffer.from(loginPayload.slice(0, -1) + ' '.repeat(limit - Buffer.byteLength(loginPayload)) + '}')
  assert.equal(boundary.length, limit)
  const refusedUnchanged = async (body: Buffer, encoding: string, status: number, error: string, options: Parameters<typeof sendEncoded>[2] = {}) => {
    const before = readFileSync(running.dataFile, 'utf8')
    const r = await sendEncoded(body, encoding, options)
    assert.equal(r.status, status, `parser ${encoding} refusal must preserve HTTP ${status}`)
    assert.ok(JSON.stringify(r.body) === JSON.stringify({ error }), `parser ${encoding} refusal must return only the expected error (response redacted)`)
    assert.ok(readFileSync(running.dataFile, 'utf8') === before, `parser ${encoding} refusal must not mutate persisted data (contents redacted)`)
  }
  for (const [encoding, encode] of [['identity', (b: Buffer) => b], ['gzip', gzipSync], ['deflate', deflateSync]] as const) {
    const accepted = await sendEncoded(encode(boundary), encoding)
    assert.equal(accepted.status, 200, `parser ${encoding} accepts exactly 12 MiB`)
    assert.equal(accepted.body.user?.id, alice.user.id, `parser ${encoding} preserves the existing synthetic identity`)
    const oversized = encode(Buffer.concat([boundary, Buffer.from(' ')]))
    if (encoding !== 'identity') assert.ok(oversized.length < limit / 100, `${encoding} fixture must exercise high-ratio expansion`)
    await refusedUnchanged(oversized, encoding, 413, 'payload_too_large')
    if (encoding !== 'identity') {
      const small = encode(Buffer.from(loginPayload))
      await refusedUnchanged(small.subarray(0, small.length - 4), encoding, 400, 'bad_request')
      await refusedUnchanged(encode(Buffer.from('{"padding":"parser-malformed-marker"')), encoding, 400, 'bad_request')
    }
  }
  await refusedUnchanged(Buffer.from(loginPayload), 'parser-unsupported-private-marker', 415, 'unsupported_media_type')
  await refusedUnchanged(Buffer.from(loginPayload), 'identity', 415, 'unsupported_media_type', { contentType: 'application/json; charset=parser-charset-private-marker' })
  const clinicalProbe = gzipSync(JSON.stringify({ patient: { id: 'parser-auth-marker', name: 'parser-auth-private-marker' } }))
  await refusedUnchanged(clinicalProbe, 'gzip', 401, 'unauthorized', { path: '/api/clinical/patient' })
  await refusedUnchanged(clinicalProbe, 'gzip', 403, 'patients can only create their own record', { path: '/api/clinical/patient', token: alice.token })
  assert.equal((await call('GET', '/api/health')).status, 200, 'parser refusals leave the server responsive')
  // Blok egress.mongo di endpoint publik: hanya hitungan dan byte tulis, tanpa isi data atau penanda pasien.
  const kesehatan = await call('GET', '/api/health')
  const egressMongo = (kesehatan.body as { egress?: { mongo?: Record<string, Record<string, unknown>> } }).egress?.mongo
  assert.deepEqual(Object.keys(egressMongo ?? {}).sort(), ['inti', 'irisan'], 'egress.mongo carries the slice and core write counters')
  for (const [bagian, isi] of Object.entries(egressMongo ?? {})) {
    assert.ok(Object.keys(isi).length > 0, `egress.mongo.${bagian} is not empty`)
    for (const [k, v] of Object.entries(isi)) assert.ok(typeof v === 'number' && Number.isFinite(v) && v >= 0, `egress.mongo.${bagian}.${k} must be a non-negative number`)
  }
  assert.equal(/marker/i.test(JSON.stringify(kesehatan.body)), false, 'health must not echo any request marker')
  assert.equal((logs().match(/\[incident\]/g) ?? []).length, 0, 'parser refusals must not produce uncaught incidents')
  console.log('bodyParserBounds: identity/gzip/deflate exact 12 MiB accepted; +1 and high-ratio expansion refused 413; malformed 400, unsupported 415, auth 401/403, no writes; passed')
  await new Promise(resolve => setTimeout(resolve, 1500))

  // 2c. Every route group of the RBAC matrix (ENG-E4-02). The 15 clinical routes of rbacKlinis plus the referral, care, reminder,
  // application, genomics and health-series groups are each driven with a distinctive marker in the path, the query and the body, as the
  // role that owns them. The route list is read from the source and must equal the driven list in both directions, so a new route in
  // these groups forces an entry here. Statuses are not the point (many are 4xx for synthetic ids); what must hold is that no route
  // answers 5xx (the path that alerts the owner with the error text) and that none of the markers reaches the log.
  type Who = 'alice' | 'doctor' | 'owner'
  const groupRoutes = new Set<string>()
  for (const file of sources(join(serverRoot, 'src'))) {
    for (const m of readFileSync(file, 'utf8').matchAll(/app\.(get|post|put|patch|delete)\('(\/api\/(?:clinical|referrals|care|reminders|applications|genomics|health-series|lab-results|lab-log|clinician|keadaan-longitudinal|health-alerts|health-profile|health-sync|health-webhook|settings|second-opinion|owner\/staff[a-z-]*|audit|doctors)(?:\/[^']*)?)'/g)) groupRoutes.add(`${m[1]!.toUpperCase()} ${m[2]}`)
  }
  assert.ok(groupRoutes.size >= 70, `the route scanner must see the real route groups (saw ${groupRoutes.size})`)
  const mk = (tag: string) => `rg-${tag}-marker`
  const text = (tag: string) => ({ text: mk(tag) })
  const driven: Array<[who: Who, route: string, body?: (tag: string) => unknown]> = [
    ['doctor', 'GET /api/clinical'], ['doctor', 'POST /api/clinical/record', (t) => ({ patientId: mk(t), record: { id: mk(`${t}id`), patientId: mk(t), anamnesis: { keluhanUtama: mk(`${t}b`) } } })],
    ['doctor', 'POST /api/clinical/encounter/close', (t) => ({ patientId: mk(t), note: mk(`${t}n`) })], ['doctor', 'GET /api/clinical/encounters/:patientId'],
    ['doctor', 'POST /api/clinical/patient/:patientId/link-code'], ['doctor', 'GET /api/clinical/patient/:patientId/link-status'],
    ['alice', 'POST /api/clinical/link', (t) => ({ code: mk(t) })], ['alice', 'GET /api/clinical/links'], ['alice', 'DELETE /api/clinical/link/:patientId'],
    ['doctor', 'GET /api/clinical/records/:patientId'], ['doctor', 'GET /api/clinical/record-history/:patientId'],
    ['doctor', 'POST /api/clinical/education', (t) => ({ patientId: mk(t), sheet: { title: mk(`${t}s`) } })], ['doctor', 'POST /api/clinical/vital', (t) => ({ patientId: mk(t), vital: { note: mk(`${t}v`) } })],
    ['doctor', 'POST /api/clinical/supportive', (t) => ({ patientId: mk(t), result: { note: mk(`${t}r`) } })], ['doctor', 'POST /api/clinical/patient', (t) => ({ patient: { id: mk(t), name: mk(`${t}p`), mrn: mk(`${t}m`) } })],
    ['doctor', 'POST /api/referrals', (t) => ({ patientId: patientId, kind: 'lab', reason: mk(t), toFacility: mk(`${t}f`) })], ['doctor', 'GET /api/referrals'], ['doctor', 'GET /api/referrals/:id'],
    ['doctor', 'POST /api/referrals/:id/advance', (t) => ({ to: 'accepted', returnNote: mk(t), closeReason: mk(`${t}c`) })],
    ['alice', 'GET /api/care/plans'], ['alice', 'POST /api/care/reports', (t) => ({ planId: mk(t), answers: [{ question: 'q', answer: mk(`${t}a`) }], note: mk(`${t}n`) })],
    ['alice', 'GET /api/reminders'], ['alice', 'POST /api/reminders', (t) => ({ medName: mk(t), dose: mk(`${t}d`), timeOfDay: '08:00' })], ['alice', 'PATCH /api/reminders/:id', (t) => ({ medName: mk(t), dose: mk(`${t}d`) })],
    ['alice', 'DELETE /api/reminders/:id'],
    ['owner', 'GET /api/applications'], ['alice', 'POST /api/applications', (t) => ({ role: 'dokter', name: mk(t), str: mk(`${t}s`), institution: mk(`${t}i`) })],
    ['owner', 'POST /api/applications/decide', (t) => ({ id: mk(t), decision: 'approve', note: mk(`${t}n`) })],
    ['alice', 'GET /api/genomics/compute/capabilities'], ['alice', 'POST /api/genomics/compute/jobs', (t) => ({ kind: 'ont-basecalling', sample: mk(t), input: mk(`${t}i`) })],
    ['alice', 'GET /api/genomics/compute/jobs/:jobHandle'], ['alice', 'POST /api/genomics/compute/jobs/:jobHandle/cancel', (t) => text(t)],
    ['alice', 'GET /api/health-series/heart-rate'], ['alice', 'GET /api/health-series/sleep'],
    ['alice', 'PUT /api/health-series/diary', (t) => ({ foods: [{ id: mk(t), name: mk(`${t}f`), at: '2026-01-01T08:00:00.000Z' }], wellness: [{ id: mk(`${t}w`), note: mk(`${t}n`) }] })],
    ['alice', 'PUT /api/health-series/self-vitals', (t) => ({ selfVitalsLog: [{ id: mk(t), at: '2026-01-01T08:00:00.000Z', systolic: 111, diastolic: 71, heartRate: 61, spo2: 98, tempC: 36.6 }] })],
    ['alice', 'PUT /api/health-series/vo2max', (t) => ({ vo2maxLog: [{ id: mk(t), at: '2026-01-01T08:00:00.000Z', value: 47.5, method: mk(`${t}m`) }] })],
    ['alice', 'DELETE /api/health-series'],
    ['alice', 'GET /api/lab-results'], ['alice', 'GET /api/lab-results/:id'], ['alice', 'GET /api/lab-results/metrics'],
    ['alice', 'POST /api/lab-results', (t) => ({ patientId: mk(t), item: { name: mk(`${t}n`), valueText: mk(`${t}v`), collectedAt: '2026-01-01' }, source: 'lab-intake' })],
    ['alice', 'POST /api/lab-results/:id/advance', (t) => ({ to: 'pending_review', communication: mk(t) })],
    ['alice', 'GET /api/lab-log'], ['alice', 'GET /api/lab-log/fhir'], ['alice', 'GET /api/lab-log/shares'],
    ['alice', 'POST /api/lab-log/shares', (t) => ({ dokterEmail: `${mk(t)}@localhost.test`, hari: 7 })], ['alice', 'DELETE /api/lab-log/shares/:id'],
    ['alice', 'PUT /api/lab-log', (t) => ({ log: { gdp: [{ id: mk(t), tanggal: '2026-01-03', nilai: 111.11 }] }, diperbaruiPada: '2000-01-01T00:00:00.000Z' })],
    ['doctor', 'GET /api/clinician/lab-shares'], ['doctor', 'GET /api/clinician/lab-shares/:id/care'], ['doctor', 'GET /api/clinician/lab-shares/:id/care/fhir'], ['doctor', 'GET /api/clinician/lab-shares/:id/fhir'],
    ['doctor', 'POST /api/clinician/lab-shares/:id/care-plan', (t) => ({ plan: { goal: mk(t), steps: [mk(`${t}s`)] } })], ['doctor', 'POST /api/clinician/lab-shares/:id/review', (t) => ({ tes: 'gdp', catatan: mk(t) })],
    ['alice', 'GET /api/keadaan-longitudinal'], ['alice', 'GET /api/health-alerts/context'], ['alice', 'GET /api/health-profile'], ['alice', 'PUT /api/health-profile', (t) => ({ profile: { weightKg: 70, note: mk(t), name: mk(`${t}n`) } })],
    ['alice', 'GET /api/health-profile/webhook-token'], ['alice', 'POST /api/health-profile/webhook-token/rotate'], ['alice', 'GET /api/health-sync/diagnosis'],
    ['alice', 'POST /api/health-webhook/:token', (t) => ({ data: { metrics: [{ name: mk(t), units: 'kg', data: [{ qty: 61.5, date: '2026-10-11 08:00:00 +0000' }] }] } })],
    ['alice', 'GET /api/settings'], ['alice', 'PUT /api/settings', (t) => ({ settings: { note: mk(t) } })],
    ['alice', 'GET /api/second-opinion'], ['alice', 'POST /api/second-opinion', (t) => ({ symptoms: mk(t), history: mk(`${t}h`) })], ['doctor', 'POST /api/second-opinion/:id/complete', (t) => ({ answer: mk(t) })],
    ['owner', 'GET /api/owner/staff'], ['owner', 'POST /api/owner/staff-assignments', (t) => ({ userId: mk(t), patientId: mk(`${t}p`) })], ['owner', 'POST /api/owner/staff-role', (t) => ({ userId: mk(t), role: 'perawat' })],
    ['owner', 'GET /api/audit'], ['alice', 'GET /api/doctors'], ['owner', 'POST /api/doctors/:id/verify', (t) => ({ status: 'verified', note: mk(t) })],
  ]
  const drivenRoutes = driven.map(([, route]) => route)
  assert.equal(new Set(drivenRoutes).size, drivenRoutes.length, 'each route group member is driven once')
  assert.deepEqual([...groupRoutes].sort(), [...drivenRoutes].sort(), 'the driven routes equal the routes registered in the RBAC-matrix groups, in both directions')
  const routeMarkers: string[] = []
  const tokens: Record<Who, string> = { alice: alice.token, doctor: doctor.token, owner: owner.token }
  const answered: string[] = []
  for (const [i, [who, route, body]] of driven.entries()) {
    const [method, pattern] = route.split(' ') as [string, string]
    const tag = `g${i}`
    const concrete = pattern.replace(/:([A-Za-z]+)/g, (_m, name: string) => mk(`${tag}${name}`))
    for (const [, name] of pattern.matchAll(/:([A-Za-z]+)/g)) routeMarkers.push(mk(`${tag}${name}`))
    const query = method === 'GET' || method === 'DELETE' ? `?rgq=${mk(`${tag}q`)}` : ''
    if (query) routeMarkers.push(mk(`${tag}q`))
    const payload = body?.(tag)
    if (payload !== undefined) for (const m of JSON.stringify(payload).matchAll(/rg-[a-z0-9]+-marker/g)) routeMarkers.push(m[0])
    const r = await call(method, `${concrete}${query}`, tokens[who], payload)
    answered.push(`${route} -> ${r.status}`)
    assert.ok(r.status < 500, `${route} must not answer 5xx with marker data (got ${r.status})`)
  }
  assert.ok(routeMarkers.length > 40, 'the markers were really sent')
  const byStatus: Record<string, number> = {}
  for (const line of answered) { const code = line.slice(-3); byStatus[code] = (byStatus[code] ?? 0) + 1 }
  console.log(`logPrivacyHttp routes: ${driven.length} routes of the RBAC-matrix groups driven with ${routeMarkers.length} markers, statuses ${JSON.stringify(byStatus)}`)
  await new Promise((resolve) => setTimeout(resolve, 500))

  const written = logs()
  assert.ok(written.length > 0, 'the server wrote its startup and request lines, so the capture is real')
  for (const secret of [
    'logprivacy-alice@localhost.test', 'logprivacy-doctor@localhost.test', ownerEmail, '@localhost.test',
    'Alice Marker', 'Dr Marker', 'Owner Marker', 'MRN-MARKER', 'penicillin-marker', 'complaint-marker', 'exam-marker', 'labvalue-marker', '987.65',
    'review-note-marker', '71.234', '71.23', '53117', 'symptom-marker', 'history-marker', 'feedback-marker', 'forged',
    privateLabel, 'synthetic-private-health-label', 'synthetic-forged-log-line', 'weight_body_mass', 'weightKg', token,
    'malformed-name-marker', 'malformed-mrn-marker', 'malformed-trailing-marker', 'malformed-unquoted-marker', 'malformed-singlequote-marker',
    'malformed-lab-marker', 'malformed-value-marker', 'malformed-not-json-marker', 'malformed-oversize-marker',
    'parser-private-marker', 'parser-malformed-marker', 'parser-unsupported-private-marker', 'parser-charset-private-marker', 'parser-auth-marker', 'parser-auth-private-marker',
    ...routeMarkers,
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
