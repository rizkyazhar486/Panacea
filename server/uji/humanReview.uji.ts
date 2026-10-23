// T-HR-02 / HUMAN_VERIFICATION_OPTIONAL §3–§4: setiap aturan punya kasus positif dan pasangan negatif yang hanya berbeda satu hal.
import assert from 'node:assert/strict'
import { appendEntry, classifyAuthor, createReview, labelFor, withdrawReview } from '../src/modules/humanReview/domain/review.js'
import type { Author, HumanReviewEntry, ReviewInput } from '../src/modules/humanReview/domain/review.js'

const AT = '2026-10-23T10:00:00.000Z', SHA = 'a0f2f0cdad1ef6fd6ce8f72aff9a62d1abfcaf67'
const human: Author = { kind: 'human', userId: 'u1' }
const ai: Author = { kind: 'ai-service', marker: 'agent-header' }
const base: ReviewInput = { taskId: 'ENG-F2-01', version: SHA, decision: 'approve', scope: 'UI reads clearly on my phone',
  reviewer: { name: 'Rina', role: 'QA tester', attributed: true }, checklist: [{ item: 'Text is readable', checked: true }, { item: 'Buttons reachable', checked: false }], termsAccepted: true }
const ok = <T>(r: { ok: boolean }) => { assert.ok(r.ok, `expected ok, got ${JSON.stringify(r)}`); return (r as { value: T }).value }
const no = (r: { ok: boolean }, reason: string, msg?: string) => assert.deepEqual(r, { ok: false, reason }, msg ?? reason)
const mk = (over: Partial<ReviewInput> = {}, a: Author = human, hist: HumanReviewEntry[] = [], sup: string | null = null) => createReview({ ...base, ...over }, a, hist, AT, 'r1', sup)

// positif: catatan lengkap sesuai §4
const rec = ok<any>(mk())
assert.deepEqual(rec, { id: 'r1', type: 'review', taskId: 'ENG-F2-01', version: SHA, decision: 'approve', scope: 'UI reads clearly on my phone',
  reviewer: { name: 'Rina', role: 'QA tester', attributed: true }, checklist: [{ item: 'Text is readable', checked: true }, { item: 'Buttons reachable', checked: false }],
  termsAccepted: true, createdAt: AT, supersedes: null, authorUserId: 'u1' })

// §3.5 AI tidak boleh menulis atau menarik review (pasangan: hanya author berbeda)
no(mk({}, ai), 'ai-author-forbidden')
no(mk({}, { kind: 'ai-service', marker: 'mcp-token' }), 'ai-author-forbidden')
// §4 termsAccepted harus true persis
for (const v of [false, undefined, 'true', 1, null]) no(mk({ termsAccepted: v as never }), 'terms-not-accepted', `termsAccepted=${String(v)}`)
// task id dan versi terikat (§3.6)
for (const t of ['', 'eng-f2-01', 'ENG', 'ENG F2', '../x', 42]) no(mk({ taskId: t }), 'invalid-task', `taskId=${String(t)}`)
ok(mk({ taskId: 'T-HR-02' })); ok(mk({ taskId: 'EXT-D8-A' }))
for (const v of ['', 'main', 'HEAD', 'a0f2f0', 'G0f2f0cd', 'x'.repeat(41)]) no(mk({ version: v }), 'invalid-version', `version=${v}`)
ok(mk({ version: 'a0f2f0c' }))
// keputusan hanya empat
for (const d of DECISIONS_INVALID()) no(mk({ decision: d }), 'invalid-decision', `decision=${String(d)}`)
for (const d of ['approve', 'request_changes', 'defer', 'not_applicable']) ok(mk({ decision: d }))
function DECISIONS_INVALID() { return ['', 'approved', 'APPROVE', 'withdrawn', null, 1] }
// §3.3 cakupan wajib dan terbatas
no(mk({ scope: '   ' }), 'missing-scope'); no(mk({ scope: 'x'.repeat(501) }), 'missing-scope'); ok(mk({ scope: 'x'.repeat(500) }))
// §3.5 tidak ada centang tersirat: hanya boolean asli
for (const c of ['true', 1, null, undefined]) no(mk({ checklist: [{ item: 'a', checked: c as never }] }), 'invalid-checklist', `checked=${String(c)}`)
no(mk({ checklist: [{ item: ' ', checked: false }] }), 'invalid-checklist'); no(mk({ checklist: 'all' as never }), 'invalid-checklist')
no(mk({ checklist: Array.from({ length: 31 }, (_, i) => ({ item: `i${i}`, checked: false })) }), 'invalid-checklist')
ok(mk({ checklist: [] }))
// §3.2/§4 attributed perlu nama DAN peran; tanpa klaim attributed = anonim, nama tidak disimpan
no(mk({ reviewer: { name: 'Rina', role: '', attributed: true } }), 'attribution-incomplete')
no(mk({ reviewer: { name: '', role: 'QA', attributed: true } }), 'attribution-incomplete')
const anon = ok<any>(mk({ reviewer: { name: 'Rina', role: 'QA', attributed: false } }))
assert.deepEqual(anon.reviewer, { name: '', role: '', attributed: false }, 'anonymous feedback stores no name')
assert.equal(ok<any>(mk({ reviewer: { name: 'Rina', role: 'QA', attributed: 'true' as never } })).reviewer.attributed, false, 'string "true" is not attribution')
// §3.8 tanpa data pasien (di cakupan, nama, peran, butir)
for (const leak of ['NIK 3171234567890123 ok', 'call 081234567890', 'mail a@b.co', 'tanggal lahir 1 Jan', 'MRN 5521', 'No RM 12'])
  no(mk({ scope: `screen fine ${leak}` }), 'possible-patient-data', leak)
