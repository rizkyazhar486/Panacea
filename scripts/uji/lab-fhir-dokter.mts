import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildBodyClinicalFindings } from '../../src/lib/bodyClinicalFindings.ts'

// Alur unggulan: lab → FHIR Observation → dokter, dengan izin pasien dan audit.
const srv = readFileSync('server/src/index.ts', 'utf8')
for (const rute of ["app.get('/api/lab-log/fhir', requireAuth", "app.post('/api/lab-log/shares', requireAuth", "app.delete('/api/lab-log/shares/:id', requireAuth", "app.get('/api/clinician/lab-shares', requireAuth", "app.get('/api/clinician/lab-shares/:id/fhir', requireAuth"]) {
  assert.ok(srv.includes(rute), `rute hilang atau tanpa autentikasi: ${rute}`)
}
const bacaDokter = srv.slice(srv.indexOf("app.get('/api/clinician/lab-shares/:id/fhir'"), srv.indexOf("app.get('/api/clinician/lab-shares/:id/fhir'") + 900)
assert.match(bacaDokter, /\n  if \(u\.role !== 'dokter'\) \{ res\.status\(403\)/, 'pembacaan dokter tidak lagi mensyaratkan peran dokter terverifikasi')
assert.match(bacaDokter, /\n  if \(!izinBerlaku\(izin, u\.email, kini\)\) \{ res\.status\(404\)/, 'pembacaan dokter tidak lagi memeriksa izin pasien sebelum membaca')
assert.match(bacaDokter, /aksi: 'dibaca-dokter'/, 'pembacaan dokter tidak lagi dicatat di audit pasien')
assert.ok(bacaDokter.indexOf("aksi: 'dibaca-dokter'") < bacaDokter.indexOf('res.json('), 'data dikirim sebelum audit dicatat')
assert.match(srv, /Satu izin aktif per dokter/, 'berbagi ulang menumpuk izin ganda')

const ui = readFileSync('src/components/LabPasienUntukDokter.tsx', 'utf8')
assert.match(ui, /patient-transcribed from lab reports/, 'tampilan dokter tidak lagi menyatakan angka disalin pasien')
assert.match(ui, /not coded/, 'tampilan dokter menyembunyikan bahwa sebagian hasil tidak berkode')
assert.match(readFileSync('src/pages/ClinicalHub.tsx', 'utf8'), /account\?\.role === 'dokter' && <LabPasienUntukDokter \/>/)
assert.match(readFileSync('src/components/BagikanLabKeDokter.tsx', 'utf8'), /Revoke/, 'pasien tidak bisa mencabut izin')

// Kecerdasan longitudinal di tampilan dokter: mesin tren yang sama dengan sisi
// pasien, pergeseran berkelanjutan diurutkan paling atas, bukan tabel angka mati.
assert.match(ui, /analisisTrenSeri\(/, 'tampilan dokter tidak lagi menghitung tren garis dasar pribadi')
assert.match(ui, /\.sort\(\(x, y\) => \(x\.tren \? STATUS_KLINISI/, 'pergeseran berkelanjutan tidak lagi diurutkan di atas')
assert.match(ui, /a monitoring signal, not an interpretation/, 'batas "sinyal pemantauan, bukan interpretasi" hilang')

// Loop tinjauan klinisi: dokter terverifikasi + izin berlaku + audit; tampil ke
// pasien sebagai catatan klinisi, terpisah dari angka lab.
{
  const r = srv.slice(srv.indexOf("app.post('/api/clinician/lab-shares/:id/review'"), srv.indexOf("app.post('/api/clinician/lab-shares/:id/review'") + 900)
  assert.match(r, /\n  if \(u\.role !== 'dokter'\) \{ res\.status\(403\)/, 'tinjauan tanpa syarat peran dokter terverifikasi')
  assert.match(r, /\n  if \(!izinBerlaku\(izin, u\.email, kini\)\) \{ res\.status\(404\)/, 'tinjauan tanpa izin pasien yang berlaku')
  assert.match(r, /aksi: 'ditinjau-dokter'/, 'tinjauan tidak dicatat di audit pasien')
  assert.doesNotMatch(r, /putLabLog|validasiLogLab/, 'tinjauan dokter menulis ke angka lab pasien')
  assert.match(readFileSync('src/components/UbinLab.tsx', 'utf8'), /— clinician note/, 'catatan dokter tidak diberi label penulisnya di sisi pasien')
}

// Regresi: rekam medis server tanpa pemeriksaan per sistem merobohkan Clinical untuk dokter.
assert.doesNotThrow(() => buildBodyClinicalFindings(undefined))
assert.doesNotThrow(() => buildBodyClinicalFindings(null))
for (const f of ['src/components/ClinicalPatientContext.tsx', 'src/components/BodyExposurePatientOverlay.tsx']) {
  assert.match(readFileSync(f, 'utf8'), /record\.physicalExam\?\.perSystem/, `${f}: physicalExam tanpa pengaman lagi`)
}
console.log('lab-fhir-dokter: rute terautentikasi, dokter terverifikasi + izin + audit-sebelum-data, asal disalin-pasien terlihat, Clinical tidak roboh tanpa pemeriksaan')
