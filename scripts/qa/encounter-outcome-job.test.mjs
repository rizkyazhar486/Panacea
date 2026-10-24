import test from 'node:test'
import assert from 'node:assert/strict'
import { deriveEncounterOutcomeJob } from '../../src/domains/clinical-operations/model/encounterOutcomeJob.ts'

const at = '2026-10-19T01:00:00.000Z'
const base = { patientId: 'p-1', evaluatedAt: at, vitalTimestamps: [], historyItemCount: 0 }
const record = (override = {}) => ({
  patientId: 'p-1', updatedAt: '2026-10-19T00:30:00.000Z',
  physicalExam: { verifiedById: 'doctor-1' }, signedById: 'doctor-1', signedAt: '2026-10-19T00:31:00.000Z',
  plan: [{ id: 'one', status: 'diverifikasi', verifiedById: 'doctor-1', verifiedAt: '2026-10-19T00:30:00.000Z' }],
  careEpisodes: [], ...override,
})
const episode = (status = 'done') => ({
  id: 'episode-1', stages: [
    { stage: 'schedule', status: 'done', updatedAt: '2026-10-19T00:35:00.000Z' },
    { stage: 'followUp', status, updatedAt: '2026-10-19T00:40:00.000Z' },
    { stage: 'outcome', status, updatedAt: '2026-10-19T00:45:00.000Z' },
  ],
})

test('missing evidence cannot turn into a successful care journey', () => {
  const job = deriveEncounterOutcomeJob(base)
  assert.deepEqual(job.steps.map(s => s.state), ['missing', 'missing', 'missing', 'missing'])
  assert.equal(job.operationalOutcomeVerified, false)
  assert.equal(job.nextAction.href, '/emr')
})
test('data available does not mean reviewed or signed', () => {
  const job = deriveEncounterOutcomeJob({ ...base, vitalTimestamps: ['2026-10-19T00:50:00.000Z'], record: record({ signedById: undefined }) })
  assert.deepEqual(job.steps.map(s => s.state), ['prepared', 'needs-review', 'missing', 'missing'])
  assert.equal(job.clinicalRecordVerified, false)
})
test('clinician-signed current chart is verified, not the operational outcome', () => {
  const job = deriveEncounterOutcomeJob({ ...base, record: record({ careEpisodes: [episode()] }) })
  assert.equal(job.steps[1].state, 'verified')
  assert.equal(job.steps[2].state, 'tracked')
  assert.equal(job.steps[3].state, 'tracked')
  assert.equal(job.operationalOutcomeVerified, false)
  assert.match(job.nextAction.title, /Review recorded outcome evidence/)
})
test('mismatched subject, future and invalid dates fail closed', () => {
  for (const wrong of [record({ patientId: 'other' }), record({ updatedAt: '2026-10-19T01:05:00.000Z' }), record({ updatedAt: '2026-02-30T00:00:00.000Z' })]) {
    const job = deriveEncounterOutcomeJob({ ...base, record: wrong })
    assert.equal(job.clinicalRecordVerified, false)
    assert.equal(job.steps[1].state, 'missing')
  }
  assert.equal(deriveEncounterOutcomeJob({ ...base, vitalTimestamps: ['2026-10-19T01:01:00.000Z'] }).steps[0].state, 'missing')
})
test('plan proposals, missing markers and post-signature changes require review', () => {
  for (const wrong of [record({ plan: [{ status: 'usulan' }] }), record({ plan: [{ status: 'diverifikasi' }] }), record({ updatedAt: '2026-10-19T00:40:00.000Z' })]) {
    assert.equal(deriveEncounterOutcomeJob({ ...base, record: wrong }).steps[1].state, 'needs-review')
  }
})
test('blocked handoff is visible and incomplete follow-up cannot claim closure', () => {
  const careEpisodes = [episode('pending'), { ...episode(), id: 'blocked', stages: [{ stage: 'treatment', status: 'blocked', updatedAt: at }] }]
  const job = deriveEncounterOutcomeJob({ ...base, record: record({ careEpisodes }) })
  assert.equal(job.steps[2].state, 'blocked')
  assert.equal(job.steps[3].state, 'missing')
  assert.equal(job.nextAction.title, 'Resolve blocked care handoff')
})
test('critical flag preempts signed chart and cannot prescribe autonomously', () => {
  const job = deriveEncounterOutcomeJob({ ...base, criticalFlag: true, record: record({ careEpisodes: [episode()] }) })
  assert.equal(job.nextAction.title, 'Review critical flag now')
  assert.equal(job.nextAction.href, '/emr')
  assert.equal(job.operationalOutcomeVerified, false)
})
test('bad evaluation clock is rejected', () => {
  assert.throws(() => deriveEncounterOutcomeJob({ ...base, evaluatedAt: '2026-02-30T00:00:00Z' }), /evaluatedAt/)
})
