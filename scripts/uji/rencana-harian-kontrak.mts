import assert from 'node:assert/strict'
import { susunRencana, susunLaporan } from '../../server/src/carePlan.ts'
import { validateContinuousCarePlan, submitDailyAnamnesis, buildDailyInterview } from '../../src/lib/continuousCareOperatingSystem.ts'

// Kontrak server ↔ kernel: rencana/laporan yang disusun server HARUS diterima
// kernel klinis di peramban apa adanya. Kalau salah satu sisi berubah, ini gagal.
const kini = new Date('2026-09-25T06:00:00Z')
const masukan = {
  subjectId: 'PALSU-pasien-lain', clinicianId: 'PALSU-dokter-lain',
  diagnosisRefs: [{ system: 'icd-10', code: 'I10', display: 'Essential hypertension', verificationStatus: 'confirmed' }],
  questions: [
    { id: 'pusing', prompt: 'Did you feel dizzy today?', kind: 'boolean', required: true },
    { id: 'obat', prompt: 'Did you take your medicine as prescribed?', kind: 'choice', choices: ['Yes', 'Missed a dose', 'No'], required: true, domain: 'medication' },
    { id: 'catatan', prompt: 'Anything else?', kind: 'text' },
  ],
  patientReportedReviewRules: [{ label: 'Dizziness reported', questionId: 'pusing', operator: 'equals', value: true, priority: 'review-today', rationale: 'Clinician asked to be told about dizziness.' }],
}
const r = susunRencana(masukan, 'pasien-A', 'dokter-D', kini)
assert.equal(r.subjectId, 'pasien-A', 'subjectId diambil dari payload, bukan dari identitas server')
assert.equal(r.clinicianId, 'dokter-D', 'clinicianId diambil dari payload, bukan dari identitas server')
assert.equal(validateContinuousCarePlan(r as never), true)
assert.deepEqual(r.measurementReviewRules, [], 'aturan ambang pengukuran masuk tanpa jalur bukti/verifikator')
assert.equal(buildDailyInterview(r as never, '2026-09-25T00:00:00.000Z').questions.length, 3)

const lap = susunLaporan(r, { scheduledFor: '2026-09-25', answers: [{ questionId: 'pusing', value: true }, { questionId: 'obat', value: 'Missed a dose' }] }, kini)
const hasil = submitDailyAnamnesis(r as never, { ...lap })
assert.equal(hasil.workflowPriority, 'review-today', 'kernel tidak mengenali aturan yang terpicu dari laporan server')
assert.deepEqual(hasil.triggeredRuleIds, ['rule-1'])
assert.equal(hasil.completion, 'complete')

for (const buruk of [
  { questions: [] },
  { ...masukan, diagnosisRefs: [] },
  { ...masukan, questions: [{ id: 'x', prompt: 'p', kind: 'choice', choices: [] }] },
  { ...masukan, patientReportedReviewRules: [{ label: 'x', questionId: 'tidak-ada', operator: 'equals', value: true, rationale: 'r' }] },
  { ...masukan, questions: [{ id: 'a b', prompt: 'p', kind: 'boolean' }] },
]) assert.throws(() => susunRencana(buruk, 'p', 'd', kini), `rencana buruk diterima: ${JSON.stringify(buruk).slice(0, 80)}`)
for (const buruk of [
  { scheduledFor: '2026-09-30', answers: [] },
  { scheduledFor: '2026-09-25', answers: [{ questionId: 'pusing', value: 'ya' }] },
  { scheduledFor: '2026-09-25', answers: [{ questionId: 'obat', value: 'Kadang' }] },
  { scheduledFor: '2026-09-25', answers: [{ questionId: 'hilang', value: true }] },
  { scheduledFor: '2026-09-25', answers: [{ questionId: 'pusing', value: true }, { questionId: 'pusing', value: false }] },
]) assert.throws(() => susunLaporan(r, buruk, kini), `laporan buruk diterima: ${JSON.stringify(buruk).slice(0, 80)}`)
console.log('rencana-harian-kontrak: rencana/laporan server diterima kernel, identitas dari server, tanpa aturan ambang tak berbukti')

// Endpoint: dokter terverifikasi + izin berlaku; pasien hanya rencana dari izin yang masih berlaku.
{
  const { readFileSync } = await import('node:fs')
  const srv = readFileSync('server/src/index.ts', 'utf8')
  const potong = (awal: string) => srv.slice(srv.indexOf(awal), srv.indexOf(awal) + 1100)
  for (const rute of ["app.post('/api/clinician/lab-shares/:id/care-plan'", "app.get('/api/clinician/lab-shares/:id/care'"]) {
    const b = potong(rute)
    assert.ok(b.startsWith(rute + ', requireAuth'), `${rute} tanpa autentikasi`)
    assert.match(b, /\n  if \(u\.role !== 'dokter'\) \{ res\.status\(403\)/, `${rute} tanpa syarat dokter terverifikasi`)
    assert.match(b, /\n  if \(!izinBerlaku\(izin, u\.email, kini\)\) \{ res\.status\(404\)/, `${rute} tanpa izin pasien yang berlaku`)
  }
  assert.match(potong("app.post('/api/clinician/lab-shares/:id/care-plan'"), /susunRencana\(req\.body, pasien\.id, u\.id, kini\)/, 'identitas rencana diambil dari payload')
  assert.match(potong("app.get('/api/care/plans'"), /izinBerlaku\(listLabShares\(\)\.find\(\(i\) => i\.id === p\.izinId\)/, 'rencana tetap tampil setelah izin dicabut')
  assert.match(potong("app.post('/api/care/reports'"), /izinBerlaku\(/, 'laporan diterima setelah izin dicabut')
  const dokterUi = readFileSync('src/components/RencanaHarianDokter.tsx', 'utf8')
  assert.match(dokterUi, /submitDailyAnamnesis\(plan, r\)/, 'prioritas laporan dipercaya dari pasien, bukan dihitung ulang kernel')
  assert.match(readFileSync('src/components/CekHarian.tsx', 'utf8'), /Not an emergency service/, 'cek harian kehilangan batas "bukan layanan darurat"')
}
