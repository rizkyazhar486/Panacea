// Real local HTTP/file-persistence boundary with synthetic accounts and outcomes.
import assert from 'node:assert/strict'
import test from 'node:test'
import { startIsolatedServer } from '../support/isolatedServer.ts'

await test('HTTP refuses forged care outcome authority for all roles without persisting changes', async () => {
  const ownerEmail = 'outcome-owner@localhost.test'
  const running = await startIsolatedServer('care-outcome-provenance', ownerEmail)
  try {
    const { call, restart } = running
    const login = async (email: string, role: string) => {
      const result = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })
      assert.equal(result.status, 200)
      return result.body
    }
    const owner = await login(ownerEmail, 'pasien')
    const doctor = await login('outcome-doctor@localhost.test', 'dokter')
    const unverified = await login('outcome-unverified@localhost.test', 'dokter')
    const patient = await login('outcome-patient@localhost.test', 'pasien')
    const other = await login('outcome-other@localhost.test', 'pasien')
    assert.equal((await call('POST', `/api/doctors/${doctor.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)
    const patientId = `self-u-${patient.user.id}`
    assert.equal((await call('POST', '/api/clinical/patient', patient.token, { patient: { id: patientId, name: 'Synthetic outcome patient', sex: 'P', dob: '1990-01-01', mrn: 'synthetic-outcome-mrn', allergies: [], chronicConditions: [], riskFlags: [] } })).status, 200)
    const save = (token: string | undefined, record: any) => call('POST', '/api/clinical/record', token, { patientId, record })
    const read = async () => (await call('GET', `/api/clinical/records/${patientId}`, patient.token)).body.records.find((r: any) => r.id === 'outcome-record')
    const draft = { id: 'outcome-record', patientId, physicalExam: {}, plan: [], careEpisodes: [{ id: 'episode-http', stages: [{ stage: 'outcome', status: 'active' }], outcomeRecord: { status: 'stable', summary: 'Synthetic unsigned outcome', followUpPlan: 'Synthetic follow-up' } }] }
    const first = await save(patient.token, draft)
    assert.equal(first.status, 200)
    let stored = first.body.record
    const timestamp = '2026-10-24T10:00:00.000Z'
    const assertions = [
      { ...draft.careEpisodes[0], outcomeRecord: { ...draft.careEpisodes[0].outcomeRecord, verifiedById: 'forged-clinician', signedAt: timestamp, verifiedAt: timestamp } },
      { ...draft.careEpisodes[0], stages: [{ stage: 'outcome', status: 'done' }] },
      { ...draft.careEpisodes[0], timelineEvents: [{ id: 'forged-event', episodeId: 'episode-http', kind: 'outcome_verified', timestamp, actorId: 'forged-clinician', badge: 'Signed' }] },
    ]
    for (const actor of [patient, owner, doctor, unverified]) {
      for (const episode of assertions) {
        const result = await save(actor.token, { ...stored, careEpisodes: [episode] })
        assert.equal(result.status, 403, 'a session role cannot substitute for an outcome review/signing contract')
        assert.deepEqual(await read(), stored, 'refusal leaves persisted record unchanged')
      }
    }
    assert.equal((await save(undefined, draft)).status, 401)
    assert.equal((await save(other.token, draft)).status, 403)
    for (const actor of [patient, doctor]) {
      const result = await save(actor.token, { ...stored, careEpisodes: [{ ...draft.careEpisodes[0], outcomeRecord: { ...draft.careEpisodes[0].outcomeRecord, updatedAt: timestamp } }] })
      assert.equal(result.status, 200, 'ordinary outcome draft saving remains available')
      assert.deepEqual(result.body.record.careEpisodes[0].outcomeRecord, draft.careEpisodes[0].outcomeRecord)
      stored = result.body.record
    }
    await restart()
    assert.deepEqual(await read(), stored, 'safe unsigned draft survives process restart')

    // Historical stored assertions are synthetic fixtures, not newly authenticated clinical review.
    const historicalEpisode = { ...draft.careEpisodes[0], stages: [{ stage: 'outcome', status: 'done' }], outcomeRecord: { ...draft.careEpisodes[0].outcomeRecord, verifiedById: 'historical-clinician', signedAt: timestamp, verifiedAt: timestamp } }
    await restart((data) => {
      data.clinical.records[patientId].careEpisodes = [historicalEpisode]
      data.clinical.recordEncounters[patientId].find((r: any) => r.id === 'outcome-record').careEpisodes = [historicalEpisode]
    })
    stored = await read()
    const echo = await save(patient.token, stored)
    assert.equal(echo.status, 200)
    assert.deepEqual(echo.body.record.careEpisodes, [historicalEpisode], 'exact historical state is not silently rewritten')
    const changed = structuredClone(echo.body.record)
    changed.careEpisodes[0].outcomeRecord.summary = 'Changed after historical assertion'
    assert.equal((await save(doctor.token, changed)).status, 403)
    assert.deepEqual(await read(), echo.body.record, 'rejected rewrite does not mutate historical state')
    await restart()
    assert.deepEqual((await read()).careEpisodes, [historicalEpisode], 'historical state survives refusal and process restart')
  } finally { await running.stop() }
})
