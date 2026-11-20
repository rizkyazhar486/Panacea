// Synthetic engineering fixtures only. Stored legacy assertions are not clinical validation.
import assert from 'node:assert/strict'
import test from 'node:test'
import { tandaTanganDitolak, terapkanSimpanRekam } from '../../src/domains/clinical-records/rekamKlinis.js'

const now = new Date('2026-10-25T10:00:00.000Z')
const actors = [
  { id: 'synthetic-patient', nama: 'Synthetic patient', klinisi: false },
  { id: 'synthetic-doctor', nama: 'Synthetic doctor', klinisi: true },
]
const draftOutcome = { status: 'stable', summary: 'Synthetic draft outcome', followUpPlan: 'Synthetic follow-up' }
const outcome = { ...draftOutcome, verifiedById: 'stored-clinician', verifiedAt: '2026-10-24T10:00:00.000Z', signedAt: '2026-10-24T10:00:00.000Z' }
const event = { id: 'stored-event', episodeId: 'episode-1', kind: 'outcome_verified', timestamp: outcome.signedAt, actorId: outcome.verifiedById, badge: 'Signed' }
const episode = { id: 'episode-1', stages: [{ stage: 'outcome', status: 'done' }], outcomeRecord: outcome, timelineEvents: [event] }
const record = (episodes: unknown[] = []) => ({ id: 'record-1', patientId: 'patient-1', physicalExam: {}, plan: [], careEpisodes: episodes })
const saved = record([episode])

for (const actor of actors) {
  test(`new outcome signature is refused even for ${actor.klinisi ? 'clinician' : 'patient'} sessions`, () => {
    const input = record([episode])
    assert.equal(tandaTanganDitolak(undefined, input, actor), true)
    const normalized = terapkanSimpanRekam(undefined, input, actor, now).rekam.careEpisodes[0]
    assert.deepEqual(normalized.outcomeRecord, draftOutcome)
    assert.deepEqual(normalized.stages, [{ stage: 'outcome', status: 'pending' }])
    assert.deepEqual(normalized.timelineEvents, [])
    assert.deepEqual(input, record([episode]), 'normalization must not mutate caller data')
  })

  test(`ordinary outcome drafts remain usable for ${actor.klinisi ? 'clinician' : 'patient'} sessions`, () => {
    const input = record([{ id: 'episode-draft', outcomeRecord: { ...draftOutcome, updatedAt: now.toISOString() }, stages: [{ stage: 'followUp', status: 'done' }] }])
    assert.equal(tandaTanganDitolak(undefined, input, actor), false)
    const normalized = terapkanSimpanRekam(undefined, input, actor, now).rekam.careEpisodes[0]
    assert.deepEqual(normalized.outcomeRecord, draftOutcome, 'draft time must not become the legacy projection Signed fallback')
    assert.deepEqual(normalized.stages, [{ stage: 'followUp', status: 'done' }, { stage: 'outcome', status: 'pending' }])
  })

  test(`unchanged stored outcome assertions survive an exact echo from ${actor.klinisi ? 'clinician' : 'patient'}`, () => {
    const input = structuredClone(saved)
    assert.equal(tandaTanganDitolak(saved, input, actor), false)
    assert.deepEqual(terapkanSimpanRekam(saved, input, actor, now).rekam.careEpisodes, saved.careEpisodes)
    assert.deepEqual(input, saved)
  })
}

test('changed outcome content cannot reuse stored signature or completion', () => {
  const input = structuredClone(saved)
  input.careEpisodes[0].outcomeRecord.summary = 'Changed draft outcome'
  assert.equal(tandaTanganDitolak(saved, input, actors[1]), true)
  const result = terapkanSimpanRekam(saved, input, actors[1], now)
  assert.deepEqual(result.rekam.careEpisodes[0].outcomeRecord, { ...draftOutcome, summary: 'Changed draft outcome' })
  assert.equal(result.rekam.careEpisodes[0].stages[0].status, 'pending')
  assert.deepEqual(result.arsip.careEpisodes, saved.careEpisodes, 'previous version remains archived')
  assert.deepEqual(saved.careEpisodes, [episode], 'previous snapshot stays immutable')
})

test('signature carry-over is scoped to the same record and patient', () => {
  for (const changed of [{ id: 'other-record' }, { patientId: 'other-patient' }]) {
    const input = { ...structuredClone(saved), ...changed }
    assert.equal(tandaTanganDitolak(saved, input, actors[1]), true)
    assert.equal(terapkanSimpanRekam(saved, input, actors[1], now).rekam.careEpisodes[0].outcomeRecord.signedAt, undefined)
  }
})

test('missing, blank, or duplicate episode identities cannot inherit stored assertions', () => {
  for (const id of [undefined, '', '   ']) {
    const prior = record([{ ...episode, id }])
    assert.equal(tandaTanganDitolak(prior, structuredClone(prior), actors[1]), true)
  }
  for (const [prior, input] of [[saved, record([episode, episode])], [record([episode, episode]), saved]]) {
    assert.equal(tandaTanganDitolak(prior, input, actors[1]), true)
    assert.equal(terapkanSimpanRekam(prior, input, actors[1], now).rekam.careEpisodes[0].outcomeRecord.signedAt, undefined)
  }
})

test('outcome completion cannot be asserted without signing metadata', () => {
  const input = record([{ id: 'episode-draft', outcomeRecord: draftOutcome, stages: [{ stage: 'outcome', status: 'done' }] }])
  assert.equal(tandaTanganDitolak(undefined, input, actors[0]), true)
  assert.equal(terapkanSimpanRekam(undefined, input, actors[0], now).rekam.careEpisodes[0].stages[0].status, 'pending')
})

test('empty or omitted stages cannot make a new outcome draft count as completed', () => {
  for (const stages of [undefined, []]) {
    const result = terapkanSimpanRekam(undefined, record([{ id: 'episode-draft', outcomeRecord: draftOutcome, stages }]), actors[0], now)
    assert.deepEqual(result.rekam.careEpisodes[0].stages, [{ stage: 'outcome', status: 'pending' }])
  }
})

test('new, edited, or duplicate privileged timeline events are refused and removed', () => {
  const variants = [
    [{ ...event, id: 'new-event' }],
    [{ ...event, actorId: 'forged-clinician' }],
    [event, event],
    [{ ...event, id: '' }],
  ]
  for (const timelineEvents of variants) {
    const input = record([{ ...episode, timelineEvents }])
    assert.equal(tandaTanganDitolak(saved, input, actors[1]), true)
    assert.deepEqual(terapkanSimpanRekam(saved, input, actors[1], now).rekam.careEpisodes[0].timelineEvents, [])
  }
})

test('non-verification timeline information and unrelated records remain unchanged', () => {
  const ordinaryEvent = { id: 'workflow-event', kind: 'stage_transition', timestamp: now.toISOString(), title: 'Synthetic workflow note' }
  const input = record([{ id: 'episode-draft', stages: [{ stage: 'plan', status: 'active' }], timelineEvents: [ordinaryEvent] }])
  assert.equal(tandaTanganDitolak(undefined, input, actors[0]), false)
  assert.deepEqual(terapkanSimpanRekam(undefined, input, actors[0], now).rekam.careEpisodes, input.careEpisodes)
  assert.equal(tandaTanganDitolak(undefined, { physicalExam: {}, plan: [] }, actors[0]), false)
})

await import('./careOutcomeProvenanceHttp.uji.js')
