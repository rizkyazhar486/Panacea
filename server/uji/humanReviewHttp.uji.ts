// T-HR-02 lewat HTTP nyata: identitas opsional, append-only (tanpa PUT/PATCH/DELETE), AI ditolak per penanda, penarikan oleh penulis,
// id penulis tidak bocor, label usang saat versi berubah, batas laju. Server terisolasi; data sintetis.
import assert from 'node:assert/strict'
import { startIsolatedServer } from './support/isolatedServer.ts'

const BROWSER = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
const SHA = 'a0f2f0cdad1ef6fd6ce8f72aff9a62d1abfcaf67'
const running = await startIsolatedServer('human-review', 'hr-owner@localhost.test')
try {
  const req = async (method: string, path: string, opts: { token?: string; body?: unknown; ua?: string | null; headers?: Record<string, string> } = {}) => {
    const headers: Record<string, string> = { 'content-type': 'application/json', ...(opts.ua === null ? {} : { 'user-agent': opts.ua ?? BROWSER }), ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}), ...opts.headers }
    const r = await fetch(running.origin + path, { method, headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) })
    return { status: r.status, body: await r.json().catch(() => null) }
  }
  const login = async (email: string) => (await running.call('POST', '/api/auth/dev-login', undefined, { email, role: 'pasien', name: email })).body as { token: string; user: { id: string } }
  const rina = await login('hr-rina@localhost.test'), other = await login('hr-other@localhost.test')
  const review = { taskId: 'ENG-F2-01', version: SHA, decision: 'approve', scope: 'Home reads clearly on my phone', reviewer: { name: 'Rina', role: 'QA tester', attributed: true }, checklist: [{ item: 'Text readable', checked: true }], termsAccepted: true }
  const log = async (version = SHA) => (await req('GET', `/api/human-reviews/ENG-F2-01?version=${version}`)).body

  // kosong di awal
  assert.deepEqual((await log()).label, { status: 'none' })
  // AI ditolak pada setiap penanda; tidak ada yang tersimpan (pasangan: hanya penanda yang berbeda dari kasus sukses di bawah)
  for (const [why, o] of [['agent header', { headers: { 'x-panacea-agent': 'codex' } }], ['ai header', { headers: { 'x-ai-agent': 'claude' } }], ['AI user-agent', { ua: 'Claude-User/1.0' }], ['curl', { ua: 'curl/8.7.1' }], ['Node fetch default user-agent', { ua: null }]] as const) {
    const r = await req('POST', '/api/human-reviews', { token: rina.token, body: review, ...o }); assert.equal(r.status, 403, why); assert.equal(r.body.error, 'ai-author-forbidden', why)
  }
  assert.equal((await log()).entries.length, 0, 'refused AI writes stored nothing')
  // validasi diteruskan dari domain
  assert.equal((await req('POST', '/api/human-reviews', { token: rina.token, body: { ...review, termsAccepted: false } })).body.error, 'terms-not-accepted')
  assert.equal((await req('POST', '/api/human-reviews', { token: rina.token, body: { ...review, scope: 'GDPR compliant now' } })).body.error, 'authority-claim')
  assert.equal((await req('POST', '/api/human-reviews', { token: rina.token, body: { ...review, scope: 'patient NIK 3171234567890123' } })).body.error, 'possible-patient-data')

  // sukses: manusia terautentikasi; id penulis tidak pernah dikirim
  const c = await req('POST', '/api/human-reviews', { token: rina.token, body: review })
  assert.equal(c.status, 201, JSON.stringify(c.body)); assert.equal(c.body.review.authorUserId, undefined, 'author id is not exposed')
  const id = c.body.review.id as string
  // identitas opsional: pengunjung tanpa sesi boleh mengirim (anonim)
  const anon = await req('POST', '/api/human-reviews', { body: { ...review, reviewer: { attributed: false } } })
  assert.equal(anon.status, 201); assert.deepEqual(anon.body.review.reviewer, { name: '', role: '', attributed: false })
  let l = await log()
  assert.equal(l.entries.length, 2); assert.ok(l.entries.every((e: any) => !('authorUserId' in e)))
  assert.equal(l.label.status, 'reviewed'); assert.match(l.label.text, /Reviewed by Rina \(QA tester\)/); assert.match(l.label.text, /not a clinical, legal or licence approval/)
  assert.equal((await log('b'.repeat(40))).label.status, 'stale', 'other version -> stale, record kept')

  // append-only: tidak ada rute ubah/hapus
  for (const m of ['PUT', 'PATCH', 'DELETE']) assert.equal((await req(m, `/api/human-reviews/${id}`, { token: rina.token, body: review })).status, 404, `${m} must not exist`)
  assert.equal((await req('DELETE', '/api/human-reviews/ENG-F2-01', { token: rina.token })).status, 404)

  // penarikan: wajib sesi, hanya penulis, sekali; riwayat tetap
  assert.equal((await req('POST', `/api/human-reviews/${id}/withdraw`)).status, 401, 'no session cannot withdraw')
  assert.equal((await req('POST', `/api/human-reviews/${id}/withdraw`, { token: other.token })).status, 403, 'another user cannot withdraw')
  assert.equal((await req('POST', `/api/human-reviews/${id}/withdraw`, { token: rina.token, headers: { 'x-panacea-agent': 'x' } })).status, 403, 'agent cannot withdraw')
  assert.equal((await req('POST', `/api/human-reviews/${anon.body.review.id}/withdraw`, { token: rina.token })).body.error, 'not-withdrawable', 'sessionless review is not withdrawable')
  assert.equal((await req('POST', `/api/human-reviews/${id}/withdraw`, { token: rina.token })).status, 201)
  assert.equal((await req('POST', `/api/human-reviews/${id}/withdraw`, { token: rina.token })).status, 409)
  l = await log()
  assert.equal(l.entries.length, 3, 'withdrawal appended, original kept'); assert.equal(l.label.status, 'anonymous-feedback-only')

  // bertahan setelah restart (tersimpan di berkas, bukan hanya memori)
  await running.restart()
  assert.equal((await log()).entries.length, 3, 'append-only log persisted across restart')
  assert.equal((await req('GET', '/api/human-reviews/bad%20id')).status, 400)

  // batas laju tulis (20 per 15 menit per klien): permintaan berikutnya ditolak 429
  let limited = 0
  for (let i = 0; i < 25; i++) if ((await req('POST', '/api/human-reviews', { body: { ...review, termsAccepted: false } })).status === 429) limited++
  assert.ok(limited > 0, 'write rate limit applies')
  console.log('humanReviewHttp: AI markers refused with nothing stored; optional identity; no edit/delete routes; author-only withdrawal; author id hidden; stale label; persisted; rate-limited')
} finally { await running.stop() }
