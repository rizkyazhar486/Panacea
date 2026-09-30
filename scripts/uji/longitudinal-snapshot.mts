import assert from 'node:assert/strict'
import { createLongitudinalSnapshotCache, projectLongitudinalSnapshot, emptyLongitudinalServer, sumberLabLongitudinal, sumberVitalsLongitudinal, sumberDeretLongitudinal } from '../../src/lib/longitudinalSnapshot.ts'
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
const serverLabs = { gdp: [{ id: 'server', tanggal: '2026-09-20', nilai: 90 }] }
const browserLabs = { gdp: [{ id: 'browser', tanggal: '2026-09-20', nilai: 180 }] }
assert.equal(sumberLabLongitudinal(serverLabs, browserLabs).source, 'server')
assert.equal(sumberLabLongitudinal(serverLabs, browserLabs).labs.gdp[0].id, 'server', 'a server lab log replaces the browser copy')
assert.equal(sumberLabLongitudinal(null, browserLabs).source, 'browser')
assert.equal(sumberLabLongitudinal(null, browserLabs).labs, browserLabs, 'offline keeps the browser copy')
const fromServer = projectLongitudinalSnapshot({ ...sources, local: { ...local, labs: sumberLabLongitudinal(serverLabs, browserLabs).labs } }, now)
assert.equal(Object.values(fromServer.state!.eventsById).find(e => e.domain === 'lab')!.value, 90)
assert.equal(a.labSource, 'browser')
assert.equal(a.serverSource, 'browser')
assert.equal(a.deviceSource, 'browser')
assert.equal(a.selfSource, 'browser')
assert.equal(a.vo2Source, 'browser')
const vitalsServer = sumberVitalsLongitudinal({ weightKg: 70, restingHr: 55 }, { weightKg: 99, steps: 1000 })
assert.equal(vitalsServer.source, 'server')
assert.equal(vitalsServer.vitals.weightKg, 70)
assert.equal(vitalsServer.vitals.steps, 1000, 'server keys overlay the browser snapshot without dropping other fields')
assert.equal(sumberVitalsLongitudinal(null, { weightKg: 99 }).source, 'browser')
assert.equal(sumberDeretLongitudinal([{ id: 's1' }], [{ id: 'b1' }]).rows[0].id, 's1')
assert.equal(sumberDeretLongitudinal([], [{ id: 'b1' }]).source, 'browser', 'empty server series keeps AppState-only rows')
assert.equal(sumberDeretLongitudinal(null, [{ id: 'b1' }]).source, 'browser')

{
  const harian = projectLongitudinalSnapshot({
    ...sources,
    app: {
      ...app,
      foods: [{ id: 'f1', date: '2026-09-25', name: 'rice', grams: 100, kcal: 130, protein: 3, carbs: 28, fat: 1 }],
      sleepLogs: [
        { id: 's1', date: '2026-09-25', hours: 7.5, bedtimeConsistent: true },
        { id: 'far', date: '2026-10-05', hours: 8, bedtimeConsistent: false },
      ],
      wellness: { '2026-09-25': { date: '2026-09-25', waterMl: 1800, sleepHr: 7 } },
      trainingLogs: [{ id: 't1', date: '2026-09-25', rpe: 6, type: 'Run' }],
    },
  }, now)
  const metrik = Object.values(harian.state!.eventsById)
  assert.equal(metrik.find((e) => e.metric === 'logged-sleep-duration')?.value, 7.5)
  assert.equal(metrik.find((e) => e.metric === 'wellness-sleep-duration')?.value, 7)
  assert.equal(metrik.find((e) => e.metric === 'water-intake')?.value, 1800)
  assert.equal(metrik.find((e) => e.metric === 'training-rpe')?.value, 6)
  assert.equal(metrik.find((e) => e.metric === 'nutrition.dietary-protein')?.value, 3)
  assert.equal(metrik.some((e) => e.metric === 'protein'), false, 'per-meal food events must not duplicate the daily total')
  assert.equal(metrik.some((e) => e.metric === 'sleep-duration' && e.provenance.method === 'user sleep log'), false)
  assert.equal(metrik.some((e) => e.id.includes('far')), false, 'a sleep date more than one day ahead is skipped')
  assert.ok(metrik.some((e) => e.domain === 'lab'), 'a skipped future sleep row must not drop the lab log')
}

console.log('longitudinal-snapshot: one build/three reads, revision invalidation, patient isolation and provenance passed')
