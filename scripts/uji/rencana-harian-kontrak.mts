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
assert.deepEqual(r.measurementReviewRules, [], 'tanpa aturan lab di payload, rencana tidak boleh mengarang aturan ambang')
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
  // Satu blok rute saja: berhenti di rute berikutnya, supaya pola dari rute
// tetangga tidak ikut meluluskan pemeriksaan (sabotase pertama lolos karena ini).
  const potong = (awal: string) => { const a = srv.indexOf(awal); assert.ok(a >= 0, `rute hilang: ${awal}`); const z = srv.indexOf('\napp.', a + 1); return srv.slice(a, z < 0 ? undefined : z) }
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
  // Kegagalan muat() awal TIDAK BOLEH `if (!data) return null` menelan pesan
  // galat: dokter harus melihat error + jalan retry, bukan bagian kosong selamanya.
  const muatAwal = dokterUi.slice(dokterUi.indexOf('if (!data)'), dokterUi.indexOf('const plan = data.plan'))
  assert.match(muatAwal, /galat/, 'cabang !data tidak menampilkan galat saat muat() awal gagal')
  assert.match(muatAwal, /Retry|muat\(\)/, 'cabang !data tidak menawarkan jalan retry')
  // Form aturan lab HARUS divalidasi di peramban sebelum simpan() memanggil
  // server: tanpa ini setiap kesalahan pengetikan (ambang bukan angka, umur
  // hasil di luar 1–730 hari, rujukan bukti kosong) hanya diketahui dokter
  // setelah pulang-pergi ke server, dan hilang tanpa berbekas dari fokus form.
  const validasiFn = dokterUi.slice(dokterUi.indexOf('const validasi ='), dokterUi.indexOf('const simpan ='))
  assert.match(validasiFn, /threshold must be a number/, 'validasi tidak menolak ambang aturan lab yang bukan angka')
  assert.match(validasiFn, /result age must be 1.730 days/, 'validasi tidak menolak umur hasil di luar 1–730 hari')
  assert.match(validasiFn, /evidence reference is required/, 'validasi tidak menolak rujukan bukti kosong')
  const simpanFn = dokterUi.slice(dokterUi.indexOf('const simpan ='), dokterUi.indexOf('if (!data) {'))
  assert.match(simpanFn, /validasi\(\)/, 'simpan() tidak memeriksa validasi() di peramban sebelum memanggil server')
  // "Start daily check-in" HARUS dikunci selama simpan() berjalan, atau koneksi
  // lambat/flaky bisa membuat dokter menekannya dua kali dan mengirim dua
  // rencana (tidak ada idempotency key di jalur ini, tidak seperti laporan harian pasien).
  assert.match(simpanFn, /if \(mengirim\) return/, 'simpan() tidak menolak pemanggilan ganda selagi masih berjalan')
  const tombolSimpan = dokterUi.slice(dokterUi.indexOf('Start daily check-in') - 300, dokterUi.indexOf('Start daily check-in'))
  assert.match(tombolSimpan, /disabled=\{mengirim\}/, 'tombol "Start daily check-in" tidak dikunci selama pengiriman')

  const dafPasienUi = readFileSync('src/components/LabPasienUntukDokter.tsx', 'utf8')
  // Antara mount dan respons api.clinicianLabShares() pertama, daftar==null;
  // tanpa indikator ini bagian terlihat kosong dan dokter tidak tahu apakah
  // sedang memuat atau memang tidak ada pasien yang berbagi.
  assert.match(dafPasienUi, /daftar === null && !galat && <p[^>]*>Loading/, 'daftar berbagi lab dokter tidak punya indikator memuat sebelum respons pertama')
}
