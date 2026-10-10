// Hasil lab + rujukan (Alpha B2–B6, B9). Tanpa jaringan, tanpa jam/acak nyata.
import assert from 'node:assert/strict'
import { GENESIS_HASH, transition, verifyTrail } from '../src/modules/labResults/domain/lifecycle.js'
import type { Actor } from '../src/modules/labResults/domain/lifecycle.js'
import { referralLifecycle, resultLifecycle } from '../src/modules/labResults/domain/definitions.js'
import * as s from '../src/modules/labResults/service/labResultsService.js'
import type { HasilLabRekam, Konteks, RujukanRekam } from '../src/modules/labResults/service/labResultsService.js'
import { aktorDariPengguna } from '../src/modules/labResults/http/aktor.js'

let t = Date.parse('2026-10-10T08:00:00Z'), n = 0
const waktu = (ms: number) => { t += ms }
const mem = <T extends { id: string }>() => { const m = new Map<string, T>(); return { get: (id: string) => m.get(id), put: (r: T) => { m.set(r.id, structuredClone(r)) }, all: () => [...m.values()].map((x) => structuredClone(x)), raw: m } }
function ctx() { return { hasil: mem<HasilLabRekam>(), rujukan: mem<RujukanRekam>(), now: () => new Date(t), newId: (p: string) => `${p}-${++n}` } satisfies Konteks & Record<string, unknown> }
const T0 = s.TENANT_PRAKTIK
const dok: Actor = { actorId: 'd1', role: 'clinician', tenantId: T0, authorizedClinician: true }
const dokTanpaOtorisasi: Actor = { ...dok, actorId: 'd2', authorizedClinician: false }
const perawat: Actor = { actorId: 'n1', role: 'nurse', tenantId: T0 }
const admin: Actor = { actorId: 'a1', role: 'admin', tenantId: T0 }
const sistem: Actor = { actorId: 'sys', role: 'system', tenantId: T0 }
const pasienA: Actor = { actorId: 'uA', role: 'patient', tenantId: T0, patientIds: ['p-A'] }
const pasienB: Actor = { actorId: 'uB', role: 'patient', tenantId: T0, patientIds: ['p-B'] }
const asing: Actor = { ...dok, actorId: 'dx', tenantId: 'klinik-lain' }
const butir = { name: 'Hemoglobin', value: 13.2, unit: 'g/dL', referenceRange: '12-16', collectedAt: '2026-10-09' }
const ok = <T,>(r: s.Hasil<T>): T => { assert.ok(r.ok, `diharapkan ok, dapat ${JSON.stringify(r)}`); return (r as { ok: true; value: T }).value }
const tolak = (r: s.Hasil<unknown>, reason: string) => { assert.equal(r.ok, false); assert.equal((r as { reason: string }).reason, reason) }