no(mk({ checklist: [{ item: 'patient 3171234567890123', checked: false }] }), 'possible-patient-data')
no(mk({ reviewer: { name: 'x@y.com', role: 'QA', attributed: true } }), 'possible-patient-data')
ok(mk({ scope: 'Checked 16 screens at 390x844' }))
// §3.4/§3.7 tidak ada klaim otoritas dari review sukarela
for (const claim of ['clinically validated', 'approved for use', 'GDPR compliant', 'certified safe', 'legally approved', 'consent given']) no(mk({ scope: `App is ${claim}` }), 'authority-claim', claim)
ok(mk({ scope: 'The calculator page loads and the labels are clear' }))
// jam tidak sah
no(createReview(base, human, [], 'kemarin', 'r1'), 'invalid-clock')

// §3.6 append-only + supersedes
let log: readonly HumanReviewEntry[] = []
log = appendEntry(log, rec)
assert.throws(() => appendEntry(log, rec), /duplicate review id/, 'ids are unique; nothing is overwritten')
assert.ok(Object.isFrozen(log) && Object.isFrozen(log[0]), 'entries cannot be mutated in place')
assert.throws(() => { (log[0] as any).decision = 'defer' }, TypeError)
no(createReview(base, human, [...log], AT, 'r2', 'nope'), 'unknown-supersedes')
no(createReview({ ...base, taskId: 'ENG-F2-02' }, human, [...log], AT, 'r2', 'r1'), 'supersedes-other-task')
const r2 = ok<any>(createReview({ ...base, decision: 'request_changes', scope: 'Second look' }, human, [...log], '2026-10-24T10:00:00Z', 'r2', 'r1'))
log = appendEntry(log, r2)
assert.equal(log.length, 2, 'superseding appends; the first record stays in history')
assert.equal(log[0].type === 'review' && log[0].decision, 'approve')

// §3.6/§3.7 label: versi saat ini -> reviewed; versi lain -> stale (tidak dihapus); teks tanpa klaim otoritas
const l = labelFor(log, 'ENG-F2-01', SHA)
assert.equal(l.status, 'reviewed'); assert.equal((l as any).reviewId, 'r2', 'superseded record no longer drives the label')
assert.match((l as any).text, /^Reviewed by Rina \(QA tester\) on 2026-10-24: request changes\. Scope: Second look\./)
assert.match((l as any).text, /not a clinical, legal or licence approval/)
assert.doesNotMatch((l as any).text, /clinically validated|approved for use|compliant/i)
assert.equal(labelFor(log, 'ENG-F2-01', 'b'.repeat(40)).status, 'stale')
assert.deepEqual(labelFor(log, 'ENG-X-99', SHA), { status: 'none' })
// §3.2 anonim tidak pernah menaikkan label
const onlyAnon = appendEntry([], { ...anon, id: 'a1' })
assert.deepEqual(labelFor(onlyAnon, 'ENG-F2-01', SHA), { status: 'anonymous-feedback-only', count: 1 })

