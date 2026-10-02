import assert from 'node:assert/strict'
import { susunRencana, susunLaporan } from '../src/carePlan.js'
const kini = new Date('2026-09-25T08:00:00Z')
const r = susunRencana({ diagnosisRefs: [{ code: 'I10', display: 'Hypertension' }], questions: [{ id: 'a', prompt: 'Dizzy?', kind: 'boolean' }] }, 'p@x', 'd@x', kini)
const l = susunLaporan(r, { scheduledFor: '2026-09-25', answers: [], clientId: 'cabcdef1234', authoredAt: '2026-09-24T20:00:00Z' }, kini)
assert.equal(l.clientId, 'cabcdef1234'); assert.equal(l.authoredAt, '2026-09-24T20:00:00.000Z', 'waktu tulis offline dipertahankan')
assert.equal(susunLaporan(r, { scheduledFor: '2026-09-25', answers: [], authoredAt: '2030-01-01T00:00:00Z' }, kini).authoredAt, kini.toISOString(), 'authoredAt masa depan harus ditolak')
assert.equal(susunLaporan(r, { scheduledFor: '2026-09-25', answers: [], authoredAt: '2026-01-01T00:00:00Z' }, kini).authoredAt, kini.toISOString(), 'authoredAt > 7 hari harus ditolak')
assert.throws(() => susunLaporan(r, { scheduledFor: '2026-09-25', answers: [], clientId: 'x y' }, kini), /client id/)
console.log('carePlanIdem: clientId tervalidasi, authoredAt offline dibatasi 7 hari')
