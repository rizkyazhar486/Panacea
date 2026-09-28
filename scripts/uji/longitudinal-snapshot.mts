import assert from 'node:assert/strict'
import { createLongitudinalSnapshotCache, projectLongitudinalSnapshot, emptyLongitudinalServer } from '../../src/lib/longitudinalSnapshot.ts'
import { canEnterAiContext, canEnterClinicalRecord } from '../../src/lib/panaceaLongitudinalState.ts'
import type { Account } from '../../src/lib/types.ts'

const now = '2026-09-26T10:00:00.000Z'
const account = { patientId: 'p1', email: 'qa@localhost.test', role: 'pasien' } as Account
const app = { account, vitals: {}, selfVitals: [{ id: 'self1', at: '2026-09-25T08:00:00.000Z', systolic: 120, diastolic: 80, heartRate: 72, spo2: 98, tempC: 36.8 }], vo2maxLog: [] }
const local = { owner: account, vitals: {}, labs: {
  gdp: [{ id: 'lab1', tanggal: '2026-09-20', nilai: 100 }],
  crp: [{ id: 'future', tanggal: '2027-01-01', nilai: 2 }],
  hba1c: [{ id: 'invalid', tanggal: 'invalid', nilai: NaN }],
} }
const vital = (id: string, klinisi: boolean) => ({ id, takenAt: '2026-09-25T08:00:00.000Z', heartRate: 80, dicatatOleh: { id: 'recorder', klinisi } })
const server = { ...emptyLongitudinalServer(), owner: account, vitals: { self: [vital('clinician', true), vital('patient', false)] }, records: {
  unsigned: { id: 'draft', patientId: 'p1', anamnesis: {}, physicalExam: {}, plan: [], problems: [] },
} } as ReturnType<typeof emptyLongitudinalServer>
const sources = { app, local, server }
let builds = 0
const cache = createLongitudinalSnapshotCache(input => { builds++; return projectLongitudinalSnapshot(input, now) })
const a = cache.read(sources), b = cache.read({ ...sources }), c = cache.read({ ...sources })
assert.equal(builds, 1, 'three consumers with identical source revisions rebuild once')
assert.strictEqual(a, b); assert.strictEqual(b, c)
assert.deepEqual(a.state, projectLongitudinalSnapshot(sources, now).state, 'cached projection preserves the canonical projector output')
const events = Object.values(a.state!.eventsById)
assert.equal(events.filter(e => e.domain === 'lab').length, 1, 'invalid/future labs fail closed')
const lab = events.find(e => e.domain === 'lab')!
assert.equal(lab.review.state, 'pending')
assert.equal(lab.provenance.method, 'patient-transcribed-lab-report')
assert(!events.some(e => e.metric === 'emr.signed-note'), 'unsigned EMR is not a fact')
assert(events.some(e => e.semanticState === 'clinician-entered'))
assert(events.some(e => e.semanticState === 'patient-reported'))
for (const e of events) {
  assert.deepEqual(e.consent.purposes, ['personal-visualization'])
  assert.equal(canEnterAiContext(e, Date.parse(now)), false)
  assert.equal(canEnterClinicalRecord(e, Date.parse(now)), false)
}
const changed = cache.read({ ...sources, local: { ...local, labs: {} } })
assert.equal(builds, 2); assert.equal(changed.revision, a.revision + 1)
assert.notStrictEqual(changed, a)
assert(!Object.values(changed.state!.eventsById).some(e => e.domain === 'lab'))
const other = { ...account, patientId: 'p2', email: 'other@localhost.test' }
const switched = cache.read({ ...sources, app: { ...app, account: other } })
assert.equal(switched.state!.subjectId, 'p2')
assert.equal(Object.keys(switched.state!.eventsById).length, 0, 'old local/server owner must not be relabelled as the new patient')
assert.equal(cache.read({ ...sources, app: { ...app, account: null } }).state, null, 'logout clears the shared snapshot')
const returned = cache.read(sources)
assert.notStrictEqual(returned, a, 'single-slot cache cannot revive a previous session snapshot')
assert.equal(returned.state!.subjectId, 'p1')
const serverChange = cache.read({ ...sources, server: { ...server, vitals: {} } })
assert.equal(serverChange.revision, returned.revision + 1, 'server source changes invalidate the same snapshot')
const newSelf = { ...app.selfVitals[0], id: 'self2', heartRate: 99 }
const otherUpdate = cache.read({ ...sources, app: { ...app, account: other, selfVitals: [newSelf, ...app.selfVitals] } })
assert(Object.values(otherUpdate.state!.eventsById).some(e => e.value === 99), 'new patient can record new data')
assert(!Object.keys(otherUpdate.state!.eventsById).some(id => id.includes('self1')), 'prepending a new row must not adopt old patient rows')
assert.doesNotThrow(() => cache.read({ ...sources, app: { ...app, selfVitals: [null, 'invalid'] as never } }), 'malformed personal rows fail closed')
const metadata = projectLongitudinalSnapshot({ ...sources, app: { ...app, account: { ...account, name: 'Updated label' } } }, now)
assert.deepEqual(metadata.state, projectLongitudinalSnapshot(sources, now).state, 'cosmetic account updates retain source ownership')
console.log('longitudinal-snapshot: one build/three reads, revision invalidation, patient isolation and provenance passed')
