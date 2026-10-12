// Alpha E4 evidence: no personal or clinical data in server logs. Real application over HTTP in isolated file mode with the
// server's stdout and stderr captured, plus a static guard on the source. Synthetic fixtures with distinctive markers.
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
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
  await call('POST', `/api/health-webhook/${token}`, undefined, { data: { metrics: [{ name: 'weight_body_mass', units: 'kg', data: [{ qty: 71.234, date: '2026-10-11 08:00:00 +0000' }] }] } })
  await call('POST', '/api/health-webhook/not-a-real-token', undefined, { data: {} })
  await call('PUT', '/api/settings', alice.token, { settings: { strStatus: 'forged' } })
  await call('POST', '/api/second-opinion', alice.token, { symptoms: 'symptom-marker-xyz', history: 'history-marker-xyz' })
  await call('POST', '/api/feedback', alice.token, { kind: 'Question', text: 'feedback-marker-xyz text' })
  await new Promise(resolve => setTimeout(resolve, 1500))

  const written = logs()
  assert.ok(written.length > 0, 'the server wrote its startup and request lines, so the capture is real')
  for (const secret of [
    'logprivacy-alice@localhost.test', 'logprivacy-doctor@localhost.test', ownerEmail, '@localhost.test',
    'Alice Marker', 'Dr Marker', 'Owner Marker', 'MRN-MARKER', 'penicillin-marker', 'complaint-marker', 'exam-marker', 'labvalue-marker', '987.65',
    'review-note-marker', '71.234', 'symptom-marker', 'history-marker', 'feedback-marker', 'forged',
  ]) assert.ok(!written.includes(secret), `the server log must not contain "${secret}"`)
  // The diagnostics people rely on are still there, with an opaque marker instead of the address.
  assert.match(written, /\[health-webhook\] u:[0-9a-f]{10}: groups=weight_body_mass\(1\)/, 'the webhook line keeps its diagnostics under an opaque marker')
  assert.match(written, /\[settings\] u:[0-9a-f]{10} attempted to write server-owned keys: strStatus/, 'the settings warning keeps its diagnostics under an opaque marker')
  const markers = new Set([...written.matchAll(/\bu:[0-9a-f]{10}\b/g)].map(m => m[0]))
  assert.equal(markers.size, 1, 'one account is one stable marker across lines (so a support engineer can correlate them)')

  console.log('logPrivacyHttp: no email interpolated in any log statement; a clinical journey writes no names, emails, MRNs, clinical text or values to the server log; diagnostics keep a stable opaque marker; passed')
} finally {
  await running.stop()
}
