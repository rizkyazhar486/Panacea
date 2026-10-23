// Patient ids become object keys in the stores. Names inherited by every object (constructor, __proto__, toString, ...)
// are not valid ids: they must be refused at every entry point, never reach storage, and never cause a 5xx.
// Real application over HTTP in isolated file mode; synthetic fixtures; doctor verification is a workflow fixture.
import assert from 'node:assert/strict'
import { startIsolatedServer } from './support/isolatedServer.ts'

const ownerEmail = 'reserved-owner@localhost.test'
const running = await startIsolatedServer('reserved-ids', ownerEmail)
try {
  const { call } = running
  const login = async (email: string, role: string) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string } }
  }
  const owner = await login(ownerEmail, 'pasien')
  const doctor = await login('reserved-doctor@localhost.test', 'dokter')
  const alice = await login('reserved-alice@localhost.test', 'pasien')
  assert.equal((await call('POST', `/api/doctors/${doctor.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)

  const patient = (id: string) => ({ patient: { id, name: 'Synthetic', sex: 'P', dob: '1990-01-01', mrn: 'synthetic-mrn', allergies: [], chronicConditions: [], riskFlags: [] } })
  const record = (id: string) => ({ patientId: id, record: { id: `record-${id}`, patientId: id, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', anamnesis: { keluhanUtama: 'Synthetic' }, physicalExam: { general: 'Synthetic' }, problems: [], plan: [], references: [], clinically_reviewed: false } })
  const writes: Array<[string, string, (id: string) => unknown]> = [
    ['POST', '/api/clinical/patient', patient],
    ['POST', '/api/clinical/record', record],
    ['POST', '/api/clinical/vital', (id) => ({ patientId: id, vital: { id: 'v1', at: '2026-01-01T00:00:00.000Z', systolic: 120, diastolic: 80, heartRate: 70 } })],
    ['POST', '/api/clinical/supportive', (id) => ({ patientId: id, result: { id: 's1', type: 'lab', name: 'Synthetic', value: '1' } })],
    ['POST', '/api/clinical/education', (id) => ({ patientId: id, sheet: { title: 'Synthetic' } })],
    ['POST', '/api/clinical/encounter/close', (id) => ({ patientId: id })],
    ['POST', '/api/lab-results', (id) => ({ patientId: id, item: { name: 'Synthetic', valueText: 'fixture only', collectedAt: '2026-01-01' }, source: 'lab-intake' })],
    ['POST', '/api/referrals', (id) => ({ patientId: id, kind: 'specialist', reason: 'Synthetic', toFacility: 'Synthetic facility' })],
  ]
  const reads = (id: string) => [`/api/clinical/records/${id}`, `/api/clinical/encounters/${id}`, `/api/clinical/record-history/${id}`]
  const reserved = ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf', 'isPrototypeOf', '__defineGetter__']

  // 1. Every write entry point refuses reserved ids for every elevated role, with a 4xx (never 2xx, never 5xx).
  for (const [who, token] of [['verified doctor', doctor.token], ['owner', owner.token], ['patient', alice.token]] as const) {
    for (const id of reserved) {
      for (const [method, path, body] of writes) {
        const r = await call(method, path, token, body(id))
        assert.ok(r.status >= 400 && r.status < 500, `${who} ${method} ${path} with id "${id}" must be refused with 4xx, got ${r.status}`)
      }
      for (const path of reads(id)) {
        const r = await call('GET', path, token)
        assert.ok(r.status >= 400 && r.status < 500, `${who} GET ${path} must be refused with 4xx, got ${r.status}`)
      }
    }
  }

  // 2. Link lookups never see inherited properties: no phantom link, nothing to delete.
  for (const id of reserved) {
    assert.deepEqual((await call('GET', `/api/clinical/patient/${id}/link-status`, doctor.token)).body, { linked: false }, `link-status "${id}"`)
    assert.equal((await call('DELETE', `/api/clinical/link/${id}`, doctor.token)).status, 404, `unlink "${id}" has no link to remove`)
    assert.equal((await call('DELETE', `/api/clinical/link/${id}`, alice.token)).status, 404, `a patient cannot unlink "${id}" either`)
  }

  // 3. Nothing reserved reached storage, and the server and every other id keep working.
  assert.equal((await call('GET', '/api/health')).status, 200, 'the server is still healthy')
  const clinical = (await call('GET', '/api/clinical', doctor.token)).body
  assert.deepEqual(clinical.patients, [], 'no patient was created from a reserved id')
  for (const table of ['records', 'vitals', 'supportive', 'education', 'encounters']) {
    assert.deepEqual(Object.keys(clinical[table] ?? {}), [], `${table} holds no reserved key`)
  }
  assert.deepEqual((await call('GET', '/api/clinical/records/never-created-id', doctor.token)).body, { records: [] }, 'an unrelated id inherits nothing from a reserved one')
  assert.deepEqual((await call('GET', '/api/lab-results?patientId=constructor', doctor.token)).body.results ?? [], [])
  assert.deepEqual((await call('GET', '/api/referrals?patientId=constructor', doctor.token)).body.referrals ?? [], [])

  // 4. Regression guard: ordinary ids, the patient's own primary id, and a name that is merely similar ("prototype") still work.
  for (const id of ['synthetic-normal-id', 'prototype', 'constructor-2', `self-u-${alice.user.id}`]) {
    assert.equal((await call('POST', '/api/clinical/patient', doctor.token, patient(id))).status, 200, `patient "${id}"`)
    assert.equal((await call('POST', '/api/clinical/record', doctor.token, record(id))).status, 200, `record "${id}"`)
    assert.equal((await call('POST', '/api/clinical/vital', doctor.token, { patientId: id, vital: { id: 'v1', at: '2026-01-01T00:00:00.000Z', systolic: 120, diastolic: 80, heartRate: 70 } })).status, 200, `vital "${id}"`)
    assert.equal((await call('GET', `/api/clinical/records/${id}`, doctor.token)).body.records.length, 1, `read "${id}"`)
  }
  assert.equal((await call('GET', `/api/clinical/records/self-u-${alice.user.id}`, alice.token)).status, 200, 'the patient still reads her own record')
  assert.equal((await call('POST', '/api/lab-results', doctor.token, writes[6]![2]('synthetic-normal-id'))).status, 201, 'lab intake for an ordinary id still works')
  assert.equal((await call('POST', '/api/referrals', doctor.token, writes[7]![2]('synthetic-normal-id'))).status, 201, 'referral for an ordinary id still works')

  console.log('reservedPatientIdsHttp: inherited property names refused as patient ids on every clinical, lab and referral entry point with no 5xx and nothing stored; link lookups own-only; ordinary ids unaffected; passed')
} finally {
  await running.stop()
}
