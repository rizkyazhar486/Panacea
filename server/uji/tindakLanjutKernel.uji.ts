// A7: kernel tindak lanjut — positif, negatif (berpasangan), batas. Murni: jam diinjeksikan.
import assert from 'node:assert/strict'
import { susunRencana, signCarePlan, susunTindakLanjut, MAKS_HARI_KE_DEPAN_TINDAK_LANJUT } from '../src/domains/clinical-records/carePlan.js'

const kini = new Date('2026-10-16T08:00:00Z')
const draft = susunRencana({ diagnosisRefs: [{ code: 'I10', display: 'Hypertension' }], questions: [{ id: 'a', prompt: 'Dizzy?', kind: 'boolean' }] }, 'p1', 'd1', kini)
const signed = signCarePlan(draft, 'd1', kini)
const ok = { dueDate: '2026-10-30', reason: 'Review home BP log' }

const f = susunTindakLanjut(signed, { ...ok, clientId: 'client-abc123' }, 'fu-1', kini)
assert.deepEqual(f, { id: 'fu-1', planId: signed.id, subjectId: 'p1', ownerClinicianId: 'd1', dueDate: '2026-10-30', reason: 'Review home BP log', status: 'scheduled', createdAt: kini.toISOString(), clientId: 'client-abc123' })
assert.deepEqual(susunTindakLanjut(signed, ok, 'fu-1', kini), susunTindakLanjut(signed, ok, 'fu-1', kini), 'deterministik')
assert.equal('clientId' in susunTindakLanjut(signed, ok, 'fu-2', kini), false)

// negatif: rencana tak bertanda tangan ditolak; pasangan yang sama (bertanda tangan) diterima di atas
assert.throws(() => susunTindakLanjut(draft, ok, 'x', kini), /signed care plan/)
// negatif: rencana diubah setelah ditandatangani (hash tidak cocok)
assert.throws(() => susunTindakLanjut({ ...signed, monitoredMetrics: ['hacked'] }, ok, 'x', kini), /signed care plan/)

// batas tanggal: hari ini diterima, kemarin ditolak; 365 hari diterima, 366 ditolak
assert.equal(susunTindakLanjut(signed, { ...ok, dueDate: '2026-10-16' }, 'x', kini).dueDate, '2026-10-16')
assert.throws(() => susunTindakLanjut(signed, { ...ok, dueDate: '2026-10-15' }, 'x', kini), /past/)
assert.equal(MAKS_HARI_KE_DEPAN_TINDAK_LANJUT, 365)
assert.equal(susunTindakLanjut(signed, { ...ok, dueDate: '2027-10-16' }, 'x', kini).dueDate, '2027-10-16')
assert.throws(() => susunTindakLanjut(signed, { ...ok, dueDate: '2027-10-17' }, 'x', kini), /ahead/)

// negatif: tanggal tidak nyata / salah bentuk / bukan string
for (const dueDate of ['2026-02-30', '2026-13-01', '30-10-2026', '', 20261030, null, undefined]) {
  assert.throws(() => susunTindakLanjut(signed, { ...ok, dueDate }, 'x', kini), /dueDate/, String(dueDate))
}
// alasan: batas 3 dan 300 (dipangkas spasi), di luar batas ditolak
assert.equal(susunTindakLanjut(signed, { ...ok, reason: '  abc  ' }, 'x', kini).reason, 'abc')
assert.equal(susunTindakLanjut(signed, { ...ok, reason: 'a'.repeat(300) }, 'x', kini).reason.length, 300)
for (const reason of ['ab', '   ', 'a'.repeat(301), 5, undefined]) assert.throws(() => susunTindakLanjut(signed, { ...ok, reason }, 'x', kini), /reason/)
// clientId buruk ditolak; masukan bukan objek ditolak
assert.throws(() => susunTindakLanjut(signed, { ...ok, clientId: 'x y' }, 'x', kini), /client id/)
assert.throws(() => susunTindakLanjut(signed, 'oops', 'x', kini), /dueDate/)
assert.throws(() => susunTindakLanjut(signed, ok, 'x', new Date(NaN)), /clock/)
console.log('tindakLanjutKernel OK')