// ── mesin: tepi, peran, otorisasi, waktu, tenant ────────────────────────────
const dasar = { subjectId: 'x', tenantId: T0, current: 'received' as const, target: 'pending_review' as const, actor: perawat, at: '2026-10-10T08:00:00.000Z', trail: [] }
const langkah = transition(resultLifecycle, dasar)
assert.ok(langkah.ok && langkah.entry.seq === 1 && langkah.entry.prevHash === GENESIS_HASH && langkah.entry.hash.length === 64)
assert.equal(transition(resultLifecycle, { ...dasar, target: 'reviewed' as never }).ok, false, 'melompat harus ditolak')
assert.deepEqual(transition(resultLifecycle, { ...dasar, target: 'reviewed' as never }), { ok: false, reason: 'not-allowed-step' })
assert.deepEqual(transition(resultLifecycle, { ...dasar, current: 'closed' as never, target: 'received' as never }), { ok: false, reason: 'not-allowed-step' }, 'mundur')
assert.deepEqual(transition(resultLifecycle, { ...dasar, target: 'nonsens' as never }), { ok: false, reason: 'unknown-status' })
assert.deepEqual(transition(resultLifecycle, { ...dasar, at: 'kemarin' }), { ok: false, reason: 'invalid-timestamp' })
assert.deepEqual(transition(resultLifecycle, { ...dasar, actor: asing }), { ok: false, reason: 'tenant-mismatch' })
// berpasangan: hanya peran yang berbeda
assert.ok(transition(resultLifecycle, { ...dasar, actor: sistem }).ok, 'sistem boleh intake -> pending_review')
assert.deepEqual(transition(resultLifecycle, { ...dasar, actor: pasienA }), { ok: false, reason: 'role-not-permitted' })
const siapTinjau = { ...dasar, current: 'pending_review' as const, target: 'reviewed' as const }
assert.ok(transition(resultLifecycle, { ...siapTinjau, actor: dok }).ok)
assert.deepEqual(transition(resultLifecycle, { ...siapTinjau, actor: dokTanpaOtorisasi }), { ok: false, reason: 'clinician-not-authorized' })
assert.deepEqual(transition(resultLifecycle, { ...siapTinjau, actor: perawat }), { ok: false, reason: 'role-not-permitted' }, 'perawat tidak boleh meninjau')
assert.deepEqual(transition(resultLifecycle, { ...siapTinjau, actor: admin }), { ok: false, reason: 'role-not-permitted' }, 'admin/owner bukan alasan melewati tinjauan klinisi')
assert.deepEqual(transition(resultLifecycle, { ...siapTinjau, actor: sistem }), { ok: false, reason: 'system-cannot-record' })
// batas waktu: sama dengan entri terakhir diterima, 1 ms lebih awal ditolak
const e1 = (langkah as { entry: s.HasilLabRekam['trail'][number] }).entry
const lanjut = { ...dasar, current: 'pending_review' as const, target: 'reviewed' as const, actor: dok, trail: [e1] }
assert.ok(transition(resultLifecycle, { ...lanjut, at: e1.at }).ok)
assert.deepEqual(transition(resultLifecycle, { ...lanjut, at: '2026-10-10T07:59:59.999Z' }), { ok: false, reason: 'time-before-last-entry' })

// ── verifikasi jejak: utuh vs rusak (tiap kerusakan terdeteksi dengan namanya) ──
const e2 = (transition(resultLifecycle, { ...lanjut, at: '2026-10-10T08:01:00.000Z' }) as { entry: typeof e1 }).entry
assert.deepEqual(verifyTrail(resultLifecycle, 'x', []), { ok: true, status: 'received' })
assert.deepEqual(verifyTrail(resultLifecycle, 'x', [e1, e2]), { ok: true, status: 'reviewed' })
const masalah = (trail: unknown[], id = 'x') => { const r = verifyTrail(resultLifecycle, id, trail as never); assert.equal(r.ok, false); return (r as { issues: string[] }).issues }
assert.ok(masalah([e1, { ...e2, actorId: 'penyusup' }]).includes('hash-mismatch'), 'ubah aktor tanpa hitung ulang hash')
assert.ok(masalah([e1, { ...e2, seq: 5 }]).includes('seq-gap'))
assert.ok(masalah([e2]).includes('chain-broken'), 'melewatkan entri pertama')
assert.ok(masalah([e1, e2], 'lain').includes('wrong-subject'))
assert.ok(masalah([e2, e1]).includes('seq-gap'), 'urutan terbalik')
assert.ok(masalah([e1, { ...e2, prevHash: GENESIS_HASH }]).includes('hash-mismatch'), 'rantai hash diputus')
assert.ok(masalah([{ ...e1, to: 'reviewed' }]).includes('step-not-allowed'))
assert.ok(masalah([{ ...e1, to: 'x' }]).includes('unknown-status'))
// pengubahan tidak mengotori hasil sebelum: transition tidak memutasi trail
assert.equal(lanjut.trail.length, 1)

