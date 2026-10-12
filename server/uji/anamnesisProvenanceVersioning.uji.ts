// Alpha A3: anamnesis provenance (author, time, source) and versioning, over real HTTP in isolated file mode.
// Synthetic fixtures; doctor verification is a workflow fixture, not clinical approval.
import assert from 'node:assert/strict'
import { startIsolatedServer } from './support/isolatedServer.ts'

const ownerEmail = 'anamnesis-owner@localhost.test'
const running = await startIsolatedServer('anamnesis-provenance', ownerEmail)
try {
  const { call } = running
  const login = async (email: string, role: string) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string; name: string } }
  }
  const owner = await login(ownerEmail, 'pasien')
  const doctor = await login('anamnesis-doctor@localhost.test', 'dokter')
  const alice = await login('anamnesis-alice@localhost.test', 'pasien')
  const bob = await login('anamnesis-bob@localhost.test', 'pasien')
  assert.equal((await call('POST', `/api/doctors/${doctor.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)

  const patientId = `self-u-${alice.user.id}`
  assert.equal((await call('POST', '/api/clinical/patient', doctor.token, { patient: { id: patientId, name: 'Synthetic anamnesis patient', sex: 'P', dob: '1991-02-03', mrn: 'synthetic-anamnesis-mrn', allergies: [], chronicConditions: [], riskFlags: [] } })).status, 200)
  const recordId = 'synthetic-anamnesis-record'
  const base = (anamnesis: Record<string, string>, extra: Record<string, unknown> = {}) => ({
    id: recordId, patientId, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    anamnesis, physicalExam: { general: 'Synthetic' }, problems: [], plan: [], references: [], clinically_reviewed: false, ...extra,
  })
  const save = async (token: string, record: unknown) => call('POST', '/api/clinical/record', token, { patientId, record })
  const history = async (token = doctor.token) => {
    const r = await call('GET', `/api/clinical/record-history/${patientId}?recordId=${recordId}`, token)
    assert.equal(r.status, 200); return r.body.history as any[]
  }
  const isoNow = (s: string) => Number.isFinite(Date.parse(s))
  const pause = () => new Promise(resolve => setTimeout(resolve, 15))

  // 1. Each clinician-authored answer is stored with source, author and a server-stamped time; client-claimed provenance is ignored.
  const first = await save(doctor.token, base(
    { keluhanUtama: 'Synthetic complaint A', rps: 'Synthetic history A' },
    { asalIsian: { 'anamnesis.keluhanUtama': { asal: 'Dokter', olehId: 'client-forged', pada: '1999-01-01T00:00:00.000Z' } } },
  ))
  assert.equal(first.status, 200)
  const p1 = first.body.record.asalIsian
  for (const key of ['anamnesis.keluhanUtama', 'anamnesis.rps']) {
    assert.equal(p1[key].asal, 'Dokter', `${key} source`)
    assert.equal(p1[key].olehId, doctor.user.id, `${key} author is the authenticated clinician, not the client claim`)
    assert.ok(isoNow(p1[key].pada) && p1[key].pada.startsWith('20') && p1[key].pada > '2000', `${key} time is server-stamped`)
  }
  assert.notEqual(p1['anamnesis.keluhanUtama'].pada, '1999-01-01T00:00:00.000Z')
  assert.deepEqual(Object.keys(p1).sort(), ['anamnesis.keluhanUtama', 'anamnesis.rps', 'physicalExam.general'], 'only filled fields carry provenance; empty fields carry none')

  // 2. Editing one answer re-stamps only that answer; untouched answers keep their original author and time.
  await pause()
  const second = await save(doctor.token, base({ keluhanUtama: 'Synthetic complaint A', rps: 'Synthetic history B' }, { asalIsian: p1 }))
  const p2 = second.body.record.asalIsian
  assert.deepEqual(p2['anamnesis.keluhanUtama'], p1['anamnesis.keluhanUtama'], 'unchanged answer keeps its provenance')
  assert.notEqual(p2['anamnesis.rps'].pada, p1['anamnesis.rps'].pada, 'changed answer is re-stamped')
  assert.ok(p2['anamnesis.rps'].pada > p1['anamnesis.rps'].pada)
  assert.deepEqual(await history(), [], 'an unsigned draft is edited in place: nothing is archived yet')

  // 3. Signing is server-stamped; saving identical content afterwards creates no version.
  const signed = await save(doctor.token, { ...second.body.record, signedAt: 'sign-intent', signedById: 'client-forged', signedBy: 'Client forged' })
  assert.equal(signed.body.record.signedById, doctor.user.id); assert.ok(isoNow(signed.body.record.signedAt))
  const v1 = signed.body.record
  assert.deepEqual(await history(), [])
  assert.equal((await save(doctor.token, v1)).status, 200)
  assert.deepEqual(await history(), [], 're-saving identical signed content creates no version')

  // 4. Changing a signed record never overwrites it: the signed version is archived, retrievable, and the live record loses the signature.
  await pause()
  const edited = await save(doctor.token, { ...v1, anamnesis: { ...v1.anamnesis, keluhanUtama: 'Synthetic complaint C' } })
  assert.equal(edited.status, 200)
  assert.equal(edited.body.record.signedAt, undefined, 'changed content no longer carries the old signature')
  assert.equal(edited.body.record.anamnesis.keluhanUtama, 'Synthetic complaint C')
  assert.notEqual(edited.body.record.asalIsian['anamnesis.keluhanUtama'].pada, v1.asalIsian['anamnesis.keluhanUtama'].pada)
  const h1 = await history()
  assert.equal(h1.length, 1, 'one archived version')
  assert.equal(h1[0].anamnesis.keluhanUtama, 'Synthetic complaint A', 'the archived version keeps the original wording')
  assert.equal(h1[0].signedById, doctor.user.id); assert.equal(h1[0].signedAt, v1.signedAt)
  assert.equal(h1[0].diarsipkanOleh, doctor.user.id, 'who replaced it is recorded'); assert.ok(isoNow(h1[0].diarsipkanPada))
  assert.deepEqual(h1[0].asalIsian, v1.asalIsian, 'archived version keeps its own per-answer provenance')

  // 5. Re-sign and change again: history grows by one, earlier versions are untouched, order is chronological.
  const resigned = await save(doctor.token, { ...edited.body.record, signedAt: 'sign-intent' })
  await pause()
  await save(doctor.token, { ...resigned.body.record, anamnesis: { ...resigned.body.record.anamnesis, rps: 'Synthetic history D' } })
  const h2 = await history()
  assert.equal(h2.length, 2)
  assert.deepEqual(h2[0], h1[0], 'earlier archived versions are never modified')
  assert.equal(h2[1].anamnesis.keluhanUtama, 'Synthetic complaint C'); assert.ok(h2[1].diarsipkanPada >= h2[0].diarsipkanPada)
  assert.equal((await call('GET', `/api/clinical/record-history/${patientId}`, doctor.token)).body.history.length, 2, 'history is readable without a recordId filter too')
  assert.deepEqual((await call('GET', `/api/clinical/record-history/${patientId}?recordId=other-record`, doctor.token)).body.history, [], 'filtered by record')

  // 6. A patient edit of a signed record is labelled as not clinician-authored, cannot carry a clinician signature or clinician provenance,
  // and still archives the signed version it replaced.
  const live = (await call('GET', `/api/clinical/records/${patientId}`, doctor.token)).body.records.find((r: any) => r.id === recordId)
  const resignedAgain = await save(doctor.token, { ...live, signedAt: 'sign-intent' })
  const signedLive = resignedAgain.body.record
  const beforePatient = (await history()).length
  const patientEdit = await save(alice.token, { ...signedLive, anamnesis: { ...signedLive.anamnesis, keluhanUtama: 'Synthetic patient-written wording' },
    asalIsian: { 'anamnesis.keluhanUtama': { asal: 'Dokter', olehId: doctor.user.id, pada: signedLive.signedAt } } })
  assert.equal(patientEdit.status, 200)
  const pr = patientEdit.body.record
  assert.equal(pr.signedAt, undefined); assert.equal(pr.signedById, undefined); assert.equal(pr.signedBy, undefined)
  assert.equal(pr.asalIsian['anamnesis.keluhanUtama'].asal, 'AI', 'a patient cannot claim clinician provenance')
  assert.equal(pr.asalIsian['anamnesis.keluhanUtama'].olehId, undefined, 'KNOWN LIMIT: non-clinician provenance carries a source and time but no author id')
  assert.ok(isoNow(pr.asalIsian['anamnesis.keluhanUtama'].pada))
  assert.equal((await history()).length, beforePatient + 1, 'the signed version replaced by the patient is archived')
  assert.equal((await history()).at(-1).diarsipkanOleh, alice.user.id, 'the archive records that the patient replaced it')
  assert.equal((await history()).at(-1).signedById, doctor.user.id, 'the archived version still shows its clinician signer')

  // 7. History is as private as the record, and a client cannot write it.
  assert.equal((await call('GET', `/api/clinical/record-history/${patientId}`, bob.token)).status, 403)
  assert.equal((await call('GET', `/api/clinical/record-history/${patientId}`)).status, 401)
  assert.deepEqual((await call('GET', `/api/clinical/record-history/${patientId}`, alice.token)).body.history, await history(), 'the patient reads the same history')
  for (const method of ['POST', 'PUT', 'DELETE']) {
    const r = await call(method, `/api/clinical/record-history/${patientId}`, doctor.token, { history: [] })
    assert.ok(r.status === 404 || r.status === 405, `${method} on history is not an API: ${r.status}`)
  }
  assert.equal((await history()).length, beforePatient + 1, 'nothing rewrote the history')

  console.log('anamnesisProvenanceVersioning: per-answer author/source/server time, untouched answers keep provenance, signed versions archived and immutable, patient edits labelled and archived; passed')
} finally {
  await running.stop()
}
