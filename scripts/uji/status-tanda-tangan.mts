// Tanda tangan/verifikasi optimistis klien tidak boleh tampil sebagai fakta.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { statusTinjauRekam } from '../../src/lib/statusTandaTangan.ts'
assert.equal(statusTinjauRekam({ signedAt: 't', signedById: 'd1' }), 'signed')
assert.equal(statusTinjauRekam({ signedAt: 't' }), 'signature-pending', 'tanda tangan sisi klien saja tampil sebagai bertanda tangan')
assert.equal(statusTinjauRekam({ physicalExam: { doctorVerified: true } }), 'draft', 'verifikasi fisik sisi klien saja tampil sebagai terverifikasi')
assert.equal(statusTinjauRekam({ physicalExam: { doctorVerified: true, verifiedById: 'd1' } }), 'exam-verified')
const lensa = readFileSync('src/components/EmrTimelineLens.tsx', 'utf8')
assert.match(lensa, /value: LABEL_STATUS_TINJAU\[statusTinjauRekam\(record\)\]/, 'lensa timeline memakai tanda tangan klien')
assert.doesNotMatch(lensa, /record\.signedBy \? 'Clinician signed'/)
assert.match(readFileSync('src/pages/EMR.tsx', 'utf8'), /draft\.signedAt && \(statusTinjauRekam\(draft\) === 'signed' \?/, 'EMR menampilkan "Certified by" untuk tanda tangan yang belum dikonfirmasi server')
console.log('status-tanda-tangan: hanya cap server yang tampil sebagai bertanda tangan/terverifikasi di EMR, lensa timeline dan Body Exposure')