// ── B2: intake (persisten lewat repo) ───────────────────────────────────────
{
  const k = ctx()
  const r = ok(s.terimaHasil(k, perawat, { patientId: 'p-A', item: butir, source: 'manual-entry' }))
  assert.equal(r.status, 'received'); assert.deepEqual(r.trail, []); assert.equal(r.provenance.recordedBy, 'n1')
  assert.deepEqual(k.hasil.get(r.id)?.item, { name: 'Hemoglobin', value: 13.2, unit: 'g/dL', referenceRange: '12-16', collectedAt: '2026-10-09' }, 'tersimpan persis seperti dicatat')
  // negatif berpasangan: hanya satu kondisi berbeda
  for (const [nama, masukan, galat] of [
    ['pasien tidak boleh intake', [pasienA, { patientId: 'p-A', item: butir, source: 'manual-entry' }], 'forbidden'],
    ['sistem tidak boleh intake', [sistem, { patientId: 'p-A', item: butir, source: 'lab-intake' }], 'forbidden'],
    ['tenant asing', [asing, { patientId: 'p-A', item: butir, source: 'manual-entry' }], 'tenant-mismatch'],
    ['tanpa patientId', [perawat, { item: butir, source: 'manual-entry' }], 'invalid-input'],
    ['patientId terlalu panjang', [perawat, { patientId: 'x'.repeat(81), item: butir, source: 'manual-entry' }], 'invalid-input'],
    ['source tak dikenal', [perawat, { patientId: 'p-A', item: butir, source: 'ai-guess' }], 'invalid-input'],
    ['nama kosong', [perawat, { patientId: 'p-A', item: { ...butir, name: '  ' }, source: 'manual-entry' }], 'invalid-input'],
    ['nilai NaN', [perawat, { patientId: 'p-A', item: { ...butir, value: NaN }, source: 'manual-entry' }], 'invalid-input'],
    ['nilai Infinity', [perawat, { patientId: 'p-A', item: { ...butir, value: Infinity }, source: 'manual-entry' }], 'invalid-input'],
    ['nilai string', [perawat, { patientId: 'p-A', item: { ...butir, value: '13' }, source: 'manual-entry' }], 'invalid-input'],
    ['tanpa nilai sama sekali (tidak ditebak)', [perawat, { patientId: 'p-A', item: { name: 'Hb', collectedAt: '2026-10-09' }, source: 'manual-entry' }], 'invalid-input'],
    ['dua nilai sekaligus', [perawat, { patientId: 'p-A', item: { ...butir, valueText: 'normal' }, source: 'manual-entry' }], 'invalid-input'],
    ['tanggal masa depan > 1 hari', [perawat, { patientId: 'p-A', item: { ...butir, collectedAt: '2026-10-12' }, source: 'manual-entry' }], 'invalid-input'],
    ['tanggal sebelum 1900', [perawat, { patientId: 'p-A', item: { ...butir, collectedAt: '1899-12-31' }, source: 'manual-entry' }], 'invalid-input'],
    ['unit kosong', [perawat, { patientId: 'p-A', item: { ...butir, unit: '' }, source: 'manual-entry' }], 'invalid-input'],
    ['item array', [perawat, { patientId: 'p-A', item: [butir], source: 'manual-entry' }], 'invalid-input'],
  ] as const) {
    const sebelum = k.hasil.all().length
    tolak(s.terimaHasil(k, ...(masukan as [Actor, never])), galat)
    assert.equal(k.hasil.all().length, sebelum, `${nama}: tidak boleh ada tulisan`)
  }
  // batas: panjang tepat di batas diterima, +1 ditolak; tanggal besok diterima (toleransi zona waktu)
  ok(s.terimaHasil(k, perawat, { patientId: 'p-A', item: { ...butir, name: 'N'.repeat(s.MAKS_NAMA), collectedAt: '2026-10-11' }, source: 'manual-entry' }))
  tolak(s.terimaHasil(k, perawat, { patientId: 'p-A', item: { ...butir, name: 'N'.repeat(s.MAKS_NAMA + 1) }, source: 'manual-entry' }), 'invalid-input')
  ok(s.terimaHasil(k, perawat, { patientId: 'p-A', item: { name: 'Urin', valueText: 'negatif', collectedAt: '2026-10-09' }, source: 'lab-intake' }))
}

