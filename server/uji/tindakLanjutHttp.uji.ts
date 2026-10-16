// A7: tindak lanjut dibuat dari rencana bertanda tangan dan muncul di daftar kerja klinisi PEMILIK yang benar.
// Aplikasi nyata via HTTP, berkas data terisolasi, identitas sintetis; verifikasi dokter = fixture alur kerja, bukan persetujuan klinis.
import assert from 'node:assert/strict'
import { startIsolatedServer } from './support/isolatedServer.ts'

const owner = 'fu-owner@localhost.test'
const r = await startIsolatedServer('followup', owner)
try {
  const login = async (email: string, role: string) => { const x = await r.call('POST', '/api/auth/dev-login', undefined, { email, role, name: email }); assert.equal(x.status, 200); return x.body as { token: string; user: { id: string; email: string } } }
  const own = await login(owner, 'pasien')
  const d1 = await login('fu-doc1@localhost.test', 'dokter')
  const d2 = await login('fu-doc2@localhost.test', 'dokter')
  const pat = await login('fu-pat@localhost.test', 'pasien')
  for (const d of [d1, d2]) assert.equal((await r.call('POST', `/api/doctors/${d.user.id}/verify`, own.token, { status: 'verified' })).status, 200)
  const share = (await r.call('POST', '/api/lab-log/shares', pat.token, { dokterEmail: d1.user.email, hari: 7 })).body
  const plan = await r.call('POST', `/api/clinician/lab-shares/${share.id}/care-plan`, d1.token, {
    signIntent: true, diagnosisRefs: [{ system: 'local', code: 'SYN-1', display: 'Synthetic fixture condition', verificationStatus: 'provisional' }],
    questions: [{ id: 'sym', kind: 'boolean', prompt: 'Synthetic symptom today?' }] })
  assert.equal(plan.status, 200)
  const planId = plan.body.id as string
  const url = `/api/clinician/care-plans/${planId}/follow-ups`
  const due = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)
  const body = { dueDate: due(14), reason: 'Review synthetic check-ins', clientId: 'fu-client-1' }

  // positif: pemilik membuat tindak lanjut dan melihatnya di daftar kerja
  const made = await r.call('POST', url, d1.token, body)
  assert.equal(made.status, 200); assert.equal(made.body.planId, planId); assert.equal(made.body.subjectId, pat.user.id); assert.equal(made.body.ownerClinicianId, d1.user.id)
  const list = await r.call('GET', '/api/clinician/follow-ups', d1.token)
  assert.deepEqual(list.body.followUps.map((f: { id: string }) => f.id), [made.body.id])
  // idempoten: clientId sama → entri yang sama, tidak dobel
  const again = await r.call('POST', url, d1.token, body)
  assert.equal(again.status, 200); assert.equal(again.body.id, made.body.id)
  assert.equal((await r.call('GET', '/api/clinician/follow-ups', d1.token)).body.followUps.length, 1)
  // urutan daftar: tanggal jatuh tempo terdekat dulu
  const sooner = await r.call('POST', url, d1.token, { dueDate: due(3), reason: 'Sooner review' })
  assert.deepEqual((await r.call('GET', '/api/clinician/follow-ups', d1.token)).body.followUps.map((f: { id: string }) => f.id), [sooner.body.id, made.body.id])

  // negatif berpasangan: klinisi lain tidak bisa membuat maupun melihat; planId asing = 404 tanpa efek samping
  assert.equal((await r.call('POST', url, d2.token, { ...body, clientId: 'fu-client-2' })).status, 404, 'klinisi lain ditolak')
  assert.equal((await r.call('POST', '/api/clinician/care-plans/tidak-ada/follow-ups', d1.token, body)).status, 404)
  assert.deepEqual((await r.call('GET', '/api/clinician/follow-ups', d2.token)).body.followUps, [], 'klinisi lain tidak melihat tindak lanjut orang lain')
  // negatif: pasien, tanpa identitas
  assert.equal((await r.call('POST', url, pat.token, body)).status, 403)
  assert.equal((await r.call('GET', '/api/clinician/follow-ups', pat.token)).status, 403)
  assert.equal((await r.call('POST', url, undefined, body)).status, 401)
  assert.equal((await r.call('GET', '/api/clinician/follow-ups', undefined)).status, 401)
  // negatif: masukan buruk → 400, tidak ada yang tertulis
  for (const bad of [{ ...body, dueDate: '2020-01-01', clientId: undefined }, { ...body, dueDate: 'besok', clientId: undefined }, { ...body, reason: '', clientId: undefined }]) assert.equal((await r.call('POST', url, d1.token, bad)).status, 400)
  assert.equal((await r.call('GET', '/api/clinician/follow-ups', d1.token)).body.followUps.length, 2)

  // bertahan setelah restart proses
  const before = (await r.call('GET', '/api/clinician/follow-ups', d1.token)).body
  await r.restart()
  assert.deepEqual((await r.call('GET', '/api/clinician/follow-ups', d1.token)).body, before, 'tindak lanjut bertahan setelah restart')

  // pencabutan izin pasien → hilang dari daftar kerja dan tidak bisa dibuat lagi
  assert.equal((await r.call('DELETE', `/api/lab-log/shares/${share.id}`, pat.token)).status, 200)
  assert.deepEqual((await r.call('GET', '/api/clinician/follow-ups', d1.token)).body.followUps, [])
  assert.equal((await r.call('POST', url, d1.token, { ...body, clientId: 'fu-client-3' })).status, 404)
  console.log('tindakLanjutHttp OK')
} finally { await r.stop() }