// §3.9 penarikan: catatan baru oleh penulis yang sama; riwayat tetap
no(withdrawReview('r2', ai, [...log], AT, 'w1'), 'ai-author-forbidden')
no(withdrawReview('r2', { kind: 'human', userId: 'u2' }, [...log], AT, 'w1'), 'not-author')
no(withdrawReview('r2', { kind: 'human' }, [...log], AT, 'w1'), 'not-author')
no(withdrawReview('zz', human, [...log], AT, 'w1'), 'unknown-supersedes')
const visitor = ok<any>(createReview(base, { kind: 'human' }, [], AT, 'v1'))
assert.equal(visitor.authorUserId, null, 'no session: no author id stored')
no(withdrawReview('v1', human, [visitor], AT, 'w1'), 'not-withdrawable', 'a review without a session cannot be withdrawn via API (ownership unprovable)')
ok(withdrawReview('a1', human, [...onlyAnon], AT, 'w1'))  // pasangan: umpan balik anonim dari pengguna terautentikasi boleh ditarik penulisnya
const w = ok<any>(withdrawReview('r2', human, [...log], AT, 'w1'))
log = appendEntry(log, w)
no(withdrawReview('r2', human, [...log], AT, 'w2'), 'already-withdrawn')
assert.equal(log.length, 3, 'withdrawal appended, nothing removed')
assert.equal((labelFor(log, 'ENG-F2-01', SHA) as any).reviewId, 'r1', 'after withdrawing r2 the earlier still-live review r1 drives the label again')

// klasifikasi penulis: gagal tertutup untuk setiap penanda agen; peramban biasa = manusia
const BROWSER = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
assert.deepEqual(classifyAuthor({ userAgent: BROWSER, userId: 'u1' }), { kind: 'human', userId: 'u1' })
assert.deepEqual(classifyAuthor({ userAgent: BROWSER }), { kind: 'human' }, 'identity optional: anonymous human allowed')
assert.deepEqual(classifyAuthor({ userAgent: BROWSER, usedMcpToken: true }), { kind: 'ai-service', marker: 'mcp-token' })
assert.deepEqual(classifyAuthor({ userAgent: BROWSER, agentHeader: 'codex' }), { kind: 'ai-service', marker: 'agent-header' })
assert.deepEqual(classifyAuthor({}), { kind: 'ai-service', marker: 'no-user-agent' })
for (const ua of ['Claude-User/1.0', 'ClaudeBot', 'OpenAI ChatGPT-User', 'GPTBot/1.1', 'python-requests/2.32', 'curl/8.7.1', 'node-fetch/3', 'undici', 'node', 'Deno/2.1', 'Bun/1.2', 'HeadlessChrome/131', 'Mozilla/5.0 (compatible; Googlebot/2.1)'])
  assert.equal(classifyAuthor({ userAgent: ua, userId: 'u1' }).kind, 'ai-service', `user-agent ${ua}`)
// pasangan: peramban manusia dengan merek yang mengandung 'bot' di dalam kata tetap manusia
assert.equal(classifyAuthor({ userAgent: 'Mozilla/5.0 (Linux; Android 13; CUBOT_X30) AppleWebKit/537.36 Chrome/131 Mobile Safari/537.36' }).kind, 'human')
// rantai ujung-ke-ujung: permintaan beridentitas agen tidak pernah menghasilkan catatan
no(createReview(base, classifyAuthor({ userAgent: 'Claude-User/1.0', userId: 'u1' }), [], AT, 'r9'), 'ai-author-forbidden')

console.log('humanReview: §3–§4 rules each with paired negatives; append-only log, supersede, withdrawal, stale label; AI identities rejected')