// ── B3+B4+B5: perjalanan penuh, bukti komunikasi, baca tanpa efek samping ────
{
  const k = ctx()
  const id = ok(s.terimaHasil(k, perawat, { patientId: 'p-A', item: butir, source: 'manual-entry' })).id
  // dilihat ≠ selesai
  for (const a of [dok, perawat, admin, pasienA]) { const sebelum = JSON.stringify(k.hasil.get(id)); ok(s.bacaHasil(k, a, id)); assert.equal(JSON.stringify(k.hasil.get(id)), sebelum, `baca oleh ${a.role} mengubah rekam`) }
  tolak(s.majukanHasil(k, dok, id, { to: 'reviewed' }), 'not-allowed-step') // melompat
  waktu(1000); assert.equal(ok(s.majukanHasil(k, sistem, id, { to: 'pending_review' })).status, 'pending_review')
  tolak(s.majukanHasil(k, perawat, id, { to: 'reviewed' }), 'role-not-permitted')
  tolak(s.majukanHasil(k, dokTanpaOtorisasi, id, { to: 'reviewed' }), 'clinician-not-authorized')
  assert.equal(k.hasil.get(id)?.status, 'pending_review', 'penolakan tidak boleh mengubah status')
  assert.equal(k.hasil.get(id)?.trail.length, 1, 'penolakan tidak boleh menambah jejak')
  waktu(1000); assert.equal(ok(s.majukanHasil(k, dok, id, { to: 'reviewed', expectedStatus: 'pending_review' })).status, 'reviewed')
  // komunikasi wajib bukti; sistem/admin/pasien tidak boleh
  tolak(s.majukanHasil(k, dok, id, { to: 'communicated' }), 'evidence-required')
  tolak(s.majukanHasil(k, dok, id, { to: 'communicated', communication: { channel: 'telepati', note: 'ok' } }), 'evidence-required')
  tolak(s.majukanHasil(k, dok, id, { to: 'communicated', communication: { channel: 'phone', note: '   ' } }), 'evidence-required')
  tolak(s.majukanHasil(k, dok, id, { to: 'communicated', communication: { channel: 'phone', note: 'x'.repeat(s.MAKS_CATATAN + 1) } }), 'evidence-required')
  tolak(s.majukanHasil(k, admin, id, { to: 'communicated', communication: { channel: 'phone', note: 'dihubungi' } }), 'role-not-permitted')
  assert.equal(k.hasil.get(id)?.communication, undefined, 'bukti tidak boleh tertulis pada transisi yang ditolak')
  waktu(1000); const kom = ok(s.majukanHasil(k, perawat, id, { to: 'communicated', communication: { channel: 'phone', note: 'Hasil disampaikan ke pasien lewat telepon' } }))
  assert.equal(kom.status, 'communicated'); assert.deepEqual(kom.communication, { channel: 'phone', note: 'Hasil disampaikan ke pasien lewat telepon', at: new Date(t).toISOString(), by: 'n1' })
  tolak(s.majukanHasil(k, sistem, id, { to: 'closed' }), 'system-cannot-record')
  waktu(1000); assert.equal(ok(s.majukanHasil(k, perawat, id, { to: 'closed' })).status, 'closed')
  tolak(s.majukanHasil(k, dok, id, { to: 'closed' }), 'not-allowed-step') // tidak ada langkah setelah closed
  const akhir = k.hasil.get(id)!
  assert.deepEqual(akhir.trail.map((e) => `${e.from}>${e.to}:${e.role}`), ['received>pending_review:system', 'pending_review>reviewed:clinician', 'reviewed>communicated:nurse', 'communicated>closed:nurse'])
  assert.deepEqual(verifyTrail(resultLifecycle, id, akhir.trail), { ok: true, status: 'closed' })
  // stale: expectedStatus tidak cocok
  const k2 = ctx(); const id2 = ok(s.terimaHasil(k2, perawat, { patientId: 'p-A', item: butir, source: 'manual-entry' })).id
  tolak(s.majukanHasil(k2, perawat, id2, { to: 'pending_review', expectedStatus: 'reviewed' }), 'stale-status')
  assert.equal(k2.hasil.get(id2)?.status, 'received')
  assert.equal(ok(s.majukanHasil(k2, perawat, id2, { to: 'pending_review', expectedStatus: 'received' })).status, 'pending_review', 'expectedStatus yang cocok diterima')
}

// ── B5: akses baca — pasien lain, tenant lain, peran lain, 404 tanpa bocor ───
{
  const k = ctx()
  const idA = ok(s.terimaHasil(k, dok, { patientId: 'p-A', item: butir, source: 'manual-entry' })).id
  ok(s.terimaHasil(k, dok, { patientId: 'p-B', item: butir, source: 'manual-entry' }))
  assert.ok(s.bacaHasil(k, pasienA, idA).ok)
  tolak(s.bacaHasil(k, pasienB, idA), 'not-found')
  tolak(s.bacaHasil(k, asing, idA), 'not-found')
  tolak(s.bacaHasil(k, { ...pasienA, tenantId: 'klinik-lain' }, idA), 'not-found')
  tolak(s.bacaHasil(k, sistem, idA), 'not-found')
  tolak(s.bacaHasil(k, { ...pasienA, patientIds: undefined }, idA), 'not-found', )
  tolak(s.bacaHasil(k, dok, 'tidak-ada'), 'not-found')
  assert.deepEqual(s.daftarHasil(k, pasienA).map((r) => r.patientId), ['p-A'], 'pasien hanya melihat miliknya')
  assert.equal(s.daftarHasil(k, dok).length, 2)
  assert.equal(s.daftarHasil(k, dok, 'p-B').length, 1)
  assert.equal(s.daftarHasil(k, sistem).length, 0); assert.equal(s.daftarHasil(k, asing).length, 0)
  tolak(s.majukanHasil(k, pasienB, idA, { to: 'pending_review' }), 'not-found')
  tolak(s.majukanHasil(k, asing, idA, { to: 'pending_review' }), 'not-found')
}

