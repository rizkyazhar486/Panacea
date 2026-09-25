import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { careToLongitudinalEvents } from '../../src/lib/careLongitudinalBridge.ts'
import { susunRencana, susunLaporan } from '../../server/src/carePlan.ts'
import { createLongitudinalPatientState, ingestLongitudinalEvent, canEnterAiContext } from '../../src/lib/panaceaLongitudinalState.ts'
import { timelineHarian } from '../../src/lib/perubahanLongitudinal.ts'

// Cek harian (lewat konverter resmi kernel) dan tinjauan dokter masuk ke status
// longitudinal kanonik yang sama dengan lab — satu timeline untuk satu orang.
const kini = new Date('2026-09-25T06:00:00Z')
const consent = { granted: true, purposes: ['personal-visualization'] as const, grantedAt: '1970-01-01T00:00:00.000Z' }
const plan = susunRencana({
  diagnosisRefs: [{ code: 'I10', display: 'Hypertension' }],
  questions: [{ id: 'pusing', prompt: 'Did you feel dizzy today?', kind: 'boolean', required: true }, { id: 'sbp', prompt: 'Morning systolic', kind: 'number', unit: 'mmHg' }],
}, 'server-user-7', 'dr-1', kini)
const lap = susunLaporan(plan, { scheduledFor: '2026-09-25', answers: [{ questionId: 'pusing', value: true }, { questionId: 'sbp', value: 148 }] }, kini)
const { events, labels, skipped } = careToLongitudinalEvents(
  [{ plan: plan as never, reports: [lap as never] }],
  [{ id: 'rv1', tes: 'gdp', dokterEmail: 'dr@x.test', ditinjau: '2026-09-25T05:00:00.000Z', catatan: 'Repeat fasting glucose.' }, { id: 'bad', tes: 'GDP!', dokterEmail: 'x', ditinjau: 'x' }],
  'p1', consent, kini.toISOString(),
)
assert.equal(skipped, 1, 'tinjauan cacat tidak dilewati')
assert.equal(events.length, 3)
let s = createLongitudinalPatientState('p1', kini.toISOString())
for (const e of events) s = ingestLongitudinalEvent(s, e).state // gagal bila subjek tidak dipetakan ke status lokal
const cek = events.filter((e) => e.provenance.method?.startsWith('daily-questionnaire:'))
assert.equal(cek.length, 2, 'cek harian tidak lewat konverter resmi kernel')
assert.ok(cek.every((e) => e.review.state === 'pending' && e.subjectId === 'p1'))
const rv = events.find((e) => e.metric === 'review.lab.gdp')!
assert.equal(rv.domain, 'clinical-note'); assert.equal(rv.review.state, 'accepted'); assert.equal(rv.review.reviewerId, 'dr@x.test', 'tinjauan tanpa identitas dokter penulisnya')
assert.ok(events.every((e) => !canEnterAiContext(e, kini.getTime())), 'data perawatan masuk konteks AI tanpa izin')
assert.equal(labels['daily.pusing'], 'Did you feel dizzy today?')

const tl = timelineHarian(s, 30, labels)
const teks = tl.flatMap((h) => h.butir.map((b) => `${b.label}|${b.value}|${b.asal}`))
assert.ok(teks.includes('Did you feel dizzy today?|Yes|daily check-in'), `jawaban cek harian tidak terbaca di timeline: ${teks.join(' ; ')}`)
assert.ok(teks.includes('Doctor review · Fasting glucose|Repeat fasting glucose.|by your doctor'), 'tinjauan dokter tidak terbaca di timeline')

assert.match(readFileSync('src/lib/useLongitudinalState.ts', 'utf8'), /careToLongitudinalEvents\(server\.plans, server\.reviews, subjectId, consent, kini\)/)
console.log('perawatan-status-longitudinal: cek harian + tinjauan dokter masuk status kanonik, terbaca di timeline dengan asalnya')
