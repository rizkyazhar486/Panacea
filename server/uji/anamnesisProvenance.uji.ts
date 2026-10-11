// Alpha A3: anamnesis answers keep author, time and source; a change makes a new version instead of overwriting.
// Real application over HTTP in isolated file mode; synthetic fixtures; doctor verification is a workflow fixture, not clinical approval.
import assert from 'node:assert/strict'
import { startIsolatedServer } from './support/isolatedServer.ts'

const ownerEmail = 'anamnesis-owner@localhost.test'
const running = await startIsolatedServer('anamnesis-provenance', ownerEmail)
try {
  const { call } = running
  const login = async (email: string, role: string, name = email) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string } }
  }
  const owner = await login(ownerEmail, 'pasien')
  const doctor = await login('anamnesis-doctor@localhost.test', 'dokter', 'Synthetic anamnesis doctor')
  const alice = await login('anamnesis-alice@localhost.test', 'pasien')
  assert.equal((await call('POST', `/api/doctors/${doctor.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)
  const pid = `self-u-${alice.user.id}`
  assert.equal((await call('POST', '/api/clinical/patient', doctor.token, { patient: { id: pid, name: 'Synthetic anamnesis patient', sex: 'P', dob: '1991-02-03', mrn: 'synthetic-anamnesis-mrn', allergies: [], chronicConditions: [], riskFlags: [] } })).status, 200)

  const base = {
    id: 'synthetic-anamnesis-record', patientId: pid, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    physicalExam: {}, problems: [], plan: [], references: [], clinically_reviewed: false,
  }
  const save = (who: { token: string }, anamnesis: Record<string, string>, extra: object = {}) =>
    call('POST', '/api/clinical/record', who.token, { patientId: pid, record: { ...base, anamnesis, ...extra } })
  const asal = (r: any, k: string) => r.body.record.asalIsian[`anamnesis.${k}`]

  // 1. Patient answer: stamped as non-clinician (AI/patient intake) with a server time and NO clinician id.
  const p1 = await save(alice, { keluhanUtama: 'Synthetic complaint A' })
  assert.equal(p1.status, 200, JSON.stringify(p1.body))
  const a1 = asal(p1, 'keluhanUtama')
  assert.equal(a1.asal, 'AI')
  assert.equal(a1.olehId, undefined, 'a patient answer never carries a clinician id')
  assert.ok(!Number.isNaN(Date.parse(a1.pada)), 'server stamps a parseable time')
  assert.equal(asal(p1, 'rps'), undefined, 'a blank answer gets no provenance')

  // 2. Forged provenance from the patient (claims Dokter + a clinician id) is ignored.
  const p2 = await save(alice, { keluhanUtama: 'Synthetic complaint A', rps: 'Synthetic history B' }, { asalIsian: { 'anamnesis.rps': { asal: 'Dokter', olehId: doctor.user.id, pada: '1999-01-01T00:00:00.000Z' } } })
  assert.equal(asal(p2, 'rps').asal, 'AI', 'patient cannot claim clinician authorship')
  assert.equal(asal(p2, 'rps').olehId, undefined)
  assert.notEqual(asal(p2, 'rps').pada, '1999-01-01T00:00:00.000Z', 'client time is not trusted')
  assert.deepEqual(asal(p2, 'keluhanUtama'), a1, 'an unchanged answer keeps its original stamp')

  // 3. Clinician change: only the changed field is re-stamped with the authenticated doctor; the untouched field keeps its author.
  const d1 = await save(doctor, { keluhanUtama: 'Synthetic complaint A', rps: 'Synthetic history B (clinician-revised)' })
  assert.equal(d1.status, 200)
  assert.equal(asal(d1, 'rps').asal, 'Dokter')
  assert.equal(asal(d1, 'rps').olehId, doctor.user.id, 'author is the authenticated doctor')
  assert.deepEqual(asal(d1, 'keluhanUtama'), a1, 'unchanged field still attributed to the patient')

  // 4. A clinician can declare AI origin (descending is allowed) but can never be forged upward by the client alone.
  const d2 = await save(doctor, { keluhanUtama: 'Synthetic complaint A', rps: 'Synthetic history B (clinician-revised)', rpd: 'Synthetic AI-drafted C' }, { asalIsian: { 'anamnesis.rpd': { asal: 'AI' } } })
  assert.equal(asal(d2, 'rpd').asal, 'AI')
  assert.equal(asal(d2, 'rpd').olehId, undefined)

  // 5. Signed version is archived, not overwritten: the pre-edit text and signature stay readable in history.
  const signed = await save(doctor, { keluhanUtama: 'Synthetic complaint A', rps: 'Synthetic history B (clinician-revised)', rpd: 'Synthetic AI-drafted C' }, { signedAt: 'sign-intent' })
  assert.equal(signed.body.record.signedById, doctor.user.id)
  const signedAt = signed.body.record.signedAt
  const edited = await save(doctor, { keluhanUtama: 'Synthetic complaint A (changed after signing)', rps: 'Synthetic history B (clinician-revised)', rpd: 'Synthetic AI-drafted C' }, { signedAt, signedBy: signed.body.record.signedBy, signedById: signed.body.record.signedById })
  assert.equal(edited.body.record.signedAt, undefined, 'changing signed content voids the old signature')
  const hist = await call('GET', `/api/clinical/record-history/${pid}?recordId=${base.id}`, doctor.token)
  assert.equal(hist.status, 200)
  assert.equal(hist.body.history.length, 1, 'exactly one archived version')
  assert.equal(hist.body.history[0].anamnesis.keluhanUtama, 'Synthetic complaint A', 'the signed text is preserved verbatim')
  assert.equal(hist.body.history[0].signedById, doctor.user.id)
  assert.equal(asal(edited, 'keluhanUtama').olehId, doctor.user.id, 'the new text is attributed to whoever changed it')

  // 6. A patient editing signed content cannot carry the signature onto the new text; the signed version is archived too.
  const reSigned = await save(doctor, edited.body.record.anamnesis, { signedAt: 'sign-intent' })
  const sig = reSigned.body.record
  const tamper = await save(alice, { ...sig.anamnesis, rpd: 'Synthetic patient tamper' }, { signedAt: sig.signedAt, signedBy: sig.signedBy, signedById: sig.signedById })
  assert.equal(tamper.status, 200)
  assert.equal(tamper.body.record.signedById, undefined, 'signature does not travel to patient-edited content')
  const hist2 = await call('GET', `/api/clinical/record-history/${pid}?recordId=${base.id}`, doctor.token)
  assert.equal(hist2.body.history.length, 2)
  assert.equal(hist2.body.history[1].anamnesis.rpd, 'Synthetic AI-drafted C')

  // 7. A save with no change creates no new version and no new stamp.
  const same = await save(alice, tamper.body.record.anamnesis)
  assert.equal((await call('GET', `/api/clinical/record-history/${pid}?recordId=${base.id}`, doctor.token)).body.history.length, 2)
  assert.deepEqual(asal(same, 'rpd'), asal(tamper, 'rpd'))

  // 8. Another account cannot read or write this anamnesis or its history.
  const bob = await login('anamnesis-bob@localhost.test', 'pasien')
  assert.equal((await call('GET', `/api/clinical/record-history/${pid}`, bob.token)).status, 403)
  assert.equal((await save(bob, { keluhanUtama: 'Synthetic intrusion' })).status, 403)
  assert.equal((await call('GET', `/api/clinical/record-history/${pid}?recordId=${base.id}`, doctor.token)).body.history.length, 2, 'refused write left history unchanged')

  console.log('anamnesisProvenance: per-field author/time/source stamped server-side; forged provenance ignored; signed versions archived; no cross-identity access; passed')
} finally {
  await running.stop()
}