// ── jejak rusak di penyimpanan => fail closed ───────────────────────────────
{
  const k = ctx(); const id = ok(s.terimaHasil(k, perawat, { patientId: 'p-A', item: butir, source: 'manual-entry' })).id
  waktu(1000); ok(s.majukanHasil(k, perawat, id, { to: 'pending_review' }))
  const rusak = structuredClone(k.hasil.get(id)!); rusak.trail[0]!.actorId = 'penyusup'; k.hasil.put(rusak)
  tolak(s.majukanHasil(k, dok, id, { to: 'reviewed' }), 'trail-corrupt')
  const palsu = structuredClone(k.hasil.get(id)!); palsu.status = 'closed'; k.hasil.put(palsu)
  tolak(s.majukanHasil(k, dok, id, { to: 'closed' }), 'trail-corrupt') // status tidak sesuai jejak
}

// ── B9: metrik dari backend ─────────────────────────────────────────────────
{
  const k = ctx()
  tolak(s.metrikPenutupan(k, pasienA), 'forbidden'); tolak(s.metrikPenutupan(k, sistem), 'forbidden'); tolak(s.metrikPenutupan(k, asing), 'forbidden')
  const kosong = ok(s.metrikPenutupan(k, dok))
  assert.equal(kosong.total, 0); assert.equal(kosong.closureRate, null, 'penyebut nol = tidak diukur, bukan 0%'); assert.equal(kosong.oldestOpenHours, null); assert.equal(kosong.overdue, null)
  const a = ok(s.terimaHasil(k, perawat, { patientId: 'p-A', item: butir, source: 'manual-entry' })).id
  const b = ok(s.terimaHasil(k, perawat, { patientId: 'p-B', item: butir, source: 'manual-entry' })).id
  waktu(1000); for (const [to, who, extra] of [['pending_review', sistem, {}], ['reviewed', dok, {}], ['communicated', dok, { communication: { channel: 'in-person', note: 'ok' } }], ['closed', dok, {}]] as const) { waktu(1000); ok(s.majukanHasil(k, who, a, { to, ...extra })) }
  waktu(3 * 3.6e6) // 3 jam berlalu; b masih received
  const m = ok(s.metrikPenutupan(k, dok, { dueHours: 2 }))
  assert.equal(m.total, 2); assert.equal(m.closed, 1); assert.equal(m.closureRate, 0.5); assert.equal(m.byStatus.received, 1); assert.equal(m.overdue, 1); assert.ok(m.oldestOpenHours! > 3 && m.oldestOpenHours! < 3.01)
  assert.equal(ok(s.metrikPenutupan(k, dok, { dueHours: 4 })).overdue, 0, 'batas: umur 3 jam tidak melewati ambang 4 jam')
  assert.equal(ok(s.metrikPenutupan(k, dok)).overdue, null, 'tanpa ambang dari pemanggil, overdue tidak dikarang')
  tolak(s.metrikPenutupan(k, dok, { dueHours: 0 }), 'invalid-input'); tolak(s.metrikPenutupan(k, dok, { dueHours: NaN }), 'invalid-input'); tolak(s.metrikPenutupan(k, dok, { dueHours: -1 }), 'invalid-input')
  const r = structuredClone(k.hasil.get(b)!); r.trail = [{ ...(k.hasil.get(a)!.trail[0]!) }]; k.hasil.put(r) // jejak palsu
  const m2 = ok(s.metrikPenutupan(k, dok)); assert.equal(m2.corrupt, 1, 'rekam rusak dilaporkan terpisah'); assert.equal(m2.total, 1)
}

