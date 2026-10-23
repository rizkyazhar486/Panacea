// Clinical validation study ledger over real HTTP: who may assess, blind review, one assessment per reviewer per case,
// adjudication rules, SUS once, owner-only export, and an append-only chain that re-verifies after every write.
// Synthetic reviewers; the seeded frozen study is the repository's own. Not clinical validation of anything.
import assert from 'node:assert/strict'
import { startIsolatedServer } from './support/isolatedServer.ts'
import { AWAL_RANTAI, sidik } from '../src/domains/clinical-records/validasiLedger.ts'

const ownerEmail = 'validation-owner@localhost.test'
const running = await startIsolatedServer('validation-ledger', ownerEmail)
try {
  const { call } = running
  const login = async (email: string, role: string) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string } }
  }
  const owner = await login(ownerEmail, 'pasien')
  const docA = await login('validation-doc-a@localhost.test', 'dokter')
  const docB = await login('validation-doc-b@localhost.test', 'dokter')
  const docC = await login('validation-doc-c@localhost.test', 'dokter')
  const patient = await login('validation-patient@localhost.test', 'pasien')
  // A doctor account only acts as a clinician once the owner has verified it (workflow fixture, not clinical approval).
  const unverified = await login('validation-unverified@localhost.test', 'dokter')
  for (const d of [docA, docB, docC]) assert.equal((await call('POST', `/api/doctors/${d.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)
  const STUDY = 'lab-tren-pribadi'

  const ledger = async () => (await call('GET', '/api/validation/ledger', owner.token)).body.ledger as any[]
  const chainOk = (l: any[]) => l.every((c, i) => c.urutan === i && c.sidikSebelum === (i ? l[i - 1].sidik : AWAL_RANTAI) && c.sidik === sidik({ urutan: c.urutan, isi: c.isi, sidikSebelum: c.sidikSebelum }))
  const cases = async (t: string) => (await call('GET', `/api/validation/${STUDY}/cases`, t)).body.cases as any[]

  // 1. The seeded frozen study: one protocol + 30 cases, chain intact, export is the study lead only.
  const start = await ledger()
  assert.equal(start.length, 31); assert.equal(start.filter(c => c.isi.jenis === 'protokol').length, 1); assert.equal(start.filter(c => c.isi.jenis === 'kasus').length, 30)
  assert.ok(chainOk(start), 'seeded chain verifies')
  for (const [who, t] of [['doctor', docA.token], ['patient', patient.token]] as const) {
    const r = await call('GET', '/api/validation/ledger', t); assert.equal(r.status, 403, `${who} cannot export`); assert.equal(r.body.error, 'study lead only')
  }
  assert.equal((await call('GET', '/api/validation/ledger')).status, 401)

  // 2. Role gates: only a doctor account assesses; the owner and patients are refused (paired with the doctor succeeding below).
  const routes: [string, string, unknown][] = [
    ['GET', `/api/validation/${STUDY}/cases`, undefined], ['POST', `/api/validation/${STUDY}/assessments`, {}], ['GET', `/api/validation/${STUDY}/disagreements`, undefined],
    ['POST', '/api/validation/adjudications', {}], ['POST', `/api/validation/${STUDY}/usability`, {}],
  ]
  for (const [m, p, b] of routes) {
    assert.equal((await call(m, p, undefined, b)).status, 401, `anonymous ${m} ${p}`)
    for (const [who, t] of [['patient', patient.token], ['owner', owner.token]] as const) {
      const r = await call(m, p, t, b); assert.equal(r.status, 403, `${who} ${m} ${p}`); assert.equal(r.body.error, 'verified clinician role required')
    }
  }
  assert.equal((await call('POST', '/api/validation/safety-events', patient.token, { deskripsi: 'x' })).status, 403)
  for (const [m, p, b] of routes) assert.equal((await call(m, p, unverified.token, b)).status, 403, `unverified doctor ${m} ${p}`)
  assert.equal((await ledger()).length, 31, 'refusals wrote nothing')
  assert.equal((await call('GET', '/api/validation/studies', patient.token)).status, 403)
  const studiesRes = await call('GET', '/api/validation/studies', docA.token); assert.equal(studiesRes.status, 200, JSON.stringify(studiesRes.body)); assert.equal(studiesRes.body.studies[0].jumlahKasus, 30)
  assert.equal((await call('GET', `/api/validation/nope/cases`, docA.token)).status, 404)

  const list = await cases(docA.token); assert.equal(list.length, 30)
  const [c1, c2] = [list[0].id, list[1].id]
  const good = (kasusId: string, benar: boolean, extra: Record<string, unknown> = {}) => ({ kasusId, benar, bahaya: 'none', klaimTakDidukung: 0, waktuTinjauMs: 60000, galat: benar ? [] : ['wrong-value'], ...extra })
  const assess = (t: string, body: Record<string, unknown>) => call('POST', `/api/validation/${STUDY}/assessments`, t, body)

  // 3. Every invalid assessment is a 400 with a reason and writes nothing.
  const bad: [string, Record<string, unknown>, RegExp][] = [
    ['no verdict', { ...good(c1, true), benar: undefined }, /state whether/], ['unknown case', good('no-such-case', true), /unknown case/],
    ['harm level missing', { ...good(c1, true), bahaya: 'catastrophic' }, /harm level/], ['claim count 101', { ...good(c1, true), klaimTakDidukung: 101 }, /0-100/],
    ['claim count fractional', { ...good(c1, true), klaimTakDidukung: 1.5 }, /whole number/], ['negative review time', { ...good(c1, true), waktuTinjauMs: -1 }, /review time/],
    ['review time over 6h', { ...good(c1, true), waktuTinjauMs: 6 * 3600e3 + 1 }, /review time/], ['override without reason', { ...good(c1, true), override: { dilakukan: true, alasan: '  ' } }, /override needs a reason/],
    ['unknown error class', { ...good(c1, false), galat: ['vibes'] }, /unknown error class/], ['correct but error class', { ...good(c1, true), galat: ['wrong-value'] }, /cannot carry/],
    ['incorrect without class', { ...good(c1, false), galat: [] }, /classify the error/],
  ]
  for (const [label, body, why] of bad) {
    const r = await assess(docA.token, body); assert.equal(r.status, 400, label); assert.match(r.body.error, why, label)
    assert.equal((await ledger()).length, 31, `${label}: ledger unchanged`)
  }
  assert.equal((await call('POST', `/api/validation/nope/assessments`, docA.token, good(c1, true))).status, 400)

  // 4. Valid assessment: reviewer identity comes from the session, never the payload; the boundary values are accepted.
  const first = await assess(docA.token, { ...good(c1, true, { waktuTinjauMs: 6 * 3600e3, klaimTakDidukung: 100 }), penilai: { id: 'forged', kredensialTerverifikasi: false }, konflikKepentingan: 'none' })
  assert.equal(first.status, 200); assert.equal(first.body.urutan, 31)
  let l = await ledger(); assert.equal(l.length, 32); assert.ok(chainOk(l))
  const stored = l[31].isi.data
  assert.equal(stored.penilai.id, docA.user.id, 'forged reviewer id ignored'); assert.equal(stored.penilai.kredensialTerverifikasi, true); assert.equal(stored.buta, true)
  const dup = await assess(docA.token, good(c1, false)); assert.equal(dup.status, 400); assert.match(dup.body.error, /already assessed/)
  assert.equal((await ledger()).length, 32, 'duplicate wrote nothing')

  // 5. Blind review: a second reviewer sees the case but nothing of the first reviewer's assessment.
  const asB = await call('GET', `/api/validation/${STUDY}/cases`, docB.token)
  assert.ok(!JSON.stringify(asB.body).includes(docA.user.id), "B's case list never contains A's identity")
  assert.equal(asB.body.cases.find((c: any) => c.id === c1).sudahSaya, false); assert.equal((await cases(docA.token)).find(c => c.id === c1).sudahSaya, true)
  for (const k of ['benar', 'bahaya', 'omisi', 'penilai']) assert.ok(!(k in asB.body.cases[0]), `case view has no ${k}`)

  // 6. Disagreement + adjudication.
  assert.equal((await assess(docB.token, good(c1, false))).status, 200, 'B disagrees with A on c1')
  assert.equal((await assess(docA.token, good(c2, true))).status, 200)
  const queue = (t: string) => call('GET', `/api/validation/${STUDY}/disagreements`, t)
  const forC = (await queue(docC.token)).body.cases
  assert.equal(forC.length, 1); assert.equal(forC[0].kasus.id, c1); assert.equal(forC[0].penilaian.length, 2)
  assert.ok(!JSON.stringify(forC).includes(docA.user.id) && !JSON.stringify(forC).includes(docB.user.id), 'adjudicator sees verdicts, not reviewer identities')
  assert.deepEqual((await queue(docA.token)).body.cases, [], 'a reviewer of the case never gets it in the adjudication queue')
  assert.deepEqual((await queue(docB.token)).body.cases, [])
  const adj = (t: string, body: Record<string, unknown>) => call('POST', '/api/validation/adjudications', t, body)
  const refusedAdj: [string, string, Record<string, unknown>, RegExp][] = [
    ['reviewer adjudicates own case', docA.token, { kasusId: c1, keputusanBenar: true, alasan: 'x' }, /must not be one of the case reviewers/],
    ['no disagreement', docC.token, { kasusId: c2, keputusanBenar: true, alasan: 'x' }, /no disagreement/],
    ['unknown case', docC.token, { kasusId: 'zzz', keputusanBenar: true, alasan: 'x' }, /unknown case/],
    ['no decision', docC.token, { kasusId: c1, alasan: 'x' }, /state the adjudicated decision/],
    ['no reason', docC.token, { kasusId: c1, keputusanBenar: true, alasan: ' ' }, /needs a reason/],
  ]
  const sizeBeforeAdj = (await ledger()).length
  assert.equal(sizeBeforeAdj, 34, '31 seeded + A(c1) + B(c1) + A(c2)')
  for (const [label, t, body, why] of refusedAdj) {
    const r = await adj(t, body); assert.equal(r.status, 400, label); assert.match(r.body.error, why, label)
    assert.equal((await ledger()).length, sizeBeforeAdj, `${label}: nothing written`)
  }
  const ok = await adj(docC.token, { kasusId: c1, keputusanBenar: false, alasan: 'Synthetic adjudication reason' })
  assert.equal(ok.status, 200)
  assert.equal((await adj(docC.token, { kasusId: c1, keputusanBenar: true, alasan: 'again' })).status, 400, 'a case is adjudicated once')
  assert.deepEqual((await queue(docC.token)).body.cases, [], 'adjudicated case leaves the queue')

  // 7. Safety events: reporter is the session; the owner may report; empty description refused.
  assert.equal((await call('POST', '/api/validation/safety-events', docA.token, { deskripsi: '   ' })).status, 400)
  assert.equal((await call('POST', '/api/validation/safety-events', docA.token, { deskripsi: 'Synthetic near miss', jenis: 'harm', tingkat: 'severe', pelapor: 'forged' })).status, 200)
  assert.equal((await call('POST', '/api/validation/safety-events', owner.token, { deskripsi: 'Synthetic owner report', tingkat: 'nonsense' })).status, 200)
  l = await ledger(); const safety = l.filter(c => c.isi.jenis === 'keselamatan').map(c => c.isi.data)
  assert.equal(safety.length, 2); assert.equal(safety[0].pelapor, docA.user.id); assert.equal(safety[0].jenis, 'harm'); assert.equal(safety[0].tingkat, 'severe')
  assert.equal(safety[1].pelapor, owner.user.id); assert.equal(safety[1].tingkat, 'minor', 'unknown severity falls back to minor, not a made-up level'); assert.equal(safety[1].jenis, 'near-miss')

  // 8. SUS: ten answers 1-5, once per reviewer per study.
  const sus = (t: string, jawaban: unknown) => call('POST', `/api/validation/${STUDY}/usability`, t, { jawaban })
  const before = (await ledger()).length
  for (const [label, j] of [['nine answers', Array(9).fill(3)], ['eleven answers', Array(11).fill(3)], ['zero', [...Array(9).fill(3), 0]], ['six', [...Array(9).fill(3), 6]], ['fractional', [...Array(9).fill(3), 3.5]], ['not an array', 'x']] as const) {
    assert.equal((await sus(docA.token, j)).status, 400, label)
  }
  assert.equal((await ledger()).length, before, 'bad SUS wrote nothing')
  assert.equal((await sus(docA.token, [1, 2, 3, 4, 5, 1, 2, 3, 4, 5])).status, 200)
  const again = await sus(docA.token, Array(10).fill(3)); assert.equal(again.status, 400); assert.match(again.body.error, /one usability response/)
  assert.equal((await sus(docB.token, Array(10).fill(5))).status, 200, 'another reviewer may respond')

  // 9. After all writes the chain still verifies end to end and only grew by appends.
  const end = await ledger(); assert.ok(chainOk(end), 'final chain verifies')
  assert.deepEqual(end.slice(0, 31), start, 'the frozen protocol and cases are untouched')

  console.log('validationLedgerHttp: seeded frozen study, role gates (owner/patient/anonymous refused), 11 assessment refusals write nothing, reviewer identity from session, blind review, adjudication rules, safety events, SUS once, owner-only export, chain verifies and is append-only; passed')
} finally {
  await running.stop()
}