// ── B6: siklus rujukan terpisah ─────────────────────────────────────────────
{
  const k = ctx()
  tolak(s.buatRujukan(k, perawat, { patientId: 'p-A', kind: 'lab', reason: 'cek', toFacility: 'Lab X' }), 'forbidden')
  tolak(s.buatRujukan(k, dokTanpaOtorisasi, { patientId: 'p-A', kind: 'lab', reason: 'cek', toFacility: 'Lab X' }), 'forbidden')
  tolak(s.buatRujukan(k, dok, { patientId: 'p-A', kind: 'telepati', reason: 'cek', toFacility: 'Lab X' }), 'invalid-input')
  tolak(s.buatRujukan(k, dok, { patientId: 'p-A', kind: 'lab', reason: '', toFacility: 'Lab X' }), 'invalid-input')
  assert.equal(k.rujukan.all().length, 0, 'penolakan tidak menulis')
  const ref = ok(s.buatRujukan(k, dok, { patientId: 'p-A', kind: 'lab', reason: 'Pemeriksaan lanjutan', toFacility: 'Lab X' }))
  assert.equal(ref.status, 'requested')
  const go = (a: Actor, to: string, extra: object = {}) => s.majukanRujukan(k, a, ref.id, { to, ...extra })
  tolak(go(dok, 'completed'), 'not-allowed-step')
  tolak(go(perawat, 'accepted'), 'role-not-permitted')
  waktu(1000); assert.equal(ok(go(admin, 'accepted')).status, 'accepted')
  waktu(1000); assert.equal(ok(go(perawat, 'scheduled')).status, 'scheduled')
  tolak(go(perawat, 'completed'), 'role-not-permitted'); tolak(go(dokTanpaOtorisasi, 'completed'), 'clinician-not-authorized')
  waktu(1000); assert.equal(ok(go(dok, 'completed')).status, 'completed')
  // hasil kembali harus bukti nyata
  tolak(go(dok, 'result_returned'), 'evidence-required')
  tolak(go(dok, 'result_returned', { resultId: 'lab-tidak-ada' }), 'linked-result-invalid')
  tolak(go(dok, 'result_returned', { returnNote: 'catatan' }), 'evidence-required') // rujukan lab: catatan saja tidak cukup
  const hB = ok(s.terimaHasil(k, dok, { patientId: 'p-B', item: butir, source: 'lab-intake' })).id
  tolak(go(dok, 'result_returned', { resultId: hB }), 'linked-result-invalid') // pasien lain
  const asingId = ok(s.terimaHasil(k, dok, { patientId: 'p-A', item: butir, source: 'lab-intake' })).id
  const dariTenantLain = { ...structuredClone(k.hasil.get(asingId)!), id: 'lab-tenant-lain', tenantId: 'klinik-lain' }; k.hasil.put(dariTenantLain)
  tolak(go(dok, 'result_returned', { resultId: 'lab-tenant-lain' }), 'linked-result-invalid') // pasien sama, tenant beda
  const hA = ok(s.terimaHasil(k, dok, { patientId: 'p-A', item: butir, source: 'lab-intake' })).id
  waktu(1000); const kembali = ok(go(dok, 'result_returned', { resultId: hA }))
  assert.equal(kembali.status, 'result_returned'); assert.equal(kembali.resultId, hA)
  // penutupan terverifikasi: hasil terkait harus sudah closed
  tolak(go(dok, 'closed'), 'linked-result-invalid')
  assert.equal(k.rujukan.get(ref.id)?.status, 'result_returned')
  for (const [to, who, extra] of [['pending_review', sistem, {}], ['reviewed', dok, {}], ['communicated', dok, { communication: { channel: 'in-person', note: 'ok' } }], ['closed', dok, {}]] as const) { waktu(1000); ok(s.majukanHasil(k, who, hA, { to, ...extra })) }
  waktu(1000); assert.equal(ok(go(dok, 'closed')).status, 'closed')
  const akhir = k.rujukan.get(ref.id)!
  assert.deepEqual(verifyTrail(referralLifecycle, ref.id, akhir.trail), { ok: true, status: 'closed' })
  tolak(go(dok, 'cancelled', { closeReason: 'x' }), 'not-allowed-step')
  // cabang: tolak/batal wajib alasan; non-lab boleh kembali dengan catatan
  const r2 = ok(s.buatRujukan(k, dok, { patientId: 'p-A', kind: 'specialist', reason: 'konsul', toFacility: 'Poli Y' }))
  tolak(s.majukanRujukan(k, admin, r2.id, { to: 'declined' }), 'evidence-required')
  assert.equal(ok(s.majukanRujukan(k, admin, r2.id, { to: 'declined', closeReason: 'Kuota penuh' })).closeReason, 'Kuota penuh')
  tolak(s.majukanRujukan(k, dok, r2.id, { to: 'accepted' }), 'not-allowed-step') // declined terminal
  const r3 = ok(s.buatRujukan(k, dok, { patientId: 'p-A', kind: 'specialist', reason: 'konsul', toFacility: 'Poli Y' }))
  for (const [to, who] of [['accepted', dok], ['scheduled', dok], ['completed', dok]] as const) { waktu(1000); ok(s.majukanRujukan(k, who, r3.id, { to })) }
  waktu(1000); assert.equal(ok(s.majukanRujukan(k, dok, r3.id, { to: 'result_returned', returnNote: 'Balasan konsul diterima' })).returnNote, 'Balasan konsul diterima')
  waktu(1000); assert.equal(ok(s.majukanRujukan(k, dok, r3.id, { to: 'closed' })).status, 'closed')
  // akses
  tolak(s.bacaRujukan(k, pasienB, ref.id), 'not-found'); assert.ok(s.bacaRujukan(k, pasienA, ref.id).ok)
  assert.equal(s.daftarRujukan(k, pasienA).length, 3); assert.equal(s.daftarRujukan(k, pasienB).length, 0)
  tolak(s.majukanRujukan(k, pasienA, r3.id, { to: 'cancelled', closeReason: 'x' }), 'not-allowed-step') // closed terminal
  const r4 = ok(s.buatRujukan(k, dok, { patientId: 'p-A', kind: 'imaging', reason: 'foto', toFacility: 'Radiologi' }))
  tolak(s.majukanRujukan(k, pasienA, r4.id, { to: 'cancelled', closeReason: 'ingin batal' }), 'role-not-permitted') // pasien tak berhak membatalkan
  tolak(s.majukanRujukan(k, pasienB, r4.id, { to: 'cancelled', closeReason: 'x' }), 'not-found')
  assert.equal(k.rujukan.get(r4.id)?.status, 'requested')
}

// ── pemetaan pengguna -> aktor (fail closed, owner bukan klinisi) ───────────
{
  const dep = { isOwner: (u: { id: string; role: string }) => u.id === 'own' || u.role === 'owner', idPasienDiri: (id: string) => `self-u-${id}`, pasienTertaut: (id: string) => (id === 'u9' ? ['p-clinic-7'] : []) }
  assert.deepEqual(aktorDariPengguna({ id: 'd1', role: 'dokter' }, dep), { actorId: 'd1', tenantId: T0, role: 'clinician', authorizedClinician: true })
  assert.equal(aktorDariPengguna({ id: 'own', role: 'pasien' }, dep)?.role, 'admin', 'owner dipetakan ke admin, bukan klinisi')
  assert.equal(aktorDariPengguna({ id: 'x', role: 'owner' }, dep)?.role, 'admin')
  assert.equal(aktorDariPengguna({ id: 'x', role: 'admin' }, dep)?.authorizedClinician, undefined)
  assert.deepEqual(aktorDariPengguna({ id: 'u9', role: 'pasien' }, dep)?.patientIds, ['self-u-u9', 'p-clinic-7'])
  assert.equal(aktorDariPengguna({ id: 'k', role: 'kontributor' }, dep), null); assert.equal(aktorDariPengguna({ id: 'v', role: 'verifikator' }, dep), null); assert.equal(aktorDariPengguna({ id: 'z', role: '' }, dep), null)
  assert.equal(aktorDariPengguna({ id: 'own', role: 'dokter' }, dep)?.role, 'clinician', 'dokter yang kebetulan owner tetap klinisi')
}

// determinisme: dua kali jalan menghasilkan hash identik
{
  const jalan = () => { const k = ctx(); n = 0; t = Date.parse('2026-10-10T08:00:00Z'); const id = ok(s.terimaHasil(k, perawat, { patientId: 'p-A', item: butir, source: 'manual-entry' })).id; waktu(1000); ok(s.majukanHasil(k, perawat, id, { to: 'pending_review' })); return k.hasil.get(id)!.trail[0]!.hash }
  assert.equal(jalan(), jalan())
}
console.log('hasilLab.uji: ok')
